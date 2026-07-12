# @issuefit/github

GitHub API access behind a `GitHubClient` interface, so business logic never depends on
Octokit directly (GUIDLINE.md §8). See
[ADR-0007](../../docs/decisions/0007-github-client-user-token-reads.md) for the design
rationale, including why this client currently reads with the signed-in user's own OAuth
token rather than a GitHub App installation token.

## Usage

```typescript
import { createGitHubClient, GitHubApiError } from "@issuefit/github";

const client = createGitHubClient();

try {
  const profile = await client.getAuthenticatedProfile(accessToken);
  const repositories = await client.listPublicRepositories(accessToken);
} catch (error) {
  if (error instanceof GitHubApiError) {
    // error.category is one of: authentication | authorization | rate_limit
    // | temporary_provider | permanent_provider | internal
  }
}
```

`listPublicRepositories` paginates correctly and stops at a documented cap of 300
repositories per call (see the constant in `octokit-client.ts`).

## Testing

`createGitHubClient({ fetch })` accepts a fetch override, used in tests to fake GitHub's API
without any network access — see `octokit-client.test.ts` for the pattern (including a real
multi-page pagination test).
