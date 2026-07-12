CREATE TYPE "public"."issue_state" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"github_issue_id" bigint NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"labels" text[] DEFAULT '{}' NOT NULL,
	"state" "issue_state" NOT NULL,
	"difficulty" "issue_difficulty" NOT NULL,
	"clarity_score" real NOT NULL,
	"is_blocked" boolean NOT NULL,
	"is_assigned" boolean NOT NULL,
	"has_active_pull_request" boolean DEFAULT false NOT NULL,
	"allows_external_contributors" boolean DEFAULT true NOT NULL,
	"comments_count" integer NOT NULL,
	"html_url" text NOT NULL,
	"github_created_at" timestamp with time zone NOT NULL,
	"github_updated_at" timestamp with time zone NOT NULL,
	"github_closed_at" timestamp with time zone,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_github_issue_id_unique" UNIQUE("github_issue_id")
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issues_repository_id_idx" ON "issues" USING btree ("repository_id");