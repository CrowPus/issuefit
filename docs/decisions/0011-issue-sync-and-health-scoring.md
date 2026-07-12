# 0011 — Label-based issue sync and health scoring, with two documented gaps

## Status

Accepted

## Context

The recommendation engine (ADR-0004) expects `IssueCandidate` inputs — `difficulty`,
`clarityScore`, `isAssigned`, `isBlocked`, `hasActivePullRequest`, `allowsExternalContributors`,
`state`, `updatedAt` — none of which exist yet for curated repositories. This session (week 3,
continuing from curated repositories — ADR-0009, ADR-0010) syncs real issues and computes as
many of these signals as can be honestly derived from GitHub's issue-list API alone.

Two signals genuinely cannot be computed cheaply from that API:

- **`hasActivePullRequest`** — GitHub's issue-list response does not indicate whether another
  pull request references a given issue. Real detection needs either the GraphQL API's
  `closingIssuesReferences` field or a per-issue timeline call (`GET
/repos/{owner}/{repo}/issues/{number}/timeline`) — one extra request _per issue_, which does
  not fit inside this session's scope.
- **`allowsExternalContributors`** — not a GitHub API field at all; it is a judgement call.

## Decision

New pure domain package `@issuefit/issue-health`:

- `assessIssueHealth(metadata, options)` estimates `difficulty` from label keywords (a
  "good first issue"/"beginner"/"easy" label → beginner; "advanced"/"hard"/"expert" → advanced;
  no match → intermediate, the same default-to-neutral pattern as the recommendation engine's
  unknown-signal handling), `clarityScore` from description length (linear scale to a
  configurable threshold, the same shape as repository-health's activity score), and
  `isBlocked` from label keywords ("blocked", "wontfix", "duplicate", "invalid" — anything
  signalling the issue is not currently viable to work on, not only literally "blocked").
  Versioned, validated config; fully unit-tested; zero runtime dependencies.
- `packages/github` gains `listRepositoryIssues`, using the same service-token pattern as
  curated repositories (ADR-0009): fetches only `state: open`, filters out pull requests
  (GitHub's issue-list endpoint returns both, distinguished by a `pull_request` key present
  only on PRs), and caps at 100 issues per repository per sync — the same
  bounded-cost-per-click principle as the 300-repository cap (ADR-0007).
- **`hasActivePullRequest` is stored as `false` for every synced issue.** This is a documented
  simplification, not a measured value — surfaced nowhere in the UI as if it were real, exactly
  like repository-health's neutral maintainer-responsiveness placeholder (ADR-0010).
- **`allowsExternalContributors` is stored as `true` for every synced issue.** Curation itself
  (an admin explicitly adding the repository) is treated as the human-vetted signal that the
  repository accepts contributions; per-issue refinement is not attempted.
- Issue sync is a per-repository, explicit "Sync issues" admin action — not automatic, not
  bundled into "Refresh" (which only re-fetches repository metadata) — consistent with every
  other sync trigger in this codebase (GitHub profile sync, skill refresh, repository refresh)
  being user-initiated rather than implicit.
- `issues.difficulty` reuses the existing `issue_difficulty` Postgres enum (originally added
  for `career_goals.difficulty`, ADR-0004/0008 era) rather than defining a duplicate enum with
  identical values — same concept, different role, documented in the schema.

## Alternatives considered

- **Fetch each issue's timeline to detect linked PRs now** — would multiply API calls by the
  issue count per repository (up to 100× more), pushing well past the per-click cost budget
  established for curated repositories; deferred, not rejected — worth doing once the GitHub
  client needs GraphQL for other reasons anyway.
- **Infer `allowsExternalContributors` from repository-level signals** (e.g. requiring a
  CONTRIBUTING guide) — would silently exclude many real, contribution-friendly repositories
  that simply never wrote one; the curation gate is a more honest signal than a heuristic that
  would produce false negatives.

## Consequences

- Every synced issue's `hasActivePullRequest` and `allowsExternalContributors` are currently
  constants, not computed data — a future ADR is needed before either becomes a real signal.
- Issue sync is one explicit action per repository; curating 50–100 repositories means 50–100
  clicks (or one per repository during "Refresh all" once bundled — not done in this session).
- Difficulty and clarity are both reproducible and unit-tested without any GitHub or database
  call, matching the standard set by ADR-0004, ADR-0008, and ADR-0010.

## Date

2026-07-11
