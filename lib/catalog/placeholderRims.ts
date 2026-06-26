import type { RimCatalogSource, RimView } from "./types";
import { toRimRef } from "./types";

/**
 * v1 catalog: a static set of placeholder rims (design doc §5.1 / A.9). Images
 * are AI-generated and uploaded to Blob by `scripts/gen-placeholder-rims.ts`,
 * which fills IMAGE_URLS below; until then `imageFor` falls back to a local path.
 */

// Blob URLs keyed by rim id — generated + uploaded by scripts/gen-placeholder-rims.mjs.
const BLOB = "https://wa5xtpheicraaeaa.public.blob.vercel-storage.com/rims";
const IMAGE_URLS: Record<string, string> = {
  "ph-mesh-silver-18": `${BLOB}/ph-mesh-silver-18.png`,
  "ph-mesh-black-18": `${BLOB}/ph-mesh-black-18.png`,
  "ph-5spoke-gun-19": `${BLOB}/ph-5spoke-gun-19.png`,
  "ph-5spoke-silver-17": `${BLOB}/ph-5spoke-silver-17.png`,
  "ph-multispoke-poly-19": `${BLOB}/ph-multispoke-poly-19.png`,
  "ph-multispoke-black-20": `${BLOB}/ph-multispoke-black-20.png`,
  "ph-twin5-bronze-18": `${BLOB}/ph-twin5-bronze-18.png`,
  "ph-twin5-silver-16": `${BLOB}/ph-twin5-silver-16.png`,
  "ph-turbine-gun-20": `${BLOB}/ph-turbine-gun-20.png`,
  "ph-turbine-white-19": `${BLOB}/ph-turbine-white-19.png`,
};

function imageFor(id: string): string {
  return IMAGE_URLS[id] ?? `/rims/${id}.png`;
}

const SITE = "autoplius.lt";
// Real listings for the given diameter — useful even with placeholder imagery.
const sourceFor = (dia: number) =>
  `https://en.autoplius.lt/ads/tyres-rims/rims?qt=r${dia}+ratlankiai`;

function rim(
  id: string,
  name: string,
  brand: string,
  diameterInch: number,
  finish: string,
  priceEur: number,
): RimView {
  return {
    id,
    name,
    brand,
    diameterInch,
    finish,
    priceCents: priceEur * 100,
    currency: "EUR",
    imageUrl: imageFor(id),
    sourceSite: SITE,
    sourceUrl: sourceFor(diameterInch),
  };
}

export const PLACEHOLDER_RIMS: RimView[] = [
  rim("ph-mesh-silver-18", "Mesh Sport", "AuraForm", 18, "silver", 119),
  rim("ph-mesh-black-18", "Mesh Sport", "AuraForm", 18, "matte black", 119),
  rim("ph-5spoke-gun-19", "Velar 5", "AuraForm", 19, "gunmetal", 149),
  rim("ph-5spoke-silver-17", "Velar 5", "AuraForm", 17, "silver", 99),
  rim("ph-multispoke-poly-19", "Strata Multi", "NordRim", 19, "polished", 169),
  rim("ph-multispoke-black-20", "Strata Multi", "NordRim", 20, "gloss black", 189),
  rim("ph-twin5-bronze-18", "Twin-5 RS", "NordRim", 18, "bronze", 159),
  rim("ph-twin5-silver-16", "Twin-5 RS", "NordRim", 16, "silver", 89),
  rim("ph-turbine-gun-20", "Turbine GT", "KaunoRatas", 20, "gunmetal", 199),
  rim("ph-turbine-white-19", "Turbine GT", "KaunoRatas", 19, "matte white", 175),
];

const PAGE_SIZE = 24;

export const placeholderCatalog: RimCatalogSource = {
  name: "placeholder",
  async list({ filters, page = 1 }) {
    let r = PLACEHOLDER_RIMS;
    if (filters?.diameter) r = r.filter((x) => x.diameterInch === filters.diameter);
    if (filters?.finish) r = r.filter((x) => x.finish === filters.finish);
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      r = r.filter((x) => `${x.name} ${x.brand ?? ""}`.toLowerCase().includes(q));
    }
    const start = (page - 1) * PAGE_SIZE;
    return { rims: r.slice(start, start + PAGE_SIZE), hasMore: r.length > start + PAGE_SIZE };
  },
  async getByIds(ids) {
    return ids
      .map((id) => PLACEHOLDER_RIMS.find((r) => r.id === id))
      .filter((r): r is RimView => Boolean(r))
      .map(toRimRef);
  },
};
