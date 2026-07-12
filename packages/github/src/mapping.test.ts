import { describe, expect, it } from "vitest";

import {
  mapGithubCommunityProfile,
  mapGithubDirectoryFileNames,
  mapGithubIssue,
  mapGithubIssueComment,
  mapGithubRepository,
  mapGithubRepositoryDetails,
  mapGithubViewerCanPush,
  mapGithubRepositoryFile,
  mapGithubUser,
  mapLinkedPullRequestStates,
} from "./mapping.js";

describe("mapGithubUser", () => {
  it("maps every field, including nullable profile fields", () => {
    const profile = mapGithubUser({
      id: 583231,
      login: "octocat",
      name: "The Octocat",
      bio: "GitHub mascot",
      company: null,
      location: "San Francisco",
      blog: null,
      avatar_url: "https://avatars.githubusercontent.com/u/583231",
      public_repos: 8,
      followers: 4000,
      following: 9,
      created_at: "2011-01-25T18:44:36Z",
    });

    expect(profile).toEqual({
      id: 583231,
      login: "octocat",
      name: "The Octocat",
      bio: "GitHub mascot",
      company: null,
      location: "San Francisco",
      blog: null,
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
      publicRepos: 8,
      followers: 4000,
      following: 9,
      createdAt: new Date("2011-01-25T18:44:36Z"),
    });
  });
});

describe("mapGithubRepository", () => {
  it("maps a repository with a language and a push date", () => {
    const repository = mapGithubRepository({
      id: 1,
      name: "hello-world",
      full_name: "octocat/hello-world",
      description: "My first repository",
      language: "TypeScript",
      stargazers_count: 42,
      forks_count: 7,
      fork: false,
      html_url: "https://github.com/octocat/hello-world",
      pushed_at: "2026-01-01T00:00:00Z",
    });

    expect(repository).toEqual({
      id: 1,
      name: "hello-world",
      fullName: "octocat/hello-world",
      description: "My first repository",
      primaryLanguage: "TypeScript",
      stargazersCount: 42,
      forksCount: 7,
      isFork: false,
      htmlUrl: "https://github.com/octocat/hello-world",
      pushedAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("maps an empty repository with no language and no pushes as null", () => {
    const repository = mapGithubRepository({
      id: 2,
      name: "empty",
      full_name: "octocat/empty",
      description: null,
      language: null,
      stargazers_count: 0,
      forks_count: 0,
      fork: true,
      html_url: "https://github.com/octocat/empty",
      pushed_at: null,
    });

    expect(repository.primaryLanguage).toBeNull();
    expect(repository.pushedAt).toBeNull();
    expect(repository.isFork).toBe(true);
  });
});

describe("mapGithubRepositoryDetails", () => {
  it("maps owner login and archival/disabled flags", () => {
    const details = mapGithubRepositoryDetails({
      id: 10270250,
      name: "react",
      full_name: "facebook/react",
      owner: { login: "facebook" },
      description: "A library",
      language: "JavaScript",
      stargazers_count: 200000,
      open_issues_count: 800,
      archived: true,
      disabled: false,
      html_url: "https://github.com/facebook/react",
      pushed_at: null,
    });

    expect(details.owner).toBe("facebook");
    expect(details.archived).toBe(true);
    expect(details.disabled).toBe(false);
    expect(details.pushedAt).toBeNull();
  });
});

describe("mapGithubViewerCanPush", () => {
  const base = {
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
  };

  it("grants push for admin, maintain, or push permission", () => {
    expect(mapGithubViewerCanPush({ ...base, permissions: { admin: true } })).toBe(true);
    expect(mapGithubViewerCanPush({ ...base, permissions: { maintain: true } })).toBe(true);
    expect(mapGithubViewerCanPush({ ...base, permissions: { push: true } })).toBe(true);
  });

  it("denies push for read-only viewers and when GitHub omits permissions entirely", () => {
    expect(mapGithubViewerCanPush({ ...base, permissions: { admin: false, push: false } })).toBe(
      false,
    );
    expect(mapGithubViewerCanPush({ ...base, permissions: null })).toBe(false);
    expect(mapGithubViewerCanPush(base)).toBe(false);
  });
});

describe("mapGithubCommunityProfile", () => {
  it("reports a contributing guide as present when GitHub found one", () => {
    expect(
      mapGithubCommunityProfile({
        files: { contributing: { html_url: "https://example.com/CONTRIBUTING.md" } },
      }).hasContributingGuide,
    ).toBe(true);
  });

  it("reports a contributing guide as absent when GitHub found none", () => {
    expect(mapGithubCommunityProfile({ files: { contributing: null } }).hasContributingGuide).toBe(
      false,
    );
  });

  it("maps the community file URLs when GitHub provides them", () => {
    expect(
      mapGithubCommunityProfile({
        files: {
          contributing: { html_url: "https://example.com/CONTRIBUTING.md" },
          code_of_conduct_file: { html_url: "https://example.com/CODE_OF_CONDUCT.md" },
          readme: { html_url: "https://example.com/README.md" },
        },
      }),
    ).toEqual({
      hasContributingGuide: true,
      contributingUrl: "https://example.com/CONTRIBUTING.md",
      codeOfConductUrl: "https://example.com/CODE_OF_CONDUCT.md",
      readmeUrl: "https://example.com/README.md",
    });
  });

  it("maps absent or URL-less community files to null", () => {
    expect(
      mapGithubCommunityProfile({
        files: { contributing: {}, code_of_conduct_file: null },
      }),
    ).toEqual({
      hasContributingGuide: true,
      contributingUrl: null,
      codeOfConductUrl: null,
      readmeUrl: null,
    });
  });
});

describe("mapGithubDirectoryFileNames", () => {
  it("keeps only regular file names, in API order", () => {
    expect(
      mapGithubDirectoryFileNames([
        { type: "file", name: "ci.yml" },
        { type: "dir", name: "scripts" },
        { type: "file", name: "release.yaml" },
        { type: "symlink", name: "link.yml" },
        { type: "file" },
      ]),
    ).toEqual(["ci.yml", "release.yaml"]);
  });

  it("maps an empty directory to an empty list", () => {
    expect(mapGithubDirectoryFileNames([])).toEqual([]);
  });
});

describe("mapGithubRepositoryFile", () => {
  it("decodes base64 file contents", () => {
    expect(
      mapGithubRepositoryFile({
        type: "file",
        path: ".github/contribution-manifest.yml",
        encoding: "base64",
        content: Buffer.from("version: 1\n").toString("base64"),
        html_url:
          "https://github.com/octocat/hello-world/blob/main/.github/contribution-manifest.yml",
      }),
    ).toEqual({
      path: ".github/contribution-manifest.yml",
      content: "version: 1\n",
      htmlUrl: "https://github.com/octocat/hello-world/blob/main/.github/contribution-manifest.yml",
    });
  });

  it("returns null for non-file contents", () => {
    expect(mapGithubRepositoryFile({ type: "dir" })).toBeNull();
  });

  it("returns null for unsupported encodings", () => {
    expect(
      mapGithubRepositoryFile({
        type: "file",
        path: ".github/contribution-manifest.yml",
        encoding: "none",
        content: "version: 1",
        html_url: "https://github.com/octocat/hello-world/blob/main/file",
      }),
    ).toBeNull();
  });
});

describe("mapGithubIssue", () => {
  const base = {
    id: 1,
    number: 42,
    title: "Add Docker support",
    body: "A description",
    labels: ["good first issue"],
    state: "open",
    assignee: null,
    assignees: [],
    comments: 3,
    html_url: "https://github.com/octocat/hello-world/issues/42",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    closed_at: null,
  };

  it("maps plain string labels", () => {
    expect(mapGithubIssue(base).labels).toEqual(["good first issue"]);
  });

  it("maps object labels by their name", () => {
    const issue = mapGithubIssue({ ...base, labels: [{ name: "bug" }, { name: "help wanted" }] });
    expect(issue.labels).toEqual(["bug", "help wanted"]);
  });

  it("treats a missing body as a null description", () => {
    const { body: _body, ...withoutBody } = base;
    expect(mapGithubIssue(withoutBody).description).toBeNull();
  });

  it("is assigned when assignee is set", () => {
    expect(mapGithubIssue({ ...base, assignee: { login: "octocat" } }).isAssigned).toBe(true);
  });

  it("is assigned when assignees has entries even if assignee is null", () => {
    expect(mapGithubIssue({ ...base, assignees: [{ login: "octocat" }] }).isAssigned).toBe(true);
  });

  it("is not assigned when both assignee and assignees are empty", () => {
    expect(mapGithubIssue(base).isAssigned).toBe(false);
  });

  it("maps closed_at and normalises an unexpected state to open", () => {
    const issue = mapGithubIssue({ ...base, state: "closed", closed_at: "2026-03-01T00:00:00Z" });
    expect(issue.state).toBe("closed");
    expect(issue.closedAt).toEqual(new Date("2026-03-01T00:00:00Z"));
  });

  it("maps the author login, null for ghost accounts", () => {
    expect(mapGithubIssue({ ...base, user: { login: "octocat" } }).authorLogin).toBe("octocat");
    expect(mapGithubIssue({ ...base, user: null }).authorLogin).toBeNull();
    expect(mapGithubIssue(base).authorLogin).toBeNull();
  });
});

describe("mapGithubIssueComment", () => {
  it("maps author and timestamp, with null for ghost accounts", () => {
    expect(
      mapGithubIssueComment({ user: { login: "responder" }, created_at: "2026-01-02T00:00:00Z" }),
    ).toEqual({ authorLogin: "responder", createdAt: new Date("2026-01-02T00:00:00Z") });
    expect(mapGithubIssueComment({ user: null, created_at: "2026-01-02T00:00:00Z" })).toEqual({
      authorLogin: null,
      createdAt: new Date("2026-01-02T00:00:00Z"),
    });
  });
});

describe("mapLinkedPullRequestStates", () => {
  it("extracts states of cross-referenced pull requests only", () => {
    const states = mapLinkedPullRequestStates([
      { event: "labeled" },
      { event: "cross-referenced", source: { issue: { state: "open" } } }, // an issue, not a PR
      { event: "cross-referenced", source: { issue: { state: "open", pull_request: {} } } },
      { event: "cross-referenced", source: { issue: { state: "closed", pull_request: {} } } },
      { event: "cross-referenced" }, // no source at all
    ]);
    expect(states).toEqual(["open", "closed"]);
  });

  it("returns an empty list for an event-free timeline", () => {
    expect(mapLinkedPullRequestStates([])).toEqual([]);
  });
});
