# Gospel Activation and Post-Apply Audit

This document began as the pre-activation timing and visibility audit. The
original findings remain below for history; this top section records the final
September 1, 2026 production result.

## Final Verdict: Launched and Verified

The Gospel season is active in production. Migration
`20260901120000_activate_gospels_september_lent.sql` was dry-run, applied, and
then confirmed as the only remote migration delta. It changed only
`challenge_plans.is_active` after fail-closed integrity guards passed.

Post-apply state:

- sole active plan: `the-gospels-september-lent`
- name: `The Gospels: From September to Lent`
- plan days: `162`
- task assignments: `1,481`
- task date range: `2026-09-01` through `2027-02-09`
- duplicate day numbers: `0`
- duplicate day/task assignments: `0`
- missing week/month scope dates: `0`
- core reading/reflection content gaps: `0`

Historical-data preservation was verified before and after activation:

| Plan | Days | Tasks | Completions | Reflections |
|---|---:|---:|---:|---:|
| `the-narrow-path-90` | 90 | 1,402 | 941 | 91 |
| `ordinary-time-james` | 31 | 315 | 29 | 10 |
| `the-gospels-september-lent` | 162 | 1,481 | 0 | 0 |

The dedicated live task-toggle and reflection-save tests restored their exact
starting state, so the final Gospel history counts remained 0/0 at audit time.

## Final Implementation

Completed:

- Central definitions for original, James, and Gospel start/end dates.
- Fail-closed phase resolution: an inactive/mismatched Gospel plan can no
  longer fall back to James during the Gospel date phase.
- Explicit historical James/original links remain readable but server actions
  reject task and reflection writes.
- Monday-Sunday season week windows, including the partial Sep 1-6 opening
  week and Feb 8-9 closing week.
- Weekly and monthly quota progress on Dashboard, This Week, and community
  views using authoritative task scope metadata.
- Season-aware GroupMe weekly windows; nightly behavior remains date/task-row
  based and requires no season offset.
- Admin task-date and week-copy handling uses calendar week boundaries.
- Legacy `night-prayer` tasks map only to Compline, not Lauds/Vespers.
- Sep 1 Lauds, Vespers, and Compline content imported and verified (3 rows).
- Automated boundary, fail-closed resolver, signed-in route, task mutation,
  and reflection mutation coverage.

## Verification Evidence

- `npm test`: 2 files, 8 tests, all passed.
- `npx tsc --noEmit`: passed.
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed; 54 application routes built.
- `npm run scan:gospel-activation`: passed with zero issues.
- Signed-in production Gospel suite: 7/7 passed across 1440px desktop and
  390px mobile viewports.
- Live production task-toggle mutation: passed and restored initial state.
- Live production reflection-save mutation: passed, reloaded encrypted content,
  and restored the exact original reflection/completion state.
- PR `#57` merged as `69eda36`; the GHCR image workflow completed successfully,
  and the deployed build was identified by new quota/calendar and historical
  read-only behavior.

Remaining operational watch item: DivineOffice.org exposes a rolling lookahead
window. Continue the existing monthly Liturgy of the Hours import workflow so
future dates remain populated.

## Initial Audit Findings

The sections below preserve the original activation-readiness audit findings.

## Files Inspected

- `lib/challenge.ts`
- `lib/season-plan.ts`
- `lib/season-plan-server.ts`
- `lib/plan-day-url.ts`
- `components/progress-strip.tsx`
- `components/season-timeline.tsx`
- `app/today/page.tsx`
- `app/today/actions.ts`
- `app/this-week/page.tsx`
- `app/daily-reading/page.tsx`
- `app/reflection/page.tsx`
- `app/reflection/actions.ts`
- `app/dashboard/page.tsx`
- `app/admin/plan/page.tsx`
- `app/brotherhood/page.tsx`
- `app/brotherhood/[userId]/page.tsx`
- `app/challenge-feedback/page.tsx`
- `app/challenge-feedback/actions.ts`
- `app/give-thanks/page.tsx`
- `app/night-prayer/page.tsx`
- `app/rosary/page.tsx`
- `lib/homepage-overview.ts`
- `lib/groupme-weekly.ts`
- `lib/groupme-nightly.ts`

## Original 90-Day Assumptions Found

These are intentional original-challenge features and are not automatically
wrong, but they should stay isolated from Gospel activation:

- `lib/season-plan.ts` defines the original plan slug/name, total days, Day 90
  celebration date, and `isDay90Celebration`.
- `app/today/page.tsx` has Day 90 celebration task rules and copy. The guard
  checks `totalDays === 90`, so the special Day 90 rules should not affect the
  Gospel plan.
- `app/give-thanks/page.tsx` is explicitly limited to Day 90 of The Narrow Path
  90. This should not support Gospel inactive preview.
- `app/challenge-feedback/page.tsx` and `app/challenge-feedback/actions.ts`
  are Day 90-specific. They should remain original-plan-only, but their current
  active-plan lookup means the page will show unavailable once Gospel is active.
- `components/season-timeline.tsx` includes historical copy that the 90-day
  challenge closes July 4. This is timeline copy, not runtime timing.

Resolved copy cleanup:

- `app/today/page.tsx` and `app/dashboard/page.tsx` still label some completed
  season links with the original final day. These links now use the active
  plan's final day count.

## April 6, 2026 Start-Date Assumptions Found

The root source is `lib/challenge.ts`:

- `CHALLENGE_START_DATE = "2026-04-06"`
- `getChallengeTiming(totalDays)` calculates `currentDayNumber`,
  `weekStartDay`, and `weekNumber` from April 6.
- `getCurrentChallengeWeekWindow(totalDays)` calculates weekly windows from
  April 6.

Unsafe consumers for Gospel activation:

- `app/admin/plan/page.tsx` uses `getChallengeTiming(activePlan.total_days)`.
  It also uses `CHALLENGE_START_DATE` in `getPlanDayTaskDates`, so newly added
  or edited task rows for a future active Gospel plan could receive old
  April-based task dates.
- `app/brotherhood/page.tsx` uses `getChallengeTiming(activePlan.total_days)`
  for current day, max selectable day, and week window.
- `app/brotherhood/[userId]/page.tsx` uses `getChallengeTiming(activePlan.total_days)`
  for default day and locking/navigation behavior.
- `app/night-prayer/page.tsx` uses `getChallengeTiming(activePlan.total_days)`
  for default day, lock state, and the current-day jump link.
- `app/rosary/page.tsx` uses `getChallengeTiming(activePlan.total_days)` for
  default day and lock state.
- `components/progress-strip.tsx` uses `getChallengeTiming(activePlan.total_days)`
  for the sidebar/header day and week display.
- `lib/homepage-overview.ts` uses `getChallengeTiming(activePlanData.total_days)`
  to choose the current plan day for public overview metrics.
- `lib/groupme-weekly.ts` uses `getCurrentChallengeWeekWindow(typedPlan.total_days)`,
  which would build weekly recap windows from April 6.

Lower-risk or intentionally original consumers:

- `app/challenge-feedback/page.tsx` and `app/challenge-feedback/actions.ts` use
  `getChallengeTiming(activePlan.total_days)`, but the feature is already
  Day-90-gated and should not apply to Gospel.
- `lib/season-plan.ts` uses `CHALLENGE_START_DATE` for original-challenge
  helpers such as `getChallengeDayDate` and `isDay90Celebration`.

## Active-Plan-Only Logic Needing Future Season Handling

These routes/components load only `.eq("is_active", true)` and do not use
`resolveSeasonPlan`:

- `app/admin/plan/page.tsx`
- `app/brotherhood/page.tsx`
- `app/brotherhood/[userId]/page.tsx`
- `app/night-prayer/page.tsx`
- `app/rosary/page.tsx`
- `components/progress-strip.tsx`
- `lib/homepage-overview.ts`
- `lib/groupme-weekly.ts`
- `lib/groupme-nightly.ts`

`lib/groupme-nightly.ts` is less timing-sensitive because it queries task rows
by actual `day_date` for tomorrow. It should still be reviewed for Gospel
messaging and active-plan assumptions.

## Routes Safe As-Is

These routes already use `resolveSeasonPlan` and are safe for Gospel preview and
future Gospel timing in their current read paths:

- `/today`
- `/this-week`
- `/daily-reading`
- `/reflection`
- `/dashboard`

These server actions are also structurally safe for Gospel activation because
they use `resolveSeasonPlan` without allowing inactive preview writes:

- `app/today/actions.ts`
- `app/reflection/actions.ts`

These routes should not support inactive Gospel preview:

- `/brotherhood`
- `/brotherhood/[userId]`
- `/night-prayer`
- `/rosary`
- `/challenge-feedback`
- `/give-thanks`

They can remain active-plan-only, but they need season-aware timing before the
Gospel plan is activated.

## Unsafe Or Needs Refactor Before Activation

Activation blocker:

- Replace active-plan `getChallengeTiming(activePlan.total_days)` calls on
  Brotherhood, member detail, Night Prayer, Rosary, Admin Plan, and Progress
  Strip with season-aware timing based on the active plan slug/name.

High-risk supporting work:

- Update `lib/groupme-weekly.ts` to use a season-aware week window, or derive
  weekly recap dates from actual active plan task rows.
- Update `lib/homepage-overview.ts` to use active-plan season timing.
- Update `app/admin/plan/page.tsx` task-date generation so new/edited plan day
  tasks use the selected plan's season start date, not April 6.

Lower-risk cleanup:

- Completed-season navigation/copy in `/today` and `/dashboard` now uses the
  active plan's final day count.
- Keep `/give-thanks` and `/challenge-feedback` explicitly original-plan-only.

## Recommended Next Implementation Tasks

1. Add a small helper that resolves timing for a known active plan row using
   slug/name, returning `getSeasonTiming` with `2026-09-01` for the Gospel plan
   and `2026-04-06` for the original plan.
2. Refactor `app/brotherhood/page.tsx` and `app/brotherhood/[userId]/page.tsx`
   to use that helper while preserving Brotherhood/Sisterhood filtering.
3. Refactor `app/night-prayer/page.tsx` and `app/rosary/page.tsx` to use
   season-aware timing for default day, locks, and current-day navigation.
4. Refactor `components/progress-strip.tsx` and `lib/homepage-overview.ts` to
   use season-aware timing.
5. Refactor `app/admin/plan/page.tsx` timing and task-date generation before
   using the editor against Gospel days.
6. Refactor `lib/groupme-weekly.ts`; review `lib/groupme-nightly.ts` messaging
   and date assumptions.
7. Add production scanner coverage for the routes above after deployment,
   especially `/brotherhood`, `/night-prayer`, `/rosary`, and the progress strip.
