ALTER TABLE "repositories" ALTER COLUMN "maintainer_responsiveness_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "median_first_response_days" real;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "first_response_rate" real;--> statement-breakpoint
-- Every pre-ADR-0015 score was the neutral 0.5 placeholder from ADR-0010,
-- not a measurement; null is the honest value until issue sync measures it.
UPDATE "repositories" SET "maintainer_responsiveness_score" = NULL;