"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import type { Picked } from "./ImageDropzone";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

/** Single-image picker for the car photo (click / drag-drop / paste). */
export function CarDropzone({
  value,
  onChange,
}: {
  value: Picked | null;
  onChange: (p: Picked | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function set(file: File | undefined) {
    if (!file || !ACCEPT.includes(file.type)) return;
    if (value) URL.revokeObjectURL(value.preview);
    onChange({ file, preview: URL.createObjectURL(file) });
  }
  function clear() {
    if (value) URL.revokeObjectURL(value.preview);
    onChange(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium text-heading">Car photo</label>
        <span className="text-xs text-muted">1 image · side or 3/4 view works best</span>
      </div>

      {value ? (
        <div className="group relative w-full overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.preview} alt="car" className="aspect-video w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            aria-label="Remove car photo"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-body shadow-sm transition-colors hover:bg-danger hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          tabIndex={0}
          onPaste={(e: ClipboardEvent) => {
            const f = e.clipboardData.files[0];
            if (f) {
              e.preventDefault();
              set(f);
            }
          }}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            set(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border border-dashed p-6 text-center outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-border ${
            dragOver ? "border-brand bg-card-muted" : "border-border-strong bg-card hover:bg-card-muted"
          }`}
        >
          <p className="text-sm text-body">Click, drag-drop, or paste a car photo</p>
          <p className="mt-0.5 text-xs text-muted">PNG · JPG · WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={(e) => {
              set(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
