import { HcpGate } from "@/components/scan/HcpGate";
import { InsertSectionList } from "@/components/scan/InsertSectionList";
import type { ScanPil } from "@/lib/data/catalog";

/**
 * Package insert on the scan page.
 * - patient_leaflet: every section shown.
 * - prescribing_information: patient-facing sections shown; the rest behind an HCP declaration.
 */
export function PilSections({ pil, gtin, isOlderVersion }: { pil: ScanPil; gtin: string; isOlderVersion: boolean }) {
  const isPi = pil.kind === "prescribing_information";
  const open = isPi ? pil.sections.filter((s) => s.patientFacing) : pil.sections;
  const gated = isPi ? pil.sections.filter((s) => !s.patientFacing) : [];

  return (
    <section aria-labelledby="pil-heading" className="space-y-4">
      <h2 id="pil-heading" className="text-2xl font-medium text-brand-600">
        {isPi ? "Package insert" : "Patient information leaflet"}
      </h2>

      {isOlderVersion ? (
        <p className="rounded-sm bg-verify-50 px-4 py-3 text-sm text-ink">
          This is the insert packed with your batch. A newer version exists for later batches.
        </p>
      ) : null}

      {open.length > 0 ? <InsertSectionList sections={open} openFirst /> : null}

      {gated.length > 0 || (isPi && pil.hasPdf) ? (
        <HcpGate patientInfoShown={open.length > 0}>
          <div className="space-y-4">
            {pil.hasPdf ? (
              <a
                href={`/documents/pil/${pil.id}`}
                target="_blank"
                rel="noopener"
                className="inline-block rounded-sm text-sm font-semibold text-brand-700 underline"
              >
                Download the approved package insert (PDF)
              </a>
            ) : null}
            {gated.length > 0 ? <InsertSectionList sections={gated} /> : null}
          </div>
        </HcpGate>
      ) : null}

      {!isPi && pil.hasPdf ? (
        <a
          href={`/documents/pil/${pil.id}`}
          target="_blank"
          rel="noopener"
          className="inline-block rounded-sm text-sm font-semibold text-brand-700 underline"
        >
          Download the approved leaflet (PDF)
        </a>
      ) : null}

      {pil.sections.length === 0 && !pil.hasPdf ? (
        <p className="text-sm text-ink-soft">Please read the insert inside your pack.</p>
      ) : null}

      <p className="text-xs text-ink-soft">
        Insert version {pil.version}
        {pil.revisionDate ? ` · revised ${pil.revisionDate}` : ""} · GTIN {gtin}
      </p>
    </section>
  );
}
