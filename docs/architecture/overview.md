# Architecture Overview

## What IssueFit does

IssueFit connects to a developer's GitHub account, builds an editable skill profile from their
public activity, recommends open-source issues from a curated repository list using a
deterministic weighted score, reads maintainer-declared contribution rules from an open manifest
file, tracks the contribution through to a merged pull request, and produces a verified portfolio
entry.

## System shape

```text
Developer
   |
   v
Next.js application (apps/web)
   |
   +---- PostgreSQL (packages/database)
   |
   +---- GitHub App (packages/github)
   |
   +---- Skill inference (packages/skills)
   |
   +---- Contribution Manifest validation (packages/contribution-manifest)
   |
   +---- Background worker (apps/worker)
   |
   +---- GitHub webhooks
```

Recommendation pipeline:

```text
GitHub connection → profile sync → skill extraction → issue candidate filtering
→ deterministic scoring → developer recommendation
```

GitHub connection (sign-in) and profile sync land in PostgreSQL; skill extraction turns synced
repositories into an editable skill profile (`packages/skills`); curated repositories, their
Contribution Manifest v0 snapshots, and their issues (`/admin/repositories`,
`packages/repository-health`, `packages/issue-health`, `packages/contribution-manifest`) supply
candidates; `/recommendations` (`apps/web/lib/recommendations.ts`) scores them live with
`packages/recommendation-engine` against a real signed-in user's real skills, career goal, and
preferences — see ADR-0012 and ADR-0016. Deterministic issue briefings and contribution tracking
are next.

## Monorepo layout

| Workspace                        | Responsibility                                                 | Status  |
| -------------------------------- | -------------------------------------------------------------- | ------- |
| `apps/web`                       | Presentation layer and HTTP entry points, incl. GitHub sign-in | Growing |
| `apps/worker`                    | Scheduled jobs: sync, scoring runs, weekly recommendations     | Shell   |
| `packages/config`                | Environment schemas and validation                             | Done    |
| `packages/contribution-manifest` | Open Contribution Manifest v0 schema and validation            | Done    |
| `packages/database`              | Schema, migrations, database client factory                    | Growing |
| `packages/recommendation-engine` | Deterministic issue scoring, exclusions, and explanations      | Done    |
| `packages/github`                | GitHub API access behind a `GitHubClient` interface            | Growing |
| `packages/skills`                | Deterministic skill inference and validation schemas           | Done    |
| `packages/repository-health`     | Deterministic repository health scoring for curation           | Growing |
| `packages/issue-health`          | Deterministic issue difficulty and clarity scoring             | Growing |

Planned packages (created only when their first feature lands): `packages/shared`
(cross-domain types once two or more workspaces need them).

## Layer boundaries

1. **Presentation** (`apps/web` pages/components): rendering, forms, loading/error states,
   calling application services. No business logic, no database access.
2. **Application** (use-case services): workflow orchestration, permissions, transactions.
3. **Domain** (business rules): scoring, status transitions, eligibility. Must not import
   Next.js, React, or HTTP libraries.
4. **Infrastructure** (providers): PostgreSQL and GitHub API — always behind interfaces so
   implementations can be replaced.

Dependency direction: presentation → application → domain ← infrastructure (infrastructure
implements domain-defined interfaces).

## Key rules

- The recommendation score is computed by a deterministic, unit-tested engine — never by an
  AI model. The MVP has no AI provider dependency.
- All external input (HTTP, webhooks, manifest files) is validated with Zod before use.
- Environment variables are validated at process startup via `@issuefit/config`.
- Database access happens only in repository/data-access modules, never in route handlers or
  components.
- GitHub webhooks are signature-verified and processed idempotently once webhook-backed
  contribution tracking lands.

## Decision records

Architectural decisions are recorded in [docs/decisions/](../decisions/). Current records:

- [0001 — pnpm workspaces without a build orchestrator](../decisions/0001-pnpm-workspaces-without-build-orchestrator.md)
- [0002 — Drizzle ORM for PostgreSQL access](../decisions/0002-drizzle-orm.md)
- [0003 — AGPL-3.0 license](../decisions/0003-agpl-3.0-license.md) (superseded by 0013)
- [0004 — Deterministic recommendation scoring](../decisions/0004-deterministic-recommendation-scoring.md)
- [0005 — Authentication with better-auth](../decisions/0005-better-auth-authentication.md)
- [0006 — Single GitHub App with least-privilege permissions](../decisions/0006-github-app-permissions.md)
- [0007 — GitHub client reads with the user's OAuth token, capped and paginated](../decisions/0007-github-client-user-token-reads.md)
- [0008 — Deterministic language-count skill inference](../decisions/0008-deterministic-skill-inference.md)
- [0009 — Service token and env-based admin allowlist for curated repositories](../decisions/0009-curated-repository-service-token.md)
- [0010 — Deterministic repository health scoring](../decisions/0010-repository-health-scoring.md)
- [0011 — Label-based issue sync and health scoring, with two documented gaps](../decisions/0011-issue-sync-and-health-scoring.md)
- [0012 — Wiring the recommendation engine to real data](../decisions/0012-wiring-the-recommendation-engine.md)
- [0013 — Relicense from AGPL-3.0 to Apache-2.0](../decisions/0013-apache-2.0-relicense.md)
- [0014 — Recommendation feedback, persisted at feedback time](../decisions/0014-recommendation-feedback-persisted-at-feedback-time.md)
- [0015 — Real maintainer responsiveness and linked-PR detection](../decisions/0015-real-responsiveness-and-pr-detection.md)
- [0016 — Contribution Manifest v0](../decisions/0016-contribution-manifest-v0.md)
