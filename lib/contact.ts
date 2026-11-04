import { site } from "@/lib/site";

/** tel: href from a display number ("1800 890 5877" -> "tel:18008905877"). */
export const telHref = (n: string) => `tel:${n.replace(/[^0-9+]/g, "")}`;

/** Pre-filled side-effect email so reporters include what a pharmacovigilance assessment needs. */
export function sideEffectMailto(): string | null {
  if (!site.contactEmail) return null;
  const body = [
    "Medicine name (as on the pack):",
    "Batch no. (on the carton, next to “Batch No.”):",
    "What happened, and when did it start?",
    "Was the medicine stopped? Did the reaction get better?",
    "Other medicines being taken:",
    "Age and sex of the person affected:",
    "Your name and phone number (so we can follow up):",
  ].join("\n\n");
  const q = new URLSearchParams({ subject: "Side effect report", body });
  return `mailto:${site.contactEmail}?${q.toString().replace(/\+/g, "%20")}`;
}
