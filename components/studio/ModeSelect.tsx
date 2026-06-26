"use client";

import { GENERATORS, type GeneratorId } from "@/lib/generators";

/** Header dropdown that switches which generator the studio runs. */
export function ModeSelect({
  value,
  onChange,
}: {
  value: GeneratorId;
  onChange: (g: GeneratorId) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">Generate</span>
      <select
        aria-label="Generator mode"
        value={value}
        onChange={(e) => onChange(e.target.value as GeneratorId)}
        className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-heading shadow-sm outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        {GENERATORS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label}
          </option>
        ))}
      </select>
    </label>
  );
}
