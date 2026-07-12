# 0002 — Drizzle ORM for PostgreSQL access

## Status

Accepted

## Context

The guidelines allow Prisma or Drizzle. The project needs typed PostgreSQL access, a
migration workflow that CI can validate, and schema definitions that new contributors can read
without learning a proprietary schema language.

## Decision

Use Drizzle ORM with the `node-postgres` (`pg`) driver. Schema is defined in TypeScript in
`packages/database/src/schema/`; `drizzle-kit generate` produces plain SQL migrations in
`packages/database/drizzle/`, applied with `drizzle-kit migrate`.

## Alternatives considered

- **Prisma** — excellent developer experience and documentation, but brings a separate schema
  language, a generated client with a binary engine, and heavier cold starts. Its migration
  SQL is less transparent than Drizzle's plain SQL files.
- **Kysely (query builder only)** — very transparent, but offers no schema definition or
  migration generation, which we would have to build ourselves.

## Consequences

- Migrations are reviewable SQL files committed with the schema change; CI applies them to a
  clean PostgreSQL and fails when schema and migrations drift apart.
- Queries stay close to SQL, which keeps the data-access layer explicit.
- ORM-generated types stay inside `packages/database`; other layers use domain types, as the
  guidelines require.
- The project owner selected Drizzle over Prisma at project start.

## Date

2026-07-11
