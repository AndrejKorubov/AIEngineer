"use client";

import { useEffect, useState } from "react";
import { Studio } from "@/components/studio/Studio";
import { RimStudio } from "@/components/studio/RimStudio";
import { ModeSelect } from "@/components/studio/ModeSelect";
import { HowItWasBuilt } from "@/components/HowItWasBuilt";
import { CodeSection } from "@/components/CodeSection";
import { GENERATORS, DEFAULT_GENERATOR, isGeneratorId, type GeneratorId } from "@/lib/generators";

type Tab = "product" | "how" | "code";

const TABS: { id: Tab; label: string }[] = [
  { id: "product", label: "The product" },
  { id: "how", label: "How it was built" },
  { id: "code", label: "The code" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("product");
  // Start at the default to keep SSR/first client render in sync, then restore choice.
  const [mode, setMode] = useState<GeneratorId>(DEFAULT_GENERATOR);
  useEffect(() => {
    const saved = localStorage.getItem("generator");
    if (isGeneratorId(saved)) setMode(saved);
  }, []);

  function setModePersisted(g: GeneratorId) {
    setMode(g);
    localStorage.setItem("generator", g);
  }

  const blurb = GENERATORS.find((g) => g.id === mode)?.blurb ?? "";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold text-heading">Batch Creative Studio</h1>
            <p className="text-xs text-muted">{blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {tab === "product" && <ModeSelect value={mode} onChange={setModePersisted} />}
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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-rise" key={`${tab}-${mode}`}>
          {tab === "product" && (mode === "rims" ? <RimStudio /> : <Studio />)}
          {tab === "how" && <HowItWasBuilt />}
          {tab === "code" && <CodeSection />}
        </div>
      </main>
    </div>
  );
}
