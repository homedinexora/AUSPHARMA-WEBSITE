/**
 * Legal page settings. Set `reviewed: true` only after AUSPHARMA's legal counsel approves the text;
 * until then every legal page shows a "Draft: pending legal review" banner.
 * TODO(legal): retention periods, jurisdiction, effective date.
 */
export const legal = {
  reviewed: false,
  lastUpdated: "4 November 2026",
  /** DPDP Act 2023 Grievance Officer (supplied by AUSPHARMA, 4 Nov 2026): contact via the toll-free number. */
  grievanceOfficer: { name: "Dr. Manoj Kumar", phone: "1800 890 5877" } as { name: string; phone?: string; email?: string } | null,
  /** Courts with jurisdiction, e.g. "Hyderabad, Telangana". */
  jurisdiction: null as string | null,
} as const;
