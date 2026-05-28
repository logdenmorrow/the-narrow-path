begin;

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_at_idx
  on public.profiles (last_active_at desc);

create or replace function public.touch_last_active_at()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
begin
  if authenticated_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set last_active_at = now()
  where id = authenticated_user_id
    and (
      last_active_at is null
      or last_active_at < now() - interval '5 minutes'
    );
end;
$$;

revoke all on function public.touch_last_active_at() from public;
grant execute on function public.touch_last_active_at() to authenticated;

commit;
