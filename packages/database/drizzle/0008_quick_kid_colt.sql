CREATE TYPE "public"."contribution_manifest_status" AS ENUM('missing', 'valid', 'invalid');--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_status" "contribution_manifest_status" DEFAULT 'missing' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_raw" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_validation_errors" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_external_contributions" boolean;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_ai_policy" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_contribution_guide" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_accepting_contributors" boolean;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_mentorship_available" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_expected_response_days" integer;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_allowed_types" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_preferred_skills" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_difficulty" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_tests_required" boolean;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_issue_discussion_required" boolean;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "manifest_draft_pull_request_first" boolean;