import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, jobs } from "@/db";
import { inngest } from "@/inngest/client";

/** Manual retry of a failed job — resets it to queued and re-emits the event. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db
    .update(jobs)
    .set({ status: "queued", error: null, attempts: 0, updatedAt: new Date() })
    .where(eq(jobs.id, id));

  await inngest.send({ name: "job/run", data: { jobId: id } });

  return NextResponse.json({ ok: true });
}
