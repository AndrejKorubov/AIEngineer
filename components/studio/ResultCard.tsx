"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ResultModal } from "./ResultModal";
import { providerLabel } from "@/lib/providerMeta";
import { aspectClass, DEFAULT_ASPECT, type ImageAspectRatio } from "@/lib/aspect";
import type { JobView, JobStatus } from "@/lib/clientTypes";

const STATUS: Record<JobStatus, { tone: "neutral" | "info" | "warning" | "success" | "danger"; label: string }> = {
  queued: { tone: "neutral", label: "Queued" },
  processing: { tone: "info", label: "Processing" },
  retrying: { tone: "warning", label: "Retrying" },
  done: { tone: "success", label: "Done" },
  failed: { tone: "danger", label: "Failed" },
};

export function ResultCard({
  job,
  aspectRatio = DEFAULT_ASPECT,
}: {
  job: JobView;
  aspectRatio?: ImageAspectRatio;
}) {
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
          className={`relative block ${aspectClass(aspectRatio)} w-full bg-card-muted ${job.status === "done" ? "cursor-zoom-in" : "cursor-default"}`}
        >
          {job.status === "done" && job.resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.resultUrl}
              alt={job.headline ?? "creative"}
              // Rim renders keep the car's framing — show the whole car (contain), don't crop.
              className={`h-full w-full ${job.rim ? "object-contain" : "object-cover"}`}
            />
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
            job.rim ? (
              <>
                <div className="flex items-center gap-2">
                  {/* The rim product that was applied — so the result is identifiable. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={job.rim.imageUrl}
                    alt={job.rim.name}
                    className="h-9 w-9 shrink-0 rounded-md border border-border bg-card-muted object-cover"
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-heading">
                      {job.rim.brand ? `${job.rim.brand} ${job.rim.name}` : job.rim.name}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted">
                      {job.rim.diameterInch ? `${job.rim.diameterInch}" · ` : ""}
                      {job.rim.finish}
                      {job.rim.priceCents != null ? ` · €${Math.round(job.rim.priceCents / 100)}` : ""}
                    </p>
                  </div>
                </div>
                <a
                  href={job.rim.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-block text-xs font-medium text-fg-brand underline underline-offset-2 hover:no-underline"
                >
                  Buy at {job.rim.sourceSite} ↗
                </a>
              </>
            ) : (
              <>
                <p className="line-clamp-1 text-sm font-semibold text-heading">{job.headline}</p>
                <p className="line-clamp-2 text-xs text-body">{job.caption}</p>
                {job.providersUsed?.image && (
                  <p className="text-xs text-muted">image · {providerLabel(job.providersUsed.image)}</p>
                )}
              </>
            )
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
