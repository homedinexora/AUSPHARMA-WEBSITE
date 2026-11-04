import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Todo } from "@/components/site/LegalPage";
import { legal } from "@/lib/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using the ${site.brandName} website.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <p>
          These terms apply to your use of this website, operated by {site.legalName} (&ldquo;AUSPHARMA&rdquo;). By using
          the website you agree to them.
        </p>
      }
    >
      <section>
        <h2>1. Purpose of the website</h2>
        <p>
          The website provides information about AUSPHARMA and its products, including pack details, package inserts and
          batch Certificates of Analysis reached by scanning the QR code on a pack. It does not sell medicines and does
          not provide medical advice. Please read our <Link href="/disclaimer">Disclaimer</Link>.
        </p>
      </section>

      <section>
        <h2>2. Prescription medicines and professional information</h2>
        <p>
          Prescription medicines must be used only as directed by a registered medical practitioner. Some product
          information is intended for healthcare professionals; by choosing &ldquo;I am a healthcare professional&rdquo;
          you confirm that this applies to you.
        </p>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <ul>
          <li>Use the website lawfully and only for its intended purpose.</li>
          <li>
            Do not attempt to gain unauthorised access to the website, its staff area or its systems, or disrupt their
            operation.
          </li>
          <li>Do not copy documents or content from the website for commercial use without our written permission.</li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual property</h2>
        <p>
          The AUSPHARMA and +aquris names and logos, product names, pack designs and website content belong to{" "}
          {site.legalName} or its licensors. Trademarks marked ™ are under registration.
        </p>
      </section>

      <section>
        <h2>5. Accuracy and availability</h2>
        <p>
          We take care to keep information accurate and to publish documents as approved. Information may change, and
          the website may occasionally be unavailable. If something looks wrong, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </section>

      <section>
        <h2>6. Links to other websites</h2>
        <p>We are not responsible for the content of external websites linked from this website.</p>
      </section>

      <section>
        <h2>7. Liability</h2>
        <p>
          To the extent permitted by law, AUSPHARMA is not liable for loss arising from reliance on general information on
          this website in place of professional medical advice. <Todo>confirm limitation of liability wording.</Todo>
        </p>
      </section>

      <section>
        <h2>8. Governing law</h2>
        <p>
          These terms are governed by the laws of India.{" "}
          {legal.jurisdiction ? (
            <>The courts at {legal.jurisdiction} have jurisdiction.</>
          ) : (
            <Todo>courts with jurisdiction (e.g. Hyderabad, Telangana).</Todo>
          )}
        </p>
      </section>

      <section>
        <h2>9. Changes and contact</h2>
        <p>
          We may update these terms; the date at the top shows the latest version. Questions:{" "}
          {site.contactEmail ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> : <Link href="/contact">contact us</Link>}
          . Personal data is handled as described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
