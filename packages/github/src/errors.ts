/** Error categories from GUIDLINE.md §13, scoped to what this client can raise. */
export type GitHubErrorCategory =
  | "authentication"
  | "authorization"
  | "rate_limit"
  | "temporary_provider"
  | "permanent_provider"
  | "internal";

export class GitHubApiError extends Error {
  readonly category: GitHubErrorCategory;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    category: GitHubErrorCategory,
    options?: { cause?: unknown; retryAfterSeconds?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = "GitHubApiError";
    this.category = category;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

interface OctokitLikeError {
  status: number;
  message?: string;
  response?: { headers?: Record<string, string | undefined> };
}

function isOctokitLikeError(error: unknown): error is OctokitLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

function parseRetryAfterSeconds(
  headers: Record<string, string | undefined> | undefined,
): number | undefined {
  const header = headers?.["retry-after"];
  if (header === undefined) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function withRetryAfter(
  retryAfterSeconds: number | undefined,
): { retryAfterSeconds: number } | object {
  return retryAfterSeconds === undefined ? {} : { retryAfterSeconds };
}

/**
 * Wraps whatever Octokit throws into a {@link GitHubApiError} so callers can
 * decide what to do (retry, ask the user to reconnect, surface a message)
 * without depending on Octokit's error shape.
 */
export function classifyGitHubError(error: unknown): GitHubApiError {
  if (!isOctokitLikeError(error)) {
    return new GitHubApiError("Unexpected error calling the GitHub API", "internal", {
      cause: error,
    });
  }

  const { status, response } = error;
  const message = error.message ?? `GitHub API request failed with status ${status}`;

  if (status === 401) {
    return new GitHubApiError(message, "authentication", { cause: error });
  }
  if (status === 403) {
    const remaining = response?.headers?.["x-ratelimit-remaining"];
    if (remaining === "0") {
      return new GitHubApiError(message, "rate_limit", {
        cause: error,
        ...withRetryAfter(parseRetryAfterSeconds(response?.headers)),
      });
    }
    return new GitHubApiError(message, "authorization", { cause: error });
  }
  if (status === 404 || status === 422) {
    return new GitHubApiError(message, "permanent_provider", { cause: error });
  }
  if (status === 429) {
    return new GitHubApiError(message, "rate_limit", {
      cause: error,
      ...withRetryAfter(parseRetryAfterSeconds(response?.headers)),
    });
  }
  if (status >= 500) {
    return new GitHubApiError(message, "temporary_provider", { cause: error });
  }
  return new GitHubApiError(message, "internal", { cause: error });
}
