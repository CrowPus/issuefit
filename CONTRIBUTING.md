# Contributing to IssueFit

Thank you for considering a contribution. This guide explains how to get the project running,
what we expect from changes, and how reviews work.

## Running the project

Follow the [local setup in the README](README.md#local-setup). In short:

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm build
pnpm dev
```

## Finding something to work on

- Issues labelled `good first issue` are scoped for newcomers.
- Issues labelled `help wanted` are ready for anyone.
- Comment on an issue before starting significant work so maintainers can confirm the
  direction and nobody duplicates effort.

## Branch naming

Branch from `main` using:

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

Example: `feat/issue-freshness-scoring`.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(recommendations): add issue freshness scoring
fix(github): handle revoked app installations
docs(setup): document webhook configuration
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `perf`,
`security`. Each commit should be one logical change. Do not mix formatting, refactoring, and
features in a single commit.

## Testing requirements

- Every business rule needs unit tests (Vitest, `*.test.ts` next to the code).
- External boundaries (GitHub, AI providers) are mocked; internal modules are not.
- End-to-end tests (Playwright, `tests/e2e/`) cover critical user journeys.
- Tests verify behaviour, not implementation details. Do not add tests only to raise coverage.

Before opening a pull request, run:

```bash
pnpm format:check && pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

## Pull-request requirements

Every pull request must:

- Reference the related issue.
- Explain what changed, why, and how it was tested (the template will prompt you).
- Include screenshots for UI changes.
- Include generated migrations for any schema change.
- Document any new environment variables in `.env.example` and the README.
- Pass CI (format, lint, types, tests, build, migration validation, audit).
- Contain no leftover debugging code, placeholder implementations, or unexplained
  `eslint-disable` / `@ts-expect-error` comments.

## Code style

- TypeScript strict mode; no `any`, no non-null assertions, `unknown` for untrusted values.
- Validate all external input with Zod before use.
- Keep business logic out of React components, route handlers, and ORM queries — it belongs in
  domain modules.
- Prefer the simplest correct solution; do not add abstractions before at least two real use
  cases exist.
- Prettier and ESLint enforce formatting and linting; run `pnpm format` before committing.

## Proposing architectural changes

Significant decisions (new dependency, new package, schema redesign, provider abstraction)
need an architecture decision record in [docs/decisions/](docs/decisions/). Open an issue
describing the problem first; once there is agreement, submit the ADR and implementation as a
pull request. See existing ADRs for the format.

## Reporting security issues

Never open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## How maintainers review

Maintainers check that a change:

1. Solves the stated problem with the smallest clean solution.
2. Respects the layer boundaries described in
   [docs/architecture/overview.md](docs/architecture/overview.md).
3. Handles failure cases and validates inputs.
4. Is covered by meaningful tests.
5. Updates documentation where behaviour changed.

Reviews aim to be constructive and prompt. Small, focused pull requests are reviewed much
faster than large ones.
