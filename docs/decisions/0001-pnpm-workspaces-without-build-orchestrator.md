# 0001 — pnpm workspaces without a build orchestrator

## Status

Accepted

## Context

The guidelines require a monorepo with two apps and several packages. Monorepos commonly add a
build orchestrator (Turborepo, Nx) for task caching and pipeline definitions. The MVP has four
workspaces, and the guidelines forbid adding technologies without a proven requirement.

## Decision

Use plain pnpm workspaces. `pnpm -r build` already runs builds in topological order (internal
dependencies first), `pnpm -r --parallel dev` covers watch mode, and pnpm catalogs keep
dependency versions consistent across workspaces. No orchestrator is added.

## Alternatives considered

- **Turborepo** — remote caching and task graphs are valuable at scale, but with four
  workspaces the total build takes well under a minute; the added configuration and dependency
  are not justified yet.
- **Nx** — same reasoning, with a larger configuration surface.

## Consequences

- Zero orchestrator configuration to learn or maintain.
- CI rebuilds everything on each run. When build times become a real bottleneck (many
  packages, slow CI), introducing Turborepo is a additive change recorded in a new ADR.
- `pnpm typecheck` requires `pnpm build` to have run first, because apps resolve internal
  packages via their built type declarations.

## Date

2026-07-11
