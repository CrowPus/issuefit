/**
 * Structural subset of the GitHub profile returned during OAuth sign-in,
 * loosened where GitHub may omit data (private email, unset display name).
 */
export interface GithubOAuthProfile {
  id: string | number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface MappedGithubUser {
  name: string;
  email: string;
  /** Omitted entirely when GitHub provides no avatar (better-auth rejects null). */
  image?: string;
  githubUserId: number;
  githubUsername: string;
}

/**
 * Maps a GitHub profile onto our user model at sign-in. Users may hide their
 * email or have no display name, and better-auth requires both, so we fall
 * back to GitHub's noreply address convention and the login name.
 */
export function mapGithubProfileToUser(profile: GithubOAuthProfile): MappedGithubUser {
  const displayName = profile.name?.trim() ?? "";
  const avatarUrl = profile.avatar_url;
  return {
    name: displayName === "" ? profile.login : displayName,
    email: profile.email ?? `${profile.id}+${profile.login}@users.noreply.github.com`,
    ...(avatarUrl !== null && avatarUrl !== "" ? { image: avatarUrl } : {}),
    githubUserId: Number(profile.id),
    githubUsername: profile.login,
  };
}
