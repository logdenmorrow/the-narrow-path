# The Narrow Path — Master Project Handoff

**Replacement handoff version:** 2026-05-17  
**Project domain:** thenarrowpath.xyz  
**Repository:** logdenmorrow/the-narrow-path  
**Preferred source format:** Markdown  
**Purpose:** This document replaces the older May 9, 2026 PDF handoff and consolidates the original project history, ChatGPT Project audits, Codex Cloud audits, local repo-history audit, and the May 17 reminder/branding/tone cleanup checkpoint into one current source-of-truth document for future ChatGPT Project context.

---

## 0. How to Use This Document

Start every future project chat from this document plus the current GitHub repository.

The handoff is intentionally explicit because the biggest project risk is regression. The app has evolved quickly from an early Brotherhood-only challenge site into a two-track Catholic accountability app with Scripture/Catechism readings, daily tasks, journaling, Night Prayer, Guided Rosary, GroupMe integrations, admin/support tooling, and a changing UI/design system.

When giving Codex or ChatGPT future project instructions:

1. State the affected page, route, file, or database table.
2. State whether the change is public, signed-in, Brotherhood, Sisterhood, shared, admin, SQL, deployment, or copy.
3. Tell Codex to inspect the current repo first.
4. Tell Codex to run `npm run build` and report the result.
5. Tell Codex to run `git diff` at the end and summarize exact changes.
6. Do not let Codex commit, push, migrate, or deploy unless explicitly told.

This handoff should be read as a product/architecture guide, not as proof that every historical Codex PR was merged or deployed. Where deployment or verification was uncertain, that is called out.

---

## 1. Current Source of Truth

### Primary sources

- **Committed repo:** `logdenmorrow/the-narrow-path`
- **This handoff:** current long-form project context
- **Supabase production database:** source of truth for live users, auth, completions, tasks, prayers, daily status, journal entries, and imported prayer/reading content
- **Manual audit history:** normal ChatGPT chats, Codex Cloud chats, and a repo-history audit were reviewed before this rewrite

### Source-of-truth rules

- GitHub backs up code and migrations, not live Supabase data.
- Supabase live data must be backed up separately before risky database work.
- A migration file being committed does not prove it has been applied in Supabase.
- A Codex PR/tool call does not prove a branch was pushed, merged, deployed, or live-tested.
- The current committed repo should be inspected before any new code advice.
- If local uncommitted changes exist, they must be pasted or committed before relying on repo state.

---

## 1A. May 17, 2026 Current Checkpoint

This version incorporates the May 17 production work completed after the May 13 handoff.

### Reminder system checkpoint

The old single daily reminder model was replaced with two preset reminder slots:

| Reminder type | Title | Body | Default idea |
|---|---|---|---|
| `morning_scripture` | The Narrow Path | Start the day with Scripture. | 7:00 AM |
| `night_prayer` | The Narrow Path | End the day in prayer. | 9:30 PM |

Important reminder decisions:

- Active reminder sends are driven by `public.notification_reminder_slots`.
- `/api/settings/reminder-slots` is the active settings route.
- `/api/cron/push/reminders` remains the active cron path and remains protected by `CRON_SECRET`.
- Cron still sends to all active push subscriptions for the user.
- The legacy `/api/settings/daily-reminder` route remains only as a compatibility shim for stale clients and should save into `morning_scripture`, not resurrect the old preference table.
- `public.notification_reminder_preferences` is legacy and must not drive reminder sends.
- Dedupe for new reminder sends should be based on `user_id + reminder_type + reminder_date + local_time`.
- Normal PostgreSQL unique constraints allow multiple `NULL` values; do not rely on nullable `reminder_type` rows for dedupe.
- Legacy `reminder_type = null` sends caused repeated notifications in production and were fixed by disabling legacy preferences and retiring the old path.
- Do not implement completion suppression. Morning Scripture and Night Prayer reminders should still send when enabled even if related tasks were already completed. They are rhythm/app re-entry reminders, not incomplete-task alerts.

### Branding and notification checkpoint

Branding assets were updated:

- Full app/home-screen source logo: `assets/branding/source-full-logo.png`
- Simplified notification source mark: `assets/branding/source-notification-logo.png`
- PWA app icon files now use v2 filenames in manifest:
  - `/app-icon-v2-192.png`
  - `/app-icon-v2-512.png`
  - `/maskable-icon-v2-192.png`
  - `/maskable-icon-v2-512.png`
- Apple touch icon uses `/apple-touch-icon-v2.png`.
- Notification icon uses `/notification-icon-192.png`.
- Notification badge uses `/notification-badge-96.png`.
- Browser tab favicons use light/dark variants of the simplified arch/cross/path mark:
  - `/favicon-light.svg`
  - `/favicon-dark.svg`
  - `/favicon.svg`
  - `/favicon.ico`
- `public/sw.js` cache was bumped through these branding passes.

Caveat: existing iOS home-screen PWA icons may still require removing and re-adding the PWA. Versioned filenames improve cache-busting and should help new installs, but they do not guarantee automatic home-screen icon refresh for every already-installed device.

### Tone/copy cleanup checkpoint

A broad copy cleanup was completed because the app had become too slogan-heavy, corporate, and fake-serious. The permanent direction is now functional, plainspoken, and minimal. See Section 28.

### Repo hygiene checkpoint

Known unused-variable lint issues were cleaned up. After that cleanup, `npm run lint` and `npm run build` passed.

---

## 2. Quick Non-Negotiables

Paste this into future prompts when needed:

```text
The Narrow Path supports Brotherhood and Sisterhood tracks. Preserve track-aware behavior.

Use task audiences correctly:
- shared
- brotherhood
- sisterhood

Use lib/track.ts helpers instead of hardcoding labels.

Do not expose Brotherhood users to Sisterhood users or Sisterhood users to Brotherhood users.

Keep /brotherhood as the shared internal community route unless explicitly told otherwise.

Keep /about public.

Public copy should be Catholic, human, and not men-only.

Signed-in copy should use the viewer's communityName where relevant.

Do not add XP, levels, public leaderboards, holiness scores, consistency scores, or gamified spirituality.

Task completion is row-existence based:
- row exists = completed
- no row = incomplete
- toggle on = insert
- toggle off = delete

Copy should be functional, plainspoken, and minimal.
Prefer simple labels over slogans.
Do not add filler subtitles when the title already explains the section.
Avoid fake-serious phrases like “sober attention,” “without noise,” “faithful step,” “daily rhythm,” and “not performance.”

Morning Scripture and Night Prayer reminders should send when enabled even if the related task is already complete.
Do not add completion suppression unless the user explicitly reverses this decision.

Run npm run build after code changes.
Run git diff at the end.
Do not commit, push, run migrations, or deploy unless explicitly told.
```

---

## 3. High-Level Product Summary

The Narrow Path is a Catholic discipline and accountability app built around a 90-day challenge structure. It is for ordinary Catholics and serious discerners who want prayer, Scripture, Catholic teaching, concrete disciplines, sacramental rhythm, and accountability rooted in the Church Christ founded.

The app now supports two accountability tracks:

- **Brotherhood**
- **Sisterhood**

The spiritual goal is the same for both tracks: live the Catholic faith more intentionally, stay accountable, keep returning to prayer and the sacraments, and practice discipline without turning holiness into performance.

### Core ethos

- Catholic, not vaguely Christian
- Spiritually serious without fake-serious slogans
- Restrained, useful, and plainspoken
- Human and functional
- Simple labels over marketing copy
- Accountability without pride-driven ranking
- Encouraging without gamification
- Useful for Catholics and people discerning Catholicism

### What the app should not feel like

- A habit streak app
- An RPG
- A leaderboard
- A productivity dashboard with Catholic paint
- A brand campaign full of slogans
- A stern monastic persona
- A social media product
- A public holiness contest
- A cheesy masculine motivational product
- A generic Christian wellness app

---

## 4. Historical Origin

The project began as a Catholic accountability/challenge app inspired by ascetic challenge structures like Exodus 90, but with explicit care not to copy Exodus branding, logo, screenshots, name, or confusingly similar identity.

The app became **The Narrow Path**. The domain selected and used is:

```text
thenarrowpath.xyz
```

The early project originally centered on men and Brotherhood-style accountability. It later expanded into a two-track app with Brotherhood and Sisterhood support. The older Brotherhood-only framing is historical context only and must not override current two-track behavior.

Original spiritual/product principles that still matter:

- Support fidelity, not performance.
- Avoid pride, comparison, and optimization.
- Help the user ask, “What is required of me today?”
- Keep Catholic doctrine and sacramental life central.
- Invite non-Catholics into Catholicism through Scripture, Church history, and Catechism without bludgeoning them.

Rejected early and still rejected:

- XP
- levels
- leaderboards
- private consistency scores
- faithfulness scores
- public ranking
- flashy achievement systems

---

## 5. Audience, Tracks, and Language

### Tracks

| User selection | gender | track | community label | member label |
|---|---|---|---|---|
| Male | male | brotherhood | Brotherhood | Brother |
| Female | female | sisterhood | Sisterhood | Sister |

Signup asks the user to choose Male or Female. That choice sets both `gender` and `track` in Supabase Auth metadata and the `profiles` table.

### Shared Catholic identity

Public copy should be Catholic and broad enough for both men and women. It may speak explicitly of:

- prayer
- discipline
- Scripture
- Catholic teaching
- the sacraments
- Confession
- Mass
- the Church Christ founded
- accountability
- ordinary Catholics

Avoid generic “Christian app” phrasing where Catholic specificity is intended.

### Brotherhood-specific copy

Brotherhood users may see Brotherhood/Brother/men language where appropriate.

### Sisterhood-specific copy

Sisterhood users should see Sisterhood/Sister language where appropriate.

### Shared/public copy

Public pages should not assume the user is male. Avoid “men,” “brothers,” or “Brotherhood” in shared copy unless specifically referring to the Brotherhood track.

---

## 6. Technical Stack

### App

- Framework: Next.js App Router
- Main code structure: `app/...`
- Language: TypeScript
- Styling: Tailwind + semantic theme tokens + component class patterns
- Auth/backend/database: Supabase
- Runtime: Docker container on Unraid
- Proxy/DNS: Nginx Proxy Manager / Cloudflare historically involved
- Repository: GitHub
- Container publishing: GitHub Actions to GitHub Container Registry

### Known environment variables

Do not commit these:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ADMIN_EMAILS
CRON_SECRET
GROUPME_BOT_ID
GROUPME_TEST_BOT_ID
GROUPME_PROD_BOT_ID
JOURNAL_ENCRYPTION_KEY
NEXT_PUBLIC_APP_URL
```

Some of these may vary by implementation and environment. Always inspect current README, deployment config, and environment before assuming exact names.

### Important package scripts

Current/recent scripts included:

```text
npm run dev
npm run build
npm run start
npm run lint
npm run import:night-prayer
npm run migrate:reflection-encryption
```

### Build/tooling notes

- `npm run build` is the required baseline after code changes.
- `npm run lint` has historically passed but sometimes failed after `.next` output existed until ESLint ignored generated output.
- A recurring warning appeared often:

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
```

This warning did not usually block builds but remains an environment/tooling cleanup item.

---

## 7. Repo and Deployment Workflow

### Preferred workflow

1. Inspect current repo.
2. Make code changes.
3. Run `npm run lint` when practical.
4. Run `npm run build`.
5. Run `git diff`.
6. Summarize files changed and build result.
7. Do not commit/push/deploy unless explicitly instructed.

### Deployment model

Historical/current deployment flow:

1. Code committed to GitHub.
2. GitHub Actions builds/publishes container.
3. GHCR image is pulled by Unraid/Docker.
4. Reverse proxy routes public domain traffic to the app container.

### Important deployment lessons

- GitHub is code history, not Supabase data backup.
- Supabase migrations should be committed to GitHub.
- Running SQL in Supabase and committing the migration file are separate actions unless automation exists.
- Never rewrite old migrations that may already have run; create a new migration instead.
- Inspect the first real GitHub Actions error before guessing.
- Codex Cloud environments sometimes lacked `origin` remotes, so claims about branch push/PR/deploy may be unverified.
- Some Codex PR tool calls did not prove GitHub-side PR creation or merge.

---

## 8. Route Map

### Public routes

- `/`
- `/about`
- `/auth/login`
- `/auth/sign-up`
- auth confirmation/password routes as implemented

`/about` must remain public. It previously redirected to `/auth/login` until the public allowlist in `lib/supabase/proxy.ts` was fixed.

### Signed-in routes

- `/dashboard`
- `/today`
- `/this-week`
- `/daily-reading`
- `/reflection`
- `/night-prayer`
- `/rosary`
- `/brotherhood`
- `/brotherhood/[userId]`

### Admin/support/auth-diagnostic routes

Routes have included:

- `/admin/plan`
- `/admin/plan/export`
- `/admin/auth-reports`
- `/admin/auth-reports/download`
- support/admin support routes
- auth diagnostic/report routes

Always inspect current repo before assuming exact route availability.

### Important route naming rule

`/brotherhood` is intentionally reused as the internal community route for both tracks. Sisterhood users use the same route but should see Sisterhood wording and Sisterhood members. Do not create `/sisterhood` unless explicitly requested.

---

## 9. Track System Implementation

### Profile fields

- `profiles.gender`
- `profiles.track`
- `profiles.display_name`
- `profiles.first_name`
- `profiles.last_name`
- `profiles.last_active_at` was later added for member activity tracking
- admin/hidden/support-related fields were later added for diagnostic/admin support tooling

### Track helpers

Use helpers instead of hardcoding:

```text
lib/track.ts
normalizeTrack(...)
trackFromGender(...)
getCommunityName(...)
getMemberName(...)
isVisibleForTrack(...)
```

Expected display mapping:

```text
brotherhood -> Brotherhood
sisterhood -> Sisterhood
```

Expected member label mapping:

```text
brotherhood -> Brother
sisterhood -> Sister
```

### Task visibility rule

A task is visible when:

```text
task.audience == "shared"
OR task.audience == signedInUser.track
```

Never show Brotherhood-only tasks to Sisterhood users. Never show Sisterhood-only tasks to Brotherhood users.

### Same-track enforcement

Community/accountability views should enforce same-track separation:

- Brotherhood users see Brotherhood members.
- Sisterhood users see Sisterhood members.
- Prayer requests and daily check-ins should be filtered to the viewer’s track.
- Direct member detail pages should require target profile track to match viewer track.

---

## 10. Public Copy and About Page

### Homepage

The homepage should be clearly Catholic, not men-only, and not generic marketing language.

It should speak naturally about:

- Catholic accountability
- prayer and discipline
- Scripture and Catholic teaching
- sacraments
- ordinary Catholics
- Brotherhood and Sisterhood tracks when appropriate

### About page

`/about` is public.

It explains that Logan Nester built the app after coming into the Catholic Church at Easter to help himself and friends stay accountable. It should remain human-sounding, not corporate or AI-marketing-style.

Important ideas:

- The app is not a replacement for the Church, sacraments, Confession, Mass, spiritual direction, or real friendship.
- The challenge has separate Brotherhood and Sisterhood tracks.
- The heart of the challenge is the same: live the Catholic faith more intentionally, stay accountable, and keep returning to the Church Christ founded.
- “God bless!” is part of the personal final framing.

---

## 11. Task System Overview

The task system supports:

- daily required disciplines
- weekday-specific tasks
- weekly quotas
- monthly quotas
- rotating weekly requirements
- last-week-of-month sacramental logic
- optional display behavior on non-required days
- shared/Brotherhood/Sisterhood task audiences
- generated plan-day task rows with metadata

### Core tables/concepts

- `challenge_plans`
- `plan_days`
- `task_templates`
- `plan_day_tasks`
- `user_task_completions`

### Task template columns/concepts

Important `task_templates` columns include:

```text
description
requirement_model
required_weekdays
optional_other_days
monthly_target
show_only_last_week_of_month
rotation_anchor_date
rotation_anchor_weekday
special_required_dates
sort_order
audience
```

Supported cadence concepts included:

```text
daily
weekly
monthly
specific_weekdays
weekly_quota
monthly_quota
rotating_weekday
```

### Generated task assignment metadata

Important `plan_day_tasks` fields include:

```text
day_date
week_start_date
month_start_date
is_optional
quota_scope
quota_target
requirement_note
display_order
```

Admin copy/add flows must not create rows missing metadata. Do not copy source date metadata onto target days.

---

## 12. Current Task Cadence and Discipline Logic

### Week boundaries

Challenge weeks run Monday through Sunday. This affects:

- weekly quotas
- This Week page grouping
- Rosary rotation
- Confession final-week logic

### Daily required/shared tasks

Common shared Catholic tasks have included:

- Morning Prayer
- Daily Reading / Reading
- Reflection / Scripture Reflection
- Night Prayer
- No Social Media
- Give Up Alcohol
- No Soda or Sweet Drinks
- No Desserts or Sweets
- Heroic Minute
- Confession
- Rosary
- Attend Mass
- Adoration
- Workout
- Abstain from Meat
- Fast
- Uplifting Audio
- Check in with Anchor

Always inspect current `task_templates` because naming/slug choices evolved.

### Brotherhood-specific examples

- Reach Out to a Brother / brother contact
- Cold Shower

If future Sisterhood-specific tasks are added, set `audience = 'sisterhood'` intentionally and design the task carefully.

### Weekly quotas

- Workout: 3/week
- Adoration: 1/week

Weekly quota tasks are shown as optional/flexible during the week and should not behave like required daily tasks.

### Rosary

Original cadence: rotating required weekday anchored to Monday, 2026-04-06.

Later update: Rosary remains required on its rotating weekday and appears optional on other days. There should be exactly one Rosary row per date, with no duplicate required/optional conflict.

Do not convert Rosary into a weekly quota task unless explicitly requested.

### Confession

Confession appears during the full Monday-Sunday block containing the last day of the month. It is a once-per-window quota task and should not be required every day.

Cross-month windows must share one progress bucket. Logic should use `week_start_date`, not `month_start_date`, for the final-week window bucket.

### Mass

Mass is required Sundays and optional other days. A special required-date override exists historically for 2026-05-14. Do not remove this casually without checking the product reason.

### Fasting

Historically required Wednesdays and Fridays. Outside Lent, meat rules may differ by user practice, but app cadence should be inspected before changing.

---

## 13. Task Completion System

Task completion is private/accountability-oriented.

### Canonical completion model

```text
row exists in user_task_completions = completed
no row = incomplete
toggle on = insert row
toggle off = delete row
```

Do not reintroduce `completed_at: null` writes as the way to mark incomplete.

### Important files

- `app/today/actions.ts`
- `components/task-completion-form.tsx`
- `components/today-task-card.tsx`
- `lib/task-progress.ts`

### Behavior

- Server action requires authenticated user.
- Server action validates active plan/day/task.
- Server action rejects future-day completions.
- Completion insert/delete revalidates relevant pages.
- Users can modify only their own completions.
- Unique index on `(user_id, plan_day_task_id)` prevents duplicates.

### Past/future day behavior

- Past-day backfill is allowed.
- Future days are view-only/locked.
- Server-side future-day protection must remain; UI locking is not enough.

### Reflection-specific completion

Reflection cannot be marked complete directly unless a saved journal entry exists. User-facing rule:

```text
saved reflection entry = Reflection complete
```

Avoid creating divergent definitions of Reflection completion.

---

## 14. Challenge Timing and Launch Lock

Central timing logic has lived in:

```text
lib/challenge.ts
```

Launch settings:

```text
Start date: 2026-04-06
Time zone: America/New_York
Unlock: 12:00 AM Eastern
```

Important computed fields:

```text
hasStarted
hasEnded
isComplete
currentDayNumber
weekStartDay
weekEndDay
startDate
startDateLabel
timeZone
```

Do not remove backward-compatible fields casually. Earlier admin/display code broke when `weekStartDay`, `weekEndDay`, or `isComplete` disappeared.

### Post-90 season roadmap

The first 90-day challenge runs April 6 through July 4, 2026. Current post-90 planning lives in:

```text
docs/POST_90_SEASON_ROADMAP.md
lib/season-plan.ts
components/season-timeline.tsx
```

Current roadmap:

- July 4, 2026: Day 90 Celebration. Food, drink, and social media restrictions are relaxed for this day only. Challenge Feedback is Supabase-backed and exportable from `/admin/challenge-feedback`. Give Thanks is a real Day 90 task with placeholder text based on *Dignitatis Humanae*; final reading copy still needs to be supplied.
- July 5-31, 2026: Challenge Complete / Reset. No daily task pressure. Night Prayer, Rosary, Confession, community, and past-day review remain available as optional resources.
- August 1-31, 2026: Ordinary Time: James. Planned as a lighter Scripture bridge season with daily James reading, required reflection, Sunday Mass, weekly Adoration, and one Confession in August. Night Prayer, Rosary, workout, anchor check-in, and community are optional.
- September 1, 2026-February 9, 2027: The Gospels. Future metadata only for now. Reading order is Mark -> Matthew -> Luke -> John.
- February 10-March 28, 2027: Lent 2027. Planned as a separate stricter Lenten challenge.

Do not add XP, levels, leaderboards, holiness scores, consistency scores, or gamified spirituality. Keep copy plainspoken and minimal. Preserve track-aware behavior and keep `/brotherhood` as the shared internal community route unless explicitly told otherwise.

---

## 15. Daily Reading System

### Final reading model

The final reading plan is a 90-day Acts + Catechism plan:

- Acts is the narrative backbone.
- Catechism days are integrated as “Go Deeper” style days.
- Romans was considered and rejected.

### Rationale

- Acts shows the Church in motion.
- Acts helps Catholic and non-Catholic users see apostolic authority, baptism, councils, laying on of hands, visible Church structure, mission, witness, and suffering.
- Catechism days provide Catholic interpretation without derailing the Acts backbone.
- Romans would have broadened the plan and weakened the Acts-centered structure.

### Source materials

- Book of Acts text files were uploaded/used.
- Catechism of the Catholic Church PDF was uploaded/used after permission issues were addressed by the user.

### `plan_days` reading fields

Important fields:

```text
reading_mission
reading_focus
reading_title
reading_reference
reading_notes
reading_text
reading_context
previous_reading_summary
reading_today_preview
reading_watch_for
reading_key_terms
reading_context_source_hash
reflection_prompt
```

### `/daily-reading` behavior

- Supports day navigation.
- Shows mission/focus/title/reference/notes/text.
- Shows the Before You Read card when reviewed context fields are stored on
  `plan_days`.
- Splits long text into readable paragraphs.
- Labels Scripture and Catechism days clearly.
- CCC reading text must render on Catechism days.
- Do not bring back placeholder text such as “Paste approved text here...”
- Do not add live AI generation to the user-facing reading page. Context should
  be authored or generated ahead of time, reviewed, stored, and then read from
  Supabase.

### Known reading-content fixes

- Placeholder/helper copy removed.
- Wall-of-text display fixed.
- CCC `reading_text` rendering fixed.
- `reading_focus` vs `reading_notes` binding bug fixed:
  - Reading Focus should render `reading_focus`.
  - Companion Note / Catholic Insight should render `reading_notes`.
- A generic SQL attempt to differentiate duplicate notes exists historically but may not be content-quality sufficient; prefer day-specific authored content when possible.

---

## 16. Reflection and Journaling

### Reflection evolution

The visible Reflection experience became Scripture Reflection / Daily Reflection while preserving internal routes/slugs where needed.

### `/reflection`

Implemented as a dedicated journaling route that:

- loads selected challenge day
- displays `plan_days.reflection_prompt`
- shows reading context
- loads existing entry
- provides textarea/save
- marks Reflection complete only after save

### `user_reflection_entries`

A migration created this table with user-scoped RLS. It stores:

```text
user_id
plan_day_id
challenge_day_number
prompt_text
entry_text
created_at
updated_at
```

Later encryption work added encrypted fields:

```text
entry_ciphertext
entry_iv
entry_auth_tag
encryption_version
```

### Reflection encryption

App-level AES-256-GCM encryption was implemented for reflection journal entries.

Important files:

```text
lib/journal-crypto.ts
scripts/migrate-reflection-encryption.mjs
supabase/migrations/20260413_encrypt_reflection_entries.sql
```

Important env var:

```text
JOURNAL_ENCRYPTION_KEY
```

The key must be base64 and decode to exactly 32 bytes. Losing or changing it makes existing encrypted entries undecryptable.

### Reflection encryption rollout caution

Implementation was committed and linted in Codex, but historical audit did not prove:

- Supabase migration execution
- plaintext migration script execution
- final encrypted-only SQL phase
- live verification

Before relying on encryption state, inspect production DB and current repo.

### Reflection prompt clarity

One prompt was clarified:

Original:

```text
Where is God asking me to step beyond comfort without stepping outside obedience?
```

Suggested clearer wording:

```text
Where is God asking me to choose the harder faithful thing instead of the easier comfortable thing?
```

Simpler option:

```text
What good thing am I avoiding because it is uncomfortable?
```

Future reflection prompts should be Catholic and faithful, but not so abstract that users cannot answer them.

---

## 17. Night Prayer / Compline

Night Prayer was added as a shared daily required task.

### Key route/files

```text
/night-prayer
app/night-prayer/page.tsx
lib/night-prayer.ts
scripts/import-night-prayer.mjs
supabase/migrations/20260512_zzz_add_night_prayer_phase1.sql
```

### Database/cache

A `night_prayers` Supabase table was added for cached Night Prayer content.

### Behavior

- Uses `plan_day_tasks.day_date` as the authoritative lookup date.
- Imports Night Prayer content, including bulk import support.
- Displays Night Prayer / Compline in a solo-prayer-friendly format.
- Follow-up polish improved sign-of-the-cross and Marian antiphon / ending detection/display.

### Verification history

Historical audit reported:

- `npm run build` passed repeatedly.
- One-day and bulk imports were dry-run/verified.
- User confirmed active dates were working.
- Feature was treated as “done-done.”

### Do not regress

- Keep `night-prayer` task slug.
- Keep Night Prayer shared/required daily unless intentionally changed.
- Do not mutate cached DivineOffice content destructively for formatting.
- Preserve attribution/source details.
- If secrets were exposed during setup, rotate them.

---

## 18. Guided Rosary and Audio

Guided Rosary was added with audio and mobile prayer-mode UX.

### Key route/files

```text
/rosary
app/rosary/page.tsx
lib/rosary.ts
components/rosary-audio-player.tsx
```

### Supabase Storage

Audio stored in private bucket:

```text
rosary-audio
```

Files uploaded under:

```text
hallow/jonathan-roumie/
```

The app generates signed URLs for authenticated access.

### Behavior

- Rosary task on `/today` has Guided Rosary secondary action.
- `/rosary` shows prayer text, mysteries, meditations, day navigation, and completion behavior.
- Custom floating audio player added.
- Mobile bottom tab bar hidden on `/rosary`.
- Today pill/escape path retained in floating player.
- `.m4a` files must not be committed to GitHub.

### Mystery schedule

```text
Sunday/Wednesday: Glorious
Monday/Saturday: Joyful
Tuesday/Friday: Sorrowful
Thursday: Luminous
```

Future nuance: Advent/Lent Sunday mystery exceptions may be considered later.

### Do not regress

- Keep private Supabase Storage + signed URL approach.
- Keep audio files outside repo and protected by `.gitignore`.
- Keep `/rosary` focused-prayer mobile behavior.
- Hide mobile bottom tab only on `/rosary`.
- Preserve Today escape path in player.
- Do not remove Storage RLS/policy unless replacing with equivalent secure access.

---

## 19. Dashboard, Today, This Week, Community

### `/dashboard`

Important roles:

- Overview of current challenge day
- Daily status/streak/missed-yesterday logic
- Reflection prompt/Open Reflection
- Today/This Week links
- Community/accountability status

Known important corrections:

- Dashboard daily streak now needs all required daily completion history through selected day, not just today/week completion IDs.
- Use a separate full-history completion set for `buildDailyStreak(...)`.
- Do not reuse today/week-only `completionIds` for streak.

### `/today`

Important roles:

- Main action surface
- Current/selected day
- Required tasks
- Optional tasks
- Weekly/monthly quota progress
- Reading access
- Reflection link
- Night Prayer link
- Rosary link
- Prayer request/daily status controls
- Past-day navigation/backfill
- Future-day lock

Task-card UX has evolved through several passes. Future edits should preserve:

- visible checkbox/toggle
- large mobile-friendly target
- pending/disabled state
- locked label
- row-level click only when safe
- nested interactive element protection
- reflection/journal link behavior
- no double-submit regressions

### `/this-week`

Important roles:

- Monday-Sunday week view
- Daily reading title/reference
- Required/optional task summaries
- Weekly quota progress
- Accessible progress meters where implemented

Weekly quota meters added:

- visual linear bar
- numeric completed/target chip
- `role="progressbar"`
- `aria-valuenow/min/max`
- neutral/accent/success threshold states

75% was chosen historically as near-goal threshold; confirm if product tuning matters.

### `/brotherhood`

Important roles:

- Shared internal community route
- Track-aware display as Brotherhood or Sisterhood
- Same-track member list
- Daily status/check-in/prayer request visibility
- Group participation without ranking
- Member accountability link to `/brotherhood/[userId]`

“Started Today” should mean selected-day completion only. Cumulative weekly/monthly quota progress must not make a user appear started today. A separate “Weekly Momentum” style indicator may be used, but review UI before relying on it.

### `/brotherhood/[userId]`

Important roles:

- Per-member accountability detail
- Same-track access only
- Other members viewable for accountability
- User edits only own completions
- Future day remains locked
- Past-day backfill allowed for self
- Shows task status, quota progress, completion timestamps, reading/reflection context

---

## 20. Daily Status, Prayer Requests, and GroupMe

### Daily status and prayer requests

A migration added:

- `user_daily_checkins`
- `user_prayer_requests`

Features included:

- daily check-in/status
- prayer requests
- same-track visibility
- own-write policies
- authenticated read policies by intended audience/track behavior

### GroupMe weekly recap

A weekly GroupMe recap was added for accountability/prayer status summaries. Message copy was adjusted later.

### GroupMe bot/nightly reminders

GroupMe bot infrastructure was added separately.

Important routes/helpers included:

```text
/api/groupme/test
/api/groupme/send
/api/groupme/nightly-reminder
lib/groupme.ts
lib/groupme-nightly.ts
lib/groupme-weekly.ts
lib/route-auth.ts
lib/server-config.ts
lib/supabase/admin.ts
```

Bot name:

```text
Monsignor Ping
```

### Cron/security

- GroupMe routes are protected by `CRON_SECRET`.
- `/api/groupme/*` had auth/proxy bypasses so cron calls do not redirect to `/auth/login`.
- Nightly reminders use admin/service-role Supabase access.
- Dry-run support should remain.

### Do not regress

- Keep Test Bot and Prod Bot support.
- Keep routes protected by `CRON_SECRET`.
- Keep dry-run support.
- Keep `/api/groupme/*` exempt from auth redirects.
- Keep required-only non-confession variants.
- Keep Confession visible-week special case.
- Rotate secrets if exposed during testing.

---

## 21. Admin, Support, Diagnostics, and Security

### Admin Plan

Admin plan functionality exists at/around:

```text
app/admin/plan/page.tsx
app/admin/plan/export/route.ts
```

The admin plan page has had:

- task/plan editing
- export completions CSV
- diagnostic/admin links depending on current implementation
- task metadata/cadence handling

### Admin authorization

Admin authorization was hardened to fail closed when `ADMIN_EMAILS` is missing/empty.

Important rule:

```text
Empty or missing ADMIN_EMAILS must never mean allow all.
```

Expected behavior:

- unauthenticated admin route access -> 401 or redirect to login
- signed-in non-admin page access -> redirect or deny
- export route -> 403 for signed-in non-admins

Admin allowlist parsing was duplicated in some places historically; future work should extract a shared server-only helper.

### Support/admin diagnostic system

A support/admin system was added with concepts including:

- `app_admins`
- `is_app_admin()`
- hidden diagnostic admin profile
- support request table and RLS
- support pages/actions/email helper
- admin support view
- admin track switcher

One duplicate/parallel commit existed in repo history for this feature. We chose not to deep-audit that unclear branch pair.

### Auth diagnostics

Mid-April auth work added:

- permanent auth logging/reporting
- admin auth reports UI
- auth report download
- `/auth/diag`
- `/auth/report`
- redirect-bounce detection
- pending login redirect marker
- page security context logging

### Mobile login / HTTPS lessons

Mobile login failures were tied to sign-in succeeding while session/cookie persistence failed. HTTP/HTTPS and secure context were likely factors.

Final direction from audits:

- enforce public HTTPS externally through Cloudflare/NPM
- forward internally to app container over HTTP when appropriate
- avoid custom app-layer HTTPS redirect if external proxy handles it
- keep login simple
- do not reintroduce `/auth/session` as blocking login gate
- keep sanitized auth reports admin-only

---

## 22. UI, Theme, and Design System

### Current visual direction

The app has moved toward a restrained Catholic “monastic” visual direction:

- Quiet Monastic light mode
- Monastic Modern dark mode
- parchment/bronze/warm surfaces
- serif-forward headings
- sober components
- restrained motion
- no flashy gamification

### Theme system

A token-based dual-theme system was implemented using:

- CSS variables
- Tailwind semantic color mappings
- `next-themes`
- `ThemeProvider`
- `ThemeSwitcher`

Theme options:

```text
System
Light
Dark
```

Important files include:

```text
app/globals.css
tailwind.config.ts
app/layout.tsx
components/theme-provider.tsx
components/theme-switcher.tsx
```

Do not use brittle internal imports from `next-themes/dist/...`. Use public provider typing, historically:

```ts
React.ComponentProps<typeof NextThemesProvider>
```

### Known UI/design caveats

Some monastic redesign work was broad and partially unsatisfactory. Several Codex attempts included global `!important` utility overrides and partial page restyles. Treat these as historical implementation attempts, not necessarily final design ideals.

Known risks:

- global overrides can affect auth/admin/forms unexpectedly
- many hardcoded arbitrary Tailwind colors make consistency harder
- visual QA was often missing
- some redesigns were not live/user verified
- task-card/card-normalization redo remains unfinished/rejected in at least one Codex path

### Shared UI primitives

Important/recent primitives include:

```text
components/ui/button.tsx
components/ui/badge.tsx
components/page-actions.tsx
components/main-nav.tsx
components/mobile-tab-bar.tsx
components/progress-strip.tsx
components/today-task-card.tsx
```

`AppActionBar` / `PageActions` were added to standardize page-level action links.

Button variants included:

```text
primary
secondary
outline
ghost
default
destructive
link
```

Badge/status variants included:

```text
required
optional
done
started
momentum
```

### Mobile bottom nav

Mobile bottom tab bar has had several fixes:

- active-route states
- safe-area bottom padding
- fixed positioning
- scroll-jitter compositor fixes
- mobile-only rendering
- hidden on `/rosary`

Do not regress mobile safe-area spacing or fixed bottom behavior.

### Progress strip

An authenticated progress strip was attempted/implemented for core pages. It has displayed:

- Day X/Y
- Required completed/total
- N-day streak or Week number depending on implementation phase

Caution: one implementation added extra Supabase queries instead of reusing page-computed values. Monitor for duplicate fetches/latency.

---

## 23. Mobile App Planning

Mobile app planning favored Capacitor.

Current planning decision:

- keep Next.js/Supabase web app as core
- use Capacitor as likely path to iOS/Android
- test Android first on Windows
- iOS requires macOS/Xcode
- PWA/Add to Home Screen remains secondary
- avoid React Native/Expo/native rewrite for now

Suggested identifiers:

```text
iOS bundle ID: com.thenarrowpath.app
Android package ID: com.thenarrowpath.app
```

PWA/Web Push notifications are now implemented for the web app.

Current notification-related concepts include:

```text
push_subscriptions
notification_broadcasts
notification_reminder_slots
notification_reminder_sends
/api/cron/push/reminders
/api/settings/reminder-slots
public/sw.js
```

Reminder slots currently support only:

```text
morning_scripture
night_prayer
```

Mobile native app planning still favors Capacitor later, but the current production notification system is web/PWA push, not native iOS/Android push.

---

## 24. Branding and Visual Assets

A GroupMe avatar concept iteration happened.

Final preferred direction:

- simple narrow path
- no people
- no “GroupMe” text
- path leading upward
- church/heaven destination
- Catholic but not cluttered

Rejected visual directions:

- AI people
- “GroupMe” branding/text
- cluttered foreground Catholic objects like CCC book, statue, rosary
- overly serious heroic tone

This was concepting only; no repo/app changes.


### 2026-05-17 app branding assets

Current preferred brand direction:

- Main/full logo: arch or church doorway, cross, winding path, navy/gold palette, refined Catholic look.
- Notification/tab mark: simplified arch/cross/path, no wordmark, no white square, readable at tiny sizes.
- Avoid cluttered, heroic, or overly ornate AI-generated Catholic imagery.

Current source assets:

```text
assets/branding/source-full-logo.png
assets/branding/source-notification-logo.png
```

Current public app/PWA icon assets:

```text
public/app-icon-v2-192.png
public/app-icon-v2-512.png
public/apple-touch-icon-v2.png
public/maskable-icon-v2-192.png
public/maskable-icon-v2-512.png
```

Current notification assets:

```text
public/notification-icon-192.png
public/notification-badge-96.png
```

Current favicon assets:

```text
public/favicon-light.svg
public/favicon-dark.svg
public/favicon.svg
public/favicon.ico
```

Important branding rules:

- Do not use the full app tile as the notification badge.
- Keep notification assets transparent and simple.
- Keep tab favicons as simplified light/dark arch/cross/path marks.
- Keep PWA launcher icons separate from notification icons.
- If icon files are updated, bump the service worker cache name in `public/sw.js`.
- Existing iOS home-screen PWA icons may not refresh automatically even after filename versioning.

---

## 25. Database and Migration Inventory

The following migrations/features were confirmed across audits. Inspect actual repo for exact SQL.

### Reflection/journaling

```text
20260413_add_reflection_journaling_flow.sql
20260413_encrypt_reflection_entries.sql
20260413_backfill_missing_reflection_prompts.sql
20260413_differentiate_duplicate_focus_notes.sql
```

### Daily status/prayer requests

```text
20260509_add_daily_status_and_prayer_requests.sql
```

### Tracks/Sisterhood

```text
2026-05-09-add-sisterhood-track-foundation.sql
2026-05-09-update-profile-trigger-for-tracks.sql
20260509_mark_universal_tasks_shared.sql
```

### Admin/support

```text
2026-05-09-add-admin-hidden-and-support-requests.sql
```

### Last active

```text
20260511_add_profile_last_active.sql
```

### Rosary/task cadence

```text
20260512_make_rosary_optional_other_days.sql
```

### Task metadata

```text
20260512_ensure_task_metadata_schema.sql
20260512_z_backfill_plan_day_task_metadata.sql
```

### Confession

```text
20260512_zz_fix_confession_final_week_windows.sql
```

### Night Prayer

```text
20260512_zzz_add_night_prayer_phase1.sql
```


### Web Push/reminders

```text
20260517210000_add_notification_reminder_slots.sql
20260517220000_disable_legacy_daily_reminder_preferences.sql
```

Reminder migration notes:

- `notification_reminder_slots` is the active reminder preference table.
- `notification_reminder_preferences` is legacy.
- Explicit grants and RLS are required for new public tables.
- Reminder sends should dedupe by `user_id + reminder_type + reminder_date + local_time`.
- Keep old migrations intact; add new migrations for fixes.

### Migration rules

- Do not edit old migrations after they may have run.
- Prefer new migrations for fixes.
- Before major schema changes, back up Supabase.
- Verify migration has actually run in Supabase; GitHub presence is not enough.
- For production changes, capture before/after counts where relevant.

---

## 26. Known Fixed Issues

Historical fixes include:

- homepage logged-in state
- mobile/desktop login stuck after successful auth
- LAN/mobile dev auth issues investigated
- Brotherhood only showing current user
- public `/about` redirecting to login
- logged-out header tagline removed
- public copy men-only language removed
- task completion doing nothing due RLS/action errors
- launch lock backend enforcement
- challenge timing compatibility fields restored
- `dayDate` vs `day_date` mismatch
- Daily Reading placeholder text removed
- Daily Reading wall-of-text formatting
- CCC text hidden on Catechism days
- Reading Focus vs Companion Note field binding
- Reflection badge showed required despite completion
- Today checkbox UI not updating immediately
- Reflection save feedback/status re-enable
- Confession disappearing before final-week window ended
- Rosary optional on non-rotation days
- task metadata missing `day_date`, `week_start_date`, `month_start_date`
- admin fail-open when `ADMIN_EMAILS` empty
- completed_at/null inconsistent completion semantics
- metadataBase warning
- ESLint scanning `.next`
- mobile tab bar scroll jitter
- Morning/Night reminder slots added and production-tested
- legacy daily reminder spam from `reminder_type = null` fixed/retired
- `/api/settings/daily-reminder` converted to compatibility shim
- notification icon/badge changed from app tile to dedicated notification assets
- PWA app icon filenames versioned for cache-busting
- browser tab favicon updated to simplified light/dark logo mark
- broad slogan-heavy copy cleanup completed
- known unused-variable lint errors fixed

---

## 27. Open Risks and Watch List

### High priority

- Confirm production Supabase schema matches code assumptions before relying on newer features.
- Confirm all important migrations have actually run in production.
- Verify journal encryption rollout state before assuming plaintext is gone.
- Keep `JOURNAL_ENCRYPTION_KEY` secure and stable.
- Keep `ADMIN_EMAILS` configured in production.
- Keep GroupMe/cron secrets rotated if they were exposed.
- Preserve same-track access in all community/detail/prayer/status views.


### Reminder/notification watch items

- Do not re-enable `notification_reminder_preferences` as an active send source.
- Be careful with nullable `reminder_type`; `NULL` values do not dedupe under normal PostgreSQL unique constraints.
- Do not add completion suppression for Morning Scripture or Night Prayer unless explicitly requested.
- Test notification changes on real Android/iPhone devices, not only desktop.
- Home-screen PWA icon refresh on iOS may require reinstalling the PWA.
- Keep notification payloads lock-screen safe: no private task status, Confession status, track, or sensitive state.

### Copy/tone watch items

- Do not reintroduce slogan-heavy UI copy.
- Avoid filler subtitles on cards and sections.
- Prefer functional labels and direct explanations only where needed.
- Keep public copy Catholic and human, but not corporate or fake-profound.

### Medium priority

- Visual/design system still needs careful, screenshot-based QA.
- Some UI attempts were rejected/stale; do not treat all Codex UI branches as final.
- The task-card/card-normalization redo remained unfinished in one path.
- Daily Reading duplicate companion-note content may require hand-authored content, not generic SQL templates.
- Admin auth logic should be centralized.
- `ensureProfileForUser` should not silently ignore upsert errors if current code still does.
- Progress strip may duplicate Supabase reads.
- Mobile app planning is not implementation.

### Operational

- Keep repo clean before Codex work.
- Verify current branch and remote before asking Codex to branch/push.
- If Codex environment has no `origin`, do not trust push/PR claims.
- Use GitHub Actions/logs as source of truth for CI.
- Use live site smoke tests as source of truth for deployment.

---

## 28. Tone and Copy Guidance

### Copy and Tone Rule: Functional, Plainspoken, Minimal

The Narrow Path should not sound corporate, motivational, artificially stern, or fake-profound.

The app should feel:

- Catholic
- plainspoken
- clean
- useful
- human
- calm

The app should not feel:

- like a productivity app with Catholic language
- like a brand campaign
- like a motivational challenge site
- like a stern monastic persona
- like every card needs a slogan or subtitle

Prefer simple functional labels over spiritualized marketing copy.

Good examples:

- Today
- Dashboard
- Daily Reading
- Scripture Reflection
- Required Today
- Optional Today
- Weekly and Monthly Progress
- Brotherhood
- Sisterhood
- Reading
- Tasks
- Reminders
- Settings

Avoid phrases like:

- “the next faithful step”
- “sober attention”
- “without noise”
- “keep the day ordered”
- “daily rhythm”
- “journey”
- “non-negotiable rule”
- “not performance”
- “discipline and fidelity”
- “stays visible without overwhelming the day”
- “return to the brotherhood”
- “concrete obedience”
- generic mission-statement filler

General rule:

If a title already tells the user what the section is, do not add a subtitle unless the subtitle gives necessary functional guidance.

Examples:

- Use: `Weekly and Monthly Progress`
- Avoid: `Flexible disciplines stay visible without overwhelming the day.`

- Use: `Required Today`
- Avoid: `The non-negotiable rule for the day.`

- Use: `Community`
- Avoid: `Return to the Brotherhood with sober attention, not performance.`

Keep necessary guidance where it helps the user understand behavior, permissions, privacy, future-day locking, reminders, settings, or admin diagnostics. Remove text that exists only to sound serious.

### Catholic tone without overdoing it

The app can and should still use Catholic language where it is meaningful:

- prayer
- Scripture
- Catholic teaching
- Mass
- Confession
- sacraments
- accountability
- Church Christ founded
- fidelity
- repentance
- sacrifice

But these words should serve clarity, not decorate every card. Do not make ordinary navigation sound like a mission statement.

### Notification copy

Current reminder notification copy is intentionally simple:

```text
The Narrow Path
Start the day with Scripture.
```

```text
The Narrow Path
End the day in prayer.
```

Do not change this into engagement copy, streak copy, incomplete-task copy, or status-revealing copy.

---

## 29. Future Feature Backlog

Possible future work discussed:

- Close Out Day evening reflection flow
- Missed-day recovery flow
- Admin generated-plan verification screen
- Admin reading/task editor
- Weekly quota reset notes such as “Resets Monday”
- Prayer request presets / answered prayer support
- “Why this task?” dropdowns
- Prepare for Tomorrow card
- Capacitor Android/iOS app shell
- Notification opt-in/onboarding polish
- Better backup/export routine before major schema changes
- More hand-authored Companion Notes
- More refined About page using Logan’s personal voice
- Future women-specific Sisterhood tasks if intentionally designed
- Future route redesign only if explicitly requested

Avoid building these without clear product direction.

---

## 30. Historical Audit Tags

The project-history audit generated many tags. Keep these as reference labels when investigating old work.

### Origin/foundation

```text
#TNP-UNKNOWN-ACTS-CCC-TASKS-LAUNCH-LOCK
#TNP-20260402-FOUNDATION-HOSTING-EARLY-BUILD
#TNP-UNKNOWN-INITIAL-BUILD-AUTH-READING-HANDOFF
#TNP-UNKNOWN-EXODUS-STYLE-APP-BOOTSTRAP-READING-SYSTEM
#TNP-20260512-GITHUB-REPO-CONTEXT-SETUP
#TNP-UNKNOWN-VSCODE-SYNC-PRIVATE-GITHUB-SETUP
#TNP-20260513-SUPABASE-MIGRATIONS-GITHUB
```

### Track/Sisterhood/public copy

```text
#TNP-20260513-SISTERHOOD-TRACK-PUBLIC-COPY
```

### Reading/reflection/prayer features

```text
#TNP-UNKNOWN-REFLECTION-JOURNALING-FLOW
#TNP-20260513-REFLECTION-JOURNAL-ENCRYPTION
#TNP-20260513-REFLECTION-PROMPT-BACKFILL-MIGRATION
#TNP-20260513-REFLECTION-PROMPT-OBEDIENCE
#TNP-20260513-DAILY-READING-FIELD-BINDINGS
#TNP-20260413-DAILY-READING-DUPLICATE-NOTES
#TNP-UNKNOWN-SCRIPTURE-REFLECTION-NIGHT-PRAYER
#TNP-20260513-GUIDED-ROSARY-AUDIO
#TNP-UNKNOWN-ROSARY-OPTIONAL-DAILY
```

### Task cadence/completion/accountability

```text
#TNP-20260513-TASK-METADATA-CODEX-AUDIT
#TNP-UNKNOWN-CONFESSION-FINAL-WEEK-WINDOW
#TNP-20260513-COMPLETION-ROW-EXISTENCE-TOGGLE-CLEANUP
#TNP-20260513-DASHBOARD-STREAK-FULL-REQUIRED-COMPLETIONS
#TNP-UNKNOWN-BROTHERHOOD-STARTED-TODAY-DAY-SPECIFIC
#TNP-20260513-ACCOUNTABILITY-PROFILES-EXPORT-BACKFILL
#TNP-UNKNOWN-LAST-ACTIVE-MEMBER-TRACKING
```

### UI/design

```text
#TNP-20260517-FUNCTIONAL-COPY-TONE-CLEANUP
#TNP-20260517-PWA-BRANDING-NOTIFICATION-FAVICON
#TNP-20260513-NAV-ACTIVE-MOBILE-TABS
#TNP-UNKNOWN-AUTH-PROGRESS-STRIP
#TNP-20260513-WEEKLY-QUOTA-METERS
#TNP-20260513-TODAY-TASK-CARD-ROW-TOGGLE-UX
#TNP-20260513-TASK-COMPLETION-FEEDBACK-AUDIT
#TNP-20260513-MOBILE-TAB-BAR-SCROLL-JITTER
#TNP-20260414-DUAL-THEME-TOKENS
#TNP-20260513-MONASTIC-UI-OVERHAUL-AUDIT
#TNP-20260513-MONASTIC-CONTRAST-MOBILE-NAV-POLISH
#TNP-20260513-LIGHT-MODE-READABILITY-REFINEMENT
#TNP-20260414-MONASTIC-ACTIONS-BADGES
#TNP-UNKNOWN-task-card-redo-conflict-audit
#TNP-20260513-TASK-CARD-REDO-AUDIT
```

### Auth/admin/security

```text
#TNP-UNKNOWN-MOBILE-AUTH-HTTPS-DIAG
#TNP-UNKNOWN-ADMIN-AUTH-FAIL-CLOSED-AUDIT
#TNP-20260513-METADATA-LINT-BUILD-AUDIT
#TNP-UNKNOWN-SUPABASE-USER-EMAIL-LOOKUP
#TNP-UNKNOWN-ADMIN-DIAGNOSTIC-SUPPORT
```

### GroupMe/bots

```text
#TNP-20260517-MORNING-NIGHT-PUSH-REMINDERS
#TNP-20260517-LEGACY-DAILY-REMINDER-RETIREMENT
#TNP-UNKNOWN-GROUPME-BOT-NIGHTLY-REMINDER-SETUP
#TNP-UNKNOWN-DAILY-STATUS-PRAYER-GROUPME-RECAP
```

### Planning/brand/future

```text
#TNP-UNKNOWN-FEATURE-IDEAS-AUDIT
#TNP-20260513-CAPACITOR-APP-PLANNING
#TNP-UNKNOWN-GROUPME-AVATAR-CONCEPT-ITERATION
#TNP-20260513-LOCAL-REPO-COMMIT-HISTORY-AUDIT
```

---

## 31. Recommended Future Codex Prompt Pattern

Use this when starting a new Codex task:

```text
You are working on The Narrow Path.

Before editing, inspect the current repo and this handoff.

Task:
[describe exact bug/feature]

Scope:
- Page/route:
- Files likely involved:
- Public/signed-in/admin/shared/Brotherhood/Sisterhood:
- SQL/migration needed? yes/no/unknown
- Deployment needed? yes/no

Rules:
- Preserve Brotherhood/Sisterhood track behavior.
- Use lib/track.ts helpers where track labels or visibility matter.
- Preserve task audience filtering.
- Preserve completion row-existence semantics.
- Do not add gamification.
- Keep copy functional, plainspoken, and minimal. Avoid slogan-heavy/fake-serious UI text.
- Do not add reminder completion suppression unless explicitly requested.
- Do not commit, push, run migrations, or deploy unless explicitly told.
- Run npm run build.
- Run git diff at the end and summarize exact file changes.
- If you cannot verify something, say so.
```

---

## 32. Final Current-State Assessment

As of this rewritten handoff:

- The Narrow Path is a Catholic accountability app with Brotherhood and Sisterhood tracks.
- The route `/brotherhood` remains the internal shared community route for both tracks.
- The core stack is Next.js + Supabase + GitHub/GHCR + Docker/Unraid.
- The app includes daily tasks, weekly quotas, rotating Rosary, Confession final-week logic, Daily Reading, Reflection journaling, Night Prayer, Guided Rosary, Morning Scripture and Night Prayer push reminders, daily status/prayer requests, GroupMe integrations, admin/support tooling, auth diagnostics, and a developing monastic design system.
- The latest product direction favors simple functional copy over slogan-heavy or fake-serious UI text.
- The strongest confirmed source of truth for implementation is the committed repo plus production Supabase state.
- The biggest risks are regressions around track separation, task cadence, completion semantics, reminder dedupe/source-of-truth, Supabase migration state, secrets, and UI changes made without visual/build verification.
- Future work should be careful, explicit, and small unless the user asks for a larger redesign or architecture pass.

