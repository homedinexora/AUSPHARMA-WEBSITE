import type { ReactNode } from "react";
import { getStaff, type Staff } from "@/lib/admin/auth";

/** Renders children only for allow-listed staff; everyone else sees a clear refusal (no data). */
export function NotAuthorised() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-card">
      <h1 className="text-xl font-semibold text-ink">Not authorised</h1>
      <p className="mt-2 text-sm text-ink-soft">
        You are signed in, but this account isn&rsquo;t on the AUS Pharma staff list. Ask an administrator to add your
        verified work email.
      </p>
    </div>
  );
}

export async function StaffOnly({ children }: { children: (staff: Staff) => ReactNode }) {
  const staff = await getStaff();
  if (!staff) return <NotAuthorised />;
  return <>{children(staff)}</>;
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-sm px-4 py-3 text-sm ${error ? "border border-danger bg-white text-danger" : "bg-brand-100 text-brand-800"}`}
    >
      {error ?? ok}
    </p>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published"
      ? "bg-success text-white"
      : status === "withdrawn"
        ? "bg-danger text-white"
        : status === "superseded"
          ? "bg-line text-ink"
          : "border border-warning text-warning";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${tone}`}>{status}</span>;
}
