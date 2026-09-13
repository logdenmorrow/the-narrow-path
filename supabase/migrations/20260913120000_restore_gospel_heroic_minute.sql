-- Restore the Heroic Minute as a required daily Gospel-season task beginning
-- September 13. Earlier days are intentionally untouched so this change does
-- not retroactively make completed days appear incomplete.

begin;

do $$
declare
  gospel_plan_count integer;
  gospel_day_count integer;
  heroic_minute_template_count integer;
begin
  select count(*) into gospel_plan_count
  from public.challenge_plans
  where slug = 'the-gospels-september-lent';

  if gospel_plan_count <> 1 then
    raise exception 'Expected exactly one Gospel plan; found %.', gospel_plan_count;
  end if;

  select count(*) into gospel_day_count
  from public.plan_days pd
  join public.challenge_plans cp on cp.id = pd.plan_id
  where cp.slug = 'the-gospels-september-lent';

  if gospel_day_count <> 162 then
    raise exception 'Expected 162 Gospel plan days; found %.', gospel_day_count;
  end if;

  select count(*) into heroic_minute_template_count
  from public.task_templates
  where slug = 'heroic_minute';

  if heroic_minute_template_count <> 1 then
    raise exception 'Expected exactly one Heroic Minute template; found %.', heroic_minute_template_count;
  end if;
end
$$;

with gospel_days as (
  select
    pd.id as plan_day_id,
    pd.day_number,
    date '2026-09-01' + (pd.day_number - 1) as day_date
  from public.plan_days pd
  join public.challenge_plans cp on cp.id = pd.plan_id
  where cp.slug = 'the-gospels-september-lent'
    and pd.day_number between 13 and 162
),
heroic_minute_template as (
  select id
  from public.task_templates
  where slug = 'heroic_minute'
)
insert into public.plan_day_tasks (
  plan_day_id,
  task_template_id,
  is_required,
  is_optional,
  sort_order,
  display_order,
  day_date,
  week_start_date,
  month_start_date,
  quota_scope,
  quota_target,
  requirement_note
)
select
  days.plan_day_id,
  template.id,
  true,
  false,
  30,
  30,
  days.day_date,
  days.day_date - (extract(isodow from days.day_date)::integer - 1),
  date_trunc('month', days.day_date)::date,
  null,
  null,
  'Get up as soon as your alarm sounds.'
from gospel_days days
cross join heroic_minute_template template
on conflict (plan_day_id, task_template_id) do update
set
  is_required = true,
  is_optional = false,
  sort_order = excluded.sort_order,
  display_order = excluded.display_order,
  day_date = excluded.day_date,
  week_start_date = excluded.week_start_date,
  month_start_date = excluded.month_start_date,
  quota_scope = null,
  quota_target = null,
  requirement_note = excluded.requirement_note;

do $$
declare
  assignment_count integer;
begin
  select count(*) into assignment_count
  from public.plan_day_tasks pdt
  join public.plan_days pd on pd.id = pdt.plan_day_id
  join public.challenge_plans cp on cp.id = pd.plan_id
  join public.task_templates tt on tt.id = pdt.task_template_id
  where cp.slug = 'the-gospels-september-lent'
    and tt.slug = 'heroic_minute'
    and pd.day_number between 13 and 162
    and pdt.is_required = true
    and pdt.is_optional = false
    and pdt.quota_scope is null
    and pdt.quota_target is null;

  if assignment_count <> 150 then
    raise exception 'Expected 150 required Gospel Heroic Minute assignments; found %.', assignment_count;
  end if;

  if exists (
    select 1
    from public.plan_day_tasks pdt
    join public.plan_days pd on pd.id = pdt.plan_day_id
    join public.challenge_plans cp on cp.id = pd.plan_id
    join public.task_templates tt on tt.id = pdt.task_template_id
    where cp.slug = 'the-gospels-september-lent'
      and tt.slug = 'heroic_minute'
      and pd.day_number < 13
  ) then
    raise exception 'Heroic Minute was unexpectedly assigned before its September 13 effective date.';
  end if;
end
$$;

commit;
