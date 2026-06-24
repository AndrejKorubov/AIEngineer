import OpenAI from "openai";

/** Lazy singleton — `new OpenAI()` throws without a key, which would break the
 * Next.js build (route modules are evaluated during page-data collection). */
let _client: OpenAI | null = null;

export function openai(): OpenAI {
  return (_client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
}
