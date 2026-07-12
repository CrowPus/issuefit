# @issuefit/skills

Skill-profile and career-goal domain: deterministic skill inference and Zod validation
schemas, independent of GitHub, HTTP, or the database. See
[ADR-0008](../../docs/decisions/0008-deterministic-skill-inference.md) for the design
rationale, including why this infers skills from repository counts rather than AI.

## Usage

```typescript
import { inferSkillsFromRepositories } from "@issuefit/skills";

const proposals = inferSkillsFromRepositories(
  repositories.map((r) => ({ primaryLanguage: r.primaryLanguage, isFork: r.isFork })),
);
// [{ name: "TypeScript", level: "advanced", confidenceScore: 1, repositoryCount: 12 }, ...]
```

Pass a custom `SkillInferenceConfig` as the second argument to change thresholds; invalid
configurations throw `SkillInferenceConfigError`.

`careerGoalInputSchema`, `updateSkillLevelInputSchema`, and `addSkillInputSchema` validate
user-submitted input before it reaches the database — every server action in `apps/web` that
touches skills or career goals parses through one of these first.

## Rules

- This package never becomes the source of truth for a _confirmed_ skill — once a user edits
  a skill, the database layer (`packages/database`'s conditional upsert) protects it from
  being overwritten by a future inference run.
