import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { StyleGuide, GenerationPlan } from "@/lib/schemas";

export type BatchStatus = "queued" | "processing" | "done" | "failed";
export type JobStatus = "queued" | "processing" | "retrying" | "done" | "failed";

/** Which providers the user enabled for a batch (provider name -> on/off). */
export type ProviderConfig = Record<string, boolean>;
/** Which provider actually handled each pipeline stage for a job. */
export type ProvidersUsed = { vision?: string; llm?: string; image?: string };

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").$type<BatchStatus>().notNull().default("queued"),
  referenceUrls: jsonb("reference_urls").$type<string[]>().notNull(),
  // Analyzed ONCE per batch and reused by every job — the shared style guide.
  styleGuide: jsonb("style_guide").$type<StyleGuide>(),
  // Enabled-provider map sent from the UI; filters the failover lists.
  providers: jsonb("providers").$type<ProviderConfig>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  productUrl: text("product_url").notNull(),
  status: text("status").$type<JobStatus>().notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  plan: jsonb("plan").$type<GenerationPlan>(),
  resultUrl: text("result_url"),
  headline: text("headline"),
  caption: text("caption"),
  cta: text("cta"),
  providersUsed: jsonb("providers_used").$type<ProvidersUsed>(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Batch = typeof batches.$inferSelect;
export type Job = typeof jobs.$inferSelect;
