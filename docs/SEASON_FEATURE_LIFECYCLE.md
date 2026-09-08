# Season Feature Lifecycle

Plan-specific features must never infer their owner from the currently active
plan. Their ownership and lifecycle live in `lib/season-features.ts`.

## Statuses

- `available`: the public feature may be linked only for its declared plan and
  day.
- `retired`: public navigation is removed and the old URL redirects to the
  declared replacement. Historical data may remain in a clearly labeled admin
  archive.

## Rules

1. Register a plan-specific public feature before linking to it from a task,
   dashboard, reminder, or announcement.
2. Declare the owning plan slug and applicable day explicitly.
3. Use `buildSeasonFeatureHref` for task links. A `null` result means the
   feature must not be offered.
4. Do not query `is_active` to decide which plan owns a feature.
5. When retiring a feature, remove its public actions, block its write path,
   preserve required historical data, and add a production redirect check.
6. Label retained admin pages as archives so they are not mistaken for active
   workflows.

## Current Registry

- Challenge Feedback belonged to Day 90 of `the-narrow-path-90`. It was
  retired on September 8, 2026. `/challenge-feedback` redirects to
  `/dashboard`; historical submissions remain available at
  `/admin/challenge-feedback`.
- Give Thanks remains a readable historical Day 90 feature owned by
  `the-narrow-path-90`.

## New Season Checklist

Before activating a plan, search for its task slugs and review public routes,
server actions, navigation, reminders, scheduled messages, admin tools, and
production checks. Classify every plan-specific feature in the registry rather
than allowing it to inherit the new active plan.
