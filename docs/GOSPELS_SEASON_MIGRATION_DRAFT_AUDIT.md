# Gospels Season Migration Draft Audit

Draft migration audit for the inactive Gospel season plan.

No SQL was executed. No Supabase data was read, written, or mutated. The migration file was created for human review only and has not been run.

## Files

- Migration file: `supabase/migrations/20260527150103_add_gospels_september_lent_draft_plan.sql`
- Source review SQL: `supabase/generated/the-gospels-september-lent-draft-plan-review.sql`
- Schema compatibility audit: `docs/GOSPELS_SEASON_SQL_SCHEMA_COMPATIBILITY_AUDIT.md`

## Conversion Summary

- Schema compatibility audit blockers: none found.
- Review-only `rollback;` removed: yes.
- Migration transaction ending: `commit;`.
- Review-only header replaced with migration-appropriate comments: yes.
- Cleanup/delete added: no.
- Gospel plan remains inactive: yes, `is_active = false`.
- Gospel season activation performed: no.
- SQL executed: no.

## Plan Summary

- Plan slug: `the-gospels-september-lent`
- Plan name: `The Gospels: From September to Lent`
- Total days: 162
- Active state: inactive
- Generated plan days in migration: 162
- Generated task rows in migration: 1,481

## Task Row Counts

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

## Quota Scopes

The migration uses only schema-compatible quota scopes:

- `week`
- `month`
- `null`

Specific quota notes:

- `adoration`: `quota_scope = 'week'`, `quota_target = 1`
- `weekly_fast_or_penance`: `quota_scope = 'week'`, `quota_target = 1`
- `confession`: `quota_scope = 'month'`, `quota_target = 1`

## Included And Excluded Discipline Rows

- `weekly_fast_or_penance` included: yes.
- `temperance` task/template rows inserted: no.
- `give_up_alcohol` task rows inserted: no.
- Standalone `fast` task slug inserted: no.
- Temperance remains an app/dashboard season rule surface, not a task row.

## Content And Metadata Safety

- Reading text preserved from the review SQL: yes.
- Reading references preserved from the review SQL: yes.
- Reflection prompts preserved from the review SQL: yes.
- Day numbers, dates, titles, focus, notes, and day types preserved from the review SQL: yes.
- Before You Read fields remain null:
  - `reading_context`
  - `previous_reading_summary`
  - `reading_today_preview`
  - `reading_watch_for`
  - `reading_key_terms`
  - `reading_context_source_hash`
- Source attribution metadata is not included as DB metadata fields.
- `Ascension` appears only as approved reading content/title text, not as source attribution metadata.

## Schema Compatibility Findings Carried Forward

- No definite schema compatibility blocker was found before migration creation.
- `task_templates`, `challenge_plans`, `plan_days`, and `plan_day_tasks` inserts use columns found in schema history.
- Conflict targets match existing migration patterns:
  - `task_templates`: `on conflict (slug)`
  - `plan_days`: `on conflict (plan_id, day_number)`
  - `plan_day_tasks`: `on conflict (plan_day_id, task_template_id)`
- Human review item: Confession currently uses `month`, which is schema-compatible and matches the August James draft pattern. Prior active-plan Confession work used `last_week_of_month`, so this remains a product review decision before running the migration.
- Human review item: no scoped cleanup/delete was added. If the Gospel task set changes before execution, consider adding a narrowly scoped cleanup for only `challenge_plans.slug = 'the-gospels-september-lent'`.
- Before running in any environment, verify the target Supabase database has actually applied prerequisite schema migrations for task metadata, quota scopes, task template audience, and Before You Read fields.

## Recommendation

Ready for human migration review. Do not run until the Confession quota behavior and optional scoped-cleanup policy have been reviewed.
