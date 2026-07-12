import {
  defaultSkillInferenceConfig,
  validateSkillInferenceConfig,
  type SkillInferenceConfig,
} from "./config.js";
import type { ProposedSkill, RepositoryLanguageSample, SkillLevel } from "./types.js";

function levelForCount(count: number, config: SkillInferenceConfig): SkillLevel {
  if (count >= config.advancedThreshold) {
    return "advanced";
  }
  if (count >= config.intermediateThreshold) {
    return "intermediate";
  }
  return "beginner";
}

/**
 * Proposes a skill per distinct primary language across a user's synced
 * repositories, based purely on repository counts. Deterministic and
 * testable without GitHub or a database — see ADR-0008.
 */
export function inferSkillsFromRepositories(
  repositories: readonly RepositoryLanguageSample[],
  config: SkillInferenceConfig = defaultSkillInferenceConfig,
): ProposedSkill[] {
  validateSkillInferenceConfig(config);

  const repositoryCountByLanguage = new Map<string, number>();
  for (const repository of repositories) {
    if (repository.primaryLanguage === null) {
      continue;
    }
    if (repository.isFork && !config.includeForks) {
      continue;
    }
    const language = repository.primaryLanguage;
    repositoryCountByLanguage.set(language, (repositoryCountByLanguage.get(language) ?? 0) + 1);
  }

  const proposals = Array.from(repositoryCountByLanguage.entries(), ([name, repositoryCount]) => ({
    name,
    level: levelForCount(repositoryCount, config),
    confidenceScore: Math.min(1, repositoryCount / config.advancedThreshold),
    repositoryCount,
  }));

  proposals.sort((a, b) => b.repositoryCount - a.repositoryCount || a.name.localeCompare(b.name));
  return proposals;
}
