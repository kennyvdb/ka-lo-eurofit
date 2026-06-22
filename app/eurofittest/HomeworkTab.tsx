"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type RubricLevel = "-" | "+/-" | "+" | "++";

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

type Form = {
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

function initForm(): Form {
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

function buildPrompt(f: Form) {
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

function rubrics(f: Form): RubricItem[] {
  let lvl1: RubricLevel = "-";
  if (!f.strength || !f.weakness) lvl1 = "-";
  else if (f.strength === f.weakness) lvl1 = "+/-";
  else if (countWords(f.reason) >= 35 && hasAny(f.reason, ["score", "norm", "percentiel", "resultaat", "eurofit", "meting"])) lvl1 = "++";
  else lvl1 = "+";

  let lvl2: RubricLevel = "-";
  const smart = f.smartGoal;
  const smartHits = [
    hasAny(smart, ["verbeter", "verhogen", "verlagen", "sneller", "langer", "meer"]),
    hasAny(smart, ["cm", "sec", "kg", "aantal", "stage", "%", "minuten"]),
    hasAny(smart, ["4 weken", "weken", "tegen", "datum"]),
    countWords(smart) >= 20,
  ].filter(Boolean).length;

  if (!f.chosenAspect || !smart.trim()) lvl2 = "-";
  else if (smartHits <= 1) lvl2 = "+/-";
  else if (smartHits >= 4) lvl2 = "++";
  else lvl2 = "+";

  let lvl3: RubricLevel = "-";
  const prompt = f.aiPrompt;
  const promptHits = [
    hasAny(prompt, ["4 weken", "schema", "trainingsschema"]),
    hasAny(prompt, ["opwarming", "cooling-down", "kern"]),
    hasAny(prompt, ["overload", "progressief", "specificiteit", "herstel", "individualisatie"]),
    hasAny(prompt, ["intensiteit", "rust", "duur", "frequentie"]),
  ].filter(Boolean).length;

  if (!prompt.trim()) lvl3 = "-";
  else if (promptHits <= 1) lvl3 = "+/-";
  else if (promptHits >= 4 && countWords(prompt) >= 60) lvl3 = "++";
  else lvl3 = "+";

  let lvl4: RubricLevel = "-";
  const schema = f.aiSchema + " " + f.trainingPrinciples;
  const schemaHits = [
    hasAny(schema, ["week 1", "week 2", "week 3", "week 4"]),
    hasAny(schema, ["opwarming", "kern", "cooling"]),
    hasAny(schema, ["rust", "herstel"]),
    hasAny(schema, ["progress", "opbouw", "zwaarder", "meer"]),
    hasAny(schema, ["specificiteit", "overload", "individualisatie"]),
  ].filter(Boolean).length;

  if (!f.aiSchema.trim()) lvl4 = "-";
  else if (schemaHits <= 2) lvl4 = "+/-";
  else if (schemaHits >= 5 && countWords(f.trainingPrinciples) >= 35) lvl4 = "++";
  else lvl4 = "+";

  let lvl5: RubricLevel = "-";
  const refl = f.reflection;
  if (!refl.trim()) lvl5 = "-";
  else if (countWords(refl) < 30) lvl5 = "+/-";
  else if (countWords(refl) >= 70 && hasAny(refl, ["haalbaar", "aanpassen", "meten", "volhouden", "blessure", "planning"])) lvl5 = "++";
  else lvl5 = "+";

  return [
    {
      key: "analyse",
      title: "Eigen fitheidsanalyse",
      level: lvl1,
      color: rubricColors[lvl1],
      description: levelText(
        lvl1,
        "Sterkte en/of zwakte ontbreken.",
        "Sterkte en zwakte zijn ingevuld, maar niet logisch onderscheiden.",
        "Sterkte en zwakte zijn duidelijk gekozen.",
        "Sterkte en zwakte zijn duidelijk gekozen én gekoppeld aan Eurofit-resultaten of normen."
      ),
      autoFeedback: levelText(
        lvl1,
        "Kies één sterkte en één zwakte.",
        "Kies twee verschillende aspecten en leg kort uit waarom.",
        "Goed: je analyse is duidelijk.",
        "Sterk: je koppelt je keuzes aan je eigen metingen."
      ),
    },
    {
      key: "smart",
      title: "SMART-doel",
      level: lvl2,
      color: rubricColors[lvl2],
      description: levelText(
        lvl2,
        "Het doel ontbreekt of is niet concreet.",
        "Het doel is aanwezig, maar nog te vaag.",
        "Het doel is duidelijk en grotendeels SMART.",
        "Het doel is specifiek, meetbaar, haalbaar, relevant en tijdsgebonden."
      ),
      autoFeedback: levelText(
        lvl2,
        "Formuleer een concreet doel.",
        "Maak je doel meetbaar en zet er een termijn op.",
        "Goed doel. Maak het eventueel nog meetbaarder.",
        "Uitstekend SMART-doel."
      ),
    },
    {
      key: "prompt",
      title: "AI-promptkwaliteit",
      level: lvl3,
      color: rubricColors[lvl3],
      description: levelText(
        lvl3,
        "De prompt ontbreekt.",
        "De prompt is te algemeen.",
        "De prompt bevat voldoende informatie om een bruikbaar schema te krijgen.",
        "De prompt is zeer volledig en vraagt expliciet naar trainingsprincipes, opbouw en evaluatie."
      ),
      autoFeedback: levelText(
        lvl3,
        "Maak eerst een prompt voor ChatGPT.",
        "Voeg meer voorwaarden toe: weken, intensiteit, rust, opwarming en doel.",
        "Goede prompt.",
        "Zeer sterke prompt."
      ),
    },
    {
      key: "schema",
      title: "Trainingsschema en trainingsleer",
      level: lvl4,
      color: rubricColors[lvl4],
      description: levelText(
        lvl4,
        "Het schema ontbreekt.",
        "Het schema is aanwezig, maar mist structuur of trainingsprincipes.",
        "Het schema is bruikbaar en bevat een duidelijke opbouw.",
        "Het schema is goed opgebouwd en past meerdere trainingsprincipes correct toe."
      ),
      autoFeedback: levelText(
        lvl4,
        "Plak je AI-schema in het vak.",
        "Controleer of weekopbouw, rust en intensiteit duidelijk zijn.",
        "Goed schema. Voeg nog explicieter trainingsprincipes toe.",
        "Sterk schema met goede trainingsleer."
      ),
    },
    {
      key: "reflectie",
      title: "Reflectie op haalbaarheid",
      level: lvl5,
      color: rubricColors[lvl5],
      description: levelText(
        lvl5,
        "Reflectie ontbreekt.",
        "Reflectie is te kort.",
        "Reflectie toont dat je nadenkt over haalbaarheid.",
        "Sterke reflectie: haalbaarheid, meten, planning en bijsturen komen aan bod."
      ),
      autoFeedback: levelText(
        lvl5,
        "Schrijf een korte reflectie.",
        "Schrijf uitgebreider: wat is haalbaar en wat kan moeilijk zijn?",
        "Goede reflectie.",
        "Uitstekende reflectie."
      ),
    },
  ];
}

export default function HomeworkTab({ uid, profiel, scores, beoordelingen }: Props) {
  const [form, setForm] = useState<Form>(() => initForm());
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => rubrics(form), [form]);
  const suggestedPrompt = useMemo(() => buildPrompt(form), [form]);

  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleUsePrompt = () => {
    set({ aiPrompt: suggestedPrompt });
  };

  const handleSave = async () => {
    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      const row = {
        user_id: uid,
        schooljaar: profiel?.schooljaar ?? null,
        klas_naam: profiel?.klas_naam ?? null,
        date: form.date,
        grade: "3e",
        payload: {
          form,
          rubrics: items,
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
        <div style={styles.title}>📚 Huiswerk Eurofit — 3e graad</div>
        <div style={styles.small}>
          Doel: je herkent je eigen wijzigingen in fitheid, kiest één sterkte en één werkpunt, en maakt met AI een haalbaar trainingsschema.
        </div>
      </div>

      {error && <div style={styles.errorBox}><b>Oeps:</b> {error}</div>}
      {info && <div style={styles.okBox}><b>Info:</b> {info}</div>}

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.title}>1) Analyseer je fitheid</div>

          <Field label="Datum">
            <input value={form.date} onChange={(e) => set({ date: e.target.value })} style={styles.input} />
          </Field>

          <Field label="Mijn sterkte">
            <select value={form.strength} onChange={(e) => set({ strength: e.target.value as Aspect })} style={styles.input}>
              <option value="">Kies…</option>
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>

          <Field label="Mijn zwakte / werkpunt">
            <select value={form.weakness} onChange={(e) => set({ weakness: e.target.value as Aspect })} style={styles.input}>
              <option value="">Kies…</option>
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
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
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
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
        <div style={styles.small}>Gebruik deze knop als hulp. Kopieer de prompt naar ChatGPT en plak daarna je trainingsschema hieronder.</div>

        <button onClick={handleUsePrompt} style={{ ...styles.ghostBtn, marginTop: 12 }}>
          Genereer voorbeeldprompt
        </button>

        <Field label="Mijn AI-prompt">
          <textarea value={form.aiPrompt} onChange={(e) => set({ aiPrompt: e.target.value })} style={{ ...styles.textarea, minHeight: 180 }} />
        </Field>
      </div>

      <div className="row2" style={styles.row2}>
        <div style={styles.panel}>
          <div style={styles.title}>4) Trainingsschema</div>
          <Field label="Plak hier je AI-trainingsschema">
            <textarea value={form.aiSchema} onChange={(e) => set({ aiSchema: e.target.value })} style={{ ...styles.textarea, minHeight: 220 }} />
          </Field>
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>5) Trainingsprincipes</div>
          <Field label="Leg uit hoe je schema deze principes gebruikt: overload, progressieve opbouw, specificiteit, herstel en individualisatie.">
            <textarea value={form.trainingPrinciples} onChange={(e) => set({ trainingPrinciples: e.target.value })} style={{ ...styles.textarea, minHeight: 220 }} />
          </Field>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.title}>6) Reflectie</div>
        <Field label="Is dit schema haalbaar voor jou? Hoe ga je je vooruitgang meten? Wat doe je als het te zwaar of te licht is?">
          <textarea value={form.reflection} onChange={(e) => set({ reflection: e.target.value })} style={styles.textarea} />
        </Field>
      </div>

      <RubricPanel items={items} />

      <div style={styles.actionRow}>
        <button onClick={() => setForm(initForm())} style={styles.ghostBtn}>Alles leegmaken</button>
        <button onClick={handleSave} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

function RubricPanel({ items }: { items: RubricItem[] }) {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>🎯 Automatische rubrics</div>
      <div style={styles.small}>Score: - / +/- / + / ++</div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div key={it.key} style={{ ...styles.rubricCard, background: it.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 980, color: ui.text }}>{it.title}</div>
                <div style={{ ...styles.small, marginTop: 6 }}>{it.description}</div>
                <div style={{ ...styles.small, marginTop: 8 }}>
                  <b style={{ color: ui.text }}>Auto-feedback:</b> {it.autoFeedback}
                </div>
              </div>
              <div style={styles.badge}>{it.level}</div>
            </div>
          </div>
        ))}
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