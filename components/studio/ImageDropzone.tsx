"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";

export type Picked = { file: File; preview: string };

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

/**
 * Image picker that ACCUMULATES across selections (fixes the wipe-on-reselect
 * bug), and also supports drag-drop and paste. Each thumbnail has a remove (×).
 */
export function ImageDropzone({
  label,
  hint,
  items,
  onChange,
  max,
}: {
  label: string;
  hint: string;
  items: Picked[];
  onChange: (next: Picked[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function add(files: File[]) {
    const images = files.filter((f) => ACCEPT.includes(f.type));
    if (images.length === 0) return;
    const next = [...items, ...images.map((file) => ({ file, preview: URL.createObjectURL(file) }))];
    onChange(max ? next.slice(0, max) : next);
  }

  function remove(i: number) {
    URL.revokeObjectURL(items[i].preview);
    onChange(items.filter((_, idx) => idx !== i));
  }

  function onPaste(e: ClipboardEvent) {
    const files = Array.from(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      add(files);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    add(Array.from(e.dataTransfer.files));
  }

  const atMax = max != null && items.length >= max;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-heading">{label}</label>
        <span className="text-xs text-muted">{hint}</span>
      </div>

      <div
        tabIndex={0}
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !atMax && inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border border-dashed p-4 text-center outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-border ${
          dragOver ? "border-brand bg-card-muted" : "border-border-strong bg-card"
        } ${atMax ? "cursor-not-allowed opacity-60" : "hover:bg-card-muted"}`}
      >
        <p className="text-sm text-body">
          {atMax ? "Limit reached" : "Click, drag-drop, or paste images"}
        </p>
        <p className="mt-0.5 text-xs text-muted">PNG · JPG · WEBP</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            // Reset so picking the same file again re-fires onChange.
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((it, i) => (
            <div key={i} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.preview}
                alt=""
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                aria-label="Remove image"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-body shadow-sm transition-colors hover:bg-danger hover:text-white"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
