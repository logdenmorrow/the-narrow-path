begin;

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_user_date_key;

alter table public.notification_reminder_sends
  drop constraint if exists notification_reminder_sends_user_date_time_key;

alter table public.notification_reminder_sends
  add constraint notification_reminder_sends_user_date_time_key
  unique (user_id, reminder_date, local_time);

commit;
