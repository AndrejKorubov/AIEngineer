import { put } from "@vercel/blob";
import { withFailover } from "./providers/withFailover";
import { visionProviders, llmProviders, imageProviders } from "./providers/registry";
import {
  ProductAnalysisSchema,
  StyleGuideSchema,
  GenerationPlanSchema,
  type ProductAnalysis,
  type StyleGuide,
  type GenerationPlan,
} from "./schemas";

/** Analyze the reference image(s) ONCE per batch into a shared style guide. */
export async function analyzeReference(referenceUrls: string[]): Promise<StyleGuide> {
  const { result } = await withFailover(visionProviders, (p) =>
    p.analyze({
      imageUrls: referenceUrls,
      schema: StyleGuideSchema,
      instruction:
        "You are a creative director. Analyze these reference image(s) and extract a reusable " +
        "style guide describing the setting, lighting, mood, style, composition, color palette, " +
        "textures and camera angle. Describe the SCENE and AESTHETIC, not any product in it.",
    }),
  );
  return result;
}

/** Analyze a single product image into a structured description. */
export async function analyzeProduct(productUrl: string): Promise<ProductAnalysis> {
  const { result } = await withFailover(visionProviders, (p) =>
    p.analyze({
      imageUrls: [productUrl],
      schema: ProductAnalysisSchema,
      instruction:
        "Analyze this product photo. Identify the product, its shape, colors, materials, the key " +
        "details that make it recognizable, and exactly what must NOT be distorted when it is " +
        "placed into a new scene (logos, text, proportions, color).",
    }),
  );
  return result;
}

/** Build the edit prompt + social copy from the product analysis and shared style guide. */
export async function buildGenerationPlan(
  product: ProductAnalysis,
  style: StyleGuide,
): Promise<GenerationPlan> {
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

  const { result } = await withFailover(llmProviders, (p) =>
    p.complete({ prompt, schema: GenerationPlanSchema }),
  );
  return result;
}

/** Generate the creative image and persist it to Vercel Blob; returns the public URL. */
export async function generateCreative(args: {
  jobId: string;
  productUrl: string;
  referenceUrls: string[];
  editPrompt: string;
}): Promise<string> {
  const { result } = await withFailover(imageProviders, (p) =>
    p.edit({
      productUrl: args.productUrl,
      referenceUrls: args.referenceUrls,
      prompt: args.editPrompt,
    }),
  );
  const ext = result.contentType.includes("jpeg") ? "jpg" : "png";
  const blob = await put(`creatives/${args.jobId}.${ext}`, result.bytes, {
    access: "public",
    contentType: result.contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
