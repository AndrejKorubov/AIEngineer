"use client";

import type { RimView } from "@/lib/catalog/types";
import { Button } from "@/components/ui/Button";

/** One rim in the gallery: image + meta, a Select toggle, and a Visit-shop link. */
export function RimCard({
  rim,
  selected,
  onToggle,
}: {
  rim: RimView;
  selected: boolean;
  onToggle: () => void;
}) {
  const price = rim.priceCents != null ? `€${Math.round(rim.priceCents / 100)}` : "";

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-card shadow-sm transition-colors ${
        selected ? "border-brand ring-2 ring-brand/30" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className="relative block aspect-square w-full cursor-pointer bg-card-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rim.imageUrl} alt={`${rim.brand ?? ""} ${rim.name}`} className="h-full w-full object-cover" />
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </button>

      <div className="space-y-2 p-3">
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-heading">
            {rim.brand ? `${rim.brand} ${rim.name}` : rim.name}
          </p>
          <p className="text-xs text-muted">
            {rim.diameterInch ? `${rim.diameterInch}" · ` : ""}
            {rim.finish}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-heading">{price}</span>
          <a
            href={rim.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-fg-brand underline underline-offset-2 hover:no-underline"
          >
            Visit shop ↗
          </a>
        </div>
        <Button
          variant={selected ? "secondary" : "tertiary"}
          size="sm"
          className="w-full"
          onClick={onToggle}
        >
          {selected ? "Selected ✓" : "Select"}
        </Button>
      </div>
    </div>
  );
}
