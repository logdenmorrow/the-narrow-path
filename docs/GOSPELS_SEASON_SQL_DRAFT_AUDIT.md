# Gospels Season SQL Draft Audit

Review-only SQL draft audit.

- Not a migration
- Not executed
- Not Supabase data
- Not live app content
- Before You Read context has not been generated

## Files Generated

- supabase/generated/the-gospels-september-lent-draft-plan-review.sql
- docs/GOSPELS_SEASON_SQL_DRAFT_AUDIT.md
- scripts/build-gospels-season-sql-draft.mjs

## Source

- Source artifact: content/gospels/the-gospels-september-lent-import-artifact.json
- Source artifact SHA-256: `df1311d0b62ce7048a4ab1c4696402537d602126d02d31062a77c95be80c3e10`
- SQL draft SHA-256: `59046c662daf8b9844e56c4886dd055e8c73f44edfaaa8f6d284f783f54e93a4`
- Generated at: 2026-05-27T18:50:25.764Z

## Plan

- Plan name: The Gospels: From September to Lent
- Plan slug: `the-gospels-september-lent`
- Total days: 162
- Date range: 2026-09-01 through 2027-02-09
- Active: false

## Counts

- Plan days generated: 162
- Base task rows from artifact: 1319
- Added `weekly_fast_or_penance` rows: 162
- Task rows generated: 1481
- Expected task row total: 1481
- Expected total matched: yes

## Task Counts By Slug

| Task slug | Rows |
| --- | ---: |
| adoration | 162 |
| attend_mass | 23 |
| check_in_anchor | 162 |
| confession | 162 |
| night-prayer | 162 |
| reading | 162 |
| reflection | 162 |
| rosary | 162 |
| weekly_fast_or_penance | 162 |
| workout | 162 |

## Quota Scopes Used

- month
- week

## Confirmations

- Input artifact has exactly 162 plan days: yes
- Generated SQL represents 162 plan days: yes
- Generated SQL represents 1,481 task rows: yes
- `weekly_fast_or_penance` is included: yes
- `temperance` is not inserted as task/template rows: yes
- `give_up_alcohol` is not reused: yes
- `fast` is not reused as a task slug: yes
- Before You Read fields are left null in the SQL draft: yes
- No generated SQL was executed: yes
- No migration file was created: yes
- No Supabase data was read, written, or mutated: yes
- No app behavior was changed: yes
- No reading text was changed from the artifact: yes
- No reflection prompt was changed from the artifact: yes
- No reading reference was changed from the artifact: yes
- Day metadata was generated directly from the artifact: yes
- No extraction/source attribution metadata is included in SQL: yes
- Raw `Ascension` text appears only where it is part of approved reading titles or reading text, not as source attribution.

## Task Strategy Notes

- Base August/James-style rows are included from the review artifact.
- `weekly_fast_or_penance` is added as a weekly quota task with daily rows across the season.
- `adoration` uses `quota_scope = 'week'` and `quota_target = 1`.
- `weekly_fast_or_penance` uses `quota_scope = 'week'` and `quota_target = 1`.
- `confession` uses `quota_scope = 'month'` and `quota_target = 1`.
- Confession using `month` should be reviewed before running a real migration because prior active-plan Confession work used final-week windows.
- Task dates are generated from each artifact day date, not from the original Narrow Path 90 start date.
- The SQL draft does not use destructive deletes. A future migration should decide whether a narrowly scoped cleanup is needed for repeated draft regeneration.

## Risks And Open Review Items

- Confirm the target database has all base task templates before running a future migration.
- Review the new `weekly_fast_or_penance` task template copy, cadence, sort order, and audience.
- Review whether monthly Confession should remain month-wide for this Gospel season or use a final-week window.
- Confirm the target schema has the Before You Read fields before converting this draft into a migration.
- Confirm the Gospel plan remains inactive until human review is complete.
- Convert this review draft into a dated migration only after SQL review.

## Validation Warnings

- None.

## Human Review

Ready for human SQL review: yes
