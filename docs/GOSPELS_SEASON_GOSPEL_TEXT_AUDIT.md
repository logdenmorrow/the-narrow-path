# Gospels Season Gospel Text Audit

Audit for `content/gospels/the-gospels-september-lent-gospel-days-draft.json`.

Status: Gospel-days import-preparation review artifact only. This is not SQL, not a migration, not Supabase data, not app behavior, and not Before You Read context.

## Counts

- Total days processed: 162
- Gospel days populated: 139
- Catechism days deferred: 23
- readingText populated count: 139
- reflectionPrompt populated count: 139

## Count Per Gospel

| Gospel | Days |
| --- | ---: |
| Mark | 25 |
| Matthew | 39 |
| Luke | 43 |
| John | 32 |

## Omitted Source Verse Labels Inside Assigned Ranges

| Day | Reference | Omitted labels |
| ---: | --- | --- |
| 15 | Mark 7:1-30 | Mark 7:16 |
| 19 | Mark 9:30-50 | Mark 9:44, Mark 9:46 |
| 23 | Mark 11:1-33 | Mark 11:26 |
| 29 | Mark 15:21-16:20 | Mark 15:28 |
| 50 | Matthew 12:22-50 | Matthew 12:47 |
| 58 | Matthew 17:1-27 | Matthew 17:21 |
| 59 | Matthew 18:1-20 | Matthew 18:11 |
| 67 | Matthew 23:1-39 | Matthew 23:14 |
| 113 | Luke 17:20-18:14 | Luke 17:36 |
| 122 | Luke 22:49-23:25 | Luke 23:17 |
| 134 | John 5:1-18 | John 5:4 |

## Source Artifacts Inside Assigned Ranges

| Day | Reference | Source artifacts |
| ---: | --- | --- |
| 18 | Mark 9:1-29 | Mark 9:1 duplicate source block |

## Source/Schedule Mismatches

None.

## Empty or Missing Content Checks

- Gospel days with empty readingText: none
- Gospel days with missing reflectionPrompt: none

## Validation

None.

## Confirmations

- Sunday Catechism days were left deferred with `readingText: null`.
- Sunday Catechism days were left deferred with `reflectionPrompt: null`.
- Gospel reading text was sliced from the reviewed Ascension source JSON artifacts.
- Omitted source verse labels were recorded and not invented.
- No Catechism text was added.
- No SQL was created.
- No Supabase migration was created.
- No Supabase data was read, written, or mutated.
- No app behavior was changed.
- No Before You Read context was generated.
