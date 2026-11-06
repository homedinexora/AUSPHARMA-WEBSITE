"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that disables itself and shows `pending` text while its form's server action runs. */
export function SubmitButton({ children, pending, className }: { children: ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" disabled={busy} aria-disabled={busy} className={`${className ?? ""} disabled:opacity-60`}>
      {busy ? pending : children}
    </button>
  );
}
