"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MAX_W = { md: "max-w-2xl", lg: "max-w-3xl", xl: "max-w-5xl" } as const;

/**
 * Modal per modals.md. Rendered through a portal into <body> so it escapes any
 * ancestor with a `transform` (e.g. the page's animate-rise wrapper) — otherwise
 * `position: fixed` would be contained by that ancestor instead of the viewport,
 * which breaks centering. The panel is capped to the dynamic viewport height and
 * scrolls its own body, so it stays centered and adaptive at any zoom / screen.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: keyof typeof MAX_W;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full ${MAX_W[size]} flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 className="truncate text-base font-semibold text-heading sm:text-lg">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-md p-1.5 text-body transition-colors hover:bg-card-muted hover:text-heading"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
