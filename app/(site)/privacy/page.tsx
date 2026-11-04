import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Todo } from "@/components/site/LegalPage";
import { telHref } from "@/lib/contact";
import { legal } from "@/lib/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.legalName} handles personal data on ${site.url.replace("https://", "")}, under India's Digital Personal Data Protection Act, 2023.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const g = legal.grievanceOfficer;
  const grievanceEmail = g?.email ?? site.contactEmail;
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data {site.legalName} (&ldquo;AUSPHARMA&rdquo;, &ldquo;we&rdquo;) handles
          through this website, why, and the rights you have under India&rsquo;s Digital Personal Data Protection Act,
          2023 (DPDP Act).
        </p>
      }
    >
      <section>
        <h2>1. Who is responsible</h2>
        <p>
          {site.legalName}
          {site.registeredOffice ? `, ${site.registeredOffice}` : ""}, is the Data Fiduciary for personal data described in
          this policy.
        </p>
      </section>

      <section>
        <h2>2. What we collect on this website</h2>
        <ul>
          <li>
            <strong>Browsing the public pages:</strong> we do not ask for your name or contact details, we do not use
            analytics or advertising trackers, and we do not set tracking cookies. Like any website, our hosting provider
            processes technical data (such as IP address and browser type) to deliver pages and keep the service secure.
          </li>
          <li>
            <strong>&ldquo;I am a healthcare professional&rdquo;:</strong> if you choose this on a product page, the choice
            is stored only in your browser for the current session. It is not sent to us and contains no personal data.
          </li>
          <li>
            <strong>When you contact us</strong> by phone or email (including to report a side effect), we receive the
            details you give us, such as your name, phone number, email address and, for side-effect reports, health
            information about the person affected.
          </li>
          <li>
            <strong>AUSPHARMA staff</strong> who sign in to the administration area: name, work email and sign-in records.
            Sign-in cookies are used only in that area.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Why we use it</h2>
        <ul>
          <li>To answer your questions and requests.</li>
          <li>
            To assess and report suspected side effects, as required by Indian pharmacovigilance obligations. This may
            include sharing a report with regulators such as the Pharmacovigilance Programme of India.
          </li>
          <li>To run, secure and improve this website, and to control access to the staff area.</li>
        </ul>
        <p>We do not sell personal data, and we do not use it for advertising.</p>
      </section>

      <section>
        <h2>4. Service providers</h2>
        <p>
          We use service providers that process data on our behalf: website hosting and file storage (Vercel), database
          hosting (Neon) and staff sign-in (Clerk). They may store data outside India. <Todo>confirm cross-border transfer position and provider list.</Todo>
        </p>
      </section>

      <section>
        <h2>5. How long we keep it</h2>
        <p>
          We keep personal data only as long as needed for the purposes above or as required by law. Side-effect reports
          are kept for the period required by pharmacovigilance regulations. <Todo>specific retention periods.</Todo>
        </p>
      </section>

      <section>
        <h2>6. Your rights</h2>
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li>ask for a summary of your personal data we process and who it has been shared with;</li>
          <li>ask us to correct, complete, update or erase your personal data;</li>
          <li>withdraw consent where we rely on it, as easily as you gave it;</li>
          <li>nominate another person to exercise your rights if you are unable to; and</li>
          <li>raise a grievance with us, and then with the Data Protection Board of India.</li>
        </ul>
        <p>
          Some data, such as side-effect reports, may need to be kept to meet legal obligations even if you ask us to
          erase it. We will tell you if this applies.
        </p>
      </section>

      <section>
        <h2>7. Grievances and contact</h2>
        <p>
          {g ? (
            <>
              Grievance Officer: <strong>{g.name}</strong>
              {", "}
            </>
          ) : null}
          {grievanceEmail ? (
            <>
              email <a href={`mailto:${grievanceEmail}`}>{grievanceEmail}</a>
            </>
          ) : null}
          {site.tollFree ? (
            <>
              {" "}
              or call <a href={telHref(site.tollFree)}>{site.tollFree}</a> (toll-free)
            </>
          ) : null}
          . We aim to respond within the time required by law. <Todo>named Grievance Officer / Data Protection Officer, if required.</Todo>
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We will update this page when our practices change and show the date of the latest version at the top. See also
          our <Link href="/terms">Terms of Use</Link> and <Link href="/disclaimer">Disclaimer</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
