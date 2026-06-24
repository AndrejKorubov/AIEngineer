import type { z } from "zod";
import type { VisionProvider } from "../types";
import { genai, inlineImagePart } from "../google";

export const geminiVision: VisionProvider = {
  name: "gemini-vision",
  async analyze<T>({
    imageUrls,
    schema,
    instruction,
  }: {
    imageUrls: string[];
    schema: z.ZodType<T>;
    instruction: string;
  }): Promise<T> {
    const parts = [
      { text: `${instruction}\n\nRespond ONLY with JSON matching the requested fields.` },
      ...(await Promise.all(imageUrls.map(inlineImagePart))),
    ];
    const res = await genai().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json" },
    });
    const text = res.text;
    if (!text) throw new Error("gemini-vision returned no text");
    return schema.parse(JSON.parse(text));
  },
};
