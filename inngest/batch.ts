import { eq } from "drizzle-orm";
import { db, batches, jobs } from "@/db";
import { analyzeReference } from "@/lib/pipeline";
import { inngest } from "./client";

/**
 * Batch orchestrator: analyze the reference ONCE into a shared style guide,
 * then fan out one `job/run` event per product. Each step is durable and
 * retried independently by Inngest.
 */
export const batchCreated = inngest.createFunction(
  { id: "batch-created", retries: 3, triggers: [{ event: "batch/created" }] },
  async ({ event, step }) => {
    const { batchId } = event.data;

    const batch = await step.run("load-batch", async () => {
      const [row] = await db.select().from(batches).where(eq(batches.id, batchId));
      if (!row) throw new Error(`batch ${batchId} not found`);
      return row;
    });

    // Analyze the reference image(s) a single time; reused by every job.
    const styleGuide = await step.run("analyze-reference", () =>
      analyzeReference(batch.referenceUrls),
    );

    await step.run("save-style-guide", async () => {
      await db
        .update(batches)
        .set({ styleGuide, status: "processing" })
        .where(eq(batches.id, batchId));
    });

    const jobIds = await step.run("load-jobs", async () => {
      const rows = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.batchId, batchId));
      return rows.map((r) => r.id);
    });

    // Fan out — each job runs concurrently in its own function invocation.
    await step.sendEvent(
      "fan-out-jobs",
      jobIds.map((jobId) => ({ name: "job/run" as const, data: { jobId } })),
    );

    return { batchId, jobs: jobIds.length };
  },
);
