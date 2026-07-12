# 0006 — Single GitHub App with least-privilege permissions

## Status

Accepted

## Context

The guidelines mandate a GitHub App (never user-supplied personal access tokens) with
least-privilege, read-only permissions (GUIDLINE.md §8). The platform needs GitHub for two
things: signing users in, and — in later milestones — reading public activity, repositories,
and issues, plus receiving webhooks.

## Decision

Operate **one GitHub App** as the only GitHub credential:

- **Sign-in** uses the App's OAuth (user authorization) flow with the `user:email` scope —
  handled by better-auth (ADR-0005).
- **Initial account permissions**: Email addresses → Read-only. Nothing else.
- **No repository permissions yet.** They are added only when the feature that needs them
  lands (issue synchronisation will need read-only Contents/Issues/Metadata), which GitHub
  handles via permission-update approval from installers.
- **Webhooks stay disabled** until the contribution-tracking milestone implements signature
  verification and idempotent processing.
- Installation tokens and the App private key never reach the browser; the private key is not
  even configured until installation-based features exist.

Setup steps for maintainers and self-hosters are documented in
[docs/development/github-app.md](../development/github-app.md).

## Alternatives considered

- **Separate OAuth App for sign-in + GitHub App for data** — two credentials to configure,
  rotate, and document, with no benefit: a GitHub App's OAuth flow covers sign-in fully.
- **Requesting all needed permissions upfront** — fewer re-approval prompts later, but
  violates least-privilege and makes the first sign-in consent screen needlessly scary.

## Consequences

- Users approve a minimal, read-only consent screen at sign-in.
- Each future permission addition is an explicit, reviewable change (App settings + ADR
  update + installer re-approval) instead of a silent broad grant.
- Self-hosters create their own GitHub App with the same recipe; nothing is tied to our App
  registration.

## Date

2026-07-11
