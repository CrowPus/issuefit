CREATE TABLE "github_top_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rank" integer NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"primary_language" text,
	"stars_count" integer NOT NULL,
	"html_url" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "github_top_repositories_rank_idx" ON "github_top_repositories" USING btree ("rank");