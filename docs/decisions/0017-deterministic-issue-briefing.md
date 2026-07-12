# 0017 — Deterministic issue briefing

## Status

Accepted

## Context

M4 replaces the cancelled AI briefing with a
deterministic briefing page: opening a recommendation shows the full score
breakdown, the repository's community links, local setup signals, measured
maintainer responsiveness, the manifest requirements verbatim, and a manual
pre-flight checklist — entirely from structured data, with every unavailable
signal shown as "not available", never a placeholder (ADR-0015's honesty rule).

Two of those sections need data we do not store yet:

- Community links: the community-profile endpoint is already called during
  curation, but only `hasContributingGuide` is kept; the contributing guide,
  code of conduct, and README URLs are discarded.
- Setup signals (`docker-compose`/`compose` file, lockfile → package manager,
  `.nvmrc` Node version, CI workflow names) are never fetched.

The open question is when to fetch them: per briefing view or at curation time.

## Decision

- **Fetch at curation time, render from the database.** Repository add/refresh
  gains at most three GitHub calls: one root-contents listing, one
  `.github/workflows` listing, and one `.nvmrc` read only when the root listing
  shows the file. A briefing page view makes **zero** GitHub API calls — it
  reads stored rows and recomputes the score in memory, so cost stays bounded
  by admin actions (like ADR-0011/0015), not by page traffic.
- Store the community-profile URLs (`contributing_url`, `code_of_conduct_url`,
  `readme_url`) and setup signals (`package_manager`, `has_docker_compose`,
  `node_version`, `ci_workflow_names`) on `repositories`, plus
  `setup_signals_checked_at`. A null `setup_signals_checked_at` means "not
  measured yet" — repositories curated before M4 show "not available" until
  their next refresh. After measurement, absence is stored honestly
  (`has_docker_compose = false`, `package_manager = null`, `ci_workflow_names
= []`).
- Signal detection is a pure function (`detectSetupSignals`) in
  `@issuefit/repository-health`, mapping file names to signals (lockfile table
  covering the major ecosystems; compose file variants; workflow files by
  `.yml`/`.yaml` extension). The web layer only fetches and stores.
- Add `GitHubClient.listRepositoryDirectory()` returning the file names of one
  directory (single API call, first page of 100 entries — a documented bound;
  repository roots and workflow directories rarely exceed it). Missing paths
  return `null` like `getRepositoryFile` (ADR-0016).
- The briefing route is `/recommendations/[githubIssueId]`, session-gated and
  keyed by the stable GitHub issue id (same key as feedback, ADR-0014, since
  issue sync replaces rows and UUIDs are unstable). The server loads the synced
  issue + repository snapshot, recomputes the score for the current user with
  the live engine, and renders structured sections. If the issue is now
  excluded (assigned, stale, opted out), the briefing says so instead of
  pretending it is still recommendable.
- The pre-flight checklist is client-local React state only. Nothing is
  persisted until M5's contribution tracking gives checklist state a real home;
  persisting it now would add a table for a UI affordance.

## Consequences

- Briefing pages are fast, deterministic, and reproducible; the same stored
  snapshot and profile always render the same briefing.
- Setup signals and community links can lag the repository until an admin
  refresh, the same trade-off already accepted for every other curated
  snapshot field.
- Repository add/refresh grows from 3 to at most 6 GitHub calls — still far
  below one issue sync (~120 calls, ADR-0015).
- Lockfile detection is a fixed table; ecosystems outside it show "not
  detected" honestly and the table can grow by PR.
