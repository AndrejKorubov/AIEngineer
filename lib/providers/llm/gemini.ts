import type { z } from "zod";
import type { LLMProvider } from "../types";
import { genai } from "../google";

export const geminiLLM: LLMProvider = {
  name: "gemini-llm",
  async complete<T>({ prompt, schema }: { prompt: string; schema: z.ZodType<T> }): Promise<T> {
    const res = await genai().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${prompt}\n\nRespond ONLY with valid JSON.` }] },
      ],
      config: { responseMimeType: "application/json" },
    });
    const text = res.text;
    if (!text) throw new Error("gemini-llm returned no text");
    return schema.parse(JSON.parse(text));
  },
};
