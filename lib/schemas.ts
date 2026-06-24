import { z } from "zod";

/**
 * Structured-output contracts shared across the pipeline. Every vision/LLM call
 * is forced to emit JSON matching one of these so downstream steps never parse
 * free text.
 *
 * Models (especially the vision fallback) don't always honor types exactly —
 * they return a string where we asked for an array, or omit an optional-ish
 * field. These helpers coerce those quirks instead of failing the whole job,
 * so a provider's slightly-off JSON still validates. The reference IMAGE is
 * always passed to the image model regardless, so sparse text fields never
 * break visual style.
 */
const strArray = z.preprocess(
  (v) =>
    v == null ? [] : Array.isArray(v) ? v.map((x) => String(x)) : [String(v)],
  z.array(z.string()),
);
const str = z.preprocess((v) => (v == null ? "" : String(v)), z.string());

export const ProductAnalysisSchema = z.object({
  productType: str.describe("What the product is, e.g. 'ceramic coffee mug'"),
  shape: str.describe("Overall silhouette/form"),
  colors: strArray.describe("Dominant colors of the product itself"),
  materials: strArray.describe("Visible materials/finishes"),
  keyDetails: strArray.describe("Distinctive features that identify this exact product"),
  doNotDistort: strArray.describe("Aspects that must be preserved exactly (logo, proportions, text, color)"),
});
export type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

export const StyleGuideSchema = z.object({
  setting: str.describe("Scene/environment the product should be placed in"),
  lighting: str.describe("Lighting character, direction, temperature"),
  mood: str.describe("Emotional tone of the imagery"),
  style: str.describe("Photographic/illustration style"),
  composition: str.describe("Framing and layout conventions"),
  colorPalette: strArray.describe("Scene/background palette (not the product)"),
  textures: strArray.describe("Surfaces/materials present in the scene"),
  cameraAngle: str.describe("Typical camera angle/perspective"),
});
export type StyleGuide = z.infer<typeof StyleGuideSchema>;

export const CopySchema = z.object({
  headline: str.describe("Punchy social headline, <= 8 words"),
  caption: str.describe("1-2 sentence caption for the post"),
  cta: str.describe("Short call to action, <= 5 words"),
});
export type Copy = z.infer<typeof CopySchema>;

export const GenerationPlanSchema = z.object({
  editPrompt: str.describe(
    "Instruction for the image-edit model: place THIS product into the reference scene/style, keeping its identity",
  ),
  preserve: strArray.describe("Product aspects the edit must not change"),
  composition: str.describe("How to compose the product within the scene"),
  copy: CopySchema,
});
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;
