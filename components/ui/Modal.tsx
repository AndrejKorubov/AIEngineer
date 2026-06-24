"use client";

import { useEffect, type ReactNode } from "react";

/** Modal per modals.md — backdrop + container, Esc to close, role=dialog. */
const MAX_W = { md: "max-w-2xl", lg: "max-w-3xl", xl: "max-w-5xl" } as const;

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full ${MAX_W[size]} flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_10px_15px_-3px_rgb(0_0_0/0.15)]`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <h2 className="truncate text-lg font-semibold text-heading">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-3 shrink-0 rounded-md p-1.5 text-body transition-colors hover:bg-card-muted hover:text-heading"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
