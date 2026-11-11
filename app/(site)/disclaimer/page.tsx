import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { telHref } from "@/lib/contact";
import { medicalDisclaimer, pvpi, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Medical and information disclaimer for the ${site.brandName} website.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" intro={<p>{medicalDisclaimer}</p>}>
      <section>
        <h2>1. Not medical advice</h2>
        <p>
          Nothing on this website is a diagnosis, a recommendation to use a particular medicine, or a substitute for the
          advice of a registered medical practitioner or pharmacist. Do not start, stop or change a medicine based on
          information here.
        </p>
      </section>

      <section>
        <h2>2. Prescription medicines</h2>
        <p>
          Medicines marked Rx (Schedule H, H1 or X) may be sold only on the prescription of a registered medical
          practitioner and must be used only as directed by one. Medicines marked Sch. G (Schedule G) carry the
          caution that it is dangerous to take them except under medical supervision. Each product page shows the
          cautionary wording printed on the pack. Information about these medicines is provided to people who already
          have the medicine (for example by scanning the pack) and to healthcare professionals; it is not an
          invitation to use them.
        </p>
      </section>

      <section>
        <h2>3. Package inserts and patient guides</h2>
        <p>
          Package inserts are reproduced from the approved documents; where text is shown on the page, the approved PDF is
          the authoritative version. Prescribing information is intended for registered medical practitioners, hospitals
          and laboratories. Patient guides summarise information in plain language and do not replace the package insert
          or your doctor&rsquo;s advice.
        </p>
      </section>

      <section>
        <h2>4. Certificates of Analysis</h2>
        <p>
          A Certificate of Analysis reports laboratory results for one batch at release. It applies only to the batch
          number it names. If a batch is withdrawn, its certificate is removed and the product page says so.
        </p>
      </section>

      <section>
        <h2>5. Manufacturing</h2>
        <p>
          AUSPHARMA medicines are marketed by {site.legalName} and manufactured by WHO-GMP certified manufacturing
          partners. Each product page names the manufacturer and its manufacturing licence number.
        </p>
      </section>

      <section>
        <h2>6. Side effects</h2>
        <p>
          If you think a medicine has caused a side effect, speak to your doctor or pharmacist and{" "}
          <Link href="/report-side-effect">report it</Link>, or call the national PvPI helpline{" "}
          <a href={telHref(pvpi.helpline)}>{pvpi.helpline}</a>. In an emergency, go to the nearest hospital or call{" "}
          <a href="tel:112">112</a>.
        </p>
      </section>

      <section>
        <h2>7. External links</h2>
        <p>Links to other websites are provided for convenience; we are not responsible for their content.</p>
      </section>
    </LegalPage>
  );
}
