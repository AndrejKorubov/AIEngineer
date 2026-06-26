import { put } from "@vercel/blob";
import { withFailover } from "./providers/withFailover";
import { visionProviders, llmProviders, imageProviders, pickEnabled } from "./providers/registry";
import type { ProviderConfig } from "@/db/schema";
import type { ImageAspectRatio } from "./aspect";
import type { RimRef } from "./catalog/types";
import {
  ProductAnalysisSchema,
  StyleGuideSchema,
  GenerationPlanSchema,
  type ProductAnalysis,
  type StyleGuide,
  type GenerationPlan,
} from "./schemas";

// Per-stage attempt timeouts so a hung provider fails over instead of stalling.
const VISION_TIMEOUT = 45_000;
const LLM_TIMEOUT = 45_000;
const IMAGE_TIMEOUT = 120_000;

/** Analyze the reference image(s) ONCE per batch into a shared style guide. */
export async function analyzeReference(
  referenceUrls: string[],
  enabled?: ProviderConfig,
): Promise<{ styleGuide: StyleGuide; providerUsed: string }> {
  const { result, providerUsed } = await withFailover(
    pickEnabled(visionProviders, enabled),
    (p) =>
      p.analyze({
        imageUrls: referenceUrls,
        schema: StyleGuideSchema,
        instruction:
          "You are a creative director. Analyze these reference image(s) and extract a reusable " +
          "style guide describing the setting, lighting, mood, style, composition, color palette, " +
          "textures and camera angle. Describe the SCENE and AESTHETIC, not any product in it.",
      }),
    VISION_TIMEOUT,
  );
  return { styleGuide: result, providerUsed };
}

/** Analyze a single product image into a structured description. */
export async function analyzeProduct(
  productUrl: string,
  enabled?: ProviderConfig,
): Promise<{ product: ProductAnalysis; providerUsed: string }> {
  const { result, providerUsed } = await withFailover(
    pickEnabled(visionProviders, enabled),
    (p) =>
      p.analyze({
        imageUrls: [productUrl],
        schema: ProductAnalysisSchema,
        instruction:
          "Analyze this product photo. Identify the product, its shape, colors, materials, the key " +
          "details that make it recognizable, and exactly what must NOT be distorted when it is " +
          "placed into a new scene (logos, text, proportions, color).",
      }),
    VISION_TIMEOUT,
  );
  return { product: result, providerUsed };
}

/** Build the edit prompt + social copy from the product analysis and shared style guide. */
export async function buildGenerationPlan(
  product: ProductAnalysis,
  style: StyleGuide,
  enabled?: ProviderConfig,
): Promise<{ plan: GenerationPlan; providerUsed: string }> {
  const prompt =
    `Create a plan to place a product into a styled scene for a social media creative.\n\n` +
    `PRODUCT:\n${JSON.stringify(product, null, 2)}\n\n` +
    `STYLE GUIDE (from the reference, shared across the whole batch):\n${JSON.stringify(style, null, 2)}\n\n` +
    `Produce:\n` +
    `1) editPrompt: a vivid instruction telling an image-edit model how to composite THIS product ` +
    `into the reference scene/style while preserving the product's identity.\n` +
    `2) preserve: the product aspects that must stay unchanged.\n` +
    `3) composition: how to frame the product in the scene.\n` +
    `4) copy: a headline, caption and CTA for the post that fit the product and mood.`;

  const { result, providerUsed } = await withFailover(
    pickEnabled(llmProviders, enabled),
    (p) => p.complete({ prompt, schema: GenerationPlanSchema }),
    LLM_TIMEOUT,
  );

  // Safety net: never hand the image model an empty instruction.
  if (!result.editPrompt.trim()) {
    result.editPrompt =
      `Place the ${product.productType} into a ${style.setting} scene with ${style.lighting} ` +
      `lighting and a ${style.mood} mood. Preserve the product's exact shape, colors and details.`;
  }
  return { plan: result, providerUsed };
}

/**
 * Build the rim-swap edit prompt (rim mode). Deterministic, no LLM. The car is
 * IMAGE 1 (productUrl) and the rim is IMAGE 2 (referenceUrls[0]) — matching how
 * the image adapters label their inputs.
 */
export function buildRimSwapPrompt(rim: RimRef): string {
  const name = [rim.brand, rim.name].filter(Boolean).join(" ");
  const desc =
    [rim.finish ?? "", name, rim.diameterInch ? `(${rim.diameterInch}")` : ""].filter(Boolean).join(" ") ||
    "alloy wheel";
  return (
    `IMAGE 1 is a car. IMAGE 2 is the TARGET alloy wheel — a ${desc}. ` +
    `Replace EVERY wheel on the car with the wheel from IMAGE 2: match its spoke pattern, spoke count, colour ` +
    `and finish faithfully, with correct perspective and foreshortening for each wheel's angle. The wheels in ` +
    `the output MUST clearly match IMAGE 2 and look obviously different from the car's original wheels — do not ` +
    `keep the original wheels.\n\n` +
    `CRITICAL: change ONLY the wheels. Keep the entire rest of the image identical to IMAGE 1 — do NOT ` +
    `re-render, repaint, sharpen, brighten, restyle or add/alter any detail of the car body, colour, paint, ` +
    `headlights, badges, mirrors, windows, tyres, ride height, ground, shadows, lighting or background, and ` +
    `keep the exact same framing (no crop or zoom). If IMAGE 1 has plain white borders, leave them solid ` +
    `white. Output one photorealistic image.`
  );
}

/** Generate the creative image and persist it to Vercel Blob; returns the public URL + provider. */
export async function generateCreative(args: {
  jobId: string;
  productUrl: string;
  referenceUrls: string[];
  editPrompt: string;
  aspectRatio?: ImageAspectRatio; // omit ⇒ provider default; rims pass the car's closest ratio
  preferImage?: string; // image provider to try first (rims prefer Fal Kontext for edits)
  enabled?: ProviderConfig;
}): Promise<{ resultUrl: string; providerUsed: string }> {
  let providers = pickEnabled(imageProviders, args.enabled);
  if (args.preferImage) {
    // Move the preferred provider to the front; the rest stay as fallbacks.
    providers = [...providers].sort(
      (a, b) => Number(b.name === args.preferImage) - Number(a.name === args.preferImage),
    );
  }
  const { result, providerUsed } = await withFailover(
    providers,
    (p) =>
      p.edit({
        productUrl: args.productUrl,
        referenceUrls: args.referenceUrls,
        prompt: args.editPrompt,
        aspectRatio: args.aspectRatio,
      }),
    IMAGE_TIMEOUT,
  );
  const ext = result.contentType.includes("jpeg") ? "jpg" : "png";
  const blob = await put(`creatives/${args.jobId}.${ext}`, result.bytes, {
    access: "public",
    contentType: result.contentType,
    addRandomSuffix: true,
    // Pass the token explicitly so the SDK scopes to the public store derived
    // from the token. Otherwise Vercel's auto-injected VERCEL_OIDC_TOKEN makes
    // it use BLOB_STORE_ID (a different/private store) and reject public access.
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { resultUrl: blob.url, providerUsed };
}
