# 0007 — GitHub client reads with the user's OAuth token, capped and paginated

## Status

Accepted

## Context

Week 2 needs to synchronise a signed-in developer's public GitHub profile, repositories, and
languages from their public activity. GUIDLINE.md §8 requires a `GitHubClient` interface decoupled
from Octokit, correct pagination, and respect for GitHub's rate limits, and its example
interface is installation-token-shaped (`listRepositories(installationId)`). At this stage the
platform has no GitHub App installation flow yet — only OAuth sign-in (ADR-0005) — so an
installation-based client cannot be built truthfully yet.

## Decision

`packages/github` exposes a `GitHubClient` reading with the **signed-in user's own OAuth
access token** (already stored by better-auth on their `accounts` row, retrieved through
`auth.api.getAccessToken` — never queried from the table directly):

- `getAuthenticatedProfile(accessToken)` → `GET /user`.
- `listPublicRepositories(accessToken)` → `GET /user/repos?visibility=public`, using Octokit's
  `paginate.iterator` for correct multi-page traversal, capped at `MAX_REPOSITORIES = 300`
  (about 3 requests) so one "Sync now" click can never spiral into hundreds of API calls for
  an unusually large account. The cap is a named constant, not a silent limit; accounts that
  exceed it are untested territory the product can revisit if it matters in practice.
- Errors are classified into the categories from GUIDLINE.md §13
  (`GitHubApiError` / `classifyGitHubError`) so callers can distinguish authentication,
  authorization, rate-limit, temporary-provider, and permanent-provider failures without
  depending on Octokit's error shape.
- The sync itself is **user-triggered** ("Sync now" button → server action), not automatic on
  every sign-in or on a schedule — keeps sign-in fast and avoids background jobs before the
  worker has any (the worker still registers none). Automatic/scheduled sync
  is a future decision once the worker has real jobs.
- Sync writes are raw data only (`packages/database`'s `github_profiles` /
  `github_repositories` tables, replaced transactionally per sync). No skill, difficulty, or
  health inference happens in this package — that is the skill-profile domain's job (a later
  milestone).

This client will grow a second, installation-token-based method set (`listRepositories`,
`listRepositoryIssues`, etc., matching GUIDLINE's example shape) when the curated-repository
and issue-synchronisation feature (week 3) needs GitHub App installation access. The two
concerns are kept in the same package but as clearly separate methods, not conflated.

## Alternatives considered

- **Match GUIDLINE's example interface exactly now (installation-based)** — would require
  building GitHub App installation handling before it is needed, and could not be exercised
  honestly without that flow existing.
- **Automatic sync on every sign-in** — simpler trigger, but couples authentication latency
  and failure modes to GitHub API availability; rejected for now (see ADR consequences).
- **No repository cap** — simplest, but violates "respect GitHub API rate limits" for accounts
  with unusually many repositories; rejected.

## Consequences

- Only public data the signed-in user can already see is ever read; no elevated access.
- The 300-repository cap is a documented, revisitable limitation, not a silent bug.
- A future ADR will cover the installation-token client additions for week 3.

## Date

2026-07-11
