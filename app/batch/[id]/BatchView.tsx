"use client";

import useSWR from "swr";
import Link from "next/link";
import { ResultCard } from "./ResultCard";
import type { BatchView as Batch, JobView } from "@/lib/clientTypes";
import { TERMINAL } from "@/lib/clientTypes";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function BatchView({ batchId }: { batchId: string }) {
  const { data } = useSWR<{ batch: Batch; jobs: JobView[] }>(
    `/api/batches/${batchId}`,
    fetcher,
    {
      // Poll until every job reaches a terminal state, then stop.
      refreshInterval: (latest) =>
        latest && latest.jobs.every((j) => TERMINAL.includes(j.status)) ? 0 : 1500,
    },
  );

  const jobs = data?.jobs ?? [];
  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const allTerminal = jobs.length > 0 && jobs.every((j) => TERMINAL.includes(j.status));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← New batch
          </Link>
          <h1 className="mt-1 text-xl font-bold">Generating creatives</h1>
        </div>
        <div className="text-right text-sm text-neutral-400">
          {data ? (
            <>
              <span className="text-neutral-200">{done}</span> done
              {failed > 0 && <span className="ml-2 text-red-400">{failed} failed</span>}
              <span className="ml-2">/ {jobs.length}</span>
              {!allTerminal && <span className="ml-2 animate-pulse text-neutral-500">live</span>}
            </>
          ) : (
            "loading…"
          )}
        </div>
      </div>

      {data?.batch.referenceUrls?.length ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
          <span>Reference style:</span>
          {data.batch.referenceUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-8 w-8 rounded object-cover ring-1 ring-neutral-700" />
          ))}
          {data.batch.styleGuide && <span>· {data.batch.styleGuide.mood}, {data.batch.styleGuide.lighting}</span>}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <ResultCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
}
