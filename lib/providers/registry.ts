import type { VisionProvider, LLMProvider, ImageEditProvider } from "./types";
import { openaiVision } from "./vision/openai";
import { geminiVision } from "./vision/gemini";
import { openaiLLM } from "./llm/openai";
import { geminiLLM } from "./llm/gemini";
import { geminiFlashImage } from "./image/geminiFlashImage";
import { falKontext } from "./image/falKontext";

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const hasFal = !!process.env.FAL_KEY;

/**
 * Ordered provider lists — index 0 is primary, the rest are fallbacks.
 * Providers without a configured key are dropped so failover never wastes an
 * attempt on a provider that can't possibly work. Vision uses a different
 * primary vendor (OpenAI) than image generation (Google) on purpose, so a
 * single vendor outage can't take down the whole pipeline.
 */
export const visionProviders: VisionProvider[] = [
  hasOpenAI && openaiVision,
  hasGoogle && geminiVision,
].filter(Boolean) as VisionProvider[];

export const llmProviders: LLMProvider[] = [
  hasOpenAI && openaiLLM,
  hasGoogle && geminiLLM,
].filter(Boolean) as LLMProvider[];

export const imageProviders: ImageEditProvider[] = [
  hasGoogle && geminiFlashImage,
  hasFal && falKontext,
].filter(Boolean) as ImageEditProvider[];
