CREATE TABLE "github_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bio" text,
	"company" text,
	"location" text,
	"blog" text,
	"public_repos" integer NOT NULL,
	"followers" integer NOT NULL,
	"following" integer NOT NULL,
	"github_created_at" timestamp with time zone,
	"synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_repository_id" bigint NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"primary_language" text,
	"stargazers_count" integer NOT NULL,
	"forks_count" integer NOT NULL,
	"is_fork" boolean NOT NULL,
	"html_url" text NOT NULL,
	"pushed_at" timestamp with time zone,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_profiles" ADD CONSTRAINT "github_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_repositories_user_repo_idx" ON "github_repositories" USING btree ("user_id","github_repository_id");--> statement-breakpoint
CREATE INDEX "github_repositories_user_id_idx" ON "github_repositories" USING btree ("user_id");