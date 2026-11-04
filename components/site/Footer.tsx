import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { CopyrightYear } from "@/components/site/CopyrightYear";
import { medicalDisclaimer, pvpi, site } from "@/lib/site";

const legalLinks = [
  { href: "/report-side-effect", label: "Report a side effect" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-900 text-white/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-prose text-sm">{site.strapline}.</p>
          <p className="text-sm">
            Marketed by <span className="font-semibold text-white">{site.legalName}</span>
            {site.registeredOffice ? <>, {site.registeredOffice}</> : null}
            {site.cin ? <> · CIN {site.cin}</> : null}
          </p>
          <p className="text-sm">
            Report a suspected side effect to the national helpline (PvPI):{" "}
            <a href={`tel:${pvpi.helpline.replaceAll("-", "")}`} className="font-semibold text-white underline">
              {pvpi.helpline}
            </a>{" "}
            (toll-free).
          </p>
        </div>
        <nav aria-label="Legal and support">
          <ul className="grid gap-2 text-sm sm:grid-cols-2 md:grid-cols-1">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-sm hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 text-xs text-white/75 sm:px-6 lg:px-8">
          <p>{medicalDisclaimer}</p>
          <p>
            © <CopyrightYear /> {site.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
