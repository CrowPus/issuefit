# @issuefit/recommendation-engine

Deterministic scoring for issue recommendations. Pure domain logic: no GitHub, database, AI,
or HTTP dependencies. Given a developer profile and synchronised issue data, it produces a
0–100 score with a transparent breakdown, human-readable reasons, and machine-readable
exclusion codes. See [ADR-0004](../../docs/decisions/0004-deterministic-recommendation-scoring.md)
for the design rationale.

## Usage

```typescript
import { rankIssues, scoreIssue } from "@issuefit/recommendation-engine";

const profile = {
  skills: [{ name: "Node.js", level: "intermediate" }],
  preferredTechnologies: ["Docker"],
  careerGoalTechnologies: ["Docker"],
  difficulty: { preferred: "intermediate", min: "beginner", max: "advanced" },
};

const { recommendations, excluded } = rankIssues(profile, issueCandidates);
// recommendations[0].score.total      → e.g. 87
// recommendations[0].score.reasons    → ["You already work with Node.js, Docker", ...]
// excluded[0].score.exclusions        → ["already_assigned"]
```

`scoreIssue` scores a single candidate. Pass `{ config, evaluatedAt }` to use custom weights
or a fixed evaluation time (recommended in tests). The default configuration is exported as
`defaultScoringConfig`; invalid configurations throw `ScoringConfigError`.

## Rules

- An issue with any exclusion code must never be recommended, whatever its total.
- The final score always comes from this engine. AI may rephrase `reasons` for display but
  never changes scores or ordering.
- Any change to scoring behaviour requires a `version` bump in the configuration and tests
  covering the new behaviour.
