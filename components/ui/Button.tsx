"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "brand" | "secondary" | "tertiary" | "ghost" | "danger";
type Size = "sm" | "base" | "lg";

const SIZE: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  base: "text-sm px-4 py-2",
  lg: "text-sm px-6 py-2.5",
};

const VARIANT: Record<Variant, string> = {
  brand:
    "bg-brand text-brand-foreground border-transparent hover:bg-brand-strong focus-visible:ring-brand/30",
  secondary:
    "bg-card-muted text-body border-border hover:bg-card-muted/70 hover:text-heading focus-visible:ring-border",
  tertiary:
    "bg-card text-body border-border hover:bg-card-muted hover:text-heading focus-visible:ring-border",
  ghost:
    "bg-transparent text-heading border-transparent hover:bg-card-muted focus-visible:ring-border",
  danger:
    "bg-danger text-white border-transparent hover:bg-danger-strong focus-visible:ring-danger/30",
};

// Glint per buttons.md (skip for ghost).
const GLINT =
  "var(--shadow-2xs, 0 1px rgb(0 0 0 / 0.05)), inset var(--glint-400) 0 6px 0px -5px, var(--glint-700) 0 4px 10px -5px";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = "brand", size = "base", className = "", style, ...props }, ref) {
  const glint = variant === "ghost" ? undefined : { boxShadow: GLINT };
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${VARIANT[variant]} ${className}`}
      style={{ ...glint, ...style }}
      {...props}
    />
  );
});
