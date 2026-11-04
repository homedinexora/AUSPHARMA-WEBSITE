import type { ReactNode } from "react";
import type { PatientGuide, SafetyTone } from "@/lib/patient-guide";

const toneClass: Record<SafetyTone, string> = {
  avoid: "bg-[#fde8ea] text-[#8f1022]",
  ask: "bg-verify-50 text-[#065f8b]",
  tell: "bg-[#fff1d6] text-warning",
  ok: "bg-brand-100 text-brand-800",
};

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{children}</p>;
}

function Block({ id, title, children, className = "" }: { id?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`space-y-3 ${className}`}>
      <h3 id={id} className="text-xs font-bold uppercase tracking-wider text-ink-soft">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Plain-language "Easy guide for patients" (format from the Ausrastin Gold 10 infographic).
 * Rendered only from a QA-published guide; accent = product's therapy colour.
 */
export function PatientGuideView({
  guide: g,
  accent,
  pdfHref,
}: {
  guide: PatientGuide;
  accent: string;
  pdfHref: string | null;
}) {
  return (
    <section aria-labelledby="guide-title" className="overflow-hidden rounded-lg bg-kraft-50 shadow-card">
      {/* Header */}
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="bg-kraft p-5 md:p-6">
          <Eyebrow>Prescription medicine · Easy guide for patients</Eyebrow>
          <h2 id="guide-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            {g.headline}
          </h2>
          <p className="mt-2 text-sm text-ink">For patients who have been prescribed this medicine.</p>
        </div>
        {g.tagline ? (
          <p className="flex items-center p-5 text-lg font-semibold text-white md:max-w-56 md:p-6" style={{ backgroundColor: accent }}>
            {g.tagline}
          </p>
        ) : null}
      </div>

      <div className="space-y-8 p-5 md:p-6">
        {g.ingredients.length ? (
          <Block id="g-inside" title="What's inside">
            <div className="grid gap-3 sm:grid-cols-3">
              {g.ingredients.map((i) => (
                <div key={i.name} className="rounded-md border-t-4 bg-white p-4" style={{ borderTopColor: accent }}>
                  <p className="text-2xl font-bold text-ink">{i.strength}</p>
                  <p className="mt-1 font-semibold text-ink">{i.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">{i.role}</p>
                </div>
              ))}
            </div>
          </Block>
        ) : null}

        {g.howItWorks.length ? (
          <Block id="g-how" title="How it works · in simple steps">
            <div className="grid gap-3 md:grid-cols-3">
              {g.howItWorks.map((b) => (
                <div key={b.title} className="flex flex-col rounded-md bg-white p-4">
                  <p className="font-semibold text-ink">{b.title}</p>
                  <ol className="mt-3 flex-1 space-y-2">
                    {b.steps.map((s, i) => (
                      <li key={s} className="flex gap-3 text-sm text-ink">
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: accent }}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 rounded-sm px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
                    Result: {b.result}
                  </p>
                </div>
              ))}
            </div>
            {g.howItWorksSummary ? (
              <p className="rounded-md bg-ink px-4 py-3 text-sm text-white">
                <strong>All together:</strong> {g.howItWorksSummary}
              </p>
            ) : null}
          </Block>
        ) : null}

        <div className="grid gap-8 md:grid-cols-2">
          {g.howToTake.length ? (
            <Block id="g-take" title="How to take">
              <ol className="space-y-2">
                {g.howToTake.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm text-ink">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Block>
          ) : null}
          {g.safety.length ? (
            <Block id="g-safety" title="Safety at a glance">
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {g.safety.map((s) => (
                  <li key={s.topic} className={`rounded-sm px-3 py-2 ${toneClass[s.tone]}`}>
                    <span className="block text-sm font-semibold text-ink">{s.topic}</span>
                    <span className="text-xs font-bold uppercase">{s.verdict}</span>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>

        {g.dangerous.length || g.careful.length ? (
          <Block id="g-mix" title="Medicines that don't mix">
            {g.mixWarning ? <p className="font-semibold text-ink">{g.mixWarning}</p> : null}
            {g.dangerous.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {g.dangerous.map((d) => (
                  <div key={d.group} className="rounded-md border-t-4 bg-white p-4" style={{ borderTopColor: accent }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-danger">Do not take together unless your doctor says so</p>
                    <p className="mt-1 font-semibold text-ink">{d.group}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {d.examples.map((e) => (
                        <li key={e} className="rounded-full bg-[#fde8ea] px-2.5 py-0.5 text-xs font-semibold text-[#8f1022]">
                          {e}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-ink-soft">{d.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {g.careful.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {g.careful.map((c) => (
                  <div key={c.group} className="rounded-md bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{c.group}</p>
                      <span className="rounded-sm px-2 py-0.5 text-xs font-bold uppercase text-white" style={{ backgroundColor: accent }}>
                        {c.clashesWith}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft">{c.examples}</p>
                    <p className="mt-2 text-sm text-ink">{c.note}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Block>
        ) : null}

        <div className="grid gap-8 md:grid-cols-2">
          {g.doNotTakeIf.length ? (
            <Block id="g-dont" title="Do not take if you have">
              <ul className="space-y-2 rounded-md bg-white p-4">
                {g.doNotTakeIf.map((d) => {
                  const caution = d.startsWith("!");
                  return (
                    <li key={d} className="flex gap-2 text-sm text-ink">
                      <span className={caution ? "font-bold text-warning" : "font-bold text-danger"} aria-hidden="true">
                        {caution ? "!" : "✕"}
                      </span>
                      {caution ? d.slice(1).trim() : d}
                    </li>
                  );
                })}
              </ul>
            </Block>
          ) : null}
          {g.lifestyle.length ? (
            <Block id="g-life" title="Food & lifestyle">
              <ul className="space-y-2 rounded-md bg-white p-4">
                {g.lifestyle.map((l) => (
                  <li key={l.topic} className="text-sm text-ink">
                    <strong>{l.topic}</strong> — {l.advice}
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>

        {g.sideEffects.length ? (
          <Block id="g-se" title="Common side effects · not everyone gets these">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.sideEffects.map((s) => (
                <li key={s.name} className="flex flex-col rounded-md bg-white p-4 text-center">
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="mt-1 flex-1 text-sm text-ink-soft">{s.description}</p>
                  {s.easeIt ? <p className="mt-3 rounded-sm bg-kraft-50 px-3 py-2 text-xs font-semibold text-ink">{s.easeIt}</p> : null}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {g.whenSerious.length ? (
          <Block id="g-serious" title="When mild becomes serious · call your doctor right away">
            <ul className="grid gap-3 md:grid-cols-3">
              {g.whenSerious.map((w) => (
                <li key={w.mild} className="overflow-hidden rounded-md bg-white text-sm">
                  <p className="px-4 py-2 text-ink">
                    <strong>Mild:</strong> {w.mild}
                  </p>
                  <p className="px-4 py-2 text-white" style={{ backgroundColor: "#b42318" }}>
                    <strong>Serious:</strong> {w.serious}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {g.callDoctor.length || g.overdose ? (
          <div role="note" className="rounded-md bg-danger p-5 text-white">
            {g.callDoctor.length ? (
              <>
                <p className="text-lg font-bold">Call your doctor right away if you notice</p>
                <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {g.callDoctor.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {g.overdose ? <p className="mt-4 border-t border-white/30 pt-3 text-sm">{g.overdose}</p> : null}
          </div>
        ) : null}

        <div className="space-y-2 border-t border-kraft pt-4 text-xs text-ink-soft">
          {g.footnotes.map((f) => (
            <p key={f}>{f}</p>
          ))}
          {g.sources ? (
            <p>
              <strong>Sources:</strong> {g.sources}
            </p>
          ) : null}
          {pdfHref ? (
            <a href={pdfHref} target="_blank" rel="noopener" className="inline-block font-semibold text-brand-700 underline">
              Download this guide (PDF)
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
