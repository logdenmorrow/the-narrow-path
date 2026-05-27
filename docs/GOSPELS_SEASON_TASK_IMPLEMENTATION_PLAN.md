# Gospel Season Task Implementation Plan

Planning/design document only.

- Not SQL
- Not a migration
- Not Supabase data
- Not live app behavior
- No app routes created here
- No task templates created here
- No Before You Read context generated here

## Purpose

This document plans the future implementation of the Gospel season discipline
layer for `The Gospels: From September to Lent`.

The content schedule, reading text, reflection prompts, dates, titles,
references, focus text, notes, and day types are already outside the scope of
this pass and should not be changed by this plan.

## Current Decisions

- The Gospel season should be more intense than Ordinary Time: James.
- The Gospel season should be less intense than Lent / Narrow Path 90.
- The Gospel season should not be merely a reading plan.
- Preferred future task concepts:
  - `weekly_fast_or_penance`
  - `temperance`
- Existing related slugs:
  - `fast`
  - `give_up_alcohol`
- The related slugs are not preferred final implementations.
- The future guide page `/guides/fasting-and-penance` is required before
  launch.

## Inspected Implementation Surfaces

Local files inspected for this plan include:

- `docs/GOSPELS_SEASON_PLAN.md`
- `docs/GOSPELS_SEASON_IMPORT_ARTIFACT_AUDIT.md`
- `docs/GOSPELS_SEASON_IMPORT_ARTIFACT_REVIEW.md`
- `content/gospels/the-gospels-september-lent-import-artifact.json`
- `scripts/build-gospels-season-import-artifact.mjs`
- `supabase/migrations/20260518_zz_add_august_james_draft_plan.sql`
- `supabase/migrations/20260512_ensure_task_metadata_schema.sql`
- `supabase/migrations/20260512_zz_fix_confession_final_week_windows.sql`
- `supabase/migrations/20260518_add_day90_feedback_and_give_thanks.sql`
- `app/today/page.tsx`
- `app/this-week/page.tsx`
- `app/dashboard/page.tsx`
- `app/admin/plan/page.tsx`
- `components/today-task-card.tsx`
- `components/task-card.tsx`
- `components/season-timeline.tsx`
- `lib/task-progress.ts`
- `lib/season-plan.ts`
- `lib/homepage-overview.ts`
- `app/about/page.tsx`

## Database Findings

`plan_day_tasks` already has the metadata columns needed for quota-style task
rows:

- `day_date`
- `week_start_date`
- `month_start_date`
- `is_optional`
- `quota_scope`
- `quota_target`
- `requirement_note`
- `display_order`

The current quota scope constraint allows:

- `week`
- `month`
- `last_week_of_month`
- `null`

This is set in
`supabase/migrations/20260518_zz_add_august_james_draft_plan.sql`.

Weekly Adoration is represented safely in the August James draft as optional
rows assigned across the week with:

- `quota_scope = 'week'`
- `quota_target = 1`
- `is_required = false`
- `is_optional = true`

Monthly Confession has two patterns in the repo:

- The August James draft uses `quota_scope = 'month'` for once-per-month
  Confession.
- The active Narrow Path 90 Confession cleanup uses
  `quota_scope = 'last_week_of_month'` for the final Monday-Sunday window
  containing the last day of each month.

The progress code in `lib/task-progress.ts` supports all three known scopes:
`week`, `month`, and `last_week_of_month`.

## UI Findings

`components/today-task-card.tsx` already supports a secondary action with:

- `href`
- `label`
- optional `statusText`

`app/today/page.tsx` maps task slugs to secondary actions in
`getTaskSecondaryAction`. This is the least invasive place to add a future
`weekly_fast_or_penance` help link.

`app/today/page.tsx`, `app/this-week/page.tsx`, and `lib/task-progress.ts`
already support week-scoped quota task progress. A week-scoped task assigned on
each day of the week can be completed on any assigned day and counted toward the
same weekly target.

`app/dashboard/page.tsx` also has a weekly quota progress surface, but it keys
weekly quota behavior mostly from `task_templates.cadence = 'weekly_quota'` and
`weekly_target`. Future migration work should make sure the template cadence and
the plan-day task quota fields agree.

The admin plan UI currently only treats `daily` and `weekly_quota` as editable
cadences. It also uses the original challenge start date when computing task
metadata in admin helpers. For Gospel-season creation, prefer generated
migration/import code over manual admin assignment unless the admin helpers are
made season-date aware.

## Weekly Fast or Penance

Recommendation: create a new task template later.

Preferred future slug:

```text
weekly_fast_or_penance
```

Label idea:

```text
Fast or Penance
```

Recommended task template shape:

- `slug`: `weekly_fast_or_penance`
- `title`: `Fast or Penance`
- `description`: short plain-English description of the weekly discipline
- `cadence`: `weekly_quota`
- `weekly_target`: `1`
- `audience`: `shared`

Recommended plan-day task shape:

- Assign a row on each day of each Monday-Sunday week.
- Keep the rows optional in the daily checkbox sense:
  - `is_required = false`
  - `is_optional = true`
- Use quota fields to make the requirement weekly:
  - `quota_scope = 'week'`
  - `quota_target = 1`
- Use `week_start_date` for the Monday that starts the week.
- Use `day_date` for the actual calendar date.
- Use `month_start_date` for the calendar month start.

Recommended requirement note:

```text
Required once per week. Friday is the natural day, but complete it on any day that works. Choose a Catholic fast or another concrete penance.
```

Why not reuse `fast`:

- `fast` appears to belong to the stricter Narrow Path 90/Lent-style
  discipline set.
- The August James migration intentionally removes original challenge
  restrictions including `fast`.
- Day 90 celebration code hides `fast` as not applicable.
- The Gospel concept is broader: a Catholic fast or another concrete penance.

Recommended UI behavior:

- Show it like weekly Adoration: available on each assigned day and counted once
  per week.
- Friday should be suggested in the requirement note and guide copy, not forced
  by the database.
- Add a secondary action from the task card:
  - label: `What's a fast or penance?`
  - href: `/guides/fasting-and-penance`
  - status text idea: `Open guide`

Implementation note:

The current `TodayTaskCard` secondary action model is sufficient for the link.
The future code change would likely extend `getTaskSecondaryAction` in
`app/today/page.tsx` for the `weekly_fast_or_penance` slug.

## Fasting and Penance Guide

Recommendation: create a future App Router page, but do not create it in this
planning pass.

Preferred route:

```text
/guides/fasting-and-penance
```

Recommended file location:

```text
app/guides/fasting-and-penance/page.tsx
```

Recommended page pattern:

- Follow the static page pattern used by `app/about/page.tsx`.
- Reuse existing page components such as:
  - `PageFrame`
  - `HeroPanel`
  - `SectionHeader`
  - `SurfaceCard`
  - `SurfaceInset`
  - `AppActionBar`
- Keep the page plainspoken, practical, and Catholic.
- Do not make it a long theological essay.

Required guide content:

- What penance is.
- What fasting is.
- What abstinence is.
- Catholic fasting is not starvation.
- Catholic fast pattern: one full meal, plus up to two smaller meals that
  together do not equal another full meal.
- Health/common-sense note: users should not fast in a way that harms health or
  required duties.
- Examples:
  - meatless meal
  - skip dessert
  - skip alcohol
  - no social media
  - no video games
  - cold shower
  - extra Rosary
  - Adoration
  - almsgiving
  - hidden chore or act of service
- Discernment:
  - concrete
  - doable
  - sacrificial
  - connected to prayer
  - not performative
  - not harmful to health, work, school, or family duties

Recommended link source:

- Add a secondary task-card action for `weekly_fast_or_penance`.
- Do not add the route to primary navigation unless later product review asks
  for a general guide index.

## Temperance

Preferred future concept:

```text
temperance
```

Recommended Gospel Season Temperance Rule:

- Alcohol allowed only on weekends.
- Maximum 2 drinks in one day.
- Never more than 2 days in a row.
- No alcohol on fasting or penance days.
- No drunkenness ever.

Recommendation: implement as a season rule first, not a daily checkbox.

Why not reuse `give_up_alcohol`:

- `give_up_alcohol` implies full abstinence.
- The Gospel rule allows limited weekend alcohol.
- Existing Day 90 copy treats `give_up_alcohol` as a food/drink restriction
  that can be relaxed, not as a nuanced temperance rule.

Why not make it a daily required task immediately:

- The current checkbox model is good for simple daily actions and quota goals.
- The temperance rule is conditional:
  - weekend-only allowance
  - max 2 drinks in one day
  - never more than 2 days in a row
  - no alcohol on fasting/penance days
  - no drunkenness ever
- A daily checkbox could imply the wrong thing on weekdays, weekends, and
  penance days unless the app gains rule-aware copy and validation.

Recommended future implementation:

1. Treat temperance as season copy/rule metadata for launch.
2. Display it on a Gospel season info/dashboard surface.
3. Consider an optional self-check task only if user testing shows it helps.

Potential surfaces:

- `components/season-timeline.tsx` currently has simple season cards but not a
  detailed rule surface.
- `app/dashboard/page.tsx` has dashboard summary cards and could eventually
  show Gospel-season rule copy.
- `app/today/page.tsx` has the strongest daily context but should avoid adding
  bulky rule text to every day.

Least invasive recommendation:

- Add a future Gospel season info card to Dashboard or Today only when the
  Gospel plan is being activated.
- Keep the initial temperance rule as readable season copy, not as
  `plan_day_tasks` rows.
- If later implemented as a task template, use `temperance` rather than
  `give_up_alcohol`, and make it optional/self-check unless a clearer
  requirement model is designed.

## Schema Considerations

`weekly_fast_or_penance` can use the existing weekly quota model safely:

- `task_templates.cadence = 'weekly_quota'`
- `task_templates.weekly_target = 1`
- `plan_day_tasks.quota_scope = 'week'`
- `plan_day_tasks.quota_target = 1`
- assigned on each day where completion should be possible

The current app already counts week-scoped completion rows through
`week_start_date`.

`temperance` should not be modeled as `plan_day_tasks` for the first Gospel
implementation unless a future design explicitly decides how the checkbox maps
to the rule. It is better as season-copy/rule metadata first.

Known implementation cautions:

- Keep `task_templates.cadence` and `plan_day_tasks.quota_scope` aligned for
  weekly quota tasks.
- Generated migration code should compute Gospel dates from `2026-09-01`, not
  from the original 90-day challenge start date.
- The admin plan UI should not be the primary creation path for Gospel task
  rows until its date helpers are season-aware.
- If the future migration uses `last_week_of_month` for Confession, review
  whether that still fits the September-February Gospel season. The current
  import artifact uses `month`; that is allowed by the constraint and supported
  by progress code.

## Future Migration Strategy

A future migration/import pass should do the following, without relying on this
planning document as SQL:

1. Verify or create the `weekly_fast_or_penance` task template.
2. Create or verify a `temperance` task template only if the final approved
   implementation uses a task template.
3. Create the inactive Gospel plan:
   - slug: `the-gospels-september-lent`
   - name: `The Gospels: From September to Lent`
   - total days: `162`
   - active: `false`
4. Insert or update all 162 `plan_days`.
5. Insert the approved base task rows.
6. Insert `weekly_fast_or_penance` rows if approved:
   - one row per assigned day
   - `quota_scope = 'week'`
   - `quota_target = 1`
7. Add guide link/action behavior only after the UI route and task-card action
   are approved.
8. Keep `temperance` as season copy unless later approved as a task template.
9. Keep the Gospel plan inactive until human review is complete.

## Open Risks and Dependencies

- The future guide page must exist before the task-card help link launches.
- The task-card secondary action must be extended for
  `weekly_fast_or_penance`.
- The Gospel season needs a deliberate surface for the Temperance Rule if it is
  not a task checkbox.
- Dashboard/homepage weekly quota summaries may choose a featured weekly quota
  by title/slug; adding a second weekly quota can affect which one is featured.
- Admin plan helpers currently compute task dates from the original challenge
  start date.
- If Confession uses `month` instead of `last_week_of_month`, copy and dashboard
  presentation should be reviewed before launch.
- If `temperance` ever becomes a task, its completion semantics must be defined
  before SQL.

## Recommendation

Recommended path for `weekly_fast_or_penance`:

- Create a new task template.
- Use `weekly_quota` cadence with weekly target `1`.
- Assign it across each Monday-Sunday week.
- Use `quota_scope = 'week'` and `quota_target = 1`.
- Keep rows optional but quota-required, matching the Adoration pattern.
- Add the task-card secondary link to `/guides/fasting-and-penance`.

Recommended path for `temperance`:

- Treat it as a Gospel season rule first.
- Do not reuse `give_up_alcohol`.
- Do not make it a daily checkbox for the first implementation.
- Add a `temperance` task template only if a later implementation explicitly
  chooses an optional/self-check task.

Recommended path for `/guides/fasting-and-penance`:

- Build it later at `app/guides/fasting-and-penance/page.tsx`.
- Use the existing static page style from `app/about/page.tsx`.
- Link it from the `weekly_fast_or_penance` task card.

Recommended future implementation order:

1. Approve this task implementation plan.
2. Build the `/guides/fasting-and-penance` route.
3. Add the `weekly_fast_or_penance` task-card secondary action.
4. Add a Gospel season info/rule surface for the Temperance Rule.
5. Generate and review SQL for the inactive Gospel plan and task rows.
6. Run full validation on a non-production review path.
7. Human-review the inactive draft plan before activation.

## Explicit Non-Actions In This Pass

- No SQL created.
- No migrations created.
- No Supabase data read, written, or mutated.
- No app route created.
- No app behavior changed.
- No task template created.
- No import artifact content changed.
- No Gospel season reading text changed.
- No reflection prompts changed.
- No dates, day numbers, titles, references, focus text, notes, or day types
  changed.
