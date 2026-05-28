begin;

-- Rosary remains required on its rotating weekday, but should also appear as
-- an optional challenge on every other day.
update public.task_templates
set
  optional_other_days = true,
  description = 'Required once per week on a rotating weekday. Optional on all other days. Starts Monday, April 6, 2026, then advances one weekday each week.',
  weekly_target = 1,
  cadence = 'rotating_weekday',
  requirement_model = 'rotating_weekday_required',
  rotation_anchor_date = date '2026-04-06',
  rotation_anchor_weekday = 1,
  audience = 'shared'
where slug = 'rosary';

with rosary_template as (
  select
    id,
    coalesce(sort_order, 100) as display_order,
    description,
    coalesce(rotation_anchor_date, date '2026-04-06') as anchor_date,
    coalesce(rotation_anchor_weekday, 1) as anchor_weekday
  from public.task_templates
  where slug = 'rosary'
),
classified_days as (
  select
    pd.id as plan_day_id,
    rt.id as task_template_id,
    (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date as day_date,
    (date '2026-04-06' + ((floor((pd.day_number - 1) / 7.0)::int * 7) * interval '1 day'))::date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    rt.display_order,
    rt.description as requirement_note,
    (
      extract(
        isodow
        from (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
      )::int
      =
      (
        (
          (
            rt.anchor_weekday
            - 1
            + floor(
              (
                (
                  (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
                  - rt.anchor_date
                ) / 7.0
              )
            )::int
          ) % 7
          + 7
        ) % 7
      ) + 1
    ) as is_rotating_required_day
  from public.plan_days pd
  cross join rosary_template rt
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
  cd.is_rotating_required_day,
  0,
  cd.day_date,
  cd.week_start_date,
  cd.month_start_date,
  not cd.is_rotating_required_day,
  null,
  null,
  cd.requirement_note,
  cd.display_order
from classified_days cd
where not exists (
  select 1
  from public.plan_day_tasks existing
  where existing.plan_day_id = cd.plan_day_id
    and existing.task_template_id = cd.task_template_id
);

with rosary_template as (
  select
    id,
    coalesce(sort_order, 100) as display_order,
    description,
    coalesce(rotation_anchor_date, date '2026-04-06') as anchor_date,
    coalesce(rotation_anchor_weekday, 1) as anchor_weekday
  from public.task_templates
  where slug = 'rosary'
),
classified_days as (
  select
    pd.id as plan_day_id,
    rt.id as task_template_id,
    (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date as day_date,
    (date '2026-04-06' + ((floor((pd.day_number - 1) / 7.0)::int * 7) * interval '1 day'))::date as week_start_date,
    date_trunc(
      'month',
      (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
    )::date as month_start_date,
    rt.display_order,
    rt.description as requirement_note,
    (
      extract(
        isodow
        from (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
      )::int
      =
      (
        (
          (
            rt.anchor_weekday
            - 1
            + floor(
              (
                (
                  (date '2026-04-06' + ((pd.day_number - 1) * interval '1 day'))::date
                  - rt.anchor_date
                ) / 7.0
              )
            )::int
          ) % 7
          + 7
        ) % 7
      ) + 1
    ) as is_rotating_required_day
  from public.plan_days pd
  cross join rosary_template rt
)
update public.plan_day_tasks pdt
set
  is_required = cd.is_rotating_required_day,
  is_optional = not cd.is_rotating_required_day,
  quota_scope = null,
  quota_target = null,
  requirement_note = cd.requirement_note,
  day_date = coalesce(pdt.day_date, cd.day_date),
  week_start_date = coalesce(pdt.week_start_date, cd.week_start_date),
  month_start_date = coalesce(pdt.month_start_date, cd.month_start_date),
  display_order = coalesce(pdt.display_order, cd.display_order),
  sort_order = coalesce(pdt.sort_order, 0)
from classified_days cd
where pdt.plan_day_id = cd.plan_day_id
  and pdt.task_template_id = cd.task_template_id;

commit;
