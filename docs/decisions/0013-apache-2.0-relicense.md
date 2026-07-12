# 0013 — Relicense from AGPL-3.0 to Apache-2.0

## Status

Accepted (supersedes [0003](0003-agpl-3.0-license.md))

## Context

ADR-0003 chose AGPL-3.0 to prevent closed-source hosted forks. The product
direction has since changed (
merging the IssueFit Network vision): the goal is now maximum
adoption by maintainers, companies, OSPOs, and foundations, plus an open
contribution-manifest specification other tools should freely implement.
Many companies have blanket AGPL bans, and foundation ecosystems (CNCF,
Linux Foundation) overwhelmingly expect Apache-2.0. Dee Empire is currently
the sole copyright holder — every commit to date was authored on its
behalf — so relicensing requires no third-party consent. After external
contributors arrive, this window closes.

## Decision

Relicense the entire project as **Apache-2.0**, effective immediately:

- `LICENSE` carries the canonical Apache License 2.0 text.
- Every workspace `package.json` declares `"license": "Apache-2.0"`.
- The contribution-manifest specification (when published) is Apache-2.0.
- Adopt the Developer Certificate of Origin (`Signed-off-by`) before the
  first external contribution lands.
- The IssueFit name and logo are protected by a trademark policy (to be
  written), which replaces copyleft as the brand-protection mechanism.

## Alternatives considered

- **Keep AGPL-3.0** — retains SaaS-fork protection but conflicts with the
  corporate/foundation adoption goal that now defines the project.
- **Split licensing** (Apache-2.0 spec + AGPL core) — keeps some
  protection but is harder to communicate and still triggers corporate
  AGPL bans on the core platform.

## Consequences

- Anyone may run a modified closed-source hosted copy without publishing
  changes. Accepted trade-off, chosen by the owner on 2026-07-11: the
  moat is now the network, the spec, and the brand — not the license.
- Corporate and foundation adoption barriers are removed.
- The official hosted service and enterprise offerings remain possible as
  commercial products on top of the open core.

## Date

2026-07-11
