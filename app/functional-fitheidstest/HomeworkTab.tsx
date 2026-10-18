"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ProfielLite = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  role?: string | null;
  rol?: string | null;
  leerjaar?: number | string | null;
  graad?: number | string | null;
  geslacht?: string | null;
  gender?: string | null;
  raw?: unknown;
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
  pp: string,
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
type GenderChoice = "Meisje" | "Jongen" | "";

function normalizeGender(v: unknown): GenderChoice {
  const t = String(v ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "jongen",
      "jongens",
      "man",
      "m",
      "male",
      "boy",
      "masculin",
      "mannelijk",
      "1",
    ].includes(t)
  )
    return "Jongen";
  if (
    [
      "meisje",
      "meisjes",
      "vrouw",
      "v",
      "f",
      "female",
      "girl",
      "feminin",
      "vrouwelijk",
      "2",
    ].includes(t)
  )
    return "Meisje";
  return "";
}

function findGenderInRaw(raw: unknown): GenderChoice {
  const direct = normalizeGender(raw);
  if (direct) return direct;

  // smartschool_users.raw kan een JSON-object zijn, maar soms ook een JSON-string.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      const found = findGenderInRaw(parsed);
      if (found) return found;
    } catch {
      // Geen JSON-string: dan valt de functie gewoon terug op geen resultaat.
    }
  }

  if (!raw || typeof raw !== "object") return "";

  const preferredKeys = [
    "geslacht",
    "gender",
    "sex",
    "sexe",
    "gendercode",
    "gender_code",
  ];
  const stack: unknown[] = [raw];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    const obj = current as Record<string, unknown>;

    for (const key of preferredKeys) {
      if (key in obj) {
        const found = normalizeGender(obj[key]);
        if (found) return found;
      }
    }

    for (const [key, val] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      if (
        keyLower.includes("geslacht") ||
        keyLower.includes("gender") ||
        keyLower === "sex" ||
        keyLower === "sexe"
      ) {
        const found = normalizeGender(val);
        if (found) return found;
      }

      if (val && typeof val === "object") stack.push(val);
    }
  }

  return "";
}

type SecondGradeForm = {
  date: string;
  gender: GenderChoice;
  mas: string;
  trainingType: "Duur" | "Tempo" | "Interval" | "";
  trainingGoal: "Basisconditie" | "Langer lopen" | "MAS verbeteren" | "";
  expectedRpe: string;
  expectedTalk: TalkTest;
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

function initSecond(
  defaultMas?: number | null,
  defaultGender: GenderChoice = "",
): SecondGradeForm {
  return {
    date: toYMD(),
    gender: defaultGender,
    mas: defaultMas && Number.isFinite(defaultMas) ? String(defaultMas) : "",
    trainingType: "",
    trainingGoal: "",
    expectedRpe: "",
    expectedTalk: "",
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

function speedToPace(speed: number) {
  if (!Number.isFinite(speed) || speed <= 0) return "—";
  const totalSec = Math.round(3600 / speed);
  const min = Math.floor(totalSec / 60);
  const sec = String(totalSec % 60).padStart(2, "0");
  return `${min}:${sec}/km`;
}

function getMasSpeedText(masRaw: string) {
  const mas = toNum(masRaw);
  if (!Number.isFinite(mas) || mas <= 0)
    return "Vul je MAS in om je persoonlijke trainingszones te zien.";

  const zone = (pct: number) => {
    const speed = mas * pct;
    return `${Math.round(pct * 100)}% = ${speed.toFixed(1)} km/u (${speedToPace(speed)})`;
  };

  return `Jouw MAS = ${mas.toFixed(1)} km/u (${speedToPace(mas)}). ${zone(0.70)} • ${zone(0.80)} • ${zone(0.90)} • ${zone(1.00)}`;
}

function getMasPerformanceEvaluation(f: SecondGradeForm): RubricItem {
  const mas = toNum(f.mas);
  const gender = f.gender;

  let level: RubricLevel = "-";
  let description =
    "Vul je MAS in. Het geslacht wordt automatisch uit Supabase opgehaald.";
  let autoFeedback =
    "Geen volledige automatische MAS-evaluatie mogelijk zolang MAS of geslacht ontbreekt.";

  if (Number.isFinite(mas) && mas > 0 && gender) {
    if (gender === "Meisje") {
      if (mas < 8.9) {
        level = "-";
        description = "Prestatie: MAS < 8,8 km/u (meisjes).";
        autoFeedback =
          "Je MAS-score zit nog onder de richtwaarde. Blijf regelmatig en rustig duurwerk opbouwen.";
      } else if (mas <= 10) {
        level = "+/-";
        description = "Prestatie: MAS 8,9–10 km/u (meisjes).";
        autoFeedback =
          "Je hebt de basis. Met regelmatige duurtraining kan je verder groeien.";
      } else if (mas <= 12) {
        level = "+";
        description = "Prestatie: MAS 10–12 km/u (meisjes).";
        autoFeedback =
          "Goed uitgevoerd: je MAS-score toont een goede duurprestatie.";
      } else {
        level = "++";
        description = "Prestatie: MAS > 12 km/u (meisjes).";
        autoFeedback =
          "Sterk: je onderscheidt je met een zeer goede MAS-score.";
      }
    }

    if (gender === "Jongen") {
      if (mas < 10) {
        level = "-";
        description = "Prestatie: MAS < 10 km/u (jongens).";
        autoFeedback =
          "Je MAS-score zit nog onder de richtwaarde. Blijf regelmatig en rustig duurwerk opbouwen.";
      } else if (mas < 11) {
        level = "+/-";
        description = "Prestatie: MAS 10–10,9 km/u (jongens).";
        autoFeedback =
          "Je hebt de basis. Met regelmatige duurtraining kan je verder groeien.";
      } else if (mas < 14.5) {
        level = "+";
        description = "Prestatie: MAS 11–14,4 km/u (jongens).";
        autoFeedback =
          "Goed uitgevoerd: je MAS-score toont een goede duurprestatie.";
      } else {
        level = "++";
        description = "Prestatie: MAS > 14,5 km/u (jongens).";
        autoFeedback =
          "Sterk: je onderscheidt je met een zeer goede MAS-score.";
      }
    }
  }

  return {
    key: "mas_prestatie",
    title: "Automatische MAS-evaluatie",
    level,
    color: rubricColors[level],
    description,
    autoFeedback,
  };
}

function getMasPerformanceText(f: SecondGradeForm) {
  const item = getMasPerformanceEvaluation(f);
  if (!f.gender || !Number.isFinite(toNum(f.mas)) || toNum(f.mas) <= 0) {
    return "Vul je MAS in. Het geslacht wordt automatisch uit je profiel gehaald.";
  }
  return `${item.level} — ${item.description} ${item.autoFeedback}`;
}

function getSecondConclusion(f: SecondGradeForm) {
  const rest = toNum(f.hrRest);
  const peak = toNum(f.hrPeak);
  const rec = toNum(f.hrRec1);
  const rpe = toNum(f.rpe);
  const drop = Number.isFinite(peak) && Number.isFinite(rec) ? peak - rec : NaN;

  const parts: string[] = [];

  const masItem = getMasPerformanceEvaluation(f);
  if (f.gender && Number.isFinite(toNum(f.mas)) && toNum(f.mas) > 0) {
    parts.push(`MAS-evaluatie: ${masItem.level}. ${masItem.description}`);
  }

  if (Number.isFinite(rest) && Number.isFinite(peak) && Number.isFinite(rec)) {
    if (peak <= rest) {
      parts.push(
        "Je hartslaggegevens lijken niet logisch: je hoogste hartslag moet hoger zijn dan je rusthartslag. Controleer je meting of je ingevulde waarden.",
      );
    } else if (rec >= peak) {
      parts.push(
        "Je herstelhartslag is niet lager dan je piekhartslag. Meet na de kern exact 1 minuut rustig herstel en noteer dan opnieuw.",
      );
    } else if (drop >= 25) {
      parts.push(
        "Je herstel is zeer goed: je hartslag daalt sterk na 1 minuut. Dat wijst op een vlotte recuperatie na de inspanning.",
      );
    } else if (drop >= 15) {
      parts.push(
        "Je herstel is goed: je hartslag daalt duidelijk na 1 minuut. Je lichaam recupereert normaal na deze inspanning.",
      );
    } else {
      parts.push(
        "Je herstel is beperkt: je hartslag blijft nog vrij hoog na 1 minuut. Volgende keer kan je iets rustiger starten, je rust langer nemen of beter doseren.",
      );
    }
  } else {
    parts.push(
      "Vul rusthartslag, hoogste hartslag en herstelhartslag na 1 minuut in voor een automatische conclusie over je herstel.",
    );
  }

  if (f.talk === "Groen")
    parts.push(
      "De praattest was groen: je intensiteit was rustig tot matig en past goed bij een duurtraining.",
    );
  if (f.talk === "Oranje")
    parts.push(
      "De praattest was oranje: je intensiteit was stevig maar controleerbaar. Dit past goed bij een stevige kern of interval.",
    );
  if (f.talk === "Rood")
    parts.push(
      "De praattest was rood: je intensiteit was zeer hoog. Dit kan kort bij interval, maar is te zwaar voor een volledige duurtraining.",
    );

  if (Number.isFinite(rpe)) {
    if (rpe <= 4)
      parts.push("Je RPE is laag: de training voelde eerder gemakkelijk aan.");
    else if (rpe <= 7)
      parts.push("Je RPE is passend: de training voelde matig tot stevig aan.");
    else
      parts.push(
        "Je RPE is hoog: de training voelde zwaar aan. Let op dat je de intensiteit goed doseert en voldoende herstelt.",
      );
  }

  return parts.join(" ");
}

function rubricsSecond(f: SecondGradeForm): RubricItem[] {
  const mas = toNum(f.mas);
  const hasMas = Number.isFinite(mas) && mas > 0;
  const hasGender = Boolean(f.gender);
  const hasType = Boolean(f.trainingType);
  const hasGoal = Boolean(f.trainingGoal);
  const expectedRpe = toNum(f.expectedRpe);
  const hasPrediction =
    Number.isFinite(expectedRpe) &&
    expectedRpe >= 1 &&
    expectedRpe <= 10 &&
    Boolean(f.expectedTalk);
  const hasWarm =
    Boolean(f.warmupMin.trim()) &&
    Number.isFinite(toNum(f.warmupMin)) &&
    toNum(f.warmupMin) > 0;
  const hasCore = Boolean(f.coreText.trim());
  const hasCool =
    Boolean(f.cooldownMin.trim()) &&
    Number.isFinite(toNum(f.cooldownMin)) &&
    toNum(f.cooldownMin) > 0;
  const coreMentionsMas = hasAnyWord(f.coreText, [
    "mas",
    "%",
    "km/u",
    "tempo",
    "min",
    "rust",
    "x",
    "×",
  ]);

  const rest = toNum(f.hrRest);
  const peak = toNum(f.hrPeak);
  const rec = toNum(f.hrRec1);
  const hrComplete =
    Number.isFinite(rest) && Number.isFinite(peak) && Number.isFinite(rec);
  const hrLogical = hrComplete && peak > rest && rec < peak;

  const hasTalk = Boolean(f.talk) && Boolean(f.talkExplain.trim());
  const rpe = toNum(f.rpe);
  const hasRpe = Number.isFinite(rpe) && rpe >= 1 && rpe <= 10;
  const refl = (f.reflection || "").trim();
  const hasReflection = countSentencesApprox(refl) >= 2 && refl.length >= 80;

  const checks = [
    hasMas,
    hasGender,
    hasType,
    hasGoal,
    hasPrediction,
    hasWarm,
    hasCore,
    hasCool,
    coreMentionsMas,
    hrComplete,
    hrLogical,
    hasTalk,
    hasRpe,
    hasReflection,
  ];
  const score = checks.filter(Boolean).length;

  let level: RubricLevel = "-";
  if (score >= 12) level = "++";
  else if (score >= 10) level = "+";
  else if (score >= 7) level = "+/-";

  const missing: string[] = [];
  if (!hasMas) missing.push("vul je MAS correct in");
  if (!hasGender)
    missing.push("geslacht werd niet automatisch gevonden in profielen.geslacht (M/V)");
  if (!hasType) missing.push("kies duurloop, tempoloop of intervaltraining");
  if (!hasGoal) missing.push("kies wat je met deze training wil verbeteren");
  if (!hasPrediction) missing.push("voorspel vóór de training je RPE en praattest");
  if (!hasWarm || !hasCore || !hasCool)
    missing.push("maak je plan volledig: opwarming, kern en cooling-down");
  if (hasCore && !coreMentionsMas)
    missing.push("koppel je kern duidelijk aan je MAS of tempo");
  if (!hrComplete) missing.push("vul rust, piek en herstel na 1 minuut in");
  else if (!hrLogical)
    missing.push(
      "controleer je hartslag: piek hoger dan rust, herstel lager dan piek",
    );
  if (!hasTalk) missing.push("vul de praattest met korte uitleg in");
  if (!hasRpe) missing.push("vul RPE 1–10 correct in");
  if (!hasReflection)
    missing.push("schrijf minstens 2 duidelijke reflectiezinnen");

  return [
    getMasPerformanceEvaluation(f),
    {
      key: "huiswerk_2e_totaal",
      title: "Evaluatie huiswerk 2e graad",
      level,
      color: rubricColors[level],
      description: levelText(
        level,
        "Onvoldoende: meerdere verplichte onderdelen ontbreken of zijn niet controleerbaar.",
        "Bijna in orde: de basis is aanwezig, maar minstens één belangrijk onderdeel ontbreekt of is onduidelijk.",
        "In orde: het huiswerk is volledig genoeg, logisch en controleerbaar ingevuld.",
        "Zeer goed: het huiswerk is volledig, persoonlijk met MAS uitgewerkt, logisch gemeten en sterk gereflecteerd.",
      ),
      autoFeedback:
        level === "++"
          ? "Klaar: je huiswerk is volledig, duidelijk en sterk onderbouwd."
          : level === "+"
            ? "Goed: je huiswerk is in orde. Werk nog kleine details bij voor ++."
            : missing.length
              ? `Nog aanpassen: ${missing.join("; ")}.`
              : "Controleer je ingevulde gegevens nog eens.",
    },
  ];
}

/* =========================
   3E GRAAD
========================= */

type MealChoice = "Ontbijt" | "Lunch" | "Avondeten" | "Tussendoortje" | "Drank" | "";
type IntakeAppChoice = "Virtuafood";

type ThirdGradeForm = {
  date: string;
  weightKg: string;

  intakeApp: IntakeAppChoice;
  kcalIntake: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  mealsCount: string;
  highestKcalMeal: MealChoice;

  kcalTotalBurn: string;
  burnSource: "TDEE Calculator";

  balanceExplain: string;
  longTermExplain: string;
  macroExplain: string;
  reflection: string;
};

function initThird(): ThirdGradeForm {
  return {
    date: toYMD(),
    weightKg: "",
    intakeApp: "Virtuafood",
    kcalIntake: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    mealsCount: "",
    highestKcalMeal: "",
    kcalTotalBurn: "",
    burnSource: "TDEE Calculator",
    balanceExplain: "",
    longTermExplain: "",
    macroExplain: "",
    reflection: "",
  };
}

function calcMacroKcal(proteinG: number, carbsG: number, fatG: number) {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

function macroPercent(partKcal: number, totalKcal: number) {
  if (!Number.isFinite(partKcal) || !Number.isFinite(totalKcal) || totalKcal <= 0) return null;
  return Math.round((partKcal / totalKcal) * 100);
}

function energyBalanceLabel(balance: number | null) {
  if (balance === null) return "Nog niet berekend";
  if (balance > 150) return "Energieoverschot";
  if (balance < -150) return "Energietekort";
  return "Ongeveer in balans";
}

function proteinAdviceText(proteinPerKg: number | null) {
  if (proteinPerKg === null) return "Vul gewicht en eiwitten in voor een automatische eiwitinschatting.";
  if (proteinPerKg < 0.8) return "Je eiwitinname ligt laag. Vergelijk dit met de richtwaarde van ongeveer 0,8 g/kg lichaamsgewicht per dag.";
  if (proteinPerKg < 1.2) return "Je eiwitinname zit rond de algemene basisrichtwaarde. Voor actieve jongeren of sporters mag dit vaak wat hoger liggen.";
  if (proteinPerKg <= 2.0) return "Je eiwitinname ligt in een goede zone voor iemand die regelmatig beweegt of sport.";
  if (proteinPerKg <= 3.0) return "Je eiwitinname is hoog. Dat is niet automatisch fout, maar bekijk of dit past bij je sportbelasting en totale voeding.";
  return "Je eiwitinname is zeer hoog. Controleer of je de waarden juist hebt overgenomen uit de app.";
}

function rubricsThird(f: ThirdGradeForm): {
  items: RubricItem[];
  totals: {
    kcalBalance: number | null;
    proteinPerKg: number | null;
    macroKcalTotal: number | null;
    proteinPct: number | null;
    carbsPct: number | null;
    fatPct: number | null;
  };
  flags: string[];
} {
  const weight = toNum(f.weightKg);
  const intake = toNum(f.kcalIntake);
  const burn = toNum(f.kcalTotalBurn);
  const protein = toNum(f.proteinG);
  const carbs = toNum(f.carbsG);
  const fat = toNum(f.fatG);
  const meals = toNum(f.mealsCount);

  const hasWeight = Number.isFinite(weight) && weight > 0;
  const hasIntake = Number.isFinite(intake) && intake > 0;
  const hasBurn = Number.isFinite(burn) && burn > 0;
  const hasProtein = Number.isFinite(protein) && protein >= 0;
  const hasCarbs = Number.isFinite(carbs) && carbs >= 0;
  const hasFat = Number.isFinite(fat) && fat >= 0;
  const hasMeals = Number.isFinite(meals) && meals > 0;
  const hasApp = f.intakeApp === "Virtuafood";
  const hasBurnSource = Boolean(f.burnSource);
  const hasHighestMeal = Boolean(f.highestKcalMeal);

  const kcalBalance = hasIntake && hasBurn ? intake - burn : null;
  const proteinPerKg = hasWeight && hasProtein ? protein / weight : null;
  const macroKcalTotal = hasProtein && hasCarbs && hasFat ? calcMacroKcal(protein, carbs, fat) : null;
  const proteinPct = macroKcalTotal ? macroPercent(protein * 4, macroKcalTotal) : null;
  const carbsPct = macroKcalTotal ? macroPercent(carbs * 4, macroKcalTotal) : null;
  const fatPct = macroKcalTotal ? macroPercent(fat * 9, macroKcalTotal) : null;

  const flags: string[] = [];
  if (hasIntake && (intake < 1000 || intake > 6000)) {
    flags.push("Je kcal-inname lijkt weinig realistisch. Controleer of je de waarde correct uit Virtuafood hebt overgenomen.");
  }
  if (hasBurn && (burn < 1000 || burn > 6000)) {
    flags.push("Je kcal-verbruik lijkt weinig realistisch. Controleer of je de TDEE Calculator correct hebt ingevuld.");
  }
  if (hasProtein && hasWeight && proteinPerKg !== null && (proteinPerKg < 0.6 || proteinPerKg > 3)) {
    flags.push("Je eiwitinname per kg lichaamsgewicht valt buiten de normale controlezone. Controleer je gram eiwitten.");
  }
  if (hasCarbs && (carbs < 50 || carbs > 700)) {
    flags.push("Je koolhydraten lijken opvallend laag of hoog. Controleer of je de waarde correct hebt overgenomen.");
  }
  if (hasFat && (fat < 20 || fat > 220)) {
    flags.push("Je vetinname lijkt opvallend laag of hoog. Controleer of je de waarde correct hebt overgenomen.");
  }
  if (macroKcalTotal && hasIntake && Math.abs(macroKcalTotal - intake) > Math.max(450, intake * 0.35)) {
    flags.push("De kcal uit je macro's wijken sterk af van je totale kcal-inname. Dat kan door afronding of alcohol/vezels komen, maar controleer je waarden.");
  }

  // Gewicht is optioneel: het telt niet mee voor de volledigheid van de huistaak.
  // Als gewicht wél wordt ingevuld, berekent de app automatisch eiwitten per kg lichaamsgewicht.
  const registrationCount = [
    f.date.trim(),
    hasApp,
    hasIntake,
    hasBurn,
    hasBurnSource,
    hasProtein,
    hasCarbs,
    hasFat,
    hasMeals,
    hasHighestMeal,
  ].filter(Boolean).length;

  const balanceText = (f.balanceExplain || "").trim();
  const longText = (f.longTermExplain || "").trim();
  const macroText = (f.macroExplain || "").trim();
  const reflText = (f.reflection || "").trim();
  const allText = `${balanceText} ${longText} ${macroText} ${reflText}`.toLowerCase();
  const textLen = balanceText.length + longText.length + macroText.length + reflText.length;

  const mentionsBalance = hasAnyWord(allText, ["overschot", "tekort", "balans", "inname", "verbruik"]);
  const mentionsLongTerm = hasAnyWord(allText, ["lange termijn", "weken", "maanden", "blijft", "gewicht", "aankomen", "afvallen", "stabiel"]);
  const mentionsMacros = hasAnyWord(allText, ["eiwit", "eiwitten", "koolhydraat", "koolhydraten", "vet", "vetten", "macro"]);
  const mentionsImprovement = hasActionKeyword(allText) || hasAnyWord(allText, ["verbeter", "aanpassing", "meer", "minder", "volgende keer", "realistisch"]);

  let level: RubricLevel = "-";
  if (registrationCount < 7 || !hasIntake || !hasBurn || !hasProtein || !hasCarbs || !hasFat) {
    level = "-";
  } else if (registrationCount < 9 || textLen < 180 || !mentionsBalance || flags.length >= 3) {
    level = "+/-";
  } else if (textLen >= 360 && mentionsBalance && mentionsLongTerm && mentionsMacros && mentionsImprovement && flags.length <= 1) {
    level = "++";
  } else {
    level = "+";
  }

  const item: RubricItem = {
    key: "energiebalans_voeding",
    title: "Huistaak 3e graad: energiebalans, macro's en reflectie",
    level,
    color: rubricColors[level],
    description: levelText(
      level,
      "De opdracht is onvolledig of bevat weinig geloofwaardige gegevens. De leerling toont onvoldoende inzicht in de relatie tussen energie-inname, energieverbruik en voeding.",
      "De opdracht is grotendeels ingevuld. De basis van energiebalans is aanwezig, maar de analyse of reflectie blijft oppervlakkig of bevat onduidelijkheden.",
      "De opdracht is volledig en correct uitgevoerd. De leerling interpreteert energiebalans en voedingsgegevens correct en formuleert een duidelijke persoonlijke conclusie.",
      "De opdracht is volledig, zorgvuldig en realistisch uitgevoerd. De leerling toont sterk inzicht in energie-inname, energieverbruik en macronutriënten en formuleert een goed onderbouwde reflectie met realistisch verbeterpunt.",
    ),
    autoFeedback:
      level === "++"
        ? "Uitstekend: je registreerde zorgvuldig, analyseerde kritisch en toont sterk inzicht in energiebalans en voeding."
        : level === "+"
          ? "Goed gewerkt: je gegevens zijn volledig en je conclusie toont dat je energiebalans begrijpt."
          : level === "+/-"
            ? "Je bent goed gestart. Controleer je gegevens en werk je analyse/conclusie concreter uit."
            : "Vul alle verplichte gegevens in: kcal-inname uit Virtuafood, kcal-verbruik uit de TDEE Calculator, macro's, maaltijdinfo en reflectie.",
  };

  return {
    items: [item],
    totals: {
      kcalBalance,
      proteinPerKg,
      macroKcalTotal,
      proteinPct,
      carbsPct,
      fatPct,
    },
    flags,
  };
}

function isLoTeacher(profiel: ProfielLite | null) {
  const role = String(profiel?.rol ?? profiel?.role ?? "").trim().toLowerCase();
  return [
    "lo_leerkracht",
    "lo-leerkracht",
    "lo leerkracht",
    "admin",
    "teacher",
    "leerkracht",
  ].includes(role);
}

function gradeModeFromProfile(profiel: ProfielLite | null): GradeMode {
  const leerjaarRaw = Number(profiel?.leerjaar);
  if (Number.isFinite(leerjaarRaw)) {
    if (leerjaarRaw >= 5) return "3e";
    if (leerjaarRaw >= 3) return "2e";
  }

  const graadRaw = Number(profiel?.graad);
  if (Number.isFinite(graadRaw)) return graadRaw >= 3 ? "3e" : "2e";

  const klas = String(profiel?.klas_naam ?? "").trim();
  const match = klas.match(/^([1-6])/);
  const year = match ? Number(match[1]) : NaN;
  if (year >= 5) return "3e";
  return "2e";
}

type TeacherSubmission = {
  id: string;
  user_id: string;
  schooljaar: string | null;
  klas_naam: string | null;
  date: string;
  grade: GradeMode;
  payload: any;
  created_at: string;
  leerling_naam?: string;
};

const RUBRIC_EXPLANATION = {
  "2e": [
    "MAS/VMA correct ingevuld en gekoppeld aan de training.",
    "Persoonlijk trainingsdoel gekozen.",
    "Bewuste keuze tussen duurloop (zone 2), tempoloop en intervaltraining.",
    "Vooraf voorspelling van RPE en praattest.",
    "Volledig plan: opwarming, kern en cooling-down.",
    "Kern concreet gekoppeld aan MAS, tempo, tijd en/of herstel.",
    "Rust-, piek- en herstelhartslag volledig en logisch.",
    "Praattest ingevuld én kort verklaard.",
    "RPE na de training correct ingevuld.",
    "Reflectie koppelt minstens twee gegevens aan elkaar: MAS/tempo, hartslag, praattest of RPE.",
  ],
  "3e": [
    "Volledige dagregistratie van eten en drinken in Virtuafood.",
    "Kcal-inname uit Virtuafood en geschat kcal-verbruik uit de TDEE Calculator ingevuld.",
    "Eiwitten, koolhydraten en vetten geregistreerd.",
    "Energiebalans correct geïnterpreteerd.",
    "Macroverdeling besproken in functie van het gekozen doel in Virtuafood.",
    "Persoonlijke conclusie en realistisch verbeterpunt geformuleerd.",
  ],
} satisfies Record<GradeMode, string[]>;

/* =========================
   HOOFDCOMPONENT
========================= */

export default function HomeworkTab({ uid, profiel, defaultMas }: Props) {
  const teacherMode = isLoTeacher(profiel);
  const studentMode = gradeModeFromProfile(profiel);
  const [mode, setMode] = useState<GradeMode>(() =>
    teacherMode ? "2e" : studentMode,
  );
  const [showAllRubrics, setShowAllRubrics] = useState(false);

  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(!teacherMode);
  const [submitted, setSubmitted] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [publicatie, setPublicatie] = useState<{level:string;summary:string;criteria:{name?:string;level?:string;feedback?:string}[];gepubliceerd_op:string}|null>(null);

  const initialGender =
    normalizeGender(profiel?.geslacht ?? profiel?.gender) ||
    findGenderInRaw(profiel?.raw);
  const [detectedGender, setDetectedGender] =
    useState<GenderChoice>(initialGender);

  const [f2, setF2] = useState<SecondGradeForm>(() =>
    initSecond(defaultMas ?? null, initialGender),
  );
  const [f3, setF3] = useState<ThirdGradeForm>(() => initThird());

  useEffect(() => {
    let cancelled = false;

    async function loadGenderFromSupabase() {
      const applyGender = (gender: GenderChoice) => {
        if (!gender || cancelled) return false;
        setDetectedGender(gender);
        setF2((prev) =>
          prev.gender ? prev : { ...prev, gender },
        );
        return true;
      };

      // 1) Eerst gebruiken wat al in het aangemelde profiel zit.
      // In jouw tabel profielen staat geslacht als "M" of "V".
      // Ook oude waarden zoals mannelijk/vrouwelijk/male/female blijven ondersteund.
      const genderFromProfile =
        normalizeGender(profiel?.geslacht ?? profiel?.gender) ||
        findGenderInRaw(profiel?.raw);

      if (applyGender(genderFromProfile)) return;

      if (!uid && !profiel?.id) return;

      // 2) Als de prop 'profiel' de kolom geslacht niet meekreeg, halen we ze hier zelf op.
      // Belangrijk: we selecteren hier enkel "geslacht", zodat Supabase niet faalt
      // wanneer kolommen zoals gender/raw niet bestaan in profielen.
      const profileLinks = [
        { column: "id", value: profiel?.id ?? uid },
        { column: "user_id", value: uid },
        { column: "auth_user_id", value: uid },
      ].filter((x) => Boolean(x.value));

      for (const link of profileLinks) {
        const { data, error } = await supabase
          .from("profielen")
          .select("geslacht")
          .eq(link.column, link.value as string)
          .maybeSingle();

        if (cancelled) return;
        if (error || !data) continue;

        const gender = normalizeGender((data as any).geslacht);
        if (applyGender(gender)) return;
      }

      // 3) Daarna zoeken we in smartschool_users.raw.
      // In raw staat dit bij jou als "male" of "female".
      // raw kan een object of JSON-string zijn; beide worden ondersteund.
      const smartschoolLinks = [
        { column: "id", value: profiel?.id ?? uid },
        { column: "user_id", value: uid },
        { column: "auth_user_id", value: uid },
        { column: "profiel_id", value: profiel?.id ?? uid },
        { column: "profile_id", value: profiel?.id ?? uid },
      ].filter((x) => Boolean(x.value));

      for (const link of smartschoolLinks) {
        const { data, error } = await supabase
          .from("smartschool_users")
          .select("raw")
          .eq(link.column, link.value as string)
          .maybeSingle();

        if (cancelled) return;
        if (error || !data) continue;

        const genderFromRaw = findGenderInRaw((data as any).raw);
        if (applyGender(genderFromRaw)) return;
      }
    }

    loadGenderFromSupabase();
    return () => {
      cancelled = true;
    };
  }, [uid, profiel?.geslacht, profiel?.gender, profiel?.raw]);

  useEffect(() => {
    if (!teacherMode) setMode(studentMode);
  }, [teacherMode, studentMode]);

  useEffect(() => {
    if (teacherMode || !uid) {
      setSubmissionLoading(false);
      return;
    }
    let cancelled = false;
    async function loadExistingSubmission() {
      setSubmissionLoading(true);
      const { data, error } = await supabase
        .from("eurofit_huiswerk_submissions")
        .select("id, payload, created_at")
        .eq("user_id", uid)
        .eq("grade", studentMode)
        .eq("schooljaar", profiel?.schooljaar ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setSubmissionLoading(false);
        return;
      }
      if (!data) {
        setSubmitted(false);
        setReopened(false);
        setDraftId(null);
        setHasDraft(false);
        setSubmissionLoading(false);
        return;
      }
      const form = (data as any).payload?.form;
      if (studentMode === "2e" && form) setF2((prev) => ({ ...prev, ...form, gender: form.gender || prev.gender }));
      if (studentMode === "3e" && form) setF3((prev) => ({ ...prev, ...form }));
      const isDraft = (data as any).payload?.status === "concept";
      setSubmitted(!isDraft);
      setReopened((data as any).payload?.reopen_allowed === true);
      setDraftId(isDraft ? (data as any).id : null);
      setHasDraft(isDraft);
      setSubmissionLoading(false);
    }
    loadExistingSubmission();
    return () => { cancelled = true; };
  }, [teacherMode, uid, studentMode, profiel?.schooljaar]);

  useEffect(() => {
    if (teacherMode || !uid) return;
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("huiswerk_publicaties").select("level,summary,criteria,gepubliceerd_op").eq("user_id", uid).eq("schooljaar", profiel?.schooljaar ?? "").eq("grade", studentMode).order("gepubliceerd_op", { ascending: false }).limit(1).maybeSingle();
      if (active && !error) setPublicatie(data as typeof publicatie);
    };
    void load();
    return () => { active = false; };
  }, [uid, teacherMode, studentMode, profiel?.schooljaar]);
  const locked = !teacherMode && submitted && !reopened;
  const rub2 = useMemo(() => rubricsSecond(f2), [f2]);
  const rub3 = useMemo(() => rubricsThird(f3), [f3]);

  const reset = () => {
    if (locked) return;
    setInfo(null);
    setError(null);
    if (mode === "2e") setF2(initSecond(defaultMas ?? null, detectedGender));
    else setF3(initThird());
  };

  const handleSave = async (finalSubmit: boolean) => {
    if (locked || submissionLoading) return;
    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      // De gewone rubric blijft exact behouden, maar wordt niet aan leerlingen getoond.
      // Daarnaast vragen we onafhankelijk een AI-beoordeling op. De AI krijgt bewust
      // de gewone rubric NIET mee, zodat beide beoordelingen eerlijk vergeleken kunnen worden.
      let aiAssessment: any = {
        status: "unavailable",
        level: null,
        summary: "AI-beoordeling kon niet worden uitgevoerd.",
        criteria: [],
      };

      if (finalSubmit) try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) throw new Error("Geen geldige sessie voor AI-beoordeling.");

        const aiResponse = await fetch("/api/huiswerk/ai-beoordeling", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            grade: mode,
            // Dataminimalisatie: stuur alleen velden door die de AI nodig heeft
            // voor de inhoudelijke beoordeling. Geen naam, e-mail, klas, user-id,
            // geslacht, datum of lichaamsgewicht wordt naar OpenAI gestuurd.
            form:
              mode === "2e"
                ? {
                    mas: f2.mas,
                    trainingType: f2.trainingType,
                    trainingGoal: f2.trainingGoal,
                    expectedRpe: f2.expectedRpe,
                    expectedTalk: f2.expectedTalk,
                    warmupMin: f2.warmupMin,
                    coreText: f2.coreText,
                    cooldownMin: f2.cooldownMin,
                    hrRest: f2.hrRest,
                    hrPeak: f2.hrPeak,
                    hrRec1: f2.hrRec1,
                    talk: f2.talk,
                    talkExplain: f2.talkExplain,
                    rpe: f2.rpe,
                    reflection: f2.reflection,
                  }
                : {
                    kcalIntake: f3.kcalIntake,
                    proteinG: f3.proteinG,
                    carbsG: f3.carbsG,
                    fatG: f3.fatG,
                    kcalTotalBurn: f3.kcalTotalBurn,
                    balanceExplain: f3.balanceExplain,
                    longTermExplain: f3.longTermExplain,
                    macroExplain: f3.macroExplain,
                    reflection: f3.reflection,
                  },
          }),
        });

        const aiJson = await aiResponse.json().catch(() => null);
        if (!aiResponse.ok) {
          throw new Error(aiJson?.error || "AI-beoordeling mislukt.");
        }

        aiAssessment = {
          status: "completed",
          ...aiJson,
        };
      } catch (aiError: any) {
        // Een tijdelijke AI-fout mag nooit verhinderen dat een leerling zijn huiswerk indient.
        aiAssessment = {
          status: "unavailable",
          level: null,
          summary: aiError?.message || "AI-beoordeling kon niet worden uitgevoerd.",
          criteria: [],
        };
      }

      const payload =
        mode === "2e"
          ? {
              grade: "2e",
              form: f2,
              rubrics: rub2,
              aiAssessment,
              reopen_allowed: false,
              status: finalSubmit ? "definitief" : "concept",
            }
          : {
              grade: "3e",
              form: f3,
              rubrics: rub3.items,
              totals: rub3.totals,
              flags: rub3.flags,
              aiAssessment,
              reopen_allowed: false,
              status: finalSubmit ? "definitief" : "concept",
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

      if (draftId) {
        const { data, error } = await supabase
          .from("eurofit_huiswerk_submissions")
          .update({ payload, date: row.date, klas_naam: row.klas_naam })
          .eq("id", draftId)
          .eq("user_id", uid)
          .eq("payload->>status", "concept")
          .select("id")
          .single();
        if (error || !data) throw new Error(error?.message || "Concept kon niet bijgewerkt worden.");
      } else {
        const { data, error } = await supabase
          .from("eurofit_huiswerk_submissions")
          .insert(row)
          .select("id")
          .single();
        if (error || !data) throw new Error(error?.message || "Opslaan mislukt.");
        if (!finalSubmit) setDraftId(data.id);
      }
      if (finalSubmit) {
        setSubmitted(true);
        setHasDraft(false);
        setDraftId(null);
        setReopened(false);
        setInfo("✅ Huistaak definitief ingediend. Je hoeft niets meer te doen.");
      } else {
        setHasDraft(true);
        setInfo("✅ Concept bewaard. Je kan later verder werken en definitief indienen.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
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
            <div style={styles.sectionTitle}>📚 Huiswerk</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              {teacherMode
                ? "LO-leerkrachtmodus: bekijk 2e of 3e graad en alle evaluatierubrics."
                : `Je ziet automatisch alleen het huiswerk van de ${studentMode === "2e" ? "2e" : "3e"} graad.`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {teacherMode ? (
              <>
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
                <button
                  type="button"
                  onClick={() => setShowAllRubrics((v) => !v)}
                  style={styles.ghostBtn}
                >
                  {showAllRubrics ? "Rubrics sluiten" : "📊 Alle rubrics"}
                </button>
              </>
            ) : (
              <span style={styles.pill}>
                {studentMode === "2e" ? "2e graad" : "3e graad"}
              </span>
            )}
          </div>
        </div>
      </div>

      {teacherMode && showAllRubrics ? <TeacherRubricGuide mode={mode} /> : null}
      {!teacherMode && publicatie ? <div style={styles.panel}>
        <div style={styles.sectionTitle}>🔔 Je beoordeling is gepubliceerd</div>
        <div style={{ ...styles.small, marginTop: 8 }}>Eindbeoordeling: <strong>{publicatie.level}</strong></div>
        <div style={{ ...styles.small, marginTop: 8 }}>{publicatie.summary}</div>
        {Array.isArray(publicatie.criteria) && publicatie.criteria.map((c, i) => <div key={i} style={{ ...styles.small, marginTop: 10 }}><strong>{c.name ?? `Criterium ${i + 1}`} ({c.level ?? "—"})</strong><div>{c.feedback}</div></div>)}
      </div> : null}


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

      <fieldset disabled={locked || submissionLoading || saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 12, opacity: submissionLoading ? 0.65 : 1 }}>
      {mode === "2e" ? (
        <>
          <SecondGradePanel value={f2} onChange={setF2} />
          {teacherMode ? <RubricPanel title="Evaluatie (2e graad)" items={rub2} /> : null}
        </>
      ) : (
        <>
          <ThirdGradePanel
            value={f3}
            onChange={setF3}
            derived={rub3.totals}
            flags={rub3.flags}
          />
          {teacherMode ? <RubricPanel
            title="Rubrics (3e graad)"
            items={rub3.items}
            extraRight={`Energiebalans: ${
              rub3.totals.kcalBalance === null
                ? "—"
                : `${Math.round(rub3.totals.kcalBalance)} kcal`
            }`}
          /> : null}
        </>
      )}
      </fieldset>

      <div style={styles.actionRow}>
        {!locked ? (
          <button onClick={reset} disabled={saving || submissionLoading} style={{ ...styles.ghostBtn, opacity: saving || submissionLoading ? 0.6 : 1 }}>
            Alles leegmaken
          </button>
        ) : null}
        {!locked && <button onClick={() => handleSave(false)} disabled={saving || submissionLoading} style={styles.ghostBtn}>Tussentijds opslaan</button>}
        <button onClick={() => handleSave(true)} disabled={saving || submissionLoading || locked} style={{ ...styles.primaryBtn, opacity: saving || submissionLoading || locked ? 0.55 : 1 }}>
          {saving ? "Bezig..." : reopened ? "Opnieuw definitief indienen" : "Definitief indienen"}
        </button>
      </div>

      {!teacherMode && hasDraft && !submitted ? <div style={styles.infoBox}>📝 Je werkt aan een concept. Vergeet niet op ‘Definitief indienen’ te klikken wanneer je klaar bent.</div> : null}
      {!teacherMode && submitted ? (
        <div style={reopened ? styles.warnBox : styles.okBox}>
          <b>{reopened ? "🔓 Huistaak éénmalig opnieuw opengesteld" : "✅ Huiswerk opgeslagen"}</b>
          <div style={{ ...styles.small, marginTop: 6, color: ui.text }}>
            {reopened
              ? "Een LO-leerkracht heeft je huistaak opnieuw opengesteld. Pas aan wat nodig is en klik daarna op ‘Definitief indienen’. Daarna wordt je huistaak automatisch opnieuw vergrendeld."
              : "Je huistaak is ingediend en kan niet meer aangepast worden. Als er iets fout liep, neem contact op met je LO-leerkracht."}
          </div>
        </div>
      ) : null}

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

const SECOND_CHECK_DETAILS = [
  ["MAS ingevuld", "MAS is een getal groter dan 0.", "MAS = 11,5 → geslaagd; leeg of 0 → niet geslaagd."],
  ["Geslacht beschikbaar", "Geslacht is als jongen of meisje herkend vanuit het profiel of Smartschool.", "Ontbrekend profielgegeven → niet geslaagd; dit is geen fout van de leerling."],
  ["Trainingsvorm", "Duur, tempo of interval is geselecteerd.", "Een keuze volstaat; geschiktheid wordt niet inhoudelijk nagekeken."],
  ["Trainingsdoel", "Basisconditie, langer lopen of MAS verbeteren is geselecteerd.", "Een keuze volstaat; de samenhang met de trainingsvorm wordt niet gecontroleerd."],
  ["Voorspelling vooraf", "Verwachte RPE is een getal van 1 t.e.m. 10 én een verwachte praattest is geselecteerd.", "RPE 6 + oranje → geslaagd; ontbreekt één van beide → niet geslaagd."],
  ["Opwarming", "Opwarmingsduur is een geldig getal groter dan 0 minuten.", "10 minuten → geslaagd; 0 of leeg → niet geslaagd."],
  ["Kern ingevuld", "Het tekstvak met de trainingskern bevat tekst.", "Ook een zeer korte tekst telt: de inhoudelijke kwaliteit wordt niet automatisch gecontroleerd."],
  ["Cooling-down", "Cooling-downduur is een geldig getal groter dan 0 minuten.", "5 minuten → geslaagd; leeg → niet geslaagd."],
  ["Kern met trainingsbegrip", "De kern bevat ergens 'mas', '%', 'km/u', 'tempo', 'min', 'rust', 'x' of '×'.", "'3 x 5 min' → geslaagd; dit bewijst nog niet dat het trainingsschema juist is."],
  ["Drie hartslagen", "Rust-, piek- en herstelhartslag zijn alle drie als getal ingevuld.", "60 / 170 / 120 → geslaagd; ontbreekt één waarde → niet geslaagd."],
  ["Hartslagen logisch", "Alle drie de getallen zijn aanwezig, piekhartslag > rusthartslag en herstelhartslag < piekhartslag.", "60 / 170 / 120 → geslaagd; 60 / 150 / 160 → niet geslaagd. Geen medische beoordeling."],
  ["Praattest uitgelegd", "Een praattestkleur is geselecteerd én het uitlegveld bevat tekst.", "'Oranje' + 'ik kon korte zinnen spreken' → geslaagd; alleen een kleur → niet geslaagd."],
  ["RPE achteraf", "De ingevulde RPE is een getal van 1 t.e.m. 10.", "RPE 7 → geslaagd; 11 → niet geslaagd."],
  ["Reflectie", "De reflectie telt minstens 80 tekens én minstens twee tekststukken gescheiden door . ! of ?.", "De code controleert lengte en zinsindeling, niet of de reflectie inhoudelijk sterk is."],
] as const;
const THIRD_CHECK_DETAILS = [
  ["Dagregistratie", "De automatische rubric controleert geen volledige dag in Virtuafood. Ze telt registratievelden: datum, app, kcal-inname, kcal-verbruik, bron, drie macro's, aantal maaltijden en grootste maaltijd (10 checks).", "Een ingevulde datum of standaard gekozen app telt mee; de daadwerkelijke dagregistratie wordt niet geverifieerd."],
  ["Kcal-inname en verbruik", "Beide waarden moeten groter dan 0 zijn. De bron is standaard TDEE Calculator en de app standaard Virtuafood.", "De berekende balans is inname min verbruik; de juistheid van de externe berekeningen wordt niet gecontroleerd."],
  ["Macronutriënten", "Eiwitten, koolhydraten en vetten moeten geldige getallen van 0 of meer zijn.", "0 gram telt technisch als ingevuld. De app berekent 4 kcal/g eiwit, 4 kcal/g koolhydraten en 9 kcal/g vet."],
  ["Energiebalans uitleg", "De tekstvelden samen worden gezocht op 'overschot', 'tekort', 'balans', 'inname' of 'verbruik'.", "Het noemen van zo'n woord telt als signaal, maar bewijst geen correcte interpretatie."],
  ["Macro's en langetermijninzicht", "Voor ++ zoekt de code ook trefwoorden over lange termijn en macro's in de gezamenlijke tekst.", "De trefwoorden mogen in om het even welk uitleg- of reflectieveld staan."],
  ["Persoonlijke conclusie", "Voor ++ moet de tekst ook een actie- of verbeterwoord bevatten, en de vier tekstvelden samen minstens 360 tekens.", "Een realistisch verbeterpunt wordt niet inhoudelijk bewezen door enkel een trefwoord."],
] as const;
type AiRubricCriterion = { title: string; descriptions: Record<RubricLevel, string> };
const AI_RUBRICS: Record<GradeMode, AiRubricCriterion[]> = {
  "2e": [
    { title: "Trainingsplan en MAS", descriptions: { "-": "Geen bruikbaar of persoonlijk trainingsplan; de koppeling met MAS ontbreekt.", "+/-": "Een gedeeltelijk plan met beperkte of onduidelijke koppeling aan MAS en trainingsdoel.", "+": "Een logisch en persoonlijk plan met passende trainingsvorm, opwarming, kern, cooling-down en duidelijke koppeling aan MAS.", "++": "Een bijzonder doordacht, haalbaar en nauwkeurig uitgewerkt plan; trainingskeuzes en intensiteit worden overtuigend onderbouwd vanuit MAS en doel." } },
    { title: "Hartslag, praattest en RPE", descriptions: { "-": "Meetgegevens ontbreken grotendeels of worden niet zinvol gebruikt.", "+/-": "Er zijn gegevens, maar de vergelijking of interpretatie blijft beperkt of onduidelijk.", "+": "Hartslag, praattest en RPE worden correct gebruikt om de uitgevoerde inspanning te beschrijven.", "++": "De leerling verbindt de verschillende signalen kritisch, herkent overeenkomsten of verschillen en verklaart deze overtuigend." } },
    { title: "Inzicht in trainingsintensiteit", descriptions: { "-": "De leerling toont geen duidelijk begrip van het gekozen tempo of de trainingsbelasting.", "+/-": "Er is een basisbegrip, maar de relatie tussen trainingsvorm, intensiteit en doel blijft vaag.", "+": "De leerling legt correct uit waarom de gekozen intensiteit bij het trainingsdoel past.", "++": "De leerling beoordeelt de intensiteit genuanceerd aan de hand van MAS, meetgegevens en ervaren belasting, en kan keuzes bijsturen." } },
    { title: "Persoonlijke reflectie en bijsturing", descriptions: { "-": "Een persoonlijke reflectie ontbreekt of bevat geen bruikbare inzichten.", "+/-": "De reflectie beschrijft vooral wat gebeurde, met weinig verklaring of concreet verbeterpunt.", "+": "De leerling vergelijkt verwachting en ervaring, gebruikt eigen gegevens en formuleert een haalbare volgende stap.", "++": "De reflectie is kritisch en goed onderbouwd; meerdere gegevens worden verbonden met een concrete, realistische bijsturing." } },
  ],
  "3e": [
    { title: "Voedingsregistratie en energiegegevens", descriptions: { "-": "Essentiële gegevens uit Virtuafood of de TDEE Calculator ontbreken of zijn niet bruikbaar.", "+/-": "De registratie is gedeeltelijk bruikbaar, maar bevat belangrijke hiaten of onduidelijkheden.", "+": "De leerling gebruikt de relevante gegevens uit Virtuafood en de TDEE Calculator volledig en zorgvuldig.", "++": "De gegevens zijn zorgvuldig verzameld, helder weergegeven en kritisch gecontroleerd op plausibiliteit en beperkingen." } },
    { title: "Inzicht in energiebalans en lange termijn", descriptions: { "-": "Het verschil tussen energie-inname en -verbruik wordt niet begrepen of fout uitgelegd.", "+/-": "De energiebalans wordt benoemd, maar de betekenis of langetermijngevolgen blijven onduidelijk.", "+": "De leerling interpreteert de eigen energiebalans correct en legt mogelijke langetermijngevolgen genuanceerd uit.", "++": "De leerling redeneert kritisch over de eigen balans, de onzekerheid van schattingen en het belang van patronen op langere termijn." } },
    { title: "Macronutriënten en persoonlijk doel", descriptions: { "-": "Eiwitten, koolhydraten en vetten worden niet zinvol besproken.", "+/-": "De macro's worden vermeld, maar nauwelijks gekoppeld aan hun functie of het gekozen doel in Virtuafood.", "+": "De leerling interpreteert de macroverdeling correct in relatie tot het gekozen doel in Virtuafood.", "++": "De leerling vergelijkt de eigen verdeling kritisch met het gekozen doel, verklaart opvallende verschillen en nuanceert de conclusies." } },
    { title: "Persoonlijke reflectie en verbeterpunt", descriptions: { "-": "Een persoonlijke conclusie of bruikbaar inzicht ontbreekt.", "+/-": "De conclusie is algemeen of bevat geen voldoende concreet en realistisch verbeterpunt.", "+": "De leerling trekt een onderbouwde persoonlijke conclusie en formuleert een haalbaar verbeterpunt.", "++": "De leerling reflecteert kritisch en genuanceerd op de eigen gegevens en motiveert een concreet, realistisch en duurzaam verbeterpunt." } },
  ],
};
function TeacherRubricGuide({ mode }: { mode: GradeMode }) {
  const criteria = AI_RUBRICS[mode];
  const levels: RubricLevel[] = ["-", "+/-", "+", "++"];
  const labels: Record<RubricLevel, string> = { "-": "Onvoldoende", "+/-": "Gedeeltelijk", "+": "Goed", "++": "Uitstekend" };
  const teacherHelp: Record<GradeMode, { question: string; evidence: string; example: string }[]> = {
    "2e": [
      { question: "Heeft de leerling een haalbare training ontworpen die past bij de eigen MAS en het trainingsdoel?", evidence: "Bekijk de trainingsvorm, het doel, de opwarming, de kern, de cooling-down en de concrete intensiteit of het tempo.", example: "Een leerling kiest een duurtraining en legt uit welk tempo of welke MAS-zone daarbij past, met een realistische duur en opbouw." },
      { question: "Kan de leerling uitleggen hoe zwaar de training werkelijk was?", evidence: "Vergelijk de ingevulde hartslagwaarden, het herstel, de praattest en de ervaren inspanning (RPE). Let op de uitleg, niet alleen op de getallen.", example: "De leerling merkt dat de praattest rood was en de RPE hoog, en legt uit waarom de training zwaarder aanvoelde dan verwacht." },
      { question: "Begrijpt de leerling waarom een bepaalde intensiteit geschikt is voor het gekozen trainingsdoel?", evidence: "Zoek naar een inhoudelijke koppeling tussen trainingsvorm, MAS, tempo, herstel en ervaren belasting.", example: "De leerling legt uit waarom een rustige duurloop niet voortdurend op maximale snelheid wordt uitgevoerd." },
      { question: "Leert de leerling iets uit de eigen training en weet die wat een volgende keer beter kan?", evidence: "Bekijk of de reflectie eigen meetgegevens en verwachtingen vergelijkt en een haalbare bijsturing formuleert.", example: "De leerling stelt vast dat het gekozen tempo te hoog lag en wil de volgende keer rustiger starten, met een concrete reden." },
    ],
    "3e": [
      { question: "Heeft de leerling de nodige voedings- en energiegegevens zorgvuldig verzameld?", evidence: "Controleer de gegevens uit Virtuafood, de TDEE Calculator en de registratie van energie-inname en macronutriënten.", example: "De leerling vermeldt de geregistreerde kcal en macro's en beseft dat het geschatte energieverbruik geen exacte meting is." },
      { question: "Begrijpt de leerling wat energiebalans betekent, zonder te veel af te leiden uit één dag?", evidence: "Bekijk de uitleg over inname, geschat verbruik, mogelijke verschillen en het belang van gewoonten over langere tijd.", example: "De leerling legt uit dat één dag met een geschat overschot niet volstaat om een uitspraak over gewichtsverandering te doen." },
      { question: "Kan de leerling eiwitten, koolhydraten en vetten betekenisvol interpreteren in functie van het gekozen doel?", evidence: "Zoek naar een juiste uitleg van de macroverdeling en een onderbouwde vergelijking met het gekozen doel in Virtuafood.", example: "De leerling bespreekt de rol van koolhydraten bij inspanning en verklaart waarom de eigen verdeling wel of niet bij het doel past." },
      { question: "Trekt de leerling een persoonlijke, genuanceerde conclusie met een haalbare verbetering?", evidence: "Bekijk of de leerling eigen gegevens gebruikt, beperkingen erkent en een concrete, duurzame stap beschrijft.", example: "De leerling formuleert een haalbare aanpassing aan de eigen eetgewoonten en legt uit waarom die nuttig kan zijn, zonder extreme conclusies." },
    ],
  };
  const help = teacherHelp[mode];
  return <div style={styles.panel}>
    <div style={styles.sectionTitle}>🤖 AI-beoordelingsrubrics — {mode === "2e" ? "2e" : "3e"} graad</div>
    <p style={{...styles.small,marginTop:8}}>Deze handleiding verduidelijkt hoe LO-leerkrachten de vier afgesproken inhoudelijke criteria moeten lezen. Per criterium beoordeel je wat de leerling <b>begrijpt, uitlegt en onderbouwt</b>, niet alleen of een invulvak ingevuld is.</p>
    <div style={{...styles.infoBox,marginTop:12}}>
      <b>Hoe lees je deze rubrics?</b>
      <div style={{...styles.small,marginTop:8}}>Elk van de vier criteria telt even zwaar (25%). De niveaus lopen van <b>−</b> (onvoldoende), via <b>+/−</b> (gedeeltelijk) en <b>+</b> (goed), tot <b>++</b> (uitstekend). Een leerling hoeft niet letterlijk de voorbeeldzinnen te gebruiken: de inhoud en de redenering zijn doorslaggevend.</div>
      <div style={{...styles.small,marginTop:8}}><b>Belangrijk onderscheid:</b> een volledig ingevulde opdracht is niet automatisch een sterke inhoudelijke opdracht. Omgekeerd beoordeel je een leerling niet lager louter omdat die minder uitgebreid schrijft, zolang het vereiste inzicht duidelijk blijkt.</div>
    </div>
    {criteria.map((criterion,index)=><div key={criterion.title} style={{...styles.rubricCard,marginTop:14}}>
      <div style={{fontWeight:950,color:ui.text}}>{index+1}. {criterion.title} <span style={{fontSize:12,color:ui.muted,fontWeight:700}}>(25%)</span></div>
      <p style={{...styles.small,marginTop:8}}><b style={{color:ui.text}}>Centrale vraag:</b> {help[index].question}</p>
      <p style={{...styles.small,marginTop:6}}><b style={{color:ui.text}}>Waarop letten?</b> {help[index].evidence}</p>
      {levels.map(level=><div key={level} style={{display:"grid",gridTemplateColumns:"66px minmax(0,1fr)",gap:10,alignItems:"start",marginTop:12}}>
        <span style={{...styles.rubricBadge,background:rubricColors[level],minWidth:0}}>{level}</span>
        <div style={styles.small}><b style={{color:ui.text}}>{labels[level]}:</b> {criterion.descriptions[level]}</div>
      </div>)}
      <div style={{...styles.small,marginTop:12,padding:10,borderRadius:12,background:"rgba(255,255,255,0.05)"}}><b style={{color:ui.text}}>Illustratief voorbeeld (geen extra vereiste):</b> {help[index].example}</div>
    </div>)}
    <div style={{...styles.infoBox,marginTop:14}}>
      <b>Hoe wordt het eindniveau berekend?</b>
      <div style={{...styles.small,marginTop:8}}>− = 0 punten · +/− = 1 punt · + = 2 punten · ++ = 3 punten. Tel de vier puntenwaarden op, deel door vier en rond af naar het dichtstbijzijnde gehele getal (vanaf 0,5 naar boven). Zet dit resultaat opnieuw om naar een niveau.</div>
      <div style={{...styles.small,marginTop:8}}><b>Rekenvoorbeeld:</b> +, ++, +/− en + geven 2 + 3 + 1 + 2 = 8 punten. 8 ÷ 4 = 2, dus het eindniveau is <b>+</b>.</div>
      <div style={{...styles.small,marginTop:8}}>De persoonlijke AI-feedback hoort per criterium aan te geven welke elementen uit het ingediende huiswerk het niveau onderbouwen en wat eventueel beter kan.</div>
    </div>
    <div style={{...styles.warnBox,marginTop:14}}><b>Let op bij gebruik</b><div style={{...styles.small,marginTop:8}}>Dit is de uitleg voor leerkrachten, geen bewijs dat de AI op de server al exact zo beoordeelt. De beoordelingslogica in <code>app/api/huiswerk/ai-beoordeling/route.ts</code> moet afzonderlijk gecontroleerd worden. AI-feedback blijft een hulpmiddel; controleer opvallende of onjuiste beoordelingen voordat je ze gebruikt.</div></div>
  </div>;
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
            Score: <b style={{ color: ui.text }}>- / +/- / + / ++</b> met kleur
            en uitleg.
          </div>
        </div>
        {extraRight ? <div style={styles.pill}>{extraRight}</div> : null}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div
            key={it.key}
            style={{
              ...styles.rubricCard,
              borderColor: ui.border,
              background: it.color,
            }}
          >
            <div style={styles.rubricTop}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 980, color: ui.text }}>
                  {it.title}
                </div>
                <div style={{ ...styles.small, marginTop: 6 }}>
                  {it.description}
                </div>
                <div style={{ ...styles.small, marginTop: 10 }}>
                  <b style={{ color: ui.text }}>Auto-feedback:</b>{" "}
                  {it.autoFeedback}
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
  const set = (patch: Partial<SecondGradeForm>) =>
    onChange({ ...value, ...patch });
  const masText = getMasSpeedText(value.mas);
  const masPerformanceText = getMasPerformanceText(value);
  const conclusion = getSecondConclusion(value);

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>
          🏃‍♂️ Huiswerk 2e graad — MAS + hartslag + praattest
        </div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Je werkt thuis{" "}
          <b style={{ color: ui.text }}>één volledige training</b> af. Je kiest
          zelf tussen <b style={{ color: ui.text }}>duurloop (zone 2)</b>,{" "}
          <b style={{ color: ui.text }}>tempoloop</b> of{" "}
          <b style={{ color: ui.text }}>intervaltraining</b>. Gebruik je{" "}
          <b style={{ color: ui.text }}>MAS/VMA</b> om je tempo te bepalen. Meet
          je hartslag voor, tijdens/na de kern en na 1 minuut herstel. Tijdens
          de kern gebruik je ook de praattest.
        </div>
      </div>

      <div style={styles.infoBox}>
        <div style={{ fontWeight: 980, color: ui.text }}>
          Wat moet je precies doen?
        </div>
        <div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}>
          <div>1. Kies wat je wil verbeteren en daarna één trainingsvorm.</div>
          <div>2. Voorspel vóór de training je RPE en praattest.</div>
          <div>3. Maak een plan met opwarming, kern en cooling-down.</div>
          <div>4. Gebruik je MAS om je persoonlijke tempo te kiezen.</div>
          <div>5. Meet rusthartslag, hoogste hartslag en herstelhartslag na exact 1 minuut.</div>
          <div>6. Vergelijk na afloop je voorspelling met praattest, RPE en hartslag.</div>
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>
          <div style={{ ...styles.infoBox, marginTop: 12 }}>
            <div style={{ fontWeight: 980, color: ui.text }}>RPE en praattest — wat betekent dit?</div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              <b style={{ color: ui.text }}>RPE</b> betekent hoe zwaar de inspanning voor jou aanvoelt op een schaal van 1 tot 10:
              1–2 = zeer licht, 3–4 = rustig, 5–6 = matig, 7–8 = zwaar en 9–10 = zeer zwaar tot maximaal.
            </div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              <b style={{ color: ui.text }}>Praattest</b> helpt je de intensiteit tijdens het lopen inschatten:
              groen = je kunt vlot in zinnen praten; oranje = je kunt nog korte zinnen zeggen maar praten wordt moeilijk;
              rood = je krijgt slechts enkele woorden uit zonder extra adem te halen.
            </div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              Je gebruikt beide om vóór de training te voorspellen hoe zwaar ze zal zijn en achteraf te controleren of je gekozen tempo bij je trainingsdoel paste.
            </div>
          </div>

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
            <div style={styles.label}>Geslacht voor MAS-evaluatie</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Wordt automatisch opgehaald uit <b style={{ color: ui.text }}>profielen.geslacht</b> (M/V). Als reserve zoekt de app in <b style={{ color: ui.text }}>smartschool_users.raw</b> (male/female).
            </div>
            <div style={{ marginTop: 10 }}>
              <span
                style={{
                  ...styles.pill,
                  height: 46,
                  borderRadius: 16,
                  padding: "0 14px",
                }}
              >
                {value.gender || "Nog niet gevonden"}
              </span>
            </div>
            {!value.gender ? (
              <div style={{ ...styles.warnBox, marginTop: 10 }}>
                Geslacht niet automatisch gevonden. Controleer of <b>profielen.geslacht</b> de waarde <b>M</b> of <b>V</b> bevat. Als dat niet lukt, zoekt de app daarna in <b>smartschool_users.raw</b> naar <b>male</b> of <b>female</b>.
              </div>
            ) : null}
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
            <div style={{ ...styles.small, marginTop: 8 }}>
              MAS is je maximale aerobe snelheid. In de praktijk gebruik je die
              als richttempo: duurtraining aan ongeveer{" "}
              <b style={{ color: ui.text }}>70–80%</b> van je MAS, interval aan
              ongeveer <b style={{ color: ui.text }}>90–100%</b> van je MAS.
            </div>
            <div style={{ ...styles.infoBox, marginTop: 10 }}>{masText}</div>
            <div style={{ ...styles.okBox, marginTop: 10 }}>
              <b>Automatische MAS-evaluatie:</b> {masPerformanceText}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Wat wil je vooral verbeteren?</div>
            <select
              value={value.trainingGoal}
              onChange={(e) => set({ trainingGoal: e.target.value as SecondGradeForm["trainingGoal"] })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Basisconditie">Mijn basisconditie verbeteren</option>
              <option value="Langer lopen">Langer comfortabel kunnen lopen</option>
              <option value="MAS verbeteren">Mijn MAS / maximale aerobe snelheid verbeteren</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Keuze training</div>
            <select
              value={value.trainingType}
              onChange={(e) => set({ trainingType: e.target.value as SecondGradeForm["trainingType"] })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Duur">Duurloop / zone 2 — rustig en lang volhouden</option>
              <option value="Tempo">Tempoloop — stevig, gecontroleerd tempo</option>
              <option value="Interval">Intervaltraining — snelle blokken met herstel</option>
            </select>
            <div style={{ ...styles.small, marginTop: 8 }}>
              <b style={{ color: ui.text }}>Duurloop:</b> ±65–75% MAS, praten blijft vlot.{" "}
              <b style={{ color: ui.text }}>Tempoloop:</b> ±75–85% MAS, korte zinnen worden moeilijker.{" "}
              <b style={{ color: ui.text }}>Interval:</b> werkblokken meestal ±90–110% MAS, afgewisseld met rustig herstel.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Voorspelling vóór de training</div>
            <div className="row2" style={{ ...styles.row2, marginTop: 8 }}>
              <div>
                <div style={styles.label}>Verwachte RPE (1–10)</div>
                <input
                  value={value.expectedRpe}
                  onChange={(e) => set({ expectedRpe: e.target.value })}
                  style={styles.input}
                  inputMode="numeric"
                  placeholder="bv. 6"
                />
              </div>
              <div>
                <div style={styles.label}>Verwachte praattest</div>
                <select
                  value={value.expectedTalk}
                  onChange={(e) => set({ expectedTalk: e.target.value as TalkTest })}
                  style={{ ...styles.input, marginTop: 10 }}
                >
                  <option value="">Kies…</option>
                  <option value="Groen">Groen</option>
                  <option value="Oranje">Oranje</option>
                  <option value="Rood">Rood</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>
            2) Plan met MAS (opwarming – kern – cooling-down)
          </div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Duurloop / zone 2:</b> rustig, gelijkmatig en lang volhouden. Richting ±65–75% MAS; praattest meestal groen.
          </div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Tempoloop:</b> een langere periode stevig maar gecontroleerd lopen. Richting ±75–85% MAS; praattest groen/oranje tot oranje.
          </div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Intervaltraining:</b> snelle werkblokken afwisselen met herstel. Werkblokken meestal ±90–110% MAS, afhankelijk van de duur; herstel rustig wandelen of joggen.
          </div>

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
            <div style={styles.label}>Kern (beschrijf met MAS/tempo)</div>
            <textarea
              value={value.coreText}
              onChange={(e) => set({ coreText: e.target.value })}
              style={styles.textarea}
              placeholder={
                value.trainingType === "Interval"
                  ? "bv. 8×1 min aan 95–100% MAS met 1 min rustig joggen als herstel."
                  : value.trainingType === "Tempo"
                    ? "bv. 15 min aan ongeveer 80% MAS. Stevig maar controleerbaar tempo."
                    : "bv. 25 min aan ongeveer 70% MAS. Rustig tempo met groene praattest."
              }
            />
            <div style={{ ...styles.small, marginTop: 8 }}>
              Praktisch: ken je je tempo niet exact? Gebruik dan je MAS als
              richtlijn én controleer met praattest en RPE. Bij duur moet je
              kunnen blijven praten. Bij interval mag praten tijdens de snelle
              stukken moeilijker zijn.
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
          <div style={{ ...styles.small, marginTop: 8 }}>
            Met hartslagmeter of smartwatch: noteer de waarden. Zonder
            hartslagmeter: voel je pols aan je hals of pols, tel{" "}
            <b style={{ color: ui.text }}>15 seconden</b> en vermenigvuldig met
            4. Meet rust vóór de training, piek meteen na het zwaarste stuk en
            herstel exact 1 minuut later.
          </div>

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
            <div style={styles.label}>Hoogste hartslag / piek (bpm)</div>
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
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>4) Praattest (verplicht)</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            De praattest helpt je controleren of je intensiteit past bij je
            doel. Groen = rustig genoeg, oranje = stevig maar controleerbaar,
            rood = zeer zwaar. Zo leer je doseren zonder toestel.
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Tijdens de kern</div>
            <select
              value={value.talk}
              onChange={(e) => set({ talk: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Groen">Groen — vlot praten in zinnen</option>
              <option value="Oranje">
                Oranje — korte zinnen, praten lastig
              </option>
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
          <div style={styles.sectionTitle}>5) RPE en reflectie</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            RPE is je eigen gevoel van inspanning op 10. 1 = zeer gemakkelijk, 5
            = matig, 10 = maximaal. Het nut: je vergelijkt je gevoel met MAS,
            hartslag en praattest. Zo leer je of je te rustig, goed of te zwaar
            trainde.
          </div>

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

          <div style={styles.infoBox}>
            <div style={{ fontWeight: 980, color: ui.text }}>Wat verwachten we in je reflectie?</div>
            <div style={{ ...styles.small, marginTop: 8 }}>Vergelijk wat je vooraf verwachtte met wat je werkelijk ervaarde. Gebruik minstens twee van je eigen gegevens: MAS/tempo, hartslag, praattest of RPE. Leg uit wat die gegevens volgens jou betekenen en wat je bij een volgende training eventueel anders zou doen.</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Reflectie (min. 2 duidelijke zinnen)</div>
            <textarea
              value={value.reflection}
              onChange={(e) => set({ reflection: e.target.value })}
              style={styles.textarea}
              placeholder="Paste je gekozen intensiteit bij je MAS? Vergelijk je voorspelling met de werkelijkheid en gebruik minstens 2 gegevens: tempo/MAS, hartslag, praattest of RPE."
            />
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.sectionTitle}>
          📌 Automatische conclusie over je resultaten
        </div>
        <div style={{ ...styles.small, marginTop: 8 }}>{conclusion}</div>
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
              Alleen invullen als je het effectief gedaan hebt (niet beoordeeld
              in evaluatie).
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
    kcalBalance: number | null;
    proteinPerKg: number | null;
    macroKcalTotal: number | null;
    proteinPct: number | null;
    carbsPct: number | null;
    fatPct: number | null;
  };
  flags: string[];
}) {
  const set = (patch: Partial<ThirdGradeForm>) => onChange({ ...value, ...patch });
  const balanceLabel = energyBalanceLabel(derived.kcalBalance);
  const proteinAdvice = proteinAdviceText(derived.proteinPerKg);
  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>🥗 Huiswerk 3e graad — energiebalans en voeding</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Registreer <b style={{ color: ui.text }}>één volledige dag</b> al je eten en drinken in <b style={{ color: ui.text }}>Virtuafood</b>. Neem daarna je totale energie-inname en macro&apos;s over uit Virtuafood. Bereken je energieverbruik uitsluitend met de <b style={{ color: ui.text }}>TDEE Calculator</b> en vergelijk beide waarden.
        </div>
      </div>
      <div className="row2" style={styles.row2}>
        <div style={styles.infoBox}>
          <div style={{ fontWeight: 980, color: ui.text }}>Wat moet je doen?</div>
          <div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}>
            <div>1. Kies één gewone dag.</div>
            <div>2. Registreer in Virtuafood alles wat je die dag eet én drinkt. Vergeet tussendoortjes, dranken, sauzen en kleine snacks niet.</div>
            <div>3. Neem uit Virtuafood je totale kcal-inname en je eiwitten, koolhydraten en vetten over.</div>
            <div>4. Bereken je energieverbruik met de TDEE Calculator.</div>
            <div>5. Vergelijk je energie-inname met je energieverbruik en schrijf je eigen conclusie.</div>
            <div>6. Bekijk in Virtuafood je macro&apos;s in functie van het doel dat je in de app koos en bespreek wat je opvalt.</div>
          </div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Korte theorie</div>
          <div style={{ ...styles.small, marginTop: 10 }}><b style={{ color: ui.text }}>Energie-inname</b> is de energie die je binnenkrijgt via eten en drinken. Voor deze opdracht haal je die waarde uit Virtuafood.</div>
          <div style={{ ...styles.small, marginTop: 10 }}><b style={{ color: ui.text }}>Energieverbruik</b> is de energie die je lichaam gebruikt om te leven en te bewegen. Voor deze opdracht bereken je dit met de TDEE Calculator.</div>
          <div style={{ ...styles.small, marginTop: 10 }}><b style={{ color: ui.text }}>Energiebalans</b> is het verschil tussen je inname en je verbruik. Als hetzelfde patroon weken of maanden blijft terugkomen, kan dat invloed hebben op je lichaamsgewicht.</div>
          <div style={{ ...styles.small, marginTop: 10 }}><b style={{ color: ui.text }}>Macro&apos;s</b> zijn eiwitten, koolhydraten en vetten. Hoe je verdeling eruitziet, hangt mee af van je doel. Kijk daarom naar het doel dat je in Virtuafood gekozen hebt en vergelijk de voorgestelde verdeling met wat je die dag werkelijk registreerde.</div>
        </div>
      </div>
      {flags.length > 0 && (
        <div style={styles.warnBox}>
          <b>Controlepunten:</b>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>{flags.map((f, i) => <div key={i}>• {f}</div>)}</div>
        </div>
      )}
      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Datum van de dag die je registreerde</div><input value={value.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} placeholder="YYYY-MM-DD" /></div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Gewicht (kg) — optioneel</div><input value={value.weightKg} onChange={(e) => set({ weightKg: e.target.value })} style={styles.input} inputMode="decimal" placeholder="bv. 68" /><div style={{ ...styles.small, marginTop: 8 }}>Optioneel: vul dit alleen in als je een automatische inschatting van je eiwitten per kg lichaamsgewicht wilt zien.</div></div>
          <div style={{ ...styles.infoBox, marginTop: 12 }}><b style={{ color: ui.text }}>Voedingsapp: Virtuafood</b><div style={{ ...styles.small, marginTop: 6 }}>Gebruik voor deze volledige opdracht enkel Virtuafood om je voeding te registreren.</div></div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>2) Gegevens uit Virtuafood</div>
          <div style={{ ...styles.small, marginTop: 8 }}>Registreer eerst de volledige dag in Virtuafood. Vul pas daarna onderstaande gegevens in.</div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Aantal maaltijden / eetmomenten geregistreerd</div><input value={value.mealsCount} onChange={(e) => set({ mealsCount: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 4" /></div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Welke maaltijd leverde volgens Virtuafood de meeste kcal?</div><select value={value.highestKcalMeal} onChange={(e) => set({ highestKcalMeal: e.target.value as MealChoice })} style={{ ...styles.input, marginTop: 10 }}><option value="">Kies…</option><option value="Ontbijt">Ontbijt</option><option value="Lunch">Lunch</option><option value="Avondeten">Avondeten</option><option value="Tussendoortje">Tussendoortje</option><option value="Drank">Drank</option></select></div>
        </div>
      </div>
      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>3) Energie-inname via Virtuafood</div>
          <div style={{ ...styles.infoBox, marginTop: 10 }}><b style={{ color: ui.text }}>Alles registreren</b><div style={{ ...styles.small, marginTop: 6 }}>Voer in Virtuafood alles in wat je eet en drinkt gedurende de volledige dag. Ook tussendoortjes, frisdrank, melk, sportdrank, sauzen en kleine hapjes tellen mee. Zo krijg je een zo volledig mogelijke inschatting van je energie-inname en macro&apos;s.</div></div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Totale kcal-inname uit Virtuafood</div><input value={value.kcalIntake} onChange={(e) => set({ kcalIntake: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 2250" /></div>
          <div className="row3" style={{ ...styles.row3, marginTop: 12 }}>
            <div><div style={styles.label}>Eiwitten (g)</div><input value={value.proteinG} onChange={(e) => set({ proteinG: e.target.value })} style={styles.input} inputMode="decimal" placeholder="bv. 95" /></div>
            <div><div style={styles.label}>Koolhydraten (g)</div><input value={value.carbsG} onChange={(e) => set({ carbsG: e.target.value })} style={styles.input} inputMode="decimal" placeholder="bv. 260" /></div>
            <div><div style={styles.label}>Vetten (g)</div><input value={value.fatG} onChange={(e) => set({ fatG: e.target.value })} style={styles.input} inputMode="decimal" placeholder="bv. 75" /></div>
          </div>
          <div style={styles.infoBox}><div style={{ fontWeight: 980, color: ui.text }}>Macro-overzicht automatisch</div><div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}><div>Eiwit per kg lichaamsgewicht: <b style={{ color: ui.text }}>{derived.proteinPerKg === null ? "—" : `${derived.proteinPerKg.toFixed(2)} g/kg`}</b></div><div>Verdeling op basis van macro-kcal: <b style={{ color: ui.text }}>Eiwit {derived.proteinPct ?? "—"}% | KH {derived.carbsPct ?? "—"}% | Vet {derived.fatPct ?? "—"}%</b></div><div>{proteinAdvice}</div></div></div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>4) Energieverbruik via TDEE Calculator</div>
          <div style={{ ...styles.small, marginTop: 8 }}>Bereken je totale dagelijkse energieverbruik met de TDEE Calculator. Voor deze opdracht gebruiken we geen andere methode.</div>
          <a href="https://www.calculator.net/tdee-calculator.html" target="_blank" rel="noreferrer" style={{ ...styles.linkBtn, marginTop: 12 }}>Open TDEE Calculator</a>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Totaal kcal-verbruik volgens de TDEE Calculator</div><input value={value.kcalTotalBurn} onChange={(e) => set({ kcalTotalBurn: e.target.value, burnSource: "TDEE Calculator" })} style={styles.input} inputMode="numeric" placeholder="bv. 2400" /></div>
          <div style={styles.infoBox}><div style={{ fontWeight: 980, color: ui.text }}>Energiebalans automatisch</div><div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><span style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>{derived.kcalBalance === null ? "—" : `${Math.round(derived.kcalBalance)} kcal`}</span><span style={styles.pill}>{balanceLabel}</span></div><div style={{ ...styles.small, marginTop: 10 }}>De app toont enkel het verschil. Jij legt zelf uit wat dit volgens jou betekent.</div></div>
        </div>
      </div>
      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>5) Conclusie energiebalans</div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Beschrijf jouw energiebalans in je eigen woorden</div><textarea value={value.balanceExplain} onChange={(e) => set({ balanceExplain: e.target.value })} style={styles.textarea} placeholder="Wat valt je op wanneer je jouw kcal-inname uit Virtuafood vergelijkt met je kcal-verbruik uit de TDEE Calculator?" /></div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Wat kan dit op lange termijn betekenen?</div><textarea value={value.longTermExplain} onChange={(e) => set({ longTermExplain: e.target.value })} style={styles.textarea} placeholder="Stel dat dit patroon weken of maanden ongeveer hetzelfde blijft. Wat verwacht je dan? Leg uit waarom." /></div>
        </div>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>6) Macro&apos;s in functie van je doel + reflectie</div>
          <div style={styles.infoBox}>
            <div style={{ fontWeight: 980, color: ui.text }}>Macro&apos;s hangen samen met je doel</div>
            <div style={{ ...styles.small, marginTop: 10 }}>Virtuafood laat je een doel kiezen. Bekijk de macroverdeling die bij jouw gekozen doel hoort en vergelijk die met je geregistreerde dag.</div>
            <div style={{ ...styles.small, marginTop: 10 }}><b style={{ color: ui.text }}>Eiwitten</b> ondersteunen spieropbouw, spierherstel en het behoud van spiermassa. Bij een sportief doel kan voldoende eiwit extra belangrijk zijn.</div>
            <div style={{ ...styles.small, marginTop: 6 }}><b style={{ color: ui.text }}>Koolhydraten</b> zijn een belangrijke energiebron, vooral bij bewegen en sporten. Bij een doel waarbij prestaties en trainingsenergie belangrijk zijn, spelen ze dus een grote rol.</div>
            <div style={{ ...styles.small, marginTop: 6 }}><b style={{ color: ui.text }}>Vetten</b> leveren energie en zijn belangrijk voor onder andere hormonen en de opname van bepaalde vitamines. Ze blijven dus bij elk doel een noodzakelijk onderdeel van je voeding.</div>
            <div style={{ ...styles.small, marginTop: 10 }}>Er bestaat niet één perfecte macroverdeling voor iedereen. Beoordeel je macro&apos;s daarom in functie van <b style={{ color: ui.text }}>jouw gekozen doel in Virtuafood</b>, niet alleen op basis van welk percentage het grootst is.</div>
          </div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Bespreek je macro&apos;s in functie van je gekozen doel in Virtuafood</div><textarea value={value.macroExplain} onChange={(e) => set({ macroExplain: e.target.value })} style={styles.textarea} placeholder="Welk doel koos je in Virtuafood? Hoe verhouden je eiwitten, koolhydraten en vetten zich tot dat doel? Wat valt je op?" /></div>
          <div style={{ ...styles.infoBox, marginTop: 12 }}><div style={{ fontWeight: 980, color: ui.text }}>Wat verwachten we in je reflectie?</div><div style={{ ...styles.small, marginTop: 8 }}>Kijk kritisch naar je eigen geregistreerde dag. Leg uit of deze dag typisch is voor jou, wat volgens jou goed zit en wat beter kan. Gebruik je eigen gegevens uit Virtuafood en de TDEE Calculator en geef minstens één concrete, realistische aanpassing die past bij jouw gekozen doel.</div></div>
          <div style={{ marginTop: 12 }}><div style={styles.label}>Persoonlijke reflectie</div><textarea value={value.reflection} onChange={(e) => set({ reflection: e.target.value })} style={styles.textarea} placeholder="Is deze dag typisch voor jou? Wat zit goed? Wat kan beter? Onderbouw met je eigen gegevens en geef één concrete aanpassing die past bij je doel." /></div>
        </div>
      </div>
    </>
  );
}
