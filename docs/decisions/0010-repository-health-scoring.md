# 0010 — Deterministic repository health scoring, with an honest placeholder for maintainer responsiveness

## Status

Accepted

## Context

The recommendation engine (ADR-0004) already expects a `RepositorySignals` shape —
`isActive`, `activityScore`, `maintainerResponsivenessScore`, all pre-normalised 0–1 — as an
input it does not compute itself. Something upstream must produce these from raw GitHub data
when a repository is curated. The curation criteria (active, has a contribution
guide, not overwhelmed by spam, etc.) and GUIDLINE.md's "repository health calculation" both
call for this as its own deterministic, testable unit — the same principle already applied to
issue scoring (ADR-0004) and skill inference (ADR-0008).

Real maintainer responsiveness — how quickly maintainers respond to issues and PRs — requires
issue/PR-level timestamp data that does not exist yet; this session's scope is curated
repositories and their metadata only (issue sync is the next session, per the plan agreed with
the project owner).

## Decision

New pure domain package `@issuefit/repository-health`:

- `assessRepositoryHealth(metadata, options)` takes raw signals (`pushedAt`, `archived`,
  `disabled`, `hasContributingGuide` — the last two sourced from GitHub's community-profile
  API) and returns `{ isActive, activityScore, maintainerResponsivenessScore,
curationWarnings }`.
- `activityScore` is purely push-recency: `clamp(1 - daysSincePush / staleAfterDays)`, the same
  linear-falloff shape as the recommendation engine's issue-freshness scoring, but with its own
  longer default threshold (180 days vs. issues' 90) — a stable, low-churn library isn't
  necessarily abandoned the way a quiet issue usually is stale.
- Star count and open-issue count are **not** factored into `activityScore` — popularity isn't
  maintenance activity, and an issue count alone is ambiguous (could mean interest or neglect).
  They are stored and displayed for admin context, not scored.
- `maintainerResponsivenessScore` is **explicitly a configured neutral placeholder**
  (`neutralMaintainerResponsivenessScore`, default 0.5) until issue-level sync can compute it
  for real. The admin UI says "not yet available" rather than showing a fabricated-looking
  number — GUIDLINE.md §2 forbids fake data presented as real, and a neutral score dressed up
  as a measurement would be exactly that.
- `curationWarnings` (`archived`, `disabled`, `stale`, `no_contributing_guide`) are
  informational, not blocking — the admin makes the final curation call, mirroring how the
  recommendation engine separates hard exclusions from soft signals.
- Config is versioned and validated, matching ADR-0004/0008's pattern exactly.

## Alternatives considered

- **Estimate responsiveness from a handful of recent issues fetched now** — would blur this
  session's scope into issue sync (explicitly deferred) and only produce a rough estimate
  anyway; rejected in favour of doing it properly once issue data exists.
- **Factor stars/open-issues into activityScore** — tempting but not deterministically
  meaningful (see above); left as purely informational fields.

## Consequences

- `repositories.maintainer_responsiveness_score` in the database currently always holds the
  configured neutral value for every row — this is expected, not a bug, until the issue-sync
  session replaces it with a real computation (that will need its own ADR).
- Repository health is fully reproducible and unit-tested without any GitHub or database call.

## Date

2026-07-11
