import { z } from "zod";

/**
 * Structured-output contracts shared across the pipeline. Every vision/LLM call
 * is forced to emit JSON matching one of these so downstream steps never parse
 * free text.
 */

export const ProductAnalysisSchema = z.object({
  productType: z.string().describe("What the product is, e.g. 'ceramic coffee mug'"),
  shape: z.string().describe("Overall silhouette/form"),
  colors: z.array(z.string()).describe("Dominant colors of the product itself"),
  materials: z.array(z.string()).describe("Visible materials/finishes"),
  keyDetails: z.array(z.string()).describe("Distinctive features that identify this exact product"),
  doNotDistort: z
    .array(z.string())
    .describe("Aspects that must be preserved exactly (logo, proportions, text, color)"),
});
export type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

export const StyleGuideSchema = z.object({
  setting: z.string().describe("Scene/environment the product should be placed in"),
  lighting: z.string().describe("Lighting character, direction, temperature"),
  mood: z.string().describe("Emotional tone of the imagery"),
  style: z.string().describe("Photographic/illustration style"),
  composition: z.string().describe("Framing and layout conventions"),
  colorPalette: z.array(z.string()).describe("Scene/background palette (not the product)"),
  textures: z.array(z.string()).describe("Surfaces/materials present in the scene"),
  cameraAngle: z.string().describe("Typical camera angle/perspective"),
});
export type StyleGuide = z.infer<typeof StyleGuideSchema>;

export const CopySchema = z.object({
  headline: z.string().describe("Punchy social headline, <= 8 words"),
  caption: z.string().describe("1-2 sentence caption for the post"),
  cta: z.string().describe("Short call to action, <= 5 words"),
});
export type Copy = z.infer<typeof CopySchema>;

export const GenerationPlanSchema = z.object({
  editPrompt: z
    .string()
    .describe(
      "Instruction for the image-edit model: place THIS product into the reference scene/style, keeping its identity",
    ),
  preserve: z.array(z.string()).describe("Product aspects the edit must not change"),
  composition: z.string().describe("How to compose the product within the scene"),
  copy: CopySchema,
});
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;
