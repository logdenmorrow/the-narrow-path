# The Gospels: From September to Lent

This is an early planning note for the future Gospel reading season. It is not
plan data, not a migration, and not a generated reading schedule.

Status: framing only. Do not create, import, activate, or deploy this plan from
this document.

## Proposed Plan Identity

- Plan name: `The Gospels: From September to Lent`
- Plan slug: `the-gospels-september-lent`
- Date range: September 1, 2026 through February 9, 2027
- Total plan length: 162 days
- Lent 2027 begins on Ash Wednesday, February 10, 2027, so this plan should end
  on February 9, 2027.

## Recommended Architecture

Build this as one continuous 162-day plan, not four separate Gospel plans.

The plan should include every calendar day from September 1, 2026 through
February 9, 2027. Sundays should remain part of the same plan, but they should
be Catechism reading days rather than Gospel reading days.

The date range contains:

- 162 total days
- 23 Sundays
- 139 non-Sundays for Gospel readings

## Sunday/Catechism Rule

Sundays should be Catechism reading days, similar to the current 90-day plan.

These days should:

- remain normal `plan_days` rows inside the same 162-day plan
- use Catechism references and reading content instead of Gospel passages
- preserve the same plan-scoped navigation and daily reading behavior
- avoid assigning Gospel verses to Sundays unless Logan later changes this rule

Exact Sunday Catechism themes and readings are still open.

## Gospel Reading Rule

Assign Gospel readings only to non-Sundays.

The preferred Gospel order is:

```text
Mark -> Matthew -> Luke -> John
```

The future reading schedule should:

- read every single verse of all four Gospels
- read each Gospel exactly in canonical book order
- not skip repeated stories
- let repeated stories show each Gospel's distinct angle

The content direction for each Gospel:

- Mark: urgency, discipleship, suffering Messiah
- Matthew: fulfillment, kingdom, Church, teaching authority
- Luke: mercy, prayer, poor/outcast, Holy Spirit, Jerusalem
- John: signs, belief, divine identity, sacraments, glory

The tone should be Catholic, plainspoken, beginner-helpful, not academic, not
cheesy, and not generic Protestant/evangelical commentary. The season should
feel like a daily prayerful encounter with Christ, not a seminary course.

## Season Resolver and Plan-Scoped URLs

The future implementation should reuse the existing season resolver and
plan-scoped URL system.

Current architecture notes:

- `lib/season-plan.ts` already recognizes a `gospels` phase for September 1,
  2026 through February 9, 2027.
- `?plan=<slug>&day=<number>` is the preferred stable review and deep-link
  format for plan days.
- The Gospel plan should eventually resolve by slug
  `the-gospels-september-lent` and day number.
- The implementation should extend existing resolver and supported-slug behavior
  only when the draft plan is ready to be created and reviewed.

Do not add a new UI unless a later review shows the existing Daily Reading UI
cannot support the Gospel season.

## Before You Read Context

The Gospel season should reuse the existing reusable Before You Read reading
context system.

Do not use live AI generation inside the app. Reading context must be authored
or generated ahead of time, reviewed, converted to SQL, imported through the
normal controlled path, and displayed from saved `plan_days` fields.

Existing `public.plan_days` reading context fields to reuse:

- `reading_context`
- `previous_reading_summary`
- `reading_today_preview`
- `reading_watch_for`
- `reading_key_terms`
- `reading_context_source_hash`

The `/daily-reading` page already displays the Before You Read card when
reviewed context exists, so the Gospel plan should use that surface rather than
introducing a separate context UI.

The Gospel season should reuse the content pipeline used for Acts 90 and August
James:

1. Author and review reading plan content outside the live app.
2. Author and review Before You Read context outside the live app.
3. Convert reviewed JSON into SQL with the existing reading context SQL builder.
4. Review generated SQL.
5. Import through the normal migration or database review path.

## Proposed Future Content Paths

These files should be created later, after Logan approves the remaining content
decisions:

```text
content/gospels/the-gospels-september-lent-reading-plan.json
content/reading-context/source/the-gospels-september-lent-plan-export.json
content/reading-context/the-gospels-september-lent-days-1-14.json
```

The first Gospel reading plan file should eventually contain the reviewed
162-day plan content, including Sunday Catechism days. The reading-context
source/export file should preserve the reviewed plan export used to generate
Before You Read context. The chunked reading-context JSON files should follow
the existing reviewed JSON shape documented in `docs/reading-context-workflow.md`.

## Proposed Future Generated and Migration Paths

These files should be created later, not during this framing pass:

```text
supabase/generated/the-gospels-september-lent-reading-context-days-1-14.sql
supabase/migrations/<timestamp>_add_gospels_september_lent_draft_plan.sql
```

Generated SQL should be reviewed before use. The migration should create the
draft plan only when the full schedule and launch behavior are ready for review.

## Open Decisions for Logan

- Exact Sunday Catechism themes/readings
- Exact Gospel daily split sizes across the 139 non-Sundays
- Whether each day gets a reflection prompt
- Whether Sunday Catechism days get their own reflection prompt
- Whether August/September transition copy should appear on the dashboard
- Whether the plan remains inactive until a later manual launch

## Do Not Do Yet

- Do not generate the actual 162-day reading schedule.
- Do not create the Gospel reading plan.
- Do not create migrations.
- Do not create generated SQL.
- Do not generate Gospel readings.
- Do not generate Before You Read context.
- Do not run migrations.
- Do not mutate Supabase data.
- Do not add live AI generation.
- Do not alter app behavior.
- Do not change Daily Reading UI unless a later review proves it is needed.
- Do not touch existing Acts, James, Day 90, Give Thanks, Challenge Feedback, or
  routing behavior.
- Do not commit, push, or deploy from this planning pass.
