begin;

-- Activate the reviewed Gospel season without touching plan content or user data.
-- The guards make this safe to rerun and fail closed if production has drifted.
do $$
declare
  gospel_plan_id bigint;
  gospel_plan_count integer;
  gospel_day_count integer;
  gospel_task_count integer;
  duplicate_day_count integer;
  duplicate_task_count integer;
  first_task_date date;
  last_task_date date;
begin
  select count(*), min(id)
  into gospel_plan_count, gospel_plan_id
  from public.challenge_plans
  where slug = 'the-gospels-september-lent';

  if gospel_plan_count <> 1 then
    raise exception
      'Expected exactly one Gospel plan; found %.', gospel_plan_count;
  end if;

  if not exists (
    select 1
    from public.challenge_plans
    where id = gospel_plan_id
      and name = 'The Gospels: From September to Lent'
      and total_days = 162
  ) then
    raise exception 'Gospel plan metadata does not match the reviewed launch plan.';
  end if;

  select count(*)
  into gospel_day_count
  from public.plan_days
  where plan_id = gospel_plan_id;

  if gospel_day_count <> 162 then
    raise exception
      'Expected 162 Gospel plan days; found %.', gospel_day_count;
  end if;

  select count(*)
  into duplicate_day_count
  from (
    select day_number
    from public.plan_days
    where plan_id = gospel_plan_id
    group by day_number
    having count(*) > 1
  ) duplicates;

  if duplicate_day_count <> 0 then
    raise exception
      'Gospel plan contains % duplicated day numbers.', duplicate_day_count;
  end if;

  if exists (
    select 1
    from generate_series(1, 162) expected(day_number)
    left join public.plan_days actual
      on actual.plan_id = gospel_plan_id
     and actual.day_number = expected.day_number
    where actual.id is null
  ) then
    raise exception 'Gospel plan is missing one or more day numbers.';
  end if;

  select count(*), min(pdt.day_date), max(pdt.day_date)
  into gospel_task_count, first_task_date, last_task_date
  from public.plan_day_tasks pdt
  join public.plan_days pd on pd.id = pdt.plan_day_id
  where pd.plan_id = gospel_plan_id;

  if gospel_task_count <> 1481 then
    raise exception
      'Expected 1481 Gospel task rows; found %.', gospel_task_count;
  end if;

  if first_task_date <> date '2026-09-01'
     or last_task_date <> date '2027-02-09' then
    raise exception
      'Gospel task date range is % through %, expected 2026-09-01 through 2027-02-09.',
      first_task_date,
      last_task_date;
  end if;

  select count(*)
  into duplicate_task_count
  from (
    select pdt.plan_day_id, pdt.task_template_id
    from public.plan_day_tasks pdt
    join public.plan_days pd on pd.id = pdt.plan_day_id
    where pd.plan_id = gospel_plan_id
    group by pdt.plan_day_id, pdt.task_template_id
    having count(*) > 1
  ) duplicates;

  if duplicate_task_count <> 0 then
    raise exception
      'Gospel plan contains % duplicated day/task assignments.', duplicate_task_count;
  end if;

  if exists (
    select 1
    from public.plan_days pd
    left join public.plan_day_tasks pdt on pdt.plan_day_id = pd.id
    where pd.plan_id = gospel_plan_id
    group by pd.id
    having count(pdt.id) = 0
  ) then
    raise exception 'One or more Gospel days have no task rows.';
  end if;

  update public.challenge_plans
  set is_active = (id = gospel_plan_id)
  where is_active is distinct from (id = gospel_plan_id);

  if (
    select count(*)
    from public.challenge_plans
    where is_active = true
  ) <> 1 then
    raise exception 'Activation did not leave exactly one active plan.';
  end if;

  if not exists (
    select 1
    from public.challenge_plans
    where id = gospel_plan_id
      and is_active = true
  ) then
    raise exception 'The Gospel plan was not activated.';
  end if;
end
$$;

commit;
