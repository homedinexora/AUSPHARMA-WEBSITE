/**
 * Therapy areas and their colours (Rx therapy colour guide, docs/design/therapy-colour-guide.docx).
 * `panel` is the pack colour; `web` is the text-safe variant for white text (AA ≥ 4.5:1);
 * `tint` is the light "+a" tint (use ink text on it).
 * TODO(brand): five therapies are "Proposed" in the guide; confirm before launch. Bone health is not in the guide:
 * its panel is the Pantone 281 C navy printed on the Bone Plus packs; its tint is proposed.
 */
export type TherapySlug =
  | "cardiology"
  | "diabetes"
  | "anti-infectives"
  | "pain-fever-inflammation"
  | "respiratory-allergy"
  | "gastro"
  | "cns-neuro"
  | "bone-health";

export interface Therapy {
  slug: TherapySlug;
  name: string;
  panel: string;
  web: string;
  tint: string;
  status: "decided" | "proposed";
}

export const therapies: readonly Therapy[] = [
  { slug: "cardiology", name: "Cardiology", panel: "#C8102E", web: "#C8102E", tint: "#FABBCB", status: "decided" },
  { slug: "diabetes", name: "Diabetes", panel: "#0077B6", web: "#0077B6", tint: "#99D6EA", status: "decided" },
  { slug: "anti-infectives", name: "Anti-infectives", panel: "#44883E", web: "#3D7A37", tint: "#ADDC91", status: "proposed" },
  { slug: "pain-fever-inflammation", name: "Pain, fever & inflammation", panel: "#B94700", web: "#B94700", tint: "#FDBE87", status: "proposed" },
  { slug: "respiratory-allergy", name: "Respiratory & anti-allergy", panel: "#007F75", web: "#007F75", tint: "#7CE0D3", status: "proposed" },
  { slug: "gastro", name: "Gastro", panel: "#D0006F", web: "#D0006F", tint: "#F1A7DC", status: "proposed" },
  { slug: "cns-neuro", name: "CNS / Neuro", panel: "#6A2C91", web: "#6A2C91", tint: "#C5B4E3", status: "proposed" },
  { slug: "bone-health", name: "Bone health", panel: "#00205B", web: "#00205B", tint: "#C3D7EE", status: "proposed" },
];

/** Therapy areas that have at least one of the given (published) products, in menu order. Empty areas are hidden. */
export function activeTherapies(items: readonly { therapy: string | null }[]): Therapy[] {
  const used = new Set(items.map((i) => i.therapy));
  return therapies.filter((t) => used.has(t.slug));
}

export function getTherapy(slug: string): Therapy | undefined {
  return therapies.find((t) => t.slug === slug);
}
