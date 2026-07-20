begin;

-- Liturgy of the Hours phase 1: structural only. No new prayer content is
-- imported here. Compline content already in night_prayers is backfilled to
-- hour = 'compline' and stays exactly where it is.

-- 1. New shared, optional task_template for the unified Liturgy of the Hours
--    task. The existing 'night-prayer' task_template is left untouched (not
--    deleted, not modified) so historical user_task_completions rows keep a
--    valid foreign key and their meaning.
insert into public.task_templates (
  slug,
  title,
  description,
  cadence,
  weekly_target,
  sort_order,
  audience
)
values (
  'liturgy-of-the-hours',
  'Liturgy of the Hours',
  'Pray an Hour of the Liturgy of the Hours: Morning Prayer, Evening Prayer, or Night Prayer (Compline).',
  'daily',
  null,
  120,
  'shared'
)
on conflict (slug) do nothing;

-- 2. Add the hour column to night_prayers. Default + backfill both target
--    'compline' since that is the only Hour with content today.
alter table public.night_prayers
  add column if not exists hour text
    not null default 'compline'
    check (hour in ('lauds', 'vespers', 'compline'));

update public.night_prayers
set hour = 'compline'
where hour is null or hour = 'compline';

-- 3. Replace the single-column unique constraint on prayer_date with a
--    composite (prayer_date, hour) constraint. The original constraint
--    (created inline in 20260512094000_add_night_prayer_phase1.sql as
--    `prayer_date date not null unique`, which Postgres named
--    night_prayers_prayer_date_key) would otherwise make it impossible to
--    ever store more than one Hour per date -- the exact thing this column
--    exists to allow once Lauds/Vespers content is added in a later phase.
--
--    NOTE: scripts/import-night-prayer.mjs currently upserts with
--    `onConflict: "prayer_date"`. That target constraint no longer exists
--    after this migration; the script will need onConflict: "prayer_date,hour"
--    before the next Night Prayer import run. Not changed here -- content
--    scripts are out of scope for this structural migration.
alter table public.night_prayers
  drop constraint if exists night_prayers_prayer_date_key;

alter table public.night_prayers
  add constraint night_prayers_prayer_date_hour_key unique (prayer_date, hour);

commit;
