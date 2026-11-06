/**
 * Turns text extracted from a package-insert PDF into sections for the admin's PIL editor.
 * This is a PRE-FILL only: staff must check every section against the approved PDF before publishing.
 */
import type { PilSection } from "@/db/schema";

export interface ParsedInsert {
  kind: "prescribing_information" | "patient_leaflet";
  title: string | null;
  revisionDate: string | null;
  sections: PilSection[];
}

/** Fix ligatures (CorelDRAW emits fi/fl as U+F001/U+F002) and normalise Unicode/whitespace. */
export function cleanExtractedText(raw: string): string {
  return raw
    .replace(//g, "fi")
    .replace(//g, "fl")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "");
}

const RMP_HEADER = /^for the use of a registered medical practitioner/i;
const NUMBERED = /^(\d{1,2}(?:\.\d{1,2})?)\.?\s+([A-Za-z][A-Za-z ,&/()'’-]{2,90})$/;
const CAPS = /^([A-Z][A-Z ,&/()'’-]{3,60}?)\s*:?$/; // may end in a colon, e.g. "COMPOSITION :"
const COLON = /^([A-Z][a-z]+(?: [a-z]+)?):$/; // one or two words, e.g. "Composition:", "Marketed by:"
const SUBLABEL = /^([A-Z][A-Za-z ,&/()'’-]{1,40}):$/; // in-section label, e.g. "Renal:", "Risk factors:"
/** Wingdings-style bullet that PDFs extract onto a line of its own, before the item text. */
const LONE_BULLET = /^[-•●▪Ÿ§]$/;

interface Heading {
  key: string | null;
  title: string;
}

function numberedHeading(line: string): Heading | null {
  const n = NUMBERED.exec(line);
  if (!n) return null;
  const title = n[2].trim();
  // Numbered headings are either ALL CAPS ("2. QUALITATIVE…") or Title-case subsections ("4.1 Therapeutic indications").
  return title === title.toUpperCase() || n[1].includes(".") ? { key: n[1], title } : null;
}

/**
 * Numbered (CDSCO-format) inserts: only numbered headings, plus the closing "Marketed by:", start sections.
 * Other inserts: ALL-CAPS lines and short colon labels start sections.
 */
function detectHeading(line: string, numbered: boolean, inSection: boolean): Heading | null {
  const n = numberedHeading(line);
  if (n) return n;
  if (/^marketed by\s*:$/i.test(line)) return { key: null, title: "Marketed by" };
  if (numbered) return null;
  const caps = CAPS.exec(line);
  if (caps && /[A-Z]{3}/.test(line)) return { key: null, title: caps[1].trim() };
  // A short "Label:" line opens a section only before the first heading (e.g. "Composition:");
  // inside a section it is a sub-heading such as "Renal impairment:".
  const c = inSection ? null : COLON.exec(line);
  if (c) return { key: null, title: c[1] };
  return null;
}

function displayTitle(t: string): string {
  if (t !== t.toUpperCase()) return t;
  const lower = t.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function slug(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Join wrapped PDF lines into Markdown paragraphs and list items. */
function toMarkdown(lines: string[]): string {
  const out: string[] = [];
  let pendingBullet = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/\s*\.{4,}\s*/g, ": ").trim();
    if (!line) continue;
    if (LONE_BULLET.test(line)) {
      pendingBullet = true;
      continue;
    }
    const bullet = pendingBullet || /^[-•●▪]\s*/.test(line);
    pendingBullet = false;
    const text = bullet ? `- ${line.replace(/^[-•●▪]\s*/, "")}` : line;
    const prev = out[out.length - 1];
    const startNew =
      !prev ||
      bullet ||
      /[.:;]$/.test(prev) ||
      // a composition line ends at its dose, unless the next line continues it, e.g. "(as … granules)"
      (/: \d[\d.,]*\s*(mg|mcg|g|IU|ml|mL)$/.test(prev) && /^[A-Z]/.test(text)) ||
      /^\*\*.*\*\*$/.test(prev) ||
      /^\*\*/.test(text) ||
      /^[A-Z][A-Za-z ]{1,40}:/.test(line) ||
      /: \d/.test(line);
    if (startNew) out.push(text);
    else out[out.length - 1] = `${prev} ${text}`;
  }
  return out.map((p) => (p.startsWith("- ") ? p : `${p}\n`)).join("\n").trim();
}

export function parseInsert(raw: string): ParsedInsert {
  const lines = cleanExtractedText(raw).split("\n");
  const firstText = lines.find((l) => l.trim());
  const kind = firstText && RMP_HEADER.test(firstText.trim()) ? "prescribing_information" : "patient_leaflet";

  const numbered = lines.filter((l) => numberedHeading(l.trim())).length >= 3;

  let title: string | null = null;
  const blocks: { heading: Heading; lines: string[] }[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || RMP_HEADER.test(line)) continue;
    const h = detectHeading(line, numbered, blocks.length > 0);
    if (h) {
      blocks.push({ heading: h, lines: [] });
      continue;
    }
    const label = blocks.length > 0 ? SUBLABEL.exec(line) : null;
    if (label) {
      blocks[blocks.length - 1].lines.push(`**${label[1]}**`);
      continue;
    }
    if (blocks.length === 0) {
      title ??= line;
      continue;
    }
    blocks[blocks.length - 1].lines.push(line);
  }

  const used = new Set<string>();
  const sections: PilSection[] = [];
  let revisionDate: string | null = null;
  for (const b of blocks) {
    const body = toMarkdown(b.lines);
    if (!body) continue; // e.g. "4. CLINICAL PARTICULARS" immediately followed by 4.1
    const t = displayTitle(b.heading.title);
    let key = b.heading.key ?? slug(t);
    while (used.has(key)) key = `${key}-2`;
    used.add(key);
    if (/date of revision/i.test(t)) revisionDate ??= b.lines[0]?.trim() ?? null;
    sections.push({
      key,
      title: t,
      body,
      ...(/patient counsel/i.test(t) ? { patientFacing: true } : {}),
    });
  }

  // Generic name section duplicates the title on numbered inserts; keep it, it is part of the approved text.
  return { kind, title, revisionDate, sections };
}
