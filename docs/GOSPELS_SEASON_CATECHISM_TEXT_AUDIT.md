# Gospels Season Catechism Text Audit

Audit for `content/gospels/the-gospels-september-lent-content-draft.json`.

Status: Sunday Catechism content draft pass only. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.

## Counts

- Total days processed: 162
- Gospel days preserved: 139
- Catechism days populated: 23
- Gospel readingText populated: 139
- Catechism readingText populated: 23
- Gospel reflectionPrompt populated: 139
- Catechism reflectionPrompt populated: 23

## CCC Ranges Populated By Day

| Day | Reference | Title | Paragraphs included |
| ---: | --- | --- | ---: |
| 6 | CCC 101-104; 125-127; 131-133 | Sacred Scripture and the Gospels | 10 |
| 13 | CCC 422-455 | Christ, the Son of God | 34 |
| 20 | CCC 456-483 | The Incarnation | 28 |
| 27 | CCC 484-511 | Mary and the Annunciation | 28 |
| 34 | CCC 535-540 | Baptism, Temptation, and Mission | 6 |
| 41 | CCC 541-546 | The Kingdom of God | 6 |
| 48 | CCC 547-550 | Miracles and Signs of the Kingdom | 4 |
| 55 | CCC 551-553 | The Disciples and the Twelve | 3 |
| 62 | CCC 552-553; 880-887 | Peter, the Keys, and the Church | 10 |
| 69 | CCC 554-556 | The Transfiguration | 3 |
| 76 | CCC 574-594 | Jesus and Israel | 21 |
| 83 | CCC 595-618 | The Passion of Christ | 24 |
| 90 | CCC 624-630 | Christ's Death and Burial | 7 |
| 97 | CCC 638-658 | The Resurrection | 21 |
| 104 | CCC 659-667 | The Ascension and Christ's Reign | 9 |
| 111 | CCC 751-780 | The Church in God's Plan | 30 |
| 118 | CCC 787-796 | The Body of Christ | 10 |
| 125 | CCC 811-812; 813-816; 823-829; 830-835; 857-865 | One, Holy, Catholic, and Apostolic | 28 |
| 132 | CCC 963-975 | Mary, Mother of Christ and Mother of the Church | 13 |
| 139 | CCC 1213-1228; 1262-1274; 1275-1284 | Baptism and New Life | 39 |
| 146 | CCC 1322-1327; 1337-1344; 1362-1372; 1373-1381 | The Eucharist | 34 |
| 153 | CCC 2599-2606; 2607-2616; 2759-2764; 2777-2785 | The Prayer of Jesus and the Lord's Prayer | 33 |
| 160 | CCC 1422-1433; 1440-1449; 1450-1460; 1480-1484 | Conversion, Penance, and Preparing for Lent | 38 |

## Missing CCC Paragraphs

None.

## Formatting Warnings

None.

## Gospel Preservation

- Gospel days with changed readingText: none
- Gospel days with changed reflectionPrompt: none

## Day Type Preservation

None.

## Validation

None.

## Confirmations

- Sunday Catechism reading text was populated only from `content/catechism/source/gospels-season-ccc-source.json`.
- Sunday Catechism reflection prompts were populated for all 23 Catechism days.
- Gospel day readingText was preserved from the Gospel-days draft.
- Gospel day reflectionPrompt was preserved from the Gospel-days draft.
- No unrequested large CCC ranges were added.
- No SQL was created.
- No Supabase migration was created.
- No Supabase data was read, written, or mutated.
- No app behavior was changed.
- No Before You Read context was generated.

## Human Review Readiness

Ready for human review.
