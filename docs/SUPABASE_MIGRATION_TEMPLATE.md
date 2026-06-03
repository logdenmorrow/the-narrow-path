# Supabase Migration Template

Use this checklist before adding a migration.

## Filename

Use a 14-digit UTC timestamp and a short action name:

```text
YYYYMMDDHHMMSS_describe_change.sql
```

Never edit old migrations that may already have run. Add a new forward
migration instead.

## Migration Checklist

- Wrap changes in `begin;` and `commit;` unless the SQL operation cannot run in a transaction.
- Add explicit grants for new public tables.
- Enable RLS for new public tables.
- Add the required read/write policies for each role and access path.
- Add useful indexes for foreign keys, lookup columns, route filters, and scheduled jobs.
- Keep production-writing steps behind explicit approval unless the user has specifically authorized them.
- For content migrations, never invent or manually fill Scripture text.

## Dry Run

Before any real push, run:

```powershell
npx supabase db push --dry-run
```

Review the exact output before requesting approval for a real production-writing
step.

## Post-Push Verification

After an approved real push, verify the database directly with SQL checks that
prove the intended rows, policies, grants, indexes, and RLS behavior are present.
Playwright production checks do not replace SQL verification for database work.
