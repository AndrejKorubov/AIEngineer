import type { z } from "zod";

/** A vision provider analyzes an image into a typed structured object. */
export interface VisionProvider {
  readonly name: string;
  analyze<T>(args: {
    imageUrls: string[];
    schema: z.ZodType<T>;
    instruction: string;
  }): Promise<T>;
}

/** An LLM provider produces a typed structured object from a text prompt. */
export interface LLMProvider {
  readonly name: string;
  complete<T>(args: { prompt: string; schema: z.ZodType<T> }): Promise<T>;
}

/** An image-edit provider composites a product into a reference scene/style. */
export interface ImageEditProvider {
  readonly name: string;
  /** Returns raw PNG/JPEG bytes of the generated creative. */
  edit(args: {
    productUrl: string;
    referenceUrls: string[];
    prompt: string;
  }): Promise<{ bytes: Buffer; contentType: string }>;
}
