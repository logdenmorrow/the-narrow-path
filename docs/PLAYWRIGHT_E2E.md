# Playwright E2E

The E2E setup is designed for authenticated flows without committing credentials
or browser storage state. Auth state is written to `.auth/user.json`, which is
local-only and ignored by Git.

## Create A Dedicated Test User

Create a Supabase Auth user that is only used for Playwright. Use an email that
clearly identifies the account as test automation, such as:

```text
playwright-test@example.com
```

The `/today` mutation test refuses to run unless `PLAYWRIGHT_TEST_EMAIL`
contains `test`, `e2e`, or `playwright`. Keep this user out of real community
tracking and production reporting whenever possible.

## Environment Variables

Put local Playwright variables in `.env.playwright.local` or export them in your
shell. Do not commit this file.

```text
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_TEST_EMAIL=playwright-test@example.com
PLAYWRIGHT_TEST_PASSWORD=replace-with-test-password
PLAYWRIGHT_ALLOW_MUTATIONS=false
```

`PLAYWRIGHT_ALLOW_MUTATIONS=true` is required for tests that change app data,
including `/today` task completion toggles.

Production mutation tests are disabled by default. If you intentionally point
`PLAYWRIGHT_BASE_URL` at a non-local environment, the mutation tests still refuse
to run unless:

```text
PLAYWRIGHT_ALLOW_MUTATIONS=true
PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS=true
```

Use that only for a dedicated staging/test environment or with explicit human
approval. Do not run mutation tests against production user data.

## Generate Auth State

Start the app in one terminal:

```bash
npm run dev
```

Then generate browser auth state:

```bash
npm run test:e2e:auth
```

This logs in with `PLAYWRIGHT_TEST_EMAIL` and
`PLAYWRIGHT_TEST_PASSWORD`, then writes:

```text
.auth/user.json
```

Regenerate the file whenever the session expires or the test user password
changes.

## Run Tests

List tests without running browser actions:

```bash
npx playwright test --list
```

Run the authenticated E2E suite:

```bash
npm run test:e2e
```

Run only the `/today` toggle test:

```bash
npx playwright test tests/e2e/today-toggle.spec.ts --project=chromium
```

The `/today` toggle test changes `user_task_completions` rows for the dedicated
test user. It will skip unless mutation testing is explicitly enabled.

## Local-Only Files

These files and directories must stay uncommitted:

```text
.auth/
playwright-auth.json
test-results/
playwright-report/
.env.playwright.local
```

`playwright-auth.json` is still used by older one-off audit scripts. New E2E
tests use `.auth/user.json`.
