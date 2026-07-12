import { parseEnv, webEnvSchema } from "@issuefit/config";
import { findUserById } from "@issuefit/database";

import { getDb } from "./db";

/** Checks a GitHub username against the ADMIN_GITHUB_USERNAMES allowlist (see ADR-0009). */
export function isAdminUsername(githubUsername: string): boolean {
  const { ADMIN_GITHUB_USERNAMES } = parseEnv(webEnvSchema, process.env);
  return ADMIN_GITHUB_USERNAMES.includes(githubUsername);
}

/**
 * Resolves whether a signed-in user is an admin. Every admin page and
 * server action must call this independently — never trust a client-side
 * check alone (GUIDLINE.md §15).
 */
export async function isAdminUserId(userId: string): Promise<boolean> {
  const user = await findUserById(getDb(), userId);
  return user !== null && isAdminUsername(user.githubUsername);
}
