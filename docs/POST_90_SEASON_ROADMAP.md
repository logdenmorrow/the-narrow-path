# Post-90 Season Roadmap

This note records the current plan after the first 90-day challenge. Treat the local repo and applied Supabase migrations as the source of truth before changing code or data.

## Day 90: July 4, 2026

Special Celebration day. Food, drink, and social media restrictions are relaxed for this day only.

- Challenge Feedback is Supabase-backed and exportable from `/admin/challenge-feedback`.
- Give Thanks is a real Day 90 task with placeholder text based on Vatican II's *Dignitatis Humanae*.
- Final Give Thanks reading copy still needs to be supplied manually before production use.

## July 5-31, 2026: Challenge Complete / Reset

No daily task pressure. Night Prayer, Rosary, Confession, community, and past-day review remain available as optional resources.

## August 1-31, 2026: Ordinary Time: James

A lighter Scripture bridge season after the 90 days.

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

Do not treat the outline as final verse splits. Final James reading text, daily references, reading titles, and reflection prompts still need to be supplied before generating plan data.

Use this template for the content pass:

```text
docs/AUGUST_JAMES_CONTENT_TEMPLATE.md
```

Implementation notes:

- Current reading content is stored on `plan_days` using `reading_mission`, `reading_focus`, `reading_title`, `reading_reference`, `reading_notes`, `reading_text`, and `reflection_prompt`.
- Current task assignments use `task_templates` and `plan_day_tasks`.
- Current pages still load a single `challenge_plans.is_active = true` plan and use the April 6, 2026 start date in `lib/challenge.ts`.
- Do not mark a second plan active without first updating plan/season selection logic; existing `.maybeSingle()` queries expect one active plan.
- Once final content is provided, the safe data path is a migration or controlled import that creates the August plan days and assigns only the August task set.
- August task data should include reading/reflection, Sunday Mass, weekly Adoration, monthly Confession, and optional prayer/community tasks. It should not include the original food, drink, cold shower, social media, fasting, or meat-abstinence challenge restrictions.

Possible loading paths:

- Option A: keep August as a virtual display season using `lib/season-plan.ts` until full season support exists.
- Option B: add plan/season selection logic so date-based plans can be loaded without relying only on `challenge_plans.is_active = true`.
- Option C: create August plan data as inactive/draft until the resolver exists.

Recommended next step: use Option A until the James content is final. Then implement Option B before any August plan is made active. Option C is acceptable for private admin/data review only if the draft plan remains inactive.

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
