-- Read-only production verification before Supabase CLI migration-history repair.
-- This script checks schema/data evidence only. It does not read migration history.

select '00 overall stop summary' as check_section;

select
  'overall stop summary' as check_section,
  case
    when exists (
      select 1
      from (
        values
          ('public', 'profiles'),
          ('public', 'task_templates'),
          ('public', 'challenge_plans'),
          ('public', 'plan_days'),
          ('public', 'plan_day_tasks'),
          ('public', 'user_reflection_entries'),
          ('public', 'user_daily_checkins'),
          ('public', 'user_prayer_requests'),
          ('public', 'support_requests'),
          ('public', 'night_prayers'),
          ('public', 'notification_broadcasts'),
          ('public', 'notification_reminder_slots')
      ) as required(table_schema, table_name)
      where not exists (
        select 1
        from information_schema.tables tables
        where tables.table_schema = required.table_schema
          and tables.table_name = required.table_name
      )
    ) then 'STOP'
    when exists (
      select 1
      from (
        values
          ('public', 'profiles', 'track'),
          ('public', 'profiles', 'gender'),
          ('public', 'profiles', 'is_admin'),
          ('public', 'profiles', 'is_hidden_from_community'),
          ('public', 'profiles', 'last_active_at'),
          ('public', 'task_templates', 'audience'),
          ('public', 'task_templates', 'sort_order'),
          ('public', 'task_templates', 'weekly_target'),
          ('public', 'plan_day_tasks', 'day_date'),
          ('public', 'plan_day_tasks', 'week_start_date'),
          ('public', 'plan_day_tasks', 'month_start_date'),
          ('public', 'plan_day_tasks', 'is_optional'),
          ('public', 'plan_day_tasks', 'quota_scope'),
          ('public', 'plan_day_tasks', 'quota_target'),
          ('public', 'plan_day_tasks', 'requirement_note'),
          ('public', 'plan_day_tasks', 'display_order'),
          ('public', 'plan_days', 'reading_context'),
          ('public', 'plan_days', 'previous_reading_summary'),
          ('public', 'plan_days', 'reading_today_preview'),
          ('public', 'plan_days', 'reading_watch_for'),
          ('public', 'plan_days', 'reading_key_terms'),
          ('public', 'plan_days', 'reading_context_source_hash')
      ) as required(table_schema, table_name, column_name)
      where not exists (
        select 1
        from information_schema.columns columns
        where columns.table_schema = required.table_schema
          and columns.table_name = required.table_name
          and columns.column_name = required.column_name
      )
    ) then 'STOP'
    else 'PASS'
  end as result,
  'STOP means do not mark local migrations as applied until missing evidence is resolved.' as details;

select '01 required tables' as check_section;

select
  'required tables' as check_section,
  required.table_schema,
  required.table_name,
  case
    when tables.table_name is not null then 'PASS'
    else 'STOP'
  end as result
from (
  values
    ('public', 'user_reflection_entries'),
    ('public', 'user_daily_checkins'),
    ('public', 'user_prayer_requests'),
    ('public', 'profiles'),
    ('public', 'app_admins'),
    ('public', 'support_requests'),
    ('public', 'task_templates'),
    ('public', 'plan_day_tasks'),
    ('public', 'night_prayers'),
    ('public', 'push_subscriptions'),
    ('public', 'notification_broadcasts'),
    ('public', 'notification_deliveries'),
    ('public', 'notification_reminder_preferences'),
    ('public', 'notification_reminder_sends'),
    ('public', 'notification_reminder_slots'),
    ('public', 'challenge_feedback_responses'),
    ('public', 'plan_days'),
    ('public', 'challenge_plans')
) as required(table_schema, table_name)
left join information_schema.tables tables
  on tables.table_schema = required.table_schema
  and tables.table_name = required.table_name
order by required.table_name;

select '02 reflection journaling schema' as check_section;

select
  'reflection journaling columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type,
  columns.is_nullable
from (
  values
    ('id'),
    ('user_id'),
    ('plan_day_id'),
    ('challenge_day_number'),
    ('prompt_text'),
    ('entry_text'),
    ('entry_ciphertext'),
    ('entry_iv'),
    ('entry_auth_tag'),
    ('encryption_version'),
    ('created_at'),
    ('updated_at')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'user_reflection_entries'
  and columns.column_name = required.column_name
order by required.column_name;

select
  'reflection encryption constraint' as check_section,
  coalesce(constraints.conname, 'missing') as constraint_name,
  case
    when constraints.conname is not null then 'PASS'
    else 'STOP'
  end as result,
  pg_get_constraintdef(constraints.oid) as constraint_definition
from pg_catalog.pg_constraint constraints
join pg_catalog.pg_class relations
  on relations.oid = constraints.conrelid
join pg_catalog.pg_namespace namespaces
  on namespaces.oid = relations.relnamespace
where namespaces.nspname = 'public'
  and relations.relname = 'user_reflection_entries'
  and constraints.conname = 'user_reflection_entries_encrypted_or_plaintext_check'
union all
select
  'reflection encryption constraint',
  'missing',
  'STOP',
  null
where not exists (
  select 1
  from pg_catalog.pg_constraint constraints
  join pg_catalog.pg_class relations
    on relations.oid = constraints.conrelid
  join pg_catalog.pg_namespace namespaces
    on namespaces.oid = relations.relnamespace
  where namespaces.nspname = 'public'
    and relations.relname = 'user_reflection_entries'
    and constraints.conname = 'user_reflection_entries_encrypted_or_plaintext_check'
);

select '03 daily status and prayer request schema' as check_section;

select
  'daily status and prayer request columns' as check_section,
  required.table_name,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('user_daily_checkins', 'id'),
    ('user_daily_checkins', 'user_id'),
    ('user_daily_checkins', 'day_date'),
    ('user_daily_checkins', 'status'),
    ('user_daily_checkins', 'created_at'),
    ('user_daily_checkins', 'updated_at'),
    ('user_prayer_requests', 'id'),
    ('user_prayer_requests', 'user_id'),
    ('user_prayer_requests', 'request_date'),
    ('user_prayer_requests', 'category'),
    ('user_prayer_requests', 'note'),
    ('user_prayer_requests', 'created_at'),
    ('user_prayer_requests', 'updated_at')
) as required(table_name, column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = required.table_name
  and columns.column_name = required.column_name
order by required.table_name, required.column_name;

select '04 track, sisterhood, admin, and support schema' as check_section;

select
  'profile and task audience columns' as check_section,
  required.table_name,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type,
  columns.is_nullable,
  columns.column_default
from (
  values
    ('profiles', 'gender'),
    ('profiles', 'track'),
    ('profiles', 'is_admin'),
    ('profiles', 'is_hidden_from_community'),
    ('profiles', 'last_active_at'),
    ('task_templates', 'audience')
) as required(table_name, column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = required.table_name
  and columns.column_name = required.column_name
order by required.table_name, required.column_name;

select
  'admin support columns' as check_section,
  required.table_name,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('app_admins', 'email'),
    ('app_admins', 'created_at'),
    ('support_requests', 'id'),
    ('support_requests', 'user_id'),
    ('support_requests', 'user_email'),
    ('support_requests', 'user_track'),
    ('support_requests', 'issue_type'),
    ('support_requests', 'severity'),
    ('support_requests', 'title'),
    ('support_requests', 'description'),
    ('support_requests', 'page_url'),
    ('support_requests', 'user_agent'),
    ('support_requests', 'status'),
    ('support_requests', 'created_at')
) as required(table_name, column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = required.table_name
  and columns.column_name = required.column_name
order by required.table_name, required.column_name;

select
  'admin helper functions' as check_section,
  required.function_name,
  case
    when routines.routine_name is not null then 'PASS'
    else 'REVIEW'
  end as result
from (
  values
    ('is_app_admin'),
    ('touch_last_active_at')
) as required(function_name)
left join information_schema.routines routines
  on routines.specific_schema = 'public'
  and routines.routine_name = required.function_name
order by required.function_name;

select '05 task metadata and quota schema' as check_section;

select
  'task template metadata columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('sort_order'),
    ('monthly_target'),
    ('optional_other_days'),
    ('required_weekdays'),
    ('requirement_model'),
    ('rotation_anchor_date'),
    ('rotation_anchor_weekday'),
    ('show_only_last_week_of_month'),
    ('special_required_dates'),
    ('audience'),
    ('weekly_target')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'task_templates'
  and columns.column_name = required.column_name
order by required.column_name;

select
  'plan day task metadata columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
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

select
  'quota scope constraint values' as check_section,
  required.marker,
  case
    when constraint_text.constraint_definition ilike '%' || required.marker || '%' then 'PASS'
    when constraint_text.constraint_definition is null then 'STOP'
    else 'REVIEW'
  end as result,
  constraint_text.constraint_definition
from (
  values
    ('week'),
    ('month'),
    ('last_week_of_month'),
    ('IS NULL')
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

select '06 night prayer schema' as check_section;

select
  'night prayer table columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('id'),
    ('prayer_date'),
    ('source'),
    ('source_url'),
    ('liturgical_day'),
    ('title'),
    ('subtitle'),
    ('content_html'),
    ('content_json'),
    ('copyright_notice'),
    ('attribution_html'),
    ('imported_at'),
    ('updated_at')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'night_prayers'
  and columns.column_name = required.column_name
order by required.column_name;

select '07 notification schema' as check_section;

select
  'notification tables and columns' as check_section,
  required.table_name,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('push_subscriptions', 'endpoint'),
    ('push_subscriptions', 'p256dh'),
    ('push_subscriptions', 'auth'),
    ('push_subscriptions', 'is_active'),
    ('notification_broadcasts', 'audience'),
    ('notification_deliveries', 'broadcast_id'),
    ('notification_reminder_preferences', 'enabled'),
    ('notification_reminder_preferences', 'local_time'),
    ('notification_reminder_preferences', 'timezone'),
    ('notification_reminder_sends', 'reminder_date'),
    ('notification_reminder_sends', 'local_time'),
    ('notification_reminder_sends', 'reminder_slot_id'),
    ('notification_reminder_sends', 'reminder_type'),
    ('notification_reminder_slots', 'reminder_type'),
    ('notification_reminder_slots', 'enabled'),
    ('notification_reminder_slots', 'local_time'),
    ('notification_reminder_slots', 'timezone'),
    ('notification_reminder_slots', 'sort_order')
) as required(table_name, column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = required.table_name
  and columns.column_name = required.column_name
order by required.table_name, required.column_name;

select '08 plan day reading context schema' as check_section;

select
  'plan day reading context columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
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

select '09 base and feature task templates' as check_section;

select
  'base and feature task templates' as check_section,
  required.slug,
  case
    when task_templates.slug is not null then 'PASS'
    else 'STOP'
  end as result,
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
    ('attend_mass'),
    ('challenge_feedback'),
    ('give_thanks')
) as required(slug)
left join public.task_templates task_templates
  on task_templates.slug = required.slug
order by required.slug;

select
  'optional pre-Gospel task template' as check_section,
  'weekly_fast_or_penance' as slug,
  case
    when task_templates.slug is not null then 'REVIEW'
    else 'PASS'
  end as result,
  case
    when task_templates.slug is not null then 'Already present before Gospel migration, review target state.'
    else 'Absent is expected before the Gospel migration.'
  end as details
from (values ('weekly_fast_or_penance')) as optional(slug)
left join public.task_templates task_templates
  on task_templates.slug = optional.slug;

select '10 August James draft plan evidence' as check_section;

select
  'August James draft plan' as check_section,
  case
    when challenge_plans.id is null then 'REVIEW'
    when challenge_plans.is_active = false and challenge_plans.total_days = 31 then 'PASS'
    else 'REVIEW'
  end as result,
  challenge_plans.id,
  challenge_plans.slug,
  challenge_plans.name,
  challenge_plans.total_days,
  challenge_plans.is_active
from (values ('ordinary-time-james', 'Ordinary Time: James')) as expected(slug, name)
left join public.challenge_plans challenge_plans
  on challenge_plans.slug = expected.slug
  or challenge_plans.name = expected.name
order by challenge_plans.id;

select
  'August James plan row counts' as check_section,
  case
    when counts.plan_days_count = 31 and counts.plan_day_tasks_count > 0 then 'PASS'
    when counts.plan_days_count = 0 and counts.plan_day_tasks_count = 0 then 'REVIEW'
    else 'REVIEW'
  end as result,
  counts.plan_days_count,
  counts.plan_day_tasks_count
from (
  select
    count(distinct plan_days.id) as plan_days_count,
    count(plan_day_tasks.id) as plan_day_tasks_count
  from public.challenge_plans challenge_plans
  left join public.plan_days plan_days
    on plan_days.plan_id = challenge_plans.id
  left join public.plan_day_tasks plan_day_tasks
    on plan_day_tasks.plan_day_id = plan_days.id
  where challenge_plans.slug = 'ordinary-time-james'
    or challenge_plans.name = 'Ordinary Time: James'
) as counts;

select '11 Give Thanks and Day 90 evidence' as check_section;

select
  'challenge feedback schema columns' as check_section,
  required.column_name,
  case
    when columns.column_name is not null then 'PASS'
    else 'STOP'
  end as result,
  columns.data_type
from (
  values
    ('id'),
    ('user_id'),
    ('plan_id'),
    ('plan_day_id'),
    ('day_number'),
    ('liked_text'),
    ('helped_growth_text'),
    ('unnecessary_or_confusing_text'),
    ('too_hard_or_missing_text'),
    ('suggested_changes_text'),
    ('general_feedback_text'),
    ('created_at'),
    ('updated_at')
) as required(column_name)
left join information_schema.columns columns
  on columns.table_schema = 'public'
  and columns.table_name = 'challenge_feedback_responses'
  and columns.column_name = required.column_name
order by required.column_name;

select
  'Day 90 give thanks task presence' as check_section,
  case
    when count(*) > 0 then 'PASS'
    else 'REVIEW'
  end as result,
  count(*) as matching_task_rows
from public.challenge_plans challenge_plans
join public.plan_days plan_days
  on plan_days.plan_id = challenge_plans.id
join public.plan_day_tasks plan_day_tasks
  on plan_day_tasks.plan_day_id = plan_days.id
join public.task_templates task_templates
  on task_templates.id = plan_day_tasks.task_template_id
where plan_days.day_number = 90
  and task_templates.slug = 'give_thanks'
  and (
    challenge_plans.slug = 'the-narrow-path-90'
    or challenge_plans.name = 'The Narrow Path 90'
    or challenge_plans.total_days = 90
  );

select '12 pending Gospel migration evidence' as check_section;

select
  'Gospel migration should remain pending' as check_section,
  case
    when count(challenge_plans.id) = 0 then 'PASS'
    else 'REVIEW'
  end as result,
  count(challenge_plans.id) as matching_gospel_plan_rows,
  'PASS means the Gospel plan is absent, so version 20260527150103 should remain pending.' as details
from public.challenge_plans challenge_plans
where challenge_plans.slug = 'the-gospels-september-lent'
   or challenge_plans.name = 'The Gospels: From September to Lent';

select '13 visible migration-history-looking catalogs only' as check_section;

select
  'visible migration-history-looking tables' as check_section,
  tables.table_schema,
  tables.table_name,
  tables.table_type
from information_schema.tables tables
where lower(tables.table_schema) like '%migration%'
   or lower(tables.table_name) like '%migration%'
order by tables.table_schema, tables.table_name;
