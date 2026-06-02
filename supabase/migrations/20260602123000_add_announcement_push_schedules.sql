begin;

create table if not exists public.announcement_push_schedules (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'sending', 'sent', 'failed', 'canceled')
  ),
  broadcast_id uuid references public.notification_broadcasts (id) on delete set null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  attempted_count integer not null default 0 check (attempted_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  revoked_count integer not null default 0 check (revoked_count >= 0),
  error_message text
);

create index if not exists announcement_push_schedules_due_idx
  on public.announcement_push_schedules (status, scheduled_for);

create index if not exists announcement_push_schedules_announcement_id_idx
  on public.announcement_push_schedules (announcement_id);

create or replace function public.set_announcement_push_schedules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_announcement_push_schedules_updated_at
  on public.announcement_push_schedules;
create trigger set_announcement_push_schedules_updated_at
before update on public.announcement_push_schedules
for each row
execute function public.set_announcement_push_schedules_updated_at();

alter table public.announcement_push_schedules enable row level security;

revoke all on table public.announcement_push_schedules from anon;
revoke all on table public.announcement_push_schedules from authenticated;

grant select, insert, update, delete on table public.announcement_push_schedules
  to authenticated;

grant select, insert, update, delete on table public.announcement_push_schedules
  to service_role;

drop policy if exists "Admins can manage announcement push schedules"
  on public.announcement_push_schedules;
create policy "Admins can manage announcement push schedules"
  on public.announcement_push_schedules
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

commit;
