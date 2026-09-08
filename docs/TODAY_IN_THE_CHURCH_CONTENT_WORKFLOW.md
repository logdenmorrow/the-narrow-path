# Today in the Church Content Workflow

Today in the Church is a read-only Catholic calendar feature. It is not a task,
is not completable, and must not affect challenge progress.

Runtime pages must display only reviewed local JSON content. They must not call
AI, scrape sources, write to Supabase, send notifications, create reminders, or
change task completion state.

## Architecture

Calendar entries answer what the Church assigns to a date:

```text
content/liturgical-calendar/us-2026.json
```

Use this file for date, U.S. observance, season, rank, liturgical color, and
short fallback summary. A calendar entry may include one primary `profile_slug`
and `profile_type` for the main liturgical day.

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
`approved` or `locked`; otherwise it falls back to the calendar copy.

Use profiles for related observances when approved rich content should be
available without implying that the optional or displaced observance is the
primary day. Examples include optional memorials on weekdays and memorials
displaced by Sundays.

## Source Hierarchy

Use the strongest available Catholic source for each claim.

1. USCCB liturgical calendar: U.S. date, rank, color, and observance.
2. General Roman Calendar, Universal Norms, and GIRM: liturgical structure.
3. Catechism, councils, papal documents, Vatican/Holy See: doctrine and Catholic meaning.
4. Roman Martyrology: official saint identification.
5. New Advent, Butler's, religious orders, and diocesan sources: historical background.
6. Franciscan Media, Catholic Culture, EWTN, and Catholic Answers: readable secondary support.
7. Wikipedia: lead-finding only, not final authority.

Wikipedia can be used to locate names, dates, alternate spellings, article
structure, and cited sources. Verify important claims in the strongest source
available and write original prose rather than adapting Wikipedia wording.

Do not use Protestant, secular, generic-Christian, modernist, sedevacantist,
rage-blog, or random-blog framing as final source authority.

## Review Statuses

- `drafted_ai`: AI-assisted draft exists, not reviewed for Catholic/factual quality.
- `needs_catholic_review`: drafted or edited, still awaiting Catholic review.
- `approved`: reviewed and allowed to display.
- `locked`: reviewed, allowed to display, and should not be casually edited.

Only `approved` and `locked` profiles display in the app.

## Content Tiers

- Ordinary weekday short: calendar fallback copy is usually enough.
- Optional memorial medium: concise profile or stronger calendar fallback.
- Memorial, doctor, or major saint richer: profile with key facts and Catholic meaning.
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

## Offline AI Drafting Prompt

AI may draft offline from approved source packets, but AI must never be runtime
app behavior. Final content must be reviewed and saved into local JSON.

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
- Set review.status to "needs_catholic_review" unless a human reviewer explicitly approves it.

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
