import { NextResponse } from "next/server";
import { activeCatalog } from "@/lib/catalog";

/** Gallery feed — source-agnostic; v1 returns the placeholder catalog. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const diaRaw = Number(sp.get("diameter"));
  const pageRaw = Number(sp.get("page"));
  const diameter = Number.isFinite(diaRaw) && diaRaw > 0 ? diaRaw : undefined;
  const finish = sp.get("finish") || undefined;
  const q = sp.get("q") || undefined;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { rims, hasMore } = await activeCatalog.list({ filters: { diameter, finish, q }, page });
  return NextResponse.json({ rims, hasMore, page });
}
