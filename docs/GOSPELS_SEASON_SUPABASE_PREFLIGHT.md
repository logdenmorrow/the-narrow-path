# Gospels Season Supabase Preflight

Use this read-only script before applying the inactive Gospel season migration:

- Script: `supabase/generated/verify-gospels-season-prerequisites.sql`
- Migration to apply later: `supabase/migrations/20260527150103_add_gospels_september_lent_draft_plan.sql`

Do not run the Gospel migration until this preflight has been reviewed in the target Supabase project.

## What The Script Does

The script is read-only. It uses `select` queries to check the target database schema and current data state before the Gospel migration is applied.

It checks:

- required `plan_day_tasks` task metadata columns
- the `plan_day_tasks_quota_scope_check` constraint definition
- required `task_templates` columns
- required `plan_days` Before You Read columns
- required base task templates
- whether `weekly_fast_or_penance` already exists
- whether the Gospel plan already exists
- existing Gospel plan `plan_days` and `plan_day_tasks` counts, if any
- visible migration-history-looking catalog tables, if the SQL Editor exposes any

## Good Results

Good preflight results should look like this:

- All required `plan_day_tasks` columns show `present`.
- The quota-scope constraint definition is present and includes `week`, `month`, `last_week_of_month`, and null handling.
- All required `task_templates` columns show `present`.
- All required `plan_days` Before You Read columns show `present`.
- All required base task templates show `present`:
  - `reading`
  - `reflection`
  - `adoration`
  - `confession`
  - `night-prayer`
  - `rosary`
  - `workout`
  - `check_in_anchor`
  - `attend_mass`
- `weekly_fast_or_penance` may be missing before the migration. That is okay because the Gospel migration adds it.
- The Gospel plan may be missing before the migration. That is okay because the Gospel migration adds it inactive.
- If the Gospel plan exists, it should remain inactive.

## Stop Conditions

Do not run the Gospel migration if:

- any required column is missing
- the quota-scope constraint does not allow `month` and `week`
- any required base task template is missing
- the target database does not have the prerequisite schema migrations applied
- the Gospel plan already exists with `plan_days` or `plan_day_tasks` rows

If the Gospel plan already exists with rows, stop and review the target database state before applying this migration. The current migration intentionally has no cleanup/delete step.

## Human Decisions Carried Forward

- Confession intentionally remains month-wide with `quota_scope = 'month'`.
- No cleanup/delete step is intentionally included before first execution.
- The migration keeps the Gospel plan inactive with `is_active = false`.
- The migration should not activate the Gospel season.

## Migration History Visibility

Some Supabase projects do not expose `supabase_migrations.schema_migrations` in SQL Editor. That is not automatically a blocker if the required columns, constraints, and base task templates are present.

The script avoids querying that relation directly. Instead, it lists visible migration-history-looking tables and relations through `information_schema` and `pg_catalog`, when any are visible to the SQL Editor session.

Compare any visible migration-history results with the local prerequisite migration names shown by the script:

- `20260512_ensure_task_metadata_schema`
- `20260512_zz_fix_confession_final_week_windows`
- `20260518_zz_add_august_james_draft_plan`
- `20260519_add_plan_day_reading_context`

If migration history is not visible in SQL Editor, verify these prerequisites through repo history, the Supabase CLI, or the Supabase dashboard migration history. The actual schema checks in this script are the source of truth for this preflight.

## Final Reminder

This preflight does not run the Gospel migration. It is only a readiness check for the target Supabase database.
