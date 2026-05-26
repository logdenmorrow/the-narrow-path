# Ascension Gospels Extraction Diagnostics

Combined source-extraction diagnostic summary for the four Gospel source-review artifacts.

This file intentionally summarizes extraction metadata and artifacts. It is not import-ready plan data, SQL, a migration, or Before You Read context.

## Summary

| Book | Chapters fetched | Expected chapters | Headings found | Verse numbers confident | Safe for later review/import preparation | Warnings |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| Matthew | 28 | 28 | 155 | yes | yes | 0 |
| Mark | 16 | 16 | 93 | yes | yes | 0 |
| Luke | 24 | 24 | 148 | yes | yes | 0 |
| John | 21 | 21 | 78 | yes | yes | 0 |

## Matthew

| Chapter | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 25 |  |  | 2 |  |
| 2 | 23 |  |  | 3 |  |
| 3 | 17 |  |  | 2 |  |
| 4 | 25 |  |  | 4 |  |
| 5 | 48 |  |  | 9 |  |
| 6 | 34 |  |  | 7 |  |
| 7 | 29 |  |  | 7 |  |
| 8 | 34 |  |  | 6 |  |
| 9 | 38 |  |  | 7 |  |
| 10 | 42 |  |  | 6 |  |
| 11 | 30 |  |  | 4 |  |
| 12 | 49 | 47 |  | 8 |  |
| 13 | 58 |  |  | 11 |  |
| 14 | 36 |  |  | 4 |  |
| 15 | 39 |  |  | 5 |  |
| 16 | 28 |  |  | 5 |  |
| 17 | 26 | 21 |  | 4 |  |
| 18 | 34 | 11 |  | 6 |  |
| 19 | 30 |  |  | 3 |  |
| 20 | 34 |  |  | 4 |  |
| 21 | 46 |  |  | 7 |  |
| 22 | 46 |  |  | 5 |  |
| 23 | 38 | 14 |  | 2 |  |
| 24 | 51 |  |  | 8 |  |
| 25 | 46 |  |  | 3 |  |
| 26 | 75 |  |  | 10 |  |
| 27 | 66 |  |  | 10 |  |
| 28 | 20 |  |  | 3 |  |

### Matthew Source Artifacts

- Matthew 12: Verse label(s) not present in source HTML: 47.
- Matthew 17: Verse label(s) not present in source HTML: 21.
- Matthew 18: Verse label(s) not present in source HTML: 11.
- Matthew 23: Verse label(s) not present in source HTML: 14.

## Mark

| Chapter | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 45 |  |  | 9 |  |
| 2 | 28 |  |  | 4 |  |
| 3 | 35 |  |  | 5 |  |
| 4 | 41 |  |  | 6 |  |
| 5 | 43 |  |  | 2 |  |
| 6 | 56 |  |  | 6 |  |
| 7 | 36 | 16 |  | 3 |  |
| 8 | 38 |  |  | 6 |  |
| 9 | 48 | 44, 46 | 1 | 7 |  |
| 10 | 52 |  |  | 6 |  |
| 11 | 32 | 26 |  | 5 |  |
| 12 | 44 |  |  | 7 |  |
| 13 | 37 |  |  | 6 |  |
| 14 | 72 |  |  | 10 |  |
| 15 | 46 | 28 |  | 6 |  |
| 16 | 20 |  |  | 5 |  |

### Mark Source Artifacts

- Mark 7: Verse label(s) not present in source HTML: 16.
- Mark 8: Appended leading duplicate Mark 9:1 source continuation to Mark 8:38.
- Mark 9: Removed trailing comma punctuation artifact from Mark 9:45 after an omitted verse label boundary.
- Mark 9: Duplicate verse block found for Mark 9:1; kept the later block.
- Mark 9: Verse label(s) not present in source HTML: 44, 46.
- Mark 9: Leading duplicate Mark 9:1 block was a continuation of Mark 8:38; moved it there and kept the later Mark 9:1 block.
- Mark 11: Verse label(s) not present in source HTML: 26.
- Mark 15: Verse label(s) not present in source HTML: 28.

## Luke

| Chapter | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 80 |  |  | 6 |  |
| 2 | 52 |  |  | 6 |  |
| 3 | 38 |  |  | 3 |  |
| 4 | 44 |  |  | 6 |  |
| 5 | 39 |  |  | 5 |  |
| 6 | 49 |  |  | 9 |  |
| 7 | 50 |  |  | 4 |  |
| 8 | 56 |  |  | 8 |  |
| 9 | 62 |  |  | 12 |  |
| 10 | 42 |  |  | 6 |  |
| 11 | 54 |  |  | 8 |  |
| 12 | 59 |  |  | 9 |  |
| 13 | 35 |  |  | 7 |  |
| 14 | 35 |  |  | 5 |  |
| 15 | 32 |  |  | 3 |  |
| 16 | 31 |  |  | 3 |  |
| 17 | 36 | 36 |  | 3 |  |
| 18 | 43 |  |  | 6 |  |
| 19 | 48 |  |  | 5 |  |
| 20 | 47 |  |  | 6 |  |
| 21 | 38 |  |  | 7 |  |
| 22 | 71 |  |  | 11 |  |
| 23 | 55 | 17 |  | 6 |  |
| 24 | 53 |  |  | 4 |  |

### Luke Source Artifacts

- Luke 17: Verse label(s) not present in source HTML: 36.
- Luke 23: Verse label(s) not present in source HTML: 17.

## John

| Chapter | Verses extracted | Omitted verse labels | Duplicate verse blocks | Headings | Warnings |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 51 |  |  | 5 |  |
| 2 | 25 |  |  | 2 |  |
| 3 | 36 |  |  | 3 |  |
| 4 | 54 |  |  | 3 |  |
| 5 | 46 | 4 |  | 3 |  |
| 6 | 71 |  |  | 4 |  |
| 7 | 53 |  |  | 7 |  |
| 8 | 59 |  |  | 4 |  |
| 9 | 41 |  |  | 3 |  |
| 10 | 42 |  |  | 2 |  |
| 11 | 57 |  |  | 5 |  |
| 12 | 50 |  |  | 7 |  |
| 13 | 38 |  |  | 4 |  |
| 14 | 31 |  |  | 2 |  |
| 15 | 27 |  |  | 2 |  |
| 16 | 33 |  |  | 3 |  |
| 17 | 26 |  |  | 1 |  |
| 18 | 40 |  |  | 7 |  |
| 19 | 42 |  |  | 3 |  |
| 20 | 31 |  |  | 5 |  |
| 21 | 25 |  |  | 3 |  |

### John Source Artifacts

- John 5: Verse label(s) not present in source HTML: 4.

## Expansion Assessment

The extraction appears safe to use for later reviewed import-preparation work, provided the source-review artifacts receive human approval first.

Do not generate SQL, migrations, Supabase updates, or import-ready plan data directly from these files without a later explicit review step.
