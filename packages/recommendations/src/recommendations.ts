import {
  findCareerGoalByUserId,
  listFeedbackVerdictsForUser,
  listNegativelyRatedGithubIssueIds,
  listSyncedIssuesWithRepositories,
  listUserSkillsWithNames,
  type CareerGoalRecord,
  type Database,
  type IssueRecord,
  type IssueWithRepository,
  type RecommendationFeedbackVerdict,
  type RepositoryRecord,
  type UserSkillWithName,
} from "@issuefit/database";
import {
  rankIssues,
  type DeveloperProfile,
  type IssueCandidate,
  type RecommendationScore,
} from "@issuefit/recommendation-engine";
import type { CareerGoalOption } from "@issuefit/skills";

import { careerGoalTechnologies } from "./career-goal.js";
import {
  manifestAllowsIssueOpportunity,
  repositoryAllowsExternalContributors,
  repositoryHasMaintainerApprovedManifest,
} from "./manifest-policy.js";

/**
 * Builds the engine's DeveloperProfile from confirmed skills and career
 * goals. The career-goal form only collects a single preferred difficulty,
 * not a range, so min/max stay maximally permissive — a soft preference,
 * never a hard exclusion boundary the user never agreed to. See ADR-0012.
 */
export function buildDeveloperProfile(
  userSkills: readonly UserSkillWithName[],
  careerGoal: CareerGoalRecord | null,
): DeveloperProfile {
  return {
    skills: userSkills.map((skill) => ({ name: skill.name, level: skill.level })),
    preferredTechnologies: careerGoal?.preferredLanguages ?? [],
    careerGoalTechnologies:
      careerGoal === null ? [] : careerGoalTechnologies[careerGoal.goal as CareerGoalOption],
    difficulty: {
      preferred: careerGoal?.difficulty ?? "beginner",
      min: "beginner",
      max: "advanced",
    },
  };
}

/**
 * Maps a synced issue onto the engine's IssueCandidate. The only per-issue
 * technology signal available is the repository's dominant language — see
 * ADR-0012 for why this is a documented simplification, not a claim about
 * every technology the issue actually involves.
 */
export function toIssueCandidate({ issue, repository }: IssueWithRepository): IssueCandidate {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description ?? "",
    technologies: repository.primaryLanguage === null ? [] : [repository.primaryLanguage],
    maintainerPreferredSkills:
      repository.manifestStatus === "valid" ? repository.manifestPreferredSkills : [],
    difficulty: issue.difficulty,
    state: issue.state,
    isAssigned: issue.isAssigned,
    isBlocked: issue.isBlocked,
    hasActivePullRequest: issue.hasActivePullRequest,
    allowsExternalContributors:
      issue.allowsExternalContributors && repositoryAllowsExternalContributors(repository),
    updatedAt: issue.githubUpdatedAt,
    clarityScore: issue.clarityScore,
    repository: {
      isActive: repository.isActive,
      activityScore: repository.activityScore,
      maintainerResponsivenessScore: repository.maintainerResponsivenessScore,
      hasContributionManifest: repositoryHasMaintainerApprovedManifest(repository),
    },
  };
}

/**
 * Removes issues the user gave negative feedback on (any verdict except
 * "good match") from the candidate pool before ranking — feedback buttons
 * that visibly do nothing would train users to ignore them (ADR-0014).
 */
export function excludeNegativelyRated(
  items: readonly IssueWithRepository[],
  negativelyRatedGithubIssueIds: readonly number[],
): IssueWithRepository[] {
  const excluded = new Set(negativelyRatedGithubIssueIds);
  return items.filter((item) => !excluded.has(item.issue.githubIssueId));
}

/**
 * A scored issue joined back to the display data IssueCandidate
 * deliberately omits (repository name, URLs — the engine has no business
 * knowing about those).
 */
export interface Recommendation {
  score: RecommendationScore;
  issue: IssueRecord;
  repository: RepositoryRecord;
  /** This user's existing verdict on the issue, or null if unrated (ADR-0014). */
  verdict: RecommendationFeedbackVerdict | null;
}

export interface RecommendationsResult {
  topRecommendations: Recommendation[];
  eligibleCount: number;
  candidateCount: number;
  hasSkills: boolean;
  hasCareerGoal: boolean;
}

/**
 * Computed live on every call — the engine is pure and in-memory, so unlike
 * GitHub/issue sync there is no API cost to justify caching or a manual
 * "Generate" action (see ADR-0012). Always reflects the latest skills,
 * career goal, and curated issues.
 */
export async function getRecommendationsForUser(
  db: Database,
  userId: string,
): Promise<RecommendationsResult> {
  const [userSkills, careerGoal, allIssuesWithRepositories, negativelyRatedIds, feedbackVerdicts] =
    await Promise.all([
      listUserSkillsWithNames(db, userId),
      findCareerGoalByUserId(db, userId),
      listSyncedIssuesWithRepositories(db),
      listNegativelyRatedGithubIssueIds(db, userId),
      listFeedbackVerdictsForUser(db, userId),
    ]);

  const verdictByGithubIssueId = new Map(
    feedbackVerdicts.map((row) => [row.githubIssueId, row.verdict]),
  );
  const manifestFilteredIssues = allIssuesWithRepositories.filter(manifestAllowsIssueOpportunity);
  const issuesWithRepositories = excludeNegativelyRated(manifestFilteredIssues, negativelyRatedIds);

  const byIssueId = new Map(issuesWithRepositories.map((item) => [item.issue.id, item]));
  const profile = buildDeveloperProfile(userSkills, careerGoal);
  const candidates = issuesWithRepositories.map(toIssueCandidate);
  const ranked = rankIssues(profile, candidates);

  const topRecommendations = ranked.recommendations.map((scored) => {
    const original = byIssueId.get(scored.issue.id);
    if (original === undefined) {
      throw new Error(`Recommendation references unknown issue ${scored.issue.id}`);
    }
    return {
      score: scored.score,
      issue: original.issue,
      repository: original.repository,
      verdict: verdictByGithubIssueId.get(original.issue.githubIssueId) ?? null,
    };
  });

  return {
    topRecommendations,
    eligibleCount: ranked.recommendations.length,
    candidateCount: candidates.length,
    hasSkills: userSkills.length > 0,
    hasCareerGoal: careerGoal !== null,
  };
}
