ALTER TABLE "batches" ADD COLUMN "providers" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "providers_used" jsonb;