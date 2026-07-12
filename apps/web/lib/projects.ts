import type {
  PublicProjectListing,
  RepositoryContributionCounts,
  RepositoryRecord,
} from "@issuefit/database";
import {
  assessContributorReadiness,
  type ContributorReadinessAssessment,
  type ReadinessItemId,
} from "@issuefit/repository-health";

/** Public display labels for the readiness checklist (ADR-0020). */
export const READINESS_ITEM_LABELS: Record<ReadinessItemId, string> = {
  active_development: "Active development",
  readme: "README",
  contributing_guide: "Contributing guide",
  code_of_conduct: "Code of conduct",
  ci_workflows: "CI on pull requests",
  contribution_manifest: "Contribution manifest",
  responsive_maintainers: "Responsive maintainers",
};

/**
 * Maps a stored repository row onto the readiness assessment's honest
 * inputs: rows never refreshed since ADR-0017 (`setupSignalsCheckedAt`
 * null) pass null for the community/setup signals, so they grade as "not
 * measured" instead of falsely failing.
 */
export function readinessForRepository(
  repository: RepositoryRecord,
): ContributorReadinessAssessment {
  const measured = repository.setupSignalsCheckedAt !== null;
  return assessContributorReadiness({
    isActive: repository.isActive,
    hasReadme: measured ? repository.readmeUrl !== null : null,
    hasContributingGuide: measured ? repository.contributingUrl !== null : null,
    hasCodeOfConduct: measured ? repository.codeOfConductUrl !== null : null,
    hasCiWorkflows: measured ? (repository.ciWorkflowNames ?? []).length > 0 : null,
    manifestStatus: repository.manifestStatus,
    manifestAcceptingContributors: repository.manifestAcceptingContributors,
    medianFirstResponseDays: repository.medianFirstResponseDays,
  });
}

export interface DirectoryProject {
  repository: RepositoryRecord;
  openIssueCount: number;
  readiness: ContributorReadinessAssessment;
}

/** Directory order: most contributor-ready first, stars as the tiebreaker. */
export function toDirectoryProjects(listings: readonly PublicProjectListing[]): DirectoryProject[] {
  return listings
    .map((listing) => ({ ...listing, readiness: readinessForRepository(listing.repository) }))
    .sort(
      (a, b) =>
        b.readiness.score - a.readiness.score || b.repository.starsCount - a.repository.starsCount,
    );
}

/**
 * IssueFit top-projects composite (ADR-0021): contributor readiness plus
 * platform activity. A merged contribution through IssueFit is worth 10
 * points, a started one 2 — documented weights, shown on the page, so the
 * ranking rewards being genuinely good to contributors, not stars.
 */
const STARTED_CONTRIBUTION_POINTS = 2;
const MERGED_CONTRIBUTION_POINTS = 10;

export interface IssueFitTopProject extends DirectoryProject {
  startedCount: number;
  mergedCount: number;
  topScore: number;
}

export function rankIssueFitTopProjects(
  listings: readonly PublicProjectListing[],
  contributionCounts: readonly RepositoryContributionCounts[],
  limit: number,
): IssueFitTopProject[] {
  const countsByFullName = new Map(
    contributionCounts.map((counts) => [counts.repositoryFullName, counts]),
  );
  return toDirectoryProjects(listings)
    .map((project) => {
      const counts = countsByFullName.get(project.repository.fullName.toLowerCase());
      const startedCount = counts?.startedCount ?? 0;
      const mergedCount = counts?.mergedCount ?? 0;
      return {
        ...project,
        startedCount,
        mergedCount,
        topScore:
          project.readiness.score +
          startedCount * STARTED_CONTRIBUTION_POINTS +
          mergedCount * MERGED_CONTRIBUTION_POINTS,
      };
    })
    .sort((a, b) => b.topScore - a.topScore || b.repository.starsCount - a.repository.starsCount)
    .slice(0, limit);
}
