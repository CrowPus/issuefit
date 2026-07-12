# @issuefit/issue-health

Deterministic issue difficulty and clarity scoring, independent of GitHub, HTTP, or the
database. See [ADR-0011](../../docs/decisions/0011-issue-sync-and-health-scoring.md) for the
design rationale, including two signals this package does _not_ compute
(`hasActivePullRequest`, `allowsExternalContributors`) and why.

## Usage

```typescript
import { assessIssueHealth } from "@issuefit/issue-health";

const health = assessIssueHealth({
  title: "Add Docker support",
  description: "A detailed description of the problem...",
  labels: ["good first issue", "docker"],
});
// { difficulty: "beginner", clarityScore: 0.87, isBlocked: false }
```

Pass a custom `IssueHealthConfig` (label keyword lists, clarity length threshold) as the
second argument's `config` field; invalid configurations throw `IssueHealthConfigError`.

## Rules

- `difficulty` defaults to `"intermediate"` when no configured label keyword matches — never
  guessed from anything else.
- `isBlocked` covers labels signalling an issue is not currently viable to work on (blocked,
  wontfix, duplicate, invalid), not only literally "blocked".
- This package never fabricates a value for something it cannot know; callers must not
  represent its output as more precise than a label/description heuristic.
