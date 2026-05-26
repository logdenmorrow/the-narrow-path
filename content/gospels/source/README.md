# Gospel Source Extraction Artifacts

This folder is for local source-review artifacts only.

Current extraction artifacts:

- `matthew-rsv2ce-ascension.json`
- `matthew-rsv2ce-ascension.md`
- `mark-rsv2ce-ascension.json`
- `mark-rsv2ce-ascension.md`
- `luke-rsv2ce-ascension.json`
- `luke-rsv2ce-ascension.md`
- `john-rsv2ce-ascension.json`
- `john-rsv2ce-ascension.md`
- `ascension-gospels-diagnostics.md`

Run all four Gospels:

```bash
node scripts/fetch-ascension-gospel-source.mjs
```

or:

```bash
node scripts/fetch-ascension-gospel-source.mjs --all
```

Run one Gospel:

```bash
node scripts/fetch-ascension-gospel-source.mjs --book Mark
node scripts/fetch-ascension-gospel-source.mjs --book Matthew
node scripts/fetch-ascension-gospel-source.mjs --book Luke
node scripts/fetch-ascension-gospel-source.mjs --book John
```

File purposes:

- The per-book `.json` files are structured source-review artifacts for later
  automation and validation.
- The per-book `.md` files are readable source-review artifacts for human
  checking.
- `ascension-gospels-diagnostics.md` summarizes extraction confidence, chapter
  counts, verse counts, omitted verse labels, duplicate verse artifacts, and
  warnings without being import-ready content.

Scope rules:

- Do not treat these files as import-ready plan data.
- Do not generate SQL or migrations from these files without a later explicit
  review step.
- Do not generate Supabase changes directly from these files.
- Preserve source text exactly during review; do not paraphrase or invent
  missing verses.
- Full Scripture text should not be committed unless Logan's permission and
  repository policy allow it.
- Do not hardcode private cookies, tokens, or credentials into extraction
  scripts.
- If Ascension requires a normal logged-in browser session in the future, stop
  and document that limitation before choosing a different extraction approach.
