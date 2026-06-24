import { fal } from "@fal-ai/client";
import type { ImageEditProvider } from "../types";
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
  }: {
    productUrl: string;
    referenceUrls: string[];
    prompt: string;
  }) {
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt:
          `${prompt} The first image is the product (preserve its identity exactly); ` +
          `the others define the scene, style and lighting.`,
        image_urls: [productUrl, ...referenceUrls],
        aspect_ratio: "1:1",
      },
    });
    const url = (result.data as { images?: { url: string }[] })?.images?.[0]?.url;
    if (!url) throw new Error("fal-flux-kontext returned no image");
    return fetchImage(url);
  },
};
