# Creating the GitHub service token

Curated repositories belong to other people — `facebook/react`,
`microsoft/vscode`, and so on — so they can't be read with a signed-in user's own OAuth token
(ADR-0009). The platform uses a separate, read-only service token for this. It takes about a
minute to create.

> **This is required, not optional.** `GITHUB_SERVICE_TOKEN` is validated alongside every other
> web environment variable — if it's missing, **the entire app fails to start**, not just the
> admin pages. If you're adding this to an existing local setup, do this before restarting
> `pnpm dev`.

## Steps

1. Sign in to GitHub as whichever account should own the token (your personal account is fine
   for local development).
2. Open **Settings → Developer settings → Personal access tokens → Fine-grained tokens →
   Generate new token**.
3. Fill in:

   | Field             | Value                                                                                                  |
   | ----------------- | ------------------------------------------------------------------------------------------------------ |
   | Token name        | `issuefit-service-token` (or similar)                                                                  |
   | Expiration        | Whatever your organisation's policy allows (90 days is a reasonable default; rotate before it expires) |
   | Repository access | **Public Repositories (read-only)** — do **not** grant access to any private repositories              |

4. The only permission the platform's two curated-repository calls need is **Metadata: Read**,
   per GitHub's own [REST API permissions reference](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
   — both `GET /repos/{owner}/{repo}` and the community-profile endpoint (used to detect a
   CONTRIBUTING guide) require only `metadata: read`. With **Repository access** set to
   **Public Repositories (read-only)** from step 3, GitHub may skip straight to token
   generation without showing a permissions panel at all — that's fine, this mode already
   covers public metadata reads. If a **Repository permissions** section _does_ appear
   (for example if you chose "All repositories" or "Only select repositories" instead), set
   **Metadata** to **Read-only** there and leave everything else at **No access**.
5. Click **Generate token** and copy it immediately.
6. Put it in `.env` at the repository root:

   ```bash
   GITHUB_SERVICE_TOKEN=<your token>

   # Your GitHub username, so you can access /admin pages locally.
   ADMIN_GITHUB_USERNAMES=<your-github-username>
   ```

7. Restart `pnpm dev`. Sign in, open `/admin/repositories`, and try adding a repository (e.g.
   `facebook/react`) — it should fetch, score, and appear in the list.

## Production

Generate a separate token for production with the same recipe, and set `ADMIN_GITHUB_USERNAMES`
to whichever real GitHub accounts should have admin access in that environment.

## Troubleshooting

- **`EnvValidationError` mentioning `GITHUB_SERVICE_TOKEN` on every page, not just admin** —
  expected; see the note above. Add the token and restart.
- **Signed in but `/admin/repositories` redirects to `/dashboard`** — your GitHub username isn't
  in `ADMIN_GITHUB_USERNAMES`, or you haven't restarted the server since adding it.
- **"Repository not found" when adding a real repository** — check the owner/name spelling; a
  pasted `https://github.com/owner/name` URL is also accepted. If the spelling is correct, the
  token may be missing the **Metadata: Read-only** permission (step 4) — GitHub returns 404 for
  under-permissioned requests to some endpoints, not 403.
- **Rate-limit errors when refreshing many repositories** — the service token gets 5,000
  requests/hour; "Refresh all" makes two requests per repository, so a large catalog refreshed
  too often can exhaust it. Space out bulk refreshes if this happens.
