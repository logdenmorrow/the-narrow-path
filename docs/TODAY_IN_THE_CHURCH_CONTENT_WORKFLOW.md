# Today in the Church Content Workflow

Today in the Church is a read-only Catholic calendar feature. It is not a task,
is not completable, and must not affect challenge progress.

Runtime pages must display only reviewed local JSON content. They must not call
AI, scrape sources, write to Supabase, send notifications, create reminders, or
change task completion state.

## Architecture

Imported calendar facts answer what the Church assigns to a date:

```text
content/liturgical-calendar/us-gospel-season-facts.json
```

Use this file for date, U.S. observance, season, rank, liturgical color, and
related observances. Do not add editorial prose or profile references to the
imported facts file.

Editorial profile links live separately:

```text
content/liturgical-calendar/profile-links.json
```

Each link identifies an exact date and observance title, whether it is the
primary or a related observance, and the reusable profile slug. This separation
keeps calendar refreshes deterministic and lets maintainers replace or retire
article content without editing imported facts.

Calendar entries may also include secondary `related_observances` for optional,
local, also-observed, or displaced observances. Related observances must not
replace the primary liturgical day. If a related observance references an
unapproved profile, the app must show only the related-observance summary, not
rich profile content.

Profile files answer who or what the observance is:

```text
content/liturgical-profiles/
```

Use profiles for reusable saint, feast, solemnity, season, or other rich
explanations. The app may show a profile only when `review.status` is
`approved` or `locked`; otherwise it falls back to the calendar copy. The
rolling automation may assign `approved` only after every gate in
`TODAY_IN_THE_CHURCH_ARTICLE_STANDARD.md` passes.

Use profiles for related observances when approved rich content should be
available without implying that the optional or displaced observance is the
primary day. Examples include optional memorials on weekdays and memorials
displaced by Sundays.

## Source Hierarchy

Use the strongest available Catholic source for each claim.

1. USCCB liturgical calendar: U.S. date, rank, color, and observance.
2. General Roman Calendar, Universal Norms, and GIRM: liturgical structure.
3. Catechism, councils, papal documents, Vatican/Holy See: doctrine and ecclesial context.
4. Roman Martyrology: official saint identification.
5. New Advent, Butler's, religious orders, and diocesan sources: historical background.
6. Franciscan Media, Catholic Culture, EWTN, and Catholic Answers: readable secondary support.
7. Wikipedia and Britannica: readable secondary synthesis and lead-finding.

Wikipedia can be used as a working base for names, dates, alternate spellings,
article structure, and broad biographical coverage. Follow its citations and
verify important claims in the strongest source available. Write original prose
rather than copying or closely adapting Wikipedia wording.

Do not use Protestant, secular, generic-Christian, modernist, sedevacantist,
rage-blog, or random-blog framing as final source authority.

## Review Statuses

- `drafted_ai`: AI-assisted draft exists, not reviewed for Catholic/factual quality.
- `needs_catholic_review`: drafted or edited, still awaiting Catholic review.
- `approved`: reviewed and allowed to display.
- `locked`: reviewed, allowed to display, and should not be casually edited.

Only `approved` and `locked` profiles display in the app.

Special Church events that are real, dated ecclesial events but are not entries
in the USCCB liturgical calendar live separately:

```text
content/liturgical-calendar/special-events.json
```

Use this file for events such as a beatification. A special event appears as an
also-observed item and must never replace the primary liturgical day imported
from the USCCB calendar. It may link to a reviewed profile and may define a
date-scoped in-app notice. The notice is shown only to signed-in users, only on
the exact event date in the application's Eastern time zone, and only when both
the event and profile are approved or locked. Dismissing or opening it records a
local dismissal under the same event key, so either the article button or close
button prevents it from repeatedly interrupting the same browser. This is an
in-app announcement, not a push notification or reminder.

## Article presentation

Render a reviewed profile as one continuous encyclopedia-style article. Use a
single article surface with a lead paragraph, a plain key-facts list, ordinary
section headings, and full paragraphs separated by simple rules. Do not wrap
each fact or section in its own card or inset. Calendar metadata, date movement,
sources, and related-observance navigation may remain separate from the article
when that separation helps the reader.

Do not append a separate "Catholic meaning," "Catholic connection," application,
or takeaway section. Explain relevant doctrine, liturgical significance, and
ecclesial context naturally inside the article section where each belongs.

## Content Tiers

- Ordinary weekday short: calendar fallback copy is usually enough.
- Optional memorial medium: concise profile or stronger calendar fallback.
- Memorial, doctor, or major saint richer: profile with key facts and substantial biography.
- Feast or solemnity richest: profile with richer doctrinal and liturgical explanation.

## Published Prose Style

Write the public profile as a concise encyclopedia article:

- Open with who or what the observance is, followed by the most important dates,
  roles, works, and historical significance.
- Use direct, declarative sentences and specific facts.
- Organize longer profiles with ordinary headings such as Life, Ministry,
  Writings, Death, Veneration, and Liturgical observance.
- State Catholic doctrine and significance plainly. Do not add a separate
  application paragraph merely to restate the article in devotional language.
- Describe genuine historical uncertainty in normal prose: identify what the
  sources establish, what belongs to tradition, and what remains uncertain.
- Keep `historical_cautions` and `review.notes` as internal editorial guidance.
  They must not be rendered as public article sections.
- Keep calendar hierarchy in the page interface. Do not repeat that an
  optional or proper observance "does not replace" another day throughout the
  article.
- Keep source links visible, but keep source-selection and review commentary
  internal.

Avoid:

- References to "this profile," "this article," "the app," the drafting
  process, review status, or publication safety.
- Catchy slogans, motivational taglines, rhetorical questions, and ornamental
  contrasts such as "not merely X, but Y."
- Repeating the same point in the summary, key facts, article sections, and
  Catholic-meaning sections.
- Explaining familiar Catholic terms unless the explanation is necessary for
  the subject.
- Defensive disclaimers. One concise interface label is preferable when a
  calendar distinction genuinely needs explanation.

## What Not To Include

- Mass readings.
- Collects or prayer text.
- "How to live it today" prompts.
- Completion tracking, reminders, notifications, tasks, streaks, XP, scores, levels, or gamification.
- Protestant, secular, or generic-Christian framing.
- Legends presented as certain history.
- Unsourced "legend says" or "some say" claims without historical caution notes.
- Markdown or HTML in content fields.

Keep copy plain text, Catholic, source-backed, and minimal.

## Validation

Run the read-only scanner before adding or changing calendar/profile content:

```powershell
npm run scan:liturgical-content
```

The scanner checks required fields, duplicate dates/slugs, profile references,
related observances, review statuses, source presence, and obvious unsafe
content. Warnings should be reviewed before commit. Errors must be fixed.

The generated runtime registry must also match the individual profile files:

```powershell
npm run check:liturgical-profile-registry
```

## Rolling Publication Automation

`.github/workflows/draft-liturgical-profiles.yml` runs weekly and can also be
started manually. It looks ahead 70 days, finds primary or related observances
without linked profiles, and processes up to three of them. Each candidate is
researched and drafted with web search and strict structured output. A
deterministic gate checks depth, organization, source diversity, reachable
URLs, search-trace provenance, repetition, prohibited headings, meta language,
and templated prose. A separate editorial model then researches the subject
again and grades factual grounding, Catholic accuracy, depth, organization,
prose, and source quality. The complete standard and rubric live in
`docs/TODAY_IN_THE_CHURCH_ARTICLE_STANDARD.md`.

A rejected draft is regenerated once with the exact failure reasons. If it
still fails, no profile or link is written and the Actions summary records the
rejection. The workflow opens or updates a date-and-article-specific GitHub
issue, mentions `@logdenmorrow`, links to the failed run, and marks the run
failed. Infrastructure or validation failures create a separate publisher
failure issue. Passing articles receive `review.status: approved`; repository
scanners run; and an audit pull request is created, merged, and sent to the
container deployment workflow automatically. No routine human approval is
required. Existing approved or locked profiles are never overwritten.

The workflow requires the repository secret `OPENAI_API_KEY`. The optional
repository variable `OPENAI_LITURGICAL_PROFILE_MODEL` selects the drafting model;
the default is `gpt-5.4-mini`. `OPENAI_LITURGICAL_REVIEW_MODEL` may select a
different independent review model; by default it uses the drafting model. When
the secret is absent, the scheduled workflow exits successfully and records
that publishing is not configured.

Preview the candidate queue locally without an API call or file changes:

```powershell
npm run draft:liturgical-profiles -- --dry-run --start 2026-09-08 --days 70 --limit 10
```

The pull request is an audit record rather than an approval queue. The workflow
merges it only after both article gates and both repository validation commands
pass.

## Offline AI Drafting Prompt

AI may draft offline from approved source packets, but AI must never be runtime
app behavior. Final content must satisfy the same automated publication standard
before it is saved as approved local JSON.

Use this prompt only after gathering source links and source notes:

```text
Draft Today in the Church local JSON content from the source packet below.

Rules:
- Write original plain-English Catholic prose.
- Use a concise, neutral, encyclopedic voice.
- Do not invent facts.
- Every major factual claim must trace to the supplied Catholic sources.
- Do not copy biographies, prayers, Mass readings, Collects, or long source text.
- Do not include "how to live it today" prompts.
- Do not include tasks, completion language, gamification, reminders, or notifications.
- Do not present legends or uncertain details as certain history.
- If a traditional or uncertain account is included, add historical_cautions.
- Keep historical_cautions as internal review notes; do not write them as
  reader-facing disclaimers.
- Do not refer to the profile, article, app, drafting process, source packet,
  review status, or publication safety in public fields.
- Avoid slogans, rhetorical flourishes, motivational endings, and repeated
  "not X, but Y" constructions.
- Keep all fields plain text. No Markdown or HTML.
- Evaluate the result against TODAY_IN_THE_CHURCH_ARTICLE_STANDARD.md before
  setting review.status to "approved".

Source packet:
- Date:
- Calendar observance:
- Rank:
- Liturgical color:
- Season:
- Source refs:
- Notes from sources:

Return:
- Calendar entry updates, if needed.
- One profile JSON object, if a profile is appropriate.
```
