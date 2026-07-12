# Creating the GitHub App

IssueFit signs users in through a GitHub App's OAuth flow (see
[ADR-0006](../decisions/0006-github-app-permissions.md)). Every deployment — including local
development — needs its own GitHub App. Creating one takes about two minutes.

## Steps

1. Open <https://github.com/settings/apps> (for a personal account) or your organisation's
   _Settings → Developer settings → GitHub Apps_, and click **New GitHub App**.

2. Fill in the basics:

   | Field                                                  | Value for local development                          |
   | ------------------------------------------------------ | ---------------------------------------------------- |
   | GitHub App name                                        | Anything unique, e.g. `issuefit-dev-<your-username>` |
   | Homepage URL                                           | `http://localhost:3000`                              |
   | Callback URL                                           | `http://localhost:3000/api/auth/callback/github`     |
   | Expire user authorization tokens                       | Leave enabled (default)                              |
   | Request user authorization (OAuth) during installation | Leave unchecked                                      |
   | Webhook → Active                                       | **Uncheck** (no webhooks yet)                        |

3. Set permissions — only one is needed today:

   - _Permissions and events → Account permissions → Email addresses_: **Read-only**.
   - Leave every repository and organisation permission on _No access_.

4. Under _Where can this GitHub App be installed?_ choose **Any account**.

5. Click **Create GitHub App**, then on the app's settings page:

   - Copy the **Client ID**.
   - Click **Generate a new client secret** and copy it immediately.
   - (You do _not_ need a private key yet; that comes with installation-based features.)

6. Put the credentials in the `.env` file at the repository root:

   ```bash
   GITHUB_CLIENT_ID=<your client id>
   GITHUB_CLIENT_SECRET=<your client secret>
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)   # if not already set
   ```

7. Restart `pnpm dev` and open <http://localhost:3000/signin> — "Continue with GitHub" should
   complete a full sign-in and land on the dashboard.

## Production

Create a second GitHub App for production with the same recipe, replacing `localhost:3000`
with the deployed origin in the homepage and callback URLs, and set `BETTER_AUTH_URL` to that
origin.

## Troubleshooting

- **Redirected back with `?error=oauth`** — callback URL mismatch. It must be exactly
  `<BETTER_AUTH_URL>/api/auth/callback/github`.
- **`EnvValidationError` on first request** — one of the four auth variables is missing or
  too short; the error names the variable.
- **Email shows as `<id>+<login>@users.noreply.github.com`** — the GitHub account hides its
  email and the Email addresses permission was not granted; this fallback is expected
  behaviour otherwise.
