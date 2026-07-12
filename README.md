<p align="center">
  <img src="docs/assets/issuefit-logo.png" alt="IssueFit" width="480" />
</p>

<p align="center"><strong>Find open-source issues that fit you.</strong></p>

IssueFit is an open-source platform that matches developers with open-source issues that fit
their skills, interests, and career goals. It connects to GitHub, builds an editable skill
profile from a developer's public activity, recommends suitable issues with a transparent match
score, reads maintainer-declared contribution rules from an open manifest file, tracks the
contribution to a merged pull request, and turns completed work into a verified portfolio entry.

## Project status

**Pre-alpha, private-beta hardening.** GitHub sign-in, GitHub data sync, an editable skill
profile, curated repositories with synced issues, live deterministic recommendations,
recommendation feedback, deterministic issue briefings, contribution tracking, portfolio/public
profile pages, project directory/rankings, weekly digest worker plumbing, and admin analytics are
in place. The private beta still needs operator setup. See the [roadmap](#roadmap) below for what
exists and what is next.

## Architecture summary

IssueFit is a pnpm workspace monorepo:

| Workspace                        | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `apps/web`                       | Next.js application: public pages and the developer dashboard.         |
| `apps/worker`                    | Background worker for scheduled synchronisation and recommendations.   |
| `packages/config`                | Environment variable schemas and validation (Zod).                     |
| `packages/contribution-manifest` | Open Contribution Manifest v0 schema and validation.                   |
| `packages/database`              | PostgreSQL schema, migrations (Drizzle), and client factory.           |
| `packages/recommendations`       | Shared recommendation application service for web and worker runtimes. |
| `packages/recommendation-engine` | Deterministic issue scoring, exclusion rules, and match explanations.  |
| `packages/github`                | GitHub API access behind a `GitHubClient` interface.                   |
| `packages/skills`                | Deterministic skill inference and career-goal validation schemas.      |
| `packages/repository-health`     | Deterministic repository health scoring for curated repositories.      |
| `packages/issue-health`          | Deterministic issue difficulty and clarity scoring.                    |

The codebase follows layered boundaries: presentation (React/Next.js) → application services →
domain logic → infrastructure (PostgreSQL, GitHub). Domain logic never depends on Next.js, React,
or HTTP. Read the full picture in
[docs/architecture/overview.md](docs/architecture/overview.md) and the decision records in
[docs/decisions/](docs/decisions/).

## Local setup

Prerequisites:

- Node.js 22 or newer (`.nvmrc` provided)
- pnpm 11 (`corepack enable` or `npm install -g pnpm`)
- Docker (for the local PostgreSQL database)

```bash
git clone https://github.com/CrowPus/IssueFit.git
cd IssueFit
pnpm install
cp .env.example .env
docker compose up -d          # starts PostgreSQL on localhost:5432
pnpm db:migrate               # applies database migrations
pnpm build                    # builds packages and apps
pnpm dev                      # starts web (localhost:3000) and worker in watch mode
```

A more detailed walkthrough, including troubleshooting, is in
[docs/development/setup.md](docs/development/setup.md).

## Environment variables

Copy `.env.example` to `.env`. All variables are validated at startup by `@issuefit/config`;
a misconfigured process fails immediately with a message naming each invalid variable.

| Variable                       | Required by       | Description                                                                                                                              |
| ------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | web, worker, db   | PostgreSQL connection string. Defaults in `.env.example` match `docker-compose.yml`.                                                     |
| `LOG_LEVEL`                    | worker (optional) | `fatal` \| `error` \| `warn` \| `info` (default) \| `debug` \| `trace`                                                                   |
| `WEEKLY_DIGEST_ENABLED`        | worker (optional) | Enables the weekly recommendation digest scheduler; defaults to `false`.                                                                 |
| `WEEKLY_DIGEST_INTERVAL_HOURS` | worker (optional) | Digest scheduler interval; defaults to `168`.                                                                                            |
| `WEEKLY_DIGEST_RUN_ON_START`   | worker (optional) | Runs one digest pass on worker startup; useful for smoke tests.                                                                          |
| `EMAIL_DELIVERY_MODE`          | worker (optional) | `log` (default, metadata only) or `webhook`.                                                                                             |
| `EMAIL_FROM`                   | worker (optional) | Sender string included in digest webhook payloads.                                                                                       |
| `EMAIL_WEBHOOK_URL`            | worker            | Required only when `EMAIL_DELIVERY_MODE=webhook`.                                                                                        |
| `BETTER_AUTH_SECRET`           | web               | Session signing secret; generate with `openssl rand -base64 32`.                                                                         |
| `BETTER_AUTH_URL`              | web (optional)    | Public origin of the web app; defaults to `http://localhost:3000`.                                                                       |
| `GITHUB_CLIENT_ID`             | web               | GitHub App OAuth client id — see [docs/development/github-app.md](docs/development/github-app.md).                                       |
| `GITHUB_CLIENT_SECRET`         | web               | GitHub App OAuth client secret.                                                                                                          |
| `GITHUB_SERVICE_TOKEN`         | web               | Read-only token for curated-repository reads — see [docs/development/github-service-token.md](docs/development/github-service-token.md). |
| `ADMIN_GITHUB_USERNAMES`       | web (optional)    | Comma-separated GitHub usernames allowed to access `/admin` pages.                                                                       |

## Database migrations

Migrations live in `packages/database/drizzle/` and are generated by Drizzle Kit from the
schema in `packages/database/src/schema/`.

```bash
pnpm db:generate   # generate a migration after changing the schema
pnpm db:migrate    # apply pending migrations to DATABASE_URL
```

Every schema change must be committed together with its generated migration; CI applies all
migrations to a clean database and fails if the schema and migrations are out of sync.

## Development commands

| Command          | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `pnpm dev`       | Run all apps and packages in watch mode                        |
| `pnpm build`     | Build all workspaces (topological order)                       |
| `pnpm lint`      | ESLint over the whole repository                               |
| `pnpm format`    | Format with Prettier (`format:check` to verify)                |
| `pnpm typecheck` | TypeScript checks for every workspace (run `pnpm build` first) |
| `pnpm test`      | Unit tests (Vitest)                                            |
| `pnpm test:e2e`  | End-to-end tests (Playwright)                                  |

## Testing

- **Unit tests** (Vitest) live next to the code they test (`*.test.ts`). Run with `pnpm test`.
- **End-to-end tests** (Playwright) live in `tests/e2e/`. Run with `pnpm test:e2e`; locally
  this starts the web dev server automatically. First run: `pnpm exec playwright install chromium`.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the development
workflow, branch and commit conventions, and review expectations. All participants are expected
to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md)
for how to report them privately.

## Roadmap

1. **Foundation** — monorepo, tooling, CI, database setup _(done)_
2. **GitHub connection** — GitHub App, OAuth sign-in, installation sync
3. **Skill profile** — analysis of public GitHub activity, editable profile, career goals
4. **Issue engine** — curated repositories, issue synchronisation, health scoring _(done)_
5. **Recommendations** — deterministic weighted scoring with transparent explanations _(done)_
6. **Briefing & tracking** — deterministic issue briefings, manual contribution tracking
7. **Portfolio & beta** — verified portfolio entries, weekly recommendations, private beta

## Known limitations

- The weekly digest worker has log/webhook delivery adapters, but no built-in SMTP or vendor
  email provider. Configure `EMAIL_DELIVERY_MODE=webhook` or keep the default metadata-only log
  mode; see [docs/development/self-hosting.md](docs/development/self-hosting.md).
- No AI anywhere by design — the platform is fully deterministic and depends on no AI provider.
- Skill inference only recognises languages GitHub's per-repository language field reports;
  frameworks, tools, and practices (Testing, Documentation, Docker-as-a-practice) must be
  added manually. Manually added skill names are matched case-sensitively (no dedupe against
  differently-cased existing skills yet).
- Curated repositories and their issues sync with activity/difficulty/clarity health scoring.
  `hasActivePullRequest` is measured from each issue's timeline cross-references, and
  maintainer responsiveness (score, median first-response time, response rate) is measured by
  sampling first responses during issue sync — null always means "not yet measured", never a
  substituted neutral value (see
  [ADR-0015](docs/decisions/0015-real-responsiveness-and-pr-detection.md)).
  `allowsExternalContributors` falls back to admin curation when no valid manifest exists
  ([ADR-0011](docs/decisions/0011-issue-sync-and-health-scoring.md)); a valid contribution
  manifest overrides that fallback immediately.
- An issue's only technology signal is its repository's dominant language (no label/description
  parsing); career-goal technologies come from a small static mapping, not measured data;
  "estimated effort" is not shown anywhere, since nothing in the pipeline produces one — see
  [ADR-0012](docs/decisions/0012-wiring-the-recommendation-engine.md) for all of these and why.
- Recommendations are computed live on every page load; a recommendation is persisted only at
  feedback time, keyed on the stable GitHub issue id with a snapshot of what was shown (see
  [ADR-0014](docs/decisions/0014-recommendation-feedback-persisted-at-feedback-time.md)).
  Negative feedback ("Too difficult", "Not interested", …) hides that issue from that user's
  future recommendations; admins see verdict totals on `/admin/feedback`.
- Curated repository refresh reads `.github/contribution-manifest.yml` when present. A valid
  manifest can opt a repository out, filter recommended issue types/difficulties, add a
  maintainer-approved badge, and provide bounded score boosts. Invalid manifests are surfaced on
  `/admin/repositories` with validation errors instead of being silently ignored. See the
  [spec](docs/spec/contribution-manifest.md) and
  [ADR-0016](docs/decisions/0016-contribution-manifest-v0.md).

## License

IssueFit is licensed under the [Apache License 2.0](LICENSE) (see
[ADR-0013](docs/decisions/0013-apache-2.0-relicense.md) for why the project moved from
AGPL-3.0). The IssueFit name and logo will be protected by a separate trademark policy.
