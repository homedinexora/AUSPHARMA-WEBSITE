import type { ReactNode } from "react";
import { legal } from "@/lib/legal";

/** Shared layout for Privacy, Terms and Disclaimer: readable prose, draft banner until legal sign-off. */
export function LegalPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Legal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-white/85">Last updated: {legal.lastUpdated}</p>
        </div>
      </section>
      <div className="bg-canvas">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 md:py-14">
          {!legal.reviewed ? (
            <p role="note" className="rounded-md border border-warning bg-white px-5 py-4 text-sm text-ink">
              <strong className="text-warning">Draft: pending legal review.</strong> This text describes how this website
              works today and will be finalised by AUSPHARMA&rsquo;s legal counsel.
            </p>
          ) : null}
          {intro ? <div className="text-lg leading-relaxed text-ink">{intro}</div> : null}
          <article className="legal-prose space-y-8 rounded-lg bg-white p-6 shadow-card md:p-8 [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li+li]:mt-1 [&_p]:leading-relaxed [&_p]:text-ink-soft [&_section>*+*]:mt-3 [&_ul]:text-ink-soft">
            {children}
          </article>
        </div>
      </div>
    </>
  );
}

/** Highlighted placeholder for text AUSPHARMA's legal team must supply (visible only while drafting). */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-sm bg-[#fff1d6] px-1 text-sm font-semibold text-warning">TODO(legal): {children}</mark>
  );
}
