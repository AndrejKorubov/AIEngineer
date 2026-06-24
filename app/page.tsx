"use client";

import { useState } from "react";
import { Studio } from "@/components/studio/Studio";
import { HowItWasBuilt } from "@/components/HowItWasBuilt";
import { CodeSection } from "@/components/CodeSection";

type Tab = "product" | "how" | "code";

const TABS: { id: Tab; label: string }[] = [
  { id: "product", label: "The product" },
  { id: "how", label: "How it was built" },
  { id: "code", label: "The code" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("product");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-heading">Batch Creative Studio</h1>
            <p className="text-xs text-muted">Product photos → styled social creatives, at batch scale.</p>
          </div>
          <nav className="inline-flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-brand text-brand-foreground"
                    : "text-body hover:bg-card-muted hover:text-heading"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-rise" key={tab}>
          {tab === "product" && <Studio />}
          {tab === "how" && <HowItWasBuilt />}
          {tab === "code" && <CodeSection />}
        </div>
      </main>
    </div>
  );
}
