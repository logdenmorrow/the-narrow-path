begin;

alter table public.announcements
  drop constraint if exists announcements_category_check;

alter table public.announcements
  add constraint announcements_category_check
  check (
    category in (
      'general',
      'season',
      'reminder',
      'feature',
      'maintenance',
      'reflection',
      'recap'
    )
  );

commit;
