"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ProfielLite = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
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

function initSecond(
  defaultMas?: number | null,
  defaultGender: GenderChoice = "",
): SecondGradeForm {
  return {
    date: toYMD(),
    gender: defaultGender,
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

function getMasSpeedText(masRaw: string) {
  const mas = toNum(masRaw);
  if (!Number.isFinite(mas) || mas <= 0)
    return "Vul je MAS in om je persoonlijke richttempo's te zien.";

  const speedToPace = (speed: number) => {
    if (!Number.isFinite(speed) || speed <= 0) return "—";
    const totalSec = Math.round(3600 / speed);
    const min = Math.floor(totalSec / 60);
    const sec = String(totalSec % 60).padStart(2, "0");
    return `${min}:${sec}/km`;
  };

  const duur70 = mas * 0.7;
  const duur80 = mas * 0.8;
  const int90 = mas * 0.9;
  const int100 = mas;

  return `Met jouw MAS van ${mas.toFixed(1)} km/u: duurtraining ≈ 70–80% MAS (${duur70.toFixed(
    1,
  )}–${duur80.toFixed(1)} km/u = ${speedToPace(duur70)} tot ${speedToPace(
    duur80,
  )}). Interval ≈ 90–100% MAS (${int90.toFixed(1)}–${int100.toFixed(
    1,
  )} km/u = ${speedToPace(int90)} tot ${speedToPace(int100)}).`;
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
  if (score >= 10) level = "++";
  else if (score >= 8) level = "+";
  else if (score >= 6) level = "+/-";

  const missing: string[] = [];
  if (!hasMas) missing.push("vul je MAS correct in");
  if (!hasGender)
    missing.push("geslacht werd niet automatisch gevonden in profielen.geslacht (M/V)");
  if (!hasType) missing.push("kies duurtraining of intervaltraining");
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
type IntakeAppChoice = "iFood" | "MyFitnessPal" | "Yazio" | "Andere app" | "";

type ThirdGradeForm = {
  date: string;
  weightKg: string;

  intakeApp: IntakeAppChoice;
  intakeAppOther: string;
  kcalIntake: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  mealsCount: string;
  highestKcalMeal: MealChoice;

  kcalTotalBurn: string;
  burnSource: "TDEE Calculator" | "Smartwatch / gezondheidsapp" | "Andere calculator" | "";

  balanceExplain: string;
  longTermExplain: string;
  macroExplain: string;
  reflection: string;
};

function initThird(): ThirdGradeForm {
  return {
    date: toYMD(),
    weightKg: "",
    intakeApp: "iFood",
    intakeAppOther: "",
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
  const hasApp = Boolean(f.intakeApp && (f.intakeApp !== "Andere app" || f.intakeAppOther.trim()));
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
    flags.push("Je kcal-inname lijkt weinig realistisch. Controleer of je de waarde correct uit iFood hebt overgenomen.");
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
            : "Vul alle verplichte gegevens in: kcal-inname, kcal-verbruik, macro's, app, maaltijdinfo en reflectie.",
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
/* =========================
   HOOFDCOMPONENT
========================= */

export default function HomeworkTab({ uid, profiel, defaultMas }: Props) {
  const [mode, setMode] = useState<GradeMode>("2e");

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

      const { error } = await supabase
        .from("functional_huiswerk_submissions")
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
              Kies je graad en vul de opdracht in. De app berekent automatisch
              rubrics.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
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
          <RubricPanel title="Evaluatie (2e graad)" items={rub2} />
        </>
      ) : (
        <>
          <ThirdGradePanel
            value={f3}
            onChange={setF3}
            derived={rub3.totals}
            flags={rub3.flags}
          />
          <RubricPanel
            title="Rubrics (3e graad)"
            items={rub3.items}
            extraRight={`Energiebalans: ${
              rub3.totals.kcalBalance === null
                ? "—"
                : `${Math.round(rub3.totals.kcalBalance)} kcal`
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
          zelf:
          <b style={{ color: ui.text }}> duurtraining</b> of{" "}
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
          <div>1. Kies één training: duur of interval.</div>
          <div>2. Maak een plan met opwarming, kern en cooling-down.</div>
          <div>3. Gebruik je MAS om je tempo te kiezen.</div>
          <div>
            4. Meet rusthartslag, hoogste hartslag en herstelhartslag na exact 1
            minuut.
          </div>
          <div>5. Noteer praattest, RPE en een korte reflectie.</div>
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
          <div style={styles.sectionTitle}>
            2) Plan met MAS (opwarming – kern – cooling-down)
          </div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Duurtraining:</b> loop of wandel-loop
            15–30 minuten aan een tempo dat je lang kan volhouden. Richting:
            70–80% MAS. Je blijft meestal in praattest groen/oranje.
          </div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Intervaltraining:</b> wissel
            inspanning en herstel af. Dat kan als wandelen → lopen, of als
            rustig lopen → versnellen. Richting: inspanningen aan 90–100% MAS,
            herstel zeer rustig wandelen of joggen.
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
                  ? "bv. 8×1 min aan 90–95% MAS met 1 min wandelen/joggen als rust. Of: 10×30 sec versnellen + 60 sec rustig lopen."
                  : "bv. 20 min aan 70–80% MAS. Ik loop rustig door en blijf in praattest groen/oranje."
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
              placeholder="Schrijf: wat ging goed? wat zegt mijn hartslag/praattest/RPE? wat neem ik mee naar volgende keer?"
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
  const set = (patch: Partial<ThirdGradeForm>) =>
    onChange({ ...value, ...patch });

  const balanceLabel = energyBalanceLabel(derived.kcalBalance);
  const proteinAdvice = proteinAdviceText(derived.proteinPerKg);

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>🥗 Huiswerk 3e graad — energiebalans en voeding</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Registreer <b style={{ color: ui.text }}>één volledige dag</b>. Gebruik voor je
          energie-inname bij voorkeur <b style={{ color: ui.text }}>iFood</b>. Gebruik voor je
          energieverbruik de <b style={{ color: ui.text }}>TDEE Calculator</b>. Vul daarna je
          kcal-inname, kcal-verbruik en macro's in en trek zelf je conclusie.
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.infoBox}>
          <div style={{ fontWeight: 980, color: ui.text }}>Wat moet je doen?</div>
          <div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}>
            <div>1. Kies één gewone dag.</div>
            <div>2. Registreer alles wat je eet en drinkt in iFood of een gelijkaardige app.</div>
            <div>3. Noteer je kcal-inname, eiwitten, koolhydraten en vetten.</div>
            <div>4. Bereken je kcal-verbruik met de TDEE Calculator.</div>
            <div>5. Vergelijk inname en verbruik en schrijf je eigen conclusie.</div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Korte theorie</div>
          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>Energie-inname</b> is de energie die je binnenkrijgt via eten en drinken.
          </div>
          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>Energieverbruik</b> is de energie die je lichaam gebruikt om te leven en te bewegen.
          </div>
          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>Energiebalans</b> is het verschil tussen je inname en je verbruik.
            Als hetzelfde patroon weken of maanden blijft terugkomen, kan dat invloed hebben op je lichaamsgewicht.
          </div>
          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>Macro's</b> zijn eiwitten, koolhydraten en vetten.
            Eiwitten ondersteunen spierherstel, koolhydraten leveren veel trainingsenergie en vetten zijn nodig voor onder andere hormonen en opname van vitamines.
          </div>
          <div style={{ ...styles.small, marginTop: 10 }}>
            <b style={{ color: ui.text }}>MET en PAL</b> worden soms gebruikt om energieverbruik te schatten,
            maar voor deze huistaak hoef je ze niet zelf te berekenen.
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
            <div style={styles.sectionTitle}>TDEE Calculator voor kcal-verbruik</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Gebruik deze calculator om je totaal energieverbruik per dag te schatten.
            </div>
          </div>

          <a
            href="https://www.calculator.net/tdee-calculator.html"
            target="_blank"
            rel="noreferrer"
            style={styles.linkBtn}
          >
            Open TDEE Calculator
          </a>
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
            <div style={styles.label}>Datum van de dag die je registreerde</div>
            <input
              value={value.date}
              onChange={(e) => set({ date: e.target.value })}
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Gewicht (kg) — optioneel</div>
            <input
              value={value.weightKg}
              onChange={(e) => set({ weightKg: e.target.value })}
              style={styles.input}
              inputMode="decimal"
              placeholder="bv. 68"
            />
            <div style={{ ...styles.small, marginTop: 8 }}>
              Optioneel: vul dit alleen in als je een automatische inschatting van je eiwitten per kg lichaamsgewicht wilt zien.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Welke app gebruikte je voor je voeding?</div>
            <select
              value={value.intakeApp}
              onChange={(e) => set({ intakeApp: e.target.value as IntakeAppChoice })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="iFood">iFood</option>
              <option value="MyFitnessPal">MyFitnessPal</option>
              <option value="Yazio">Yazio</option>
              <option value="Andere app">Andere app</option>
            </select>
          </div>

          {value.intakeApp === "Andere app" ? (
            <div style={{ marginTop: 12 }}>
              <div style={styles.label}>Naam andere app</div>
              <input
                value={value.intakeAppOther}
                onChange={(e) => set({ intakeAppOther: e.target.value })}
                style={styles.input}
                placeholder="bv. Lifesum"
              />
            </div>
          ) : null}
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>2) Extra gegevens uit iFood</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Aantal maaltijden / eetmomenten geregistreerd</div>
            <input
              value={value.mealsCount}
              onChange={(e) => set({ mealsCount: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 4"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Welke maaltijd leverde volgens de app de meeste kcal?</div>
            <select
              value={value.highestKcalMeal}
              onChange={(e) => set({ highestKcalMeal: e.target.value as MealChoice })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="Ontbijt">Ontbijt</option>
              <option value="Lunch">Lunch</option>
              <option value="Avondeten">Avondeten</option>
              <option value="Tussendoortje">Tussendoortje</option>
              <option value="Drank">Drank</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>3) Energie-inname via iFood</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Totale kcal-inname</div>
            <input
              value={value.kcalIntake}
              onChange={(e) => set({ kcalIntake: e.target.value })}
              style={styles.input}
              inputMode="numeric"
              placeholder="bv. 2250"
            />
          </div>

          <div className="row3" style={{ ...styles.row3, marginTop: 12 }}>
            <div>
              <div style={styles.label}>Eiwitten (g)</div>
              <input
                value={value.proteinG}
                onChange={(e) => set({ proteinG: e.target.value })}
                style={styles.input}
                inputMode="decimal"
                placeholder="bv. 95"
              />
            </div>
            <div>
              <div style={styles.label}>Koolhydraten (g)</div>
              <input
                value={value.carbsG}
                onChange={(e) => set({ carbsG: e.target.value })}
                style={styles.input}
                inputMode="decimal"
                placeholder="bv. 260"
              />
            </div>
            <div>
              <div style={styles.label}>Vetten (g)</div>
              <input
                value={value.fatG}
                onChange={(e) => set({ fatG: e.target.value })}
                style={styles.input}
                inputMode="decimal"
                placeholder="bv. 75"
              />
            </div>
          </div>

          <div style={styles.infoBox}>
            <div style={{ fontWeight: 980, color: ui.text }}>Macro-overzicht automatisch</div>
            <div style={{ ...styles.small, marginTop: 8, display: "grid", gap: 6 }}>
              <div>Eiwit per kg lichaamsgewicht: <b style={{ color: ui.text }}>{derived.proteinPerKg === null ? "—" : `${derived.proteinPerKg.toFixed(2)} g/kg`}</b></div>
              <div>Verdeling op basis van macro-kcal: <b style={{ color: ui.text }}>Eiwit {derived.proteinPct ?? "—"}% | KH {derived.carbsPct ?? "—"}% | Vet {derived.fatPct ?? "—"}%</b></div>
              <div>{proteinAdvice}</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>4) Energieverbruik via TDEE Calculator</div>

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
            <div style={styles.label}>Bron voor verbruik</div>
            <select
              value={value.burnSource}
              onChange={(e) => set({ burnSource: e.target.value as ThirdGradeForm["burnSource"] })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="TDEE Calculator">TDEE Calculator</option>
              <option value="Smartwatch / gezondheidsapp">Smartwatch / gezondheidsapp</option>
              <option value="Andere calculator">Andere calculator</option>
            </select>
          </div>

          <div style={styles.infoBox}>
            <div style={{ fontWeight: 980, color: ui.text }}>Energiebalans automatisch</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>
                {derived.kcalBalance === null ? "—" : `${Math.round(derived.kcalBalance)} kcal`}
              </span>
              <span style={styles.pill}>{balanceLabel}</span>
            </div>
            <div style={{ ...styles.small, marginTop: 10 }}>
              De app toont enkel het verschil. Jij legt zelf uit wat dit volgens jou betekent.
            </div>
          </div>
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>5) Conclusie energiebalans</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Beschrijf jouw energiebalans in je eigen woorden</div>
            <textarea
              value={value.balanceExplain}
              onChange={(e) => set({ balanceExplain: e.target.value })}
              style={styles.textarea}
              placeholder="Wat valt je op wanneer je jouw kcal-inname vergelijkt met je kcal-verbruik?"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Wat kan dit op lange termijn betekenen?</div>
            <textarea
              value={value.longTermExplain}
              onChange={(e) => set({ longTermExplain: e.target.value })}
              style={styles.textarea}
              placeholder="Stel dat dit patroon weken of maanden ongeveer hetzelfde blijft. Wat verwacht je dan? Leg uit waarom."
            />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>6) Conclusie macro's en reflectie</div>

          <div style={styles.infoBox}>
            <div style={{ fontWeight: 980, color: ui.text }}>Korte theorie over macro's</div>

            <div style={{ ...styles.small, marginTop: 10 }}>
              <b style={{ color: ui.text }}>Eiwitten</b> helpen bij spieropbouw, spierherstel en behoud van spiermassa.
            </div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Richtwaarden: niet-sporter ongeveer <b style={{ color: ui.text }}>0,8 g/kg</b>, actieve jongeren ongeveer <b style={{ color: ui.text }}>1,2–1,6 g/kg</b> en bij veel sport ongeveer <b style={{ color: ui.text }}>1,6–2,0 g/kg</b> lichaamsgewicht per dag.
            </div>

            <div style={{ ...styles.small, marginTop: 10 }}>
              <b style={{ color: ui.text }}>Koolhydraten</b> zijn een belangrijke energiebron. Te weinig koolhydraten kan zorgen voor sneller vermoeid zijn en minder trainingsenergie. Te veel koolhydraten kan, samen met de rest van je voeding, bijdragen aan een energieoverschot.
            </div>

            <div style={{ ...styles.small, marginTop: 10 }}>
              <b style={{ color: ui.text }}>Vetten</b> zijn nodig voor hormonen, je hersenen en de opname van bepaalde vitamines. Je moet vetten dus niet vermijden, maar kies bij voorkeur voor gezonde vetten.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Bespreek je eiwitten, koolhydraten en vetten</div>
            <textarea
              value={value.macroExplain}
              onChange={(e) => set({ macroExplain: e.target.value })}
              style={styles.textarea}
              placeholder="Welke macro kwam het meest voor? Was je eiwitinname volgens jou voldoende? Wat valt je op?"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Persoonlijke reflectie</div>
            <textarea
              value={value.reflection}
              onChange={(e) => set({ reflection: e.target.value })}
              style={styles.textarea}
              placeholder="Is deze dag typisch voor jou? Noem één positief punt en één realistische aanpassing die je eventueel zou kunnen maken."
            />
          </div>
        </div>
      </div>
    </>
  );
}
