# 0005 — Authentication with better-auth

## Status

Accepted

## Context

Developers sign in with GitHub; the guidelines require secure session
cookies, CSRF protection, and rate limiting (GUIDLINE.md §15) without trusting client-side
checks. We need a session strategy that stores its data in our PostgreSQL, works with Next.js
App Router, and stays understandable for contributors.

## Decision

Use **better-auth** with its Drizzle adapter:

- Sessions, OAuth accounts, and verification data live in our own PostgreSQL tables
  (`sessions`, `accounts`, `verifications`), defined in `packages/database` alongside the rest
  of the schema; primary keys are database-generated UUIDs (`advanced.database.generateId:
false`).
- Our `users` table doubles as the better-auth user model. Property names follow better-auth's
  required fields (`name`, `email`, `emailVerified`, `image`); GitHub identity
  (`github_user_id`, `github_username`) is populated at sign-in through `mapProfileToUser`
  (pure function `mapGithubProfileToUser`, unit-tested, with fallbacks for hidden emails and
  empty display names).
- The auth instance is created lazily in `apps/web/lib/auth.ts`, so builds do not require
  runtime secrets; environment variables are validated by `@issuefit/config` on first request.
- better-auth provides httpOnly secure session cookies, CSRF/origin checking, and built-in
  rate limiting on auth endpoints.
- Domain reads (e.g. the dashboard showing GitHub identity) go through our own data-access
  functions (`findUserById`), not through better-auth's session payload — auth is used for
  authentication only.

## Alternatives considered

- **Auth.js / NextAuth v5** — long-standing option, but its v5 API remained unstable for a
  long time and customising its models is harder to follow for contributors.
- **Custom OAuth + own sessions (Arctic)** — fewest dependencies and fully transparent, but we
  would own all security-critical session code (rotation, CSRF, cookie handling) ourselves; not
  justified for an MVP that needs to be safe by default.

## Consequences

- All auth state is self-hosted in PostgreSQL; no third-party auth service.
- The auth tables are owned by better-auth's API — application code must never query
  `sessions`/`accounts`/`verifications` directly.
- Sign-in requires GitHub App credentials in the environment; without them the rest of the
  site still builds and runs.
- The project owner selected better-auth at feature start.

## Date

2026-07-11
