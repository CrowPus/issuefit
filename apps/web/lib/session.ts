import { getAuth } from "./auth";

/** Resolves the current session's user id, or null if not signed in. */
export async function getSessionUserId(requestHeaders: Headers): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.user.id ?? null;
}
