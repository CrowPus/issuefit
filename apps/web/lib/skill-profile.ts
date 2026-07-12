import {
  ensureSkills,
  listGithubRepositoriesByUserId,
  upsertProposedUserSkills,
} from "@issuefit/database";
import { inferSkillsFromRepositories } from "@issuefit/skills";

import { getDb } from "./db";

export type RefreshSkillsResult =
  | { status: "success"; proposedCount: number }
  | { status: "no_repositories" }
  | { status: "error"; message: string };

/**
 * Regenerates GitHub-derived skill proposals from the user's already-synced
 * repositories. Does not call GitHub itself — run "Sync GitHub data" first.
 */
export async function refreshSkillsFromGithub(userId: string): Promise<RefreshSkillsResult> {
  const db = getDb();
  const repositories = await listGithubRepositoriesByUserId(db, userId);
  if (repositories.length === 0) {
    return { status: "no_repositories" };
  }

  try {
    const proposals = inferSkillsFromRepositories(
      repositories.map((repository) => ({
        primaryLanguage: repository.primaryLanguage,
        isFork: repository.isFork,
      })),
    );
    if (proposals.length === 0) {
      return { status: "success", proposedCount: 0 };
    }

    const skillIdByName = await ensureSkills(
      db,
      proposals.map((proposal) => proposal.name),
    );
    await upsertProposedUserSkills(
      db,
      userId,
      proposals.map((proposal) => {
        const skillId = skillIdByName.get(proposal.name);
        if (skillId === undefined) {
          throw new Error(`ensureSkills did not return an id for "${proposal.name}"`);
        }
        return { skillId, level: proposal.level, confidenceScore: proposal.confidenceScore };
      }),
    );

    return { status: "success", proposedCount: proposals.length };
  } catch (error) {
    console.error("skill_refresh_failed", { userId, error });
    return {
      status: "error",
      message: "Could not update your skill profile. Please try again later.",
    };
  }
}
