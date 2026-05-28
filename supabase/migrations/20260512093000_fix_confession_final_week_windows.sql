begin;

-- Confession belongs to the full Monday-Sunday block containing the last day
-- of each month, even when that block crosses into the next month. Existing
-- plan_day_tasks rows are updated in place so user_task_completions keep their
-- existing plan_day_task_id references.

update public.task_templates
set
  title = coalesce(nullif(title, ''), 'Confession'),
  description = 'Required once during the final Monday-Sunday Confession week that contains the last day of each month. Optional each day in that window.',
  cadence = 'monthly_quota',
  weekly_target = null,
  monthly_target = 1,
  sort_order = coalesce(sort_order, 130),
  show_only_last_week_of_month = true,
  audience = 'shared'
where slug = 'confession';

with plan_bounds as (
  select
    id as plan_id,
    total_days,
    date '2026-04-06' as start_date,
    (date '2026-04-06' + ((total_days - 1) * interval '1 day'))::date as end_date
  from public.challenge_plans
  where total_days > 0
),
month_windows as (
  select
    pb.plan_id,
    pb.end_date,
    month_start::date as month_start,
    (month_start::date + interval '1 month - 1 day')::date as month_end_date,
    (
      (month_start::date + interval '1 month - 1 day')::date
      - ((extract(isodow from (month_start::date + interval '1 month - 1 day')::date)::int - 1) * interval '1 day')
    )::date as window_start_date
  from plan_bounds pb
  cross join lateral generate_series(
    date_trunc('month', pb.start_date)::date,
    date_trunc('month', pb.end_date)::date,
    interval '1 month'
  ) as months(month_start)
),
confession_template as (
  select
    id,
    description as requirement_note,
    coalesce(sort_order, 130) as display_order
  from public.task_templates
  where slug = 'confession'
),
confession_days as (
  select
    pd.id as plan_day_id,
    ct.id as task_template_id,
    (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date as day_date,
    mw.window_start_date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    ct.requirement_note,
    ct.display_order
  from public.plan_days pd
  join month_windows mw
    on mw.plan_id = pd.plan_id
  cross join confession_template ct
  where (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    between mw.window_start_date
    and least((mw.window_start_date + interval '6 days')::date, mw.end_date)
)
insert into public.plan_day_tasks (
  plan_day_id,
  task_template_id,
  is_required,
  sort_order,
  day_date,
  week_start_date,
  month_start_date,
  is_optional,
  quota_scope,
  quota_target,
  requirement_note,
  display_order
)
select
  cd.plan_day_id,
  cd.task_template_id,
  false,
  0,
  cd.day_date,
  cd.week_start_date,
  cd.month_start_date,
  true,
  'last_week_of_month',
  1,
  cd.requirement_note,
  cd.display_order
from confession_days cd
where not exists (
  select 1
  from public.plan_day_tasks existing
  where existing.plan_day_id = cd.plan_day_id
    and existing.task_template_id = cd.task_template_id
);

with confession_template as (
  select
    id,
    description as requirement_note,
    coalesce(sort_order, 130) as display_order
  from public.task_templates
  where slug = 'confession'
),
task_metadata as (
  select
    pdt.id as plan_day_task_id,
    (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date as day_date,
    (
      date '2026-04-06'
      + ((floor((pd.day_number - 1) / 7.0)::int * 7) * interval '1 day')
    )::date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    ct.requirement_note,
    ct.display_order
  from public.plan_day_tasks pdt
  join public.plan_days pd
    on pd.id = pdt.plan_day_id
  join confession_template ct
    on ct.id = pdt.task_template_id
)
update public.plan_day_tasks pdt
set
  is_required = false,
  is_optional = true,
  quota_scope = 'last_week_of_month',
  quota_target = 1,
  requirement_note = tm.requirement_note,
  display_order = tm.display_order,
  sort_order = coalesce(pdt.sort_order, 0),
  day_date = tm.day_date,
  week_start_date = tm.week_start_date,
  month_start_date = tm.month_start_date
from task_metadata tm
where pdt.id = tm.plan_day_task_id;

commit;

-- Sanity check after applying:
-- select
--   pd.day_number,
--   pdt.day_date,
--   pdt.week_start_date,
--   pdt.month_start_date,
--   pdt.is_required,
--   pdt.is_optional,
--   pdt.quota_scope,
--   pdt.quota_target
-- from public.plan_day_tasks pdt
-- join public.plan_days pd
--   on pd.id = pdt.plan_day_id
-- join public.task_templates tt
--   on tt.id = pdt.task_template_id
-- where tt.slug = 'confession'
-- order by pd.day_number;
