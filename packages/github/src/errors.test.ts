import { describe, expect, it } from "vitest";

import { GitHubApiError, classifyGitHubError } from "./errors.js";

function octokitError(status: number, headers: Record<string, string> = {}) {
  return { status, message: `request failed with ${status}`, response: { headers } };
}

describe("classifyGitHubError", () => {
  it("classifies 401 as authentication", () => {
    expect(classifyGitHubError(octokitError(401)).category).toBe("authentication");
  });

  it("classifies 403 with no remaining quota as rate_limit, with retryAfterSeconds", () => {
    const error = classifyGitHubError(
      octokitError(403, { "x-ratelimit-remaining": "0", "retry-after": "30" }),
    );
    expect(error.category).toBe("rate_limit");
    expect(error.retryAfterSeconds).toBe(30);
  });

  it("classifies 403 with remaining quota as authorization", () => {
    expect(classifyGitHubError(octokitError(403, { "x-ratelimit-remaining": "10" })).category).toBe(
      "authorization",
    );
  });

  it("classifies 429 as rate_limit", () => {
    expect(classifyGitHubError(octokitError(429)).category).toBe("rate_limit");
  });

  it("classifies 404 and 422 as permanent_provider", () => {
    expect(classifyGitHubError(octokitError(404)).category).toBe("permanent_provider");
    expect(classifyGitHubError(octokitError(422)).category).toBe("permanent_provider");
  });

  it("classifies 5xx as temporary_provider", () => {
    expect(classifyGitHubError(octokitError(500)).category).toBe("temporary_provider");
    expect(classifyGitHubError(octokitError(503)).category).toBe("temporary_provider");
  });

  it("classifies unrecognised statuses as internal", () => {
    expect(classifyGitHubError(octokitError(418)).category).toBe("internal");
  });

  it("classifies non-Octokit errors as internal and preserves the cause", () => {
    const cause = new Error("network down");
    const error = classifyGitHubError(cause);

    expect(error.category).toBe("internal");
    expect(error.cause).toBe(cause);
  });

  it("always returns a GitHubApiError instance", () => {
    expect(classifyGitHubError(octokitError(500))).toBeInstanceOf(GitHubApiError);
  });
});
