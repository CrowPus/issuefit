import type {
  GithubCommunityProfile,
  GithubIssue,
  GithubIssueComment,
  GithubProfile,
  GithubRepository,
  GithubRepositoryDetails,
  GithubRepositoryFile,
} from "./types.js";

/** Structural subset of Octokit's `GET /user` response we rely on. */
export interface RawGithubUser {
  id: number;
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

/** Structural subset of Octokit's repository list item we rely on. */
export interface RawGithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  html_url: string;
  pushed_at: string | null;
}

export function mapGithubUser(raw: RawGithubUser): GithubProfile {
  return {
    id: raw.id,
    login: raw.login,
    name: raw.name,
    bio: raw.bio,
    company: raw.company,
    location: raw.location,
    blog: raw.blog,
    avatarUrl: raw.avatar_url,
    publicRepos: raw.public_repos,
    followers: raw.followers,
    following: raw.following,
    createdAt: new Date(raw.created_at),
  };
}

export function mapGithubRepository(raw: RawGithubRepository): GithubRepository {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    primaryLanguage: raw.language,
    stargazersCount: raw.stargazers_count,
    forksCount: raw.forks_count,
    isFork: raw.fork,
    htmlUrl: raw.html_url,
    pushedAt: raw.pushed_at === null ? null : new Date(raw.pushed_at),
  };
}

/** Structural subset of Octokit's `GET /repos/{owner}/{repo}` response we rely on. */
export interface RawGithubRepositoryDetails {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  archived: boolean;
  disabled: boolean;
  html_url: string;
  pushed_at: string | null;
  /** Present only for authenticated viewers; absent on service-token reads of foreign repos. */
  permissions?: { admin?: boolean; maintain?: boolean; push?: boolean } | null;
}

/**
 * Whether the viewer behind the request can push to the repository. GitHub
 * includes `permissions` only for tokens with some relationship to the
 * repository — a missing block means read-only access.
 */
export function mapGithubViewerCanPush(raw: RawGithubRepositoryDetails): boolean {
  const permissions = raw.permissions;
  return (
    permissions?.admin === true || permissions?.maintain === true || permissions?.push === true
  );
}

/** Structural subset of Octokit's `GET /repos/{owner}/{repo}/community/profile` response. */
export interface RawGithubCommunityProfile {
  files: {
    contributing: { html_url?: string | null } | null;
    code_of_conduct_file?: { html_url?: string | null } | null;
    readme?: { html_url?: string | null } | null;
  };
}

export function mapGithubRepositoryDetails(
  raw: RawGithubRepositoryDetails,
): GithubRepositoryDetails {
  return {
    id: raw.id,
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    primaryLanguage: raw.language,
    stargazersCount: raw.stargazers_count,
    openIssuesCount: raw.open_issues_count,
    archived: raw.archived,
    disabled: raw.disabled,
    htmlUrl: raw.html_url,
    pushedAt: raw.pushed_at === null ? null : new Date(raw.pushed_at),
  };
}

function communityFileUrl(file: { html_url?: string | null } | null | undefined): string | null {
  return file?.html_url ?? null;
}

export function mapGithubCommunityProfile(raw: RawGithubCommunityProfile): GithubCommunityProfile {
  return {
    hasContributingGuide: raw.files.contributing !== null,
    contributingUrl: communityFileUrl(raw.files.contributing),
    codeOfConductUrl: communityFileUrl(raw.files.code_of_conduct_file),
    readmeUrl: communityFileUrl(raw.files.readme),
  };
}

/** Structural subset of Octokit's repository contents response for files. */
export interface RawGithubRepositoryFile {
  type?: string;
  path?: string;
  encoding?: string;
  content?: string;
  html_url?: string;
}

export function mapGithubRepositoryFile(raw: RawGithubRepositoryFile): GithubRepositoryFile | null {
  if (
    raw.type !== "file" ||
    raw.path === undefined ||
    raw.encoding !== "base64" ||
    raw.content === undefined ||
    raw.html_url === undefined
  ) {
    return null;
  }
  return {
    path: raw.path,
    content: Buffer.from(raw.content.replace(/\s/g, ""), "base64").toString("utf8"),
    htmlUrl: raw.html_url,
  };
}

/** Structural subset of one entry in Octokit's directory-contents response. */
export interface RawGithubDirectoryEntry {
  type?: string;
  name?: string;
}

/** Names of the regular files in a directory listing, in API order. */
export function mapGithubDirectoryFileNames(entries: readonly RawGithubDirectoryEntry[]): string[] {
  return entries
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.name)
    .filter((name): name is string => name !== undefined);
}

/** A label as GitHub's issue-list endpoint returns it: a plain name, or an object with one. */
export type RawGithubLabel = string | { name?: string };

/**
 * Structural subset of Octokit's issue-list item we rely on. `pull_request`
 * is present only when this "issue" is actually a pull request — callers
 * filter those out before mapping.
 */
export interface RawGithubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  labels: RawGithubLabel[];
  state: string;
  assignee: unknown | null;
  assignees?: unknown[] | null;
  comments: number;
  html_url: string;
  /** Null for deleted (ghost) accounts. */
  user?: { login?: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown;
}

function labelName(label: RawGithubLabel): string | null {
  if (typeof label === "string") {
    return label;
  }
  return label.name ?? null;
}

export function mapGithubIssue(raw: RawGithubIssue): GithubIssue {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    description: raw.body ?? null,
    labels: raw.labels.map(labelName).filter((name): name is string => name !== null),
    state: raw.state === "closed" ? "closed" : "open",
    isAssigned: raw.assignee !== null || (raw.assignees?.length ?? 0) > 0,
    commentsCount: raw.comments,
    htmlUrl: raw.html_url,
    authorLogin: raw.user?.login ?? null,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    closedAt: raw.closed_at === null ? null : new Date(raw.closed_at),
  };
}

/** Structural subset of Octokit's issue-comment item we rely on. */
export interface RawGithubIssueComment {
  /** Null for deleted (ghost) accounts. */
  user?: { login?: string } | null;
  created_at: string;
}

export function mapGithubIssueComment(raw: RawGithubIssueComment): GithubIssueComment {
  return {
    authorLogin: raw.user?.login ?? null,
    createdAt: new Date(raw.created_at),
  };
}

/**
 * Structural subset of an issue-timeline event. `source.issue.pull_request`
 * is present only when the cross-referencing item is a pull request —
 * mirroring the same marker on RawGithubIssue.
 */
export interface RawGithubTimelineEvent {
  event: string;
  source?: {
    issue?: {
      state?: string;
      pull_request?: unknown;
    };
  };
}

/**
 * States of pull requests that cross-reference an issue, extracted from its
 * timeline events (ADR-0015). Non-PR references and other events are ignored.
 */
export function mapLinkedPullRequestStates(
  events: readonly RawGithubTimelineEvent[],
): ("open" | "closed")[] {
  const states: ("open" | "closed")[] = [];
  for (const event of events) {
    if (event.event !== "cross-referenced") {
      continue;
    }
    const source = event.source?.issue;
    if (source?.pull_request === undefined) {
      continue;
    }
    states.push(source.state === "open" ? "open" : "closed");
  }
  return states;
}
