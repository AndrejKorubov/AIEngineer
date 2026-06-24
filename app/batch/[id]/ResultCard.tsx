"use client";

import { useState } from "react";
import type { JobView, JobStatus } from "@/lib/clientTypes";

const STATUS_STYLE: Record<JobStatus, string> = {
  queued: "bg-neutral-700 text-neutral-200",
  processing: "bg-blue-500/20 text-blue-300",
  retrying: "bg-amber-500/20 text-amber-300",
  done: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  retrying: "Retrying",
  done: "Done",
  failed: "Failed",
};

export function ResultCard({ job }: { job: JobView }) {
  const [retrying, setRetrying] = useState(false);
  const inFlight = job.status === "queued" || job.status === "processing" || job.status === "retrying";

  async function onRetry() {
    setRetrying(true);
    await fetch(`/api/jobs/${job.id}/retry`, { method: "POST" });
    // SWR poll on the parent will pick the new status up; reset local flag shortly after.
    setTimeout(() => setRetrying(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className="relative aspect-square bg-neutral-900">
        {job.status === "done" && job.resultUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.resultUrl} alt={job.headline ?? "creative"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={job.productUrl} alt="product" className="h-20 w-20 rounded-lg object-cover opacity-40" />
            {inFlight && <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />}
            {job.status === "failed" && <span className="text-xs text-red-400">{job.error ?? "generation failed"}</span>}
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[job.status]}`}>
          {STATUS_LABEL[job.status]}
          {job.status === "retrying" && job.attempts > 0 ? ` (${job.attempts})` : ""}
        </span>
      </div>

      <div className="space-y-1 p-3">
        {job.status === "done" ? (
          <>
            <p className="text-sm font-semibold leading-snug">{job.headline}</p>
            <p className="text-xs text-neutral-400">{job.caption}</p>
            {job.cta && <p className="text-xs font-medium text-neutral-200">→ {job.cta}</p>}
          </>
        ) : job.status === "failed" ? (
          <button
            onClick={onRetry}
            disabled={retrying}
            className="w-full rounded-md bg-neutral-700 px-3 py-1.5 text-xs font-medium hover:bg-neutral-600 disabled:opacity-50"
          >
            {retrying ? "Retrying…" : "Retry"}
          </button>
        ) : (
          <p className="text-xs text-neutral-500">Working on your creative…</p>
        )}
      </div>
    </div>
  );
}
