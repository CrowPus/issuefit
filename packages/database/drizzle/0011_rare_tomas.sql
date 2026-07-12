CREATE TABLE "portfolio_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"skills_demonstrated" text[] DEFAULT '{}' NOT NULL,
	"review_rounds" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "skills_demonstrated" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_entries_contribution_idx" ON "portfolio_entries" USING btree ("contribution_id");