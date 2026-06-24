"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImageDropzone, type Picked } from "./ImageDropzone";
import { ProviderPanel } from "./ProviderPanel";
import { ResultsGrid } from "./ResultsGrid";
import { HistoryList } from "./HistoryList";
import { Button } from "@/components/ui/Button";
import { ALL_PROVIDER_NAMES } from "@/lib/providerMeta";
import type { ProviderConfig } from "@/db/schema";

function loadProviders(): ProviderConfig {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("providers") ?? "{}");
  } catch {
    return {};
  }
}

export function Studio() {
  const [products, setProducts] = useState<Picked[]>([]);
  const [references, setReferences] = useState<Picked[]>([]);
  const [providers, setProviders] = useState<ProviderConfig>(loadProviders);
  const [activeBatch, setActiveBatch] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const canSubmit = products.length >= 1 && references.length >= 1 && !busy;

  function setProvidersPersisted(next: ProviderConfig) {
    setProviders(next);
    localStorage.setItem("providers", JSON.stringify(next));
  }

  async function uploadAll(items: Picked[]) {
    return Promise.all(
      items.map(async ({ file }) => {
        const res = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        return res.url;
      }),
    );
  }

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const [productUrls, referenceUrls] = await Promise.all([
        uploadAll(products),
        uploadAll(references),
      ]);
      // Only send explicit on/off for known providers.
      const providerConfig: ProviderConfig = {};
      for (const name of ALL_PROVIDER_NAMES) providerConfig[name] = providers[name] !== false;

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productUrls, referenceUrls, providers: providerConfig }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed to create batch");
      const { batchId } = await res.json();
      setActiveBatch(batchId);
      setHistoryKey((k) => k + 1);
      // Clear the inputs so the same set can't be submitted again by mistake.
      [...products, ...references].forEach((p) => URL.revokeObjectURL(p.preview));
      setProducts([]);
      setReferences([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* Left column: inputs + providers + history */}
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="space-y-5">
            <ImageDropzone
              label="Product images"
              hint="1–20, one creative each"
              items={products}
              onChange={setProducts}
              max={20}
            />
            <ImageDropzone
              label="Reference image(s)"
              hint="1–2 · sets the style"
              items={references}
              onChange={setReferences}
              max={2}
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <Button className="mt-4 w-full" onClick={onGenerate} disabled={!canSubmit}>
            {busy
              ? "Uploading & queuing…"
              : `Generate ${products.length || ""} creative${products.length === 1 ? "" : "s"}`}
          </Button>
        </div>

        <ProviderPanel enabled={providers} onChange={setProvidersPersisted} />
        <HistoryList activeId={activeBatch} onSelect={setActiveBatch} refreshKey={historyKey} />
      </div>

      {/* Right column: live results for the active batch */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {activeBatch ? (
          <ResultsGrid batchId={activeBatch} />
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-heading">No batch selected</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Upload product photos and a reference look, then hit Generate. Results stream in here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
