# 0014 — Recommendation feedback, persisted at feedback time

## Status

Accepted

## Context

Milestone M1 adds the six
feedback buttons (Good match / Too difficult / Too easy / Not interested /
Wrong technology / Issue unavailable) to recommendations. ADR-0012
deliberately deferred persistence: recommendations are computed live on
every page load and nothing was stored, so there was nothing for feedback
to reference. Feedback now forces the question of what to persist and when.

Two facts constrain the design:

1. **Issue rows are not stable.** Issue sync replaces a repository's rows
   (delete + reinsert, ADR-0011), so `issues.id` UUIDs change on every
   sync. A foreign key from feedback to `issues` would silently cascade
   away user feedback whenever an admin clicks "Sync issues".
2. **Client input cannot be trusted.** A browser could submit fabricated
   scores or reasons; only the verdict and the issue identity are the
   user's to assert.

## Decision

- **Persist at feedback time, not at render time.** Live computation
  stays exactly as in ADR-0012. When a user submits feedback, the server
  persists a `recommendations` row (upserted on `(user_id,
github_issue_id)`) and a `recommendation_feedback` row (one per
  recommendation). Later milestones ("start contribution", M5) will
  persist through the same table.
- **A rating is changeable (owner decision, 2026-07-11).** A verdict is not
  final: the upsert on `(user_id, github_issue_id)` overwrites the previous
  verdict, so a user who first marks an issue "Too difficult" can revise it
  later. The UI loads the existing verdict, pre-selects it, and leaves every
  button clickable so changing a rating is one click. Changing a verdict
  re-runs the negative-feedback filter, so switching a negative verdict back
  to "Good match" makes the issue eligible again (and vice versa).
- **Key on `github_issue_id` and snapshot display fields.** The
  `recommendations` row stores the stable GitHub issue id (no FK to
  `issues`) plus a snapshot of repository full name, issue title, and
  issue URL, so feedback stays meaningful after the issue leaves the
  catalogue.
- **The server recomputes the score; the client sends only
  `{githubIssueId, verdict}`.** The engine is deterministic, so ranking
  the single issue against the user's current profile reproduces what the
  card showed. If the issue is now excluded or unscorable, `match_score`
  is stored as `null` — honest data, and exactly what "Issue unavailable"
  describes. If the issue no longer exists in the database at all, the
  action reports that instead of persisting an empty snapshot.
- **Negative feedback hides the issue for that user.** Every verdict
  except `good_match` removes that issue from the user's future
  recommendation candidates (filtered before ranking). Feedback buttons
  that visibly do nothing would train users to ignore them.
- **Feedback is per-user input, never an engine signal (yet).** Scores
  still come only from `@issuefit/recommendation-engine` (ADR-0004).
  Aggregated feedback is shown to admins on `/admin/feedback` to judge
  recommendation quality; feeding it back into scoring would need its own
  ADR.

## Alternatives considered

- **Persist every recommendation at render time** — creates rows on every
  page load with no user intent behind them, and still needs the same
  upsert logic; rejected as noise.
- **FK to `issues` with cascade** — simplest schema, but a re-sync would
  delete feedback (fact 1 above).
- **Trust client-supplied score/reasons** — cheaper than recomputing, but
  lets a tampered client pollute admin aggregates.
- **Make issue sync upsert instead of replace** — would stabilise issue
  UUIDs, but rewrites a verified pipeline for the sake of a foreign key;
  worth revisiting only if something else needs stable issue rows.

## Consequences

- New tables `recommendations` and `recommendation_feedback` with their
  generated migration; `match_score` is nullable by design.
- `getRecommendationsForUser` now also loads the user's
  negatively-rated GitHub issue ids and filters candidates before ranking.
- Admins get a read-only `/admin/feedback` page: verdict totals plus the
  individual feedback rows with their snapshots.
- A user's changed verdict overwrites the previous one — history of
  verdict changes is deliberately not kept in the MVP.

## Date

2026-07-11
