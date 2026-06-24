import { GoogleGenAI } from "@google/genai";
import { fetchImage } from "./withFailover";

/** Lazy singleton (see openaiClient.ts for the build-time rationale). */
let _genai: GoogleGenAI | null = null;

export function genai(): GoogleGenAI {
  return (_genai ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }));
}

/** Fetch an image URL into a Gemini inlineData part. */
export async function inlineImagePart(url: string) {
  const { bytes, contentType } = await fetchImage(url);
  return { inlineData: { mimeType: contentType, data: bytes.toString("base64") } };
}
