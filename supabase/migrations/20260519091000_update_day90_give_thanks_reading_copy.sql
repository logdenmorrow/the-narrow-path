begin;

update public.task_templates
set
  title = 'Give Thanks',
  description = 'Read Give Thanks: Freedom for Faith, a short Day 90 reading on religious freedom and gratitude for the freedom to practice the Catholic faith.',
  cadence = 'daily',
  weekly_target = null,
  sort_order = 94,
  audience = 'shared'
where slug = 'give_thanks';

with day_90 as (
  select pd.id as plan_day_id
  from public.challenge_plans cp
  join public.plan_days pd
    on pd.plan_id = cp.id
  where cp.total_days = 90
    and pd.day_number = 90
    and (
      cp.slug = 'the-narrow-path-90'
      or cp.name = 'The Narrow Path 90'
      or cp.is_active = true
    )
),
give_thanks_template as (
  select id as task_template_id
  from public.task_templates
  where slug = 'give_thanks'
)
update public.plan_day_tasks pdt
set
  is_required = true,
  is_optional = false,
  quota_scope = null,
  quota_target = null,
  requirement_note = 'Open the Give Thanks reading, give thanks for religious freedom, and pray for Christians who cannot practice the faith freely.',
  display_order = coalesce(pdt.display_order, 94),
  sort_order = coalesce(pdt.sort_order, 94)
from day_90 d90
cross join give_thanks_template gtt
where pdt.plan_day_id = d90.plan_day_id
  and pdt.task_template_id = gtt.task_template_id;

commit;
