import { eq } from "drizzle-orm";
import { db, batches, jobs } from "@/db";
import { analyzeProduct, buildGenerationPlan, generateCreative } from "@/lib/pipeline";
import { inngest } from "./client";

/**
 * Per-product pipeline. One invocation per product image, capped concurrency to
 * avoid provider rate-limit storms. Each external call is a durable step wrapped
 * in provider failover; Inngest retries transient failures up to 3 times.
 * Terminal failure is written as `failed` so the UI never hangs.
 */
export const jobRun = inngest.createFunction(
  {
    id: "job-run",
    retries: 3,
    concurrency: { limit: 4 },
    triggers: [{ event: "job/run" }],
    onFailure: async ({ event }) => {
      const jobId = event.data.event.data.jobId as string;
      const message = event.data.error?.message ?? "generation failed";
      await db
        .update(jobs)
        .set({ status: "failed", error: message, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
    },
  },
  async ({ event, step, attempt }) => {
    const { jobId } = event.data;

    const job = await step.run("start", async () => {
      const [row] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!row) throw new Error(`job ${jobId} not found`);
      await db
        .update(jobs)
        .set({
          status: attempt > 0 ? "retrying" : "processing",
          attempts: attempt + 1,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
      return row;
    });

    const [batch] = await step.run("load-style-guide", () =>
      db.select().from(batches).where(eq(batches.id, job.batchId)),
    );
    if (!batch?.styleGuide) throw new Error("style guide not ready");

    const product = await step.run("analyze-product", () => analyzeProduct(job.productUrl));

    const plan = await step.run("build-plan", () =>
      buildGenerationPlan(product, batch.styleGuide!),
    );

    const resultUrl = await step.run("generate-image", () =>
      generateCreative({
        jobId,
        productUrl: job.productUrl,
        referenceUrls: batch.referenceUrls,
        editPrompt: plan.editPrompt,
      }),
    );

    await step.run("finish", async () => {
      await db
        .update(jobs)
        .set({
          status: "done",
          plan,
          resultUrl,
          headline: plan.copy.headline,
          caption: plan.copy.caption,
          cta: plan.copy.cta,
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    });

    return { jobId, resultUrl };
  },
);
