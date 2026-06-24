/** UI metadata for the provider toggles + "which provider ran" badges. */
export type ProviderStage = "vision" | "llm" | "image";

export const PROVIDER_GROUPS: {
  stage: ProviderStage;
  label: string;
  providers: { name: string; label: string }[];
}[] = [
  {
    stage: "vision",
    label: "Vision (image understanding)",
    providers: [
      { name: "openai-vision", label: "OpenAI GPT-4o" },
      { name: "gemini-vision", label: "Gemini 2.5 Flash" },
    ],
  },
  {
    stage: "llm",
    label: "Text (prompt + caption)",
    providers: [
      { name: "openai-llm", label: "OpenAI GPT-4o" },
      { name: "gemini-llm", label: "Gemini 2.5 Flash" },
    ],
  },
  {
    stage: "image",
    label: "Image generation",
    providers: [
      { name: "gemini-2.5-flash-image", label: "Gemini Flash Image (nano-banana)" },
      { name: "fal-flux-kontext", label: "Fal FLUX.1 Kontext" },
    ],
  },
];

export const ALL_PROVIDER_NAMES = PROVIDER_GROUPS.flatMap((g) =>
  g.providers.map((p) => p.name),
);

const LABELS = Object.fromEntries(
  PROVIDER_GROUPS.flatMap((g) => g.providers.map((p) => [p.name, p.label])),
);

export function providerLabel(name?: string): string {
  return name ? (LABELS[name] ?? name) : "—";
}
