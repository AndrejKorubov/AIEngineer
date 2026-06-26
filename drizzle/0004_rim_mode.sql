ALTER TABLE "batches" ADD COLUMN "mode" text DEFAULT 'social' NOT NULL;
ALTER TABLE "batches" ADD COLUMN "car_url" text;
ALTER TABLE "jobs" ADD COLUMN "rim" jsonb;