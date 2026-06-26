/**
 * Generator "modes" the studio can run. Each mode has its own inputs, main-area
 * UI and pipeline; batches are tagged with their mode so history stays scoped.
 */
export type GeneratorId = "social" | "rims";

export const GENERATORS: { id: GeneratorId; label: string; blurb: string }[] = [
  { id: "social", label: "Social posts", blurb: "Product photos → styled social creatives" },
  { id: "rims", label: "Rim swap", blurb: "Car photo → re-rendered with new alloy wheels" },
];

export const DEFAULT_GENERATOR: GeneratorId = "social";

export function isGeneratorId(v: unknown): v is GeneratorId {
  return v === "social" || v === "rims";
}
