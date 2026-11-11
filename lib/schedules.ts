import type { DrugSchedule } from "@/db/schema";

/** Admin choices for a product's label class, in the order shown. Pick what the approved pack prints. */
export const SCHEDULE_OPTIONS: readonly { value: DrugSchedule; label: string }[] = [
  { value: "H", label: "Schedule H (Rx + Schedule H box)" },
  { value: "H_G", label: "Schedule H + Schedule G (Rx + both boxes)" },
  { value: "H1", label: "Schedule H1" },
  { value: "X", label: "Schedule X" },
  { value: "G", label: "Schedule G (Schedule G box only)" },
  { value: "G_RX", label: "Schedule G + prescription caution" },
  { value: "RX", label: "Prescription only, not scheduled (prescription caution only)" },
  { value: "OTC", label: "OTC (non-scheduled)" },
];

export function isDrugSchedule(v: string): v is DrugSchedule {
  return SCHEDULE_OPTIONS.some((o) => o.value === v);
}
