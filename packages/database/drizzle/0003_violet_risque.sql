CREATE TYPE "public"."skill_category" AS ENUM('language');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."skill_source" AS ENUM('github_sync', 'manual');--> statement-breakpoint
CREATE TYPE "public"."career_goal_option" AS ENUM('backend_developer', 'frontend_developer', 'fullstack_developer', 'devops', 'mobile_developer', 'open_source_collaboration', 'other');--> statement-breakpoint
CREATE TYPE "public"."issue_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "skill_category" DEFAULT 'language' NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"level" "skill_level" NOT NULL,
	"confidence_score" real NOT NULL,
	"source" "skill_source" NOT NULL,
	"user_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_goals" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"goal" "career_goal_option" NOT NULL,
	"goal_details" text,
	"preferred_languages" text[] DEFAULT '{}' NOT NULL,
	"preferred_issue_types" text[] DEFAULT '{}' NOT NULL,
	"hours_per_week" integer NOT NULL,
	"difficulty" "issue_difficulty" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_goals" ADD CONSTRAINT "career_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_skills_user_skill_idx" ON "user_skills" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "user_skills_user_id_idx" ON "user_skills" USING btree ("user_id");