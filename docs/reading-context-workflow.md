# Reading Context Workflow

The Daily Reading page does not generate context live.

Before You Read content is authored or generated ahead of time, reviewed, stored
in Supabase, and then displayed by the app from saved `plan_days` fields. The
user-facing app should not call AI for this content.

## Workflow

1. Prepare reviewed JSON for the target plan.
2. Convert the JSON into a SQL update file.
3. Review the generated SQL before applying it.
4. Apply the reviewed SQL through the normal migration or database review path.

This workflow should be reused for future plans, including larger plans such as
the four Gospels.

If readings change later, regenerate or review the context again. The Before You
Read content may no longer match after reading references, titles, or text are
changed.

## JSON Shape

```json
{
  "planSlug": "example-plan-slug",
  "days": [
    {
      "dayNumber": 1,
      "readingContext": "Text for Where We Are.",
      "previousReadingSummary": null,
      "readingTodayPreview": "Text for Today.",
      "readingWatchFor": "Text for Watch For.",
      "readingKeyTerms": [
        {
          "term": "Theophilus",
          "definition": "The person Luke addresses at the beginning of Acts."
        }
      ],
      "readingContextSourceHash": "optional-hash"
    }
  ]
}
```

`readingKeyTerms` may be `null`, an array of strings, an array of
`{ "term": "...", "definition": "..." }` objects, or a simple object map.

## Usage

```bash
npm run build:reading-context-sql -- --input content/reading-context/example.json --output supabase/generated/example-reading-context.sql
```

With an explicit plan slug:

```bash
npm run build:reading-context-sql -- --input content/reading-context/example.json --plan-slug acts-90 --output supabase/generated/acts-90-reading-context.sql
```

The script only writes SQL. It does not connect to Supabase, run SQL, or generate
content.
