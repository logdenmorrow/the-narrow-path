-- Read-only prerequisite verification for the Gospel season migration.
-- Run manually in Supabase SQL Editor before applying the migration.

select '01 plan_day_tasks required columns' as check_section;

select
  'plan_day_tasks required columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'present'
    else 'missing'
  end as status,
  columns.data_type,
  columns.is_nullable
from (
  values
    ('day_date'),
    ('week_start_date'),
    ('month_start_date'),
    ('is_optional'),
    ('quota_scope'),
    ('quota_target'),
    ('requirement_note'),
    ('display_order')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'plan_day_tasks'
  and columns.column_name = required.column_name
order by required.column_name;

select '02 plan_day_tasks quota_scope check constraint' as check_section;

select
  'plan_day_tasks quota_scope constraint' as check_section,
  coalesce(constraints.conname, 'missing') as constraint_name,
  pg_get_constraintdef(constraints.oid) as constraint_definition
from (
  values ('plan_day_tasks_quota_scope_check')
) as required(constraint_name)
left join pg_catalog.pg_constraint constraints
  on constraints.conname = required.constraint_name
left join pg_catalog.pg_class relations
  on relations.oid = constraints.conrelid
left join pg_catalog.pg_namespace namespaces
  on namespaces.oid = relations.relnamespace
where constraints.oid is null
   or (
    namespaces.nspname = 'public'
    and relations.relname = 'plan_day_tasks'
  );

select
  'plan_day_tasks quota_scope allowed value review' as check_section,
  required.marker,
  case
    when constraint_text.constraint_definition ilike '%' || required.marker || '%' then 'appears_in_constraint'
    else 'review_constraint_definition'
  end as status,
  constraint_text.constraint_definition
from (
  values
    ('week'),
    ('month'),
    ('last_week_of_month'),
    ('is null')
) as required(marker)
left join (
  select pg_get_constraintdef(constraints.oid) as constraint_definition
  from pg_catalog.pg_constraint constraints
  join pg_catalog.pg_class relations
    on relations.oid = constraints.conrelid
  join pg_catalog.pg_namespace namespaces
    on namespaces.oid = relations.relnamespace
  where namespaces.nspname = 'public'
    and relations.relname = 'plan_day_tasks'
    and constraints.conname = 'plan_day_tasks_quota_scope_check'
  limit 1
) as constraint_text
  on true
order by required.marker;

select '03 task_templates required columns' as check_section;

select
  'task_templates required columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'present'
    else 'missing'
  end as status,
  columns.data_type,
  columns.is_nullable
from (
  values
    ('audience'),
    ('weekly_target'),
    ('slug'),
    ('title'),
    ('description'),
    ('cadence'),
    ('sort_order')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'task_templates'
  and columns.column_name = required.column_name
order by required.column_name;

select '04 plan_days Before You Read columns' as check_section;

select
  'plan_days Before You Read columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'present'
    else 'missing'
  end as status,
  columns.data_type,
  columns.is_nullable
from (
  values
    ('reading_context'),
    ('previous_reading_summary'),
    ('reading_today_preview'),
    ('reading_watch_for'),
    ('reading_key_terms'),
    ('reading_context_source_hash')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'plan_days'
  and columns.column_name = required.column_name
order by required.column_name;

select '05 required base task templates' as check_section;

select
  'required base task templates' as check_section,
  required.slug,
  case
    when task_templates.slug is not null then 'present'
    else 'missing'
  end as status,
  task_templates.id,
  task_templates.title,
  task_templates.cadence,
  task_templates.weekly_target,
  task_templates.audience
from (
  values
    ('reading'),
    ('reflection'),
    ('adoration'),
    ('confession'),
    ('night-prayer'),
    ('rosary'),
    ('workout'),
    ('check_in_anchor'),
    ('attend_mass')
) as required(slug)
left join public.task_templates task_templates
  on task_templates.slug = required.slug
order by required.slug;

select '06 optional pre-migration task template' as check_section;

select
  'optional pre-migration task template' as check_section,
  optional.slug,
  case
    when task_templates.slug is not null then 'already_present'
    else 'absent_ok_migration_will_add'
  end as status,
  task_templates.id,
  task_templates.title,
  task_templates.cadence,
  task_templates.weekly_target,
  task_templates.audience
from (
  values ('weekly_fast_or_penance')
) as optional(slug)
left join public.task_templates task_templates
  on task_templates.slug = optional.slug;

select '07 Gospel plan presence' as check_section;

select
  'Gospel plan presence' as check_section,
  case
    when challenge_plans.id is not null then 'already_present_review_before_running'
    else 'absent_ok_migration_will_add'
  end as status,
  challenge_plans.id,
  challenge_plans.slug,
  challenge_plans.name,
  challenge_plans.total_days,
  challenge_plans.is_active
from (
  values (
    'the-gospels-september-lent',
    'The Gospels: From September to Lent'
  )
) as gospel_plan(slug, name)
left join public.challenge_plans challenge_plans
  on challenge_plans.slug = gospel_plan.slug
  or challenge_plans.name = gospel_plan.name
order by challenge_plans.id;

select '08 existing Gospel plan row counts' as check_section;

select
  'existing Gospel plan plan_days count' as check_section,
  count(plan_days.id) as plan_days_count
from (
  values (
    'the-gospels-september-lent',
    'The Gospels: From September to Lent'
  )
) as gospel_plan(slug, name)
left join public.challenge_plans challenge_plans
  on challenge_plans.slug = gospel_plan.slug
  or challenge_plans.name = gospel_plan.name
left join public.plan_days plan_days
  on plan_days.plan_id = challenge_plans.id;

select
  'existing Gospel plan plan_day_tasks count' as check_section,
  count(plan_day_tasks.id) as plan_day_tasks_count
from (
  values (
    'the-gospels-september-lent',
    'The Gospels: From September to Lent'
  )
) as gospel_plan(slug, name)
left join public.challenge_plans challenge_plans
  on challenge_plans.slug = gospel_plan.slug
  or challenge_plans.name = gospel_plan.name
left join public.plan_days plan_days
  on plan_days.plan_id = challenge_plans.id
left join public.plan_day_tasks plan_day_tasks
  on plan_day_tasks.plan_day_id = plan_days.id;

select
  'existing Gospel plan task counts by slug' as check_section,
  coalesce(task_templates.slug, 'no_existing_task_rows') as task_slug,
  count(plan_day_tasks.id) as row_count
from (
  values (
    'the-gospels-september-lent',
    'The Gospels: From September to Lent'
  )
) as gospel_plan(slug, name)
left join public.challenge_plans challenge_plans
  on challenge_plans.slug = gospel_plan.slug
  or challenge_plans.name = gospel_plan.name
left join public.plan_days plan_days
  on plan_days.plan_id = challenge_plans.id
left join public.plan_day_tasks plan_day_tasks
  on plan_day_tasks.plan_day_id = plan_days.id
left join public.task_templates task_templates
  on task_templates.id = plan_day_tasks.task_template_id
group by coalesce(task_templates.slug, 'no_existing_task_rows')
order by task_slug;

select '09 Supabase migration table availability' as check_section;

select
  'Supabase migration table availability' as check_section,
  case
    when count(*) = 1 then 'present'
    else 'missing_or_not_visible'
  end as status
from information_schema.tables tables
where tables.table_schema = 'supabase_migrations'
  and tables.table_name = 'schema_migrations';

select '10 recent Supabase migration versions around Gospel prerequisites' as check_section;

select
  'recent Supabase migration versions around Gospel prerequisites' as check_section,
  schema_migrations.version
from supabase_migrations.schema_migrations schema_migrations
where schema_migrations.version::text like '20260512%'
   or schema_migrations.version::text like '20260518%'
   or schema_migrations.version::text like '20260519%'
order by schema_migrations.version;

select '11 local prerequisite migration names to compare manually' as check_section;

select
  'local prerequisite migration names to compare manually' as check_section,
  required.local_migration_name
from (
  values
    ('20260512_ensure_task_metadata_schema'),
    ('20260512_zz_fix_confession_final_week_windows'),
    ('20260518_zz_add_august_james_draft_plan'),
    ('20260519_add_plan_day_reading_context')
) as required(local_migration_name)
order by required.local_migration_name;
