# Self-Hosting IssueFit

This guide covers a small private-beta deployment. IssueFit stays
provider-light: PostgreSQL, the Next.js web app, the worker, GitHub OAuth,
and an optional email webhook.

## Runtime Services

Run these processes:

| Service    | Command                                    | Notes                                        |
| ---------- | ------------------------------------------ | -------------------------------------------- |
| PostgreSQL | managed Postgres or `docker compose up -d` | Use regular backups.                         |
| Web        | `pnpm --filter @issuefit/web start`        | Build first with `pnpm build`.               |
| Worker     | `pnpm --filter @issuefit/worker start`     | Runs heartbeat and weekly digest scheduling. |

For local development, `pnpm dev` starts the web app, worker, and package
watchers together. For production, run web and worker as separate processes
so either can restart independently.

## Required Configuration

Copy `.env.example` and set production values:

| Variable                       | Used by                 | Required    | Notes                                                      |
| ------------------------------ | ----------------------- | ----------- | ---------------------------------------------------------- |
| `DATABASE_URL`                 | web, worker, migrations | yes         | PostgreSQL connection string.                              |
| `BETTER_AUTH_SECRET`           | web                     | yes         | Generate with `openssl rand -base64 32`.                   |
| `BETTER_AUTH_URL`              | web                     | yes         | Public origin, for example `https://issuefit.example.com`. |
| `GITHUB_CLIENT_ID`             | web                     | yes         | GitHub App OAuth client id.                                |
| `GITHUB_CLIENT_SECRET`         | web                     | yes         | GitHub App OAuth secret.                                   |
| `GITHUB_SERVICE_TOKEN`         | web                     | yes         | Read-only token for curated public repository reads.       |
| `ADMIN_GITHUB_USERNAMES`       | web                     | recommended | Comma-separated admin GitHub usernames.                    |
| `LOG_LEVEL`                    | worker                  | no          | Defaults to `info`.                                        |
| `WEEKLY_DIGEST_ENABLED`        | worker                  | no          | Set `true` to run weekly digest scheduling.                |
| `WEEKLY_DIGEST_INTERVAL_HOURS` | worker                  | no          | Defaults to `168`.                                         |
| `WEEKLY_DIGEST_RUN_ON_START`   | worker                  | no          | Use `true` for a one-time startup smoke test.              |
| `EMAIL_DELIVERY_MODE`          | worker                  | no          | `log` (default) or `webhook`.                              |
| `EMAIL_FROM`                   | worker                  | no          | Sender string included in webhook payloads.                |
| `EMAIL_WEBHOOK_URL`            | worker                  | if webhook  | HTTPS endpoint that sends email.                           |

Do not expose `.env` in client bundles, logs, screenshots, or bug reports.

## Database Setup

Apply migrations before starting the app:

```bash
pnpm db:migrate
```

After schema edits, generate and review migrations locally:

```bash
pnpm db:generate
pnpm --filter @issuefit/database db:check
```

## Weekly Digest Email

M7 ships two delivery modes:

- `EMAIL_DELIVERY_MODE=log`: logs `event`, recipient email, and subject.
  It does not log rendered message bodies and does not send email.
- `EMAIL_DELIVERY_MODE=webhook`: POSTs JSON to `EMAIL_WEBHOOK_URL`:

```json
{
  "from": "IssueFit <noreply@example.com>",
  "to": "developer@example.com",
  "toName": "Developer Name",
  "subject": "Your IssueFit weekly recommendations (2026-07-06)",
  "text": "...",
  "html": "..."
}
```

The webhook should return a 2xx status only after accepting the message.
IssueFit records a `sent`, `skipped`, or `failed` delivery row per user per
UTC week. Failed rows can be retried by the next worker run; sent/skipped
rows are treated as complete for that period.

Users opt in from `/profile`. The worker never emails users whose
`weekly_digest_email_enabled` flag is false.

## Operational Checks

Before opening a private beta:

```bash
pnpm format:check
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

In production logs, check for:

- `worker.started`
- `worker.heartbeat`
- `weekly_digest.started`
- `weekly_digest.completed`

Admin users can review `/admin/analytics` for the beta funnel and
`/admin/repositories` for catalog readiness.
