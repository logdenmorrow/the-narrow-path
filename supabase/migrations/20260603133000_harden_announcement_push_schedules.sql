begin;

alter table public.announcement_push_schedules
drop constraint if exists announcement_push_schedules_status_check;

alter table public.announcement_push_schedules
add constraint announcement_push_schedules_status_check
check (status in ('pending', 'sending', 'sent', 'failed', 'skipped', 'canceled'));

create unique index if not exists announcement_push_schedules_one_pending_per_announcement_idx
  on public.announcement_push_schedules (announcement_id)
  where status = 'pending';

commit;
