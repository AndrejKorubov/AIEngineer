"use client";

import useSWR from "swr";
import { ResultCard } from "./ResultCard";
import { Badge } from "@/components/ui/Badge";
import type { BatchView, JobView } from "@/lib/clientTypes";
import { TERMINAL } from "@/lib/clientTypes";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ResultsGrid({ batchId }: { batchId: string }) {
  const { data, error } = useSWR<{ batch: BatchView; jobs: JobView[] }>(
    `/api/batches/${batchId}`,
    fetcher,
    {
      refreshInterval: (latest) =>
        latest && latest.jobs.every((j) => TERMINAL.includes(j.status)) ? 0 : 1500,
      keepPreviousData: true,
    },
  );

  const jobs = data?.jobs ?? [];
  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const allTerminal = jobs.length > 0 && jobs.every((j) => TERMINAL.includes(j.status));

  if (!data) {
    return error ? (
      <p className="text-sm text-danger">
        Couldn&apos;t load results — check your connection. Retrying…
      </p>
    ) : (
      <p className="text-sm text-muted">Loading…</p>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning-strong">
          Connection issue — showing the last update, retrying automatically…
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="success">{done} done</Badge>
        {failed > 0 && <Badge tone="danger">{failed} failed</Badge>}
        <Badge tone="neutral">{jobs.length} total</Badge>
        {!allTerminal && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" /> live
          </span>
        )}
        {data.batch.referenceUrls?.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-muted">reference</span>
            {data.batch.referenceUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-7 w-7 rounded-md border border-border object-cover" />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <ResultCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
