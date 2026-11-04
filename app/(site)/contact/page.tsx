import type { Metadata } from "next";
import Link from "next/link";
import { telHref } from "@/lib/contact";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.legalName}: address, toll-free number and email.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Get in touch</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Contact us</h1>
        </div>
      </section>

      <div className="bg-canvas">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-14">
          <section aria-labelledby="company-title" className="rounded-lg bg-white p-6 shadow-card">
            <h2 id="company-title" className="text-xl font-medium text-brand-600">
              {site.legalName}
            </h2>
            {site.registeredOffice ? (
              <address className="mt-3 not-italic leading-relaxed text-ink">{site.registeredOffice}</address>
            ) : null}
            {site.cin ? <p className="mt-2 text-sm text-ink-soft">CIN {site.cin}</p> : null}
            <dl className="mt-5 space-y-4">
              {site.tollFree ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Toll-free</dt>
                  <dd>
                    <a href={telHref(site.tollFree)} className="text-lg font-semibold text-brand-700 underline">
                      {site.tollFree}
                    </a>
                  </dd>
                </div>
              ) : null}
              {site.contactEmail ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Email</dt>
                  <dd>
                    <a href={`mailto:${site.contactEmail}`} className="text-lg font-semibold text-brand-700 underline">
                      {site.contactEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <div className="space-y-6">
            <section aria-labelledby="se-title" className="rounded-lg border border-danger bg-white p-6">
              <h2 id="se-title" className="text-lg font-semibold text-ink">
                Reporting a side effect?
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Please use our side-effect page. It lists what to include and the national helpline.
              </p>
              <Link
                href="/report-side-effect"
                className="mt-4 inline-flex items-center justify-center rounded-sm bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
              >
                Report a side effect
              </Link>
            </section>

            <section aria-labelledby="product-title" className="rounded-lg bg-brand-100 p-6">
              <h2 id="product-title" className="text-lg font-semibold text-brand-800">
                Questions about a product?
              </h2>
              <p className="mt-1 text-sm text-ink">
                Scan the QR code on your pack to see its details, package insert and the test report for your batch.
                For advice about using a medicine, please speak to your doctor or pharmacist.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
