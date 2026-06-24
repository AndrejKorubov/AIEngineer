# Batch Creative Studio

Upload **N product images** + **1–2 reference images** → get **N social creatives**, each placing
the product into the reference's scene/style, with an auto-generated headline / caption / CTA.
Results stream onto the page as each one finishes.

## How it works

```
Upload (Vercel Blob) → POST /api/batches → Inngest "batch/created"
  ├─ analyze reference ONCE → shared StyleGuide (stored on batch)
  └─ fan out one "job/run" per product (concurrency-limited, retries=3)
       analyze product → build edit prompt + copy → image edit → upload → status=done
Browser polls GET /api/batches/:id every 1.5s → renders cards as they flip to done
```

### Reliability
- **Retries** — Inngest retries each durable step up to 3×.
- **Multi-provider failover** — `lib/providers/withFailover.ts` tries providers in order:
  - Vision/LLM: OpenAI → Gemini
  - Image edit: Gemini 2.5 Flash Image (nano-banana) → Fal FLUX.1 Kontext
- **Visible failure** — terminal failures render a `failed` card with a Retry button, never a hang.

### Style consistency
The reference is analyzed **once** into a shared `StyleGuide` reused by every job, and the
reference **image itself** is passed into every image-edit call — so the whole batch shares one look.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run db:push              # create tables in Neon
npx inngest-cli@latest dev   # terminal 2: Inngest dev server (http://localhost:8288)
npm run dev                  # terminal 3: http://localhost:3000
```

Open http://localhost:3000, upload products + a reference, and watch the grid fill in.

## Stack
Next.js (App Router) · TypeScript · Tailwind v4 · Neon Postgres + Drizzle · Vercel Blob ·
Inngest · OpenAI · Google Gemini · Fal.

## Scope notes (deliberately omitted)
Auth, SSE (polling is enough), a separate heavy guard model (provider-native safety is used),
and a broad test suite — per the challenge's "scope it, don't polish it" guidance.
