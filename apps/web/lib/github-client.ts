import { createGitHubClient } from "@issuefit/github";

/** Single shared client instance; GitHubClient methods take the caller's own token. */
export const gitHubClient = createGitHubClient();
