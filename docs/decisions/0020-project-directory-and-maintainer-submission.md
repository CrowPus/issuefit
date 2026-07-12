# 0020 — Project directory and maintainer self-submission

## Status

Accepted

## Context

Until now, repositories entered IssueFit only through admin curation. The
owner approved a scope extension between M6 and M7: maintainers should be
able to submit their own projects, showcased on a public directory that
anyone can browse, so the platform serves the maintainer side directly
instead of only through the admin.

The existing pipeline already does everything a submitted project needs —
metadata fetch, health assessment, manifest snapshot (ADR-0016), setup
signals (ADR-0017), issue sync with measured responsiveness (ADR-0015),
and the `approved` flag that gates the recommendation pool.

## Decision

- **No separate "projects" system.** Maintainer submission writes into the
  same `repositories` table through the same fetch pipeline. New columns:
  `source` (`curated` | `submitted`), `submitted_by_user_id`,
  `submitted_at`. A submitted project immediately feeds the public
  directory, issue sync, and recommendations — listing a project is what
  connects it to matching developers.
- **Two proofs gate submission** (`/projects/submit`, signed-in):
  1. The submitter must have push access to the repository, checked with
     their own OAuth token (`GET /repos/{owner}/{repo}` `permissions`,
     ADR-0007-style user-token read).
  2. The repository must carry a **valid contribution manifest** with
     `externalContributions: true` and `acceptingContributors: true`.
     Only someone who can commit could have added the file, so the
     manifest doubles as proof of control and of consent (ADR-0016).
- **Failed submissions convert to manifest adoption.** A missing or
  invalid manifest routes the maintainer to a deterministic manifest
  generator (new `generateContributionManifestYaml` in
  `@issuefit/contribution-manifest`): form input is validated through the
  same Zod schema and stringified with the same `yaml` dependency, so a
  generated file can never be rejected later as invalid.
- **Auto-publish with an admin kill switch, no approval queue.** The two
  proofs are strong enough for self-serve listing. Admins get
  Unlist/Relist on `/admin/repositories` (reusing `approved`); unlisting
  removes the project from the directory and the recommendation pool,
  blocks resubmission, and is **sticky**: the metadata upsert excludes
  `approved` from its conflict update, so a refresh can never silently
  relist.
- **Public pages render only stored data** — zero GitHub calls per view,
  same principle as the briefing (ADR-0017). `/projects` (directory) and
  `/projects/[owner]/[name]` (showcase) are unauthenticated; signed-in
  visitors additionally see how many of their top recommendations come
  from each project. Unknown/unlisted projects get one neutral
  "not listed" page.
- **Contributor-readiness grade** (`assessContributorReadiness` in
  `@issuefit/repository-health`): a deterministic 0–100 score/A–E grade
  over seven weighted items (valid accepting manifest 25, contributing
  guide 15, activity 15, measured responsiveness ≤7d median 15, README
  10, code of conduct 10, CI workflows 10). Signals never measured score
  zero but display as "not measured yet", never as failures (ADR-0015
  honesty rule); the directory is ordered by this score, stars as
  tiebreaker.
- **Issue sync runs once automatically after submission** (best effort),
  so a new project page shows issues and measured responsiveness
  immediately. Submission cost ≈ the admin add/refresh budget plus one
  issue sync (~120 calls, ADR-0015).

## Alternatives considered

- **A separate `projects` table.** Rejected: it would duplicate the
  repository snapshot and disconnect showcased projects from
  recommendations — the connection is the point.
- **Admin approval queue before listing.** Rejected: it reintroduces the
  bottleneck self-submission removes; push-access + manifest is already a
  two-factor consent proof, and unlist covers abuse after the fact.
- **Accepting submissions without a manifest.** Rejected: the manifest is
  the platform's consent primitive (ADR-0016), and requiring it turns
  every submission into manifest adoption.
- **Hand-templated YAML in the generator.** Rejected: `YAML.stringify` of
  the schema-validated object guarantees round-tripping; templates can
  drift from the schema.
- **Readiness grade as a recommendation-score component.** Rejected: it
  describes a repository's contributor experience, not an issue's fit for
  a developer; scores stay with the engine (ADR-0004) and the grade stays
  a directory signal.

## Consequences

- `repositories` gains `source`, `submitted_by_user_id`, `submitted_at`
  (migration 0012) and a `repository_source` enum.
- An admin metadata refresh no longer re-approves an unlisted repository
  (deliberate behavior change; relisting is the explicit Relist action).
- `GitHubClient` gains `getRepositoryViewerCanPush`; the details mapper
  reads the optional `permissions` block.
- The public directory shows admin-curated repositories too (all data is
  public GitHub data); only maintainer-submitted ones carry the
  "Maintainer-submitted" badge.
- Rankings (IssueFit top projects, GitHub top-10) are the second slice of
  this milestone and will be decided in their own ADR.

## Date

2026-07-12
