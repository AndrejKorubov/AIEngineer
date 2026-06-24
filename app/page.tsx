"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type Picked = { file: File; preview: string };

function FilePicker({
  label,
  hint,
  multiple,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  multiple: boolean;
  items: Picked[];
  onChange: (items: Picked[]) => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-xs text-neutral-500">{hint}</span>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-neutral-100 hover:file:bg-neutral-600"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onChange(files.map((file) => ({ file, preview: URL.createObjectURL(file) })));
        }}
      />
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((it, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={it.preview}
              alt=""
              className="h-16 w-16 rounded-md object-cover ring-1 ring-neutral-700"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Picked[]>([]);
  const [references, setReferences] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    products.length >= 1 && references.length >= 1 && references.length <= 2 && !busy;

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
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productUrls, referenceUrls }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed to create batch");
      const { batchId } = await res.json();
      router.push(`/batch/${batchId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Batch Creative Studio</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Upload product photos and a reference look. We generate one styled social creative per
        product — streaming in as they finish.
      </p>

      <div className="mt-8 space-y-4">
        <FilePicker
          label="Product images"
          hint="1–20, one creative each"
          multiple
          items={products}
          onChange={setProducts}
        />
        <FilePicker
          label="Reference image(s)"
          hint="1–2 · sets the style"
          multiple
          items={references}
          onChange={setReferences}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={!canSubmit}
        className="mt-6 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Uploading & queuing…" : `Generate ${products.length || ""} creative${products.length === 1 ? "" : "s"}`}
      </button>
    </main>
  );
}
