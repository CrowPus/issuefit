# 0019 — Portfolio entries and opt-in public profile

## Status

Accepted

## Context

M6 turns a merged contribution into a
verified portfolio entry a developer can share, and adds an opt-in public
developer profile plus the public content pages (how-it-works, privacy,
terms). Everything must stay deterministic and AI-neutral: entries are
generated from structured data already stored by M5, never written by an AI.

Two facts constrain the design:

- Issue sync only fetches **open** issues, so by the time a contribution is
  `merged` its issue is usually gone from the catalogue. Any data derived from
  the issue (notably the skills it exercised) must be captured earlier, while
  the issue is still synced.
- The recommendation snapshot (ADR-0014) already stores the project, issue
  title, issue URL, and score; the contribution (ADR-0018) stores the PR URL
  and the started/completed dates. A portfolio entry needs little beyond
  these plus the demonstrated skills.

## Decision

- **Capture demonstrated skills at contribution start, not at merge.**
  `contributions` gains `skills_demonstrated text[]`, populated when the
  contribution starts as the intersection of the user's confirmed profile
  skills and the issue's technologies, matched with the engine's
  `technologyKey` normalisation (now exported from
  `@issuefit/recommendation-engine`) so it agrees with scoring. This is a
  documented approximation of "the issue's required skills ∩ the user's
  profile": the only per-issue technology signal is the repository's dominant
  language (ADR-0012), and the profile is the one at start time.
- **Generate the portfolio entry automatically on merge.** When a
  contribution's status becomes `merged`, the same transaction inserts a
  `portfolio_entries` row (idempotent, `onConflictDoNothing` on
  `contribution_id`) from structured data: title defaults to the issue title,
  demonstrated skills are copied from the contribution, summary starts empty.
  No AI writes the summary; the developer edits it if they want one.
- `portfolio_entries`: one row per contribution (`contribution_id`, unique),
  `title`, `summary` (nullable), `skills_demonstrated text[]`, `review_rounds`
  (nullable integer — the MVP keeps no status history, so this is
  developer-entered, never derived), `is_public` (default false), timestamps.
- **Opt-in is two-level.** The public profile page at `/u/[username]` is shown
  only when the user's existing `profile_visibility` is `public` **and** lists
  only entries with `is_public = true`. A visitor to a private profile, or one
  with no public entries, sees a neutral "no public portfolio" page — the same
  response whether or not the username exists, so the page discloses nothing
  beyond what GitHub already makes public.
- Editing a portfolio entry (title, summary, demonstrated skills, review
  rounds, visibility) and the profile-visibility toggle are ownership-scoped
  server actions; the public page is read-only and unauthenticated.
- **Fix stale public copy.** The landing page still advertised an "AI issue
  briefing" and an `AGPL-3.0` licence; both contradict settled decisions
  (AI-neutral by design, ADR-0013 Apache-2.0). Corrected here alongside
  the new public pages.

## Consequences

- The developer loop is complete: recommend → brief → contribute → **portfolio**.
- Portfolio entries survive the issue leaving the catalogue because everything
  they need is captured by merge time.
- `review_rounds` is honest but manual until webhooks (a later slice) can count
  review cycles from PR events.
- Demonstrated skills reflect the profile at start; a later profile change does
  not rewrite history. Editing the entry lets the developer correct it.
- Public exposure is strictly opt-in at both the profile and entry level, and
  the public page leaks no private data or username existence.
