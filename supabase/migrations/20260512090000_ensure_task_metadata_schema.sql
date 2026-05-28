begin;

-- Schema safety for generated task metadata. Production already has these
-- columns, but fresh migration replay should not fail before the Rosary
-- metadata migration runs.
alter table public.task_templates
  add column if not exists sort_order integer,
  add column if not exists monthly_target integer,
  add column if not exists optional_other_days boolean default false,
  add column if not exists required_weekdays integer[],
  add column if not exists requirement_model text,
  add column if not exists rotation_anchor_date date,
  add column if not exists rotation_anchor_weekday smallint,
  add column if not exists show_only_last_week_of_month boolean default false,
  add column if not exists special_required_dates date[];

alter table public.plan_day_tasks
  add column if not exists day_date date,
  add column if not exists week_start_date date,
  add column if not exists month_start_date date,
  add column if not exists is_optional boolean default false,
  add column if not exists quota_scope text,
  add column if not exists quota_target integer,
  add column if not exists requirement_note text,
  add column if not exists display_order integer;

commit;
