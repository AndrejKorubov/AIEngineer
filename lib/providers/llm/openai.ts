import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { LLMProvider } from "../types";
import { openai } from "../openaiClient";

export const openaiLLM: LLMProvider = {
  name: "openai-llm",
  async complete<T>({ prompt, schema }: { prompt: string; schema: z.ZodType<T> }): Promise<T> {
    const completion = await openai().chat.completions.parse({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: zodResponseFormat(schema as z.ZodType<object>, "plan"),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new Error("openai-llm returned no parsed output");
    return parsed as T;
  },
};
