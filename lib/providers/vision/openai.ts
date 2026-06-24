import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { VisionProvider } from "../types";
import { openai } from "../openaiClient";

export const openaiVision: VisionProvider = {
  name: "openai-vision",
  async analyze<T>({
    imageUrls,
    schema,
    instruction,
  }: {
    imageUrls: string[];
    schema: z.ZodType<T>;
    instruction: string;
  }): Promise<T> {
    const completion = await openai().chat.completions.parse({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            ...imageUrls.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ],
        },
      ],
      response_format: zodResponseFormat(schema as z.ZodType<object>, "analysis"),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new Error("openai-vision returned no parsed output");
    return parsed as T;
  },
};
