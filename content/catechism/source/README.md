# Catechism Source Artifacts

This folder contains local Catechism source artifacts generated from Logan's uploaded Catechism PDF.

Files:

- `catechism-of-the-catholic-church-usccb.json` - structured paragraph source, CCC 1-2865.
- `catechism-of-the-catholic-church-usccb.md` - human-readable Markdown source, CCC 1-2865.
- `gospels-season-ccc-source.json` - subset needed for the Gospel season Sunday Catechism readings.
- `gospels-season-ccc-source.md` - human-readable subset for review.

Recommended repo handling:

- Commit the `.json` and `.md` files if repository policy and permissions allow.
- Do not commit the original PDF unless explicitly desired.
- Add `content/catechism/source/*.pdf` to `.gitignore` if the PDF is kept locally.

Scope rules:

- Treat these as source/review artifacts, not live app data.
- Do not generate SQL or migrations directly from these files without a later explicit review step.
- Preserve Catechism wording; do not paraphrase or invent missing paragraphs.
