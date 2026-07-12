CREATE TYPE "public"."recommendation_feedback_verdict" AS ENUM('good_match', 'too_difficult', 'too_easy', 'not_interested', 'wrong_technology', 'issue_unavailable');--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"verdict" "recommendation_feedback_verdict" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_issue_id" bigint NOT NULL,
	"repository_full_name" text NOT NULL,
	"issue_title" text NOT NULL,
	"issue_html_url" text NOT NULL,
	"match_score" real,
	"match_reasons" text[] DEFAULT '{}' NOT NULL,
	"score_version" text,
	"recommended_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_feedback_recommendation_idx" ON "recommendation_feedback" USING btree ("recommendation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendations_user_issue_idx" ON "recommendations" USING btree ("user_id","github_issue_id");--> statement-breakpoint
CREATE INDEX "recommendations_user_id_idx" ON "recommendations" USING btree ("user_id");