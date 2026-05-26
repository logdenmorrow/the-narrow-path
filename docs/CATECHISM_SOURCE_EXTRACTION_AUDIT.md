# Catechism Source Extraction Audit

Source: uploaded `temp.pdf` Catechism PDF.

Purpose: Convert the Catechism into repo-friendly Markdown/JSON source artifacts for The Narrow Path.

## Full CCC Extraction

- Extracted paragraphs: 2865 / 2865

- Missing paragraphs: 0

- Duplicate paragraphs: 0

- Detected structural headings: 908

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

- Headings are detected from PDF line structure and should be treated as helpful metadata, not doctrine-changing content.

- No SQL, migration, Supabase data, app behavior, or Before You Read context was generated.
