import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const contributionManifestStatusEnum = pgEnum("contribution_manifest_status", [
  "missing",
  "valid",
  "invalid",
]);

/** How a repository entered the platform: admin curation or maintainer self-submission (ADR-0020). */
export const repositorySourceEnum = pgEnum("repository_source", ["curated", "submitted"]);

/**
 * A curated, admin-approved repository shown to developers as a source of
 * recommendations — distinct from `github_repositories`, which stores a
 * signed-in user's own synced repos. Health fields are computed by
 * @issuefit/repository-health from raw GitHub data (ADR-0010). The three
 * responsiveness fields are measured during issue sync from first-response
 * sampling and are null until that sync has run (ADR-0015) — null always
 * means "not measured yet", never a substituted neutral value.
 */
export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubRepositoryId: bigint("github_repository_id", { mode: "number" }).notNull().unique(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  primaryLanguage: text("primary_language"),
  starsCount: integer("stars_count").notNull(),
  openIssuesCount: integer("open_issues_count").notNull(),
  isActive: boolean("is_active").notNull(),
  activityScore: real("activity_score").notNull(),
  maintainerResponsivenessScore: real("maintainer_responsiveness_score"),
  medianFirstResponseDays: real("median_first_response_days"),
  firstResponseRate: real("first_response_rate"),
  /**
   * Community health file URLs from GitHub's community-profile endpoint and
   * local setup signals from directory listings, stored at curation
   * add/refresh time for the issue briefing (ADR-0017). A null
   * `setupSignalsCheckedAt` means the repository was curated before these
   * were measured and needs a refresh; after measurement, false/null/empty
   * values are measured absences.
   */
  contributingUrl: text("contributing_url"),
  codeOfConductUrl: text("code_of_conduct_url"),
  readmeUrl: text("readme_url"),
  packageManager: text("package_manager"),
  hasDockerCompose: boolean("has_docker_compose"),
  nodeVersion: text("node_version"),
  ciWorkflowNames: text("ci_workflow_names").array(),
  setupSignalsCheckedAt: timestamp("setup_signals_checked_at", { withTimezone: true }),
  /**
   * Open Contribution Manifest v0 snapshot, fetched from
   * `.github/contribution-manifest.yml` during metadata sync (ADR-0016).
   * `invalid` rows keep the raw file plus validation errors so admins can
   * fix the manifest instead of IssueFit silently falling back.
   */
  manifestStatus: contributionManifestStatusEnum("manifest_status").notNull().default("missing"),
  manifestRaw: text("manifest_raw"),
  manifestFetchedAt: timestamp("manifest_fetched_at", { withTimezone: true }),
  manifestValidationErrors: text("manifest_validation_errors").array().notNull().default([]),
  manifestExternalContributions: boolean("manifest_external_contributions"),
  manifestAiPolicy: text("manifest_ai_policy"),
  manifestContributionGuide: text("manifest_contribution_guide"),
  manifestAcceptingContributors: boolean("manifest_accepting_contributors"),
  manifestMentorshipAvailable: text("manifest_mentorship_available"),
  manifestExpectedResponseDays: integer("manifest_expected_response_days"),
  manifestAllowedTypes: text("manifest_allowed_types").array().notNull().default([]),
  manifestPreferredSkills: text("manifest_preferred_skills").array().notNull().default([]),
  manifestDifficulty: text("manifest_difficulty").array().notNull().default([]),
  manifestTestsRequired: boolean("manifest_tests_required"),
  manifestIssueDiscussionRequired: boolean("manifest_issue_discussion_required"),
  manifestDraftPullRequestFirst: boolean("manifest_draft_pull_request_first"),
  /**
   * Maintainer self-submission provenance (ADR-0020). `submitted` rows were
   * added through /projects/submit by a signed-in user with verified push
   * access and a valid, accepting contribution manifest; both fields below
   * stay null for admin-curated rows.
   */
  source: repositorySourceEnum("source").notNull().default("curated"),
  submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  /** Informational curation flags (e.g. "stale", "no_contributing_guide"); admin decides anyway. */
  curationWarnings: text("curation_warnings").array().notNull().default([]),
  /**
   * Gates both the public /projects directory and the recommendation
   * candidate pool. Admin "unlist" sets this false; metadata refresh never
   * flips it back (the upsert excludes it from its conflict update).
   */
  approved: boolean("approved").notNull().default(true),
  htmlUrl: text("html_url").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RepositoryRecord = typeof repositories.$inferSelect;
export type NewRepositoryRecord = typeof repositories.$inferInsert;
