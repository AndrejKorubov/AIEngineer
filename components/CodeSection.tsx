import { Button } from "@/components/ui/Button";

const REPO = "https://github.com/AndrejKorubov/AIEngineer";

export function CodeSection() {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-heading sm:text-3xl">The code</h2>
      <p className="mt-3 text-sm leading-relaxed text-body">
        Full source — the Next.js app, provider adapter layer, Inngest pipeline, and Drizzle schema.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="font-mono text-sm text-heading">AndrejKorubov/AIEngineer</p>
        <p className="mt-1 text-sm text-body">
          Next.js · TypeScript · Inngest · Neon + Drizzle · Vercel Blob · OpenAI / Gemini / Fal
        </p>
        <a href={REPO} target="_blank" rel="noreferrer" className="mt-4 inline-block">
          <Button variant="brand">View on GitHub ↗</Button>
        </a>
      </div>
    </div>
  );
}
