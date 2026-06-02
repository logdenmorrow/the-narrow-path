begin;

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
      'reminder:night_prayer',
      'announcement:all',
      'announcement:brotherhood',
      'announcement:sisterhood'
    )
  );

commit;
