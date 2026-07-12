# 0015 — Real maintainer responsiveness and linked-PR detection

## Status

Accepted

## Context

Two recommendation signals have been honest placeholders since their ADRs:
`repositories.maintainer_responsiveness_score` (a constant neutral 0.5,
ADR-0010) and `issues.has_active_pull_request` (a constant `false`,
ADR-0011). Both ADRs deferred the real computation, not rejected it.
Milestone M2 exists to remove
them: the project is now public under Apache-2.0 with the explicit goal of
company adoption, and any value that looks measured but isn't undermines
exactly the trust the plan depends on. The deterministic issue briefing
(M4) must not launch on placeholder signals.

## Decision

Both signals become measured during **issue sync** (the moment we already
pay per-repository API cost), using the REST API with the existing
service token — no GraphQL dependency:

### Maintainer responsiveness

- For a sample of the most recently updated open issues (up to
  `responseSampleSize`, default 20), fetch each issue's first comments
  (one API call per sampled issue, only when `commentsCount > 0`).
- The **first response** is the first comment by someone other than the
  issue's author. Author-only threads count as unanswered.
- `@issuefit/repository-health` gains a pure
  `assessMaintainerResponsiveness(samples)`:
  - `medianResponseDays` — median of first-response latencies (null when
    no sampled issue was answered);
  - `responseRate` — answered ÷ sampled (null when the sample is empty);
  - `score` — `clamp(1 − medianDays / maxResponseDays) × responseRate`,
    with `maxResponseDays` default 30; null when the sample is empty,
    `0` when sampled issues exist but none were answered.
- The score, median, and rate are stored on the repository row.
  `maintainer_responsiveness_score` becomes **nullable**: null means "not
  measured yet", never a substituted neutral value. The migration also
  nulls out every existing stored 0.5 — those rows were placeholders.
- The recommendation engine's `RepositorySignals` accepts
  `maintainerResponsivenessScore: number | null`; null scores as the
  engine's existing `unknownSignalScore` with no reason text — the same
  treatment already given to unknown technology signals. The engine's
  "Maintainers respond quickly to contributors" reason can now only be
  produced by measured data.
- Repository add/refresh no longer writes responsiveness fields at all,
  so a metadata refresh cannot clobber a measured value.

### Linked pull-request detection

- For **every** synced issue, fetch its timeline
  (`GET /repos/{owner}/{repo}/issues/{number}/timeline`, first page of
  100 events) and look for `cross-referenced` events whose source is a
  pull request. `has_active_pull_request` is true when any referencing PR
  is currently open. The engine's existing `active_pull_request`
  exclusion finally has real data behind it.

### Cost, honestly stated

One "Sync issues" click on a repository with the full 100-issue cap now
makes up to ~100 timeline calls + ~20 comment calls + the 1–2 listing
calls, run with bounded concurrency. That is well within a 5,000/hour
token budget for one-repository-at-a-time admin syncs, but syncing the
whole future 100-repository catalogue back-to-back would approach it —
acceptable for the MVP's manual, per-repository sync button; revisit
(GraphQL batching or webhooks) before any automatic bulk re-sync exists.

`allowsExternalContributors` is **not** touched: per ADR-0011 it is a
curation judgement, not an unmeasured metric, and the Contribution
Manifest (M3) is what makes it maintainer-declared.

## Alternatives considered

- **GraphQL batching** (one query per repository) — far fewer calls, but
  introduces a second API client and fine-grained-token capability risk;
  deferred until bulk/automatic re-sync needs it.
- **Sampling only commented issues for responsiveness** — overstates
  responsiveness by ignoring ignored issues; the sample deliberately
  includes unanswered issues so `responseRate` is meaningful.
- **Keeping the neutral 0.5 until webhooks exist** — rejected; M2's whole
  purpose is zero unmeasured values presented to the engine or users.

## Consequences

- `repositories` gains nullable `median_first_response_days` and
  `first_response_rate`; `maintainer_responsiveness_score` becomes
  nullable, with existing rows reset to null by the migration.
- Issue sync is slower per click (dozens of API calls instead of ~2) and
  is now the single place both signals are produced; the admin UI says a
  repository's responsiveness is "not yet measured" until its issues have
  been synced under this ADR.
- Repositories synced before this ADR show "not yet measured" until the
  admin re-syncs their issues — honest, and self-healing on next sync.
- The engine's scoring config version is bumped (null-signal handling is
  a behaviour addition); persisted `score_version` values distinguish old
  and new scores.

## Date

2026-07-11
