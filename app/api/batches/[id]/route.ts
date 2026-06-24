import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db, batches, jobs } from "@/db";

/** Polling endpoint: returns the batch + all its jobs as the source of truth for the UI. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [batch] = await db.select().from(batches).where(eq(batches.id, id));
  if (!batch) return NextResponse.json({ error: "not found" }, { status: 404 });

  const jobRows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.batchId, id))
    .orderBy(asc(jobs.createdAt));

  return NextResponse.json({ batch, jobs: jobRows });
}
