# Production Checks

Production checks verify the deployed app that real users are reaching. They are
useful after a release because they exercise the production URL, production
auth, deployed code, and production database reads together.

The first production scanner is the Gospel preview scanner:

```bash
node scripts/scan-gospel-preview.mjs
```

It checks selected admin-only Gospel preview pages on `https://thenarrowpath.xyz`
and writes a local JSON result file.

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

```bash
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

## Local Files

These files are local-only and must never be committed:

```text
playwright-auth.json
gospel-preview-scan-log.json
gospel-preview-page-dump.txt
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

## Release Checklist

Use this after future production releases:

1. Confirm the intended code is committed and pushed.
2. Confirm GitHub Actions completed successfully.
3. Confirm Watchtower pulled the new image.
4. Confirm the Unraid container recreated or updated.
5. Run the relevant Playwright production scanner.
6. Review `gospel-preview-scan-log.json` or the scanner console output.
7. For migrations, separately confirm production data with SQL verification.
