# Development Setup

A detailed walkthrough for getting IssueFit running locally.

## Prerequisites

| Tool    | Version    | Notes                                                  |
| ------- | ---------- | ------------------------------------------------------ |
| Node.js | >= 22      | `.nvmrc` pins 22; `nvm use` picks it up                |
| pnpm    | 11         | `corepack enable` uses the version from `package.json` |
| Docker  | any recent | Only needed for the local PostgreSQL                   |

## Steps

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure the environment**

   ```bash
   cp .env.example .env
   ```

   The defaults match the Docker Compose database; nothing needs editing for local work.

3. **Start PostgreSQL**

   ```bash
   docker compose up -d
   ```

   Wait for the health check: `docker compose ps` should show `postgres` as `healthy`.

4. **Apply migrations**

   ```bash
   pnpm db:migrate
   ```

5. **Build once, then develop**

   ```bash
   pnpm build
   pnpm dev
   ```

   - Web app: http://localhost:3000
   - Worker: logs structured JSON to stdout
   - The initial `pnpm build` creates the type declarations of internal packages that the
     apps import; the `dev` watchers keep them up to date afterwards.

## Running tests

```bash
pnpm test                                  # unit tests (Vitest)
pnpm exec playwright install chromium      # once, downloads the browser
pnpm test:e2e                              # end-to-end tests (Playwright)
```

`pnpm test:e2e` starts the web dev server automatically if nothing is listening on port 3000.

## Changing the database schema

1. Edit the schema in `packages/database/src/schema/`.
2. Generate a migration: `pnpm db:generate`.
3. Apply it locally: `pnpm db:migrate`.
4. Commit the schema change **and** the generated files in `packages/database/drizzle/`
   together. CI fails if they drift apart.

## Troubleshooting

- **`DATABASE_URL is not set`** — copy `.env.example` to `.env` at the repository root.
- **Port 5432 already in use** — stop any local PostgreSQL, or change the host port in
  `docker-compose.yml` and `DATABASE_URL` together.
- **`pnpm typecheck` fails with missing module `@issuefit/config`** — run `pnpm build` first;
  apps resolve internal packages through their built declarations.
- **Playwright cannot find a browser** — run `pnpm exec playwright install chromium`.
