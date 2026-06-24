"use client";

import useSWR from "swr";
import type { HistoryItem } from "@/lib/clientTypes";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Persistent history (req 4) — past batches from Neon, click to reopen inline. */
export function HistoryList({
  activeId,
  onSelect,
  refreshKey,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
  refreshKey: number;
}) {
  const { data } = useSWR<{ batches: HistoryItem[] }>(
    ["/api/batches", refreshKey],
    () => fetcher("/api/batches"),
    { refreshInterval: 5000 },
  );
  const batches = data?.batches ?? [];

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-heading">History</h3>
      <p className="mt-1 text-xs text-muted">Every batch you generate is saved here.</p>

      <div className="mt-4 space-y-2">
        {batches.length === 0 && <p className="text-sm text-muted">No batches yet.</p>}
        {batches.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
              activeId === b.id
                ? "border-border-strong bg-card-muted"
                : "border-border bg-card hover:bg-card-muted"
            }`}
          >
            <div className="flex -space-x-2">
              {b.thumbs.slice(0, 3).map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={t}
                  alt=""
                  className="h-8 w-8 rounded-md border border-border object-cover"
                />
              ))}
              {b.thumbs.length === 0 && <div className="h-8 w-8 rounded-md bg-card-muted" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-body">
                {new Date(b.createdAt).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs">
                <span className="text-success-strong">{b.done} done</span>
                {b.failed > 0 && <span className="text-danger-strong"> · {b.failed} failed</span>}
                <span className="text-muted"> · {b.total} total</span>
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
