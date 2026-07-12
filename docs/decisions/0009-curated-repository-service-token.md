# 0009 — Service token and env-based admin allowlist for curated repositories

## Status

Accepted

## Context

Week 3 needs a curated catalog of open-source repositories, distinct from the
`github_repositories` a signed-in user syncs for their own profile. Curated repositories belong
to _other_ people (`facebook/react`, `microsoft/vscode`, …), so the signed-in admin's own OAuth
token — scoped to what they personally can see — cannot read them at any real scale. GitHub's
unauthenticated rate limit is 60 requests/hour, too low for even a modest catalog refreshed
regularly. There is also no roles/permissions system yet to decide who may curate.

## Decision

**Service token.** A dedicated, read-only, fine-grained GitHub personal access token
(`GITHUB_SERVICE_TOKEN`), created and rotated by the project owner, used only server-side by
admin actions (and, later, the worker) to read public repository data. This is a different kind
of credential from user OAuth sign-in (ADR-0005) and is never sent to the browser or tied to
any individual's session. `@issuefit/github`'s `GitHubClient` stays token-agnostic by design
(ADR-0007): the new `getRepository` / `getRepositoryCommunityProfile` methods take whatever
token the caller supplies, so the same client serves both user-token and service-token callers
without a parallel implementation.

This does **not** conflict with GUIDLINE.md §8's "do not require users to manually provide
personal access tokens" — that rule protects end users from being asked to hand over their own
credentials; the service token is a platform-operated credential no user ever sees or provides.

**Admin access.** `ADMIN_GITHUB_USERNAMES`, a comma-separated env var checked against the
signed-in user's `githubUsername` (`lib/admin.ts`'s `isAdminUsername` / `isAdminUserId`). No
schema change. The `/admin/repositories` page redirects non-admins server-side, and — because
client-side checks must never be trusted (GUIDLINE.md §15) — every admin server action
independently re-verifies the caller before doing anything.

## Alternatives considered

- **Unauthenticated GitHub requests** — no setup, but 60 req/hour cannot sustain 50–100 curated
  repositories refreshed on any reasonable cadence; rejected.
- **`users.role` column now** — more conventional long-term, but is schema work and migration
  overhead for a capability only the project owner uses today; can be introduced later without
  disruption if a real multi-admin need arises (this decision does not block that).
- **GitHub App installation tokens for curated repos** — would require the _owner of each
  curated repository_ to install our App, which is not realistic for scraping arbitrary
  third-party open-source projects; installation-token methods remain reserved for cases where
  our own users install the App on their own repositories (a future decision).

## Consequences

- A new required setup step for every environment: generate a fine-grained PAT with public-repo
  read access (`docs/development/github-service-token.md`) and set `GITHUB_SERVICE_TOKEN`.
  Because `webEnvSchema` validates all web env vars together, **omitting it breaks every page**,
  not just `/admin` — this is a deliberate fail-fast (GUIDLINE.md §5), but is a real disruption
  to any environment upgrading from before this change.
- Admin capability is entirely env-controlled; granting or revoking it means editing
  `ADMIN_GITHUB_USERNAMES` and restarting the process — acceptable for a single-owner project,
  revisit if multiple trusted admins with independent lifecycles are needed.

## Date

2026-07-11
