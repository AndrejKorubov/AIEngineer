import type { ReactNode } from "react";

type Tone = "neutral" | "brand" | "success" | "danger" | "warning" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-card-muted text-heading border-border",
  brand: "bg-card-muted text-heading border-border",
  success: "bg-success-soft text-success-strong border-success/30",
  danger: "bg-danger-soft text-danger-strong border-danger/30",
  warning: "bg-warning-soft text-warning-strong border-warning/30",
  info: "bg-info-soft text-info-strong border-info/30",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
