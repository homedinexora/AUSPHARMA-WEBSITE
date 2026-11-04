"use client";

import { useEffect, useState, type ReactNode } from "react";

const KEY = "auspharma-hcp-declared";

/**
 * Self-declaration gate for prescribing information marked "For the use of a Registered
 * Medical Practitioner…". Not verification: it records the visitor's own declaration for
 * this browser session only (no personal data).
 */
export function HcpGate({ children }: { children: ReactNode }) {
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    try {
      // Restoring the visitor's earlier declaration from sessionStorage (an external store).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(KEY) === "yes") setDeclared(true);
    } catch {
      /* storage unavailable: ask again */
    }
  }, []);

  if (declared) return <>{children}</>;

  return (
    <div className="rounded-md border border-brand-600 bg-brand-100 p-5">
      <p className="font-semibold text-brand-800">For healthcare professionals</p>
      <p className="mt-1 text-sm text-ink">
        The full prescribing information is intended for registered medical practitioners, hospitals and
        laboratories. If you are a patient, please read the patient counselling information above and speak to
        your doctor or pharmacist.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(KEY, "yes");
          } catch {
            /* ignore */
          }
          setDeclared(true);
        }}
        className="mt-4 rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        I am a healthcare professional
      </button>
    </div>
  );
}
