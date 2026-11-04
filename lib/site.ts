/**
 * Company facts shown across the site. Only values AUSPHARMA has supplied go here;
 * anything unknown stays null and renders as nothing (never a guess).
 * Source for address/email/toll-free: "Marketed by" block of the approved ACEELO and
 * ACEELO-PS package inserts (revision 09-10-2026).
 * TODO(content): CIN, dedicated pharmacovigilance contact (if different from support).
 */
export const site = {
  brandName: "AUS Pharma",
  legalName: "Auspharma Private Limited",
  strapline: "Quality generics you can verify",
  url: "https://www.auspharma.in",
  registeredOffice: "10-3-316/A, Near NMDC, Masab Tank, Hyderabad, Telangana 500028, India" as string | null,
  cin: null as string | null,
  contactEmail: "support@auspharma.in" as string | null,
  tollFree: "1800 890 5877" as string | null,
  pharmacovigilanceEmail: null as string | null,
} as const;

/** National pharmacovigilance helpline (PvPI, Indian Pharmacopoeia Commission). Verify on ipc.gov.in before launch. */
export const pvpi = {
  helpline: "1800-180-3024",
  app: "ADR PvPI",
} as const;

export const medicalDisclaimer =
  "The information on this website is for general information only and is not a substitute for professional medical advice. Always consult a registered medical practitioner before starting, changing or stopping any medicine.";
