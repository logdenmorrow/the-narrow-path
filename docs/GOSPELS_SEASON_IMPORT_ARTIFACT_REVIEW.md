# Gospels Season Import Artifact Review

Review-only human preview for the future inactive Gospel season import artifact.

## Plan

- Name: The Gospels: From September to Lent
- Slug: `the-gospels-september-lent`
- Days: 162
- Date range: 2026-09-01 through 2027-02-09
- Active: false

## Day Counts

- Gospel days: 139
- Sunday Catechism days: 23
- Reading texts populated: 162
- Reflection prompts populated: 162

## Task Strategy

This review artifact keeps the August James-style base task set: reading/reflection every day, Sunday Mass on Catechism Sundays, weekly Adoration, monthly Confession, and optional prayer/community/support tasks.

Logan has now decided the Gospel season should be more intense than James but less intense than Lent / Narrow Path 90. The strategy therefore proposes a medium-intensity Gospel discipline layer: weekly fast or penance, plus the recommended Gospel Season Temperance Rule.

| Task slug | Records |
| --- | --- |
| reading | 162 |
| reflection | 162 |
| adoration | 162 |
| confession | 162 |
| night-prayer | 162 |
| rosary | 162 |
| workout | 162 |
| check_in_anchor | 162 |
| attend_mass | 23 |

## Proposed Add-ons

| Add-on | Preferred future concept | Why | Existing related slug(s) | Records generated now |
| --- | --- | --- | --- | --- |
| Weekly fast or penance | weekly_fast_or_penance | Makes the Gospel season more serious than James without using the full Lent/Narrow Path 90 rule set. | fast | no |
| Alcohol discipline / temperance | temperance | Adds temperance without making the season as strict as Lent or Narrow Path 90. | give_up_alcohol | no |

## Weekly Fast or Penance

- Preferred future task concept: weekly_fast_or_penance
- Required once per Monday-Sunday week.
- Friday is the natural/default suggested day, but it can be completed any day of the week.
- Fulfilled by a Catholic fast or another concrete penitential act.
- Catholic fasting is not starvation: one full meal, plus up to two smaller meals that together do not equal another full meal.
- Users should not fast in a way that harms health or required duties.

## Recommended Gospel Season Temperance Rule

- Preferred future task concept: temperance

- Alcohol allowed only on weekends.
- Maximum 2 drinks in one day.
- Never drink more than 2 days in a row.
- No alcohol on fasting or penance days.
- No drunkenness ever.

This is more serious than James but less strict than full alcohol abstinence in Lent / Narrow Path 90.

Status: Recommended review-only rule; do not generate SQL until task template and implementation strategy are approved.

## Future Guide Page Requirement

- Route: /guides/fasting-and-penance
- Link from task: weekly_fast_or_penance
- Button label: What's a fast or penance?
- Status: Required before launch; planning-only here. Do not create the app route in this artifact pass.

The future guide must explain penance, fasting, abstinence, why Catholic fasting is not starvation, the one-full-meal-plus-two-smaller-meals fasting pattern, health/common-sense limits, examples of penances, and how to choose a concrete, doable, sacrificial, prayer-connected penance that does not become performative or harm duties.

## First Day Sample

- Day 1: 2026-09-01 (Tuesday)
- Type: gospel
- Reference: Mark 1:1-13
- Title: The Beginning of the Gospel
- Reflection prompt: Ask Christ to make repentance concrete today; name one wilderness where you need to prepare His way.

## Last Day Sample

- Day 162: 2027-02-09 (Tuesday)
- Type: gospel
- Reference: John 20:19-21:25
- Title: Peace, Thomas, and Peter
- Reflection prompt: Receive Christ's peace, bring Him your doubts, and let love restore your mission.

## Sunday Catechism Days

| Day | Date | Reference | Title |
| --- | --- | --- | --- |
| 6 | 2026-09-06 | CCC 101-104; 125-127; 131-133 | Sacred Scripture and the Gospels |
| 13 | 2026-09-13 | CCC 422-455 | Christ, the Son of God |
| 20 | 2026-09-20 | CCC 456-483 | The Incarnation |
| 27 | 2026-09-27 | CCC 484-511 | Mary and the Annunciation |
| 34 | 2026-10-04 | CCC 535-540 | Baptism, Temptation, and Mission |
| 41 | 2026-10-11 | CCC 541-546 | The Kingdom of God |
| 48 | 2026-10-18 | CCC 547-550 | Miracles and Signs of the Kingdom |
| 55 | 2026-10-25 | CCC 551-553 | The Disciples and the Twelve |
| 62 | 2026-11-01 | CCC 552-553; 880-887 | Peter, the Keys, and the Church |
| 69 | 2026-11-08 | CCC 554-556 | The Transfiguration |
| 76 | 2026-11-15 | CCC 574-594 | Jesus and Israel |
| 83 | 2026-11-22 | CCC 595-618 | The Passion of Christ |
| 90 | 2026-11-29 | CCC 624-630 | Christ's Death and Burial |
| 97 | 2026-12-06 | CCC 638-658 | The Resurrection |
| 104 | 2026-12-13 | CCC 659-667 | The Ascension and Christ's Reign |
| 111 | 2026-12-20 | CCC 751-780 | The Church in God's Plan |
| 118 | 2026-12-27 | CCC 787-796 | The Body of Christ |
| 125 | 2027-01-03 | CCC 811-812; 813-816; 823-829; 830-835; 857-865 | One, Holy, Catholic, and Apostolic |
| 132 | 2027-01-10 | CCC 963-975 | Mary, Mother of Christ and Mother of the Church |
| 139 | 2027-01-17 | CCC 1213-1228; 1262-1274; 1275-1284 | Baptism and New Life |
| 146 | 2027-01-24 | CCC 1322-1327; 1337-1344; 1362-1372; 1373-1381 | The Eucharist |
| 153 | 2027-01-31 | CCC 2599-2606; 2607-2616; 2759-2764; 2777-2785 | The Prayer of Jesus and the Lord's Prayer |
| 160 | 2027-02-07 | CCC 1422-1433; 1440-1449; 1450-1460; 1480-1484 | Conversion, Penance, and Preparing for Lent |

## Open Decisions

- Confirm before SQL generation that the Gospel season uses the full August James-style base task set plus the approved Gospel discipline add-ons.
- Confirm weekly_fast_or_penance as the future task template instead of reusing fast.
- Confirm the recommended Gospel Season Temperance Rule before SQL: alcohol only on weekends, maximum 2 drinks in one day, never more than 2 days in a row, no alcohol on fasting/penance days, and no drunkenness ever.
- Confirm temperance as the future task template instead of reusing give_up_alcohol.
- Create the future guide page at /guides/fasting-and-penance and link it from the weekly_fast_or_penance task card before launch.
- Confirm the target database still has the expected task template slugs before writing a migration.
- Confirm monthly Confession copy for a September-February season, especially around the final Lent-prep week.
- Confirm whether plan_days.title should continue to match reading_title, as in the August James draft migration.
- Before You Read context remains intentionally deferred and should be generated in a separate pass.
