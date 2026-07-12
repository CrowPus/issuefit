import { describe, expect, it } from "vitest";

import { GitHubApiError } from "./errors.js";
import type { RawGithubRepository, RawGithubUser } from "./mapping.js";
import { createGitHubClient } from "./octokit-client.js";

const rawUser: RawGithubUser = {
  id: 1,
  login: "octocat",
  name: "The Octocat",
  bio: null,
  company: null,
  location: null,
  blog: null,
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  public_repos: 2,
  followers: 0,
  following: 0,
  created_at: "2011-01-25T18:44:36Z",
};

function makeRawRepo(id: number): RawGithubRepository {
  return {
    id,
    name: `repo-${id}`,
    full_name: `octocat/repo-${id}`,
    description: null,
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    fork: false,
    html_url: `https://github.com/octocat/repo-${id}`,
    pushed_at: "2026-01-01T00:00:00Z",
  };
}

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

describe("createGitHubClient", () => {
  it("fetches and maps the authenticated user's profile", async () => {
    const fetchCalls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        fetchCalls.push(String(input));
        return jsonResponse(rawUser);
      },
    });

    const profile = await client.getAuthenticatedProfile("token-123");

    expect(profile.login).toBe("octocat");
    expect(profile.createdAt).toEqual(new Date("2011-01-25T18:44:36Z"));
    expect(fetchCalls[0]).toContain("api.github.com/user");
  });

  it("follows pagination across multiple pages", async () => {
    let requestCount = 0;
    const client = createGitHubClient({
      fetch: async (input) => {
        requestCount += 1;
        const url = new URL(String(input));
        const page = url.searchParams.get("page") ?? "1";
        if (page === "1") {
          return jsonResponse([makeRawRepo(1), makeRawRepo(2)], {
            headers: { link: '<https://api.github.com/user/repos?page=2>; rel="next"' },
          });
        }
        return jsonResponse([makeRawRepo(3)]);
      },
    });

    const repositories = await client.listPublicRepositories("token-123");

    expect(repositories.map((repo) => repo.id)).toEqual([1, 2, 3]);
    expect(requestCount).toBe(2);
  });

  it("stops once the repository cap is reached, without fetching further pages", async () => {
    let requestCount = 0;
    const client = createGitHubClient({
      fetch: async (input) => {
        requestCount += 1;
        const url = new URL(String(input));
        const page = Number(url.searchParams.get("page") ?? "1");
        const startId = (page - 1) * 100 + 1;
        const repos = Array.from({ length: 100 }, (_, i) => makeRawRepo(startId + i));
        const nextPage = page + 1;
        return jsonResponse(repos, {
          headers: {
            link: `<https://api.github.com/user/repos?page=${nextPage}>; rel="next"`,
          },
        });
      },
    });

    const repositories = await client.listPublicRepositories("token-123");

    expect(repositories).toHaveLength(300);
    expect(requestCount).toBe(3);
  });

  it("classifies a failed request into a GitHubApiError", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ message: "Bad credentials" }, { status: 401 }),
    });

    await expect(client.getAuthenticatedProfile("bad-token")).rejects.toMatchObject({
      constructor: GitHubApiError,
      category: "authentication",
    });
  });

  it("fetches and maps a repository owned by anyone, not just the token holder", async () => {
    const fetchCalls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        fetchCalls.push(String(input));
        return jsonResponse({
          id: 10270250,
          name: "react",
          full_name: "facebook/react",
          owner: { login: "facebook" },
          description: "The library for web and native user interfaces.",
          language: "JavaScript",
          stargazers_count: 200000,
          open_issues_count: 800,
          archived: false,
          disabled: false,
          html_url: "https://github.com/facebook/react",
          pushed_at: "2026-07-01T00:00:00Z",
        });
      },
    });

    const repository = await client.getRepository("service-token", "facebook", "react");

    expect(repository).toMatchObject({ owner: "facebook", name: "react", archived: false });
    expect(fetchCalls[0]).toContain("api.github.com/repos/facebook/react");
  });

  it("fetches the most starred repositories via the search API, best first", async () => {
    const fetchCalls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        fetchCalls.push(String(input));
        return jsonResponse({
          total_count: 2,
          incomplete_results: false,
          items: [makeRawRepo(1), makeRawRepo(2)],
        });
      },
    });

    const repositories = await client.listMostStarredRepositories("service-token", 10);

    expect(repositories.map((repository) => repository.id)).toEqual([1, 2]);
    expect(fetchCalls[0]).toContain("api.github.com/search/repositories");
    expect(fetchCalls[0]).toContain("per_page=10");
  });

  it("reads the viewer's push permission from the repository response", async () => {
    const client = createGitHubClient({
      fetch: async () =>
        jsonResponse({
          id: 1,
          name: "repo",
          full_name: "octocat/repo",
          owner: { login: "octocat" },
          description: null,
          language: null,
          stargazers_count: 0,
          open_issues_count: 0,
          archived: false,
          disabled: false,
          html_url: "https://github.com/octocat/repo",
          pushed_at: null,
          permissions: { admin: false, maintain: false, push: true, triage: true, pull: true },
        }),
    });

    await expect(client.getRepositoryViewerCanPush("user-token", "octocat", "repo")).resolves.toBe(
      true,
    );
  });

  it("fetches the community profile and detects a contributing guide", async () => {
    const client = createGitHubClient({
      fetch: async () =>
        jsonResponse({
          health_percentage: 100,
          files: { contributing: { url: "https://example.com/CONTRIBUTING.md" } },
        }),
    });

    const profile = await client.getRepositoryCommunityProfile(
      "service-token",
      "facebook",
      "react",
    );

    expect(profile.hasContributingGuide).toBe(true);
  });

  it("reports no contributing guide when GitHub found none", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ health_percentage: 20, files: { contributing: null } }),
    });

    const profile = await client.getRepositoryCommunityProfile("service-token", "octocat", "empty");

    expect(profile.hasContributingGuide).toBe(false);
  });

  it("fetches and decodes a repository text file", async () => {
    const requestedUrls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse({
          type: "file",
          path: ".github/contribution-manifest.yml",
          encoding: "base64",
          content: Buffer.from("version: 1\n").toString("base64"),
          html_url:
            "https://github.com/octocat/hello-world/blob/main/.github/contribution-manifest.yml",
        });
      },
    });

    const file = await client.getRepositoryFile(
      "service-token",
      "octocat",
      "hello-world",
      ".github/contribution-manifest.yml",
    );

    expect(file?.content).toBe("version: 1\n");
    expect(requestedUrls).toHaveLength(1);
    expect(decodeURIComponent(new URL(requestedUrls[0] ?? "").pathname)).toBe(
      "/repos/octocat/hello-world/contents/.github/contribution-manifest.yml",
    );
  });

  it("returns null when a repository text file is missing", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ message: "Not Found" }, { status: 404 }),
    });

    await expect(
      client.getRepositoryFile(
        "service-token",
        "octocat",
        "hello-world",
        ".github/contribution-manifest.yml",
      ),
    ).resolves.toBeNull();
  });

  it("returns null when the contents path is a directory", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse([{ type: "file", path: "nested.txt" }]),
    });

    await expect(
      client.getRepositoryFile("service-token", "octocat", "hello-world", ".github"),
    ).resolves.toBeNull();
  });

  it("lists the file names of a repository directory", async () => {
    const requestedUrls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse([
          { type: "file", name: "ci.yml" },
          { type: "dir", name: "actions" },
          { type: "file", name: "release.yaml" },
        ]);
      },
    });

    const names = await client.listRepositoryDirectory(
      "service-token",
      "octocat",
      "hello-world",
      ".github/workflows",
    );

    expect(names).toEqual(["ci.yml", "release.yaml"]);
    expect(decodeURIComponent(new URL(requestedUrls[0] ?? "").pathname)).toBe(
      "/repos/octocat/hello-world/contents/.github/workflows",
    );
  });

  it("returns null when a directory listing path is missing", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ message: "Not Found" }, { status: 404 }),
    });

    await expect(
      client.listRepositoryDirectory(
        "service-token",
        "octocat",
        "hello-world",
        ".github/workflows",
      ),
    ).resolves.toBeNull();
  });

  it("returns null when the directory listing path is a file", async () => {
    const client = createGitHubClient({
      fetch: async () =>
        jsonResponse({ type: "file", path: "README.md", encoding: "base64", content: "" }),
    });

    await expect(
      client.listRepositoryDirectory("service-token", "octocat", "hello-world", "README.md"),
    ).resolves.toBeNull();
  });

  it("classifies a repository lookup 404 as a permanent provider error", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ message: "Not Found" }, { status: 404 }),
    });

    await expect(client.getRepository("service-token", "octocat", "missing")).rejects.toMatchObject(
      { category: "permanent_provider" },
    );
  });

  function makeRawIssue(id: number, overrides: Record<string, unknown> = {}) {
    return {
      id,
      number: id,
      title: `Issue ${id}`,
      body: "A description",
      labels: [],
      state: "open",
      assignee: null,
      assignees: [],
      comments: 0,
      html_url: `https://github.com/facebook/react/issues/${id}`,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      closed_at: null,
      ...overrides,
    };
  }

  it("fetches and maps open issues, excluding pull requests", async () => {
    const client = createGitHubClient({
      fetch: async () =>
        jsonResponse([
          makeRawIssue(1),
          makeRawIssue(2, { pull_request: { url: "https://api.github.com/pulls/2" } }),
          makeRawIssue(3),
        ]),
    });

    const issues = await client.listRepositoryIssues("service-token", "facebook", "react");

    expect(issues.map((issue) => issue.id)).toEqual([1, 3]);
  });

  it("paginates issue results across multiple pages", async () => {
    let requestCount = 0;
    const client = createGitHubClient({
      fetch: async (input) => {
        requestCount += 1;
        const url = new URL(String(input));
        const page = url.searchParams.get("page") ?? "1";
        if (page === "1") {
          return jsonResponse([makeRawIssue(1), makeRawIssue(2)], {
            headers: {
              link: '<https://api.github.com/repos/facebook/react/issues?page=2>; rel="next"',
            },
          });
        }
        return jsonResponse([makeRawIssue(3)]);
      },
    });

    const issues = await client.listRepositoryIssues("service-token", "facebook", "react");

    expect(issues.map((issue) => issue.id)).toEqual([1, 2, 3]);
    expect(requestCount).toBe(2);
  });

  it("stops once the per-repository issue cap is reached", async () => {
    let requestCount = 0;
    const client = createGitHubClient({
      fetch: async (input) => {
        requestCount += 1;
        const url = new URL(String(input));
        const page = Number(url.searchParams.get("page") ?? "1");
        const startId = (page - 1) * 100 + 1;
        const issues = Array.from({ length: 100 }, (_, i) => makeRawIssue(startId + i));
        return jsonResponse(issues, {
          headers: {
            link: `<https://api.github.com/repos/facebook/react/issues?page=${page + 1}>; rel="next"`,
          },
        });
      },
    });

    const issues = await client.listRepositoryIssues("service-token", "facebook", "react");

    expect(issues).toHaveLength(100);
    expect(requestCount).toBe(1);
  });

  it("requests only open issues", async () => {
    let requestedState: string | null = null;
    const client = createGitHubClient({
      fetch: async (input) => {
        requestedState = new URL(String(input)).searchParams.get("state");
        return jsonResponse([]);
      },
    });

    await client.listRepositoryIssues("service-token", "facebook", "react");

    expect(requestedState).toBe("open");
  });

  it("fetches an issue's first comments with the requested cap, in one call", async () => {
    const requestedUrls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse([
          { user: { login: "responder" }, created_at: "2026-01-02T00:00:00Z" },
          { user: null, created_at: "2026-01-03T00:00:00Z" },
        ]);
      },
    });

    const comments = await client.listIssueFirstComments(
      "service-token",
      "facebook",
      "react",
      42,
      10,
    );

    expect(comments).toEqual([
      { authorLogin: "responder", createdAt: new Date("2026-01-02T00:00:00Z") },
      { authorLogin: null, createdAt: new Date("2026-01-03T00:00:00Z") },
    ]);
    expect(requestedUrls).toHaveLength(1);
    const url = new URL(requestedUrls[0] ?? "");
    expect(url.pathname).toBe("/repos/facebook/react/issues/42/comments");
    expect(url.searchParams.get("per_page")).toBe("10");
  });

  it("extracts linked pull-request states from an issue's timeline", async () => {
    const requestedUrls: string[] = [];
    const client = createGitHubClient({
      fetch: async (input) => {
        requestedUrls.push(String(input));
        return jsonResponse([
          { event: "labeled" },
          { event: "cross-referenced", source: { issue: { state: "open", pull_request: {} } } },
          { event: "cross-referenced", source: { issue: { state: "closed", pull_request: {} } } },
          { event: "cross-referenced", source: { issue: { state: "open" } } },
        ]);
      },
    });

    const states = await client.listIssueLinkedPullRequestStates(
      "service-token",
      "facebook",
      "react",
      42,
    );

    expect(states).toEqual(["open", "closed"]);
    expect(requestedUrls).toHaveLength(1);
    expect(new URL(requestedUrls[0] ?? "").pathname).toBe(
      "/repos/facebook/react/issues/42/timeline",
    );
  });

  it("classifies errors from the new per-issue endpoints", async () => {
    const client = createGitHubClient({
      fetch: async () => jsonResponse({ message: "rate limited" }, { status: 429 }),
    });

    await expect(
      client.listIssueFirstComments("service-token", "facebook", "react", 42, 10),
    ).rejects.toBeInstanceOf(GitHubApiError);
    await expect(
      client.listIssueLinkedPullRequestStates("service-token", "facebook", "react", 42),
    ).rejects.toBeInstanceOf(GitHubApiError);
  });
});
