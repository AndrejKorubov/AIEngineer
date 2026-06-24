"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ResultModal } from "./ResultModal";
import { providerLabel } from "@/lib/providerMeta";
import type { JobView, JobStatus } from "@/lib/clientTypes";

const STATUS: Record<JobStatus, { tone: "neutral" | "info" | "warning" | "success" | "danger"; label: string }> = {
  queued: { tone: "neutral", label: "Queued" },
  processing: { tone: "info", label: "Processing" },
  retrying: { tone: "warning", label: "Retrying" },
  done: { tone: "success", label: "Done" },
  failed: { tone: "danger", label: "Failed" },
};

export function ResultCard({ job }: { job: JobView }) {
  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const inFlight = ["queued", "processing", "retrying"].includes(job.status);
  const s = STATUS[job.status];

  async function onRetry() {
    setRetrying(true);
    await fetch(`/api/jobs/${job.id}/retry`, { method: "POST" });
    setTimeout(() => setRetrying(false), 2000);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <button
          onClick={() => job.status === "done" && setOpen(true)}
          className={`relative block aspect-square w-full bg-card-muted ${job.status === "done" ? "cursor-zoom-in" : "cursor-default"}`}
        >
          {job.status === "done" && job.resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.resultUrl} alt={job.headline ?? "creative"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.productUrl} alt="product" className="h-20 w-20 rounded-lg object-cover opacity-40" />
              {inFlight && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-heading" />
              )}
              {job.status === "failed" && (
                <span className="px-3 text-center text-xs text-danger">{job.error ?? "generation failed"}</span>
              )}
            </div>
          )}
          <span className="absolute left-2 top-2">
            <Badge tone={s.tone}>
              {s.label}
              {job.status === "retrying" && job.attempts > 0 ? ` (${job.attempts})` : ""}
            </Badge>
          </span>
        </button>

        <div className="space-y-2 p-3">
          {job.status === "done" ? (
            <>
              <p className="line-clamp-1 text-sm font-semibold text-heading">{job.headline}</p>
              <p className="line-clamp-2 text-xs text-body">{job.caption}</p>
              {job.providersUsed?.image && (
                <p className="text-xs text-muted">image · {providerLabel(job.providersUsed.image)}</p>
              )}
            </>
          ) : job.status === "failed" ? (
            <Button variant="secondary" size="sm" className="w-full" onClick={onRetry} disabled={retrying}>
              {retrying ? "Retrying…" : "Retry"}
            </Button>
          ) : (
            <p className="text-xs text-muted">Working on your creative…</p>
          )}
        </div>
      </div>

      {open && <ResultModal job={job} onClose={() => setOpen(false)} />}
    </>
  );
}
