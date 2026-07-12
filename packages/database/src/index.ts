export { createDatabaseClient } from "./client.js";
export type { Database, DatabaseClient } from "./client.js";
export {
  findUserByGithubUsername,
  findUserById,
  listWeeklyDigestRecipients,
  setProfileVisibility,
  setWeeklyDigestEmailPreference,
} from "./user-repository.js";
export {
  findGithubProfileByUserId,
  listGithubRepositoriesByUserId,
  replaceGithubRepositories,
  upsertGithubProfile,
} from "./github-sync-repository.js";
export type { NewSyncedRepository } from "./github-sync-repository.js";
export {
  ensureSkills,
  findCareerGoalByUserId,
  findUserSkillById,
  listUserSkillsWithNames,
  setUserSkillLevel,
  upsertCareerGoal,
  upsertProposedUserSkills,
} from "./skills-repository.js";
export type { ProposedUserSkill, UserSkillWithName } from "./skills-repository.js";
export {
  deleteCuratedRepository,
  findCuratedRepositoryById,
  findRepositoryByFullName,
  listCuratedRepositories,
  listPublicProjects,
  setRepositoryApproved,
  updateRepositoryResponsiveness,
  upsertCuratedRepository,
} from "./curated-repository-repository.js";
export type {
  PublicProjectListing,
  RepositoryResponsivenessUpdate,
  UpsertCuratedRepository,
} from "./curated-repository-repository.js";
export {
  countIssuesByRepositoryId,
  listIssuesByRepositoryId,
  listSyncedIssuesWithRepositories,
  replaceIssuesForRepository,
} from "./issue-repository.js";
export type { IssueWithRepository, NewSyncedIssue } from "./issue-repository.js";
export {
  findFeedbackVerdictForUser,
  findSyncedIssueByGithubIssueId,
  listFeedbackVerdictsForUser,
  listFeedbackWithRecommendations,
  listNegativelyRatedGithubIssueIds,
  saveRecommendationFeedback,
  upsertRecommendationSnapshot,
} from "./recommendation-repository.js";
export type {
  FeedbackWithRecommendation,
  RecommendationSnapshotInput,
  SaveRecommendationFeedbackInput,
  UserIssueVerdict,
} from "./recommendation-repository.js";
export {
  findRecommendationDigestDelivery,
  saveRecommendationDigestDelivery,
} from "./recommendation-digest-repository.js";
export type { SaveRecommendationDigestDeliveryInput } from "./recommendation-digest-repository.js";
export {
  findContributionForUserAndIssue,
  isTerminalContributionStatus,
  listContributionCountsByRepository,
  listContributionsForUser,
  startContribution,
  updateContributionDetails,
  updateContributionStatus,
} from "./contribution-repository.js";
export type {
  ContributionDetailsUpdate,
  ContributionWithRecommendation,
  RepositoryContributionCounts,
} from "./contribution-repository.js";
export {
  listGithubTopRepositories,
  replaceGithubTopRepositories,
} from "./top-repositories-repository.js";
export {
  findPublicPortfolioByUsername,
  listPortfolioEntriesForUser,
  setPortfolioEntryPublic,
  updatePortfolioEntry,
} from "./portfolio-repository.js";
export type {
  PortfolioEntryDetail,
  PortfolioEntryUpdate,
  PublicPortfolio,
} from "./portfolio-repository.js";
export { getBetaAnalytics } from "./analytics-repository.js";
export type { BetaAnalytics } from "./analytics-repository.js";
export * from "./schema/index.js";
