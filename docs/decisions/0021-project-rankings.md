# 0021 — Project rankings (IssueFit top projects + GitHub top 10)

## Status

Accepted

## Context

The second slice of the owner-approved M6.5 scope extension (ADR-0020):
visitors should see top projects — both a GitHub-wide "top 10 famous
projects" list and a ranking of the projects listed on IssueFit. A
star-based global list barely changes and says nothing about contributor
experience, so the platform needs its own ranking that rewards the
behavior IssueFit exists to encourage.

## Decision

- **Two rankings on one public page (`/projects/top`), honestly labeled.**
- **IssueFit top projects** (primary): a deterministic composite over
  already-stored data, computed in the app layer per view (no cache, no
  API cost): contributor-readiness score (0–100, ADR-0020) plus platform
  activity — **10 points per contribution merged through IssueFit, 2 per
  contribution started**, counted from `contributions` joined to the
  recommendation snapshot's `repository_full_name` (case-insensitive).
  The weights are documented on the page itself; stars are only a
  tiebreaker, so the ranking rewards being good to contributors, not
  popularity.
- **GitHub top 10**: the most-starred public repositories from one GitHub
  search API call (`GitHubClient.listMostStarredRepositories`), cached in
  a new `github_top_repositories` table (replaced wholesale, ranks are
  only meaningful as a set) and **lazily refreshed on view when older
  than 24 hours** — roughly one API call per day, no background worker
  needed before M7 (whose weekly job takes the refresh over). The page
  always shows `fetchedAt`; a failed refresh keeps serving the previous
  list with its honest timestamp, and an empty cache shows "not available
  yet" rather than made-up data.
- The Playwright `baseURL`/web-server port became overridable via `PORT`
  so the e2e suite can run against a fresh server while a long-lived
  `pnpm dev` occupies :3000 (a stale dev server's module graph does not
  reflect freshly rebuilt workspace packages).

## Alternatives considered

- **Only the GitHub star list.** Rejected: it is nearly static and
  irrelevant to contributor experience; it stays as a small
  discovery/credibility section.
- **Refresh the GitHub list from a worker now.** Rejected: M7 builds the
  worker job infrastructure; a lazy per-view refresh is one API call per
  day and degrades gracefully until then.
- **Lexicographic ordering (merged, then started, then readiness).**
  Rejected: one merged contribution would outrank any readiness
  difference forever; additive documented weights keep both signals
  meaningful.
- **Computing the IssueFit ranking in the recommendation engine.**
  Rejected: it ranks repositories for display, not issues for a
  developer; engine scores remain the engine's only concern (ADR-0004).

## Consequences

- Migration 0013 adds `github_top_repositories` (rank-unique, replaced
  wholesale).
- `contributions` gains a grouped-count query
  (`listContributionCountsByRepository`); no schema change.
- A `/projects/top` page view may perform one GitHub search call per
  24-hour window; all other ranking math is in-memory.
- Verified live: the first view fetched the real top 10 (524k-star
  `codecrafters-io/build-your-own-x` at #1) and the owner's merged
  test contribution feeds the IssueFit composite.

## Date

2026-07-12
