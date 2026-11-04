import { cacheLife } from "next/cache";

/** Current year, prerendered and refreshed daily (Cache Components: no bare new Date() in the shell). */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
