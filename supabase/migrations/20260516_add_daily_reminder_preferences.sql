begin;

create table if not exists public.notification_reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  local_time time,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_reminder_preferences_timezone_not_blank check (
    timezone is null or length(trim(timezone)) > 0
  ),
  constraint notification_reminder_preferences_timezone_length check (
    timezone is null or char_length(timezone) <= 100
  ),
  constraint notification_reminder_preferences_enabled_requires_schedule check (
    enabled = false or (local_time is not null and timezone is not null)
  )
);

create index if not exists notification_reminder_preferences_enabled_idx
  on public.notification_reminder_preferences (timezone, local_time)
  where enabled = true;

create or replace function public.set_notification_reminder_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_reminder_preferences_updated_at
  on public.notification_reminder_preferences;
create trigger set_notification_reminder_preferences_updated_at
before update on public.notification_reminder_preferences
for each row
execute function public.set_notification_reminder_preferences_updated_at();

create table if not exists public.notification_reminder_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_date date not null,
  timezone text not null check (
    length(trim(timezone)) > 0
    and char_length(timezone) <= 100
  ),
  local_time time not null,
  status text not null default 'pending' check (
    status in ('pending', 'sending', 'sent', 'failed', 'skipped')
  ),
  broadcast_id uuid references public.notification_broadcasts (id) on delete set null,
  attempted_count integer not null default 0 check (attempted_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  revoked_count integer not null default 0 check (revoked_count >= 0),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_reminder_sends_user_date_key unique (user_id, reminder_date)
);

create index if not exists notification_reminder_sends_user_id_idx
  on public.notification_reminder_sends (user_id);

create index if not exists notification_reminder_sends_reminder_date_status_idx
  on public.notification_reminder_sends (reminder_date, status);

create index if not exists notification_reminder_sends_broadcast_id_idx
  on public.notification_reminder_sends (broadcast_id);

create or replace function public.set_notification_reminder_sends_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_reminder_sends_updated_at
  on public.notification_reminder_sends;
create trigger set_notification_reminder_sends_updated_at
before update on public.notification_reminder_sends
for each row
execute function public.set_notification_reminder_sends_updated_at();

alter table public.notification_broadcasts
  drop constraint if exists notification_broadcasts_audience_check;

alter table public.notification_broadcasts
  add constraint notification_broadcasts_audience_check
  check (audience in ('all_active', 'admin_test', 'daily_reminder'));

alter table public.notification_reminder_preferences enable row level security;
alter table public.notification_reminder_sends enable row level security;

revoke all on table public.notification_reminder_preferences from anon;
revoke all on table public.notification_reminder_sends from anon;

revoke all on table public.notification_reminder_preferences from authenticated;
revoke all on table public.notification_reminder_sends from authenticated;

grant select, insert, update, delete on table public.notification_reminder_preferences
  to authenticated;
grant select on table public.notification_reminder_sends
  to authenticated;

grant select, insert, update, delete on table public.notification_reminder_preferences
  to service_role;
grant select, insert, update, delete on table public.notification_reminder_sends
  to service_role;

drop policy if exists "Users can read own reminder preferences"
  on public.notification_reminder_preferences;
create policy "Users can read own reminder preferences"
  on public.notification_reminder_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reminder preferences"
  on public.notification_reminder_preferences;
create policy "Users can insert own reminder preferences"
  on public.notification_reminder_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reminder preferences"
  on public.notification_reminder_preferences;
create policy "Users can update own reminder preferences"
  on public.notification_reminder_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reminder preferences"
  on public.notification_reminder_preferences;
create policy "Users can delete own reminder preferences"
  on public.notification_reminder_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage reminder preferences"
  on public.notification_reminder_preferences;
create policy "Admins can manage reminder preferences"
  on public.notification_reminder_preferences
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Users can read own reminder sends"
  on public.notification_reminder_sends;
create policy "Users can read own reminder sends"
  on public.notification_reminder_sends
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage reminder sends"
  on public.notification_reminder_sends;
create policy "Admins can manage reminder sends"
  on public.notification_reminder_sends
  for all
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

commit;
