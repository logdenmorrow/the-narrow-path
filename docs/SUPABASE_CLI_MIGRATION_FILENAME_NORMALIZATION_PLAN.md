# Supabase CLI Migration Filename Normalization Plan

This plan records the filename normalization strategy and the follow-up remote-history repair needed before `db push` can be safe.

The current `npx supabase migration list` output was referenced in the request but not pasted into this prompt. This plan uses the local `supabase/migrations` filenames plus the reported CLI behavior: duplicate local versions still show blank Remote values after the first repair pass.

## Why The First Repair Pass Was Not Enough

The first repair pass marked historical short versions as applied remotely, for example `20260413` and `20260512`.

That helps only when a local migration version is unique. It does not solve duplicate local versions because Supabase CLI keys migrations by the timestamp prefix before the first underscore. If four local files all start with `20260413_`, they all have the same CLI version: `20260413`.

Only one local file can line up cleanly with the one remote `20260413` history row. The remaining local files with that same prefix still appear unmatched, so the CLI can still treat them as pending.

## Why `db push` Is Still Unsafe

`npx supabase db push` is still unsafe because the local migration set is not normalized:

- duplicate version groups remain
- three historical files are skipped by the CLI
- the first repair pass inserted short remote history rows that do not correspond one-to-one with all local files
- the Gospel migration `20260527150103` must remain pending until separately approved

Until `migration list` shows a clean local/remote alignment, `db push` could attempt to replay historical migrations or apply the Gospel migration early.

Do not run:

```powershell
npx supabase db push
npx supabase migration up
npx supabase migration repair
```

## Long-Term Fix

The long-term fix should be:

1. Rename historical migration files to unique 14-digit timestamp prefixes.
2. Preserve every SQL file's contents exactly.
3. Preserve historical order and dependencies.
4. Repair remote migration history to remove the short/duplicate version records inserted during the first repair pass.
5. Repair remote migration history to mark the new unique historical versions as applied.
6. Leave `20260527150103` pending.

This converts the repo from "several files share one CLI version" into "each historical migration has one unique CLI version."

## Current Filename Findings

Total local migration SQL files: 26.

Skipped invalid filenames:

- `2026-05-09-add-admin-hidden-and-support-requests.sql`
- `2026-05-09-add-sisterhood-track-foundation.sql`
- `2026-05-09-update-profile-trigger-for-tracks.sql`

Duplicate/ambiguous versions:

- `20260413`
- `20260509`
- `20260512`
- `20260516`
- `20260518`
- `20260519`

Currently unique short versions:

- `20260511`
- `20260517`

Currently unique 14-digit historical versions:

- `20260517210000`
- `20260517220000`

Pending Gospel version:

- `20260527150103`

## Rename Map

This is the approved local rename map for the filename-only normalization pass.

The timestamps are spaced by ten minutes within each historical day so ordering is explicit and future insertions remain possible.

| Current file | Proposed file |
| --- | --- |
| `20260413_add_reflection_journaling_flow.sql` | `20260413090000_add_reflection_journaling_flow.sql` |
| `20260413_backfill_missing_reflection_prompts.sql` | `20260413091000_backfill_missing_reflection_prompts.sql` |
| `20260413_differentiate_duplicate_focus_notes.sql` | `20260413092000_differentiate_duplicate_focus_notes.sql` |
| `20260413_encrypt_reflection_entries.sql` | `20260413093000_encrypt_reflection_entries.sql` |
| `2026-05-09-add-sisterhood-track-foundation.sql` | `20260509090000_add_sisterhood_track_foundation.sql` |
| `2026-05-09-update-profile-trigger-for-tracks.sql` | `20260509091000_update_profile_trigger_for_tracks.sql` |
| `20260509_add_daily_status_and_prayer_requests.sql` | `20260509092000_add_daily_status_and_prayer_requests.sql` |
| `20260509_mark_universal_tasks_shared.sql` | `20260509093000_mark_universal_tasks_shared.sql` |
| `2026-05-09-add-admin-hidden-and-support-requests.sql` | `20260509094000_add_admin_hidden_and_support_requests.sql` |
| `20260511_add_profile_last_active.sql` | `20260511090000_add_profile_last_active.sql` |
| `20260512_ensure_task_metadata_schema.sql` | `20260512090000_ensure_task_metadata_schema.sql` |
| `20260512_make_rosary_optional_other_days.sql` | `20260512091000_make_rosary_optional_other_days.sql` |
| `20260512_z_backfill_plan_day_task_metadata.sql` | `20260512092000_backfill_plan_day_task_metadata.sql` |
| `20260512_zz_fix_confession_final_week_windows.sql` | `20260512093000_fix_confession_final_week_windows.sql` |
| `20260512_zzz_add_night_prayer_phase1.sql` | `20260512094000_add_night_prayer_phase1.sql` |
| `20260516_add_push_notification_foundation.sql` | `20260516090000_add_push_notification_foundation.sql` |
| `20260516_add_daily_reminder_preferences.sql` | `20260516091000_add_daily_reminder_preferences.sql` |
| `20260516_allow_layout_display_support_issue.sql` | `20260516092000_allow_layout_display_support_issue.sql` |
| `20260517_update_daily_reminder_sends_dedupe.sql` | `20260517090000_update_daily_reminder_sends_dedupe.sql` |
| `20260518_add_day90_feedback_and_give_thanks.sql` | `20260518090000_add_day90_feedback_and_give_thanks.sql` |
| `20260518_zz_add_august_james_draft_plan.sql` | `20260518091000_add_august_james_draft_plan.sql` |
| `20260519_add_plan_day_reading_context.sql` | `20260519090000_add_plan_day_reading_context.sql` |
| `20260519_update_day90_give_thanks_reading_copy.sql` | `20260519091000_update_day90_give_thanks_reading_copy.sql` |

No rename proposed:

| File | Reason |
| --- | --- |
| `20260517210000_add_notification_reminder_slots.sql` | Already unique 14-digit historical version. |
| `20260517220000_disable_legacy_daily_reminder_preferences.sql` | Already unique 14-digit historical version. |
| `20260527150103_add_gospels_september_lent_draft_plan.sql` | Already unique 14-digit version and must remain pending. |

## Should Unique Short Versions Be Renamed?

Yes. `20260511` and `20260517` are currently unique, but they should still be renamed to 14-digit timestamps for consistency and to avoid keeping any short-version remote history rows.

The final target should be: every valid historical migration has a unique 14-digit prefix.

## Remote History Rows To Revert Later

The first repair pass likely inserted these short remote history versions. They should be candidates for `reverted` repair during the future normalization pass:

- `20260413`
- `20260509`
- `20260511`
- `20260512`
- `20260516`
- `20260517`
- `20260518`
- `20260519`

Human decision: do not revert the already-good 14-digit remote history rows unless a later check proves it is necessary:

- `20260517210000`
- `20260517220000`

Those files are already unique 14-digit filenames and already aligned remotely, so leave them untouched.

## New Final Historical Versions To Mark Applied

After renaming and after production verification passes, these final historical versions should be marked applied:

- `20260413090000`
- `20260413091000`
- `20260413092000`
- `20260413093000`
- `20260509090000`
- `20260509091000`
- `20260509092000`
- `20260509093000`
- `20260509094000`
- `20260511090000`
- `20260512090000`
- `20260512091000`
- `20260512092000`
- `20260512093000`
- `20260512094000`
- `20260516090000`
- `20260516091000`
- `20260516092000`
- `20260517090000`
- `20260518090000`
- `20260518091000`
- `20260519090000`
- `20260519091000`

Leave pending:

- `20260527150103`

## Future Command Sequence

DO NOT RUN YET.

After human approval, the sequence should be:

1. Verify production schema/data using the read-only verification script.
2. Confirm the working tree is clean.
3. Confirm files were renamed with `git mv`, preserving contents exactly.
4. Confirm no SQL content changed.
5. Revert old remote history rows from the first repair pass.
6. Mark the new final historical versions as applied.
7. Review `npx supabase migration list`.
8. Only after the list is clean, consider a dry run.

Possible future commands:

```powershell
# DO NOT RUN YET
git mv supabase/migrations/20260413_add_reflection_journaling_flow.sql supabase/migrations/20260413090000_add_reflection_journaling_flow.sql
git mv supabase/migrations/20260413_backfill_missing_reflection_prompts.sql supabase/migrations/20260413091000_backfill_missing_reflection_prompts.sql
git mv supabase/migrations/20260413_differentiate_duplicate_focus_notes.sql supabase/migrations/20260413092000_differentiate_duplicate_focus_notes.sql
git mv supabase/migrations/20260413_encrypt_reflection_entries.sql supabase/migrations/20260413093000_encrypt_reflection_entries.sql
git mv supabase/migrations/2026-05-09-add-sisterhood-track-foundation.sql supabase/migrations/20260509090000_add_sisterhood_track_foundation.sql
git mv supabase/migrations/2026-05-09-update-profile-trigger-for-tracks.sql supabase/migrations/20260509091000_update_profile_trigger_for_tracks.sql
git mv supabase/migrations/20260509_add_daily_status_and_prayer_requests.sql supabase/migrations/20260509092000_add_daily_status_and_prayer_requests.sql
git mv supabase/migrations/20260509_mark_universal_tasks_shared.sql supabase/migrations/20260509093000_mark_universal_tasks_shared.sql
git mv supabase/migrations/2026-05-09-add-admin-hidden-and-support-requests.sql supabase/migrations/20260509094000_add_admin_hidden_and_support_requests.sql
git mv supabase/migrations/20260511_add_profile_last_active.sql supabase/migrations/20260511090000_add_profile_last_active.sql
git mv supabase/migrations/20260512_ensure_task_metadata_schema.sql supabase/migrations/20260512090000_ensure_task_metadata_schema.sql
git mv supabase/migrations/20260512_make_rosary_optional_other_days.sql supabase/migrations/20260512091000_make_rosary_optional_other_days.sql
git mv supabase/migrations/20260512_z_backfill_plan_day_task_metadata.sql supabase/migrations/20260512092000_backfill_plan_day_task_metadata.sql
git mv supabase/migrations/20260512_zz_fix_confession_final_week_windows.sql supabase/migrations/20260512093000_fix_confession_final_week_windows.sql
git mv supabase/migrations/20260512_zzz_add_night_prayer_phase1.sql supabase/migrations/20260512094000_add_night_prayer_phase1.sql
git mv supabase/migrations/20260516_add_push_notification_foundation.sql supabase/migrations/20260516090000_add_push_notification_foundation.sql
git mv supabase/migrations/20260516_add_daily_reminder_preferences.sql supabase/migrations/20260516091000_add_daily_reminder_preferences.sql
git mv supabase/migrations/20260516_allow_layout_display_support_issue.sql supabase/migrations/20260516092000_allow_layout_display_support_issue.sql
git mv supabase/migrations/20260517_update_daily_reminder_sends_dedupe.sql supabase/migrations/20260517090000_update_daily_reminder_sends_dedupe.sql
git mv supabase/migrations/20260518_add_day90_feedback_and_give_thanks.sql supabase/migrations/20260518090000_add_day90_feedback_and_give_thanks.sql
git mv supabase/migrations/20260518_zz_add_august_james_draft_plan.sql supabase/migrations/20260518091000_add_august_james_draft_plan.sql
git mv supabase/migrations/20260519_add_plan_day_reading_context.sql supabase/migrations/20260519090000_add_plan_day_reading_context.sql
git mv supabase/migrations/20260519_update_day90_give_thanks_reading_copy.sql supabase/migrations/20260519091000_update_day90_give_thanks_reading_copy.sql
```

```powershell
# DO NOT RUN YET
npx supabase migration repair --status reverted 20260413
npx supabase migration repair --status reverted 20260509
npx supabase migration repair --status reverted 20260511
npx supabase migration repair --status reverted 20260512
npx supabase migration repair --status reverted 20260516
npx supabase migration repair --status reverted 20260517
npx supabase migration repair --status reverted 20260518
npx supabase migration repair --status reverted 20260519
```

```powershell
# DO NOT RUN YET
npx supabase migration repair --status applied 20260413090000
npx supabase migration repair --status applied 20260413091000
npx supabase migration repair --status applied 20260413092000
npx supabase migration repair --status applied 20260413093000
npx supabase migration repair --status applied 20260509090000
npx supabase migration repair --status applied 20260509091000
npx supabase migration repair --status applied 20260509092000
npx supabase migration repair --status applied 20260509093000
npx supabase migration repair --status applied 20260509094000
npx supabase migration repair --status applied 20260511090000
npx supabase migration repair --status applied 20260512090000
npx supabase migration repair --status applied 20260512091000
npx supabase migration repair --status applied 20260512092000
npx supabase migration repair --status applied 20260512093000
npx supabase migration repair --status applied 20260512094000
npx supabase migration repair --status applied 20260516090000
npx supabase migration repair --status applied 20260516091000
npx supabase migration repair --status applied 20260516092000
npx supabase migration repair --status applied 20260517090000
npx supabase migration repair --status applied 20260518090000
npx supabase migration repair --status applied 20260518091000
npx supabase migration repair --status applied 20260519090000
npx supabase migration repair --status applied 20260519091000
npx supabase migration list
npx supabase db push --dry-run
```

Do not mark `20260527150103` as applied in this repair pass.

## Safety Checklist Before Any Future Repair

- Production verification passed.
- The full current `npx supabase migration list` output has been pasted into the work item and reviewed.
- All historical migration SQL contents are preserved exactly.
- File changes are renames only.
- No Gospel content changes.
- Gospel migration remains pending.
- Existing aligned remote rows `20260517210000` and `20260517220000` remain untouched.
- `npx supabase migration list` is reviewed after repair.
- No `db push` until a dry run shows only the Gospel migration pending.
- The Gospel migration is still reviewed separately before any real push.

## Final Target State

- No invalid skipped filenames.
- No duplicate local versions.
- No remote-only old short versions.
- All verified historical migrations appear applied remotely under unique 14-digit versions.
- `20260527150103` is the only pending local migration.
- A future `npx supabase db push --dry-run` should show only the Gospel migration.

## Blocker / Review Input

The current `npx supabase migration list` output was not included in this prompt. Before executing any future repair, paste the exact list output into the review so remote-only rows, local-only rows, and ordering can be checked against this plan.
