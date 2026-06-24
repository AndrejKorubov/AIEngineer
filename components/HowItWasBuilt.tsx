const TOOLS: { name: string; role: string }[] = [
  { name: "Claude Code (Opus 4.8, 1M)", role: "Lead engineer — scaffolding, provider adapters, Inngest pipeline, the full Vercel setup, debugging from logs." },
  { name: "ChatGPT", role: "Research — analyzed the brief and helped choose the stack and tooling." },
  { name: "my-skill design system", role: "Claude Code skill — the shadcn-style visual language for this UI." },
  { name: "Vercel CLI", role: "Deploys, env vars, Blob store, runtime logs." },
  { name: "Inngest", role: "Durable orchestration — fan-out, step retries, concurrency, failover." },
  { name: "Neon + Drizzle", role: "Postgres + typed schema/migrations." },
  { name: "Vercel Blob", role: "Upload + generated-image storage (public store)." },
  { name: "OpenAI · Gemini · Fal", role: "Vision, text and image-generation providers (with failover)." },
];

const TIME = [
  { label: "Total time", value: "~4.5 h" },
  { label: "Hands-on (me)", value: "~1.5 h", note: "directing, reviewing, keys, decisions" },
  { label: "AI working", value: "~3 h", note: "implementation, deploy, debugging" },
];

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-2xl font-semibold text-heading">{value}</p>
      <p className="mt-1 text-sm font-medium text-heading">{label}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function HowItWasBuilt() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-heading sm:text-3xl">
        How it was built
      </h2>

      <section className="mt-8">
        <h3 className="text-lg font-semibold text-heading">How I used AI</h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-body">
          <p>
            I delegated the bulk of the engineering to <strong className="text-heading">Claude Code
            (Opus 4.8)</strong> — scaffolding the Next.js app, the multi-provider adapter layer, the
            Inngest batch pipeline, and the entire Vercel/Neon/Blob/Inngest setup including
            provisioning, migrations, and deploys. I used <strong className="text-heading">ChatGPT</strong>{" "}
            up front to analyze the task and pick the stack and tools.
          </p>
          <p>
            I stepped in for product and scope decisions, supplying API keys, and reading runtime
            logs when things broke. The most useful human moments were judgment calls, not typing.
          </p>
          <p>
            <strong className="text-heading">What the AI got wrong / where I overrode it:</strong> its
            first plan reached for <em>Imagen text-to-image</em>, which can&apos;t preserve a specific
            product — I redirected it to a <strong className="text-heading">multi-image edit model
            (Gemini 2.5 Flash Image / &ldquo;nano-banana&rdquo;)</strong> so the real product is
            composited into the scene. It also initially guessed wrong dependency versions (e.g.
            <code className="rounded bg-card-muted px-1"> openai</code> v4 vs the real v6,{" "}
            <code className="rounded bg-card-muted px-1">@google/genai</code> 0.x vs 2.x), which I had
            it correct against the registry. Two production-only bugs — a private-Blob/OIDC store
            mismatch and an Inngest sync gap — only surfaced from the deploy logs and were fixed there.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-heading">Toolset</h3>
        <ul className="mt-3 space-y-3">
          {TOOLS.map((t) => (
            <li key={t.name} className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
              <span className="text-sm font-medium text-heading">{t.name}</span>
              <span className="text-sm text-body">{t.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-heading">Time breakdown</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TIME.map((t) => (
            <Stat key={t.label} {...t} />
          ))}
        </div>
      </section>
    </div>
  );
}
