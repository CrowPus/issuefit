# 0004 — Deterministic recommendation scoring

## Status

Accepted

## Context

Issue recommendations are the core product feature. The guidelines require the final score to
come from structured data, be explainable, and be testable without GitHub or an AI model. A
language model must never decide the final score.

## Decision

Implement scoring as a pure, dependency-free domain package
(`@issuefit/recommendation-engine`):

- Eight weighted components (skill match 30%, technology preference 15%, difficulty match
  10%, freshness 10%, repository activity 10%, maintainer responsiveness 10%, issue clarity
  10%, career-goal match 5%) combined into a 0–100 total.
- Nine exclusion rules (assigned, closed, blocked, stale, active pull request, inactive
  repository, insufficient description, difficulty out of range, external contributions not
  accepted) reported as machine-readable codes; any exclusion makes an issue ineligible.
- Every weight and threshold lives in a versioned `ScoringConfig` validated on each
  evaluation; results carry the config version so future scoring revisions can coexist with
  historical results.
- Signals owned by other domains (repository activity, maintainer responsiveness, issue
  clarity) enter as pre-normalised 0–1 values; the engine computes profile-relative matches
  itself. The evaluation time is injectable, making freshness deterministic in tests.
- Signals with no data score a configurable neutral value rather than penalising the issue.

## Alternatives considered

- **LLM-assigned scores** — not reproducible, not explainable, expensive; explicitly
  forbidden by the guidelines. AI will only phrase explanations around the structured result.
- **Machine-learned ranking model** — needs training data the product does not have yet, and
  hides the reasoning the UI must show.
- **Computing repository/clarity signals inside the engine** — would couple the engine to
  GitHub data shapes; those signals belong to the repository-health and issue domains.

## Consequences

- Every recommendation shown to a user can be reproduced and explained from stored inputs.
- The engine is fully unit-tested with no mocks of GitHub or AI providers.
- Weight tuning is a config change with a version bump, reviewable in one diff.
- The linear weighted model is deliberately simple; if it proves too crude, a successor
  scoring version gets its own ADR.

## Date

2026-07-11
