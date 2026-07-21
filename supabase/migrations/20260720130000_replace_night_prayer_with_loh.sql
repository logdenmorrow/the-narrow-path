begin;

-- Retires Night Prayer as a standalone task in favor of the unified
-- Liturgy of the Hours task (slug: liturgy-of-the-hours, id: 36). The
-- night-prayer task_template row is left untouched so historical
-- user_task_completions rows (which reference plan_day_task_id, not
-- task_template_id directly) keep a valid, meaningful audit trail.

-- Part A: the-narrow-path-90 day 90 (Reset reads day 90's own
-- plan_day_tasks rows). Add liturgy-of-the-hours alongside the existing
-- night-prayer row -- do NOT delete night-prayer here, since the current
-- Reset Today optional task card still has a night-prayer row that needs
-- to keep working until the Phase 2 UI change makes the new row the one
-- users see.
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
  pdt.plan_day_id,
  loh.id,
  pdt.is_required,
  pdt.is_optional,
  pdt.sort_order,
  pdt.display_order,
  pdt.day_date,
  pdt.week_start_date,
  pdt.month_start_date,
  pdt.quota_scope,
  pdt.quota_target,
  pdt.requirement_note
from public.plan_day_tasks pdt
join public.plan_days pd on pd.id = pdt.plan_day_id
join public.challenge_plans cp on cp.id = pd.plan_id
join public.task_templates tt on tt.id = pdt.task_template_id
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours') loh
where cp.slug = 'the-narrow-path-90'
  and pd.day_number = 90
  and tt.slug = 'night-prayer'
  and not exists (
    select 1
    from public.plan_day_tasks existing
    where existing.plan_day_id = pdt.plan_day_id
      and existing.task_template_id = loh.id
  );

-- Part B: ordinary-time-james (all 31 days). Insert liturgy-of-the-hours
-- rows copying each day's actual night-prayer row shape, then delete the
-- night-prayer rows. Confirmed zero user_task_completions reference these
-- rows before writing this migration, so the delete is safe.
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
  pdt.plan_day_id,
  loh.id,
  pdt.is_required,
  pdt.is_optional,
  pdt.sort_order,
  pdt.display_order,
  pdt.day_date,
  pdt.week_start_date,
  pdt.month_start_date,
  pdt.quota_scope,
  pdt.quota_target,
  pdt.requirement_note
from public.plan_day_tasks pdt
join public.plan_days pd on pd.id = pdt.plan_day_id
join public.challenge_plans cp on cp.id = pd.plan_id
join public.task_templates tt on tt.id = pdt.task_template_id
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours') loh
where cp.slug = 'ordinary-time-james'
  and tt.slug = 'night-prayer'
  and not exists (
    select 1
    from public.plan_day_tasks existing
    where existing.plan_day_id = pdt.plan_day_id
      and existing.task_template_id = loh.id
  );

delete from public.plan_day_tasks pdt
using public.plan_days pd,
      public.challenge_plans cp,
      public.task_templates tt
where pdt.plan_day_id = pd.id
  and pd.plan_id = cp.id
  and pdt.task_template_id = tt.id
  and cp.slug = 'ordinary-time-james'
  and tt.slug = 'night-prayer';

-- Part C: the-gospels-september-lent is inactive/future and intentionally
-- untouched -- no statements reference it in this migration.

-- Part D: the night-prayer task_template row (id 32) is intentionally
-- left untouched -- no statements delete or modify public.task_templates
-- in this migration.

commit;
