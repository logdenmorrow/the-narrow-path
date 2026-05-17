begin;

do $$
begin
  if to_regclass('public.notification_reminder_preferences') is not null then
    update public.notification_reminder_preferences
    set enabled = false
    where enabled = true;

    comment on table public.notification_reminder_preferences is
      'Legacy daily reminder preferences. Active reminder sends are driven by public.notification_reminder_slots.';
  end if;
end;
$$;

commit;
