begin;

create table if not exists public.notification_reminder_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_type text not null check (
    reminder_type in ('morning_scripture', 'night_prayer')
  ),
  enabled boolean not null default false,
  local_time time not null,
  timezone text not null check (
    length(trim(timezone)) > 0
    and char_length(timezone) <= 100
  ),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_reminder_slots_user_type_key
    unique (user_id, reminder_type)
);

create index if not exists notification_reminder_slots_enabled_idx
  on public.notification_reminder_slots (timezone, local_time)
  where enabled = true;

create index if not exists notification_reminder_slots_user_id_sort_order_idx
  on public.notification_reminder_slots (user_id, sort_order);

create or replace function public.set_notification_reminder_slots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_reminder_slots_updated_at
  on public.notification_reminder_slots;
create trigger set_notification_reminder_slots_updated_at
before update on public.notification_reminder_slots
for each row
execute function public.set_notification_reminder_slots_updated_at();

alter table public.notification_reminder_sends
  add column if not exists reminder_slot_id uuid;

alter table public.notification_reminder_sends
  add column if not exists reminder_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_reminder_sends_reminder_slot_id_fkey'
      and conrelid = 'public.notification_reminder_sends'::regclass
  ) then
    alter table public.notification_reminder_sends
      add constraint notification_reminder_sends_reminder_slot_id_fkey
      foreign key (reminder_slot_id)
      references public.notification_reminder_slots (id)
      on delete set null;
  end if;
end;
$$;

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_reminder_type_check;

alter table public.notification_reminder_sends
  add constraint notification_reminder_sends_reminder_type_check
  check (
    reminder_type is null
    or reminder_type in ('morning_scripture', 'night_prayer')
  );

create index if not exists notification_reminder_sends_reminder_slot_id_idx
  on public.notification_reminder_sends (reminder_slot_id);

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_user_date_key;

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_user_date_time_key;

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_user_type_date_time_key;

alter table public.notification_reminder_sends
  add constraint notification_reminder_sends_user_type_date_time_key
  unique (user_id, reminder_type, reminder_date, local_time);

alter table public.notification_broadcasts
  drop constraint if exists notification_broadcasts_audience_check;

alter table public.notification_broadcasts
  add constraint notification_broadcasts_audience_check
  check (
    audience in (
      'all_active',
      'admin_test',
      'daily_reminder',
      'reminder:morning_scripture',
      'reminder:night_prayer'
    )
  );

do $$
begin
  if to_regclass('public.notification_reminder_preferences') is not null then
    insert into public.notification_reminder_slots (
      user_id,
      reminder_type,
      enabled,
      local_time,
      timezone,
      sort_order
    )
    select
      preference.user_id,
      'morning_scripture',
      true,
      preference.local_time,
      preference.timezone,
      0
    from public.notification_reminder_preferences preference
    where preference.enabled = true
      and preference.local_time is not null
      and preference.timezone is not null
    on conflict (user_id, reminder_type) do nothing;

    insert into public.notification_reminder_slots (
      user_id,
      reminder_type,
      enabled,
      local_time,
      timezone,
      sort_order
    )
    select
      preference.user_id,
      'night_prayer',
      false,
      time '21:30',
      preference.timezone,
      1
    from public.notification_reminder_preferences preference
    where preference.enabled = true
      and preference.timezone is not null
    on conflict (user_id, reminder_type) do nothing;
  end if;
end;
$$;

alter table public.notification_reminder_slots enable row level security;

revoke all on table public.notification_reminder_slots from anon;
revoke all on table public.notification_reminder_slots from authenticated;

grant select, insert, update, delete on table public.notification_reminder_slots
  to authenticated;

grant select, insert, update, delete on table public.notification_reminder_slots
  to service_role;

drop policy if exists "Users can read own reminder slots"
  on public.notification_reminder_slots;
create policy "Users can read own reminder slots"
  on public.notification_reminder_slots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reminder slots"
  on public.notification_reminder_slots;
create policy "Users can insert own reminder slots"
  on public.notification_reminder_slots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reminder slots"
  on public.notification_reminder_slots;
create policy "Users can update own reminder slots"
  on public.notification_reminder_slots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reminder slots"
  on public.notification_reminder_slots;
create policy "Users can delete own reminder slots"
  on public.notification_reminder_slots
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
