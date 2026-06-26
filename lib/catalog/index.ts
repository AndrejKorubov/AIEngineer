import type { RimCatalogSource } from "./types";
import { placeholderCatalog } from "./placeholderRims";

/**
 * The single switch point for the rim catalog. Everything depends on
 * `activeCatalog` (the interface), never on a concrete source. When the real
 * scraper lands, swap this one line to `scrapedCatalog` — no other changes.
 */
export const activeCatalog: RimCatalogSource = placeholderCatalog;

export type { RimCatalogSource, RimView, RimRef, RimFilters } from "./types";
