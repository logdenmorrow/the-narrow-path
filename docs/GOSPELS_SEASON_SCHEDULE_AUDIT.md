# Gospels Season Schedule Audit

Reference-only audit for `content/gospels/the-gospels-september-lent-reading-plan-draft.json`.

Status: draft schedule for review only. This is not import-ready plan data and not SQL.

## Counts

- Total day count: 162
- Sunday Catechism day count: 23
- Non-Sunday Gospel day count: 139
- Mark Gospel days: 25
- Matthew Gospel days: 39
- Luke Gospel days: 43
- John Gospel days: 32

## Gospel Blocks

| Gospel | Count | First day/date/reference | Last day/date/reference |
|---|---:|---|---|
| Mark | 25 | Day 1, 2026-09-01, Mark 1:1-13 | Day 29, 2026-09-29, Mark 16:1-20 |
| Matthew | 39 | Day 30, 2026-09-30, Matthew 1:1-17 | Day 74, 2026-11-13, Matthew 27:32-28:20 |
| Luke | 43 | Day 75, 2026-11-14, Luke 1:1-25 | Day 124, 2027-01-02, Luke 24:1-53 |
| John | 32 | Day 126, 2027-01-04, John 1:1-18 | Day 162, 2027-02-09, John 20:1-21:25 |

## Sunday Catechism Days

| Day | Date | Reference | Title |
|---:|---|---|---|
| 6 | 2026-09-06 | CCC 101-141 | Sacred Scripture and the Gospels |
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
| 125 | 2027-01-03 | CCC 811-870 | One, Holy, Catholic, and Apostolic |
| 132 | 2027-01-10 | CCC 963-975 | Mary, Mother of Christ and Mother of the Church |
| 139 | 2027-01-17 | CCC 1210-1284 | Baptism and New Life |
| 146 | 2027-01-24 | CCC 1322-1419 | The Eucharist |
| 153 | 2027-01-31 | CCC 2599-2616; 2759-2865 | The Prayer of Jesus and the Lord's Prayer |
| 160 | 2027-02-07 | CCC 1422-1498 | Conversion, Penance, and Preparing for Lent |

## Reference Coverage Check

- Mark covers Mark 1:1-16:20 in canonical order across 25 non-Sunday readings.
- Matthew covers Matthew 1:1-28:20 in canonical order across 39 non-Sunday readings.
- Luke covers Luke 1:1-24:53 in canonical order across 43 non-Sunday readings.
- John covers John 1:1-21:25 in canonical order across 32 non-Sunday readings.
- No Sunday has `dayType: gospel`.
- No non-Sunday has `dayType: catechism`.
- All `readingText` values are `null`.
- All `reflectionPrompt` values are `null`.

## Scope Confirmations

- No full Bible text was added.
- No full Catechism text was added.
- No SQL was created.
- No Supabase migration was created.
- No deployment work was done.
- No Supabase data was read, written, or mutated.
- No app behavior was changed.

## Manual Review Needed

- Review daily Gospel split comfort, especially the longer Passion/Resurrection readings near the ends of Matthew, Luke, and John.
- Review the Sunday Catechism references for desired paragraph breadth before any import-ready plan data is prepared.
- Review John 7:53-8:30 as a scheduled unit, since it includes John 7:53-8:11 and then continues into the light-of-the-world discourse.
- Before You Read context is intentionally not generated in this pass.
