CREATE TYPE "public"."contribution_status" AS ENUM('selected', 'preparing', 'working', 'pr_opened', 'changes_requested', 'merged', 'closed', 'abandoned');--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"status" "contribution_status" DEFAULT 'selected' NOT NULL,
	"pr_url" text,
	"branch_name" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contributions_recommendation_idx" ON "contributions" USING btree ("recommendation_id");