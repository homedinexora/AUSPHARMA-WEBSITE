import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: NeonHttpDatabase<typeof schema> | null = null;

/** Lazily connect so builds without DATABASE_URL don't crash at import time. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (Neon integration not connected?)");
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

export { schema };
