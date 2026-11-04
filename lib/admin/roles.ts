export type StaffRole = "editor" | "qa" | "admin";

const RANK: Record<StaffRole, number> = { editor: 1, qa: 2, admin: 3 };

/**
 * Parse ADMIN_USERS, e.g. "a@auspharma.in:admin, b@auspharma.in:qa, c@auspharma.in:editor".
 * Emails are compared case-insensitively. Unknown roles are ignored (no access).
 */
export function parseStaff(env: string | undefined): Map<string, StaffRole> {
  const map = new Map<string, StaffRole>();
  for (const entry of (env ?? "").split(",")) {
    const [email, role] = entry.split(":").map((s) => s?.trim().toLowerCase());
    if (email && (role === "editor" || role === "qa" || role === "admin")) map.set(email, role);
  }
  return map;
}

export function hasRole(role: StaffRole | null, min: StaffRole): boolean {
  return role !== null && RANK[role] >= RANK[min];
}
