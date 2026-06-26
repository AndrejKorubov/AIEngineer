import type { z } from "zod";
import type { ImageAspectRatio } from "@/lib/aspect";

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
  /** Returns raw PNG/JPEG bytes of the generated creative.
   *  `aspectRatio` omitted ⇒ preserve the input image's framing (used by rim swap). */
  edit(args: {
    productUrl: string;
    referenceUrls: string[];
    prompt: string;
    aspectRatio?: ImageAspectRatio;
  }): Promise<{ bytes: Buffer; contentType: string }>;
}
