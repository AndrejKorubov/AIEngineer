import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, jobs } from "@/db";
import { ensureSchema } from "@/db/ensureSchema";
import { inngest } from "@/inngest/client";

/** Manual retry of a failed job — resets it to queued and re-emits the event. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Only failed jobs can be retried — prevents re-queuing in-flight/done jobs
  // (and the spam vector of hammering this endpoint).
  if (job.status !== "failed") {
    return NextResponse.json(
      { error: `cannot retry a job with status "${job.status}"` },
      { status: 409 },
    );
  }

  await db
    .update(jobs)
    .set({ status: "queued", error: null, attempts: 0, updatedAt: new Date() })
    .where(eq(jobs.id, id));

  await inngest.send({ name: "job/run", data: { jobId: id } });

  return NextResponse.json({ ok: true });
}
