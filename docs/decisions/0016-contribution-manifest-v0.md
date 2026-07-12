# 0016 — Contribution Manifest v0

## Status

Accepted

## Context

IssueFit's first curation flow is admin-selected repositories. That works for
the developer-loop MVP, but it does not prove maintainer consent. The final MVP
plan adds the Open Contribution Manifest as the maintainer-side bridge: the file
is the onboarding, and it must beat admin curation when it says outside
contributions are not wanted.

M3 needs enough of the manifest to be real before the deterministic issue
briefing launches: parse and validate the file, store the snapshot, surface
invalid manifests, apply opt-out/filter/boost rules, publish the spec, and
dogfood it in this repository.

## Decision

- Add `packages/contribution-manifest`, a pure TypeScript package exporting the
  v0 Zod schema, canonical path, YAML parser, and typed validation result.
- Use the `yaml` package for parsing. The original handoff preferred no runtime
  dependency beyond Zod, but a hand-written YAML subset would be less correct
  and harder for other contributors to trust. The dependency is limited to the
  manifest package and the schema remains the source of truth.
- Add `GitHubClient.getRepositoryFile()` using the existing REST client and
  service token. A missing file returns `null`; other provider failures keep the
  existing classified error path.
- Fetch the manifest during curated repository add/refresh and store:
  raw contents, status (`missing` / `valid` / `invalid`), validation errors, and
  flattened v0 fields on `repositories`.
- Keep invalid manifests visible on `/admin/repositories`. Invalid files do not
  silently opt a repository in or out; admin curation remains the fallback until
  the file validates.
- Apply valid-manifest precedence immediately in recommendation mapping:
  `externalContributions: false` or `acceptingContributors: false` makes issues
  ineligible through the engine's existing
  `external_contributions_not_accepted` exclusion, even if issue rows were
  synced before the manifest changed.
- Apply valid-manifest opportunity filters in the app layer before ranking:
  issue difficulty must be listed in `opportunities.difficulty`, and issue
  labels must match one of `opportunities.allowedTypes`.
- Add two bounded recommendation boosts in the engine and bump scoring config
  version to `3`: a small maintainer-approved manifest boost, plus a preferred
  skill overlap boost when a developer's confirmed skills match
  `opportunities.preferredSkills`.
- Show a "Maintainer-approved" badge for valid, accepting manifests on
  recommendation cards and admin repository rows.
- Publish `docs/spec/contribution-manifest.md` and add IssueFit's own
  `.github/contribution-manifest.yml`.

## Alternatives considered

- **Leave admin curation as the only consent signal.** Rejected: it does not
  satisfy the maintainer-control promise at the core of the product.
- **Implement a YAML subset by hand to avoid a parser dependency.** Rejected:
  the manifest is an open YAML spec, and a partial parser would create edge
  cases that the schema could not reliably explain.
- **Exclude invalid manifests entirely.** Rejected for v0: invalid files are
  likely adoption mistakes, and admin curation remains an explicit human
  fallback. The UI must show the validation errors.
- **Store only the raw manifest.** Rejected: recommendation filtering and future
  briefings need structured, queryable fields without reparsing on every page
  load.
- **Make manifest boosts a ninth weighted component.** Rejected for M3: the
  eight existing components still explain fit. Manifest adoption is a bounded
  maintainer-consent reward, not a new skill-quality signal.

## Consequences

- `repositories` gains manifest snapshot/status/field columns and a new
  `contribution_manifest_status` enum.
- Curated repository refresh now makes one extra REST request for the manifest
  file. Issue sync API cost is unchanged.
- Existing repositories start as `manifest_status = 'missing'` until refreshed.
- Recommendation scores generated under this change carry score version `3`.
- The deterministic briefing in M4 can read maintainer requirements from stored
  manifest fields instead of introducing another GitHub request.

## Date

2026-07-11
