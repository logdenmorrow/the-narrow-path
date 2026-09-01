# Gospel Activation Plan and Execution Record

This document was originally the planning checklist. The activation was
explicitly approved and completed on September 1, 2026; the later rollback and
verification sections remain useful operational references.

## Status: Applied and Production-Verified

The Gospel season is live in production:

- Slug: `the-gospels-september-lent`
- Name: `The Gospels: From September to Lent`
- Total days: `162`
- Gospel Day 1: `2026-09-01`
- Gospel Day 162: `2027-02-09`
- Original 90-day challenge Day 1: `2026-04-06`
- Activation migration: `20260901120000_activate_gospels_september_lent.sql`
- Launch merge: `69eda36` via PR `#57`

Exactly one plan is active. The original and James plans are inactive and their
task/completion/reflection history was preserved.

## Executed Readiness State

Completed production verification:

- Gospel season content is active in production.
- Gospel Before You Read context is applied and production-verified.
- Gospel Daily Reading rendering is production-verified.
- Admin plan export no longer returns the previous Supabase relationship error.
- Focused signed-in launch audit passes: total `7`, passed `7`, failed `0`,
  across desktop and mobile.
- Dedicated production task-toggle and reflection-save mutations passed and
  restored their original test-account state.

The broad audit covered:

- Core signed-in pages: `/dashboard`, `/today`, `/this-week`,
  `/daily-reading`, `/reflection`, `/night-prayer`, `/rosary`, `/brotherhood`.
- Admin pages, including `/admin/plan`.
- Original Day 1 and Day 90 routes.
- Gospel preview routes.
- Expected download routes.

## Complete

Season-aware timing helpers are implemented:

- `getSeasonStartDateForPlan`
- `getSeasonTimingForPlan`

Season-aware timing refactors are complete for:

- `components/progress-strip.tsx`
- `lib/homepage-overview.ts`
- `app/brotherhood/page.tsx`
- `app/brotherhood/[userId]/page.tsx`
- `app/night-prayer/page.tsx`
- `app/rosary/page.tsx`
- `app/admin/plan/page.tsx`

Completed-season final-day labels now use the active plan total days in:

- `app/today/page.tsx`
- `app/dashboard/page.tsx`

Production audit tooling is in place:

- `scripts/scan-gospel-preview.mjs`
- `scripts/audit-production-pages.mjs`
- `docs/PRODUCTION_CHECKS.md`

## Remaining Operational Watch Items

- `lib/groupme-weekly.ts` is season-aware. `lib/groupme-nightly.ts` is driven by
  actual task dates rather than an April-based season offset.
- Keep the recurring monthly Liturgy of the Hours import healthy because the
  upstream source exposes a rolling date window.
- Continue to preserve exactly one active challenge plan.

Ongoing regression risks:

- Same-track Brotherhood/Sisterhood visibility must be preserved.
- Historical plan routes must remain read-only.
- Day/date math and Monday-Sunday quota boundaries must remain anchored to the
  Gospel plan dates.

## Executed Activation Sequence

The controlled launch followed this sequence:

1. Confirm final Gospel content and any final copy edits.
2. Confirm GroupMe weekly timing is season-aware and nightly timing is date-based.
3. Record pre-activation production inventory and history counts.
4. Prepare the activation migration or exact SQL.
5. If migration-based, run `npx supabase db push --dry-run`.
6. Review the dry-run output and verify only the intended migration/write would
   run.
7. Receive explicit human approval before the real production push/write.
8. Apply activation.
9. Verify exactly one active challenge plan.
10. Verify the Gospel plan is active.
11. Verify the original 90-day plan is inactive or archived as intended.
12. Verify Gospel day/date math.
13. Run the focused Gospel scanner.
14. Run signed-in desktop/mobile route and mutation audits.

## Historical Production Activation Checklist

The following checklist was used for the completed launch and remains a useful
template for future season transitions.

Before activation:

- Confirm final Gospel content.
- Confirm GroupMe is retired, refactored, or disabled.
- Confirm Supabase backup/export.
- Prepare activation migration or SQL.
- Run `npx supabase db push --dry-run` if migration-based.
- Verify only the intended migration/write is included.
- Require explicit human approval before the real push/write.

Activation:

- Apply activation only after approval.
- Do not bundle unrelated schema, content, or cleanup changes with activation.

After activation:

- Verify exactly one active challenge plan.
- Verify Gospel is active.
- Verify original plan is inactive or archived as intended.
- Verify day/date math:
  - Gospel Day 1 is `2026-09-01`.
  - Gospel Day 162 is `2027-02-09`.
  - Original Day 1 remains `2026-04-06`.
- Run `node scripts/scan-gospel-preview.mjs`.
- Run `node scripts/audit-production-pages.mjs`.

## Rollback Considerations

Rollback must be explicit and human-approved. Do not perform rollback as an
automatic script reaction unless a human has approved the exact state change.

Before rollback, check production state:

- Which `challenge_plans` row is active.
- Whether more than one `challenge_plans` row is active.
- The Gospel plan row by slug `the-gospels-september-lent`.
- The original plan row and its intended post-activation state.
- Whether users have created Gospel-season completions, reflections, check-ins,
  or prayer/status records after activation.
- Whether any notification, GroupMe, or admin action ran against the wrong
  active plan.

Planning-only read checks:

```sql
select id, slug, name, total_days, is_active
from public.challenge_plans
where is_active = true
   or slug in ('the-gospels-september-lent', 'the-narrow-path-90')
order by is_active desc, slug;

select cp.slug, pd.day_number, pd.day_date
from public.plan_days pd
join public.challenge_plans cp on cp.id = pd.plan_id
where cp.slug = 'the-gospels-september-lent'
  and pd.day_number in (1, 30, 75, 126, 160, 162)
order by pd.day_number;
```

If activation has already received real user traffic, also check whether Gospel
plan rows have related completions or reflections before changing active state.
Use the exact production schema at rollback time; do not guess column names.

Possible rollback state change:

- Set the Gospel plan inactive.
- Restore the original plan active only if that is the intended rollback state.
- Keep any user data review separate from the plan-active-state rollback.

Rollback verification should repeat the same active-plan checks and page audits
used after activation.

## Post-Activation Production Checks

Run these after deployment and activation, following the required production
check order in `docs/PRODUCTION_CHECKS.md`.

Core pages:

- `/dashboard`
- `/today`
- `/this-week`
- `/daily-reading`
- `/reflection`
- `/night-prayer`
- `/rosary`
- `/brotherhood`
- `/admin/plan`

Gospel day checks:

- Gospel Day 1
- Gospel Day 30
- Gospel Day 75
- Gospel Day 126
- Gospel Day 160
- Gospel Day 162

Suggested production URLs:

```text
https://thenarrowpath.xyz/today
https://thenarrowpath.xyz/this-week
https://thenarrowpath.xyz/daily-reading?day=1
https://thenarrowpath.xyz/daily-reading?day=30
https://thenarrowpath.xyz/daily-reading?day=75
https://thenarrowpath.xyz/daily-reading?day=126
https://thenarrowpath.xyz/daily-reading?day=160
https://thenarrowpath.xyz/daily-reading?day=162
https://thenarrowpath.xyz/reflection?day=1
https://thenarrowpath.xyz/night-prayer
https://thenarrowpath.xyz/rosary
https://thenarrowpath.xyz/brotherhood
https://thenarrowpath.xyz/admin/plan
```

## Notes

- Preserve Brotherhood/Sisterhood track-aware behavior.
- Do not expose Brotherhood users to Sisterhood users or vice versa.
- Do not add XP, levels, leaderboards, holiness scores, consistency scores, or
  other gamification.
- Keep copy functional, plainspoken, Catholic, and minimal.
- Task completion remains row-existence based: row exists means complete, no row
  means incomplete.
