/**
 * "Easy guide for patients": structured, plain-language product guide (format from the
 * Ausrastin Gold 10 infographic). Staff edit each block as text, one item per line,
 * fields separated by " | ". Every guide needs regulatory approval (QA publish) before it is public.
 */

export type SafetyTone = "avoid" | "ask" | "tell" | "ok";

export interface PatientGuide {
  headline: string; // e.g. what the medicine is for, in plain words
  tagline: string; // e.g. "Three medicines. One capsule. Once a day."
  ingredients: { name: string; strength: string; role: string }[];
  howItWorks: { title: string; steps: string[]; result: string }[];
  howItWorksSummary: string;
  howToTake: string[];
  safety: { topic: string; verdict: string; tone: SafetyTone }[];
  mixWarning: string; // e.g. "Tell every doctor and dentist you take this capsule — …"
  dangerous: { group: string; examples: string[]; note: string }[];
  careful: { group: string; examples: string; clashesWith: string; note: string }[];
  doNotTakeIf: string[];
  lifestyle: { topic: string; advice: string }[];
  sideEffects: { name: string; description: string; easeIt: string }[];
  whenSerious: { mild: string; serious: string }[];
  callDoctor: string[];
  overdose: string;
  footnotes: string[];
  sources: string;
}

export type GuideField = keyof PatientGuide;

const TONES: SafetyTone[] = ["avoid", "ask", "tell", "ok"];

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const cells = (l: string) => l.split("|").map((c) => c.trim());

export class GuideFormatError extends Error {}

function need(l: string, n: number, block: string): string[] {
  const c = cells(l);
  if (c.length < n || c.slice(0, n).some((x) => !x))
    throw new GuideFormatError(`${block}: "${l}" needs ${n} parts separated by |`);
  return c;
}

/** Parse the text of one admin block into its structured value. */
export function parseBlock<K extends GuideField>(field: K, text: string): PatientGuide[K] {
  const t = text.trim();
  switch (field) {
    case "headline":
    case "tagline":
    case "howItWorksSummary":
    case "mixWarning":
    case "overdose":
    case "sources":
      return t.replace(/\s*\n\s*/g, " ") as PatientGuide[K];
    case "howToTake":
    case "doNotTakeIf":
    case "callDoctor":
    case "footnotes":
      return lines(t) as PatientGuide[K];
    case "ingredients":
      return lines(t).map((l) => {
        const [name, strength, role] = need(l, 3, "Ingredients");
        return { name, strength, role };
      }) as PatientGuide[K];
    case "safety":
      return lines(t).map((l) => {
        const [topic, verdict, tone] = need(l, 3, "Safety at a glance");
        const tn = tone.toLowerCase() as SafetyTone;
        if (!TONES.includes(tn)) throw new GuideFormatError(`Safety at a glance: tone must be one of ${TONES.join(", ")}`);
        return { topic, verdict, tone: tn };
      }) as PatientGuide[K];
    case "dangerous":
      return lines(t).map((l) => {
        const [group, examples, note] = need(l, 3, "Do not mix");
        return { group, examples: examples.split(",").map((e) => e.trim()).filter(Boolean), note };
      }) as PatientGuide[K];
    case "careful":
      return lines(t).map((l) => {
        const [group, examples, clashesWith, note] = need(l, 4, "Be careful with");
        return { group, examples, clashesWith, note };
      }) as PatientGuide[K];
    case "lifestyle":
      return lines(t).map((l) => {
        const [topic, advice] = need(l, 2, "Food & lifestyle");
        return { topic, advice };
      }) as PatientGuide[K];
    case "sideEffects":
      return lines(t).map((l) => {
        const [name, description, easeIt = ""] = need(l, 2, "Side effects");
        return { name, description, easeIt };
      }) as PatientGuide[K];
    case "whenSerious":
      return lines(t).map((l) => {
        const [mild, serious] = need(l, 2, "When mild becomes serious");
        return { mild, serious };
      }) as PatientGuide[K];
    case "howItWorks": {
      // Blocks separated by a blank line: title, steps…, "Result: …"
      return t
        .split(/\n\s*\n/)
        .map((b) => lines(b))
        .filter((b) => b.length)
        .map((b) => {
          const [title, ...rest] = b;
          const resultLine = rest.find((r) => /^result:/i.test(r));
          if (!resultLine) throw new GuideFormatError(`How it works: "${title}" needs a "Result: …" line`);
          return {
            title,
            steps: rest.filter((r) => r !== resultLine),
            result: resultLine.replace(/^result:\s*/i, ""),
          };
        }) as PatientGuide[K];
    }
  }
  throw new GuideFormatError(`Unknown block ${String(field)}`);
}

/** Inverse of parseBlock, for showing a stored guide in the admin textareas. */
export function serializeBlock<K extends GuideField>(field: K, value: PatientGuide[K]): string {
  const v = value as unknown;
  switch (field) {
    case "headline":
    case "tagline":
    case "howItWorksSummary":
    case "mixWarning":
    case "overdose":
    case "sources":
      return v as string;
    case "howToTake":
    case "doNotTakeIf":
    case "callDoctor":
    case "footnotes":
      return (v as string[]).join("\n");
    case "ingredients":
      return (v as PatientGuide["ingredients"]).map((x) => `${x.name} | ${x.strength} | ${x.role}`).join("\n");
    case "safety":
      return (v as PatientGuide["safety"]).map((x) => `${x.topic} | ${x.verdict} | ${x.tone}`).join("\n");
    case "dangerous":
      return (v as PatientGuide["dangerous"]).map((x) => `${x.group} | ${x.examples.join(", ")} | ${x.note}`).join("\n");
    case "careful":
      return (v as PatientGuide["careful"]).map((x) => `${x.group} | ${x.examples} | ${x.clashesWith} | ${x.note}`).join("\n");
    case "lifestyle":
      return (v as PatientGuide["lifestyle"]).map((x) => `${x.topic} | ${x.advice}`).join("\n");
    case "sideEffects":
      return (v as PatientGuide["sideEffects"]).map((x) => `${x.name} | ${x.description}${x.easeIt ? ` | ${x.easeIt}` : ""}`).join("\n");
    case "whenSerious":
      return (v as PatientGuide["whenSerious"]).map((x) => `${x.mild} | ${x.serious}`).join("\n");
    case "howItWorks":
      return (v as PatientGuide["howItWorks"]).map((b) => [b.title, ...b.steps, `Result: ${b.result}`].join("\n")).join("\n\n");
  }
  return "";
}

export const GUIDE_FIELDS: { field: GuideField; label: string; help: string }[] = [
  { field: "headline", label: "Headline", help: "One sentence, plain words." },
  { field: "tagline", label: "Tagline", help: "Short line, e.g. how often it is taken." },
  { field: "ingredients", label: "What's inside", help: "Name | Strength | Plain-language role" },
  { field: "howItWorks", label: "How it works", help: "Blocks separated by a blank line: title, steps, then “Result: …”" },
  { field: "howItWorksSummary", label: "All together", help: "One sentence." },
  { field: "howToTake", label: "How to take", help: "One step per line." },
  { field: "safety", label: "Safety at a glance", help: "Topic | Verdict | avoid / ask / tell / ok" },
  { field: "mixWarning", label: "Medicines that don't mix: warning", help: "One sentence, as printed." },
  { field: "dangerous", label: "Do not take together", help: "Group | example, example | Note" },
  { field: "careful", label: "Be careful with", help: "Group | Examples | Which ingredient clashes | Note" },
  { field: "doNotTakeIf", label: "Do not take if you have", help: "One per line. Start with ! for “tell your doctor”." },
  { field: "lifestyle", label: "Food & lifestyle", help: "Topic | Advice" },
  { field: "sideEffects", label: "Common side effects", help: "Name | What it feels like | Ease it / what to do" },
  { field: "whenSerious", label: "When mild becomes serious", help: "Mild | Serious" },
  { field: "callDoctor", label: "Call your doctor right away", help: "One sign per line." },
  { field: "overdose", label: "Took too many?", help: "One paragraph." },
  { field: "footnotes", label: "Footnotes", help: "One per line." },
  { field: "sources", label: "Sources", help: "As printed on the approved guide." },
];

export function emptyGuide(): PatientGuide {
  return {
    headline: "",
    tagline: "",
    ingredients: [],
    howItWorks: [],
    howItWorksSummary: "",
    howToTake: [],
    safety: [],
    mixWarning: "",
    dangerous: [],
    careful: [],
    doNotTakeIf: [],
    lifestyle: [],
    sideEffects: [],
    whenSerious: [],
    callDoctor: [],
    overdose: "",
    footnotes: [],
    sources: "",
  };
}
