import { eq } from "drizzle-orm";
import { db, batches, jobs } from "@/db";
import { analyzeProduct, buildGenerationPlan, buildRimSwapPrompt, generateCreative } from "@/lib/pipeline";
import { maskedRimSwap } from "@/lib/rimSwap";
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

    const [batch] = await step.run("load-batch", () =>
      db.select().from(batches).where(eq(batches.id, job.batchId)),
    );
    if (!batch) throw new Error("batch not found");

    const enabled = batch.providers ?? undefined;

    // Rim mode: composite the chosen rim onto the car. The job carries its own
    // rim snapshot, so no catalog lookup happens here.
    if (batch.mode === "rims") {
      const rim = job.rim;
      if (!rim) throw new Error("rim job has no rim snapshot");

      const { resultUrl, providerUsed: imageUsed } = await step.run("generate-image", async () => {
        try {
          // Production path: detect the wheels and inpaint ONLY that region, so
          // the rest of the car is the original pixels (never redrawn). Output
          // keeps the car photo's exact dimensions — no crop, no padding.
          return await maskedRimSwap({ jobId, carUrl: batch.carUrl!, rim });
        } catch (err) {
          // Fallback: full-image edit (Fal Kontext) if segmentation/inpaint fails.
          console.warn(
            `[rim] masked inpaint failed, falling back to full-image edit: ${err instanceof Error ? err.message : err}`,
          );
          return generateCreative({
            jobId,
            productUrl: batch.carUrl!,
            referenceUrls: [rim.imageUrl],
            editPrompt: buildRimSwapPrompt(rim),
            aspectRatio: batch.aspectRatio,
            preferImage: "fal-flux-kontext",
            enabled,
          });
        }
      });

      await step.run("finish", async () => {
        await db
          .update(jobs)
          .set({
            status: "done",
            resultUrl,
            providersUsed: { image: imageUsed },
            error: null,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, jobId));
      });

      return { jobId, resultUrl };
    }

    // Social mode (existing): requires the shared style guide.
    if (!batch.styleGuide) throw new Error("style guide not ready");

    const { product, providerUsed: visionUsed } = await step.run("analyze-product", () =>
      analyzeProduct(job.productUrl, enabled),
    );

    const { plan, providerUsed: llmUsed } = await step.run("build-plan", () =>
      buildGenerationPlan(product, batch.styleGuide!, enabled),
    );

    const { resultUrl, providerUsed: imageUsed } = await step.run("generate-image", () =>
      generateCreative({
        jobId,
        productUrl: job.productUrl,
        referenceUrls: batch.referenceUrls,
        editPrompt: plan.editPrompt,
        aspectRatio: batch.aspectRatio,
        enabled,
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
          providersUsed: { vision: visionUsed, llm: llmUsed, image: imageUsed },
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    });

    return { jobId, resultUrl };
  },
);
