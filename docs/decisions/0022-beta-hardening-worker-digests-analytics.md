# 0022 — Beta hardening: weekly digest worker, provider-neutral email, analytics

## Status

Accepted

## Context

M7 turns the worker from a heartbeat process into an operational beta
component. The milestone needs weekly recommendation refreshes, opt-in
email digests, admin analytics, and a self-hosting guide without adding an
AI provider or coupling the project to a specific email vendor.

Recommendations are still computed live by deterministic domain code
(ADR-0012). The weekly digest should reuse that service, not create a
second ranking path.

## Decision

- Move reusable recommendation application logic into
  `@issuefit/recommendations`. `apps/web` remains a thin Next.js wrapper
  around `getDb()`, while `apps/worker` can call the same mapper/filter/
  ranker against an injected database.
- Add an explicit user opt-in flag:
  `users.weekly_digest_email_enabled`, controlled from `/profile`.
- Add `recommendation_digest_deliveries` as an idempotency ledger. The
  unique key is `(user_id, period_started_at)`; `sent` and `skipped`
  complete a weekly period, while `failed` may be retried by a later run.
- Define weekly periods as UTC Monday 00:00 through the next Monday
  00:00. The digest contains the current top recommendations at run time;
  it is not a historical replay.
- Keep email delivery provider-neutral for M7:
  - `EMAIL_DELIVERY_MODE=log` is the default and logs delivery metadata,
    never message bodies.
  - `EMAIL_DELIVERY_MODE=webhook` posts the rendered message to a configured
    HTTPS endpoint. SMTP/vendor SDKs can be added later behind the same
    `EmailDelivery` interface.
- Add `/admin/analytics` as a persisted-data beta funnel: signed-up users,
  onboarding-complete users, persisted recommendations, useful feedback,
  selected/working/PR/merged contribution stages, public portfolio entries,
  and maintainer-approved repositories.
- Document self-hosting in `docs/development/self-hosting.md`, including
  required env vars, migrations, worker settings, and operational checks.

## Alternatives considered

- **Vendor-specific email integration now.** Rejected for M7: the product
  needs opt-in, idempotency, and a delivery abstraction first. A provider
  choice can be made when a real deployment chooses its transactional email
  service.
- **Persist weekly recommendation snapshots for every opted-in user.**
  Rejected: live recommendation computation is cheap and deterministic;
  persisting every weekly ranked list would add storage and retention
  questions before the beta needs them.
- **Cron-only scheduling outside the worker.** Rejected: self-hosters can
  still use process managers, but IssueFit should have one documented,
  runnable worker entrypoint for the first beta.
- **Counting analytics from event tracking.** Rejected for M7: existing
  persisted product tables already express the funnel stages. Event
  analytics can come later if the beta shows a need.

## Consequences

- Migration 0014 adds the digest opt-in column, delivery status enum, and
  delivery ledger table.
- Running the worker now requires `DATABASE_URL`; weekly digests remain
  disabled unless `WEEKLY_DIGEST_ENABLED=true`.
- The default local email path is non-invasive: it proves scheduling and
  idempotency without sending real email.
- A real email webhook must be operated outside IssueFit and should handle
  its own provider authentication, retries, and suppression lists.
- Admin analytics are directional beta metrics, not a warehouse. They count
  current persisted state.

## Date

2026-07-12
