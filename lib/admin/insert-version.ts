/**
 * Version name for an uploaded insert: what staff typed, else "Rev. <date of revision>" from the insert,
 * else the next free "v1", "v2", …
 */
export function insertVersionName({
  typed,
  revisionDate,
  existing,
}: {
  typed: string | null;
  revisionDate: string | null;
  existing: readonly string[];
}): string {
  if (typed?.trim()) return typed.trim();
  if (revisionDate) return `Rev. ${revisionDate}`;
  let n = 1;
  while (existing.includes(`v${n}`)) n++;
  return `v${n}`;
}
