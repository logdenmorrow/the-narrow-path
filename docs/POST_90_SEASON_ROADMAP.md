# Post-90 Season Roadmap

This note records the current plan after the first 90-day challenge. Treat the local repo and applied Supabase migrations as the source of truth before changing code or data.

## Day 90: July 4, 2026

Special Celebration day. Food, drink, and social media restrictions are relaxed for this day only.

- Challenge Feedback is Supabase-backed and exportable from `/admin/challenge-feedback`.
- Challenge Feedback opens on Day 90 / July 4 and remains available through July 31.
- Challenge Feedback is not treated as overdue or required after July 4.
- Give Thanks is a real Day 90 reading-only task at `/give-thanks?plan=the-narrow-path-90&day=90`.
- Give Thanks uses a curated reading based on selected sections of Vatican II's *Dignitatis Humanae*.
- Production manual check of the reset/feedback behavior looked good.

## July 5-31, 2026: Challenge Complete / Reset

July reset is implemented as code-level reset state, not as a July database
plan. It does not show Daily Reading or Scripture Reflection as active July
tasks.

No daily task pressure. Night Prayer, Rosary, Confession, community, past-day
review, and Challenge Feedback remain available as optional resources where
applicable.

`/today` also shows a read-only Today in the Church card. It is not a task, is
not completable, and does not write to task completions or daily check-ins.
June 8-July 31, 2026 calendar coverage and approved rich profiles are now live
from reviewed local JSON at `content/liturgical-calendar/us-2026.json` and
`content/liturgical-profiles/**`, with graceful fallback copy for dates that
have not been added yet. Follow `docs/TODAY_IN_THE_CHURCH_CONTENT_WORKFLOW.md`
and run `npm run scan:liturgical-content` before adding calendar/profile
content.

Optional and displaced observances are secondary. They can appear under related
observances on the detail page, but they must not replace the primary
liturgical day. The primary date still supports one main `profile_slug`.
Related observance profiles display only when approved or locked.

## August 1-31, 2026: James: Faith That Works

A lighter Scripture bridge season after the 90 days. The public display name is
`James: Faith That Works`; the internal slug remains `ordinary-time-james`.

Required/planned:

- Daily Reading from James
- Required reflection based on that day's James reading
- Sunday Mass expected/required
- Adoration required once per week
- Confession required once in August

Optional:

- Night Prayer
- Rosary
- Workout
- Anchor Check-In
- Community

Working display-only outline:

- Aug 1-6: James 1
- Aug 7-12: James 2
- Aug 13-18: James 3
- Aug 19-24: James 4
- Aug 25-31: James 5

June 3 readiness status: James content and task rows appear ready, but the plan
remains inactive. A read-only readiness audit found no Critical or High issues.
Activation must not happen without explicit approval.

The August James content draft lives here:

```text
docs/AUGUST_JAMES_CONTENT_TEMPLATE.md
```

It contains the 31-day James content reference used for review. Production data
has since been verified with 31 loaded days, 0 reading-integrity errors, and
only the acceptable Day 1 previous-summary warning.

Initial James import migration:

```text
supabase/migrations/20260518091000_add_august_james_draft_plan.sql
```

This migration created the inactive 31-day James plan for admin/data review.
The later production DB migration
`20260603120000_update_august_james_public_name.sql` updated the public name by
slug to `James: Faith That Works`.

Latest production verification confirmed:

```text
slug: ordinary-time-james
name: James: Faith That Works
total_days: 31
is_active: false
```

Do not make that plan active until the launch has been reviewed and explicitly
approved.

Implementation notes:

- Current reading content is stored on `plan_days` using `reading_mission`, `reading_focus`, `reading_title`, `reading_reference`, `reading_notes`, `reading_text`, and `reflection_prompt`.
- Current task assignments use `task_templates` and `plan_day_tasks`.
- Primary day-review pages now use date/plan-aware resolution; some non-core
  routes still load the single `challenge_plans.is_active = true` plan and/or
  use older challenge timing assumptions.
- Current active production plan count remains 1: `the-narrow-path-90`.
- Before August activation, either keep exactly one active plan at a time or
  harden the remaining routes to use shared season resolution.
- If August 1 arrives without activation, James can resolve by date/slug while
  still inactive and may show locked/admin-preview behavior. This is a Medium
  activation hygiene risk, not a current production blocker.
- Do not mark a second plan active without first updating plan/season selection
  logic; existing `.maybeSingle()` queries expect one active plan.
- Before August 1, confirm the `ordinary-time-james` row is reviewed and
  intentionally activated only after explicit approval.
- August task data should include reading/reflection, Sunday Mass, weekly Adoration, monthly Confession, and optional prayer/community tasks. It should not include the original food, drink, cold shower, social media, fasting, or meat-abstinence challenge restrictions.
- Current task progress code supports `quota_scope = 'month'` for August Confession. Review dashboard summary copy before the plan is made active so the monthly requirement is surfaced clearly.

Routing convention:

- `/today` means the current day in the currently resolved season.
- `?plan=<slug>&day=<number>` is the preferred stable review and deep-link format for plan days.
- Bare `?day=<number>` remains a legacy shortcut and should keep working for existing shared links.
- During August, use `/today?plan=ordinary-time-james&day=10` instead of relying on `/today?day=10`.

Activation caution:

- Do not activate without explicit approval.
- Keep exactly one active plan unless the remaining active-plan-only routes have
  been hardened.
- After activation, verify normal users do not see inactive/admin-preview/locked
  behavior on August routes.

## September 1, 2026 - February 9, 2027: The Gospels

Read the Gospels from September to Lent in this order:

```text
Mark -> Matthew -> Luke -> John
```

Keep this as future metadata until daily Gospel splits are intentionally authored.

## February 10 - March 28, 2027: Lent 2027

Planned as a separate stricter Lenten challenge. Do not build the full Lent 2027 challenge until the plan is provided.

## Product Rules

- Do not add XP, levels, leaderboards, holiness scores, consistency scores, or gamified spirituality.
- Keep copy plainspoken and minimal.
- Preserve Brotherhood/Sisterhood track-aware behavior.
- Keep `/brotherhood` as the shared internal community route unless explicitly told otherwise.
