# The Narrow Path — Master Project Handoff

**Replacement handoff version:** 2026-06-03  
**Project domain:** thenarrowpath.xyz  
**Repository:** logdenmorrow/the-narrow-path  
**Preferred source format:** Markdown  
**Purpose:** This document replaces the older May 9, 2026 PDF handoff and consolidates the original project history, ChatGPT Project audits, Codex Cloud audits, local repo-history audit, the May 17 reminder/branding/tone cleanup checkpoint, and the completed June 2026 implementation/documentation checkpoint into one current source-of-truth document for future ChatGPT Project context.

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

## 1B. June 2026 Completed Checkpoint

This checkpoint consolidates the June 2026 work visible in the current repo and
related audit logs. Treat the current repo and production database as the source
of truth if any pasted summary conflicts with this section. This section is
documentation only; it does not imply a commit, deployment, migration, or
production write happened unless stated below as verified by repo docs/logs.

### June 3 hardening checkpoint

The June 3 hardening pass was a verification/documentation checkpoint around
post-90 season behavior, August James readiness, scheduled announcement push
hardening, and reading integrity.

July reset / Challenge Feedback:

- July 5-31 reset behavior is implemented as code-level reset state, not as a
  July database plan.
- July reset does not show Daily Reading or Scripture Reflection as active July
  tasks.
- Night Prayer, Rosary, Confession, community, past-day review, and Challenge
  Feedback remain available as optional resources where applicable.
- Challenge Feedback opens on Day 90 / July 4 and remains available through
  July 31.
- Challenge Feedback is not treated as overdue or required after July 4.
- A production manual check of the reset/feedback behavior looked good.

August James:

- The public August name is `James: Faith That Works`.
- The internal slug remains `ordinary-time-james`.
- Production migration `20260603120000_update_august_james_public_name.sql`
  updated the plan name by slug.
- Production verification confirmed slug `ordinary-time-james`, name
  `James: Faith That Works`, `total_days = 31`, and `is_active = false`.
- A read-only James readiness audit found no Critical or High issues.
- James content and task rows appear ready, but the plan remains inactive.
- Do not activate James without explicit approval.

August activation caution:

- The current active production plan count remains 1:
  `the-narrow-path-90`.
- Several non-core routes still assume exactly one
  `challenge_plans.is_active = true` row and/or older challenge timing
  assumptions.
- Before August activation, either keep exactly one active plan at a time or
  harden the remaining routes to use shared season resolution.
- If August 1 arrives without activation, James can resolve by date/slug while
  still inactive and may show locked/admin-preview behavior.
- This is a Medium activation hygiene risk, not a current production blocker.

Scheduled announcement push hardening:

- Migration `20260603133000_harden_announcement_push_schedules.sql` was applied
  and verified.
- Schedule status now includes `skipped`.
- A partial unique index enforces one pending scheduled push per announcement.
- Cron dry-run after deployment succeeded with 0 due schedules.
- No real controlled push test was run because Logan chose to skip it.

Reading integrity:

- `npm run scan:reading-integrity` was added.
- The scanner checks `the-narrow-path-90`, `ordinary-time-james`, and
  `the-gospels-september-lent`.
- The scanner is read-only and must never repair, invent, reconstruct,
  paraphrase, or fill Scripture text.
- The latest production scan after deployment reported 283 total days, 248
  Scripture days, 35 Catechism days, 29 errors, and 4 warnings.
- `the-narrow-path-90`: 90 days, 0 errors, 3 warnings.
- `ordinary-time-james`: 31 days, 0 errors, 1 acceptable Day 1
  previous-summary warning.
- `the-gospels-september-lent`: 162 days, 29 errors, all missing
  `reading_key_terms`.
- No missing Scripture text, missing Scripture headings, or missing Scripture
  verse markers were reported.
- Catechism detection currently uses `reading_reference` starting with `CCC`.
  Current loaded rows are safe enough for now, but an explicit `reading_type` or
  `reading_kind` field would be safer later.
- `/daily-reading` now shows a clear warning if reading text is missing and
  states the app will not fill missing Scripture text automatically.

Known non-blockers / future work:

- Gospel preview remains inactive and has 29 key-term gaps.
- Day 1 previous-summary warnings are acceptable.
- Catechism paragraph marker warnings on Narrow Path 90 days 49 and 56 are
  warnings only, not missing content.
- Admin export/download scanner failures remain low-priority admin tooling
  cleanup.
- GroupMe routes/helpers remain intentionally unchanged until after Sunday
  weekly recap verification. Do not claim GroupMe is fully removed.

### `/today` task toggle fix

The `/today` completed task unchecking bug was fixed. Task completion remains
row-existence based:

- row exists in `user_task_completions` = completed
- row absent = incomplete
- toggle on inserts a completion row
- toggle off deletes matching completion rows

`components/today-task-card.tsx` now toggles optimistic client state from the
current displayed state instead of stale server props. `app/today/actions.ts`
treats one-or-more completion rows as complete and deletes all matching rows on
toggle-off, which makes the feature resilient to duplicate completion rows.

Reflection and challenge feedback records no longer override task completion
unless a matching `user_task_completions` row exists. Their save actions may
still auto-complete their own tasks, but duplicate completion inserts are
avoided.

Important files:

```text
components/today-task-card.tsx
app/today/actions.ts
app/today/page.tsx
lib/task-progress.ts
app/reflection/actions.ts
app/challenge-feedback/actions.ts
app/brotherhood/page.tsx
app/brotherhood/[userId]/page.tsx
app/dashboard/page.tsx
components/progress-strip.tsx
lib/homepage-overview.ts
```

Verification noted in the June summaries:

- `npm run build` passed.
- Playwright caught the toggle bug before deployment.
- The exact final post-deployment Playwright output for this toggle fix was not
  present in the repo context reviewed for this handoff, so do not quote a final
  exact output unless a later log is supplied.
- A dedicated Playwright test account was hidden from community lists by setting
  `is_hidden_from_community = true`. Do not document or commit its password or
  auth state.

### Playwright E2E for `/today`

Playwright E2E auth setup exists for authenticated `/today` task toggle testing.
New E2E auth state uses `.auth/user.json`; older scanner flows may still use
separate auth JSON files.

Important files:

```text
playwright.config.ts
tests/e2e/auth.setup.ts
tests/e2e/test-env.ts
tests/e2e/today-toggle.spec.ts
docs/PLAYWRIGHT_E2E.md
.gitignore
package.json
```

Local-only files must not be committed:

```text
.env.playwright.local
.auth/
playwright/.auth/
playwright-auth.json
playwright-report/
test-results/
```

Production mutation tests must only run with dedicated test accounts and exact
safety flags. For The Narrow Path production scanners, default examples to:

```text
https://thenarrowpath.xyz
```

Do not default scanner examples to localhost unless explicitly documenting local
testing.

### Catechism reading formatting

Catechism readability was improved on `/daily-reading`. Active Narrow Path 90
Catechism content is raw CCC paragraph text, not Gospel-style structured
markers. `ReadingTextRenderer` now supports a Catechism variant, and
`app/daily-reading/page.tsx` passes that variant based on existing CCC reference
detection.

CCC paragraph numbers render as readable badges. Long CCC paragraphs are spaced
more comfortably. Lists, headings, and raw CCC paragraphs are handled without
changing stored Catechism content. Mobile/narrow-screen safeguards were added to
avoid overflow and preserve readability.

Important files:

```text
app/daily-reading/page.tsx
components/reading-text-renderer.tsx
```

Verification reported in the June summaries:

- `npm run lint` passed.
- `npm run build` passed.
- Mobile and desktop browser checks were reported.
- A production visual check on `https://thenarrowpath.xyz` was accepted.

### Acts and James structured reading formatting

Acts and James readings were standardized to the same structured Scripture
format used by Gospel readings:

```text
### Section Heading
**n.** Verse text
```

This was a content migration, not a new renderer/UI change. Acts readings in
active `the-narrow-path-90` and James readings in `ordinary-time-james` were
updated. The source was the Ascension Web App RSV2CE, following the established
Gospel source pattern. Logan stated he has permission from Ascension for this
parish-scale use. Preserve documented RSV2CE omissions; do not invent omitted
verses.

Important files:

```text
scripts/fetch-ascension-scripture-source.mjs
scripts/build-structured-scripture-reading-sql.mjs
content/scripture/structured-reading-targets.json
content/scripture/source/README.md
content/scripture/source/acts-rsv2ce-ascension.json
content/scripture/source/acts-rsv2ce-ascension.md
content/scripture/source/james-rsv2ce-ascension.json
content/scripture/source/james-rsv2ce-ascension.md
content/scripture/source/ascension-scripture-diagnostics.md
supabase/migrations/20260601130000_structure_acts_james_reading_text.sql
supabase/generated/structured-acts-james-reading-text-review.sql
```

Database notes:

- Migration: `20260601130000_structure_acts_james_reading_text.sql`
- Updated only `public.plan_days.reading_text`
- Targeted `the-narrow-path-90`: 78 Acts rows
- Targeted `ordinary-time-james`: 31 James rows
- Total rows: 109
- No schema, RLS, task, profile, prayer, notification, or plan activation
  changes.

Verification reported:

- `npm run lint` passed.
- `npm run build` passed.
- Supabase dry-run showed only the intended migration.
- The real Supabase push was run.
- Production verification showed `ordinary-time-james` 31/31 rows and
  `the-narrow-path-90` 78/78 rows had headings and verse markers with 0 problem
  rows.
- Production Acts day 57 was manually checked and rendered correctly.
- Browser smoke was reported for Acts, James preview, Gospel preview, and
  Catechism at mobile width.
- Do not claim a user-shown James production screenshot unless it is supplied.

### Public Roadmap / News page

`/news` exists as a public, display-only Roadmap page. It was initially
signed-in only and was changed to public so visitors can see what is coming
before signing up. Roadmap data is centralized in `lib/season-plan.ts`.

The Roadmap appears:

- full page at `/news`
- teaser on the logged-out homepage
- linked from signed-in account menu/settings

This is not a CMS/admin announcement system.

Roadmap items:

- Narrow Path 90
- July reset / short break
- August 2026 / James: Faith That Works
- September 1, 2026 to February 9, 2027 / The Gospels
- Lent 2027 stricter season

Important files:

```text
app/news/page.tsx
app/page.tsx
components/roadmap-timeline.tsx
lib/season-plan.ts
lib/supabase/proxy.ts
components/account-menu.tsx
components/auth-nav.tsx
components/mobile-account-menu.tsx
app/settings/page.tsx
```

Verification reported:

- `npm run build` passed.
- Visual screenshots were checked and accepted.
- `/news` is public.

### Announcements system

Signed-in announcements MVP was added:

- `/announcements`
- `/announcements/[slug]`
- `/admin/announcements`

Announcements support:

- draft, published, and archived status
- pinned state
- read receipts
- CTA fields
- category
- audience targeting: `all`, `brotherhood`, `sisterhood`

Normal users can see only published, active, non-expired announcements visible
to their track. Opening an announcement marks it read. Body text is plain text
rendered as paragraphs. No comments, reactions, uploads, or rich-text editor
were added.

Important files:

```text
app/announcements/page.tsx
app/announcements/[slug]/page.tsx
app/admin/announcements/page.tsx
app/admin/announcements/actions.ts
lib/announcements.ts
supabase/migrations/20260601143000_add_announcements.sql
```

Database:

- `public.announcements`
- `public.announcement_reads`
- RLS restricts normal users to published active announcements visible to their
  audience.
- `announcement_reads` are own-user only.
- Admins manage through admin authorization / `public.is_app_admin()`.

Verification reported:

- Supabase dry-run passed.
- Real migration push was run.
- Production admin/list/detail flows were visually checked.

### Announcement PWA pushes

Admins can manually send PWA push notifications for visible published
announcements. Draft, archived, expired, future-published, and invisible
announcements do not show/send push. Push URLs point to
`/announcements/{slug}`.

Audience filtering:

- `all`
- `brotherhood`
- `sisterhood`

Broadcast/delivery records are logged. Dead or revoked subscriptions are
handled by the existing push helper.

Important files:

```text
lib/push/announcement-broadcasts.ts
app/admin/announcements/page.tsx
app/admin/announcements/actions.ts
supabase/migrations/20260602120000_allow_announcement_push_broadcast_audiences.sql
```

Database:

- Updated `notification_broadcasts` audience check to allow
  `announcement:all`, `announcement:brotherhood`, and
  `announcement:sisterhood`.

Verification reported:

- Supabase dry-run passed.
- Real push was run.
- Manual production announcement push was tested and delivered.
- Admin showed 3 delivered, 0 failed, 0 revoked.
- Logan later received the notification.

### Scheduled announcement pushes

Admins can schedule future PWA pushes for visible published announcements.
Pending scheduled pushes can be canceled. The protected cron route processes due
schedules:

```text
/api/cron/push/announcement-schedules
```

It supports `dryRun=1` and `limit`, capped at 50. Due jobs are claimed by
`pending -> sending` to avoid duplicate sends. Schedule rows store broadcast and
delivery counts.

Important files:

```text
app/api/cron/push/announcement-schedules/route.ts
app/admin/announcements/actions.ts
supabase/migrations/20260602123000_add_announcement_push_schedules.sql
```

Database:

- Created `public.announcement_push_schedules`.
- Admin-only RLS for normal authenticated users.
- Service role is used for cron/admin operations.

Verification reported:

- Supabase dry-run passed.
- Real migration push was run.
- Scheduled announcement push was production tested.
- Unraid cron processed it.
- Logan reported it worked.

### Weekly recap announcement cron

Weekly recap cron MVP was added:

```text
/api/cron/announcements/weekly-recap
```

It is protected by `CRON_SECRET` and supports `dryRun=1` and
`asOf=YYYY-MM-DD`. It computes a Monday-Sunday week in
`America/New_York`.

The cron generates separate announcements for:

- Brotherhood audience
- Sisterhood audience

It does not create an all-users recap. It uses predictable slugs to prevent
duplicate creation/sending:

```text
weekly-recap-brotherhood-YYYY-MM-DD
weekly-recap-sisterhood-YYYY-MM-DD
```

The category is `recap`; the announcement publishes immediately and sends a push
after creation. Push title is `Weekly Recap`; push body is the summary only and
does not include prayer request text. Push URL points to the announcement
detail.

Important files:

```text
app/api/cron/announcements/weekly-recap/route.ts
lib/announcements-weekly-recap.ts
lib/push/announcement-broadcasts.ts
supabase/migrations/20260602130000_add_recap_announcement_category.sql
```

Caution:

- Real Sunday generation/send was not verified in the repo context reviewed for
  this handoff.
- Weekly recap dry-run worked from Unraid.
- Do not claim the first real scheduled Sunday run succeeded unless later logs
  prove it.

### GroupMe transition

Official communication moved away from GroupMe and into:

- in-app Roadmap
- in-app Announcements
- personal reminder pushes
- scheduled announcement pushes
- weekly recap announcements/pushes

The existing GroupMe nightly reminder script was disabled. The existing GroupMe
weekly recap script was disabled. GroupMe may still exist for discussion/chat,
but it is not the main reminder/recap delivery path. Do not claim GroupMe was
fully removed from the repo; GroupMe routes and helpers still exist.

### Gospel season database staging and Supabase CLI repair

Inactive Gospel season staging was completed in production. Supabase CLI was
linked to the production project. Historical migration filenames were normalized
to unique 14-digit timestamp prefixes, and remote migration history was repaired.

After repair, `npx supabase db push --dry-run` showed only:

```text
20260527150103_add_gospels_september_lent_draft_plan.sql
```

A real `npx supabase db push` was then run successfully.

Production now contains an inactive plan:

```text
slug: the-gospels-september-lent
name: The Gospels: From September to Lent
total_days: 162
is_active: false
start: September 1, 2026
end: February 9, 2027
```

Production verification:

- `plan_days`: 162
- `plan_day_tasks`: 1,481
- Task counts:
  - `adoration`: 162
  - `attend_mass`: 23
  - `check_in_anchor`: 162
  - `confession`: 162
  - `night-prayer`: 162
  - `reading`: 162
  - `reflection`: 162
  - `rosary`: 162
  - `weekly_fast_or_penance`: 162
  - `workout`: 162

Important decisions:

- Gospel season remains inactive.
- `weekly_fast_or_penance` is included as a weekly quota task.
- `temperance` remains an app/season rule, not a task row.
- `give_up_alcohol` was not reused.
- Standalone `fast` was not reused.
- Before You Read context was deferred at the original Gospel staging point and
  later applied through a separate migration.

Important files:

```text
supabase/migrations/20260527150103_add_gospels_september_lent_draft_plan.sql
docs/GOSPELS_SEASON_POST_APPLY_AUDIT.md
docs/SUPABASE_CLI_MIGRATION_HISTORY_REPAIR_PLAN.md
docs/SUPABASE_CLI_MIGRATION_FILENAME_NORMALIZATION_PLAN.md
supabase/generated/verify-existing-migrations-before-repair.sql
supabase/generated/verify-gospels-season-prerequisites.sql
```

Cautions:

- Future database work should use normalized migration filenames.
- Always run `npx supabase db push --dry-run` before a real push.
- Do not run a real push unless dry-run shows only the intended migration.
- Do not paste huge SQL into Supabase SQL Editor unless CLI workflow is
  unavailable.

### Gospel preview/readiness/timing refactors

Admin-only inactive Gospel preview was added and verified. Routes supporting
admin preview include:

- `/today`
- `/this-week`
- `/daily-reading`
- `/reflection`

Inactive Gospel preview is read-only:

- completion locked
- reflection saving locked
- accountability/daily status/prayer input locked where applicable

Non-admin users cannot access inactive Gospel content by adding query params.
Gospel Daily Reading formatting uses `ReadingTextRenderer` with headings and
verse numbers.

Gospel Before You Read context was generated, QA'd, migrated, and production
verified later. The migration:

```text
supabase/migrations/20260529120000_add_gospels_before_you_read_context.sql
```

updates only reading context fields:

- `reading_context`
- `previous_reading_summary`
- `reading_today_preview`
- `reading_watch_for`
- `reading_key_terms`
- `reading_context_source_hash`

It does not update:

- `reading_text`
- `reading_title`
- `reading_reference`
- `reflection_prompt`
- `plan_day_tasks`
- `is_active`

Production verification showed all 162 Gospel days had context fields
populated, and the Gospel plan remained inactive.

Season-aware timing refactors reduced hardcoded 90-day assumptions across:

- progress strip
- homepage overview
- Brotherhood pages
- Night Prayer
- Rosary
- Admin Plan
- dashboard/final-day labels

`/admin/plan/export` bug was found by the broad audit and fixed. Gospel
activation readiness and activation plan docs were added. Gospel plan was not
activated.

Important files:

```text
lib/season-plan.ts
lib/plan-day-url.ts
lib/season-plan-server.ts
app/today/page.tsx
app/this-week/page.tsx
app/daily-reading/page.tsx
app/reflection/page.tsx
components/progress-strip.tsx
lib/homepage-overview.ts
app/brotherhood/page.tsx
app/brotherhood/[userId]/page.tsx
app/night-prayer/page.tsx
app/rosary/page.tsx
app/admin/plan/page.tsx
app/dashboard/page.tsx
app/admin/plan/export/route.ts
components/reading-text-renderer.tsx
scripts/scan-gospel-preview.mjs
scripts/audit-production-pages.mjs
docs/GOSPEL_ACTIVATION_READINESS_AUDIT.md
docs/GOSPEL_ACTIVATION_PLAN.md
docs/PRODUCTION_CHECKS.md
```

Production scanners:

- `scripts/scan-gospel-preview.mjs` checks selected production Gospel preview
  pages and uses saved local auth state.
- `scripts/audit-production-pages.mjs` performs a broader read-only production
  route audit.
- Auth/log files must not be committed.
- The Gospel preview scanner previously reported 8/8 passed.
- The broad production audit documented in `docs/GOSPEL_ACTIVATION_PLAN.md`
  reported total 44, passed 44, failed 0.

### Prayer request visibility/private-shared feature

Prayer requests support:

```text
visibility = 'track' | 'shared'
```

Default is `track`. Existing prayer requests were backfilled to `track`,
preserving prior privacy behavior. New request UI defaults to `Private to
Brotherhood` or `Private to Sisterhood`; users can explicitly choose `Shared
with both tracks`.

Visibility rules:

- Private Brotherhood requests are visible only to Brotherhood.
- Private Sisterhood requests are visible only to Sisterhood.
- Shared requests are visible to both tracks.
- Opposite-track shared requests show generic author labels:
  - `A Brother`
  - `A Sister`
- Full names are not exposed cross-track.
- Missing/deleted author profiles are excluded from cross-user prayer request
  visibility.
- Hidden community profiles remain excluded from cross-user visibility.
- Admins may read all where policy allows, but admin access is not normal-user
  privacy proof.

Important files:

```text
components/prayer-request-card.tsx
app/today/actions.ts
app/today/page.tsx
app/brotherhood/page.tsx
lib/prayer-requests.ts
lib/announcements-weekly-recap.ts
lib/groupme-weekly.ts
supabase/migrations/20260602133000_add_prayer_request_visibility.sql
```

Database:

- Adds `visibility` to `public.user_prayer_requests`.
- Backfills existing rows to `track`.
- Adds check constraint for `track` / `shared`.
- Adds default `track`.
- Sets `visibility` NOT NULL.
- Adds index on `(visibility, request_date)`.
- Replaces/updates read RLS so signed-in users can read own requests,
  same-track visible members' private requests, visible members' shared
  requests from either track, and admins can read all.
- RLS requires joined profile/subject profile for cross-user visibility.

Weekly recap / announcement behavior:

- Weekly recaps respect prayer request visibility.
- Private Brotherhood requests do not appear in Sisterhood recaps.
- Private Sisterhood requests do not appear in Brotherhood recaps.
- Shared requests may appear in both tracks' recaps.
- Opposite-track shared authors are generic.
- Existing stored announcement text was not mutated.
- Legacy GroupMe weekly count is scoped to Brotherhood and counts
  Brotherhood-private plus shared requests visible to Brotherhood.

Verification reported:

- `npm run build` passed.
- `npx supabase db push --dry-run` passed and showed only
  `20260602133000_add_prayer_request_visibility.sql`.
- The real migration push was run before deployment according to the June
  summary supplied for this handoff.
- Missing/deleted author profile hardening was added after review.

### Prayer request visibility Playwright scanner

New scanner:

```text
scripts/scan-prayer-request-visibility.mjs
```

NPM command:

```text
npm run scan:prayer-visibility
```

Gitignored local auth states:

```text
playwright/.auth/admin.json
playwright/.auth/brotherhood.json
playwright/.auth/sisterhood.json
```

Gitignored local log:

```text
prayer-request-visibility-scan-log.json
```

`.env.playwright.local` may be used locally and must not be committed. The
scanner default base URL is `https://thenarrowpath.xyz`, not localhost. It loads
`.env.playwright.local` before reading `PLAYWRIGHT_BASE_URL` or mutation flags.

Mutation gates require exact string values:

```text
PLAYWRIGHT_ALLOW_MUTATIONS === "true"
PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS === "true" for non-local URLs
```

Admin smoke can check UI labels/admin behavior, but admin smoke does not prove
normal-user RLS/privacy. Normal privacy proof requires non-admin Brotherhood and
Sisterhood auth states.

The scanner creates only obvious temporary requests using
`PW_VISIBILITY_TEST_<timestamp>` markers. Cleanup only deletes test-marked
requests and refuses to overwrite non-test requests.

Production setup commands:

```powershell
npm run scan:prayer-visibility -- --setup-auth admin --base-url https://thenarrowpath.xyz
npm run scan:prayer-visibility -- --setup-auth brotherhood --base-url https://thenarrowpath.xyz
npm run scan:prayer-visibility -- --setup-auth sisterhood --base-url https://thenarrowpath.xyz
```

Production non-admin privacy scan:

```powershell
$env:PLAYWRIGHT_ALLOW_MUTATIONS='true'
$env:PLAYWRIGHT_ALLOW_PRODUCTION_MUTATIONS='true'
npm run scan:prayer-visibility -- --non-admin --headless --base-url https://thenarrowpath.xyz
```

Production verification result from `prayer-request-visibility-scan-log.json`:

- Base URL: `https://thenarrowpath.xyz`
- Normal Brotherhood and Sisterhood auth states were used.
- Total: 16
- Passed privacy checks: 8
- Failed: 0
- Skipped: 0
- Verified:
  - pre-run cleanup passed for Brotherhood and Sisterhood
  - Brotherhood private visible to Brotherhood
  - Brotherhood private hidden from Sisterhood
  - Brotherhood shared visible to both with generic `A Brother` label for
    Sisterhood
  - Sisterhood private visible to Sisterhood
  - Sisterhood private hidden from Brotherhood
  - Sisterhood shared visible to both with generic `A Sister` label for
    Brotherhood
  - created test requests were cleaned up successfully
- Final cleanup entries of `marker_not_present` were expected because earlier
  cleanup had already removed the test requests.

Bugs fixed during scanner implementation:

- Initial scanner defaulted to localhost; fixed to default to
  `https://thenarrowpath.xyz`.
- `.env.playwright.local` was not automatically loaded; fixed.
- Duplicate label text caused strict locator failures; fixed with
  duplicate-safe assertions.
- Scanner initially tried to create private and shared requests for the same
  user on the same day without cleanup; fixed by save/verify/delete sequencing.
- Cleanup initially missed private markers; fixed.
- Sisterhood auth state was invalid once and redirected to login; recaptured
  auth state fixed it.

### June 2026 claim boundaries

Do not claim:

- Future Gospel season is active.
- Lent 2027 season is implemented.
- Weekly recap real Sunday send happened unless logs prove it.
- GroupMe is completely removed.
- Admin smoke tests prove normal-user privacy.
- Playwright auth JSON contents should be committed.
- `.env.playwright.local` should be committed.
- Old stored announcement text was changed.
- Every possible future season-safe timing assumption has been found and fixed.
- Every device/browser was tested.

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
npm run build:reading-context-sql
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

Production UI checks should run only after this deployment chain has completed.
See `docs/PRODUCTION_CHECKS.md` for the Playwright production scanner workflow.

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
- August 1-31, 2026: James: Faith That Works. Planned as a lighter Scripture bridge season with daily James reading, required reflection, Sunday Mass, weekly Adoration, and one Confession in August. Night Prayer, Rosary, workout, anchor check-in, and community are optional.
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

### Stored Before You Read context

A reviewed, stored Before You Read system was added for Daily Reading because users could open a Scripture or Catechism reading and feel lost if they did not remember yesterday's passage or did not know Scripture well.

Product goal:

- Give the user just enough context to read today's passage with confidence.
- Keep the reading page helpful without turning it into a long commentary.

Important product decision:

- Do **not** generate this live in the app.
- Reading context may be authored or AI-assisted ahead of time, but it must be reviewed, stored in Supabase, and displayed from saved fields.
- The production app should not call AI to generate reading context.

Reasons:

- Stable wording for all users.
- No production AI cost.
- No page-load delay.
- No inconsistent theology.
- Reviewable Catholic content.
- Reusable workflow for future reading plans.

Schema added to `public.plan_days` by `supabase/migrations/20260519_add_plan_day_reading_context.sql`:

```text
reading_context text
previous_reading_summary text
reading_today_preview text
reading_watch_for text
reading_key_terms jsonb
reading_context_source_hash text
```

Meaning:

- `reading_context` = Where We Are
- `previous_reading_summary` = Yesterday
- `reading_today_preview` = Today
- `reading_watch_for` = Watch For
- `reading_key_terms` = Key Terms
- `reading_context_source_hash` = future stale-content/change detection

### `/daily-reading` behavior

- Supports day navigation.
- Shows mission/focus/title/reference/notes/text.
- Shows the Before You Read card when reviewed context fields are stored on
  `plan_days`.
- Only shows the Before You Read card when at least one text context section or
  key term exists.
- Only shows sections that have content.
- Day 1 usually has `previous_reading_summary = null`.
- `reading_key_terms` supports JSONB term/definition objects. The page also
  tolerates simple strings and object maps for compatibility.
- Does not show user-facing placeholder copy when context has not been stored.
- Splits long text into readable paragraphs.
- Labels Scripture and Catechism days clearly.
- CCC reading text must render on Catechism days.
- Do not bring back placeholder text such as “Paste approved text here...”
- Do not add live AI generation to the user-facing reading page. Context should
  be authored or generated ahead of time, reviewed, stored, and then read from
  Supabase.

Current Before You Read sections:

```text
Where We Are
Yesterday
Today
Watch For
Key Terms
```

### Reading context SQL workflow

The reusable conversion script is:

```text
scripts/build-reading-context-sql.mjs
```

NPM script:

```bash
npm run build:reading-context-sql
```

Example command:

```bash
npm run build:reading-context-sql -- --input content/reading-context/the-narrow-path-90-days-1-14.json --output supabase/generated/the-narrow-path-90-reading-context-days-1-14.sql
```

The script:

- Reads reviewed JSON.
- Validates shape.
- Targets `plan_days` by `challenge_plans.slug` and `plan_days.day_number`.
- Generates SQL only.
- Does not connect to Supabase.
- Does not run SQL.
- Escapes SQL strings safely.
- Serializes `reading_key_terms` to JSONB.
- Does not update `reading_text`, `reading_title`, `reading_reference`, or
  existing reflection fields.

Reviewed JSON shape:

```json
{
  "planSlug": "the-narrow-path-90",
  "note": "Reviewed Before You Read content...",
  "days": [
    {
      "dayNumber": 1,
      "readingContext": "...",
      "previousReadingSummary": null,
      "readingTodayPreview": "...",
      "readingWatchFor": "...",
      "readingKeyTerms": [
        {
          "term": "...",
          "definition": "..."
        }
      ],
      "readingContextSourceHash": "the-narrow-path-90-day-1-v1"
    }
  ]
}
```

More workflow detail is documented in `docs/reading-context-workflow.md`.

### Completed reviewed reading context

The full `the-narrow-path-90` Acts + Catechism plan has reviewed Before You Read content for all 90 days.

Reviewed JSON:

```text
content/reading-context/the-narrow-path-90-days-1-14.json
content/reading-context/the-narrow-path-90-days-15-28.json
content/reading-context/the-narrow-path-90-days-29-42.json
content/reading-context/the-narrow-path-90-days-43-56.json
content/reading-context/the-narrow-path-90-days-57-70.json
content/reading-context/the-narrow-path-90-days-71-90.json
```

Generated SQL:

```text
supabase/generated/the-narrow-path-90-reading-context-days-1-14.sql
supabase/generated/the-narrow-path-90-reading-context-days-15-28.sql
supabase/generated/the-narrow-path-90-reading-context-days-29-42.sql
supabase/generated/the-narrow-path-90-reading-context-days-43-56.sql
supabase/generated/the-narrow-path-90-reading-context-days-57-70.sql
supabase/generated/the-narrow-path-90-reading-context-days-71-90.sql
```

Supabase audit recorded for Acts:

```text
total_days: 90
has_context: 90
has_today_preview: 90
has_watch_for: 90
has_key_terms: 90
has_source_hash: 90
```

The August James plan uses slug:

```text
ordinary-time-james
```

Completed/reviewed James files:

```text
content/reading-context/ordinary-time-james-days-1-31.json
supabase/generated/ordinary-time-james-reading-context-days-1-31.sql
```

James was handled as an epistle/theme flow, not a fake narrative. The content follows themes like trials, wisdom, poverty/wealth, temptation, doing the word, partiality, faith and works, speech, wisdom, worldliness, humility, judgment, wealth/injustice, patience, prayer, confession, and bringing back the wanderer.

Tone notes for reviewed reading context:

- Plainspoken.
- Catholic.
- Helpful for beginners.
- Direct Catholic clarity is allowed.
- Not academic.
- Not vague ecumenical mush.
- Not a comment-section fight.
- Real faith should be shown as becoming obedience, mercy, and works of charity.

### Future Gospel plan workflow

Reuse the same stored context system. Do not add live AI. Do not create new UI unless necessary.

For a future September-to-Lent four Gospels plan:

1. Create or seed the final Gospel reading plan in `plan_days` first.
2. Export the exact seeded plan from Supabase with full `reading_text`.
3. Generate reviewed JSON context batches from that final export.
4. Convert reviewed JSON to SQL using `scripts/build-reading-context-sql.mjs`.
5. Review SQL manually.
6. Run SQL manually in Supabase.
7. Audit count coverage.
8. Spot-check with full production URLs.
9. Commit reviewed JSON and generated SQL.

Suggested export query:

```sql
select
  cp.slug as plan_slug,
  pd.day_number,
  pd.reading_title,
  pd.reading_reference,
  pd.reading_focus,
  pd.reading_notes,
  pd.reading_text
from public.plan_days pd
join public.challenge_plans cp on cp.id = pd.plan_id
where cp.slug = '<future-gospels-plan-slug>'
order by pd.day_number;
```

Writing formula for future Gospel reading-context content:

- Where We Are: one sentence placing the reader in the Gospel story.
- Yesterday: 1-3 sentences summarizing the prior reading.
- Today: 1-2 sentences previewing today's passage.
- Watch For: one concrete thing to notice spiritually, doctrinally, narratively,
  or morally.
- Key Terms: only beginner-helpful terms.

For Gospels, context should help users track:

- Which Gospel they are in.
- Where Jesus is geographically when relevant.
- Who is speaking.
- Who groups like Pharisees, Sadducees, scribes, disciples, crowds, Romans, and
  Samaritans are.
- Whether the passage is a miracle, parable, teaching, conflict, Passion event,
  or Resurrection appearance.
- How today connects to yesterday.
- How it fits the movement toward Jerusalem, the Cross, and the Resurrection.

Gospel angle reminders:

- Matthew: fulfillment, kingdom, Church, teaching authority.
- Mark: urgency, discipleship, suffering Messiah.
- Luke: mercy, prayer, poor/outcast, Holy Spirit, Jerusalem.
- John: signs, belief, divine identity, sacraments, glory.

Testing URL preference:

- Use full copy/paste production URLs in docs and future prompts.
- Use `https://thenarrowpath.xyz/daily-reading?day=1`.
- Do not use route-only examples like `/daily-reading?day=1` when asking for
  production spot checks.

Example spot-check links:

```text
https://thenarrowpath.xyz/daily-reading?day=1
https://thenarrowpath.xyz/daily-reading?day=7
https://thenarrowpath.xyz/daily-reading?day=35
https://thenarrowpath.xyz/daily-reading?day=63
https://thenarrowpath.xyz/daily-reading?day=84
https://thenarrowpath.xyz/daily-reading?day=90
```

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

### Reading context

```text
20260519_add_plan_day_reading_context.sql
```

Reading context migration notes:

- Adds nullable stored Before You Read fields to `public.plan_days`.
- App reads saved fields only; do not add live AI generation for reading
  context.
- Generated content SQL lives in `supabase/generated/` and should be manually
  reviewed before being applied.

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

