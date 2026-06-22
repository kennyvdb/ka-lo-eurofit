"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type RubricLevel = "-" | "+/-" | "+" | "++";
type GradeMode = "2e" | "3e";

type ProfielLite = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
};

type Beoordeling = {
  label: string;
  kleur: string;
} | null;

type Props = {
  uid: string;
  profiel: ProfielLite | null;
  scores: Record<string, string>;
  beoordelingen: Record<string, Beoordeling>;
};

type Aspect = "Kracht" | "Lenigheid" | "Snelheid" | "Uithouding" | "Evenwicht" | "";

type SecondGradeForm = {
  date: string;
  strength1: string;
  strength2: string;
  weakness1: string;
  weakness2: string;
  conclusion: string;
};

type ThirdGradeForm = {
  date: string;
  strength: Aspect;
  weakness: Aspect;
  chosenAspect: Aspect;
  sportContext: string;
  reason: string;
  smartGoal: string;
  aiPrompt: string;
  aiSchema: string;
  trainingPrinciples: string;
  reflection: string;
};

type RubricItem = {
  key: string;
  title: string;
  level: RubricLevel;
  color: string;
  description: string;
  autoFeedback: string;
};

const ASPECTS: Aspect[] = ["Kracht", "Lenigheid", "Snelheid", "Uithouding", "Evenwicht"];

const OLD_SECOND_GRADE_CONCLUSION =
  "Mijn Eurofitresultaten tonen waar ik sterker en minder sterk in ben. Ik probeer mijn scores te verklaren door te kijken naar mijn sport, inzet, ervaring, lichaamsbouw, techniek en wat ik vaak of minder vaak oefen.";

const EUROFIT_TEST_LABELS: Record<string, string> = {
  flamingo: "Flamingo balans",
  plate_tapping: "Plate tapping",
  sit_and_reach: "Sit & reach",
  standing_broad_jump: "Verspringen uit stand",
  handgrip: "Handknijpkracht",
  sit_ups: "Sit-ups (30s)",
  bent_arm_hang: "Bent-arm hang",
  agility_shuttle_run_10x5: "10×5 shuttle run",
  shuttle_run_20m: "20m shuttle run",
};

function eurofitTestLabel(key: string) {
  return EUROFIT_TEST_LABELS[key] ?? key;
}

function toYMD(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function countWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function hasAny(s: string, words: string[]) {
  const t = s.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  okBg: "rgba(37,89,113,0.14)",
  okBorder: "rgba(137,194,170,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

const rubricColors: Record<RubricLevel, string> = {
  "-": "rgba(255,85,112,0.25)",
  "+/-": "rgba(255,193,102,0.22)",
  "+": "rgba(140,255,140,0.16)",
  "++": "rgba(80,220,120,0.22)",
};

function levelText(level: RubricLevel, a: string, b: string, c: string, d: string) {
  if (level === "-") return a;
  if (level === "+/-") return b;
  if (level === "+") return c;
  return d;
}

function scoreFromLabel(label: string) {
  const t = label.toLowerCase();
  if (t.includes("zeer goed")) return 6;
  if (t === "goed" || t.includes(" goed")) return 5;
  if (t.includes("gemiddeld goed")) return 4;
  if (t.includes("gemiddeld zwak")) return 3;
  if (t === "zwak" || t.includes(" zwak")) return 2;
  if (t.includes("zeer zwak")) return 1;
  return 0;
}

function eurofitEntries(scores: Record<string, string>, beoordelingen: Record<string, Beoordeling>) {
  const fixedKeys = Object.keys(EUROFIT_TEST_LABELS);
  const extraKeys = Array.from(new Set([...Object.keys(scores || {}), ...Object.keys(beoordelingen || {})]))
    .filter((key) => !fixedKeys.includes(key));
  const keys = [...fixedKeys, ...extraKeys];

  return keys.map((key) => ({
    key,
    label: eurofitTestLabel(key),
    score: scores?.[key] ?? "",
    beoordeling: beoordelingen?.[key]?.label ?? "",
    kleur: beoordelingen?.[key]?.kleur ?? "",
    orderScore: scoreFromLabel(beoordelingen?.[key]?.label ?? ""),
  }));
}

function initSecond(scores: Record<string, string>, beoordelingen: Record<string, Beoordeling>): SecondGradeForm {
  const entries = eurofitEntries(scores, beoordelingen);
  const sorted = [...entries].sort((a, b) => b.orderScore - a.orderScore);
  const weak = [...entries].sort((a, b) => a.orderScore - b.orderScore);

  return {
    date: toYMD(),
    strength1: sorted[0]?.key ?? "",
    strength2: sorted[1]?.key ?? "",
    weakness1: weak[0]?.key ?? "",
    weakness2: weak[1]?.key ?? "",
    conclusion: "",
  };
}

function initThird(): ThirdGradeForm {
  return {
    date: toYMD(),
    strength: "",
    weakness: "",
    chosenAspect: "",
    sportContext: "",
    reason: "",
    smartGoal: "",
    aiPrompt: "",
    aiSchema: "",
    trainingPrinciples: "",
    reflection: "",
  };
}

function buildPrompt(f: ThirdGradeForm) {
  const sport = f.sportContext.trim() || "geen specifieke sport";
  return `Ik ben een leerling van de derde graad secundair onderwijs. Mijn Eurofit-werkpunt is ${f.chosenAspect || "[kies aspect]"}. Mijn sport/context is: ${sport}. Mijn doel is: ${f.smartGoal || "[vul SMART-doel in]"}.

Maak een veilig en haalbaar trainingsschema van 4 weken om mijn ${f.chosenAspect || "gekozen fitheidsaspect"} te verbeteren.

Gebruik deze voorwaarden:
- 3 trainingen per week
- per training: opwarming, kern en cooling-down
- vermeld duur, intensiteit, rust en oefeningen
- pas trainingsprincipes toe: overload, progressieve opbouw, specificiteit, herstel en individualisatie
- zorg dat het schema past bij mijn niveau als leerling
- geef aan hoe ik mijn vooruitgang kan meten
- formuleer alles duidelijk in een tabel`;
}

function rubricSecond(f: SecondGradeForm): RubricItem {
  const selected = [f.strength1, f.strength2, f.weakness1, f.weakness2].filter(Boolean);
  const uniqueSelected = new Set(selected).size;
  const allChosen = selected.length === 4;
  const hasDuplicates = allChosen && uniqueSelected < 4;
  const words = countWords(f.conclusion);
  const explainsScores = hasAny(f.conclusion, [
    "omdat",
    "daardoor",
    "verklaren",
    "score",
    "resultaat",
    "sport",
    "training",
    "oefen",
    "techniek",
    "lichaam",
    "inzet",
    "ervaring",
    "leeftijdsgenoten",
    "verbeteren",
  ]);

  let level: RubricLevel = "-";
  if (!allChosen || !f.conclusion.trim()) level = "-";
  else if (hasDuplicates || words < 35) level = "+/-";
  else if (words >= 80 && explainsScores && hasAny(f.conclusion, ["sterkte", "werkpunt", "verbeter", "volgende", "train"])) level = "++";
  else level = "+";

  return {
    key: "huiswerk_2e_eurofit",
    title: "Evaluatie huiswerk 2e graad",
    level,
    color: rubricColors[level],
    description: levelText(
      level,
      "Onvoldoende: niet alle sterktes/werkpunten zijn gekozen of het besluit ontbreekt.",
      "Bijna in orde: de keuzes zijn aanwezig, maar het besluit is te kort, dubbel gekozen of nog weinig verklarend.",
      "In orde: de leerling kiest sterktes en werkpunten en schrijft een duidelijk besluit.",
      "Zeer goed: de leerling kiest logisch, verklaart de scores en koppelt het besluit aan persoonlijke fitheid en verbetering.",
    ),
    autoFeedback: levelText(
      level,
      "Kies 2 sterktes en 2 werkpunten en schrijf een besluit.",
      "Controleer of je 4 verschillende testen koos en leg je resultaten uitgebreider uit.",
      "Goed besluit. Probeer nog concreter te verklaren waarom sommige scores sterker of zwakker zijn.",
      "Sterk besluit: je verklaart je scores en toont inzicht in je eigen fitheid.",
    ),
  };
}

function rubricThird(f: ThirdGradeForm): RubricItem {
  const analyseOk = Boolean(f.strength && f.weakness && f.strength !== f.weakness) && countWords(f.reason) >= 25;
  const smartHits = [
    hasAny(f.smartGoal, ["verbeter", "verhogen", "verlagen", "sneller", "langer", "meer"]),
    hasAny(f.smartGoal, ["cm", "sec", "kg", "aantal", "stage", "%", "minuten"]),
    hasAny(f.smartGoal, ["4 weken", "weken", "tegen", "datum"]),
    countWords(f.smartGoal) >= 20,
  ].filter(Boolean).length;
  const promptHits = [
    hasAny(f.aiPrompt, ["4 weken", "schema", "trainingsschema"]),
    hasAny(f.aiPrompt, ["opwarming", "cooling-down", "kern"]),
    hasAny(f.aiPrompt, ["overload", "progressief", "specificiteit", "herstel", "individualisatie"]),
    hasAny(f.aiPrompt, ["intensiteit", "rust", "duur", "frequentie"]),
  ].filter(Boolean).length;
  const schemaText = f.aiSchema + " " + f.trainingPrinciples;
  const schemaHits = [
    hasAny(schemaText, ["week 1", "week 2", "week 3", "week 4"]),
    hasAny(schemaText, ["opwarming", "kern", "cooling"]),
    hasAny(schemaText, ["rust", "herstel"]),
    hasAny(schemaText, ["progress", "opbouw", "zwaarder", "meer"]),
    hasAny(schemaText, ["specificiteit", "overload", "individualisatie"]),
  ].filter(Boolean).length;
  const reflectionOk = countWords(f.reflection) >= 40 && hasAny(f.reflection, ["haalbaar", "aanpassen", "meten", "volhouden", "blessure", "planning"]);

  const totalChecks = [
    analyseOk,
    Boolean(f.chosenAspect),
    smartHits >= 3,
    promptHits >= 3,
    schemaHits >= 4,
    countWords(f.trainingPrinciples) >= 30,
    reflectionOk,
  ].filter(Boolean).length;

  let level: RubricLevel = "-";
  if (totalChecks <= 2) level = "-";
  else if (totalChecks <= 4) level = "+/-";
  else if (totalChecks === 7) level = "++";
  else level = "+";

  return {
    key: "huiswerk_3e_eurofit",
    title: "Evaluatie huiswerk 3e graad",
    level,
    color: rubricColors[level],
    description: levelText(
      level,
      "Onvoldoende: de opdracht mist meerdere kernonderdelen.",
      "Bijna in orde: de basis is aanwezig, maar analyse, SMART-doel, schema of reflectie zijn nog onvoldoende uitgewerkt.",
      "In orde: de opdracht is volledig genoeg en toont inzicht in fitheid, doelstelling en training.",
      "Zeer goed: de opdracht is volledig, concreet, goed opgebouwd en toont sterk inzicht in trainingsprincipes en haalbaarheid.",
    ),
    autoFeedback: levelText(
      level,
      "Werk de analyse, het SMART-doel, het schema en de reflectie verder uit.",
      "Je bent goed gestart. Maak je doel meetbaar en zorg dat je schema duidelijk weekopbouw, rust en intensiteit bevat.",
      "Goed werk. Voeg nog meer diepgang toe aan trainingsprincipes of reflectie voor ++.",
      "Uitstekend: je koppelt resultaten, doel, schema, trainingsleer en reflectie sterk aan elkaar.",
    ),
  };
}

export default function HomeworkTab({ uid, profiel, scores, beoordelingen }: Props) {
  const [mode, setMode] = useState<GradeMode>("2e");
  const [f2, setF2] = useState<SecondGradeForm>(() => initSecond(scores, beoordelingen));
  const [f3, setF3] = useState<ThirdGradeForm>(() => initThird());
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setF2((prev) =>
      prev.conclusion === OLD_SECOND_GRADE_CONCLUSION ? { ...prev, conclusion: "" } : prev,
    );
  }, []);

  const entries = useMemo(() => eurofitEntries(scores, beoordelingen), [scores, beoordelingen]);
  const item2 = useMemo(() => rubricSecond(f2), [f2]);
  const item3 = useMemo(() => rubricThird(f3), [f3]);
  const suggestedPrompt = useMemo(() => buildPrompt(f3), [f3]);

  const set2 = (patch: Partial<SecondGradeForm>) => setF2((prev) => ({ ...prev, ...patch }));
  const set3 = (patch: Partial<ThirdGradeForm>) => setF3((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      const isSecond = mode === "2e";
      const row = {
        user_id: uid,
        schooljaar: profiel?.schooljaar ?? null,
        klas_naam: profiel?.klas_naam ?? null,
        date: isSecond ? f2.date : f3.date,
        grade: mode,
        payload: isSecond
          ? {
              grade: "2e",
              form: f2,
              rubric: item2,
              eurofit_scores: scores,
              eurofit_beoordelingen: beoordelingen,
            }
          : {
              grade: "3e",
              form: f3,
              rubric: item3,
              eurofit_scores: scores,
              eurofit_beoordelingen: beoordelingen,
            },
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("eurofit_huiswerk_submissions").insert(row);
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
            alignItems: "center",
          }}
        >
          <div>
            <div style={styles.title}>📚 Huiswerk</div>
            <div style={styles.small}>
              Kies je graad en vul de opdracht in. De app berekent automatisch één rubric.
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
          <SecondGradePanel form={f2} set={set2} entries={entries} />
          <RubricPanel item={item2} />
        </>
      ) : (
        <>
          <ThirdGradePanel
            form={f3}
            set={set3}
            suggestedPrompt={suggestedPrompt}
            onUsePrompt={() => set3({ aiPrompt: suggestedPrompt })}
          />
          <RubricPanel item={item3} />
        </>
      )}

      <div style={styles.actionRow}>
        <button
          onClick={() => {
            if (mode === "2e") setF2(initSecond(scores, beoordelingen));
            else setF3(initThird());
          }}
          style={styles.ghostBtn}
        >
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
        }
      `}</style>
    </div>
  );
}

function TestSelect({
  value,
  onChange,
  entries,
}: {
  value: string;
  onChange: (v: string) => void;
  entries: ReturnType<typeof eurofitEntries>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
      <option value="">Kies een Eurofittest…</option>
      {entries.map((e) => (
        <option key={e.key} value={e.key}>
          {e.label}
          {e.score ? ` — ${e.score}` : ""}
          {e.beoordeling ? ` — ${e.beoordeling}` : ""}
        </option>
      ))}
    </select>
  );
}

function SecondGradePanel({
  form,
  set,
  entries,
}: {
  form: SecondGradeForm;
  set: (patch: Partial<SecondGradeForm>) => void;
  entries: ReturnType<typeof eurofitEntries>;
}) {
  return (
    <>
      <div style={styles.panel}>
        <div style={styles.title}>📊 Mijn Eurofitresultaten</div>
        <div style={styles.small}>Deze lijst toont de testen die je kan kiezen als sterkte of werkpunt.</div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {entries.length === 0 ? (
            <div style={styles.small}>Nog geen Eurofitresultaten gevonden.</div>
          ) : (
            entries.map((e) => (
              <div key={e.key} style={styles.resultRow}>
                <div style={{ fontWeight: 950, color: ui.text }}>{e.label}</div>
                <div style={styles.small}>Score: {e.score || "—"}</div>
                <div style={styles.badge}>{e.beoordeling || "Geen norm"}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.title}>1) Kies je sterktes en werkpunten</div>

          <Field label="Datum">
            <input value={form.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} />
          </Field>

          <Field label="Sterkte 1">
            <TestSelect value={form.strength1} onChange={(v) => set({ strength1: v })} entries={entries} />
          </Field>

          <Field label="Sterkte 2">
            <TestSelect value={form.strength2} onChange={(v) => set({ strength2: v })} entries={entries} />
          </Field>

          <Field label="Werkpunt 1">
            <TestSelect value={form.weakness1} onChange={(v) => set({ weakness1: v })} entries={entries} />
          </Field>

          <Field label="Werkpunt 2">
            <TestSelect value={form.weakness2} onChange={(v) => set({ weakness2: v })} entries={entries} />
          </Field>
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>2) Besluit</div>
          <div style={styles.small}>
            Schrijf een besluit over je gekozen sterktes en werkpunten. Kan je je scores verklaren?
            Denk aan je sport, training, techniek, inzet, ervaring, lichaamsbouw of wat je vaak/minder vaak oefent.
            Eindig met wat je hieruit leert over je eigen fitheid.
          </div>

          <Field label="Mijn besluit">
            <textarea
              value={form.conclusion}
              onChange={(e) => set({ conclusion: e.target.value })}
              style={{ ...styles.textarea, minHeight: 240 }}
              placeholder="Schrijf hier zelf je besluit. Verklaar je scores: waarom zijn dit jouw sterktes en werkpunten? Wat leer je over je eigen fitheid?"
            />
          </Field>
        </div>
      </div>
    </>
  );
}

function ThirdGradePanel({
  form,
  set,
  suggestedPrompt,
  onUsePrompt,
}: {
  form: ThirdGradeForm;
  set: (patch: Partial<ThirdGradeForm>) => void;
  suggestedPrompt: string;
  onUsePrompt: () => void;
}) {
  return (
    <>
      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.title}>1) Analyseer je fitheid</div>

          <Field label="Datum">
            <input value={form.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} />
          </Field>

          <Field label="Mijn sterkte">
            <select value={form.strength} onChange={(e) => set({ strength: e.target.value as Aspect })} style={styles.input}>
              <option value="">Kies…</option>
              {ASPECTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mijn zwakte / werkpunt">
            <select value={form.weakness} onChange={(e) => set({ weakness: e.target.value as Aspect })} style={styles.input}>
              <option value="">Kies…</option>
              {ASPECTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Waarom kies je dit? Verwijs naar je Eurofit-resultaten.">
            <textarea value={form.reason} onChange={(e) => set({ reason: e.target.value })} style={styles.textarea} />
          </Field>
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>2) Kies je trainingsdoel</div>

          <Field label="Welk aspect wil je verbeteren?">
            <select value={form.chosenAspect} onChange={(e) => set({ chosenAspect: e.target.value as Aspect })} style={styles.input}>
              <option value="">Kies…</option>
              {ASPECTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sport/context">
            <input
              value={form.sportContext}
              onChange={(e) => set({ sportContext: e.target.value })}
              style={styles.input}
              placeholder="bv. voetbal, dans, fitness, geen sport..."
            />
          </Field>

          <Field label="SMART-doel">
            <textarea
              value={form.smartGoal}
              onChange={(e) => set({ smartGoal: e.target.value })}
              style={styles.textarea}
              placeholder="bv. Ik wil binnen 4 weken mijn 10×5 shuttle run verbeteren van 21,8 sec naar 20,8 sec door 3 keer per week snelheid en wendbaarheid te trainen."
            />
          </Field>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.title}>3) Prompt voor AI</div>
        <div style={styles.small}>
          Gebruik deze knop als hulp. Kopieer de prompt naar ChatGPT en plak daarna je trainingsschema hieronder.
        </div>

        <button onClick={onUsePrompt} style={{ ...styles.ghostBtn, marginTop: 12 }}>
          Genereer voorbeeldprompt
        </button>

        <Field label="Mijn AI-prompt">
          <textarea
            value={form.aiPrompt}
            onChange={(e) => set({ aiPrompt: e.target.value })}
            style={{ ...styles.textarea, minHeight: 180 }}
          />
        </Field>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.title}>4) Trainingsschema</div>
          <Field label="Plak hier je AI-trainingsschema">
            <textarea
              value={form.aiSchema}
              onChange={(e) => set({ aiSchema: e.target.value })}
              style={{ ...styles.textarea, minHeight: 220 }}
            />
          </Field>
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>5) Trainingsprincipes</div>
          <Field label="Leg uit hoe je schema deze principes gebruikt: overload, progressieve opbouw, specificiteit, herstel en individualisatie.">
            <textarea
              value={form.trainingPrinciples}
              onChange={(e) => set({ trainingPrinciples: e.target.value })}
              style={{ ...styles.textarea, minHeight: 220 }}
            />
          </Field>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.title}>6) Reflectie</div>
        <Field label="Is dit schema haalbaar voor jou? Hoe ga je je vooruitgang meten? Wat doe je als het te zwaar of te licht is?">
          <textarea value={form.reflection} onChange={(e) => set({ reflection: e.target.value })} style={styles.textarea} />
        </Field>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

function RubricPanel({ item }: { item: RubricItem }) {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>🎯 Automatische evaluatie</div>
      <div style={styles.small}>Eén rubric-score: - / +/- / + / ++</div>

      <div style={{ ...styles.rubricCard, background: item.color, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 980, color: ui.text }}>{item.title}</div>
            <div style={{ ...styles.small, marginTop: 6 }}>{item.description}</div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              <b style={{ color: ui.text }}>Auto-feedback:</b> {item.autoFeedback}
            </div>
          </div>
          <div style={styles.badge}>{item.level}</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  title: {
    fontSize: 14,
    fontWeight: 980,
    color: ui.text,
  },
  small: {
    marginTop: 6,
    fontSize: 12.5,
    color: ui.muted,
    lineHeight: 1.45,
  },
  row2: {
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
    minHeight: 110,
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
  ghostBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
  },
  primaryBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "linear-gradient(90deg, rgba(37,89,113,0.45), rgba(75,142,141,0.35)), rgba(0,0,0,0.70)",
    color: ui.text,
    fontWeight: 980,
    cursor: "pointer",
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  rubricCard: {
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
  },
  badge: {
    minWidth: 64,
    height: 34,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 980,
    color: ui.text,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
  },
  pill: {
    minWidth: 88,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 980,
    color: ui.text,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
  },
  resultRow: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 1fr) minmax(100px, 0.7fr) auto",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.22)",
  },
  okBox: {
    padding: 12,
    borderRadius: 18,
    background: ui.okBg,
    border: `1px solid ${ui.okBorder}`,
    color: ui.text,
  },
  errorBox: {
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
  },
};
