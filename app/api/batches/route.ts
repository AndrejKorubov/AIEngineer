import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, inArray } from "drizzle-orm";
import { db, batches, jobs } from "@/db";
import { ensureSchema } from "@/db/ensureSchema";
import { inngest } from "@/inngest/client";

/**
 * Only accept image URLs that live on our Vercel Blob public store (where the
 * client upload always lands). This blocks server-side SSRF: without it a caller
 * could make us fetch arbitrary/internal URLs (the pipeline downloads these).
 */
function isBlobUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
const blobUrl = z.string().url().refine(isBlobUrl, "must be a Vercel Blob URL");

const BodySchema = z.object({
  productUrls: z.array(blobUrl).min(1).max(20),
  referenceUrls: z.array(blobUrl).min(1).max(2),
  providers: z.record(z.string(), z.boolean()).optional(),
});

export async function POST(request: Request) {
  await ensureSchema();
  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { productUrls, referenceUrls, providers } = parsed.data;

  const [batch] = await db
    .insert(batches)
    .values({ referenceUrls, providers, status: "queued" })
    .returning({ id: batches.id });

  await db
    .insert(jobs)
    .values(productUrls.map((productUrl) => ({ batchId: batch.id, productUrl })));

  await inngest.send({ name: "batch/created", data: { batchId: batch.id } });

  return NextResponse.json({ batchId: batch.id });
}

/** History: recent batches with lightweight job summaries for thumbnails/counts. */
export async function GET() {
  await ensureSchema();
  const recent = await db
    .select()
    .from(batches)
    .orderBy(desc(batches.createdAt))
    .limit(20);

  if (recent.length === 0) return NextResponse.json({ batches: [] });

  const ids = recent.map((b) => b.id);
  const allJobs = await db
    .select({
      id: jobs.id,
      batchId: jobs.batchId,
      status: jobs.status,
      resultUrl: jobs.resultUrl,
      productUrl: jobs.productUrl,
    })
    .from(jobs)
    .where(inArray(jobs.batchId, ids));

  const byBatch = new Map<string, typeof allJobs>();
  for (const j of allJobs) {
    const list = byBatch.get(j.batchId) ?? [];
    list.push(j);
    byBatch.set(j.batchId, list);
  }

  const result = recent.map((b) => {
    const js = byBatch.get(b.id) ?? [];
    return {
      id: b.id,
      status: b.status,
      createdAt: b.createdAt,
      total: js.length,
      done: js.filter((j) => j.status === "done").length,
      failed: js.filter((j) => j.status === "failed").length,
      thumbs: js.map((j) => j.resultUrl ?? j.productUrl).slice(0, 4),
    };
  });

  return NextResponse.json({ batches: result });
}
