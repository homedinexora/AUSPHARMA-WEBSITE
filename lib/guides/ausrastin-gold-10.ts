import type { PatientGuide } from "../patient-guide";

/**
 * Transcribed verbatim from "Ausrastin Gold 10 Infographic – 2nd Iteration (Layman version)"
 * (docs/samples/ausrastin-gold-10-patient-guide.pdf). Imported as a DRAFT: regulatory/QA must
 * approve before publishing. TODO(content): the "*" (Children) and "**" (Pregnancy) footnotes are
 * referenced in the PDF but their text is not in it.
 */
export const ausrastinGold10Guide: PatientGuide = {
  headline: "Helps stop another heart attack or stroke — by keeping your blood flowing and your cholesterol down.",
  tagline: "Three medicines. One capsule. Once a day.",
  ingredients: [
    { name: "Rosuvastatin", strength: "10 mg", role: "Cholesterol medicine (a “statin”) — lowers “bad” cholesterol" },
    { name: "Aspirin", strength: "75 mg", role: "Blood thinner — stops blood cells from sticking together" },
    { name: "Clopidogrel", strength: "75 mg", role: "Blood thinner — blocks clots in a second, different way" },
  ],
  howItWorks: [
    {
      title: "A · Rosuvastatin, in the liver",
      steps: [
        "Your liver makes cholesterol (its cholesterol “factory”, HMG-CoA reductase, is switched off by rosuvastatin)",
        "Liver makes less cholesterol",
        "Liver pulls more “bad” cholesterol out of the blood",
      ],
      result: "less “bad” cholesterol, calmer fatty deposits",
    },
    {
      title: "B · Aspirin, in the blood",
      steps: [
        "Blood cells called platelets make a “stick together” signal (its signal maker, the COX-1 enzyme, is switched off by aspirin, and stays off for as long as each platelet lives)",
        "Less “stick together” signal",
        "Platelets stay apart",
      ],
      result: "fewer clots",
    },
    {
      title: "C · Clopidogrel, on the platelet",
      steps: [
        "Your liver turns clopidogrel into its working form (it blocks the platelet “docking port”, the P2Y12 receptor, for as long as each platelet lives)",
        "Platelets cannot lock together",
      ],
      result: "fewer clots",
    },
  ],
  howItWorksSummary:
    "blood flows smoothly to the heart and brain, and fatty deposits are less likely to burst and cause a clot.",
  howToTake: [
    "Swallow whole with water — do not open, chew or crush.",
    "With or after food to protect the stomach.",
    "Same time every day, exactly as your doctor told you.",
    "Missed a dose? Take it when you remember that day. If the next dose is almost due, skip it. Never take two at once.",
  ],
  safety: [
    { topic: "Alcohol", verdict: "Avoid", tone: "avoid" },
    { topic: "Driving", verdict: "Avoid if dizzy", tone: "avoid" },
    { topic: "Children", verdict: "Not under 12", tone: "avoid" },
    { topic: "Pregnancy", verdict: "Ask doctor", tone: "ask" },
    { topic: "Breastfeeding", verdict: "Ask doctor", tone: "ask" },
    { topic: "Age over 65", verdict: "Ask doctor", tone: "ask" },
    { topic: "Liver problems", verdict: "Tell doctor", tone: "tell" },
    { topic: "Kidney problems", verdict: "Tell doctor", tone: "tell" },
    { topic: "Heart patients", verdict: "Safe if prescribed", tone: "ok" },
  ],
  mixWarning:
    "Tell every doctor and dentist you take this capsule — some medicines mixed with it can cause serious bleeding.",
  dangerous: [
    {
      group: "Other blood thinners & clotting medicines",
      examples: ["Rivaroxaban", "Argatroban", "Dicoumarol", "Protamine"],
      note: "Too much blood thinning can cause serious bleeding.",
    },
    { group: "Eye drops for glaucoma", examples: ["Brinzolamide", "Dorzolamide"], note: "Tell your eye doctor you take this capsule." },
    {
      group: "Other medicines",
      examples: ["Deferasirox", "Modafinil", "Darunavir", "Panobinostat"],
      note: "Used for iron overload, excess sleepiness, HIV and some cancers.",
    },
  ],
  careful: [
    {
      group: "Other blood thinners",
      examples: "e.g. warfarin, heparin",
      clashesWith: "Aspirin + Clopidogrel",
      note: "Bleeding risk goes up sharply. Your doctor must check you regularly.",
    },
    {
      group: "Common painkillers",
      examples: "like ibuprofen, diclofenac, naproxen",
      clashesWith: "Aspirin + Clopidogrel",
      note: "Can cause stomach ulcers and bleeding. Ask before buying any painkiller.",
    },
    {
      group: "Cyclosporine",
      examples: "Used after organ transplants and for some immune conditions",
      clashesWith: "Rosuvastatin",
      note: "Should not be taken together. Raises rosuvastatin levels and can seriously damage muscles.",
    },
    {
      group: "Acidity / gas tablets",
      examples: "like omeprazole",
      clashesWith: "Clopidogrel",
      note: "Can make clopidogrel work less well. Your doctor may pick another, like pantoprazole.",
    },
  ],
  doNotTakeIf: [
    "Bleeding right now, a bleeding disorder (like haemophilia) or a stomach ulcer",
    "Liver disease, or abnormal liver blood tests",
    "Allergy to any ingredient",
    "! Serious kidney problems — your doctor must check you closely",
  ],
  lifestyle: [
    { topic: "Alcohol", advice: "raises the risk of stomach bleeding. Avoid." },
    { topic: "Smoking", advice: "damages blood vessels and clogs arteries faster." },
    { topic: "Diet", advice: "less salt and saturated fat; more vegetables and whole grains." },
    { topic: "Small cuts", advice: "use a soft toothbrush; take care with razors." },
  ],
  sideEffects: [
    { name: "Stomach discomfort", description: "A mild burning or upset feeling in the stomach.", easeIt: "Ease it: take with or right after food" },
    { name: "Nausea", description: "Feeling like you might vomit.", easeIt: "Ease it: swallow whole, with a meal" },
    { name: "Easy bruising", description: "Your blood is thinner, so bruises appear more easily.", easeIt: "Tell your doctor about big bruises with no clear reason" },
    { name: "Bleeding gums & small cuts", description: "Small cuts may bleed a little longer than usual.", easeIt: "Ease it: soft toothbrush, careful shaving" },
    { name: "Mild muscle aches", description: "Can come from the cholesterol medicine (rosuvastatin).", easeIt: "Tell your doctor about any new pain with no clear reason" },
    { name: "Dizziness or sleepiness", description: "You may feel light-headed, sleepy, or see less clearly.", easeIt: "Don't drive or use machines if affected" },
  ],
  whenSerious: [
    { mild: "muscle aches", serious: "pain or weakness with no clear reason, or dark urine" },
    { mild: "stomach discomfort", serious: "severe stomach pain" },
    { mild: "easy bruising", serious: "unusual bleeding that will not stop" },
  ],
  callDoctor: [
    "Unexplained muscle pain or weakness",
    "Dark urine (tea or cola coloured)",
    "Severe stomach pain",
    "Bleeding that will not stop",
    "Large bruises or red spots",
    "Black stools or vomiting blood",
  ],
  overdose:
    "Took too many? Go to the hospital emergency room at once. Warning signs: severe stomach pain, vomiting, ringing in the ears, confusion or bleeding.",
  footnotes: [
    "This is not a full list. Show all your medicines — including eye drops and shop-bought ones — to your doctor or pharmacist.",
    "Not a complete list of side effects. Never stop the medicine on your own — consult your doctor or pharmacist.",
  ],
  sources:
    "Apollo Pharmacy drug–drug interaction data and drug information, Rosuvastatin + Clopidogrel + Aspirin (accessed Oct 2026); Ausrastin Gold 10 carton artwork ART/26/07/7489-01 (2026); Lippincott Illustrated Reviews: Pharmacology (Wolters Kluwer).",
};
