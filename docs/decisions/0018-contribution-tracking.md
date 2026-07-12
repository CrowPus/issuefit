# 0018 — Contribution tracking (manual-first)

## Status

Accepted

## Context

M5 closes the developer loop: after a
briefing, a developer starts a contribution and tracks it through to a merged
(or closed/abandoned) outcome. The plan is explicit that manual status updates
and a PR-URL field ship first, and GitHub webhook automation upgrades it
afterwards where the App is installed. Starting a contribution is also "the
second moment a recommendation is persisted", reusing ADR-0014's snapshot
pattern.

The status vocabulary is fixed by the plan:
`Selected → Preparing → Working → PR opened → Changes requested →
Merged / Closed / Abandoned`.

## Decision

- Add a `contributions` table, one row per started contribution, linked to a
  persisted `recommendations` row (`recommendation_id`, unique) exactly as
  `recommendation_feedback` is — so a contribution carries the same stable
  snapshot (repository name, issue title, URL, score) keyed on the stable
  GitHub issue id. Starting a contribution upserts the `recommendations` row
  through the same shared snapshot path as feedback (ADR-0014); the two can
  coexist for one issue.
- Statuses are a `contribution_status` enum in the plan's order:
  `selected`, `preparing`, `working`, `pr_opened`, `changes_requested`,
  `merged`, `closed`, `abandoned`. New contributions start at `selected`.
  `merged`, `closed`, and `abandoned` are terminal: reaching one stamps
  `completed_at`; leaving one clears it.
- **Manual-first, no transition graph.** The MVP lets the developer set any
  status from the list and edit a PR URL and branch name; it does not enforce
  a state machine. Webhooks (a later slice) will drive automatic transitions
  where the App is installed. Keeping the manual model free-form avoids
  inventing rules the webhook design might contradict.
- Starting a contribution is idempotent: a second "Start" on an issue that
  already has one leaves the existing status untouched (insert
  `onConflictDoNothing` on `recommendation_id`).
- Ownership is enforced on every write: status/detail updates target the
  contribution whose recommendation belongs to the acting user, via a
  subquery on `(user_id, github_issue_id)`, never a client-supplied
  contribution id.
- The PR URL is validated as an `https://github.com/…/pull/…` URL when
  present; blank clears it. No other field is required to move between
  statuses in the MVP.
- The pre-flight checklist from M4 (ADR-0017) stays client-local; this
  milestone does not persist it. Contribution tracking is where checklist
  persistence would live if it is ever wanted, but nothing needs it yet.

## Consequences

- The developer loop is now end-to-end without any external service: sign in,
  get recommendations, read a briefing, start a contribution, and track it to
  a verified-later outcome.
- Because statuses are free-form, the UI can show the whole vocabulary as a
  simple control; the eventual webhook slice adds automation without a data
  migration (the same enum and columns).
- Portfolio entries (M6) can be generated from `merged` contributions using
  the snapshot already stored here plus the issue's skills — no new join to
  the volatile `issues` table.
- A future need for status history (an audit trail of transitions) would be a
  new table and its own ADR; the MVP intentionally keeps only the current
  status, mirroring feedback's "no verdict history" choice.
