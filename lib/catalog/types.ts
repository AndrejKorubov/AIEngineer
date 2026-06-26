/**
 * Rim catalog abstraction. Everything (the /api/rims feed, the gallery, the
 * generate flow) depends only on `RimCatalogSource` — never on where rims come
 * from. v1 ships a static `placeholderCatalog`; a scraper can later provide a
 * drop-in implementation of the same interface (see the design doc, §5/Appendix A).
 */

export type RimFilters = { diameter?: number; finish?: string; q?: string };

/** A rim as shown in the gallery (the source's public shape). */
export type RimView = {
  id: string;
  name: string;
  brand: string | null;
  diameterInch: number | null;
  finish: string | null;
  priceCents: number | null;
  currency: string;
  imageUrl: string; // Blob-hosted; used both as gallery thumbnail and edit reference
  sourceSite: string;
  sourceUrl: string; // "Visit shop" / "Buy at {site}"
};

/**
 * Snapshot of a rim copied onto a job at batch-creation time. Decouples a saved
 * batch from the live catalog so history renders stay stable even if the catalog
 * changes later. (No FK to any rims table — there is none in v1.)
 */
export type RimRef = {
  id: string;
  name: string;
  brand: string | null;
  diameterInch: number | null;
  finish: string | null;
  priceCents: number | null;
  currency: string;
  imageUrl: string;
  sourceUrl: string;
  sourceSite: string;
};

export interface RimCatalogSource {
  readonly name: string;
  list(args: { filters?: RimFilters; page?: number }): Promise<{ rims: RimView[]; hasMore: boolean }>;
  getByIds(ids: string[]): Promise<RimRef[]>;
}

/** RimView → the leaner RimRef snapshot persisted on a job. */
export function toRimRef(r: RimView): RimRef {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    diameterInch: r.diameterInch,
    finish: r.finish,
    priceCents: r.priceCents,
    currency: r.currency,
    imageUrl: r.imageUrl,
    sourceUrl: r.sourceUrl,
    sourceSite: r.sourceSite,
  };
}
