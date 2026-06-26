"use client";

import { ASPECT_OPTIONS, type AspectRatio } from "@/lib/aspect";

/** Glyph proportions per orientation, so each option previews its own shape. */
const GLYPH: Record<AspectRatio, { w: number; h: number }> = {
  "16:9": { w: 18, h: 11 },
  "1:1": { w: 14, h: 14 },
  "9:16": { w: 11, h: 18 },
};

/**
 * Output orientation for the batch. Segmented control: landscape / square /
 * portrait. The choice is applied to every creative in the batch.
 */
export function OrientationPicker({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange: (next: AspectRatio) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-heading">Orientation</h3>
      <p className="mt-1 text-xs text-muted">Shape of every creative in the batch.</p>

      <div role="radiogroup" aria-label="Output orientation" className="mt-3 grid grid-cols-3 gap-2">
        {ASPECT_OPTIONS.map((opt) => {
          const active = value === opt.value;
          const g = GLYPH[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/30 ${
                active
                  ? "border-brand bg-brand/5 text-heading"
                  : "border-border bg-background text-muted hover:border-border-strong hover:text-heading"
              }`}
            >
              <span className="flex h-5 items-center justify-center">
                <span
                  className={`block rounded-[2px] border ${active ? "border-brand bg-brand/20" : "border-current"}`}
                  style={{ width: g.w, height: g.h }}
                />
              </span>
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] tabular-nums opacity-70">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
