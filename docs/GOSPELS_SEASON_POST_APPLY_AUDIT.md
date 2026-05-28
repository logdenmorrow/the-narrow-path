# Gospels Season Post-Apply Audit

Post-apply audit for the inactive Gospel season migration and Supabase CLI migration-history repair.

This document records Logan-confirmed production results. No SQL was executed during this documentation pass, and no Supabase data was read, written, or mutated by Codex.

## Supabase CLI Repair

- Supabase CLI migration history was repaired and normalized.
- Historical migration filenames were normalized to unique 14-digit prefixes.
- No skipped invalid migration filenames remain.
- Production schema verification passed before repair.
- Future database work should use normalized migration filenames and the Supabase CLI workflow.
- Do not manually paste large SQL into Supabase SQL Editor unless the CLI workflow is unavailable.

## Gospel Migration Apply

- `npx supabase db push --dry-run` showed only `20260527150103_add_gospels_september_lent_draft_plan.sql` before the real push.
- `npx supabase db push` was then run successfully by Logan.
- `npx supabase migration list` now shows `20260527150103` aligned in Local and Remote.
- The applied migration file is `supabase/migrations/20260527150103_add_gospels_september_lent_draft_plan.sql`.
- No Gospel season activation has been done.
- Gospel plan remains intended to be inactive. Logan should confirm or has confirmed `is_active = false`.

## Production Counts

- Gospel `plan_days` count: 162.
- Gospel `plan_day_tasks` count: 1,481.

| Task slug | Rows |
| --- | ---: |
| `adoration` | 162 |
| `attend_mass` | 23 |
| `check_in_anchor` | 162 |
| `confession` | 162 |
| `night-prayer` | 162 |
| `reading` | 162 |
| `reflection` | 162 |
| `rosary` | 162 |
| `weekly_fast_or_penance` | 162 |
| `workout` | 162 |
| **Total** | **1,481** |

## Task And Content Notes

- `weekly_fast_or_penance` is present with 162 task rows.
- `temperance` remains an app/season rule, not a task row.
- `give_up_alcohol` was not used for this Gospel season.
- Standalone `fast` was not used for this Gospel season.
- Before You Read fields remain deferred for later work.
- No Gospel content changes were made during this post-apply audit.

## Final Status

The inactive Gospel season draft plan has been applied to production with the expected counts, and the Supabase CLI migration workflow is now suitable for future migration work after normal `db push --dry-run` review.
