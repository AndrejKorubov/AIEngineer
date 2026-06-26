import { fal } from "@fal-ai/client";
import type { ImageEditProvider } from "../types";
import type { ImageAspectRatio } from "@/lib/aspect";
import { fetchImage } from "../withFailover";

/**
 * Fallback image-edit provider: FLUX.1 Kontext [max] multi-image. A genuinely
 * different provider AND model family from the Gemini primary, so a Gemini
 * outage/safety-block degrades instead of failing the job. Takes the product +
 * reference image URLs directly (they are public Vercel Blob URLs).
 */
export const falKontext: ImageEditProvider = {
  name: "fal-flux-kontext",
  async edit({
    productUrl,
    referenceUrls,
    prompt,
    aspectRatio,
  }: {
    productUrl: string;
    referenceUrls: string[];
    prompt: string;
    aspectRatio?: ImageAspectRatio;
  }) {
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt:
          `${prompt} The first image is the product (preserve its identity exactly); ` +
          `the others define the scene, style and lighting.`,
        image_urls: [productUrl, ...referenceUrls],
        // Omit to preserve input framing (rim swap); set for social orientation.
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
      },
    });
    const url = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!url) throw new Error("fal-flux-kontext returned no image");
    return fetchImage(url);
  },
};
