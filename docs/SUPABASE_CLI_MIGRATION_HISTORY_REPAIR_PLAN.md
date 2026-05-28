# Supabase CLI Migration History Repair Plan

This is a docs-only safety plan for repairing Supabase CLI migration history before using `db push` for future The Narrow Path migrations.

No commands in this plan were run during creation. Do not run the repair sequence until production schema evidence has been reviewed and approved.

## Current Situation

- Supabase CLI login completed.
- The local repo was linked to project ref `zpylquqbmnhiuetoljgl`.
- `npx supabase migration list` shows local migrations, but blank Remote values.
- Three historical migration files are skipped by Supabase CLI because their filenames do not match the CLI pattern:
  - `2026-05-09-add-admin-hidden-and-support-requests.sql`
  - `2026-05-09-add-sisterhood-track-foundation.sql`
  - `2026-05-09-update-profile-trigger-for-tracks.sql`
- The Gospel migration exists locally and must remain pending:
  - `20260527150103_add_gospels_september_lent_draft_plan.sql`

## Why `db push` Is Unsafe Right Now

Supabase CLI decides what to run by comparing local migration versions against remote migration history. If the remote history is blank, the CLI can treat old local migrations as unapplied even when production already has the schema/data changes from manual SQL Editor runs or other deployment paths.

Running `db push` now could replay old migrations against production. Some migrations are idempotent, but not all historical data changes should be assumed harmless when replayed. The Gospel migration would also be visible as pending and could be applied before the target database is intentionally cleared for it.

Do not run these commands yet:

```powershell
npx supabase db push
npx supabase migration up
npx supabase migration repair
```

## Why Remote History Can Be Blank

A committed migration file does not prove Supabase has a matching row in migration history. Likewise, SQL pasted into Supabase SQL Editor can change production schema/data without adding a Supabase CLI migration-history row.

So the current state can be:

- production schema already contains many old migration effects
- remote migration history is blank or not aligned
- CLI therefore believes old local migration versions still need to run

The safe path is to verify production schema/data first, then mark only verified historical versions as applied in migration history.

## How Supabase CLI Compares Migrations

For valid migration filenames, Supabase CLI uses the timestamp prefix before the first underscore as the migration version. The expected filename shape is:

```text
<timestamp>_<name>.sql
```

Examples:

- `20260519_add_plan_day_reading_context.sql` has version `20260519`.
- `20260527150103_add_gospels_september_lent_draft_plan.sql` has version `20260527150103`.

Several historical files use short 8-digit date versions. Multiple files share the same version, which makes them ambiguous as separate CLI history entries.

## Local Filename Findings

Total local SQL migration files: 26.

CLI-valid filenames: 23.

Skipped invalid filenames: 3.

### Skipped Invalid Filenames

These do not match `<timestamp>_name.sql` and are skipped by Supabase CLI:

| File | Expected production evidence |
| --- | --- |
| `2026-05-09-add-admin-hidden-and-support-requests.sql` | `app_admins`, `support_requests`, profile admin/visibility columns, admin helper function |
| `2026-05-09-add-sisterhood-track-foundation.sql` | `profiles.gender`, `profiles.track`, `task_templates.audience`, track/audience constraints |
| `2026-05-09-update-profile-trigger-for-tracks.sql` | `handle_new_user` supports `gender` and `track` |

Do not rename these files in this repair pass. Renaming old migrations can create a different kind of history mismatch. Treat them as historical manually-applied/skipped files and verify their effects directly.

### Duplicate Or Ambiguous Versions

These versions are shared by multiple local files:

| Version | Local files |
| --- | --- |
| `20260413` | `20260413_add_reflection_journaling_flow.sql`; `20260413_backfill_missing_reflection_prompts.sql`; `20260413_differentiate_duplicate_focus_notes.sql`; `20260413_encrypt_reflection_entries.sql` |
| `20260509` | `20260509_add_daily_status_and_prayer_requests.sql`; `20260509_mark_universal_tasks_shared.sql` |
| `20260512` | `20260512_ensure_task_metadata_schema.sql`; `20260512_make_rosary_optional_other_days.sql`; `20260512_z_backfill_plan_day_task_metadata.sql`; `20260512_zz_fix_confession_final_week_windows.sql`; `20260512_zzz_add_night_prayer_phase1.sql` |
| `20260516` | `20260516_add_daily_reminder_preferences.sql`; `20260516_add_push_notification_foundation.sql`; `20260516_allow_layout_display_support_issue.sql` |
| `20260518` | `20260518_add_day90_feedback_and_give_thanks.sql`; `20260518_zz_add_august_james_draft_plan.sql` |
| `20260519` | `20260519_add_plan_day_reading_context.sql`; `20260519_update_day90_give_thanks_reading_copy.sql` |

Because repair works by version, verify every file in a duplicate-version group before marking that version as applied.

### Unique Valid Versions

| Version | Local file |
| --- | --- |
| `20260511` | `20260511_add_profile_last_active.sql` |
| `20260517` | `20260517_update_daily_reminder_sends_dedupe.sql` |
| `20260517210000` | `20260517210000_add_notification_reminder_slots.sql` |
| `20260517220000` | `20260517220000_disable_legacy_daily_reminder_preferences.sql` |
| `20260527150103` | `20260527150103_add_gospels_september_lent_draft_plan.sql` |

## Production Verification Before Repair

Run this read-only script manually in Supabase SQL Editor:

```text
supabase/generated/verify-existing-migrations-before-repair.sql
```

The script does not query `supabase_migrations.schema_migrations`. Some Supabase SQL Editor sessions do not expose that relation. This verification checks actual production schema/data evidence instead.

Good results:

- required old tables and columns return `PASS`
- quota scope allows `week`, `month`, `last_week_of_month`, and null
- required base and feature task templates exist
- August James either exists inactive with expected rows, or is explicitly reviewed if absent
- Day 90 Give Thanks/feedback evidence is present, or explicitly reviewed if absent
- Gospel plan is absent before the Gospel migration, so `20260527150103` remains pending

Stop conditions:

- any required schema evidence returns `STOP`
- the Gospel plan already exists unexpectedly
- duplicate-version groups are only partially represented in production
- invalid-file production evidence is missing but later valid migrations depend on it

## Likely Versions To Mark Applied After Verification

If production verification confirms the old schema/data evidence, these valid local versions are likely historical and should be marked applied:

- `20260413`
- `20260509`
- `20260511`
- `20260512`
- `20260516`
- `20260517`
- `20260517210000`
- `20260517220000`
- `20260518`
- `20260519`

Keep this version pending:

- `20260527150103`

The three invalid filename migrations cannot be cleanly represented by their current filenames in CLI history. Verify their production effects, document them as historical skipped files, and do not rely on CLI to replay them.

## Why `migration repair --status applied` Is The Likely Long-Term Fix

After production evidence confirms old migrations are already present, `migration repair --status applied` can align remote migration history with local valid versions without re-running their SQL. That is the long-term fix for making future `db push` safe: the CLI will see old verified versions as already applied and only consider genuinely new valid migrations pending.

Repair should happen only after human approval because it mutates migration history.

## Proposed Future Command Sequence

DO NOT RUN YET.

After human approval, and only after the verification script supports marking old versions applied:

```powershell
npx supabase migration repair --status applied 20260413
npx supabase migration repair --status applied 20260509
npx supabase migration repair --status applied 20260511
npx supabase migration repair --status applied 20260512
npx supabase migration repair --status applied 20260516
npx supabase migration repair --status applied 20260517
npx supabase migration repair --status applied 20260517210000
npx supabase migration repair --status applied 20260517220000
npx supabase migration repair --status applied 20260518
npx supabase migration repair --status applied 20260519
```

Then, still before any push:

```powershell
npx supabase migration list
```

Expected after approved repair:

- old verified versions show as applied remotely
- invalid filename files may still be skipped locally
- `20260527150103` remains local-only/pending until the Gospel migration is intentionally applied

Only after another human review should a future `db push` be considered.

## Long-Term Rules Going Forward

- New migration filenames should use unique timestamp prefixes, preferably 14 digits: `YYYYMMDDHHMMSS_name.sql`.
- Do not add multiple files with the same timestamp prefix.
- Do not add hyphenated date filenames.
- Do not edit old migration files after they may have run.
- If a historical migration needs a fix, create a new correctly named migration.
- Keep production migration history and Git migrations aligned after every approved database change.
