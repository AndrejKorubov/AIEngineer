import type { ImageEditProvider } from "../types";
import { genai, inlineImagePart } from "../google";

/**
 * Gemini 2.5 Flash Image ("nano-banana"). Accepts the product image AND the
 * reference image(s) as inputs and composites the product into the reference
 * scene/style while preserving its identity — exactly the task here.
 */
export const geminiFlashImage: ImageEditProvider = {
  name: "gemini-2.5-flash-image",
  async edit({
    productUrl,
    referenceUrls,
    prompt,
  }: {
    productUrl: string;
    referenceUrls: string[];
    prompt: string;
  }) {
    const parts = [
      {
        text:
          `${prompt}\n\n` +
          `IMAGE 1 is the PRODUCT — keep its exact shape, colors, materials, logos and ` +
          `proportions. The remaining images are STYLE/SCENE references — match their ` +
          `setting, lighting, mood, composition and palette. Output a single social-ready image.`,
      },
      await inlineImagePart(productUrl),
      ...(await Promise.all(referenceUrls.map(inlineImagePart))),
    ];

    const res = await genai().models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts }],
    });

    const imagePart = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("gemini image model returned no image (possibly blocked by safety filter)");
    }
    return {
      bytes: Buffer.from(imagePart.inlineData.data, "base64"),
      contentType: imagePart.inlineData.mimeType ?? "image/png",
    };
  },
};
