"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfielLite = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
};

type RubricLevel = "-" | "+/-" | "+" | "++";

type RubricItem = {
  key: string;
  title: string;
  level: RubricLevel;
  color: string;
  description: string;
  autoFeedback: string;
};

type GradeMode = "2e" | "3e";

type Props = {
  uid: string;
  profiel: ProfielLite | null;
  defaultMas?: number | null;
};

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mkId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toNum(v: string) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function countSentencesApprox(s: string) {
  const t = (s || "").trim();
  if (!t) return 0;
  return t
    .split(/[.!?]+/)
    .map((x) => x.trim())
    .filter(Boolean).length;
}

function hasAnyWord(s: string, words: string[]) {
  const t = (s || "").toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

function hasActionKeyword(s: string) {
  const t = (s || "").toLowerCase();
  return (
    t.includes("volgende") ||
    t.includes("aanpassen") ||
    t.includes("plan") ||
    t.includes("ik ga") ||
    t.includes("extra") ||
    t.includes("zodat") ||
    t.includes("omdat") ||
    t.includes("daarom")
  );
}

function levelText(
  level: RubricLevel,
  minus: string,
  pm: string,
  plus: string,
  pp: string
) {
  if (level === "-") return minus;
  if (level === "+/-") return pm;
  if (level === "+") return plus;
  return pp;
}

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  okBg: "rgba(104,180,255,0.10)",
  okBorder: "rgba(104,180,255,0.24)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  infoBg: "rgba(123, 213, 255, 0.10)",
  infoBorder: "rgba(123, 213, 255, 0.26)",
};

const rubricColors: Record<RubricLevel, string> = {
  "-": "rgba(255,85,112,0.25)",
  "+/-": "rgba(255,193,102,0.22)",
  "+": "rgba(140,255,140,0.16)",
  "++": "rgba(80,220,120,0.22)",
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  sectionTitle: { fontSize: 13, fontWeight: 950, color: ui.text },
  small: { fontSize: 12.5, color: ui.muted, lineHeight: 1.38 },
  input: {
    marginTop: 10,
    width: "100%",
    height: 48,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    color: ui.text,
    padding: "0 14px",
    outline: "none",
    fontWeight: 950,
  },
  textarea: {
    marginTop: 10,
    width: "100%",
    minHeight: 96,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    color: ui.text,
    padding: "12px 14px",
    outline: "none",
    fontWeight: 900,
    resize: "vertical",
    lineHeight: 1.35,
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 12,
  },
  row3: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 950,
    color: ui.muted,
    letterSpacing: 0.6,
  },
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background:
      "linear-gradient(90deg, rgba(104,180,255,0.28), rgba(255,104,180,0.22)), rgba(0,0,0,0.70)",
    color: ui.text,
    fontWeight: 980,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  ghostBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  okBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.okBg,
    border: `1px solid ${ui.okBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  warnBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.infoBg,
    border: `1px solid ${ui.infoBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  pill: {
    height: 34,
    padding: "0 12px",
    borderRadius: 14,
    display: "inline-grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${ui.border}`,
  },
  rubricCard: {
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.25)",
  },
  rubricTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  rubricBadge: {
    minWidth: 64,
    height: 34,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 980,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    color: ui.text,
  },
  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 42,
    padding: "0 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.30)",
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
  },
};

/* =========================
   2E GRAAD
========================= */

type TalkTest = "Groen" | "Oranje" | "Rood" | "";

type SecondGradeForm = {
  date: string;
  mas: string;
  trainingType: "Duur" | "Interval" | "";
  warmupMin: string;
  coreText: string;
  cooldownMin: string;

  hrRest: string;
  hrPeak: string;
  hrRec1: string;

  talk: TalkTest;
  talkExplain: string;

  rpe: string;
  reflection: string;

  didStrength: boolean;
  strengthCircuitName: string;
  strengthRpe: string;
};

function initSecond(defaultMas?: number | null): SecondGradeForm {
  return {
    date: toYMD(),
    mas: defaultMas && Number.isFinite(defaultMas) ? String(defaultMas) : "",
    trainingType: "",
    warmupMin: "",
    coreText: "",
    cooldownMin: "",
    hrRest: "",
    hrPeak: "",
    hrRec1: "",
    talk: "",
    talkExplain: "",
    rpe: "",
    reflection: "",
    didStrength: false,
    strengthCircuitName: "",
    strengthRpe: "",
  };
}

function rubricsSecond(f: SecondGradeForm): RubricItem[] {
  const hasType = Boolean(f.trainingType);
  const hasWarm = Boolean(f.warmupMin.trim());
  const hasCore = Boolean(f.coreText.trim());
  const hasCool = Boolean(f.cooldownMin.trim());
  const filled = [hasType, hasWarm, hasCore, hasCool].filter(Boolean).length;

  let lvl1: RubricLevel = "-";
  if (filled <= 2) lvl1 = "-";
  else if (filled === 3) lvl1 = "+/-";
  else {
    const coreSpecific =
      f.trainingType === "Duur"
        ? f.coreText.toLowerCase().includes("%") ||
          f.coreText.toLowerCase().includes("mas") ||
          f.coreText.toLowerCase().includes("min")
        : f.coreText.includes("x") ||
          f.coreText.includes("×") ||
          f.coreText.includes("'") ||
          f.coreText.toLowerCase().includes("rust");
    lvl1 = coreSpecific ? "++" : "+";
  }

  const item1: RubricItem = {
    key: "plan",
    title: "Training volledig en logisch ingevuld",
    level: lvl1,
    color: rubricColors[lvl1],
    description: levelText(
      lvl1,
      "Training ontbreekt of kern/opwarming/cooling-down is niet ingevuld.",
      "Training is grotendeels ingevuld maar mist 1 onderdeel of intensiteit is onduidelijk.",
      "Volledig ingevuld (opwarming–kern–cooling-down) en keuze duur/interval is duidelijk.",
      "Volledig én zeer verzorgd: tijden/intensiteit zijn duidelijk én passen bij de gekozen training."
    ),
    autoFeedback:
      lvl1 === "++"
        ? "Top: je plan is volledig én duidelijk uitgewerkt."
        : lvl1 === "+"
        ? "Goed: alles staat ingevuld."
        : lvl1 === "+/-"
        ? "Bijna: vul nog één ontbrekend onderdeel concreet aan."
        : "Vul je training volledig in (type, opwarming, kern, cooling-down).",
  };

  const rest = toNum(f.hrRest);
  const peak = toNum(f.hrPeak);
  const rec = toNum(f.hrRec1);
  const hrCount = [rest, peak, rec].filter((n) => Number.isFinite(n)).length;

  let lvl2: RubricLevel = "-";
  if (hrCount < 2) lvl2 = "-";
  else if (hrCount === 2) lvl2 = "+/-";
  else {
    const logical = peak > rest && rec < peak;
    if (!logical) lvl2 = "+/-";
    else {
      const drop = peak - rec;
      lvl2 = drop >= 15 ? "++" : "+";
    }
  }

  const item2: RubricItem = {
    key: "hr",
    title: "Hartslagmetingen correct uitgevoerd",
    level: lvl2,
    color: rubricColors[lvl2],
    description: levelText(
      lvl2,
      "Minder dan 2 hartslagwaarden ingevuld.",
      "Waarden zijn (bijna) volledig maar onlogisch of onduidelijk gemeten.",
      "3 waarden ingevuld en logisch (piek > rust, herstel < piek).",
      "3 waarden logisch én herstel toont duidelijke recuperatie (herstel merkbaar lager dan piek)."
    ),
    autoFeedback:
      lvl2 === "++"
        ? "Sterk: je herstel toont duidelijke recuperatie."
        : lvl2 === "+"
        ? "Goed: hartslagwaarden zijn logisch."
        : lvl2 === "+/-"
        ? "Controleer je meting: piek moet hoger zijn dan rust en herstel lager dan piek."
        : "Vul rust, piek en herstelhartslag (na 1 min) in.",
  };

  const hasTalk = Boolean(f.talk);
  const hasExplain = (f.talkExplain || "").trim().length > 0;

  let lvl3: RubricLevel = "-";
  if (!hasTalk) lvl3 = "-";
  else if (hasTalk && !hasExplain) lvl3 = "+/-";
  else {
    const refl = (f.reflection || "").toLowerCase();
    const adaptive =
      refl.includes("volgende") ||
      refl.includes("aanpassen") ||
      refl.includes("trager") ||
      refl.includes("sneller");
    lvl3 = adaptive ? "++" : "+";
  }

  const item3: RubricItem = {
    key: "talk",
    title: "Praattest correct toegepast",
    level: lvl3,
    color: rubricColors[lvl3],
    description: levelText(
      lvl3,
      "Praattest niet ingevuld.",
      "Praattest ingevuld maar zonder uitlegzin.",
      "Praattest + korte uitlegzin ingevuld.",
      "Praattest + goede uitleg én je stuurt bij (bv. volgende keer aanpassen)."
    ),
    autoFeedback:
      lvl3 === "++"
        ? "Mooi: je gebruikt de praattest en stuurt bij."
        : lvl3 === "+"
        ? "Goed: je praattest en uitleg zijn ingevuld."
        : lvl3 === "+/-"
        ? "Vul nog 1 korte uitlegzin in bij je praattest."
        : "Kies Groen/Oranje/Rood en schrijf 1 zin uitleg.",
  };

  const rpe = toNum(f.rpe);
  const hasRpe = Number.isFinite(rpe) && rpe >= 1 && rpe <= 10;
  const refl = (f.reflection || "").trim();
  const reflLen = refl.length;
  const sentences = countSentencesApprox(refl);

  let lvl4: RubricLevel = "-";
  if (!hasRpe || !refl) lvl4 = "-";
  else if (reflLen < 100 || sentences < 2) lvl4 = "+/-";
  else if (reflLen >= 160 && hasActionKeyword(refl)) lvl4 = "++";
  else lvl4 = "+";

  const item4: RubricItem = {
    key: "reflectie",
    title: "Reflectie en RPE",
    level: lvl4,
    color: rubricColors[lvl4],
    description: levelText(
      lvl4,
      "Geen RPE of reflectie ontbreekt.",
      "RPE ingevuld + reflectie te kort (of minder dan 2 zinnen).",
      "RPE + minimaal 2 zinnen (goed + verbeterpunt).",
      "RPE + sterke reflectie met concreet actiepunt voor volgende keer."
    ),
    autoFeedback:
      lvl4 === "++"
        ? "Topreflectie: concreet en met actiepunt."
        : lvl4 === "+"
        ? "Goed: je reflectie is duidelijk."
        : lvl4 === "+/-"
        ? "Schrijf minstens 2 zinnen: wat ging goed + wat neem je mee."
        : "Vul je RPE (1–10) in en schrijf een korte reflectie.",
  };

  return [item1, item2, item3, item4];
}

/* =========================
   3E GRAAD
========================= */

type ActivityRow = {
  id: string;
  activity: string;
  minutes: string;
  met: string;
};

type PalChoice = "Laag actief" | "Matig actief" | "Actief" | "";

type ThirdGradeForm = {
  date: string;
  weightKg: string;

  activities: ActivityRow[];

  pal: PalChoice;
  palExplain: string;

  kcalIntake: string;
  kcalIntakeSource: string;

  kcalTotalBurn: string;
  burnSource: "Automatisch via activiteiten" | "Externe calculator / app" | "Eigen schatting" | "";

  balanceExplain: string;
  conceptExplain: string;
};

const MET_OPTIONS: { label: string; value: number }[] = [
  { label: "Slapen (0.9)", value: 0.9 },
  { label: "Zitten / schoolwerk (1.3)", value: 1.3 },
  { label: "Staan rustig (1.8)", value: 1.8 },
  { label: "Wandelen rustig (2.8)", value: 2.8 },
  { label: "Wandelen stevig (3.5)", value: 3.5 },
  { label: "Huishoudelijk werk licht (2.5)", value: 2.5 },
  { label: "Fietsen rustig (4.0)", value: 4.0 },
  { label: "Fietsen stevig (6.0)", value: 6.0 },
  { label: "Sporttraining gematigd (5.0)", value: 5.0 },
  { label: "Krachttraining (6.0)", value: 6.0 },
  { label: "Lopen rustig (7.0)", value: 7.0 },
  { label: "Traplopen (8.0)", value: 8.0 },
  { label: "Intensieve sport (8.5)", value: 8.5 },
];

function initThird(): ThirdGradeForm {
  return {
    date: toYMD(),
    weightKg: "",
    activities: Array.from({ length: 6 }).map(() => ({
      id: mkId(),
      activity: "",
      minutes: "",
      met: "",
    })),
    pal: "",
    palExplain: "",
    kcalIntake: "",
    kcalIntakeSource: "",
    kcalTotalBurn: "",
    burnSource: "",
    balanceExplain: "",
    conceptExplain: "",
  };
}

function isRowComplete(r: ActivityRow) {
  const min = toNum(r.minutes);
  const met = toNum(r.met);
  return r.activity.trim() && Number.isFinite(min) && min > 0 && Number.isFinite(met) && met > 0;
}

function calcMetMinutes(r: ActivityRow) {
  const min = toNum(r.minutes);
  const met = toNum(r.met);
  if (!Number.isFinite(min) || !Number.isFinite(met)) return 0;
  return met * min;
}

function calcActivityKcal(r: ActivityRow, weightKg: string) {
  const min = toNum(r.minutes);
  const met = toNum(r.met);
  const kg = toNum(weightKg);
  if (!Number.isFinite(min) || !Number.isFinite(met) || !Number.isFinite(kg) || kg <= 0) return 0;
  return met * kg * (min / 60);
}

function inferPalFromActivities(rows: ActivityRow[]): PalChoice | "" {
  const complete = rows.filter(isRowComplete);
  const totalMinutes = complete.reduce((sum, r) => sum + Math.max(0, toNum(r.minutes)), 0);
  const lowMinutes = complete.reduce((sum, r) => {
    const met = toNum(r.met);
    return sum + (Number.isFinite(met) && met <= 1.8 ? Math.max(0, toNum(r.minutes)) : 0);
  }, 0);
  const modHighMinutes = complete.reduce((sum, r) => {
    const met = toNum(r.met);
    return sum + (Number.isFinite(met) && met >= 3 ? Math.max(0, toNum(r.minutes)) : 0);
  }, 0);

  if (totalMinutes <= 0) return "";

  const ratioModHigh = modHighMinutes / totalMinutes;
  const ratioLow = lowMinutes / totalMinutes;

  if (ratioModHigh >= 0.3) return "Actief";
  if (ratioModHigh >= 0.14 || (ratioLow < 0.7 && modHighMinutes >= 60)) return "Matig actief";
  return "Laag actief";
}

function textExplainsPalVsMet(s: string) {
  const t = (s || "").toLowerCase();
  const hasMet = t.includes("met");
  const hasPal = t.includes("pal");
  const hasActivity = t.includes("activiteit") || t.includes("een activiteit") || t.includes("één activiteit");
  const hasDay = t.includes("dag") || t.includes("hele dag") || t.includes("volledige dag");
  return hasMet && hasPal && hasActivity && hasDay;
}

function rubricsThird(f: ThirdGradeForm): {
  items: RubricItem[];
  totals: {
    metMinutesTotal: number;
    activityKcalTotal: number;
    kcalBalance: number | null;
    inferredPal: PalChoice | "";
  };
  flags: string[];
} {
  const rows = f.activities || [];
  const completeRows = rows.filter(isRowComplete);
  const completeCount = completeRows.length;

  const hasLow = rows.some((r) => {
    const met = toNum(r.met);
    return Number.isFinite(met) && met <= 1.8;
  });

  const hasModerateOrHigh = rows.some((r) => {
    const met = toNum(r.met);
    return Number.isFinite(met) && met >= 3;
  });

  const metTotal = rows.reduce((sum, r) => sum + calcMetMinutes(r), 0);
  const activityKcalTotal = rows.reduce((sum, r) => sum + calcActivityKcal(r, f.weightKg), 0);

  const intake = toNum(f.kcalIntake);
  const totalBurn = toNum(f.kcalTotalBurn);
  const kcalBalance =
    Number.isFinite(intake) && Number.isFinite(totalBurn) ? intake - totalBurn : null;

  const inferredPal = completeCount >= 3 ? inferPalFromActivities(rows) : "";

  const flags: string[] = [];
  if (f.pal && inferredPal && f.pal !== inferredPal) {
    flags.push(
      `Je gekozen PAL (${f.pal}) lijkt niet helemaal te passen bij je activiteiten. De app schat eerder: ${inferredPal}.`
    );
  }
  if (
    Number.isFinite(totalBurn) &&
    Number.isFinite(activityKcalTotal) &&
    Math.abs(totalBurn - activityKcalTotal) > 1200
  ) {
    flags.push(
      "Je totaal kcal-verbruik wijkt sterk af van het automatisch berekende verbruik uit je activiteiten. Controleer je getallen."
    );
  }

  let lvl1: RubricLevel = "-";
  if (completeCount < 4) lvl1 = "-";
  else if (completeCount < 6) lvl1 = "+/-";
  else if (completeCount >= 7 && hasLow && hasModerateOrHigh) lvl1 = "++";
  else lvl1 = "+";

  const item1: RubricItem = {
    key: "log_met",
    title: "Activiteitenlog en MET correct ingevuld",
    level: lvl1,
    color: rubricColors[lvl1],
    description: levelText(
      lvl1,
      "Te weinig activiteiten volledig ingevuld of meerdere activiteiten missen duur/MET.",
      "Er is al een bruikbaar logboek, maar het is nog niet volledig genoeg.",
      "Minstens 6 activiteiten zijn volledig ingevuld met passende duur en MET.",
      "Sterk dagoverzicht: voldoende activiteiten én duidelijke spreiding tussen laag en matig/hoog actief."
    ),
    autoFeedback:
      lvl1 === "++"
        ? "Sterk: je daglog is volledig en realistisch opgebouwd."
        : lvl1 === "+"
        ? "Goed: je hebt voldoende activiteiten correct ingevuld."
        : lvl1 === "+/-"
        ? "Vul nog meer activiteiten volledig in tot je dag duidelijker in beeld komt."
        : "Je activiteitenlog is nog te onvolledig. Vul activiteit, duur en MET correct in.",
  };

  const hasPal = Boolean(f.pal);
  const palText = (f.palExplain || "").trim();
  const palLen = palText.length;
  const palMentionsDay = hasAnyWord(palText, ["dag", "hele dag", "volledige dag"]);
  const palMentionsExamples = hasAnyWord(palText, [
    "zitten",
    "school",
    "wandelen",
    "fietsen",
    "training",
    "sport",
    "bewegen",
  ]);
  const palLogicOk = !f.pal || !inferredPal || f.pal === inferredPal;

  let lvl2: RubricLevel = "-";
  if (!hasPal) lvl2 = "-";
  else if (palLen < 60) lvl2 = "+/-";
  else if (palLen >= 120 && palMentionsDay && palMentionsExamples && palLogicOk) lvl2 = "++";
  else lvl2 = "+";

  const item2: RubricItem = {
    key: "pal",
    title: "PAL correct gekozen en uitgelegd",
    level: lvl2,
    color: rubricColors[lvl2],
    description: levelText(
      lvl2,
      "PAL ontbreekt.",
      "PAL is gekozen, maar de uitleg is te kort of te vaag.",
      "PAL is gekozen en duidelijk gekoppeld aan de volledige dag.",
      "PAL is sterk uitgelegd met concrete voorbeelden uit de dag én past logisch bij het activiteitenprofiel."
    ),
    autoFeedback:
      lvl2 === "++"
        ? "Heel goed: je PAL-keuze is logisch en goed beargumenteerd."
        : lvl2 === "+"
        ? "Goed: je PAL-uitleg is duidelijk."
        : lvl2 === "+/-"
        ? "Schrijf duidelijker waarom jouw volledige dag laag, matig of actief was."
        : "Kies een PAL-niveau en leg het uit op basis van je volledige dag.",
  };

  const hasIntake = Number.isFinite(intake) && intake > 0;
  const hasBurn = Number.isFinite(totalBurn) && totalBurn > 0;
  const explain = (f.balanceExplain || "").trim();
  const explainLen = explain.length;
  const saysGain = hasAnyWord(explain, ["toename", "aankomen", "meer", "overschot"]);
  const saysLoss = hasAnyWord(explain, ["afname", "afvallen", "minder", "tekort"]);
  const saysStable = hasAnyWord(explain, ["stabiel", "behoud", "gelijk", "ongeveer hetzelfde"]);
  const saysLongTerm = hasAnyWord(explain, [
    "lange termijn",
    "op termijn",
    "als dit vaker gebeurt",
    "als dit vaak zo is",
  ]);

  let balanceLogicOk = false;
  if (kcalBalance !== null) {
    if (kcalBalance > 100) balanceLogicOk = saysGain;
    else if (kcalBalance < -100) balanceLogicOk = saysLoss;
    else balanceLogicOk = saysStable;
  }

  let lvl3: RubricLevel = "-";
  if (!hasIntake || !hasBurn) lvl3 = "-";
  else if (explainLen < 70) lvl3 = "+/-";
  else if (balanceLogicOk && saysLongTerm) lvl3 = "++";
  else lvl3 = "+";

  const item3: RubricItem = {
    key: "kcal_balance",
    title: "kcal-inname, verbruik en energiebalans",
    level: lvl3,
    color: rubricColors[lvl3],
    description: levelText(
      lvl3,
      "kcal-inname of kcal-verbruik ontbreekt.",
      "De berekeningen zijn ingevuld, maar de conclusie is nog te beperkt.",
      "Inname en verbruik zijn ingevuld en correct vergeleken.",
      "Sterk: de leerling legt correct uit wat het kcal-verschil betekent voor lichaamsgewicht op langere termijn."
    ),
    autoFeedback:
      lvl3 === "++"
        ? "Top: je energiebalans klopt én je conclusie is juist geformuleerd."
        : lvl3 === "+"
        ? "Goed: je vergelijkt inname en verbruik correct."
        : lvl3 === "+/-"
        ? "Leg duidelijker uit wat het verschil tussen inname en verbruik betekent."
        : "Vul kcal-inname en totaal kcal-verbruik in.",
  };

  const concept = (f.conceptExplain || "").trim();
  const conceptLen = concept.length;
  const conceptSentences = countSentencesApprox(concept);

  const mentionsMET = hasAnyWord(concept, ["met"]);
  const mentionsPAL = hasAnyWord(concept, ["pal"]);
  const mentionsKcal = hasAnyWord(concept, ["kcal", "calorie", "energie"]);

  let lvl4: RubricLevel = "-";
  if (conceptLen < 70 || conceptSentences < 2) lvl4 = "-";
  else if (!(mentionsMET && mentionsPAL && mentionsKcal)) lvl4 = "+/-";
  else if (textExplainsPalVsMet(concept) && conceptLen >= 150) lvl4 = "++";
  else lvl4 = "+";

  const item4: RubricItem = {
    key: "concept",
    title: "Begrip van MET, PAL en kcal",
    level: lvl4,
    color: rubricColors[lvl4],
    description: levelText(
      lvl4,
      "De uitleg is te kort of toont nog te weinig begrip van de begrippen.",
      "De begrippen komen terug, maar het onderscheid is nog niet helemaal duidelijk.",
      "De leerling legt PAL, MET en kcal in eenvoudige correcte taal uit.",
      "Sterke uitleg: MET wordt gekoppeld aan één activiteit, PAL aan de hele dag en kcal aan energiebalans."
    ),
    autoFeedback:
      lvl4 === "++"
        ? "Uitstekend: je maakt het verschil tussen MET en PAL duidelijk."
        : lvl4 === "+"
        ? "Goed: de basisbegrippen zijn correct uitgelegd."
        : lvl4 === "+/-"
        ? "Leg duidelijker uit dat MET bij een activiteit hoort en PAL bij je hele dag."
        : "Schrijf minstens 2 duidelijke zinnen over MET, PAL en kcal.",
  };

  return {
    items: [item1, item2, item3, item4],
    totals: {
      metMinutesTotal: metTotal,
      activityKcalTotal,
      kcalBalance,
      inferredPal,
    },
    flags,
  };
}

/* =========================
   HOOFDCOMPONENT
========================= */

export default function HomeworkTab({ uid, profiel, defaultMas }: Props) {
  const [mode, setMode] = useState<GradeMode>("2e");

  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [f2, setF2] = useState<SecondGradeForm>(() => initSecond(defaultMas ?? null));
  const [f3, setF3] = useState<ThirdGradeForm>(() => initThird());

  const rub2 = useMemo(() => rubricsSecond(f2), [f2]);
  const rub3 = useMemo(() => rubricsThird(f3), [f3]);

  const reset = () => {
    setInfo(null);
    setError(null);
    if (mode === "2e") setF2(initSecond(defaultMas ?? null));
    else setF3(initThird());
  };

  const handleSave = async () => {
    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      const payload =
        mode === "2e"
          ? {
              grade: "2e",
              form: f2,
              rubrics: rub2,
            }
          : {
              grade: "3e",
              form: f3,
              rubrics: rub3.items,
              totals: rub3.totals,
              flags: rub3.flags,
            };

      const row = {
        user_id: uid,
        schooljaar: profiel?.schooljaar ?? null,
        klas_naam: profiel?.klas_naam ?? null,
        date: mode === "2e" ? f2.date : f3.date,
        grade: mode,
        payload,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("functional_huiswerk_submissions").insert(row);
      if (error) throw new Error(error.message);

      setInfo("✅ Huiswerk opgeslagen!");
    } catch (e: any) {
      setError(e?.message ?? "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <div style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={styles.sectionTitle}>📚 Huiswerk</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Kies je graad en vul de opdracht in. De app berekent automatisch rubrics.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={styles.pill}>Graad</span>
            <select
              value={mode}
              onChange={(e) => {
                setInfo(null);
                setError(null);
                setMode(e.target.value as GradeMode);
              }}
              style={{ ...styles.input, marginTop: 0, height: 46, width: 180 }}
            >
              <option value="2e">2e graad</option>
              <option value="3e">3e graad</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      )}

      {info && (
        <div style={styles.okBox}>
          <b>Info:</b> {info}
        </div>
      )}

      {mode === "2e" ? (
        <>
          <SecondGradePanel value={f2} onChange={setF2} />
          <RubricPanel title="Rubrics (2e graad)" items={rub2} />
        </>
      ) : (
        <>
          <ThirdGradePanel value={f3} onChange={setF3} derived={rub3.totals} flags={rub3.flags} />
          <RubricPanel
            title="Rubrics (3e graad)"
            items={rub3.items}
            extraRight={`MET-minuten: ${Math.round(rub3.totals.metMinutesTotal)} | kcal-saldo: ${
              rub3.totals.kcalBalance === null ? "—" : Math.round(rub3.totals.kcalBalance)
            }`}
          />
        </>
      )}

      <div style={styles.actionRow}>
        <button onClick={reset} style={styles.ghostBtn}>
          Alles leegmaken
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>

      <style jsx>{`
        @media (min-width: 900px) {
          .row2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .row3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

/* =========================
   RUBRIC PANEL
========================= */

function RubricPanel({
  title,
  items,
  extraRight,
}: {
  title: string;
  items: RubricItem[];
  extraRight?: string;
}) {
  return (
    <div style={styles.panel}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={styles.sectionTitle}>🎯 {title}</div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Score: <b style={{ color: ui.text }}>- / +/- / + / ++</b> met kleur en uitleg.
          </div>
        </div>
        {extraRight ? <div style={styles.pill}>{extraRight}</div> : null}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div
            key={it.key}
            style={{ ...styles.rubricCard, borderColor: ui.border, background: it.color }}
          >
            <div style={styles.rubricTop}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 980, color: ui.text }}>{it.title}</div>
                <div style={{ ...styles.small, marginTop: 6 }}>{it.description}</div>
                <div style={{ ...styles.small, marginTop: 10 }}>
                  <b style={{ color: ui.text }}>Auto-feedback:</b> {it.autoFeedback}
                </div>
              </div>

              <div style={styles.rubricBadge}>{it.level}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   2E GRAAD UI
========================= */

function SecondGradePanel({
  value,
  onChange,
}: {
  value: SecondGradeForm;
  onChange: (next: SecondGradeForm) => void;
}) {
  const set = (patch: Partial<SecondGradeForm>) => onChange({ ...value, ...patch });

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>🏃‍♂️ Huiswerk 2e graad — MAS + hartslag + praattest</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Kies <b style={{ color: ui.text }}>Duur</b> of <b style={{ color: ui.text }}>Interval</b>.
          Meet <b style={{ color: ui.text }}>rust</b>, <b style={{ color: ui.text }}>piek</b> en{" "}
          <b style={{ color: ui.text }}>herstel (na 1 min)</b>. Gebruik de praattest tijdens de kern.
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Datum</div>
            <input
              value={value.date}
              onChange={(e) => set({ date: e.target.value })}
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>MAS/VMA (km/u)</div>
            <input
              value={value.mas}
              onChange={(e) => set({ mas: e.target.value })}
              style={styles.input}
              inputMode="decimal"
              placeholder="bv. 12.5"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Keuze training</div>
            <select
              value={value.trainingType}
              onChange={(e) => set({ trainingType: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Duur">Duurtraining</option>
              <option value="Interval">Intervaltraining</option>
            </select>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>2) Plan (opwarming – kern – cooling-down)</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Opwarming (min)</div>
            <input
              value={value.warmupMin}
              onChange={(e) => set({ warmupMin: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 10"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Kern (beschrijf)</div>
            <textarea
              value={value.coreText}
              onChange={(e) => set({ coreText: e.target.value })}
              style={styles.textarea}
              placeholder={
                value.trainingType === "Interval"
                  ? "bv. 8×1' aan 90–95% MAS met 1' rustig"
                  : "bv. 20 min aan 70% MAS (rustig tempo)"
              }
            />
            <div style={{ ...styles.small, marginTop: 8 }}>
              Tip: bij duurtraining schrijf je best “% MAS” of “tempo”. Bij interval: “aantal × duur / rust”.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Cooling-down (min)</div>
            <input
              value={value.cooldownMin}
              onChange={(e) => set({ cooldownMin: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 6"
            />
          </div>
        </div>
      </div>

      <div className="row3" style={styles.row3}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>3) Hartslag (verplicht)</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Rusthartslag (bpm)</div>
            <input
              value={value.hrRest}
              onChange={(e) => set({ hrRest: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 62"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Hoogste hartslag (bpm)</div>
            <input
              value={value.hrPeak}
              onChange={(e) => set({ hrPeak: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 178"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Herstel na 1 min (bpm)</div>
            <input
              value={value.hrRec1}
              onChange={(e) => set({ hrRec1: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 155"
            />
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            Meet rustig, noteer eerlijk. De app checkt enkel logica: piek hoger dan rust, herstel lager dan piek.
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>4) Praattest (verplicht)</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Tijdens de kern</div>
            <select
              value={value.talk}
              onChange={(e) => set({ talk: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Groen">Groen — vlot praten in zinnen</option>
              <option value="Oranje">Oranje — korte zinnen, praten lastig</option>
              <option value="Rood">Rood — bijna niet praten</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>1 zin uitleg</div>
            <textarea
              value={value.talkExplain}
              onChange={(e) => set({ talkExplain: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Ik kon korte zinnen zeggen, maar het was lastig tijdens de kern."
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>5) Ervaring</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>RPE (1–10)</div>
            <input
              value={value.rpe}
              onChange={(e) => set({ rpe: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 7"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Reflectie (min. 2 zinnen)</div>
            <textarea
              value={value.reflection}
              onChange={(e) => set({ reflection: e.target.value })}
              style={styles.textarea}
              placeholder="Schrijf: wat ging goed? wat neem ik mee naar volgende keer?"
            />
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={styles.sectionTitle}>6) Optioneel — krachtcircuit</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Alleen invullen als je het effectief gedaan hebt (niet beoordeeld in rubrics).
            </div>
          </div>
          <div style={styles.pill}>OPTIONEEL</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              color: ui.text,
              fontWeight: 950,
            }}
          >
            <input
              type="checkbox"
              checked={value.didStrength}
              onChange={(e) => set({ didStrength: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            Ik deed een krachtcircuit
          </label>
        </div>

        {value.didStrength ? (
          <div className="row2" style={{ ...styles.row2, marginTop: 12 }}>
            <div>
              <div style={styles.label}>Circuitnaam</div>
              <input
                value={value.strengthCircuitName}
                onChange={(e) => set({ strengthCircuitName: e.target.value })}
                style={styles.input}
                placeholder="bv. Circuit A"
              />
            </div>
            <div>
              <div style={styles.label}>RPE (1–10)</div>
              <input
                value={value.strengthRpe}
                onChange={(e) => set({ strengthRpe: e.target.value })}
                style={styles.input}
                inputMode="numeric"
                placeholder="bv. 6"
              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* =========================
   3E GRAAD UI
========================= */

function ThirdGradePanel({
  value,
  onChange,
  derived,
  flags,
}: {
  value: ThirdGradeForm;
  onChange: (next: ThirdGradeForm) => void;
  derived: {
    metMinutesTotal: number;
    activityKcalTotal: number;
    kcalBalance: number | null;
    inferredPal: PalChoice | "";
  };
  flags: string[];
}) {
  const set = (patch: Partial<ThirdGradeForm>) => onChange({ ...value, ...patch });

  const updateRow = (id: string, patch: Partial<ActivityRow>) => {
    const next = value.activities.map((r) => (r.id === id ? { ...r, ...patch } : r));
    set({ activities: next });
  };

  const addRow = () => {
    set({
      activities: [...value.activities, { id: mkId(), activity: "", minutes: "", met: "" }],
    });
  };

  const removeRow = (id: string) => {
    if (value.activities.length <= 6) return;
    set({ activities: value.activities.filter((r) => r.id !== id) });
  };

  const autoFillBurnFromActivities = () => {
    set({
      kcalTotalBurn: String(Math.round(derived.activityKcalTotal)),
      burnSource: "Automatisch via activiteiten",
    });
  };

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>🚴 Huiswerk 3e graad — PAL + MET + kcal</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Dit huiswerk mag je invullen <b style={{ color: ui.text }}>zonder voorkennis</b>. Lees eerst de uitleg hieronder en vul daarna alles stap voor stap in.
        </div>
      </div>

      <div style={styles.infoBox}>
        <div style={{ fontWeight: 980, color: ui.text }}>Wat moet je hier doen?</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Je kiest <b style={{ color: ui.text }}>één echte dag</b>, bijvoorbeeld gisteren. Daarna vul je in:
        </div>
        <div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}>
          <div>1. je activiteiten van die dag</div>
          <div>2. hoe lang die activiteiten duurden</div>
          <div>3. de MET-waarde van elke activiteit</div>
          <div>4. je PAL-inschatting voor je volledige dag</div>
          <div>5. hoeveel kcal je ongeveer at en hoeveel kcal je ongeveer verbruikte</div>
          <div>6. wat dit betekent voor gewicht op langere termijn</div>
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Korte uitleg voor je begint</div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>MET</b> zegt hoe zwaar <b style={{ color: ui.text }}>één activiteit</b> is.
            Rust is ongeveer 1 MET. Hoe hoger de MET, hoe intensiever de activiteit.
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>PAL</b> zegt hoe actief je <b style={{ color: ui.text }}>hele dag</b> was.
            Het gaat dus niet over één moment, maar over het totaal van je dag.
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>kcal</b> zijn een maat voor energie.
            Eten en drinken leveren energie op. Bewegen en leven verbruiken energie.
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            Als je op langere termijn <b style={{ color: ui.text }}>meer kcal inneemt dan verbruikt</b>, is er meer kans op gewichtstoename.
            Als je op langere termijn <b style={{ color: ui.text }}>minder kcal inneemt dan verbruikt</b>, is er meer kans op gewichtsafname.
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Belangrijk verschil</div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>MET = één activiteit</b>
          </div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Bijvoorbeeld: fietsen, wandelen, zitten, trainen…
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>PAL = je volledige dag</b>
          </div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Bijvoorbeeld: “Mijn dag was laag actief / matig actief / actief.”
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            Daarna leg jij alles nog eens uit <b style={{ color: ui.text }}>in je eigen woorden</b>. Zo toont de app of je het begrijpt.
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={styles.sectionTitle}>Handige link voor kcal-berekening</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Gebruik een externe site of app om je kcal-inname of totale kcal-verbruik te schatten.
            </div>
          </div>

          <a
            href="https://www.calculator.net/tdee-calculator.html"
            target="_blank"
            rel="noreferrer"
            style={styles.linkBtn}
          >
            Open kcal / TDEE calculator
          </a>
        </div>

        <div style={{ ...styles.small, marginTop: 10 }}>
          Let op: dit zijn altijd <b style={{ color: ui.text }}>schattingen</b>. Je hoeft dus niet exact te zijn, maar wel eerlijk en logisch.
        </div>
      </div>

      {flags.length > 0 && (
        <div style={styles.warnBox}>
          <b>Controlepunten:</b>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {flags.map((f, i) => (
              <div key={i}>• {f}</div>
            ))}
          </div>
        </div>
      )}

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Datum van de dag die je analyseert</div>
            <input
              value={value.date}
              onChange={(e) => set({ date: e.target.value })}
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Gewicht (kg)</div>
            <input
              value={value.weightKg}
              onChange={(e) => set({ weightKg: e.target.value })}
              style={styles.input}
              inputMode="decimal"
              placeholder="bv. 68"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Totaal MET-minuten (auto)</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>
                {Math.round(derived.metMinutesTotal)}
              </div>
              <div style={styles.small}>Dit is de som van MET × minuten.</div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>kcal verbruikt via je activiteiten (auto)</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>
                {value.weightKg ? Math.round(derived.activityKcalTotal) : "Vul gewicht in"}
              </div>
              <div style={styles.small}>Schoolschatting op basis van MET × gewicht × uren.</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>2) PAL-inschatting</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Kies je PAL voor je volledige dag</div>
            <select
              value={value.pal}
              onChange={(e) => set({ pal: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Laag actief">Laag actief</option>
              <option value="Matig actief">Matig actief</option>
              <option value="Actief">Actief</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Automatische inschatting van de app</div>
            <div style={{ marginTop: 10 }}>
              <span style={styles.pill}>{derived.inferredPal || "Nog te weinig gegevens"}</span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Leg uit waarom (in je eigen woorden)</div>
            <textarea
              value={value.palExplain}
              onChange={(e) => set({ palExplain: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Ik zat lang op school, maar ik fietste ook heen en terug en had training. Daarom schat ik mijn hele dag als matig actief."
            />
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={styles.sectionTitle}>3) Activiteitenlog (min. 6 activiteiten)</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Vul je dag zo volledig mogelijk in. Ook rustige activiteiten zoals slapen of zitten tellen mee.
            </div>
          </div>
          <button onClick={addRow} style={{ ...styles.ghostBtn, height: 46 }}>
            + Activiteit
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {value.activities.map((r, idx) => {
            const metMin = calcMetMinutes(r);
            const kcal = calcActivityKcal(r, value.weightKg);
            const canRemove = value.activities.length > 6;

            return (
              <div key={r.id} style={{ ...styles.rubricCard, background: "rgba(0,0,0,0.22)" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 980, color: ui.text }}>Activiteit {idx + 1}</div>
                    <button
                      onClick={() => removeRow(r.id)}
                      disabled={!canRemove}
                      style={{ ...styles.ghostBtn, height: 38, opacity: canRemove ? 1 : 0.5 }}
                      title={canRemove ? "Verwijderen" : "Minstens 6 activiteiten verplicht"}
                    >
                      Verwijder
                    </button>
                  </div>

                  <div className="row3" style={styles.row3}>
                    <div>
                      <div style={styles.label}>Activiteit</div>
                      <input
                        value={r.activity}
                        onChange={(e) => updateRow(r.id, { activity: e.target.value })}
                        style={styles.input}
                        placeholder="bv. fietsen naar school"
                      />
                    </div>

                    <div>
                      <div style={styles.label}>Duur (min)</div>
                      <input
                        value={r.minutes}
                        onChange={(e) => updateRow(r.id, { minutes: e.target.value })}
                        style={styles.input}
                        inputMode="numeric"
                        placeholder="bv. 25"
                      />
                    </div>

                    <div>
                      <div style={styles.label}>MET</div>
                      <select
                        value={r.met}
                        onChange={(e) => updateRow(r.id, { met: e.target.value })}
                        style={{ ...styles.input, marginTop: 10 }}
                      >
                        <option value="">Kies…</option>
                        {MET_OPTIONS.map((m) => (
                          <option key={`${m.value}-${m.label}`} value={String(m.value)}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={styles.small}>
                      MET-minuten (auto): <b style={{ color: ui.text }}>{Math.round(metMin)}</b>
                    </div>
                    <div style={styles.small}>
                      kcal activiteit (auto):{" "}
                      <b style={{ color: ui.text }}>{value.weightKg ? Math.round(kcal) : "vul gewicht in"}</b>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>4) kcal-inname</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Totale kcal-inname van die dag</div>
            <input
              value={value.kcalIntake}
              onChange={(e) => set({ kcalIntake: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 2250"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Hoe heb je dit berekend?</div>
            <textarea
              value={value.kcalIntakeSource}
              onChange={(e) => set({ kcalIntakeSource: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Ik heb alles van gisteren ingevoerd in een app / site en zo mijn kcal-inname geschat."
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>5) kcal-verbruik</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Totaal kcal-verbruik van die dag</div>
            <input
              value={value.kcalTotalBurn}
              onChange={(e) => set({ kcalTotalBurn: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 2400"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Bron</div>
            <select
              value={value.burnSource}
              onChange={(e) => set({ burnSource: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Automatisch via activiteiten">Automatisch via activiteiten</option>
              <option value="Externe calculator / app">Externe calculator / app</option>
              <option value="Eigen schatting">Eigen schatting</option>
            </select>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={autoFillBurnFromActivities} style={{ ...styles.ghostBtn, height: 46 }}>
              Gebruik automatisch berekend verbruik
            </button>
            <div style={styles.small}>Handig om te vergelijken met je externe calculator of app.</div>
          </div>
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>6) Energiebalans</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>kcal-saldo (auto = inname - verbruik)</div>
            <div style={{ marginTop: 10 }}>
              <span style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>
                {derived.kcalBalance === null ? "—" : Math.round(derived.kcalBalance)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Wat betekent dit? (in je eigen woorden)</div>
            <textarea
              value={value.balanceExplain}
              onChange={(e) => set({ balanceExplain: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Mijn inname ligt lager dan mijn verbruik. Als dit vaker zo is, kan dat op langere termijn leiden tot gewichtsafname."
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>7) Leg het uit in je eigen woorden</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Wat is MET? Wat is PAL? Wat is het verschil? Hoe hangen kcal hiermee samen?</div>
            <textarea
              value={value.conceptExplain}
              onChange={(e) => set({ conceptExplain: e.target.value })}
              style={styles.textarea}
              placeholder="Schrijf minstens 2 duidelijke zinnen. Leg uit dat MET over één activiteit gaat en PAL over je volledige dag."
            />
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            Tip: schrijf niet gewoon de woorden over. Probeer het echt uit te leggen alsof je het aan een klasgenoot vertelt.
          </div>
        </div>
      </div>
    </>
  );
}