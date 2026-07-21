begin;

-- Splits the single generic Liturgy of the Hours task into three
-- Hour-specific tasks (Lauds, Vespers, Compline) with independent
-- completion tracking. The night-prayer task_template and
-- the-gospels-september-lent plan are both untouched.
--
-- Zero user_task_completions reference the generic liturgy-of-the-hours
-- plan_day_tasks rows being deleted here (confirmed in Phase 0), so the
-- delete in Part A is safe.
--
-- Snapshot the current liturgy-of-the-hours plan_day_tasks rows into a
-- session-scoped temp table BEFORE Part A deletes them, so Parts C and D
-- can copy the exact row shape (display_order, sort_order, is_required,
-- is_optional, day_date, week_start_date, month_start_date, quota_scope,
-- quota_target) under the three new per-Hour task_templates. This also
-- makes the migration naturally idempotent: on a re-run, no rows would
-- reference the (by then already-deleted) generic slug, so the snapshot
-- -- and everything derived from it in Parts C/D -- would be empty.
create temporary table loh_snapshot on commit drop as
select pdt.*, cp.slug as plan_slug, pd.day_number
from public.plan_day_tasks pdt
join public.plan_days pd on pd.id = pdt.plan_day_id
join public.challenge_plans cp on cp.id = pd.plan_id
join public.task_templates tt on tt.id = pdt.task_template_id
where tt.slug = 'liturgy-of-the-hours';

-- Part A: delete the generic liturgy-of-the-hours task and its rows.
delete from public.plan_day_tasks pdt
using public.task_templates tt
where pdt.task_template_id = tt.id
  and tt.slug = 'liturgy-of-the-hours';

delete from public.task_templates
where slug = 'liturgy-of-the-hours';

-- Part B: three new per-Hour task_templates.
insert into public.task_templates (
  slug,
  title,
  description,
  cadence,
  weekly_target,
  sort_order,
  audience
)
values
  (
    'liturgy-of-the-hours-lauds',
    'Morning Prayer',
    'Pray Morning Prayer (Lauds) with the Church.',
    'daily',
    null,
    115,
    'shared'
  ),
  (
    'liturgy-of-the-hours-vespers',
    'Evening Prayer',
    'Pray Evening Prayer (Vespers) with the Church.',
    'daily',
    null,
    116,
    'shared'
  ),
  (
    'liturgy-of-the-hours-compline',
    'Night Prayer',
    'Pray Night Prayer (Compline) with the Church.',
    'daily',
    null,
    117,
    'shared'
  )
on conflict (slug) do nothing;

-- Part C: ordinary-time-james (all 31 days) -- one row per Hour per day,
-- copying shape from the snapshot, requirement_note fixed to the current
-- copy ("Optional daily.").
insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-lauds') tt
where s.plan_slug = 'ordinary-time-james';

insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-vespers') tt
where s.plan_slug = 'ordinary-time-james';

insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-compline') tt
where s.plan_slug = 'ordinary-time-james';

-- Part D: the-narrow-path-90 day 90 -- same pattern as Part C, one row per
-- Hour.
insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-lauds') tt
where s.plan_slug = 'the-narrow-path-90' and s.day_number = 90;

insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-vespers') tt
where s.plan_slug = 'the-narrow-path-90' and s.day_number = 90;

insert into public.plan_day_tasks (
  plan_day_id, task_template_id, is_required, is_optional, sort_order,
  display_order, day_date, week_start_date, month_start_date, quota_scope,
  quota_target, requirement_note
)
select
  s.plan_day_id, tt.id, s.is_required, s.is_optional, s.sort_order,
  s.display_order, s.day_date, s.week_start_date, s.month_start_date,
  s.quota_scope, s.quota_target, 'Optional daily.'
from loh_snapshot s
cross join (select id from public.task_templates where slug = 'liturgy-of-the-hours-compline') tt
where s.plan_slug = 'the-narrow-path-90' and s.day_number = 90;

-- Part E: no-op comments -- night-prayer task_template and
-- the-gospels-september-lent are intentionally untouched. No statement
-- above references either.

commit;
