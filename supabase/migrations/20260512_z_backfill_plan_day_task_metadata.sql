begin;

-- Backfill generated task metadata for all existing assignments without
-- overwriting values that were already generated correctly.
with task_metadata as (
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
    tt.description as requirement_note,
    tt.sort_order as display_order
  from public.plan_day_tasks pdt
  join public.plan_days pd
    on pd.id = pdt.plan_day_id
  join public.task_templates tt
    on tt.id = pdt.task_template_id
)
update public.plan_day_tasks pdt
set
  day_date = coalesce(pdt.day_date, tm.day_date),
  week_start_date = coalesce(pdt.week_start_date, tm.week_start_date),
  month_start_date = coalesce(pdt.month_start_date, tm.month_start_date),
  requirement_note = coalesce(pdt.requirement_note, tm.requirement_note),
  display_order = coalesce(pdt.display_order, tm.display_order)
from task_metadata tm
where pdt.id = tm.plan_day_task_id
  and (
    pdt.day_date is null
    or pdt.week_start_date is null
    or pdt.month_start_date is null
    or pdt.requirement_note is null
    or pdt.display_order is null
  );

commit;
