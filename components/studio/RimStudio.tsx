"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { CarDropzone } from "./CarDropzone";
import { RimGallery } from "./RimGallery";
import { ResultsGrid } from "./ResultsGrid";
import { HistoryList } from "./HistoryList";
import { Button } from "@/components/ui/Button";
import type { Picked } from "./ImageDropzone";
import type { RimView } from "@/lib/catalog/types";
import { closestImageAspect, type ImageAspectRatio } from "@/lib/aspect";

/**
 * Measure the car and return the nearest supported aspect ratio. The production
 * masked-inpaint path keeps the car's exact dimensions, so this only feeds the
 * rare full-image fallback (Kontext) so it doesn't reframe wildly.
 */
function measureAspect(src: string): Promise<ImageAspectRatio> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(closestImageAspect(im.naturalWidth, im.naturalHeight));
    im.onerror = () => resolve("16:9");
    im.src = src;
  });
}

/**
 * Re-encode the car photo before upload so the pipeline gets a clean input:
 *  - bakes in EXIF orientation (phone photos are often rotated via metadata;
 *    the segmentation/inpaint models read raw pixels and would otherwise mask
 *    the wheels in the wrong place), and
 *  - caps the long side so huge 12MP shots don't shrink the wheels to nothing.
 * Falls back to the original file if the canvas path is unavailable.
 */
async function normalizeCar(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.92));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Rim-swap generator: upload a car, multi-select alloy wheels from the catalog,
 * and render the car wearing each selected rim (one job per rim, fanned out).
 */
export function RimStudio() {
  const [car, setCar] = useState<Picked | null>(null);
  const [selected, setSelected] = useState<RimView[]>([]);
  const [activeBatch, setActiveBatch] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const selectedIds = selected.map((s) => s.id);

  function toggle(rim: RimView) {
    setSelected((cur) =>
      cur.some((s) => s.id === rim.id) ? cur.filter((s) => s.id !== rim.id) : [...cur, rim],
    );
  }

  async function onGenerate() {
    if (!car || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // Normalize orientation + size first (EXIF-rotated phone photos otherwise
      // make the wheel mask land in the wrong place), then upload.
      const normalized = await normalizeCar(car.file);
      const [res, aspectRatio] = await Promise.all([
        upload(normalized.name, normalized, { access: "public", handleUploadUrl: "/api/blob/upload" }),
        measureAspect(car.preview),
      ]);
      const r = await fetch("/api/batches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "rims",
          carUrl: res.url,
          rimIds: selectedIds,
          aspectRatio,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "failed to create batch");
      const { batchId } = await r.json();
      setActiveBatch(batchId);
      setHistoryKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const n = selected.length;
  const canSubmit = !!car && n >= 1 && !busy;
  const buttonLabel = busy
    ? "Uploading & queuing…"
    : !car
      ? "Upload a car photo"
      : n === 0
        ? "Select at least one rim"
        : `Render ${n} rim look${n === 1 ? "" : "s"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* Left column: car + selection + orientation + history */}
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <CarDropzone value={car} onChange={setCar} />

          {selected.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Selected rims ({selected.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card-muted px-2 py-1 text-xs text-heading"
                  >
                    {s.brand} {s.name} {s.diameterInch}&quot;
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      aria-label={`Remove ${s.name}`}
                      className="text-muted transition-colors hover:text-danger"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <Button className="mt-4 w-full" onClick={onGenerate} disabled={!canSubmit}>
            {buttonLabel}
          </Button>
          <p className="mt-2 text-xs text-muted">
            Visual preview only — not a fitment guarantee. Confirm size &amp; bolt pattern with the retailer.
          </p>
        </div>

        <HistoryList mode="rims" activeId={activeBatch} onSelect={setActiveBatch} refreshKey={historyKey} />
      </div>

      {/* Right column: gallery, or results once a batch is active */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {activeBatch ? (
          <div>
            <button
              onClick={() => setActiveBatch(null)}
              className="mb-4 text-sm text-body underline-offset-4 hover:underline"
            >
              ← Browse rims
            </button>
            <ResultsGrid batchId={activeBatch} />
          </div>
        ) : (
          <RimGallery enabled={!!car} selectedIds={selectedIds} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}
