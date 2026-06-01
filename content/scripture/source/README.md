# Scripture Source Extraction Artifacts

This folder is for local RSV2CE source-review artifacts extracted from the
Ascension Web App.

Run the Acts and James source extraction:

```bash
node scripts/fetch-ascension-scripture-source.mjs --all
```

Run one book:

```bash
node scripts/fetch-ascension-scripture-source.mjs --book Acts
node scripts/fetch-ascension-scripture-source.mjs --book James
```

File purposes:

- The per-book `.json` files are structured source-review artifacts for later
  automation and validation.
- The per-book `.md` files are readable source-review artifacts for human
  checking.
- `ascension-scripture-diagnostics.md` summarizes extraction confidence,
  chapter counts, verse counts, omitted verse labels, duplicate verse artifacts,
  and warnings without being import-ready content.

Scope rules:

- Do not generate Supabase changes directly from these files without a reviewed
  migration.
- Preserve source text exactly during review; do not paraphrase or invent
  missing verses.
- Do not hardcode private cookies, tokens, or credentials into extraction
  scripts.
- If Ascension requires a normal logged-in browser session in the future, stop
  and document that limitation before choosing a different extraction approach.
