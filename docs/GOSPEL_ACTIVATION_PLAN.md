# Gospel Activation Plan

This is a planning document only. It does not activate the Gospel season.

No migrations, Supabase commands, production writes, commits, pushes, or deploys
were performed while creating this document.

## Do Not Activate Yet

Do not activate the Gospel plan until the deferred GroupMe decision is resolved
and a human explicitly approves the activation write.

The Gospel season exists in production but must remain inactive for now.

- Slug: `the-gospels-september-lent`
- Name: `The Gospels: From September to Lent`
- Total days: `162`
- Gospel Day 1: `2026-09-01`
- Original 90-day challenge Day 1: `2026-04-06`

## Current Readiness State

The app is close to Gospel activation readiness, but activation remains a
separate production operation that requires explicit approval.

Completed production verification:

- Gospel season content is staged in production as inactive.
- Admin-only inactive Gospel preview is implemented and production-verified.
- Gospel Before You Read context is applied and production-verified.
- Gospel Daily Reading rendering is production-verified.
- Admin plan export no longer returns the previous Supabase relationship error.
- Broad Playwright production audit passes: total `44`, passed `44`, failed `0`.

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

## Deferred Or Risky

GroupMe remains the main deferred activation risk.

- `lib/groupme-weekly.ts` still needs to be retired, refactored, or disabled
  before Gospel activation if GroupMe remains in use.
- `lib/groupme-nightly.ts` should be reviewed for Gospel-season messaging and
  active-plan assumptions if GroupMe remains in use.
- GroupMe may be retired in favor of in-app announcements or notifications
  before the Gospel season begins.

Other activation risks:

- Activation is a production write to `challenge_plans` and must be treated as
  a controlled release step.
- There must be exactly one intended active challenge plan after activation.
- Same-track Brotherhood/Sisterhood visibility must be preserved.
- Gospel preview behavior should no longer be needed for normal users once the
  Gospel plan is active, but admin preview routes should still not expose
  inactive content incorrectly.
- Day/date math must be verified against `2026-09-01` for Gospel Day 1 and
  `2027-02-09` for Gospel Day 162.

## Proposed Later Activation Sequence

Do not execute this sequence from this document. Use it later only after an
explicit human activation decision.

1. Confirm final Gospel content and any final copy edits.
2. Confirm GroupMe is retired, refactored, or disabled for Gospel timing.
3. Confirm a current Supabase backup/export exists.
4. Prepare the activation migration or exact SQL.
5. If migration-based, run `npx supabase db push --dry-run`.
6. Review the dry-run output and verify only the intended migration/write would
   run.
7. Require explicit human approval before any real production push or write.
8. Apply activation.
9. Verify exactly one active challenge plan.
10. Verify the Gospel plan is active.
11. Verify the original 90-day plan is inactive or archived as intended.
12. Verify Gospel day/date math.
13. Run the focused Gospel scanner.
14. Run the broad production page audit.

## Production Activation Checklist

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
