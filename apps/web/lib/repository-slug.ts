/** GitHub username rules: alphanumeric or hyphen, no leading/trailing hyphen, max 39 chars. */
const SLUG_PATTERN = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/([A-Za-z0-9._-]{1,100})$/;

export interface RepositorySlug {
  owner: string;
  name: string;
}

/**
 * Parses an admin-entered "owner/name" slug, tolerating a pasted GitHub
 * URL. Returns null for anything that cannot possibly be a valid GitHub
 * repository identifier — the actual existence check happens against the
 * GitHub API afterward.
 */
export function parseRepositorySlug(input: string): RepositorySlug | null {
  const trimmed = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");

  const match = SLUG_PATTERN.exec(trimmed);
  if (match === null) {
    return null;
  }
  const [, owner, name] = match;
  if (owner === undefined || name === undefined) {
    return null;
  }
  return { owner, name };
}
