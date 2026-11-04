import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { hasRole, parseStaff, type StaffRole } from "./roles";

export interface Staff {
  userId: string;
  email: string;
  role: StaffRole;
}

/** Signed-in staff member on the ADMIN_USERS allow-list, or null. */
export async function getStaff(): Promise<Staff | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const staff = parseStaff(process.env.ADMIN_USERS);
  for (const e of user?.emailAddresses ?? []) {
    if (e.verification?.status !== "verified") continue;
    const role = staff.get(e.emailAddress.toLowerCase());
    if (role) return { userId, email: e.emailAddress.toLowerCase(), role };
  }
  return null;
}

/** For server actions: throws unless the caller has at least `min`. */
export async function requireStaff(min: StaffRole): Promise<Staff> {
  const s = await getStaff();
  if (!s || !hasRole(s.role, min)) throw new Error("Not authorised");
  return s;
}
