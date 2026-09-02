begin;

-- Replace the Gospel season's legacy optional Night Prayer assignment with
-- Morning Prayer, Evening Prayer, and Night Prayer (Compline). The work is
-- scoped to this plan only. Existing James/original-plan rows are untouched.
--
-- Legacy completions are copied to Compline before their assignment rows are
-- removed. Re-running this migration is safe: the three target assignments
-- are upserted and the legacy snapshot is empty after the first successful run.

do $$
declare
  gospel_plan_id bigint;
  gospel_plan_count integer;
  gospel_day_count integer;
  legacy_task_count integer;
  hour_template_count integer;
begin
  select count(*), min(id)
  into gospel_plan_count, gospel_plan_id
  from public.challenge_plans
  where slug = 'the-gospels-september-lent';

  if gospel_plan_count <> 1 then
    raise exception 'Expected exactly one Gospel plan; found %.', gospel_plan_count;
  end if;

  select count(*) into gospel_day_count
  from public.plan_days
  where plan_id = gospel_plan_id;

  if gospel_day_count <> 162 then
    raise exception 'Expected 162 Gospel plan days; found %.', gospel_day_count;
  end if;

  select count(*) into hour_template_count
  from public.task_templates
  where slug in (
    'liturgy-of-the-hours-lauds',
    'liturgy-of-the-hours-vespers',
    'liturgy-of-the-hours-compline'
  );

  if hour_template_count <> 3 then
    raise exception 'Expected all three current Liturgy of the Hours templates; found %.', hour_template_count;
  end if;

  if exists (
    select slug
    from public.task_templates
    where slug in (
      'liturgy-of-the-hours-lauds',
      'liturgy-of-the-hours-vespers',
      'liturgy-of-the-hours-compline'
    )
    group by slug
    having count(*) <> 1
  ) then
    raise exception 'A Liturgy of the Hours template slug is duplicated.';
  end if;

  select count(*) into legacy_task_count
  from public.plan_day_tasks pdt
  join public.plan_days pd on pd.id = pdt.plan_day_id
  join public.task_templates tt on tt.id = pdt.task_template_id
  where pd.plan_id = gospel_plan_id
    and tt.slug = 'night-prayer';

  if legacy_task_count not in (0, 162) then
    raise exception 'Expected either 162 legacy Gospel Night Prayer rows or zero after a prior run; found %.', legacy_task_count;
  end if;
end
$$;

create temporary table gospel_legacy_loh_tasks on commit drop as
select pdt.*
from public.plan_day_tasks pdt
join public.plan_days pd on pd.id = pdt.plan_day_id
join public.challenge_plans cp on cp.id = pd.plan_id
join public.task_templates tt on tt.id = pdt.task_template_id
where cp.slug = 'the-gospels-september-lent'
  and tt.slug = 'night-prayer';

create temporary table gospel_legacy_loh_completions on commit drop as
select utc.*
from public.user_task_completions utc
join gospel_legacy_loh_tasks legacy
  on legacy.id = utc.plan_day_task_id;

with gospel_days as (
  select
    pd.id as plan_day_id,
    date '2026-09-01' + (pd.day_number - 1) as day_date
  from public.plan_days pd
  join public.challenge_plans cp on cp.id = pd.plan_id
  where cp.slug = 'the-gospels-september-lent'
),
hour_templates as (
  select id, slug, sort_order
  from public.task_templates
  where slug in (
    'liturgy-of-the-hours-lauds',
    'liturgy-of-the-hours-vespers',
    'liturgy-of-the-hours-compline'
  )
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
  templates.id,
  false,
  true,
  templates.sort_order,
  templates.sort_order,
  days.day_date,
  days.day_date - (extract(isodow from days.day_date)::integer - 1),
  date_trunc('month', days.day_date)::date,
  null,
  null,
  'Optional daily.'
from gospel_days days
cross join hour_templates templates
on conflict (plan_day_id, task_template_id) do update
set
  is_required = false,
  is_optional = true,
  sort_order = excluded.sort_order,
  display_order = excluded.display_order,
  day_date = excluded.day_date,
  week_start_date = excluded.week_start_date,
  month_start_date = excluded.month_start_date,
  quota_scope = null,
  quota_target = null,
  requirement_note = excluded.requirement_note;

-- One legacy completion means that day's Night Prayer was prayed. Preserve
-- that meaning on the corresponding Compline assignment. If a Compline
-- completion already exists, do not add a duplicate.
insert into public.user_task_completions (
  user_id,
  plan_day_task_id,
  completed_at,
  notes,
  created_at,
  updated_at
)
select distinct on (legacy_completion.user_id, compline.id)
  legacy_completion.user_id,
  compline.id,
  legacy_completion.completed_at,
  legacy_completion.notes,
  legacy_completion.created_at,
  legacy_completion.updated_at
from gospel_legacy_loh_completions legacy_completion
join gospel_legacy_loh_tasks legacy_task
  on legacy_task.id = legacy_completion.plan_day_task_id
join public.plan_day_tasks compline
  on compline.plan_day_id = legacy_task.plan_day_id
join public.task_templates compline_template
  on compline_template.id = compline.task_template_id
 and compline_template.slug = 'liturgy-of-the-hours-compline'
where not exists (
  select 1
  from public.user_task_completions existing
  where existing.user_id = legacy_completion.user_id
    and existing.plan_day_task_id = compline.id
)
order by
  legacy_completion.user_id,
  compline.id,
  legacy_completion.completed_at asc nulls last,
  legacy_completion.created_at asc;

do $$
begin
  if exists (
    select 1
    from gospel_legacy_loh_completions legacy_completion
    join gospel_legacy_loh_tasks legacy_task
      on legacy_task.id = legacy_completion.plan_day_task_id
    where not exists (
      select 1
      from public.plan_day_tasks compline
      join public.task_templates compline_template
        on compline_template.id = compline.task_template_id
       and compline_template.slug = 'liturgy-of-the-hours-compline'
      join public.user_task_completions migrated
        on migrated.plan_day_task_id = compline.id
       and migrated.user_id = legacy_completion.user_id
      where compline.plan_day_id = legacy_task.plan_day_id
    )
  ) then
    raise exception 'One or more legacy Gospel Night Prayer completions were not preserved on Compline.';
  end if;
end
$$;

delete from public.plan_day_tasks pdt
using gospel_legacy_loh_tasks legacy
where pdt.id = legacy.id;

do $$
declare
  gospel_plan_id bigint;
  slug_to_check text;
  assignment_count integer;
begin
  select id into strict gospel_plan_id
  from public.challenge_plans
  where slug = 'the-gospels-september-lent';

  foreach slug_to_check in array array[
    'liturgy-of-the-hours-lauds',
    'liturgy-of-the-hours-vespers',
    'liturgy-of-the-hours-compline'
  ] loop
    select count(*) into assignment_count
    from public.plan_day_tasks pdt
    join public.plan_days pd on pd.id = pdt.plan_day_id
    join public.task_templates tt on tt.id = pdt.task_template_id
    where pd.plan_id = gospel_plan_id
      and tt.slug = slug_to_check
      and pdt.is_optional = true
      and pdt.is_required = false;

    if assignment_count <> 162 then
      raise exception 'Expected 162 optional Gospel assignments for %; found %.', slug_to_check, assignment_count;
    end if;
  end loop;

  if exists (
    select 1
    from public.plan_day_tasks pdt
    join public.plan_days pd on pd.id = pdt.plan_day_id
    join public.task_templates tt on tt.id = pdt.task_template_id
    where pd.plan_id = gospel_plan_id
      and tt.slug = 'night-prayer'
  ) then
    raise exception 'Legacy Gospel Night Prayer assignments remain after migration.';
  end if;
end
$$;

commit;
