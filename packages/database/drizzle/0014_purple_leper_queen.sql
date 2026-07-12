CREATE TYPE "public"."recommendation_digest_delivery_status" AS ENUM('sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TABLE "recommendation_digest_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_started_at" timestamp with time zone NOT NULL,
	"period_ended_at" timestamp with time zone NOT NULL,
	"delivery_mode" text NOT NULL,
	"recommendation_count" integer NOT NULL,
	"status" "recommendation_digest_delivery_status" NOT NULL,
	"error_message" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_digest_email_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendation_digest_deliveries" ADD CONSTRAINT "recommendation_digest_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_digest_user_period_idx" ON "recommendation_digest_deliveries" USING btree ("user_id","period_started_at");--> statement-breakpoint
CREATE INDEX "recommendation_digest_user_id_idx" ON "recommendation_digest_deliveries" USING btree ("user_id");