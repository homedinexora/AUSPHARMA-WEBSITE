"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export interface VerifyOption {
  gtin: string;
  name: string;
  batches: { batchNo: string; expiryLabel: string | null }[];
}

/** Home "Verify your medicine": pick product, then batch, then open its Certificate of Analysis. */
export function VerifyMedicine({ options }: { options: VerifyOption[] }) {
  const router = useRouter();
  const pid = useId();
  const bid = useId();
  const [gtin, setGtin] = useState("");
  const [batch, setBatch] = useState("");
  const product = options.find((o) => o.gtin === gtin);

  return (
    <div className="rounded-lg bg-brand-100 p-6 text-ink shadow-card md:p-8">
      <h2 className="text-2xl font-medium text-brand-700">Verify your medicine</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Choose your medicine and the batch number printed on its pack to see the Certificate of Analysis. Or simply
        scan the QR code on the pack.
      </p>
      {options.length === 0 ? (
        <p className="mt-5 rounded-sm bg-white px-4 py-3 text-sm text-ink-soft">
          Batch reports will appear here as they are published.
        </p>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (gtin) router.push(batch ? `/${gtin}/${encodeURIComponent(batch)}` : `/${gtin}`);
          }}
        >
          <div className="space-y-1">
            <label htmlFor={pid} className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Medicine
            </label>
            <select
              id={pid}
              value={gtin}
              onChange={(e) => {
                setGtin(e.target.value);
                setBatch("");
              }}
              required
              className="w-full rounded-sm border border-brand-600 bg-white px-3 py-3 text-base"
            >
              <option value="" disabled>
                Select medicine
              </option>
              {options.map((o) => (
                <option key={o.gtin} value={o.gtin}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={bid} className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Batch no.
            </label>
            <select
              id={bid}
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              disabled={!product || product.batches.length === 0}
              className="w-full rounded-sm border border-brand-600 bg-white px-3 py-3 text-base disabled:opacity-60"
            >
              <option value="">{product && product.batches.length === 0 ? "No batch reports yet" : "Select batch"}</option>
              {product?.batches.map((b) => (
                <option key={b.batchNo} value={b.batchNo}>
                  {b.batchNo}
                  {b.expiryLabel ? ` (Exp. ${b.expiryLabel})` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!gtin}
            className="w-full rounded-sm bg-cta px-4 py-3 text-base font-semibold text-brand-800 hover:brightness-95 disabled:opacity-60"
          >
            {batch ? "Show the test report" : "Open product"}
          </button>
        </form>
      )}
    </div>
  );
}
