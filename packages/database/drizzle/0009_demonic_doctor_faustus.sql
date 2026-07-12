ALTER TABLE "repositories" ADD COLUMN "contributing_url" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "code_of_conduct_url" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "readme_url" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "package_manager" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "has_docker_compose" boolean;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "node_version" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "ci_workflow_names" text[];--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "setup_signals_checked_at" timestamp with time zone;