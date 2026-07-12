# 0012 — Wiring the recommendation engine to real data

## Status

Accepted

## Context

`@issuefit/recommendation-engine` (ADR-0004) has been complete and unit-tested since early in
the project, deliberately built ahead of the data it needs. Skills (ADR-0008), career goals,
curated repositories (ADR-0009/0010), and synced issues (ADR-0011) now all exist. This session
connects them: a real `/recommendations` page, computed from a real signed-in user's real data,
for the first time.

Several gaps between what the UI collects/stores and what the engine's input types expect had
to be resolved with real decisions, not guesses.

## Decision

**Live computation, no persistence.** `getRecommendationsForUser` queries current skills,
career goal, and synced issues, and calls `rankIssues` fresh on every page load. Unlike GitHub
sync, skill refresh, or issue sync — all explicit, user-triggered actions because they cost
real GitHub API quota — the engine is pure, in-memory, and effectively free to run, so there is
no reason to cache a result or require a manual "Generate" action. The original schema includes a
`recommendations` table with `status`/`opened_at` for tracking developer interaction over time;
building that now, before contribution tracking exists to give it purpose, would be schema work
ahead of its own justification — deferred to whenever that tracking work happens.

**Difficulty preference stays permissive.** The career-goal form collects one _preferred_
difficulty, never a min/max range (the UI never asked for one). The engine's
`DifficultyPreference` wants both a preferred value and a hard min/max exclusion band. Mapping
the single preference onto `min: "beginner", max: "advanced"` always keeps difficulty a soft
scoring signal, never a hard exclusion the user never actually agreed to.

**Career-goal technologies come from a small static table**, not from the database. `career_goals`
stores a `goal` enum (e.g. `backend_developer`) with no associated technology list, and the
engine wants `careerGoalTechnologies: string[]` for its 5%-weight component. A documented,
hand-picked mapping (`apps/web/lib/career-goal.ts`'s `careerGoalTechnologies`) gives each goal a
short, defensible technology list; `open_source_collaboration` and `other` get none, since
neither goal implies a technology bias — inventing one would be exactly the kind of fabricated
specificity the project avoids.

**An issue's only technology signal is its repository's primary language.** Neither `issues`
nor `@issuefit/issue-health` extracts technologies from an issue's labels or description — GitHub
labels are project-specific free text ("bug", "priority: high"), not a reliable technology
signal, and parsing them as one would be a fragile heuristic dressed up as data. The repository's
GitHub-reported dominant language (already used identically for skill inference, ADR-0008) is
the one honest signal available; issues in a repository with no detected language score neutral
on every technology-dependent component rather than being penalised.

**Every stored `IssueRecord`/`RepositoryRecord` field the engine doesn't need for scoring**
(URLs, full names, titles) is joined back onto each result after ranking — `IssueCandidate`
correctly has no business carrying display-only fields, so `getRecommendationsForUser` keeps a
lookup from issue id back to its full database row for the presentation layer.

**Capped at 5** (the product recommends only three to five issues at a time).
Excluded issues are never shown to end users — that information is only useful for admin
debugging, not as a developer-facing feature in this pass.

**"Estimated effort" is omitted from the UI entirely.** The original example recommendation card
shows an effort estimate, but nothing in the schema or engine produces one — no time-tracking
data exists anywhere in the pipeline. Showing a number here would be fabricated data presented
as real, which the project does not do (GUIDLINE.md §2). Worth adding once a real signal exists
(e.g. historical time-to-close for similarly-labelled issues); not before.

## Alternatives considered

- **A `recommendations` table with a "Generate" button** — matches the sync-heavy features'
  pattern for consistency, but the engine has no cost to amortise; adding persistence only to
  match a pattern that exists for a different reason would be premature.
- **Deriving issue technologies from labels via keyword matching** — considered and rejected;
  no reliable convention exists across repositories for "this label names a technology."

## Consequences

- Recommendations are always current — no staleness, no cache invalidation to reason about.
- Two small, explicit, documented mapping simplifications
  (`careerGoalTechnologies`, difficulty min/max) sit at the application boundary in
  `apps/web/lib/`, not inside the pure engine or domain packages, keeping those reusable and
  free of IssueFit-specific assumptions.
- No feedback loop yet ("Good match" / "Too difficult" buttons)
  — needs the same future contribution-tracking work that would justify persistence.

## Date

2026-07-11
