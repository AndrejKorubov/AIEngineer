"use client";

import { useState } from "react";
import useSWR from "swr";
import { RimCard } from "./RimCard";
import type { RimView } from "@/lib/catalog/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DIAMETERS = [16, 17, 18, 19, 20];
const FINISHES = ["silver", "matte black", "gloss black", "gunmetal", "polished", "bronze", "matte white"];

const selectClass =
  "rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-heading shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

/** Rim catalog gallery. Disabled until a car is uploaded; multi-select via parent. */
export function RimGallery({
  enabled,
  selectedIds,
  onToggle,
}: {
  enabled: boolean;
  selectedIds: string[];
  onToggle: (rim: RimView) => void;
}) {
  const [diameter, setDiameter] = useState("");
  const [finish, setFinish] = useState("");
  const [q, setQ] = useState("");

  const params = new URLSearchParams();
  if (diameter) params.set("diameter", diameter);
  if (finish) params.set("finish", finish);
  if (q) params.set("q", q);

  const { data, isLoading } = useSWR<{ rims: RimView[] }>(
    enabled ? `/api/rims?${params.toString()}` : null,
    fetcher,
    { keepPreviousData: true },
  );
  const rims = data?.rims ?? [];

  if (!enabled) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-heading">Upload a car photo to browse rims</p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          The wheel catalog unlocks as soon as your car is loaded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className={selectClass} value={diameter} onChange={(e) => setDiameter(e.target.value)} aria-label="Diameter">
          <option value="">All sizes</option>
          {DIAMETERS.map((d) => (
            <option key={d} value={d}>{d}&quot;</option>
          ))}
        </select>
        <select className={selectClass} value={finish} onChange={(e) => setFinish(e.target.value)} aria-label="Finish">
          <option value="">All finishes</option>
          {FINISHES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          className={`${selectClass} flex-1 min-w-32`}
          placeholder="Search rims…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search rims"
        />
        <span className="ml-auto text-xs text-muted">{rims.length} rims</span>
      </div>

      {rims.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {isLoading ? "Loading…" : "No rims match those filters."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {rims.map((rim) => (
            <RimCard
              key={rim.id}
              rim={rim}
              selected={selectedIds.includes(rim.id)}
              onToggle={() => onToggle(rim)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
