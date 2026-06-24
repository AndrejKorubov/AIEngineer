"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { providerLabel } from "@/lib/providerMeta";
import type { JobView } from "@/lib/clientTypes";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="text-xs font-medium text-body transition-colors hover:text-heading"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-sm text-heading">{value}</p>
    </div>
  );
}

export function ResultModal({ job, onClose }: { job: JobView; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={job.headline ?? "Creative"} size="xl">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          {job.resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.resultUrl} alt={job.headline ?? ""} className="w-full rounded-lg border border-border" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.productUrl} alt="product" className="w-full rounded-lg border border-border opacity-60" />
          )}
        </div>
        <div className="space-y-3">
          {job.headline && <CopyRow label="Headline" value={job.headline} />}
          {job.caption && <CopyRow label="Caption" value={job.caption} />}
          {job.cta && <CopyRow label="CTA" value={job.cta} />}
          {job.providersUsed && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge tone="neutral">vision: {providerLabel(job.providersUsed.vision)}</Badge>
              <Badge tone="neutral">text: {providerLabel(job.providersUsed.llm)}</Badge>
              <Badge tone="neutral">image: {providerLabel(job.providersUsed.image)}</Badge>
            </div>
          )}
          {job.resultUrl && (
            <a
              href={job.resultUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-medium text-heading underline underline-offset-4 hover:no-underline"
            >
              Open full image ↗
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
