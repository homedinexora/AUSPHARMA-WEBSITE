"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

interface Props {
  gtin: string;
  batches: { batchNo: string; expiryLabel: string | null }[];
  selected?: string | null;
}

/** "Find the batch number printed on your pack" → navigates to /{GTIN}/{batch}. */
export function BatchSelector({ gtin, batches, selected }: Props) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(selected ?? "");

  if (batches.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No batch reports are published for this product yet. Please check again later.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (value) router.push(`/${gtin}/${encodeURIComponent(value)}`);
      }}
    >
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-brand-700">
        Batch no. (printed on your pack, after &ldquo;B. No.&rdquo;)
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-sm border border-brand-600 bg-white px-3 py-3 text-base text-ink"
        required
      >
        <option value="" disabled>
          Select batch
        </option>
        {batches.map((b) => (
          <option key={b.batchNo} value={b.batchNo}>
            {b.batchNo}
            {b.expiryLabel ? ` (Exp. ${b.expiryLabel})` : ""}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!value}
        className="w-full rounded-sm bg-cta px-4 py-3 text-base font-semibold text-brand-800 hover:brightness-95 disabled:opacity-60"
      >
        Show the test report
      </button>
    </form>
  );
}
