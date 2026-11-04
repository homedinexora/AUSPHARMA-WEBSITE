import { saveGuide, setGuidePublished } from "@/app/admin/actions";
import { StatusBadge } from "@/components/admin/Guard";
import { GUIDE_FIELDS, emptyGuide, serializeBlock, type PatientGuide } from "@/lib/patient-guide";

interface GuideRow {
  id: number;
  version: string;
  status: string;
  content: PatientGuide;
  pdfBlob: string | null;
}

const input = "w-full rounded-sm border border-line bg-white px-3 py-2 text-sm";

function Editor({ itemId, guide }: { itemId: string; guide: GuideRow | null }) {
  const content = guide?.content ?? emptyGuide();
  return (
    <form action={saveGuide.bind(null, itemId, guide?.id ?? null)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Version</span>
          <input name="version" required defaultValue={guide?.version ?? ""} placeholder="e.g. v2 / Nov 2026" className={input} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Approved guide PDF (optional, max 4 MB)</span>
          <input name="guidePdf" type="file" accept="application/pdf" className="text-xs" />
        </label>
      </div>
      {GUIDE_FIELDS.map(({ field, label, help }) => {
        const value = serializeBlock(field, content[field]);
        const rows = Math.min(14, Math.max(2, value.split("\n").length + 1));
        return (
          <label key={field} className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
            <span className="block text-xs text-ink-soft">{help}</span>
            <textarea name={`g_${field}`} defaultValue={value} rows={rows} className={`${input} font-mono text-xs leading-relaxed`} />
          </label>
        );
      })}
      <button className="rounded-sm bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
        {guide ? "Save draft" : "Create draft guide"}
      </button>
    </form>
  );
}

/** Admin card: patient guide versions, editing (drafts only) and QA publishing. */
export function GuideEditor({ itemId, guides, qa }: { itemId: string; guides: GuideRow[]; qa: boolean }) {
  const draft = guides.find((g) => g.status === "draft") ?? null;
  return (
    <div className="space-y-4">
      <p className="rounded-sm border border-warning bg-white px-4 py-3 text-xs text-ink">
        A patient guide explains a prescription medicine in plain language and may contain therapeutic statements. It is
        shown only on the product&rsquo;s QR page and only after QA publishes it. <strong>Every version needs regulatory
        approval of its exact wording.</strong>
      </p>
      {guides.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3 text-sm">
          <span className="font-semibold">{g.version}</span>
          <StatusBadge status={g.status} />
          {g.pdfBlob ? <span className="text-ink-soft">PDF attached</span> : null}
          {qa && g.status !== "superseded" ? (
            <form action={setGuidePublished.bind(null, itemId, g.id, g.status !== "published")} className="ml-auto">
              <button
                className={`rounded-sm px-3 py-2 text-sm font-semibold ${g.status === "published" ? "border border-danger text-danger" : "bg-success text-white"}`}
              >
                {g.status === "published" ? "Unpublish" : "Publish this version"}
              </button>
            </form>
          ) : null}
        </div>
      ))}
      <details open={!guides.length || Boolean(draft)} className="rounded-md bg-brand-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-700">
          {draft ? `Edit draft ${draft.version}` : guides.length ? "Create a new version" : "Create a patient guide"}
        </summary>
        <div className="mt-4">
          <Editor itemId={itemId} guide={draft ?? (guides[0] ? { ...guides[0], id: 0, status: "draft", version: "" } : null)} />
        </div>
      </details>
    </div>
  );
}
