# Catechism Source Extraction Audit

Source: uploaded `temp.pdf` Catechism PDF.

Purpose: Convert the Catechism into repo-friendly Markdown/JSON source artifacts for The Narrow Path.

## Full CCC Extraction

- Extracted paragraphs: 2865 / 2865

- Missing paragraphs: 0

- Duplicate paragraphs: 0

- Detected structural headings: 908

## Source Cleanup

- Cleanup applied to the committed local Catechism source artifacts.
- Removed trailing `Notes` footnote blocks appended to paragraph text.
- Removed appended `ARTICLE`, `SECTION`, `CHAPTER`, or `PART` heading bleed from paragraph text.
- Removed appended all-caps Creed/article title bleed from paragraph text.
- Preserved CCC paragraph numbers, paragraph wording before the artifact boundary, and heading metadata.
- Full-source paragraphs cleaned: 67
- Gospel-season subset paragraphs cleaned: 14
- Full-source remaining obvious artifact hits: 0
- Gospel-season subset remaining obvious artifact hits: 0

### Cleaned Paragraphs

- CCC 25: removed trailing Notes footnote block
- CCC 49: removed trailing Notes footnote block
- CCC 141: removed trailing Notes footnote block
- CCC 184: removed trailing Notes footnote block
- CCC 197: removed trailing Notes footnote block
- CCC 198: removed appended structural heading bleed
- CCC 267: removed trailing Notes footnote block
- CCC 354: removed trailing Notes footnote block
- CCC 421: removed trailing Notes footnote block
- CCC 429: removed appended all-caps Creed title bleed
- CCC 455: removed appended structural heading bleed
- CCC 483: removed trailing Notes footnote block
- CCC 511: removed trailing Notes footnote block
- CCC 534: removed trailing Notes footnote block
- CCC 542: removed trailing Notes footnote block
- CCC 556: removed trailing Notes footnote block
- CCC 594: removed trailing Notes footnote block
- CCC 630: removed trailing Notes footnote block
- CCC 658: removed trailing Notes footnote block
- CCC 667: removed appended structural heading bleed
- CCC 682: removed trailing Notes footnote block
- CCC 701: removed trailing Notes footnote block
- CCC 716: removed trailing Notes footnote block
- CCC 747: removed trailing Notes footnote block
- CCC 762: removed trailing Notes footnote block
- CCC 769: removed trailing Notes footnote block
- CCC 780: removed trailing Notes footnote block
- CCC 810: removed trailing Notes footnote block
- CCC 870: removed trailing Notes footnote block
- CCC 945: removed trailing Notes footnote block
- CCC 962: removed trailing Notes footnote block
- CCC 987: removed trailing Notes footnote block
- CCC 1019: removed trailing Notes footnote block
- CCC 1065: removed trailing Notes footnote block
- CCC 1075: removed trailing Notes footnote block
- CCC 1076: removed appended structural heading bleed
- CCC 1134: removed trailing Notes footnote block
- CCC 1209: removed trailing Notes footnote block
- CCC 1305: removed trailing Notes footnote block
- CCC 1381: removed trailing Notes footnote block
- CCC 1419: removed trailing Notes footnote block
- CCC 1532: removed trailing Notes footnote block
- CCC 1600: removed trailing Notes footnote block
- CCC 1637: removed trailing Notes footnote block
- CCC 1666: removed appended structural heading bleed
- CCC 1690: removed trailing Notes footnote block
- CCC 1698: removed trailing Notes footnote block
- CCC 1876: removed trailing Notes footnote block
- CCC 1948: removed trailing Notes footnote block
- CCC 2051: removed trailing Notes footnote block
- CCC 2082: removed trailing Notes footnote block
- CCC 2083: removed appended structural heading bleed
- CCC 2141: removed appended structural heading bleed
- CCC 2167: removed appended structural heading bleed
- CCC 2195: removed trailing Notes footnote block
- CCC 2196: removed appended structural heading bleed
- CCC 2257: removed trailing Notes footnote block
- CCC 2330: removed trailing Notes footnote block
- CCC 2400: removed trailing Notes footnote block
- CCC 2463: removed trailing Notes footnote block
- CCC 2513: removed appended structural heading bleed
- CCC 2533: removed appended structural heading bleed
- CCC 2557: removed trailing Notes footnote block
- CCC 2565: removed trailing Notes footnote block
- CCC 2649: removed trailing Notes footnote block
- CCC 2696: removed trailing Notes footnote block
- CCC 2758: removed trailing Notes footnote block

## Gospel Season Subset

- Requested unique CCC paragraphs: 437

- Extracted requested paragraphs: 437

- Missing requested paragraphs: 0

## Files Created

- `content/catechism/source/catechism-of-the-catholic-church-usccb.json`

- `content/catechism/source/catechism-of-the-catholic-church-usccb.md`

- `content/catechism/source/gospels-season-ccc-source.json`

- `content/catechism/source/gospels-season-ccc-source.md`

- `content/catechism/source/README.md`

- `docs/CATECHISM_SOURCE_EXTRACTION_AUDIT.md`

## Formatting Notes

- CCC paragraph numbers are preserved.

- Each CCC paragraph is its own Markdown paragraph with bold paragraph number.

- PDF footnote markers embedded in paragraph text are preserved as extracted.

- Trailing PDF `Notes` blocks are removed from paragraph text during cleanup.

- Headings are detected from PDF line structure and should be treated as helpful metadata, not doctrine-changing content.

- No SQL, migration, Supabase data, app behavior, or Before You Read context was generated.
