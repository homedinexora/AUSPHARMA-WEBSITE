import type { Metadata } from "next";
import Link from "next/link";
import { sideEffectMailto, telHref } from "@/lib/contact";
import { pvpi, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Report a side effect",
  description:
    "How to report a suspected side effect of an AUSPHARMA medicine: call or email AUSPHARMA, or report to the national Pharmacovigilance Programme of India (PvPI).",
  alternates: { canonical: "/report-side-effect" },
};

const include = [
  "The medicine name, exactly as printed on the pack",
  "The batch number (printed on the carton next to “Batch No.”)",
  "What happened, when it started, and whether it got better after stopping the medicine",
  "Any other medicines being taken",
  "Age and sex of the person affected",
  "Your name and phone number, so we can follow up if needed",
];

export default function ReportSideEffectPage() {
  const mailto = sideEffectMailto();
  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Patient safety</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Report a side effect</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            If you think a medicine has caused a side effect, tell your doctor or pharmacist. You can also report it
            to us and to the national Pharmacovigilance Programme of India (PvPI). Every report helps make medicines
            safer.
          </p>
        </div>
      </section>

      <div className="bg-canvas">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 md:py-14">
          <p role="note" className="rounded-md border border-danger bg-white px-5 py-4 text-ink">
            <strong className="text-danger">Is it an emergency?</strong> If the reaction is serious, such as difficulty
            breathing, swelling of the face or throat, or fainting, go to the nearest hospital or call{" "}
            <a href="tel:112" className="font-semibold underline">
              112
            </a>{" "}
            now.
          </p>

          <section aria-labelledby="ways-title" className="space-y-4">
            <h2 id="ways-title" className="text-2xl font-medium text-brand-600">
              How to report
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {site.tollFree ? (
                <div className="rounded-lg bg-white p-5 shadow-card">
                  <h3 className="font-semibold text-ink">Call {site.brandName}</h3>
                  <p className="mt-1 text-sm text-ink-soft">Toll-free</p>
                  <a
                    href={telHref(site.tollFree)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-sm bg-cta px-4 py-3 font-semibold text-brand-800 hover:brightness-95"
                  >
                    {site.tollFree}
                  </a>
                </div>
              ) : null}
              {mailto ? (
                <div className="rounded-lg bg-white p-5 shadow-card">
                  <h3 className="font-semibold text-ink">Email {site.brandName}</h3>
                  <p className="mt-1 text-sm text-ink-soft">Opens an email with the questions to answer</p>
                  <a
                    href={mailto}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-sm bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
                  >
                    {site.contactEmail}
                  </a>
                </div>
              ) : null}
              <div className="rounded-lg bg-white p-5 shadow-card">
                <h3 className="font-semibold text-ink">National helpline (PvPI)</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Toll-free, run by the Indian Pharmacopoeia Commission. You can also use the {pvpi.app} mobile app.
                </p>
                <a
                  href={telHref(pvpi.helpline)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-sm border border-brand-600 px-4 py-3 font-semibold text-brand-700 hover:bg-brand-100"
                >
                  {pvpi.helpline}
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="include-title" className="rounded-lg bg-white p-5 shadow-card md:p-6">
            <h2 id="include-title" className="text-xl font-medium text-brand-600">
              What to tell us
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Share what you know. You don&rsquo;t need to be sure the medicine caused the problem to report it.
            </p>
            <ul className="mt-4 space-y-2">
              {include.map((t) => (
                <li key={t} className="flex gap-3 text-ink">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ink-soft">
              Find your product&rsquo;s details by scanning the QR code on the pack, or{" "}
              <Link href="/search" className="font-semibold text-brand-700 underline">
                search for it
              </Link>
              .
            </p>
          </section>

          <p className="text-sm text-ink-soft">
            Information you share is used to assess the report and meet our safety reporting obligations. See our{" "}
            <Link href="/privacy" className="font-semibold text-brand-700 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
