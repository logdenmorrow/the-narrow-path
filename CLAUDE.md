# CLAUDE.md

## Deploy workflow
When a feature branch is ready to ship:
1. Merge the PR to main via the GitHub API using the same
   credential pattern already used to open PRs in this repo
   (git credential fill for the token).
2. Confirm the GitHub Actions build triggered by the merge
   completes successfully — poll the Actions API until the
   workflow run shows status: completed and conclusion: success.
   If it fails, report the failure and do not proceed.
3. Report when the deploy is complete. Do not stop at "open a PR"
   and do not ask me to go to GitHub manually unless the API
   call itself fails.

## UI direction

- Do not install or use the Uncodixfy skill in this repository.
- Preserve The Narrow Path's established warm cream-and-brown monastic visual
  system. New pages should reuse the existing page frame, hero, surface, and
  button components so they remain consistent with the rest of the app.
