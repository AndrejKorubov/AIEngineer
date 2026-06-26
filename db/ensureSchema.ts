import { neon } from "@neondatabase/serverless";

/**
 * Idempotent runtime schema bootstrap. A fresh deploy against an empty database
 * would otherwise have no tables (the build step doesn't migrate, and the
 * drizzle journal isn't committed). Running `CREATE ... IF NOT EXISTS` on first
 * DB use makes a fresh deploy self-heal; it's a no-op on an existing database.
 * Memoized so it runs at most once per warm instance.
 */
let ran: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ran) ran = run();
  return ran;
}

async function run(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS "batches" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "status" text DEFAULT 'queued' NOT NULL,
      "reference_urls" jsonb NOT NULL,
      "aspect_ratio" text DEFAULT '16:9' NOT NULL,
      "style_guide" jsonb,
      "providers" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
  // Backfill for databases created before the orientation option existed.
  await sql`ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "aspect_ratio" text DEFAULT '16:9' NOT NULL`;
  // Backfill for the rim-swap generator mode.
  await sql`ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "mode" text DEFAULT 'social' NOT NULL`;
  await sql`ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "car_url" text`;
  await sql`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "rim" jsonb`;
  await sql`
    CREATE TABLE IF NOT EXISTS "jobs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "batch_id" uuid NOT NULL,
      "product_url" text NOT NULL,
      "status" text DEFAULT 'queued' NOT NULL,
      "attempts" integer DEFAULT 0 NOT NULL,
      "plan" jsonb,
      "result_url" text,
      "headline" text,
      "caption" text,
      "cta" text,
      "providers_used" jsonb,
      "error" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_batch_id_batches_id_fk') THEN
        ALTER TABLE "jobs" ADD CONSTRAINT "jobs_batch_id_batches_id_fk"
          FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade;
      END IF;
    END $$;`;
  await sql`CREATE INDEX IF NOT EXISTS "jobs_batch_id_idx" ON "jobs" ("batch_id")`;
}
