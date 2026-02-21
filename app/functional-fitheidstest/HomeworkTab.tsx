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
  description: string; // uitgelegd volgens level
  autoFeedback: string; // korte zin voor leerling
};

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
};

const rubricColors: Record<RubricLevel, string> = {
  "-": "rgba(255,85,112,0.25)", // rood
  "+/-": "rgba(255,193,102,0.22)", // oranje
  "+": "rgba(140,255,140,0.16)", // lichtgroen
  "++": "rgba(80,220,120,0.22)", // donkergroen
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  sectionTitle: { fontSize: 13, fontWeight: 950, color: ui.text },
  small: { fontSize: 12.5, color: ui.muted, lineHeight: 1.35 },
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
    minHeight: 90,
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
  label: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
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
};

type Props = {
  uid: string;
  profiel: ProfielLite | null;
  // optioneel: MAS uit test (km/u)
  defaultMas?: number | null;
};

type GradeMode = "2e" | "3e";

// -------------------------
// 2e graad state
// -------------------------
type TalkTest = "Groen" | "Oranje" | "Rood" | "";

type SecondGradeForm = {
  date: string;
  mas: string; // km/u
  trainingType: "Duur" | "Interval" | "";
  warmupMin: string;
  coreText: string; // kern (tekstveld)
  cooldownMin: string;

  hrRest: string;
  hrPeak: string;
  hrRec1: string;

  talk: TalkTest;
  talkExplain: string;

  rpe: string; // 1-10
  reflection: string; // min 2 zinnen

  // optioneel krachtcircuit (niet in rubric)
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

// -------------------------
// 3e graad state
// -------------------------
type ActivityRow = {
  id: string;
  activity: string;
  minutes: string;
  met: string;
};

type PalChoice = "Laag actief" | "Matig actief" | "Actief" | "";

type ThirdGradeForm = {
  date: string;
  weightKg: string; // optioneel

  activities: ActivityRow[]; // min 5
  pal: PalChoice;
  palExplain: string;

  preFood: string;
  postFood: string;
  proteinAfter: "ja" | "nee" | "";
  proteinExample: string;
};

const MET_OPTIONS: { label: string; value: number }[] = [
  { label: "Zitten/schoolwerk (1.3)", value: 1.3 },
  { label: "Wandelen rustig (2.8)", value: 2.8 },
  { label: "Fietsen rustig (4.0)", value: 4.0 },
  { label: "Fietsen stevig (6.0)", value: 6.0 },
  { label: "Lopen rustig (7.0)", value: 7.0 },
  { label: "Sporttraining gematigd (5.0)", value: 5.0 },
  { label: "Krachttraining (6.0)", value: 6.0 },
  { label: "Traplopen (8.0)", value: 8.0 },
];

function mkId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function initThird(): ThirdGradeForm {
  return {
    date: toYMD(),
    weightKg: "",
    activities: Array.from({ length: 5 }).map(() => ({
      id: mkId(),
      activity: "",
      minutes: "",
      met: "",
    })),
    pal: "",
    palExplain: "",
    preFood: "",
    postFood: "",
    proteinAfter: "",
    proteinExample: "",
  };
}

// -------------------------
// Helpers
// -------------------------
function toNum(s: string) {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function countSentencesApprox(s: string) {
  const t = (s || "").trim();
  if (!t) return 0;
  // simpele schatting op . ! ?
  const parts = t.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
  return parts.length;
}

function hasActionKeyword(s: string) {
  const t = (s || "").toLowerCase();
  return (
    t.includes("volgende") ||
    t.includes("aanpassen") ||
    t.includes("plan") ||
    t.includes("tempo") ||
    t.includes("ik ga") ||
    t.includes("extra") ||
    t.includes("zodat") ||
    t.includes("daarom") ||
    t.includes("omdat")
  );
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

function levelText(level: RubricLevel, minus: string, pm: string, plus: string, pp: string) {
  if (level === "-") return minus;
  if (level === "+/-") return pm;
  if (level === "+") return plus;
  return pp;
}

// -------------------------
// Rubrics 2e graad
// -------------------------
function rubricsSecond(f: SecondGradeForm): RubricItem[] {
  // C1 Training plan
  const hasType = Boolean(f.trainingType);
  const hasWarm = Boolean(f.warmupMin.trim());
  const hasCore = Boolean(f.coreText.trim());
  const hasCool = Boolean(f.cooldownMin.trim());
  const filled = [hasType, hasWarm, hasCore, hasCool].filter(Boolean).length;

  let lvl1: RubricLevel = "-";
  if (filled <= 2) lvl1 = "-";
  else if (filled === 3) lvl1 = "+/-";
  else {
    // 4/4
    const coreSpecific =
      f.trainingType === "Duur"
        ? f.coreText.toLowerCase().includes("%") || f.coreText.toLowerCase().includes("mas") || f.coreText.toLowerCase().includes("min")
        : f.coreText.includes("x") || f.coreText.includes("×") || f.coreText.includes("'") || f.coreText.toLowerCase().includes("rust");
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

  // C2 Hartslag correct
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

  // C3 Praattest
  const hasTalk = Boolean(f.talk);
  const hasExplain = (f.talkExplain || "").trim().length > 0;

  let lvl3: RubricLevel = "-";
  if (!hasTalk) lvl3 = "-";
  else if (hasTalk && !hasExplain) lvl3 = "+/-";
  else {
    const refl = (f.reflection || "").toLowerCase();
    const adaptive = refl.includes("volgende") || refl.includes("aanpassen") || refl.includes("trager") || refl.includes("sneller");
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

  // C4 Reflectie & RPE
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

// -------------------------
// Rubrics 3e graad
// -------------------------
function rubricsThird(f: ThirdGradeForm): { items: RubricItem[]; totals: { metMinutesTotal: number } } {
  const rows = f.activities || [];
  const count = rows.filter((r) => r.activity.trim() || r.minutes.trim() || r.met.trim()).length;
  const completeCount = rows.filter(isRowComplete).length;

  const hasLow = rows.some((r) => {
    const met = toNum(r.met);
    return Number.isFinite(met) && met <= 1.5;
  });
  const hasHigh = rows.some((r) => {
    const met = toNum(r.met);
    return Number.isFinite(met) && met >= 4;
  });

  const metTotal = rows.reduce((sum, r) => sum + calcMetMinutes(r), 0);

  // C1 log
  let lvl1: RubricLevel = "-";
  if (completeCount < 3) lvl1 = "-";
  else if (completeCount <= 4) lvl1 = "+/-";
  else if (completeCount >= 6 && hasLow && hasHigh) lvl1 = "++";
  else lvl1 = "+";

  const item1: RubricItem = {
    key: "log",
    title: "Activiteitenlog voldoende en correct ingevuld",
    level: lvl1,
    color: rubricColors[lvl1],
    description: levelText(
      lvl1,
      "Minder dan 3 activiteiten of meerdere velden leeg.",
      "3–4 activiteiten, grotendeels ingevuld maar niet volledig/consistent.",
      "Minstens 5 activiteiten, alle regels hebben duur + MET.",
      "6+ activiteiten én realistische spreiding (ook laag actief/zitten + matig/hoog actief)."
    ),
    autoFeedback:
      lvl1 === "++"
        ? "Sterk logboek: veel en realistische variatie."
        : lvl1 === "+"
        ? "Goed: je hebt voldoende activiteiten volledig ingevuld."
        : lvl1 === "+/-"
        ? "Vul aan tot minstens 5 volledig ingevulde activiteiten."
        : "Je hebt te weinig volledige activiteiten: voeg er toe en vul duur + MET in.",
  };

  // C2 met totaal
  const hasAnyTotal = metTotal > 0.01;
  const anyIncomplete = rows.some((r) => (r.activity.trim() || r.minutes.trim() || r.met.trim()) && !isRowComplete(r));

  let lvl2: RubricLevel = "-";
  if (!hasAnyTotal) lvl2 = "-";
  else if (hasAnyTotal && anyIncomplete) lvl2 = "+/-";
  else {
    const explainLen = (f.palExplain || "").trim().length;
    lvl2 = explainLen >= 120 ? "++" : "+";
  }

  const item2: RubricItem = {
    key: "met",
    title: "MET-minuten en totaal",
    level: lvl2,
    color: rubricColors[lvl2],
    description: levelText(
      lvl2,
      "MET-minuten/totaal ontbreekt (of alles is 0).",
      "Totaal is er, maar er zijn activiteiten zonder duur/MET.",
      "Totaal correct en alle activiteiten zijn volledig.",
      "Totaal correct én je maakt een korte conclusie/interpretatie."
    ),
    autoFeedback:
      lvl2 === "++"
        ? "Mooi: je MET-totaal klopt én je interpreteert het."
        : lvl2 === "+"
        ? "Goed: je MET-log is volledig."
        : lvl2 === "+/-"
        ? "Maak alle rijen volledig (activiteit + duur + MET)."
        : "Vul activiteiten in zodat je MET-totaal niet 0 is.",
  };

  // C3 PAL + uitleg
  const hasPal = Boolean(f.pal);
  const palLen = (f.palExplain || "").trim().length;

  let lvl3: RubricLevel = "-";
  if (!hasPal) lvl3 = "-";
  else if (palLen < 60) lvl3 = "+/-";
  else if (palLen >= 120 && hasActionKeyword(f.palExplain)) lvl3 = "++";
  else lvl3 = "+";

  const item3: RubricItem = {
    key: "pal",
    title: "PAL-inschatting + uitleg",
    level: lvl3,
    color: rubricColors[lvl3],
    description: levelText(
      lvl3,
      "PAL niet gekozen.",
      "PAL gekozen maar uitleg ontbreekt of is te vaag.",
      "PAL gekozen + duidelijke uitlegzin gekoppeld aan de dag.",
      "PAL gekozen + uitleg én 1 concrete aanpassing/actie."
    ),
    autoFeedback:
      lvl3 === "++"
        ? "Sterk: je verklaart PAL én formuleert een actie."
        : lvl3 === "+"
        ? "Goed: je PAL-uitleg is duidelijk."
        : lvl3 === "+/-"
        ? "Schrijf een duidelijkere uitlegzin (waarom laag/matig/actief?)."
        : "Kies laag/matig/actief en schrijf waarom.",
  };

  // C4 voeding
  const pre = (f.preFood || "").trim();
  const post = (f.postFood || "").trim();
  const protein = f.proteinAfter;
  const example = (f.proteinExample || "").trim();

  let lvl4: RubricLevel = "-";
  const prepostLen = (pre + " " + post).trim().length;

  if (!pre || !post) lvl4 = "-";
  else if (prepostLen < 80 || !protein) lvl4 = "+/-";
  else if (protein && protein !== "" && example) {
    const hasWhy = (pre + " " + post).toLowerCase().includes("omdat") || (pre + " " + post).toLowerCase().includes("zodat") || (pre + " " + post).toLowerCase().includes("daarom");
    lvl4 = hasWhy ? "++" : "+";
  } else {
    lvl4 = "+/-";
  }

  const item4: RubricItem = {
    key: "voeding",
    title: "Voeding (pre/post + eiwitcheck)",
    level: lvl4,
    color: rubricColors[lvl4],
    description: levelText(
      lvl4,
      "Pre/post niet ingevuld.",
      "Pre/post te beperkt of eiwitcheck ontbreekt.",
      "Pre + post ingevuld én eiwitcheck ja/nee + voorbeeld.",
      "Alles ingevuld én je motiveert je keuze (omdat/zodat/daarom)."
    ),
    autoFeedback:
      lvl4 === "++"
        ? "Heel goed: voeding ingevuld én gemotiveerd."
        : lvl4 === "+"
        ? "Goed: voeding + eiwitcheck zijn in orde."
        : lvl4 === "+/-"
        ? "Vul pre + post concreter in en zet eiwit ja/nee + voorbeeld."
        : "Vul zowel pre als post in.",
  };

  return { items: [item1, item2, item3, item4], totals: { metMinutesTotal: metTotal } };
}

// -------------------------
// Component
// -------------------------
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
            };

      // ✅ Pas tabelnaam aan indien nodig
      const tableName = "functional_huiswerk_submissions";

      const row = {
        user_id: uid,
        schooljaar: profiel?.schooljaar ?? null,
        klas_naam: profiel?.klas_naam ?? null,
        date: mode === "2e" ? f2.date : f3.date,
        grade: mode,
        payload,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from(tableName).insert(row);
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
      {/* Mode selector */}
      <div style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={styles.sectionTitle}>📚 Huiswerk</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Kies je graad en vul de opdracht in. Rubrics worden automatisch berekend.
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
          <ThirdGradePanel value={f3} onChange={setF3} metTotal={rub3.totals.metMinutesTotal} />
          <RubricPanel title="Rubrics (3e graad)" items={rub3.items} extraRight={`Totaal MET-minuten: ${Math.round(rub3.totals.metMinutesTotal)}`} />
        </>
      )}

      <div style={styles.actionRow}>
        <button onClick={reset} style={styles.ghostBtn}>
          Alles leegmaken
        </button>
        <button onClick={handleSave} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}>
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

function RubricPanel({ title, items, extraRight }: { title: string; items: RubricItem[]; extraRight?: string }) {
  return (
    <div style={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
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
          <div key={it.key} style={{ ...styles.rubricCard, borderColor: ui.border, background: it.color }}>
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

// -------------------------
// 2e graad UI
// -------------------------
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
          Kies <b style={{ color: ui.text }}>Duur</b> of <b style={{ color: ui.text }}>Interval</b>. Meet <b style={{ color: ui.text }}>rust</b>,{" "}
          <b style={{ color: ui.text }}>piek</b> en <b style={{ color: ui.text }}>herstel (na 1 min)</b>. Gebruik de praattest tijdens de kern.
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Datum</div>
            <input value={value.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} placeholder="YYYY-MM-DD" />
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
            <input value={value.hrRest} onChange={(e) => set({ hrRest: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 62" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Hoogste hartslag (bpm)</div>
            <input value={value.hrPeak} onChange={(e) => set({ hrPeak: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 178" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Herstel na 1 min (bpm)</div>
            <input value={value.hrRec1} onChange={(e) => set({ hrRec1: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 155" />
          </div>

          <div style={{ ...styles.small, marginTop: 10 }}>
            Meet rustig, noteer eerlijk. De app checkt enkel logica (piek hoger dan rust, herstel lager dan piek).
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
            <input value={value.rpe} onChange={(e) => set({ rpe: e.target.value })} style={styles.input} inputMode="numeric" placeholder="bv. 7" />
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={styles.sectionTitle}>7) Optioneel — krachtcircuit</div>
            <div style={{ ...styles.small, marginTop: 6 }}>Alleen invullen als je het effectief gedaan hebt (niet beoordeeld in rubrics).</div>
          </div>
          <div style={styles.pill}>OPTIONEEL</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center", color: ui.text, fontWeight: 950 }}>
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

// -------------------------
// 3e graad UI
// -------------------------
function ThirdGradePanel({
  value,
  onChange,
  metTotal,
}: {
  value: ThirdGradeForm;
  onChange: (next: ThirdGradeForm) => void;
  metTotal: number;
}) {
  const set = (patch: Partial<ThirdGradeForm>) => onChange({ ...value, ...patch });

  const updateRow = (id: string, patch: Partial<ActivityRow>) => {
    const next = value.activities.map((r) => (r.id === id ? { ...r, ...patch } : r));
    set({ activities: next });
  };

  const addRow = () => {
    set({
      activities: [
        ...value.activities,
        { id: mkId(), activity: "", minutes: "", met: "" },
      ],
    });
  };

  const removeRow = (id: string) => {
    // laat minstens 5 staan
    if (value.activities.length <= 5) return;
    set({ activities: value.activities.filter((r) => r.id !== id) });
  };

  return (
    <>
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>🚴 Huiswerk 3e graad — PAL + MET + voeding</div>
        <div style={{ ...styles.small, marginTop: 8 }}>
          Log 1 dag met minstens <b style={{ color: ui.text }}>5 activiteiten</b>. Kies MET per activiteit. De app telt je MET-minuten op. Vul PAL + voeding in.
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>1) Basis</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Datum</div>
            <input value={value.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} placeholder="YYYY-MM-DD" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Gewicht (kg) (optioneel)</div>
            <input value={value.weightKg} onChange={(e) => set({ weightKg: e.target.value })} style={styles.input} inputMode="decimal" placeholder="bv. 68" />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>Totaal MET-minuten (auto)</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ ...styles.pill, height: 46, borderRadius: 16, padding: "0 14px" }}>
                {Math.round(metTotal)}
              </div>
              <div style={styles.small}>Som van MET × minuten over alle activiteiten.</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>2) PAL-inschatting</div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.label}>PAL</div>
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
            <div style={styles.label}>Waarom? (min. 1 zin)</div>
            <textarea
              value={value.palExplain}
              onChange={(e) => set({ palExplain: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Ik fietste heen/terug en had training, daarom schat ik mezelf matig/actief."
            />
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={styles.sectionTitle}>3) Activiteitenlog (min. 5)</div>
            <div style={{ ...styles.small, marginTop: 6 }}>
              Kies activiteit + duur + MET. MET-minuten worden automatisch berekend.
            </div>
          </div>
          <button onClick={addRow} style={{ ...styles.ghostBtn, height: 46 }}>
            + Activiteit
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {value.activities.map((r, idx) => {
            const metMin = calcMetMinutes(r);
            const canRemove = value.activities.length > 5;
            return (
              <div key={r.id} style={{ ...styles.rubricCard, background: "rgba(0,0,0,0.22)" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 980, color: ui.text }}>
                      Activiteit {idx + 1}
                    </div>
                    <button
                      onClick={() => removeRow(r.id)}
                      disabled={!canRemove}
                      style={{ ...styles.ghostBtn, height: 38, opacity: canRemove ? 1 : 0.5 }}
                      title={canRemove ? "Verwijderen" : "Minstens 5 activiteiten verplicht"}
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

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={styles.small}>
                      MET-minuten (auto): <b style={{ color: ui.text }}>{Math.round(metMin)}</b>
                    </div>
                    <div style={styles.small}>
                      Tip: neem ook een “laag actief” blok mee (zitten/schoolwerk).
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.sectionTitle}>4) Voeding</div>

        <div className="row2" style={{ ...styles.row2, marginTop: 12 }}>
          <div>
            <div style={styles.label}>Voor activiteit (pre)</div>
            <textarea
              value={value.preFood}
              onChange={(e) => set({ preFood: e.target.value })}
              style={styles.textarea}
              placeholder="bv. banaan + water"
            />
          </div>

          <div>
            <div style={styles.label}>Na activiteit (post)</div>
            <textarea
              value={value.postFood}
              onChange={(e) => set({ postFood: e.target.value })}
              style={styles.textarea}
              placeholder="bv. brood + kip / yoghurt"
            />
          </div>
        </div>

        <div className="row3" style={{ ...styles.row3, marginTop: 12 }}>
          <div>
            <div style={styles.label}>Eiwit na activiteit?</div>
            <select
              value={value.proteinAfter}
              onChange={(e) => set({ proteinAfter: e.target.value as any })}
              style={{ ...styles.input, marginTop: 10 }}
            >
              <option value="">Kies…</option>
              <option value="ja">Ja</option>
              <option value="nee">Nee</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 2" as any }}>
            <div style={styles.label}>Voorbeeld eiwitbron (indien ja)</div>
            <input
              value={value.proteinExample}
              onChange={(e) => set({ proteinExample: e.target.value })}
              style={styles.input}
              placeholder="bv. yoghurt, kip, eieren, melk, tofu…"
            />
          </div>
        </div>

        <div style={{ ...styles.small, marginTop: 10 }}>
          Hou het simpel: pre = energie/vocht, post = herstel + (liefst) eiwitbron.
        </div>
      </div>
    </>
  );
}
