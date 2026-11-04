/**
 * Legal page settings. Set `reviewed: true` only after AUSPHARMA's legal counsel approves the text;
 * until then every legal page shows a "Draft: pending legal review" banner.
 * TODO(legal): grievance officer, retention periods, jurisdiction, effective date.
 */
export const legal = {
  reviewed: false,
  lastUpdated: "4 November 2026",
  /** DPDP Act 2023 grievance contact. Falls back to the support email until a named officer is supplied. */
  grievanceOfficer: null as { name: string; email: string; phone?: string } | null,
  /** Courts with jurisdiction, e.g. "Hyderabad, Telangana". */
  jurisdiction: null as string | null,
} as const;
