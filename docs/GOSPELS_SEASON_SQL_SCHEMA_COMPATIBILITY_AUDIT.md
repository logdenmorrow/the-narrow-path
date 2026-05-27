# Gospels Season SQL Schema Compatibility Audit

Review-only schema compatibility audit for the Gospel season SQL draft.

This audit does not create a migration, does not execute SQL, does not mutate Supabase data, and does not change Gospel season content.

## Files Inspected

- `supabase/generated/the-gospels-september-lent-draft-plan-review.sql`
- `docs/GOSPELS_SEASON_SQL_DRAFT_AUDIT.md`
- `scripts/build-gospels-season-sql-draft.mjs`
- `content/gospels/the-gospels-september-lent-import-artifact.json`
- `docs/GOSPELS_SEASON_TASK_IMPLEMENTATION_PLAN.md`
- `supabase/migrations/2026-05-09-add-sisterhood-track-foundation.sql`
- `supabase/migrations/20260509_mark_universal_tasks_shared.sql`
- `supabase/migrations/20260512_ensure_task_metadata_schema.sql`
- `supabase/migrations/20260512_make_rosary_optional_other_days.sql`
- `supabase/migrations/20260512_zz_fix_confession_final_week_windows.sql`
- `supabase/migrations/20260512_zzz_add_night_prayer_phase1.sql`
- `supabase/migrations/20260518_add_day90_feedback_and_give_thanks.sql`
- `supabase/migrations/20260518_zz_add_august_james_draft_plan.sql`
- `supabase/migrations/20260519_add_plan_day_reading_context.sql`
- `supabase/migrations/20260519_update_day90_give_thanks_reading_copy.sql`

## Source Draft

- SQL draft path: `supabase/generated/the-gospels-september-lent-draft-plan-review.sql`
- Source artifact path: `content/gospels/the-gospels-september-lent-import-artifact.json`
- Source artifact SHA-256: `df1311d0b62ce7048a4ab1c4696402537d602126d02d31062a77c95be80c3e10`
- Plan slug: `the-gospels-september-lent`
- Plan name: `The Gospels: From September to Lent`
- Plan active state in draft: `is_active = false`
- Artifact plan days: 162
- Draft task rows: 1,481

## Schema Compatibility

| Table | Result | Notes |
| --- | --- | --- |
| `public.task_templates` | Compatible | The draft uses existing columns: `slug`, `title`, `description`, `cadence`, `weekly_target`, `sort_order`, and `audience`. `sort_order` is added by the task metadata migration, and `audience` is added by the sisterhood foundation migration. |
| `public.challenge_plans` | Compatible with review note | The draft uses existing columns: `slug`, `name`, `total_days`, and `is_active`. The insert/update pattern mirrors the August James draft migration. |
| `public.plan_days` | Compatible | The draft inserts existing content columns and the Before You Read fields added by `20260519_add_plan_day_reading_context.sql`. `reading_key_terms` is explicitly provided as `null::jsonb`. |
| `public.plan_day_tasks` | Compatible | The draft uses task metadata columns added by `20260512_ensure_task_metadata_schema.sql`, including date, quota, optionality, requirement note, and display order fields. |

## Conflict Targets

- `task_templates`: `on conflict (slug)` is consistent with existing task template migrations and is valid for the generated `weekly_fast_or_penance` template upsert.
- `plan_days`: `on conflict (plan_id, day_number)` matches the August James draft pattern.
- `plan_day_tasks`: `on conflict (plan_day_id, task_template_id)` matches the August James draft pattern.
- `challenge_plans`: the draft does not use `on conflict`; it uses `insert ... where not exists` followed by an update matching slug or name. This mirrors the August James draft. A future real migration should still be reviewed for the theoretical case where separate rows already exist with the target slug and target name.

## Task Template Findings

- `weekly_fast_or_penance` is inserted as a new template and is not reusing `fast`.
- `cadence = 'weekly_quota'` matches existing quota task patterns.
- `audience = 'shared'` is allowed by the existing `task_templates_audience_check` constraint and matches shared task migration patterns.
- Required base slugs in the draft are consistent with repository usage:
  - `reading`
  - `reflection`
  - `adoration`
  - `confession`
  - `night-prayer`
  - `rosary`
  - `workout`
  - `check_in_anchor`
  - `attend_mass`
  - `weekly_fast_or_penance`
- The repository uses `night-prayer`, not `night_prayer`.
- The repository uses `check_in_anchor`.
- The repository uses `attend_mass` for Sunday Mass.

## Plan Day Findings

- The generated SQL represents 162 plan days.
- The generated `content` CTE includes `day_date` and `day_type`, but the `plan_days` insert intentionally does not insert those fields because they are not plan day columns in the inspected schema. Those fields are used later for task date/window generation.
- Before You Read fields are left null:
  - `reading_context`
  - `previous_reading_summary`
  - `reading_today_preview`
  - `reading_watch_for`
  - `reading_key_terms`
  - `reading_context_source_hash`
- Leaving those fields null is schema-safe.

## Plan Day Task Findings

- The generated SQL represents 1,481 task rows.
- `plan_day_tasks` insert columns are present in schema history:
  - `plan_day_id`
  - `task_template_id`
  - `is_required`
  - `sort_order`
  - `day_date`
  - `week_start_date`
  - `month_start_date`
  - `is_optional`
  - `quota_scope`
  - `quota_target`
  - `requirement_note`
  - `display_order`
- Weekly tasks follow the Adoration-style daily-row weekly quota model.
- `weekly_fast_or_penance` uses the same weekly quota shape as Adoration: `quota_scope = 'week'`, `quota_target = 1`.
- The draft does not create `temperance` task rows.
- The draft does not reuse `give_up_alcohol`.
- The draft does not create standalone `fast` task rows.

## Quota Findings

- Valid quota scope values observed in schema history are:
  - `week`
  - `month`
  - `last_week_of_month`
  - `null`
- The draft uses only:
  - `week`
  - `month`
  - `null`
- No invalid quota scope values were found.
- `adoration` uses `quota_scope = 'week'`, `quota_target = 1`.
- `weekly_fast_or_penance` uses `quota_scope = 'week'`, `quota_target = 1`.
- `confession` uses `quota_scope = 'month'`, `quota_target = 1`.

## Confession Review Note

`quota_scope = 'month'` is schema-compatible and is used by the August James draft pattern. The older active-plan Confession fix uses `last_week_of_month`, so the Gospel draft's monthly Confession behavior should receive human review before conversion to a real migration.

The current draft is compatible as SQL, but the product decision remains: use full-month monthly quota behavior, or change Gospel Confession to final-week-month behavior.

## Counts

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

## Idempotency And Regeneration

- The draft does not use destructive deletes.
- Re-running the draft as a future migration would upsert task templates, plan days, and plan day tasks by their conflict targets.
- Because there is no cleanup step, stale task rows could remain if a previous draft or future revision inserted a task slug that later gets removed from the intended task set.
- If the task set changes before the real migration, consider adding a narrowly scoped cleanup of `plan_day_tasks` only for `challenge_plans.slug = 'the-gospels-september-lent'` before re-inserting intended task rows.
- No broad or cross-plan delete should be used.

## Review-Only Safety

- The SQL draft starts with `begin;`.
- The SQL draft ends with `rollback;`.
- The SQL draft is under `supabase/generated`, not `supabase/migrations`.
- The SQL draft is clearly marked review-only.
- No SQL was executed during this audit.
- No migration file was created during this audit.
- No Supabase data was read, written, or mutated during this audit.

## Content Safety

- The draft does not include source attribution metadata as DB fields.
- Forbidden source metadata terms were not found as generated SQL fields:
  - `app.ascensionpress.com`
  - `sourceUrls`
  - `sourceMetadataSummary`
  - `"translation"`
- `Ascension` appears only as approved reading content/title text, not as source attribution metadata.
- No `temperance` task/template insert was found.
- No `give_up_alcohol` task row was found.
- No standalone `fast` task slug was found.
- Reading text, references, reflection prompts, day numbers, dates, titles, focus, notes, and day types were not changed by this audit.

## Risks And Open Review Items

- No definite schema compatibility blocker was found in the generated draft.
- Before executing any future real migration, verify the target Supabase database has actually run the prerequisite schema migrations. Do not assume committed migrations have been applied.
- Prerequisite schema areas to verify in the target database:
  - task metadata columns on `plan_day_tasks`
  - the `plan_day_tasks_quota_scope_check` constraint allowing `month`
  - `audience` on `task_templates`
  - Before You Read columns on `plan_days`
- Human decision still needed: whether Gospel Confession should keep `month` or use `last_week_of_month`.
- Human decision recommended: whether the real migration should include a narrowly scoped cleanup for Gospel plan task rows before insert.
- Review the challenge plan insert/update pattern before migration conversion if there is any chance the target database already has duplicate or split rows for the Gospel plan slug/name.

## Recommendation

The SQL draft is ready for human SQL/schema review. No generated SQL changes are required from this compatibility audit.

Before converting to a real migration or executing anywhere, make the Confession month-vs-final-week decision, decide whether to include a narrowly scoped task-row cleanup, and verify the target database schema has the required prior migrations applied.
