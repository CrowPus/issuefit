CREATE TYPE "public"."repository_source" AS ENUM('curated', 'submitted');--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "source" "repository_source" DEFAULT 'curated' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "submitted_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;