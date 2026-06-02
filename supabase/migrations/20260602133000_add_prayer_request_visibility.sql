begin;

alter table public.user_prayer_requests
  add column if not exists visibility text;

update public.user_prayer_requests
set visibility = 'track'
where visibility is null;

do $$
begin
  alter table public.user_prayer_requests
    add constraint user_prayer_requests_visibility_check
    check (visibility in ('track', 'shared'));
exception
  when duplicate_object then null;
end $$;

alter table public.user_prayer_requests
  alter column visibility set default 'track';

alter table public.user_prayer_requests
  alter column visibility set not null;

create index if not exists user_prayer_requests_visibility_date_idx
  on public.user_prayer_requests (visibility, request_date);

drop policy if exists "Signed-in users can read same-track visible prayer requests"
  on public.user_prayer_requests;
drop policy if exists "Signed-in users can read visible prayer requests"
  on public.user_prayer_requests;
create policy "Signed-in users can read visible prayer requests"
  on public.user_prayer_requests
  for select
  using (
    auth.uid() = user_id
    or public.is_app_admin()
    or exists (
      select 1
      from public.profiles as viewer
      join public.profiles as subject
        on subject.id = user_prayer_requests.user_id
      where viewer.id = auth.uid()
        and viewer.is_hidden_from_community = false
        and subject.is_hidden_from_community = false
        and (
          user_prayer_requests.visibility = 'shared'
          or viewer.track = subject.track
        )
    )
  );

commit;
