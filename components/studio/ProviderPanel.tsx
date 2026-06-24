"use client";

import { Toggle } from "@/components/ui/Toggle";
import { PROVIDER_GROUPS } from "@/lib/providerMeta";
import type { ProviderConfig } from "@/db/schema";

/**
 * Provider toggles (req 5). Disabling a primary forces the next provider in the
 * failover chain; disabling a whole stage makes those jobs fail visibly.
 */
export function ProviderPanel({
  enabled,
  onChange,
}: {
  enabled: ProviderConfig;
  onChange: (next: ProviderConfig) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-heading">Providers</h3>
      <p className="mt-1 text-xs text-muted">
        Turn providers off to force failover and watch what the service does.
      </p>

      <div className="mt-4 space-y-4">
        {PROVIDER_GROUPS.map((group) => (
          <div key={group.stage}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.providers.map((p, i) => (
                <Toggle
                  key={p.name}
                  id={`prov-${p.name}`}
                  label={`${p.label}${i === 0 ? " · primary" : " · fallback"}`}
                  checked={enabled[p.name] !== false}
                  onChange={(v) => onChange({ ...enabled, [p.name]: v })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
