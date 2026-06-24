import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Lazily construct the Drizzle client on first use. `neon()` throws if
 * DATABASE_URL is missing, and Next.js evaluates route modules during the build
 * (page-data collection) when env vars aren't present — so we defer until an
 * actual query runs at request time.
 */
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const real = getDb();
    return Reflect.get(real, prop, real);
  },
});

export * from "./schema";
