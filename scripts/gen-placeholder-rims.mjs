/**
 * One-time: generate the 10 placeholder rim images with the app's own image
 * model (Gemini 2.5 Flash Image), save to public/rims/, upload to Vercel Blob,
 * and print the { id: blobUrl } map to paste into lib/catalog/placeholderRims.ts.
 *
 * Run:  node scripts/gen-placeholder-rims.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";

// Load .env.local (GOOGLE_GENERATIVE_AI_API_KEY, BLOB_READ_WRITE_TOKEN)
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const RIMS = [
  { id: "ph-mesh-silver-18", dia: 18, finish: "silver", style: "mesh multi-spoke" },
  { id: "ph-mesh-black-18", dia: 18, finish: "matte black", style: "mesh multi-spoke" },
  { id: "ph-5spoke-gun-19", dia: 19, finish: "gunmetal grey", style: "5-spoke" },
  { id: "ph-5spoke-silver-17", dia: 17, finish: "silver", style: "5-spoke" },
  { id: "ph-multispoke-poly-19", dia: 19, finish: "polished silver", style: "fine multi-spoke" },
  { id: "ph-multispoke-black-20", dia: 20, finish: "gloss black", style: "fine multi-spoke" },
  { id: "ph-twin5-bronze-18", dia: 18, finish: "bronze", style: "twin 5-spoke" },
  { id: "ph-twin5-silver-16", dia: 16, finish: "silver", style: "twin 5-spoke" },
  { id: "ph-turbine-gun-20", dia: 20, finish: "gunmetal grey", style: "turbine directional" },
  { id: "ph-turbine-white-19", dia: 19, finish: "matte white", style: "turbine directional" },
  // --- extra 10 styles: chrome, two-tone, deep-dish / concave wide profile ---
  { id: "ph-concave-chrome-20", dia: 20, finish: "mirror chrome", style: "deep concave multi-spoke with a wide lip" },
  { id: "ph-split10-twotone-19", dia: 19, finish: "two-tone gloss black with polished machined faces", style: "split 10-spoke" },
  { id: "ph-deepdish-gun-20", dia: 20, finish: "gunmetal with a polished lip", style: "deep-dish 5-spoke with a wide concave profile" },
  { id: "ph-mesh-chrome-18", dia: 18, finish: "mirror chrome", style: "fine mesh multi-spoke" },
  { id: "ph-turbine-twotone-20", dia: 20, finish: "two-tone bronze with gloss black", style: "turbine directional" },
  { id: "ph-5spoke-chrome-19", dia: 19, finish: "mirror chrome", style: "bold 5-spoke" },
  { id: "ph-concave-bronze-19", dia: 19, finish: "matte bronze", style: "deep concave Y-spoke with an aggressive dish" },
  { id: "ph-deepdish-polished-17", dia: 17, finish: "polished silver", style: "classic deep-dish 5-spoke with a wide chromed lip" },
  { id: "ph-multispoke-twotone-20", dia: 20, finish: "two-tone gloss black with a machined lip", style: "fine multi-spoke" },
  { id: "ph-twin5-chrome-18", dia: 18, finish: "polished chrome", style: "twin 5-spoke" },
];

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

function prompt(r) {
  return (
    `Studio product photograph of a single ${r.dia}-inch ${r.finish} ${r.style} alloy car wheel rim, ` +
    `isolated and perfectly centered on a plain light-grey seamless background, front three-quarter view, ` +
    `with a black tyre fitted, sharp detail, soft studio lighting, no car, no people, no text, no logos. Square image.`
  );
}

async function genOne(r, attempt = 1) {
  const res = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt(r) }] }],
    config: { imageConfig: { aspectRatio: "1:1" } },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) {
    if (attempt < 3) return genOne(r, attempt + 1);
    throw new Error(`no image for ${r.id} after ${attempt} attempts`);
  }
  return Buffer.from(part.inlineData.data, "base64");
}

mkdirSync("public/rims", { recursive: true });
const urls = {};
for (const r of RIMS) {
  // Idempotent: skip rims whose image already exists (only generate new ones).
  if (existsSync(`public/rims/${r.id}.png`)) {
    console.log(`skipping ${r.id} (exists)`);
    continue;
  }
  process.stdout.write(`generating ${r.id} … `);
  const bytes = await genOne(r);
  writeFileSync(`public/rims/${r.id}.png`, bytes);
  const blob = await put(`rims/${r.id}.png`, bytes, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  urls[r.id] = blob.url;
  console.log("ok");
}

writeFileSync("scripts/rim-image-urls.json", JSON.stringify(urls, null, 2));
console.log("\nIMAGE_URLS =", JSON.stringify(urls, null, 2));
