# Gospels Season Pre-Run Checklist

Final local checklist for the inactive Gospel season draft migration.

No SQL was executed during this pass. No migrations were run. No Supabase data was read, written, or mutated.

## Migration

- Migration file: `supabase/migrations/20260527150103_add_gospels_september_lent_draft_plan.sql`
- Source review SQL: `supabase/generated/the-gospels-september-lent-draft-plan-review.sql`
- Migration starts with `begin;`: yes.
- Migration ends with final `commit;`: yes.
- Migration contains `rollback;`: no.
- Migration should not activate the Gospel season: confirmed.
- Gospel plan remains inactive: `is_active = false`.
- No cleanup/delete step is included: intentional.

## Human Decisions Applied

- Confession remains month-wide with `quota_scope = 'month'`.
- Confession is not changed to `last_week_of_month`.
- No cleanup/delete step is added before first execution.
- If the task set changes after this migration is run, use a narrowly scoped fix migration later.

## Counts

- Plan days represented: 162.
- Task rows represented: 1,481.

| Task slug | Rows |
| --- | ---: |
| `reading` | 162 |
| `reflection` | 162 |
| `adoration` | 162 |
| `confession` | 162 |
| `night-prayer` | 162 |
| `rosary` | 162 |
| `workout` | 162 |
| `check_in_anchor` | 162 |
| `weekly_fast_or_penance` | 162 |
| `attend_mass` | 23 |
| **Total** | **1,481** |

## Discipline And Task Checks

- `weekly_fast_or_penance` is included: yes.
- `temperance` is inserted as a task/template: no.
- `give_up_alcohol` is reused: no.
- Standalone `fast` task slug is reused: no.
- `adoration` uses `quota_scope = 'week'`, `quota_target = 1`.
- `weekly_fast_or_penance` uses `quota_scope = 'week'`, `quota_target = 1`.
- `confession` intentionally uses `quota_scope = 'month'`, `quota_target = 1`.

## Content And Metadata Checks

- Gospel content, readings, references, prompts, and import artifacts were not changed.
- Generated review SQL was not changed.
- Before You Read fields remain null:
  - `reading_context`
  - `previous_reading_summary`
  - `reading_today_preview`
  - `reading_watch_for`
  - `reading_key_terms`
  - `reading_context_source_hash`
- Source metadata URLs or attribution fields are not included:
  - no `app.ascensionpress.com`
  - no `sourceUrls`
  - no `sourceMetadataSummary`
  - no `"translation"` metadata field
- `Ascension` appears only as approved reading content/title text, not source attribution metadata.

## Prerequisite Schema Checklist

Before running the migration against any target Supabase database, confirm the target database has these schema pieces applied:

- `plan_day_tasks` has task metadata columns:
  - `day_date`
  - `week_start_date`
  - `month_start_date`
  - `is_optional`
  - `quota_scope`
  - `quota_target`
  - `requirement_note`
  - `display_order`
- `plan_day_tasks_quota_scope_check` allows `month` and `week`.
- `task_templates` has `audience`.
- `task_templates` has `weekly_target`.
- `plan_days` has Before You Read fields:
  - `reading_context`
  - `previous_reading_summary`
  - `reading_today_preview`
  - `reading_watch_for`
  - `reading_key_terms`
  - `reading_context_source_hash`
- Base task templates already exist:
  - `reading`
  - `reflection`
  - `adoration`
  - `confession`
  - `night-prayer`
  - `rosary`
  - `workout`
  - `check_in_anchor`
  - `attend_mass`

## Pre-Run Notes

- Do not run this migration until the target Supabase database has been confirmed to have the prerequisite schema migrations.
- Do not activate the Gospel season in this migration.
- The migration is ready for human pre-run review after local validation.
