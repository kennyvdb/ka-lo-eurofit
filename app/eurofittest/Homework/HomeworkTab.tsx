"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BeoordelingLabel =
  | "Zeer zwak"
  | "Zwak"
  | "Gemiddeld zwak"
  | "Gemiddeld goed"
  | "Goed"
  | "Zeer goed";

type HomeworkRow = {
  testType: string;
  label: string;
  icon: string;
  eenheid: string;
  waarde: number;
  date: string;
  evaluation: BeoordelingLabel | null;
  previousValue: number | null;
  diffText: string | null;
  diffBetter: boolean | null;
};

type Props = {
  uid: string;
  volledigeNaam?: string | null;
  klasNaam?: string | null;
  schooljaar?: string | null;
  rows: HomeworkRow[];
};

type GradeMode = "2e" | "3e";

type SecondGradeForm = {
  titel: string;
  datum: string;
  sterkte1: string;
  sterkte2: string;
  werkpunt1: string;
  werkpunt2: string;
  vergelijkingTekst: string;
  besluitTekst: string;
  actieTekst: string;
};

type SmartPlan = {
  testLabel: string;
  beginsituatie: string;
  doelNa6Weken: string;
  specifiek: string;
  meetbaar: string;
  acceptabel: string;
  realistisch: string;
  tijdsgebonden: string;
  week1: string;
  week2: string;
  week3: string;
  week4: string;
  week5: string;
  week6: string;
};

type ThirdGradeForm = {
  titel: string;
  datum: string;
  plan1: SmartPlan;
  plan2: SmartPlan;
  evaluatie: string;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.94)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.56)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  okBg: "rgba(137,194,170,0.12)",
  okBorder: "rgba(137,194,170,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
};

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function scoreFromEvaluation(label: BeoordelingLabel | null) {
  switch (label) {
    case "Zeer goed":
      return 6;
    case "Goed":
      return 5;
    case "Gemiddeld goed":
      return 4;
    case "Gemiddeld zwak":
      return 3;
    case "Zwak":
      return 2;
    case "Zeer zwak":
      return 1;
    default:
      return 0;
  }
}

function initPlan(testLabel = ""): SmartPlan {
  return {
    testLabel,
    beginsituatie: "",
    doelNa6Weken: "",
    specifiek: "",
    meetbaar: "",
    acceptabel: "",
    realistisch: "",
    tijdsgebonden: "",
    week1: "",
    week2: "",
    week3: "",
    week4: "",
    week5: "",
    week6: "",
  };
}

function initSecond(rows: HomeworkRow[]): SecondGradeForm {
  const sorted = [...rows].sort(
    (a, b) => scoreFromEvaluation(b.evaluation) - scoreFromEvaluation(a.evaluation)
  );
  const strengths = sorted.filter((r) => scoreFromEvaluation(r.evaluation) >= 4);
  const weaknesses = [...sorted].reverse().filter((r) => scoreFromEvaluation(r.evaluation) <= 3);

  return {
    titel: "Eurofit-huiswerk 2e graad",
    datum: toYMD(),
    sterkte1: strengths[0]?.label ?? "",
    sterkte2: strengths[1]?.label ?? "",
    werkpunt1: weaknesses[0]?.label ?? "",
    werkpunt2: weaknesses[1]?.label ?? "",
    vergelijkingTekst:
      "Mijn resultaten tonen dat ik op sommige onderdelen beter scoor dan leeftijdsgenoten en op andere onderdelen nog groeikansen heb. Vooral mijn sterktes vallen op, maar ik zie ook duidelijke werkpunten.",
    besluitTekst:
      "Mijn belangrijkste sterktes zijn conditie en kracht. Mijn zwaktes liggen eerder bij lenigheid en snelheid. Daardoor weet ik waar ik in de les en thuis extra aandacht aan moet geven.",
    actieTekst:
      "Ik wil mijn twee zwakste onderdelen verbeteren door gerichter te oefenen. Ik kies oefeningen die haalbaar zijn en ik probeer die wekelijks toe te passen.",
  };
}

function initThird(rows: HomeworkRow[]): ThirdGradeForm {
  const weakest = [...rows]
    .filter((r) => r.evaluation)
    .sort((a, b) => scoreFromEvaluation(a.evaluation) - scoreFromEvaluation(b.evaluation))
    .slice(0, 2);

  return {
    titel: "Eurofit-huiswerk 3e graad",
    datum: toYMD(),
    plan1: initPlan(weakest[0]?.label ?? ""),
    plan2: initPlan(weakest[1]?.label ?? ""),
    evaluatie:
      "Na 6 weken vergelijk ik mijn nieuwe resultaat met mijn beginsituatie. Ik kijk of mijn doel gehaald is en welke oefeningen het meest effect hadden.",
  };
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
  },
  panelSoft: {
    padding: 16,
    borderRadius: 20,
    background: "rgba(0,0,0,0.22)",
    border: `1px solid ${ui.border}`,
  },
  title: {
    fontSize: 14,
    fontWeight: 980,
    color: ui.text,
    letterSpacing: 0.3,
  },
  small: {
    fontSize: 12.8,
    color: ui.muted,
    lineHeight: 1.45,
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(7,10,14,0.38)",
    color: ui.text,
    padding: "0 14px",
    outline: "none",
    fontWeight: 900,
  },
  textarea: {
    width: "100%",
    minHeight: 104,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(7,10,14,0.38)",
    color: ui.text,
    padding: "12px 14px",
    outline: "none",
    fontWeight: 800,
    resize: "vertical",
    lineHeight: 1.45,
  },
  label: {
    fontSize: 12,
    fontWeight: 950,
    color: ui.muted,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  tabBtn: {
    height: 48,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    background: "rgba(0,0,0,0.26)",
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
  primaryBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: `linear-gradient(90deg, rgba(37,89,113,0.50), rgba(75,142,141,0.34), rgba(137,194,170,0.26)), rgba(0,0,0,0.72)`,
    color: ui.text,
    fontWeight: 980,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  okBox: {
    padding: 12,
    borderRadius: 18,
    background: ui.okBg,
    border: `1px solid ${ui.okBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  errorBox: {
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  rowGrid2: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
  },
  rowGrid3: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12.5,
    color: ui.text,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.34)",
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
};

function EvalBadge({ label }: { label: BeoordelingLabel | null }) {
  const bg =
    label === "Zeer goed"
      ? "#0f5a2f"
      : label === "Goed"
      ? "#2e8b57"
      : label === "Gemiddeld goed"
      ? "#3f7f65"
      : label === "Gemiddeld zwak"
      ? "#8d7a33"
      : label === "Zwak"
      ? "#c06a00"
      : label === "Zeer zwak"
      ? "#7a0000"
      : "rgba(255,255,255,0.16)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 950,
        fontSize: 12.5,
        color: "#fff",
        background: bg,
      }}
    >
      {label ?? "Geen norm"}
    </span>
  );
}

function GradeTabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabBtn,
        background: active
          ? "linear-gradient(90deg, rgba(37,89,113,0.35), rgba(75,142,141,0.22)), rgba(0,0,0,0.52)"
          : "rgba(0,0,0,0.24)",
        borderColor: active ? ui.border2 : ui.border,
      }}
    >
      {children}
    </button>
  );
}

function ResultOverview({ rows }: { rows: HomeworkRow[] }) {
  return (
    <div style={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={styles.title}>📊 Laatste Eurofitresultaten</div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Deze tabel gebruikt je recentste resultaten en beoordeling tegenover leeftijdsgenoten.
          </div>
        </div>
        <div style={styles.badge}>Leeftijdsgenoten</div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {rows.length === 0 ? (
          <div style={{ ...styles.small, color: ui.muted2 }}>Nog geen Eurofitresultaten gevonden.</div>
        ) : (
          rows.map((row) => (
            <div
              key={row.testType}
              style={{
                ...styles.panelSoft,
                display: "grid",
                gridTemplateColumns: "minmax(180px, 1.4fr) minmax(90px, 1fr) minmax(110px, 1fr)",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, color: ui.text }}>
                  {row.icon} {row.label}
                </div>
                <div style={{ ...styles.small, marginTop: 4 }}>Laatste meting: {row.date}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: ui.muted2 }}>Score</div>
                <div style={{ fontWeight: 950, color: ui.text }}>
                  {row.waarde} {row.eenheid}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <EvalBadge label={row.evaluation} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExampleCard2e() {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>🧠 Uitgewerkt voorbeeld 2e graad</div>
      <div style={{ ...styles.small, marginTop: 8 }}>
        Gebruik dit als voorbeeld van hoe een leerling zijn sterktes en zwaktes kan formuleren.
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Sterktes</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Mijn sterktes zijn <b style={{ color: ui.text }}>20m shuttle run</b> en{" "}
            <b style={{ color: ui.text }}>handknijpkracht</b>. Bij deze testen scoor ik beter dan veel
            leeftijdsgenoten. Dat toont dat mijn conditie en kracht goed ontwikkeld zijn.
          </div>
        </div>

        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Werkpunten</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Mijn werkpunten zijn <b style={{ color: ui.text }}>sit & reach</b> en{" "}
            <b style={{ color: ui.text }}>10×5 shuttle run</b>. Daar scoor ik zwakker dan leeftijdsgenoten.
            Dat betekent dat ik nog kan groeien in lenigheid en snelheid.
          </div>
        </div>

        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Besluit</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Ik ben tevreden over mijn conditie en kracht, maar ik wil mijn lenigheid en snelheid verbeteren.
            Daarom ga ik in de lessen en thuis extra aandacht geven aan stretchoefeningen en korte sprintvormen.
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleCard3e() {
  return (
    <div style={styles.panel}>
      <div style={styles.title}>🧩 Uitgewerkt voorbeeld 3e graad</div>
      <div style={{ ...styles.small, marginTop: 8 }}>
        Voorbeeld van een SMART-doel en een 6-wekenplanning voor 2 zwakke resultaten.
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Voorbeeld 1 — Sit & reach</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            <b style={{ color: ui.text }}>Specifiek:</b> ik wil mijn lenigheid verbeteren.<br />
            <b style={{ color: ui.text }}>Meetbaar:</b> ik wil van 14 cm naar 19 cm gaan.<br />
            <b style={{ color: ui.text }}>Acceptabel:</b> ik plan 3 korte sessies per week.<br />
            <b style={{ color: ui.text }}>Realistisch:</b> 5 cm winst op 6 weken is haalbaar.<br />
            <b style={{ color: ui.text }}>Tijdsgebonden:</b> ik evalueer opnieuw na 6 weken.
          </div>
        </div>

        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Voorbeeld 6-wekenplanning</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Week 1-2: 3× per week 10 min hamstring- en rugstretches.<br />
            Week 3-4: 3× per week 12 min stretches + 2 mobiliteitsoefeningen.<br />
            Week 5-6: 3× per week 15 min stretches + testmoment op het einde.
          </div>
        </div>

        <div style={styles.panelSoft}>
          <div style={{ fontWeight: 950, color: ui.text }}>Voorbeeld 2 — 10×5 shuttle run</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Doel: mijn tijd verbeteren van 23,4 sec naar 22,4 sec door 2 keer per week te werken op
            versnellen, keren en reageren. Ik doe korte sprintreeksen, wendbaarheidsoefeningen en
            startreacties.
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: SmartPlan;
  onChange: (next: SmartPlan) => void;
}) {
  const set = (patch: Partial<SmartPlan>) => onChange({ ...value, ...patch });

  return (
    <div style={styles.panel}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={styles.title}>🎯 {title}</div>
          <div style={{ ...styles.small, marginTop: 6 }}>
            Werk één zwak Eurofitonderdeel uit volgens SMART en plan 6 weken training.
          </div>
        </div>
        <div style={styles.badge}>{value.testLabel || "Kies werkpunt"}</div>
      </div>

      <div className="hw-grid-2" style={{ ...styles.rowGrid2, marginTop: 14 }}>
        <div>
          <div style={styles.label}>Test / werkpunt</div>
          <input
            value={value.testLabel}
            onChange={(e) => set({ testLabel: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="bv. Sit & reach"
          />
        </div>

        <div>
          <div style={styles.label}>Beginsituatie</div>
          <input
            value={value.beginsituatie}
            onChange={(e) => set({ beginsituatie: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="bv. 14 cm"
          />
        </div>

        <div>
          <div style={styles.label}>Doel na 6 weken</div>
          <input
            value={value.doelNa6Weken}
            onChange={(e) => set({ doelNa6Weken: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="bv. 19 cm"
          />
        </div>

        <div>
          <div style={styles.label}>Specifiek</div>
          <input
            value={value.specifiek}
            onChange={(e) => set({ specifiek: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Wat wil je exact verbeteren?"
          />
        </div>

        <div>
          <div style={styles.label}>Meetbaar</div>
          <input
            value={value.meetbaar}
            onChange={(e) => set({ meetbaar: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Hoe meet je vooruitgang?"
          />
        </div>

        <div>
          <div style={styles.label}>Acceptabel</div>
          <input
            value={value.acceptabel}
            onChange={(e) => set({ acceptabel: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Waarom is dit haalbaar voor jou?"
          />
        </div>

        <div>
          <div style={styles.label}>Realistisch</div>
          <input
            value={value.realistisch}
            onChange={(e) => set({ realistisch: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Waarom is je doel realistisch?"
          />
        </div>

        <div>
          <div style={styles.label}>Tijdsgebonden</div>
          <input
            value={value.tijdsgebonden}
            onChange={(e) => set({ tijdsgebonden: e.target.value })}
            style={{ ...styles.input, marginTop: 10 }}
            placeholder="Wanneer evalueer je?"
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={styles.label}>6-wekenplanning</div>
        <div className="hw-grid-3" style={{ ...styles.rowGrid3, marginTop: 10 }}>
          <textarea
            value={value.week1}
            onChange={(e) => set({ week1: e.target.value })}
            style={styles.textarea}
            placeholder="Week 1"
          />
          <textarea
            value={value.week2}
            onChange={(e) => set({ week2: e.target.value })}
            style={styles.textarea}
            placeholder="Week 2"
          />
          <textarea
            value={value.week3}
            onChange={(e) => set({ week3: e.target.value })}
            style={styles.textarea}
            placeholder="Week 3"
          />
          <textarea
            value={value.week4}
            onChange={(e) => set({ week4: e.target.value })}
            style={styles.textarea}
            placeholder="Week 4"
          />
          <textarea
            value={value.week5}
            onChange={(e) => set({ week5: e.target.value })}
            style={styles.textarea}
            placeholder="Week 5"
          />
          <textarea
            value={value.week6}
            onChange={(e) => set({ week6: e.target.value })}
            style={styles.textarea}
            placeholder="Week 6"
          />
        </div>
      </div>
    </div>
  );
}

export default function HomeworkTab({
  uid,
  volledigeNaam,
  klasNaam,
  schooljaar,
  rows,
}: Props) {
  const [mode, setMode] = useState<GradeMode>("2e");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [f2, setF2] = useState<SecondGradeForm>(() => initSecond(rows));
  const [f3, setF3] = useState<ThirdGradeForm>(() => initThird(rows));

  const strongestRows = useMemo(
    () =>
      [...rows]
        .filter((r) => r.evaluation)
        .sort((a, b) => scoreFromEvaluation(b.evaluation) - scoreFromEvaluation(a.evaluation))
        .slice(0, 3),
    [rows]
  );

  const weakestRows = useMemo(
    () =>
      [...rows]
        .filter((r) => r.evaluation)
        .sort((a, b) => scoreFromEvaluation(a.evaluation) - scoreFromEvaluation(b.evaluation))
        .slice(0, 3),
    [rows]
  );

  const resetCurrent = () => {
    setInfo(null);
    setError(null);
    if (mode === "2e") setF2(initSecond(rows));
    else setF3(initThird(rows));
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
              leerling: volledigeNaam ?? null,
              klasNaam: klasNaam ?? null,
              schooljaar: schooljaar ?? null,
              latestRows: rows,
              strengths: strongestRows,
              weaknesses: weakestRows,
              form: f2,
            }
          : {
              grade: "3e",
              leerling: volledigeNaam ?? null,
              klasNaam: klasNaam ?? null,
              schooljaar: schooljaar ?? null,
              latestRows: rows,
              weaknesses: weakestRows,
              form: f3,
            };

      const { error } = await supabase.from("eurofit_huiswerk_submissions").insert({
        user_id: uid,
        schooljaar: schooljaar ?? null,
        klas_naam: klasNaam ?? null,
        grade: mode,
        date: mode === "2e" ? f2.datum : f3.datum,
        payload,
      });

      if (error) throw new Error(error.message);
      setInfo("✅ Huiswerk opgeslagen.");
    } catch (e: any) {
      setError(e?.message ?? "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <div
        style={{
          ...styles.panel,
          background:
            "linear-gradient(135deg, rgba(37,89,113,0.16), rgba(75,142,141,0.10), rgba(137,194,170,0.08)), rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 980, color: ui.text }}>📚 Eurofit huiswerk</div>
            <div style={{ ...styles.small, marginTop: 8, maxWidth: 900 }}>
              <b style={{ color: ui.text }}>2e graad:</b> analyseer je Eurofitresultaten en vergelijk jezelf
              met leeftijdsgenoten via sterktes en zwaktes. <br />
              <b style={{ color: ui.text }}>3e graad:</b> werk een <b style={{ color: ui.text }}>6-weken
              trainingsprogramma</b> uit voor <b style={{ color: ui.text }}>2 zwakke resultaten</b> volgens
              het <b style={{ color: ui.text }}>SMART-principe</b>.
            </div>
          </div>

          <div style={styles.badge}>{volledigeNaam?.split(" ")[0] ?? "Leerling"}</div>
        </div>

        <div style={{ ...styles.tabs, marginTop: 16 }}>
          <GradeTabBtn active={mode === "2e"} onClick={() => setMode("2e")}>
            2e graad
          </GradeTabBtn>
          <GradeTabBtn active={mode === "3e"} onClick={() => setMode("3e")}>
            3e graad
          </GradeTabBtn>
        </div>
      </div>

      {error ? (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      {info ? (
        <div style={styles.okBox}>
          <b>Info:</b> {info}
        </div>
      ) : null}

      <ResultOverview rows={rows} />

      <div className="hw-grid-2" style={styles.rowGrid2}>
        <div style={styles.panel}>
          <div style={styles.title}>✅ Sterktes</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Beste scores tegenover leeftijdsgenoten.
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {strongestRows.map((row) => (
              <div key={row.testType} style={styles.panelSoft}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: ui.text }}>
                    {row.icon} {row.label}
                  </div>
                  <EvalBadge label={row.evaluation} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>🎯 Werkpunten</div>
          <div style={{ ...styles.small, marginTop: 8 }}>
            Zwakste scores tegenover leeftijdsgenoten.
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {weakestRows.map((row) => (
              <div key={row.testType} style={styles.panelSoft}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: ui.text }}>
                    {row.icon} {row.label}
                  </div>
                  <EvalBadge label={row.evaluation} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {mode === "2e" ? (
        <>
          <div style={styles.panel}>
            <div style={styles.title}>✍️ Huiswerk 2e graad</div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              Schrijf een korte analyse van je resultaten tegenover leeftijdsgenoten en formuleer je
              sterktes en zwaktes.
            </div>

            <div className="hw-grid-2" style={{ ...styles.rowGrid2, marginTop: 14 }}>
              <div>
                <div style={styles.label}>Titel</div>
                <input
                  value={f2.titel}
                  onChange={(e) => setF2({ ...f2, titel: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                />
              </div>

              <div>
                <div style={styles.label}>Datum</div>
                <input
                  value={f2.datum}
                  onChange={(e) => setF2({ ...f2, datum: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                />
              </div>

              <div>
                <div style={styles.label}>Sterkte 1</div>
                <input
                  value={f2.sterkte1}
                  onChange={(e) => setF2({ ...f2, sterkte1: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                  placeholder="bv. 20m shuttle run"
                />
              </div>

              <div>
                <div style={styles.label}>Sterkte 2</div>
                <input
                  value={f2.sterkte2}
                  onChange={(e) => setF2({ ...f2, sterkte2: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                  placeholder="bv. handknijpkracht"
                />
              </div>

              <div>
                <div style={styles.label}>Werkpunt 1</div>
                <input
                  value={f2.werkpunt1}
                  onChange={(e) => setF2({ ...f2, werkpunt1: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                  placeholder="bv. sit & reach"
                />
              </div>

              <div>
                <div style={styles.label}>Werkpunt 2</div>
                <input
                  value={f2.werkpunt2}
                  onChange={(e) => setF2({ ...f2, werkpunt2: e.target.value })}
                  style={{ ...styles.input, marginTop: 10 }}
                  placeholder="bv. 10×5 shuttle run"
                />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={styles.label}>Vergelijking met leeftijdsgenoten</div>
                <textarea
                  value={f2.vergelijkingTekst}
                  onChange={(e) => setF2({ ...f2, vergelijkingTekst: e.target.value })}
                  style={{ ...styles.textarea, marginTop: 10 }}
                  placeholder="Beschrijf hoe jouw resultaten zich verhouden tot leeftijdsgenoten."
                />
              </div>

              <div>
                <div style={styles.label}>Besluit: sterktes en zwaktes</div>
                <textarea
                  value={f2.besluitTekst}
                  onChange={(e) => setF2({ ...f2, besluitTekst: e.target.value })}
                  style={{ ...styles.textarea, marginTop: 10 }}
                  placeholder="Vat samen wat je belangrijkste sterktes en zwaktes zijn."
                />
              </div>

              <div>
                <div style={styles.label}>Actiepunt</div>
                <textarea
                  value={f2.actieTekst}
                  onChange={(e) => setF2({ ...f2, actieTekst: e.target.value })}
                  style={{ ...styles.textarea, marginTop: 10 }}
                  placeholder="Wat ga je doen om aan je werkpunten te werken?"
                />
              </div>
            </div>
          </div>

          <ExampleCard2e />
        </>
      ) : (
        <>
          <PlanEditor
            title="Trainingsprogramma 1"
            value={f3.plan1}
            onChange={(next) => setF3({ ...f3, plan1: next })}
          />

          <PlanEditor
            title="Trainingsprogramma 2"
            value={f3.plan2}
            onChange={(next) => setF3({ ...f3, plan2: next })}
          />

          <div style={styles.panel}>
            <div style={styles.title}>📝 Eindevaluatie</div>
            <div style={{ ...styles.small, marginTop: 8 }}>
              Beschrijf hoe je na 6 weken gaat nagaan of je doelen bereikt zijn.
            </div>
            <textarea
              value={f3.evaluatie}
              onChange={(e) => setF3({ ...f3, evaluatie: e.target.value })}
              style={{ ...styles.textarea, marginTop: 12 }}
              placeholder="Hoe evalueer je na 6 weken?"
            />
          </div>

          <ExampleCard3e />
        </>
      )}

      <div style={styles.actionRow}>
        <button onClick={resetCurrent} style={styles.ghostBtn}>
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
          .hw-grid-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .hw-grid-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}