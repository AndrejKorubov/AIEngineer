/**
 * Output orientation for a batch. Chosen once in the UI and shared by every job
 * (like the style guide), so a whole batch comes out the same shape. The ratio
 * strings are the exact values both image providers accept (Gemini 2.5 Flash
 * Image `imageConfig.aspectRatio` and Fal FLUX.1 Kontext `aspect_ratio`).
 */
export const ASPECT_RATIOS = ["16:9", "1:1", "9:16"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** Default keeps prior behavior — batches were landscape before this option existed. */
export const DEFAULT_ASPECT: AspectRatio = "16:9";

export const ASPECT_OPTIONS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: "16:9", label: "Landscape", hint: "16:9" },
  { value: "1:1", label: "Square", hint: "1:1" },
  { value: "9:16", label: "Portrait", hint: "9:16" },
];

/**
 * The full set of aspect ratios both image providers accept. Used by rim swap to
 * match the output to the uploaded car's shape (the 3-option set above is just
 * the social orientation picker). `AspectRatio` is a subset of this.
 */
export const IMAGE_ASPECT_RATIOS = ["21:9", "16:9", "3:2", "4:3", "1:1", "3:4", "2:3", "9:16"] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

const RATIO_VALUE: Record<ImageAspectRatio, number> = {
  "21:9": 21 / 9,
  "16:9": 16 / 9,
  "3:2": 3 / 2,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
  "2:3": 2 / 3,
  "9:16": 9 / 16,
};

/** Decimal value of a supported aspect ratio (width / height). */
export function aspectValue(ratio: ImageAspectRatio): number {
  return RATIO_VALUE[ratio];
}

/**
 * Pick the supported aspect ratio nearest to a width×height (e.g. an uploaded
 * car). The image is then white-padded to this exact ratio before generation, so
 * "nearest by distance" minimises how much white padding is added.
 */
export function closestImageAspect(width: number, height: number): ImageAspectRatio {
  if (!width || !height) return "16:9";
  const target = width / height;
  return IMAGE_ASPECT_RATIOS.reduce((best, r) =>
    Math.abs(RATIO_VALUE[r] - target) < Math.abs(RATIO_VALUE[best] - target) ? r : best,
  );
}

const ASPECT_CLASS: Record<ImageAspectRatio, string> = {
  "21:9": "aspect-[21/9]",
  "16:9": "aspect-[16/9]",
  "3:2": "aspect-[3/2]",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "3:4": "aspect-[3/4]",
  "2:3": "aspect-[2/3]",
  "9:16": "aspect-[9/16]",
};

/** Tailwind aspect-ratio class for previews/thumbnails. */
export function aspectClass(ratio: ImageAspectRatio): string {
  return ASPECT_CLASS[ratio] ?? "aspect-[16/9]";
}
