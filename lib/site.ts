/**
 * Company facts shown across the site. Only values AUSPHARMA has supplied go here;
 * anything unknown stays null and renders as nothing (never a guess).
 * TODO(content): registered office address, CIN, contact email/phone, pharmacovigilance contact.
 */
export const site = {
  brandName: "AUS Pharma",
  legalName: "Auspharma Private Limited",
  strapline: "Quality generics you can verify",
  url: "https://www.auspharma.in",
  registeredOffice: null as string | null,
  cin: null as string | null,
  contactEmail: null as string | null,
  contactPhone: null as string | null,
  pharmacovigilanceEmail: null as string | null,
} as const;

/** National pharmacovigilance helpline (PvPI, Indian Pharmacopoeia Commission). Verify on ipc.gov.in before launch. */
export const pvpi = {
  helpline: "1800-180-3024",
  app: "ADR PvPI",
} as const;

export const medicalDisclaimer =
  "The information on this website is for general information only and is not a substitute for professional medical advice. Always consult a registered medical practitioner before starting, changing or stopping any medicine.";
