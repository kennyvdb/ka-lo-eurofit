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

  const rub2 = useMemo(() => rubricsSecond(f2), [f2]);
  const rub3 = useMemo(() => rubricsThird(f3), [f3]);

  const reset = () => {
    setInfo(null);
    setError(null);
    if (mode === "2e") setF2(initSecond(defaultMas ?? null, detectedGender));
    else setF3(initThird());
  };

  const handleSave = async () => {
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

      try {
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
            form: mode === "2e" ? f2 : f3,
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
            }
          : {
              grade: "3e",
              form: f3,
              rubrics: rub3.items,
              totals: rub3.totals,
              flags: rub3.flags,
              aiAssessment,
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

      const { error } = await supabase
        .from("eurofit_huiswerk_submissions")
        .insert(row);
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

      {teacherMode && showAllRubrics ? (
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>
            📊 Alle rubrics — {mode === "2e" ? "2e graad" : "3e graad"}
          </div>

          {mode === "2e" ? (
            <>
              <div style={{ ...styles.small, marginTop: 8 }}>
                De evaluatie van het huiswerk 2e graad gebruikt geen punten op 10.
                De code controleert <b style={{ color: ui.text }}>14 concrete onderdelen</b>.
                Het aantal onderdelen dat correct/controleerbaar aanwezig is, bepaalt de rubric.
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {[
                  {
                    level: "++",
                    title: "Zeer goed",
                    range: "12–14 van de 14 onderdelen aanwezig",
                    text: "Het huiswerk is zeer volledig. De leerling gebruikt de MAS persoonlijk, plant de training concreet, meet de hartslag logisch, gebruikt praattest en RPE en reflecteert voldoende uitgebreid.",
                    color: rubricColors["++"],
                  },
                  {
                    level: "+",
                    title: "In orde",
                    range: "10–11 van de 14 onderdelen aanwezig",
                    text: "Het huiswerk is logisch en voldoende volledig om de training te kunnen beoordelen. Er ontbreken nog enkele details of onderdelen voor een ++.",
                    color: rubricColors["+"],
                  },
                  {
                    level: "+/-",
                    title: "Basis aanwezig",
                    range: "7–9 van de 14 onderdelen aanwezig",
                    text: "Een belangrijk deel van het huiswerk is ingevuld, maar meerdere onderdelen ontbreken of zijn onvoldoende duidelijk. De leerling toont de basis, maar het geheel is nog niet volledig controleerbaar.",
                    color: rubricColors["+/-"],
                  },
                  {
                    level: "-",
                    title: "Onvoldoende / onvolledig",
                    range: "0–6 van de 14 onderdelen aanwezig",
                    text: "Te veel verplichte onderdelen ontbreken. Daardoor kan de uitvoering, intensiteit en reflectie van de training onvoldoende beoordeeld worden.",
                    color: rubricColors["-"],
                  },
                ].map((r) => (
                  <div key={r.level} style={{ ...styles.rubricCard, borderColor: r.color }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{
                        display: "inline-flex",
                        minWidth: 48,
                        justifyContent: "center",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontWeight: 1000,
                        background: r.color,
                        color: "#081018",
                      }}>
                        {r.level}
                      </span>
                      <b style={{ color: ui.text }}>{r.title}</b>
                      <span style={styles.pill}>{r.range}</span>
                    </div>
                    <div style={{ ...styles.small, marginTop: 8 }}>{r.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...styles.infoBox, marginTop: 14 }}>
                <b style={{ color: ui.text }}>De 14 controlepunten</b>
                <div style={{ marginTop: 10, display: "grid", gap: 7 }}>
                  {[
                    "1. MAS is correct ingevuld en groter dan 0.",
                    "2. Geslacht is beschikbaar in het profiel.",
                    "3. Trainingsvorm is gekozen: duurloop, tempoloop of intervaltraining.",
                    "4. Persoonlijk trainingsdoel is gekozen.",
                    "5. Vooraf zijn zowel verwachte RPE (1–10) als verwachte praattest ingevuld.",
                    "6. Opwarming bevat een geldige duur in minuten.",
                    "7. De kern van de training is ingevuld.",
                    "8. Cooling-down bevat een geldige duur in minuten.",
                    "9. De kern verwijst concreet naar MAS, %, km/u, tempo, minuten, rust of herhalingen.",
                    "10. Rusthartslag, piekhartslag en herstelhartslag na 1 minuut zijn alle drie ingevuld.",
                    "11. De hartslagwaarden zijn logisch: piek > rust en herstel na 1 minuut < piek.",
                    "12. Praattest is gekozen én kort uitgelegd.",
                    "13. RPE na de training is geldig ingevuld van 1 tot 10.",
                    "14. Reflectie bevat minstens 2 duidelijke zinnen en minstens 80 tekens.",
                  ].map((x) => (
                    <div key={x} style={styles.rubricCard}>{x}</div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.small, marginTop: 12 }}>
                Belangrijk: de rubric beoordeelt hier vooral of het huiswerk
                <b style={{ color: ui.text }}> volledig, logisch en controleerbaar </b>
                is ingevuld. De MAS-prestatie zelf wordt daarnaast apart weergegeven en bepaalt
                niet rechtstreeks de huiswerkrubric.
              </div>
            </>
          ) : (
            <>
              <div style={{ ...styles.small, marginTop: 8 }}>
                De leerling krijgt geen cijfer op 10. De evaluatie gebruikt
                <b style={{ color: ui.text }}> - / +/- / + / ++</b>.
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {RUBRIC_EXPLANATION[mode].map((criterion, index) => (
                  <div key={criterion} style={styles.rubricCard}>
                    <b style={{ color: ui.text }}>{index + 1}. {criterion}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

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

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Reflectie (min. 2 zinnen)</div>
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
          <div style={{ marginTop: 12 }}><div style={styles.label}>Persoonlijke reflectie</div><textarea value={value.reflection} onChange={(e) => set({ reflection: e.target.value })} style={styles.textarea} placeholder="Is deze dag typisch voor jou? Noem één positief punt en één realistische aanpassing die je eventueel zou kunnen maken." /></div>
        </div>
      </div>
    </>
  );
}
