import { fal } from "@fal-ai/client";
import { put } from "@vercel/blob";
import sharp from "sharp";
import type { RimRef } from "./catalog/types";

/**
 * Production-grade rim swap: detect the wheels, then inpaint ONLY that region.
 * The car outside the wheel mask is preserved exactly (never sent to the model),
 * so nothing else is redrawn — the industry approach (vs. full-image edits that
 * regenerate the whole frame). Output keeps the car photo's exact dimensions.
 *
 *   EVF-SAM (text → wheel mask) → FLUX.1 Fill (image + mask + prompt → wheels)
 */

/** Turn a rim into a spoke-style description for the text-conditioned fill. */
function spokeStyle(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("mesh")) return "mesh fine multi-spoke";
  if (n.includes("twin")) return "twin 5-spoke (ten-spoke)";
  if (n.includes("turbine")) return "turbine-style directional multi-spoke";
  if (n.includes("multi") || n.includes("strata")) return "fine multi-spoke";
  if (n.includes("velar") || /\b5\b/.test(name)) return "5-spoke";
  return "multi-spoke";
}

function rimFillPrompt(rim: RimRef): string {
  const dia = rim.diameterInch ? `${rim.diameterInch}-inch ` : "";
  const finish = rim.finish ?? "";
  return (
    `${dia}${finish} ${spokeStyle(rim.name)} alloy car wheels, ${finish} finish, ` +
    `crisp realistic spokes and centre cap, matched to the wheel's size, position and angle, photorealistic`
  );
}

/** Segment the car's wheels by text → returns a mask image URL (white = wheels). */
async function segmentWheels(carUrl: string): Promise<string> {
  fal.config({ credentials: process.env.FAL_KEY });
  const seg = await fal.subscribe("fal-ai/evf-sam", {
    input: { image_url: carUrl, prompt: "the wheels and rims of the car" },
  });
  const url = (seg.data as { image?: { url?: string } })?.image?.url;
  if (!url) throw new Error("wheel segmentation returned no mask");
  return url;
}

/**
 * Clean the raw segmentation mask before inpainting. On cluttered photos EVF-SAM
 * returns the solid wheel blobs PLUS a speckled low-confidence haze over the car
 * body; inpainting that haze peppers the body with artifacts. Blur averages the
 * speckle away while the solid wheels survive, then threshold re-binarises — so
 * only the wheels get inpainted. Re-uploaded to Blob for FLUX Fill. No-op-safe on
 * already-clean masks. Returns the original mask URL if cleanup fails.
 */
async function cleanMask(maskUrl: string, jobId: string): Promise<string> {
  try {
    const raw = Buffer.from(await (await fetch(maskUrl)).arrayBuffer());
    const cleaned = await sharp(raw).greyscale().blur(8).threshold(150).png().toBuffer();
    const blob = await put(`creatives/${jobId}-mask.png`, cleaned, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  } catch {
    return maskUrl;
  }
}

/** Inpaint only the masked wheels with the new rim; everything else is preserved. */
async function inpaintWheels(
  carUrl: string,
  maskUrl: string,
  prompt: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  fal.config({ credentials: process.env.FAL_KEY });
  const fill = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
    input: { image_url: carUrl, mask_url: maskUrl, prompt },
  });
  const url = (fill.data as { images?: { url: string }[] })?.images?.[0]?.url;
  if (!url) throw new Error("rim inpaint returned no image");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch inpaint result: ${res.status}`);
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "image/png",
  };
}

/** Full masked rim swap → persisted to Blob. Throws if either stage fails (caller falls back). */
export async function maskedRimSwap(args: {
  jobId: string;
  carUrl: string;
  rim: RimRef;
}): Promise<{ resultUrl: string; providerUsed: string }> {
  const rawMaskUrl = await segmentWheels(args.carUrl);
  const maskUrl = await cleanMask(rawMaskUrl, args.jobId);
  const { bytes, contentType } = await inpaintWheels(args.carUrl, maskUrl, rimFillPrompt(args.rim));
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const blob = await put(`creatives/${args.jobId}.${ext}`, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { resultUrl: blob.url, providerUsed: "evf-sam+flux-fill" };
}
