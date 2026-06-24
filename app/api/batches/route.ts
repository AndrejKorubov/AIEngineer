import { NextResponse } from "next/server";
import { z } from "zod";
import { db, batches, jobs } from "@/db";
import { inngest } from "@/inngest/client";

const BodySchema = z.object({
  productUrls: z.array(z.string().url()).min(1).max(20),
  referenceUrls: z.array(z.string().url()).min(1).max(2),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { productUrls, referenceUrls } = parsed.data;

  const [batch] = await db
    .insert(batches)
    .values({ referenceUrls, status: "queued" })
    .returning({ id: batches.id });

  await db
    .insert(jobs)
    .values(productUrls.map((productUrl) => ({ batchId: batch.id, productUrl })));

  await inngest.send({ name: "batch/created", data: { batchId: batch.id } });

  return NextResponse.json({ batchId: batch.id });
}
