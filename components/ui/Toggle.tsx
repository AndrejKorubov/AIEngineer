"use client";

/** Toggle per radios-checkboxes-toggle.md — track + thumb, brand when checked. */
export function Toggle({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-50 ${
          checked ? "bg-brand" : "bg-border-strong"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className={`text-sm ${disabled ? "text-muted" : "text-heading"}`}>{label}</span>
    </label>
  );
}
