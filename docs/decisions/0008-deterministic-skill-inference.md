# 0008 — Deterministic language-count skill inference

## Status

Accepted

## Context

The product needs a skill profile the platform proposes from GitHub activity, which
the user can then edit — because "GitHub activity may not show every skill they have."
The original plan framed "convert GitHub activity into a proposed skill profile" as an AI capability,
but the project has no AI provider yet (`packages/ai` does not exist — no model, no API keys,
no cost decision made). Building that infrastructure just to unblock this feature would be a
large, premature commitment.

## Decision

Propose skills deterministically from data already synced by `packages/github`
(`github_repositories.primaryLanguage`), in a new pure domain package `@issuefit/skills`:

- Count non-fork repositories per primary language (forks excluded by default — forking a
  repository is not evidence of writing code in it).
- Repository count at or above a configurable `advancedThreshold` (default 5) proposes
  "advanced"; at or above `intermediateThreshold` (default 2) proposes "intermediate";
  otherwise "beginner". `confidenceScore` is the count normalised against the advanced
  threshold, capped at 1.
- Thresholds live in a versioned, validated `SkillInferenceConfig` — the same pattern as the
  recommendation engine's `ScoringConfig` (ADR-0004): no hidden magic numbers, a `version`
  field for future revisions.
- The algorithm is pure (no GitHub, database, or HTTP access) and fully unit-tested.
- Proposals are always editable: `user_skills.userConfirmed` marks a row a human has set, and
  the sync's conditional upsert (`ON CONFLICT ... DO UPDATE ... WHERE user_confirmed = false`)
  never overwrites a confirmed row. Users can also add skills GitHub cannot see at all.
- Regeneration is user-triggered ("Refresh from GitHub" on `/profile`), not automatic —
  consistent with the GitHub sync's own trigger design (ADR-0007).

AI-based skill-profile suggestions (per GUIDLINE.md §10) remain a valid future enhancement —
e.g. an AI provider proposing skills the language-count heuristic cannot see, such as testing
practices or documentation quality — but are out of scope until `packages/ai` exists.

## Alternatives considered

- **Build an AI-based skill proposal now** — matches the original framing, but requires
  provider selection, API keys, and cost/latency handling before this feature could work at
  all; rejected as premature for this increment.
- **Recency-weighted or byte-weighted scoring** (using GitHub's per-repository language byte
  counts, not just primary language) — more accurate, but requires an additional API call per
  repository; the existing sync already made a documented choice not to do that (ADR-0007's
  cap discussion). A future revision can add this behind a config version bump if the simple
  count proves too coarse.

## Consequences

- Every skill proposal is deterministic and reproducible from the stored repository snapshot,
  and reviewable in a single config diff if thresholds need tuning.
- Only skills derivable from GitHub's primary-language field are proposed automatically;
  frameworks, tools, and practices (Testing, Documentation, Docker-as-a-practice) require a
  user to add them manually today — a known, documented limitation.
- Manually added skill names are matched case-sensitively against the shared `skills` catalog
  (no case-insensitive dedupe yet) — a known limitation, not a silent bug.

## Date

2026-07-11
