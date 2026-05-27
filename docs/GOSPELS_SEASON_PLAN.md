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

Sunday Catechism themes and selected CCC references have been drafted and
reviewed in `content/gospels/the-gospels-september-lent-reading-plan-draft.json`.
Use the reviewed schedule unless Logan later manually changes it.

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

## Source Text and Content Standards

These decisions are approved for the future import-ready Gospel season content.
Do not treat this section as permission to generate that content yet.

### Gospel Source Text

Use Logan's approved RSV2CE Gospel text source, matching the source used for
the Acts and James readings.

- Do not invent, fetch, paraphrase, or substitute Bible text.
- Do not add full Gospel text during planning or schedule review passes.
- Full Gospel text will be supplied later before import-ready content is
  generated.

### Catechism Source Text

Use the existing Catechism source already available to the project.

- Do not fetch or substitute another Catechism source unless Logan explicitly
  instructs that change.
- Do not add full Catechism text during planning or schedule review passes.

### Sunday Catechism Formatting

Sunday Catechism readings should be formatted more carefully than the current
Narrow Path 90 Catechism readings.

For future import-ready Sunday Catechism reading text:

- Preserve CCC paragraph numbers.
- Put each CCC numbered paragraph in its own paragraph.
- Bold paragraph numbers in rendered markdown/text where supported, for
  example: `**87.** Text...`
- Convert embedded Catechism section labels/headings into clear subheadings,
  for example:

```markdown
### The Dogmas of the Faith
### The Supernatural Sense of Faith
### Growth in Understanding the Faith
```

- Preserve the actual Catechism wording.
- Preserve useful cross-references, but do not let them create unreadable walls
  of text.
- Remove obvious copy/paste artifacts, broken spacing, and mashed-together
  headings.
- Do not combine multiple CCC paragraphs into one wall of text.
- Do not summarize the Catechism in place of the assigned reading text.

### Reflection Prompts

Every Gospel day and every Sunday Catechism day should receive a reflection
prompt.

Prompts should be:

- Catholic
- plainspoken
- practical
- short

Prompts should not be academic, cheesy, vague, or generic
Protestant/evangelical commentary.

### Next-Phase Workflow

The next content phase should wait until Logan provides the full RSV2CE Gospel
text source.

After source text is available:

1. Generate an import-ready reviewed content artifact from the approved
   schedule.
2. Insert the supplied RSV2CE Gospel text and existing-source Catechism text.
3. Apply the Catechism formatting standard above.
4. Add reviewed reflection prompts for every Gospel and Sunday Catechism day.
5. Keep the plan inactive/draft until human review is complete.

Before You Read context should still wait until the final reading text, reading
titles, focuses, and reflection prompts are approved.

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

## Future Fasting and Penance Guide

Before launch, the Gospel season should include a user-facing guide page at:

```text
/guides/fasting-and-penance
```

The `weekly_fast_or_penance` task card should link to this guide with a button
or link labeled "What's a fast or penance?"

The guide should explain:

- what penance is
- what fasting is
- what abstinence is
- that Catholic fasting is not starvation
- the Catholic fast pattern: one full meal, plus up to two smaller meals that
  together do not equal another full meal
- that users should not fast in a way that harms health or required duties
- examples of penances, including a meatless meal, skipping dessert, skipping
  alcohol, no social media, no video games, a cold shower, an extra Rosary,
  Adoration, almsgiving, and a hidden chore or act of service
- how to discern a good penance: concrete, doable, sacrificial, connected to
  prayer, not prideful or performative, and not harmful to health, work, school,
  or family duties

This is a future UX requirement only. Do not create the route or app page until
the Gospel season task strategy and implementation plan are approved.

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

These files should be created later, after Logan supplies the approved RSV2CE
Gospel source text and the import-ready content has been reviewed:

```text
content/gospels/the-gospels-september-lent-reading-plan.json
content/reading-context/source/the-gospels-september-lent-plan-export.json
content/reading-context/the-gospels-september-lent-days-1-14.json
```

The first Gospel reading plan file should eventually contain the reviewed
162-day plan content, including Sunday Catechism days, reading text, and
reflection prompts. The reading-context source/export file should preserve the
reviewed plan export used to generate Before You Read context. The chunked
reading-context JSON files should follow the existing reviewed JSON shape
documented in `docs/reading-context-workflow.md`.

## Proposed Future Generated and Migration Paths

These files should be created later, not during this framing pass:

```text
supabase/generated/the-gospels-september-lent-reading-context-days-1-14.sql
supabase/migrations/<timestamp>_add_gospels_september_lent_draft_plan.sql
```

Generated SQL should be reviewed before use. The migration should create the
draft plan only when the full schedule and launch behavior are ready for review.

## Open Decisions for Logan

Decided:

- Gospel text source: Logan's approved RSV2CE source, matching Acts and James.
- Catechism source: the existing Catechism source already available to the
  project.
- Reflection prompts: include prompts for every Gospel day and every Sunday
  Catechism day.
- Schedule: keep the existing reviewed draft schedule unless Logan later
  manually changes it.

Still open:

- Final human approval of exact reading text after source insertion.
- Final human approval of formatted Catechism reading text.
- Final human approval of reflection prompts.
- Whether/when to create the inactive Supabase draft migration.
- Whether/when to activate the plan.
- Whether August/September transition copy should appear on the dashboard.

## Do Not Do Yet

- Do not regenerate or replace the reviewed 162-day draft schedule unless Logan
  explicitly requests schedule changes.
- Do not create the Gospel reading plan.
- Do not create migrations.
- Do not create generated SQL.
- Do not generate Gospel readings.
- Do not add full Gospel reading text.
- Do not add full Catechism reading text.
- Do not generate reflection prompts.
- Do not generate Before You Read context.
- Do not run migrations.
- Do not mutate Supabase data.
- Do not add live AI generation.
- Do not alter app behavior.
- Do not change Daily Reading UI unless a later review proves it is needed.
- Do not touch existing Acts, James, Day 90, Give Thanks, Challenge Feedback, or
  routing behavior.
- Do not commit, push, or deploy from this planning pass.
