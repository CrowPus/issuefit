/** A developer's public GitHub profile, as read with their own OAuth token. */
export interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: Date;
}

/** A public repository as returned by GitHub, kept as raw synchronised data. */
export interface GithubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  primaryLanguage: string | null;
  stargazersCount: number;
  forksCount: number;
  isFork: boolean;
  htmlUrl: string;
  pushedAt: Date | null;
}

/** A public repository's core metadata, independent of who owns it. */
export interface GithubRepositoryDetails {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  primaryLanguage: string | null;
  stargazersCount: number;
  openIssuesCount: number;
  archived: boolean;
  disabled: boolean;
  htmlUrl: string;
  pushedAt: Date | null;
}

export interface GithubCommunityProfile {
  hasContributingGuide: boolean;
  /** Rendered URLs of community health files; null when the file is absent. */
  contributingUrl: string | null;
  codeOfConductUrl: string | null;
  readmeUrl: string | null;
}

/** Text contents of a file read from a repository's default branch. */
export interface GithubRepositoryFile {
  path: string;
  content: string;
  htmlUrl: string;
}

/** An open issue on a repository. Pull requests are filtered out before mapping. */
export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  description: string | null;
  labels: string[];
  state: "open" | "closed";
  isAssigned: boolean;
  commentsCount: number;
  htmlUrl: string;
  /** Login of the issue's author; null for deleted (ghost) accounts. */
  authorLogin: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

/** A comment on an issue, reduced to what responsiveness needs (ADR-0015). */
export interface GithubIssueComment {
  /** Login of the comment's author; null for deleted (ghost) accounts. */
  authorLogin: string | null;
  createdAt: Date;
}

/**
 * GitHub access behind an interface, so business logic never depends on
 * Octokit directly (GUIDLINE.md §8). Every method reads only what the
 * supplied token's holder can see; this client does not care whether that
 * token is a signed-in user's own OAuth token or a service-level token used
 * to read public data on the platform's behalf — see ADR-0009.
 */
export interface GitHubClient {
  getAuthenticatedProfile(accessToken: string): Promise<GithubProfile>;
  /** Public repositories the authenticated user owns, most recently pushed first. */
  listPublicRepositories(accessToken: string): Promise<GithubRepository[]>;
  /**
   * The most-starred public repositories on GitHub, best first, from the
   * search API. One API call; feeds the cached rankings list (ADR-0021).
   */
  listMostStarredRepositories(accessToken: string, count: number): Promise<GithubRepository[]>;
  /** Any public repository's metadata, regardless of who owns it. */
  getRepository(accessToken: string, owner: string, name: string): Promise<GithubRepositoryDetails>;
  /**
   * Whether the token's holder can push to this repository (admin, maintain,
   * or push permission). Must be called with the user's own OAuth token —
   * this is the maintainer check behind project submission (ADR-0020).
   */
  getRepositoryViewerCanPush(accessToken: string, owner: string, name: string): Promise<boolean>;
  getRepositoryCommunityProfile(
    accessToken: string,
    owner: string,
    name: string,
  ): Promise<GithubCommunityProfile>;
  /**
   * Reads a text file from a public repository's default branch. Returns
   * null when the path does not exist or is not a regular file.
   */
  getRepositoryFile(
    accessToken: string,
    owner: string,
    name: string,
    path: string,
  ): Promise<GithubRepositoryFile | null>;
  /**
   * Names of the regular files directly inside one directory of a public
   * repository's default branch (first page of 100 entries — a documented
   * bound, see ADR-0017). Returns null when the path does not exist or is
   * not a directory.
   */
  listRepositoryDirectory(
    accessToken: string,
    owner: string,
    name: string,
    path: string,
  ): Promise<string[] | null>;
  /** Open issues on any public repository, most recently updated first. Excludes pull requests. */
  listRepositoryIssues(accessToken: string, owner: string, name: string): Promise<GithubIssue[]>;
  /**
   * The earliest comments on one issue, oldest first, capped at `maxCount`.
   * One API call — used to find the first non-author response (ADR-0015).
   */
  listIssueFirstComments(
    accessToken: string,
    owner: string,
    name: string,
    issueNumber: number,
    maxCount: number,
  ): Promise<GithubIssueComment[]>;
  /**
   * States of pull requests that cross-reference this issue, from the first
   * page of its timeline (100 events). One API call per issue (ADR-0015).
   */
  listIssueLinkedPullRequestStates(
    accessToken: string,
    owner: string,
    name: string,
    issueNumber: number,
  ): Promise<("open" | "closed")[]>;
}
