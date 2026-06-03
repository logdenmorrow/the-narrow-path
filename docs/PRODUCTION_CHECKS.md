# Production Checks

Production checks verify the deployed app that real users are reaching. They are
useful after a release because they exercise the production URL, production
auth, deployed code, and production database reads together.

The Gospel preview scanner is:

```bash
node scripts/scan-gospel-preview.mjs
```

It checks selected admin-only Gospel preview pages on `https://thenarrowpath.xyz`
and writes a local JSON result file. The repo does not currently define an
`npm run scan:gospel-preview` alias; use the `node` command above unless a
future `package.json` adds one.

For The Narrow Path production scanner/test commands, default to the production
domain:

```text
https://thenarrowpath.xyz
```

Do not default examples to localhost unless explicitly documenting local
testing.

## Verification Matrix

Use the smallest category that matches the release. If a change spans multiple
categories, run each relevant row.

| Change type | Required verification |
| --- | --- |
| Normal UI/content changes | `npm run build`, broad production page audit after deployment, manual mobile smoke check if layout changed |
| Reading/season changes | `npm run build`, SQL verification for plan/readings, relevant scanner, manual Daily Reading mobile check |
| Privacy changes | `npm run build`, prayer visibility scanner with normal Brotherhood and Sisterhood users, RLS/SQL review |
| Push/cron changes | `npm run build`, `npm run lint`, `npx supabase db push --dry-run` if a migration is created, cron dry-run, one controlled real test after approval, verify logs |

## Required Order

Playwright production checks only prove the deployed production app is correct
after the code has actually reached production. Run them in this order:

1. Commit local code.
2. Push to GitHub.
3. Wait for GitHub Actions to finish successfully.
4. Wait for Watchtower to detect and pull the new Docker image.
5. Confirm the Unraid Docker container has recreated or updated.
6. Run the Playwright production scanner.
7. Review or paste the scanner JSON/log.

Running the scanner before the container updates can only verify the previous
production build.

## Gospel Preview Scanner

Run:

```powershell
node scripts/scan-gospel-preview.mjs
```

On the first run, the scanner opens a browser window and asks for a manual admin
login. After the dashboard loads, return to the terminal and press Enter. The
script saves local Playwright auth state to:

```text
playwright-auth.json
```

Later runs reuse that local auth state until it expires or is deleted.

The scanner writes local output to:

```text
gospel-preview-scan-log.json
```

If a page fails, copy the JSON/log into the follow-up task so the failure can be
reviewed with the exact URL, status, missing text, and forbidden text.

## Broad Page Audit

For a one-time read-only smoke check across known production page routes, run:

```bash
node scripts/audit-production-pages.mjs
```

Use this only after the deployment chain has completed. The audit uses the same
local Playwright admin login state as the Gospel preview scanner. On the first
run, it opens a browser, asks for manual admin login, and saves
`playwright-auth.json`.

The broad audit visits known safe page routes, representative day URLs, Gospel
admin preview URLs, admin/support pages that exist in the repo, and up to three
member detail pages discovered from `/brotherhood`. It does not click buttons,
submit forms, intentionally visit logout routes, or scan `/api` mutation routes.
Expected download routes such as `/admin/plan/export` and
`/admin/challenge-feedback/download` are handled as download checks. The audit
passes those routes when Playwright observes the download starting and records
the suggested filename when the browser provides one.

It writes local-only output to:

```text
production-page-audit-log.json
production-page-audit-summary.txt
```

Review or paste the JSON log if anything fails.

## Prayer Request Visibility Scanner

The prayer visibility scanner verifies the private/shared prayer request rules
with normal Brotherhood and Sisterhood accounts. Admin smoke checks are useful,
but they do not prove normal-user RLS/privacy.

Set up local auth states with dedicated test accounts:

```powershell
npm run scan:prayer-visibility -- --setup-auth admin --base-url https://thenarrowpath.xyz
npm run scan:prayer-visibility -- --setup-auth brotherhood --base-url https://thenarrowpath.xyz
npm run scan:prayer-visibility -- --setup-auth sisterhood --base-url https://thenarrowpath.xyz
```

Run the normal-user production privacy scan:

```powershell
$env:PLAYWRIGHT_ALLOW_MUTATIONS='true'
$env:PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS='true'
npm run scan:prayer-visibility -- --non-admin --headless --base-url https://thenarrowpath.xyz
```

The mutation flags must be the exact string value `true`. For non-local URLs,
both flags are required. The scanner creates only test-marked requests using
`PW_VISIBILITY_TEST_<timestamp>` markers and refuses to delete or overwrite
non-test prayer requests.

Local auth state paths:

```text
playwright/.auth/admin.json
playwright/.auth/brotherhood.json
playwright/.auth/sisterhood.json
```

Local output:

```text
prayer-request-visibility-scan-log.json
```

The latest documented production result used `https://thenarrowpath.xyz` with
normal Brotherhood and Sisterhood auth states: total `16`, passed privacy checks
`8`, failed `0`, skipped `0`. Final cleanup entries with
`marker_not_present` were expected because earlier cleanup had already removed
the temporary requests.

## Cron Dry-Runs

Use placeholders for secrets. Do not paste real `CRON_SECRET` values into docs
or chat.

Weekly recap announcement dry-run:

```powershell
curl.exe -H "Authorization: Bearer YOUR_CRON_SECRET" "https://thenarrowpath.xyz/api/cron/announcements/weekly-recap?dryRun=1"
```

Scheduled announcement push dry-run:

```powershell
curl.exe -H "Authorization: Bearer YOUR_CRON_SECRET" "https://thenarrowpath.xyz/api/cron/push/announcement-schedules?dryRun=1"
```

The weekly recap endpoint also supports `asOf=YYYY-MM-DD`. The scheduled
announcement push endpoint supports `limit`, capped at 50.

For scheduled announcement push changes, run the scheduled push dry-run after
deployment. If a real push test is needed, schedule one controlled visible
announcement push only after explicit approval, then verify the cron response,
schedule row, broadcast row, and delivery logs.

## Local Files

These files are local-only and must never be committed:

```text
playwright-auth.json
playwright/.auth/
.auth/
.env.playwright.local
gospel-preview-scan-log.json
gospel-preview-page-dump.txt
production-page-audit-log.json
production-page-audit-summary.txt
prayer-request-visibility-scan-log.json
```

They should stay in `.gitignore`.

## What This Does Not Replace

Playwright production checks verify UI behavior after deployment. They do not
replace Supabase SQL verification for database migrations.

For database work, continue to verify the database directly with the approved SQL
checks. Production-writing steps still require explicit human approval,
including:

- `npx supabase db push`
- plan activation
- destructive SQL
- any SQL that writes production data

## August James Activation

The internal August slug remains:

```text
ordinary-time-james
```

Before August 1, 2026, confirm the public plan name is
`James: Faith That Works`, the plan has been reviewed, and activation has been
explicitly approved. Do not run activation SQL or set `is_active` in production
without explicit approval. After activation, verify normal users do not see
admin-preview or locked inactive-plan behavior on August routes.

## Release Checklist

Use this after future production releases:

1. Confirm the intended code is committed and pushed.
2. Confirm GitHub Actions completed successfully.
3. Confirm Watchtower pulled the new image.
4. Confirm the Unraid container recreated or updated.
5. Run the relevant Playwright production scanner.
6. Review `gospel-preview-scan-log.json` or the scanner console output.
7. For migrations, separately confirm production data with SQL verification.
