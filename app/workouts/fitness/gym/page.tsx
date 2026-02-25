"use client";

import AppShell from "@/components/AppShell";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};
const emptyProfile: Profile = { id: "", volledige_naam: null, role: null };

const colors = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  glass: "rgba(6, 12, 20, 0.42)",
  glass2: "rgba(6, 12, 20, 0.58)",
};

type GymEx = {
  code: string;
  name: string;
  tempo?: string;
  w1?: string;
  w2?: string;
  w3?: string;
  w4?: string;
  rest?: string;
};

type Day = { title: string; exercises: GymEx[] };

const DAYS: Day[] = [
  {
    title: "Dag 1 • borst / delts / triceps",
    exercises: [
      { code: "A", name: "30° incline chest press", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Cable chest fly", tempo: "2212", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "BB bench press", tempo: "3010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
      { code: "D", name: "Seated DB shoulder press", tempo: "4010", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "DB side raises", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "Tricep dips", tempo: "6010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2–3'" },
      { code: "G", name: "Rope tricep pulldown", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
    ],
  },
  {
    title: "Dag 2 • lower body (quad dominant)",
    exercises: [
      { code: "A", name: "Leg press", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Split squat", tempo: "2212", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "Front/back squat", tempo: "3010", w1: "6+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2–3'" },
      { code: "D", name: "Romanian deadlift", tempo: "4010", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "Leg curl", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "Standing calf raise", tempo: "5010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2–3'" },
    ],
  },
  {
    title: "Dag 3 • rug / rear delts / biceps",
    exercises: [
      { code: "A", name: "Lat pulldown wide grip", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Straight arm pulldown", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "Chin ups", tempo: "3010", w1: "6+max", w2: "6+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
      { code: "D", name: "45° incline DB rows", tempo: "4010", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "Reverse DB fly’s", tempo: "2210", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "EZ bar bicep curls", tempo: "5010", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2–3'" },
      { code: "G", name: "Seated DB hammer curls", tempo: "5010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
    ],
  },
  {
    title: "Dag 4 • delts / borst / triceps",
    exercises: [
      { code: "A", name: "60° incline press", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Seated front raise", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "Military press", tempo: "3010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
      { code: "D", name: "Dips", tempo: "4010", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "DB floor flies", tempo: "2210", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "Lying DB tricep extensions", tempo: "5010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2–3'" },
      { code: "G", name: "Cable overhead tricep extensions", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
    ],
  },
  {
    title: "Dag 5 • lower body (hamstrings focus)",
    exercises: [
      { code: "A", name: "Romanian deadlift", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Lying leg curl", tempo: "2212", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "Back extension", tempo: "3010", w1: "6+max", w2: "6+max", w3: "6+max", w4: "6+max", rest: "2'" },
      { code: "D", name: "Hack squat", tempo: "4010", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "Leg extensions", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "Calf raises", tempo: "5010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2–3'" },
    ],
  },
  {
    title: "Dag 6 • rug / rear delts / biceps",
    exercises: [
      { code: "A", name: "Wide pronated seated rows", tempo: "4010", w1: "12/10/8/12+", w2: "10/8/6/10+", w3: "8/6/4/8+", w4: "12", rest: "2–3'" },
      { code: "B", name: "Face pulls", tempo: "2212", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "C", name: "Upright barbell rows", tempo: "3010", w1: "6+max", w2: "6+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
      { code: "D", name: "DB shrugs", tempo: "2012", w1: "8", w2: "10", w3: "12", w4: "8", rest: "2'" },
      { code: "E", name: "Bent over DB lateral raise", tempo: "2012", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2'" },
      { code: "F", name: "Barbell drag curls", tempo: "5010", w1: "8", w2: "8+max", w3: "8+max+max", w4: "8", rest: "2–3'" },
      { code: "G", name: "EZ bar reverse curls", tempo: "5010", w1: "6+max+max", w2: "6+max+max", w3: "6+max+max", w4: "6+max+max", rest: "2'" },
    ],
  },
];

type Week = 1 | 2 | 3 | 4;
type WeekMode = Week | "all";

function storageKey(userId: string) {
  return `fitness_gym_phase1_v5_4w_mobileonly:${userId}`;
}

export default function FitnessGymPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState<string>("");
  const [vals, setVals] = useState<Record<string, string>>({});

  const [weekMode, setWeekMode] = useState<WeekMode>("all");

  // ✅ meerdere dagen open (start met dag 1 open)
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([0]));

  // ✅ refs per dag om scroll "netjes" te houden bij openen/sluiten
  const dayRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.location.href = "/login";
        return;
      }

      const userId = authData.user.id;
      setUid(userId);
      setEmail(authData.user.email ?? "");

      const { data } = await supabase
        .from("profielen")
        .select("id, volledige_naam, role")
        .eq("id", userId)
        .maybeSingle<Profile>();

      setProfile(data ?? { ...emptyProfile, id: userId });

      try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) setVals(JSON.parse(raw));
      } catch {}

      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (!uid) return;
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify(vals));
    } catch {}
  }, [vals, uid]);

  const setVal = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const weeks = useMemo(() => [1, 2, 3, 4] as const, []);
  const visibleWeeks = useMemo<Week[]>(() => (weekMode === "all" ? [...weeks] : [weekMode]), [weekMode, weeks]);
  const weekText = (ex: GymEx, w: Week) => ((ex as any)[`w${w}`] ?? "-") as string;

  // ✅ toggle + scroll zonder vervelende sprong
  const toggleDay = (idx: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);

      requestAnimationFrame(() => {
        const el = dayRefs.current[idx];
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      return next;
    });
  };

  return (
    <AppShell title="KA LO App" subtitle="GO!Atheneum Avelgem" userName={profile.volledige_naam ?? null}>
      <style>{css}</style>

      <div style={{ maxWidth: 1100 }}>
        <div style={styles.header}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.kicker}>FITNESS @ GYM</div>
            <h1 style={{ fontSize: 24, fontWeight: 980, margin: "6px 0 0 0", color: ui.text }}>Fase 1 (Week 1–4)</h1>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              Vul je trainingsgewichten in • {email && <>ingelogd als <b>{email}</b></>}
            </div>

            <div style={styles.chipsRow}>
              <button type="button" onClick={() => setWeekMode("all")} className={`chip ${weekMode === "all" ? "chipActive" : ""}`}>
                Alles
              </button>
              {weeks.map((w) => (
                <button key={w} type="button" onClick={() => setWeekMode(w)} className={`chip ${weekMode === w ? "chipActive" : ""}`}>
                  W{w}
                </button>
              ))}
            </div>

            <div style={styles.filterHint}>
              Filter: <b style={{ color: "rgba(255,255,255,0.92)" }}>{weekMode === "all" ? "alles (W1–W4)" : `week ${weekMode}`}</b>
            </div>
          </div>

          <a href="/workouts/fitness" style={styles.backLink}>
            ← Terug
          </a>
        </div>

        {loading ? (
          <div style={{ marginTop: 12, color: ui.muted }}>Bezig met laden…</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {DAYS.map((day, dayIdx) => {
              const isOpen = openDays.has(dayIdx);

              return (
                <div
                  key={day.title}
                  style={styles.sectionCard}
                  ref={(el) => {
                    dayRefs.current[dayIdx] = el;
                  }}
                >
                  <button type="button" onClick={() => toggleDay(dayIdx)} style={styles.accordionHeader} aria-expanded={isOpen}>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.sectionTitle}>{day.title}</div>
                      <div style={styles.sectionMeta}>{weekMode === "all" ? "4 weken zichtbaar" : `Alleen week ${weekMode}`} • auto-save</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                      <span style={styles.accordionPill}>{isOpen ? "Sluiten" : "Open"}</span>
                      <span style={{ ...styles.chev, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </button>

                  {isOpen && (
                    <>
                      {/* ✅ DESKTOP: enkel tabel */}
                      <div style={{ marginTop: 10 }}>
                        <table className="fitTable">
                          <colgroup>
                            <col style={{ width: 44 }} />
                            <col />
                            <col style={{ width: 78 }} />
                            <col className="colPlan" />
                            <col style={{ width: 78 }} />
                            <col style={{ width: weekMode === "all" ? 280 : 170 }} />
                          </colgroup>

                          <thead>
                            <tr>
                              <th className="thTiny">#</th>
                              <th className="thLeft">Oefening</th>
                              <th className="thTiny">Tempo</th>
                              <th className="thPlan">Weekplanning {weekMode === "all" ? "(W1–W4)" : `(W${weekMode})`}</th>
                              <th className="thTiny">Rust</th>
                              <th className="thWeights">Jouw gewicht {weekMode === "all" ? "(W1–W4)" : `(W${weekMode})`}</th>
                            </tr>
                          </thead>

                          <tbody>
                            {day.exercises.map((ex) => {
                              const base = `d${dayIdx}:${ex.code}`;

                              return (
                                <tr key={ex.code}>
                                  <td className="tdTiny">{ex.code}</td>
                                  <td className="tdLeft">
                                    <div style={styles.exName}>{ex.name}</div>
                                  </td>
                                  <td className="tdTiny">{ex.tempo ?? "-"}</td>

                                  <td className="tdPlanCell">
                                    <div
                                      className="planGrid"
                                      style={{
                                        gridTemplateColumns: weekMode === "all" ? "repeat(2, minmax(0, 1fr))" : "repeat(1, minmax(0, 1fr))",
                                      }}
                                    >
                                      {visibleWeeks.map((w) => (
                                        <div key={w} className="planItem">
                                          <span className="planBadge">W{w}</span>
                                          <span className="planText">{weekText(ex, w)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  <td className="tdTiny">{ex.rest ?? "-"}</td>

                                  <td className="tdWeightsCell">
                                    <div
                                      className="inputsGrid"
                                      style={{
                                        gridTemplateColumns: weekMode === "all" ? "repeat(2, minmax(0, 1fr))" : "repeat(1, minmax(0, 1fr))",
                                      }}
                                    >
                                      {visibleWeeks.map((w) => {
                                        const k = `${base}:w${w}`;
                                        return (
                                          <input
                                            key={k}
                                            value={vals[k] ?? ""}
                                            onChange={(e) => setVal(k, e.target.value)}
                                            placeholder={`W${w} kg`}
                                            className="inp"
                                            inputMode="decimal"
                                          />
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* ✅ MOBILE: “uitbreiding” kaartjes ONLY op gsm */}
                      {/* ⚠️ BELANGRIJK: GEEN inline display:grid meer, anders kan CSS het niet verbergen op desktop */}
                      <div className="mobileOnly" style={{ marginTop: 10 }}>
                        {day.exercises.map((ex) => {
                          const base = `d${dayIdx}:${ex.code}`;
                          return (
                            <div key={ex.code} className="mCard">
                              <div className="mTop">
                                <div className="mCode">{ex.code}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div className="mName">{ex.name}</div>
                                  <div className="mMeta">
                                    <span>
                                      Tempo: <b>{ex.tempo ?? "-"}</b>
                                    </span>
                                    <span style={{ opacity: 0.7 }}>•</span>
                                    <span>
                                      Rust: <b>{ex.rest ?? "-"}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mPlan">
                                {visibleWeeks.map((w) => (
                                  <div key={w} className="mPlanRow">
                                    <span className="mBadge">W{w}</span>
                                    <span className="mPlanTxt">{weekText(ex, w)}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="mInputs">
                                {visibleWeeks.map((w) => {
                                  const k = `${base}:w${w}`;
                                  return (
                                    <div key={k} className="mInputRow">
                                      <label className="mLabel">Jouw gewicht W{w}</label>
                                      <input
                                        value={vals[k] ?? ""}
                                        onChange={(e) => setVal(k, e.target.value)}
                                        placeholder={`W${w} kg`}
                                        className="mInp"
                                        inputMode="decimal"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={styles.smallNote}>Tip: invulling wordt automatisch bewaard op dit toestel (per account).</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: 16,
    borderRadius: 22,
    border: `1px solid ${ui.border}`,
    background: `
      radial-gradient(900px 400px at 8% 0%, rgba(137,194,170,0.25), transparent 65%),
      radial-gradient(900px 400px at 70% 20%, rgba(75,142,141,0.22), transparent 60%),
      radial-gradient(900px 400px at 100% 0%, rgba(37,89,113,0.22), transparent 60%),
      ${ui.glass}
    `,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },

  chipsRow: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 },
  filterHint: { marginTop: 10, fontSize: 12.5, color: ui.muted },

  backLink: {
    height: 44,
    padding: "0 14px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: `linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35))`,
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },

  sectionCard: {
    padding: 12,
    borderRadius: 22,
    background: `
      radial-gradient(600px 240px at 0% 0%, rgba(37,89,113,0.16), transparent 60%),
      radial-gradient(600px 240px at 100% 0%, rgba(137,194,170,0.14), transparent 60%),
      ${ui.glass}
    `,
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
  },

  accordionHeader: {
    width: "100%",
    textAlign: "left",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
  },

  sectionTitle: { fontSize: 14, fontWeight: 980, color: ui.text, lineHeight: 1.15 },
  sectionMeta: { marginTop: 4, fontSize: 12, fontWeight: 850, color: ui.muted },

  accordionPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid rgba(255,255,255,0.14)`,
    background: "rgba(255,255,255,0.05)",
    color: ui.muted,
    fontWeight: 950,
    fontSize: 12,
  },
  chev: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid rgba(255,255,255,0.14)`,
    background: "rgba(0,0,0,0.25)",
    color: ui.text,
    transition: "transform 160ms ease",
  },

  exName: { fontWeight: 950, color: ui.text, lineHeight: 1.15 },
  smallNote: { marginTop: 10, fontSize: 12.5, color: ui.muted },
};

const css = `
  /* chips */
  .chip{
    height:34px; padding:0 12px; border-radius:999px;
    border:1px solid rgba(255,255,255,0.14);
    background:rgba(255,255,255,0.05);
    color:${ui.muted};
    font-size:12.5px; font-weight:950;
    cursor:pointer; user-select:none;
  }
  .chipActive{
    color:rgba(255,255,255,0.95);
    border:1px solid rgba(137,194,170,0.35);
    background:linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35));
    box-shadow:0 10px 26px rgba(0,0,0,0.18);
  }

  /* ✅ KAARTJES ALLEEN OP ECHTE GSM/TOUCH
     (en vooral: NIET op desktop) */
  .mobileOnly{ display:none; }
  .fitTable{ display:table; }

  @media (hover: none) and (pointer: coarse){
    .mobileOnly{ display:grid; gap:10px; }
    .fitTable{ display:none; }
  }

  /* desktop table */
  .fitTable{
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    overflow:hidden;
    border-radius:16px;
    border:1px solid ${ui.border};
    background:${ui.glass2};
    table-layout:auto; /* ✅ past kolommen aan inhoud */
  }

  .fitTable th{
    padding:10px;
    font-size:12px;
    color:${ui.muted};
    font-weight:950;
    border-bottom:1px solid ${ui.border};
    text-align:left;
    white-space:nowrap;
  }
  .fitTable td{
    padding:10px;
    border-bottom:1px solid ${ui.border};
    color:${ui.muted};
    vertical-align:top;
  }

  .thTiny, .tdTiny{ text-align:center; }
  .thLeft, .tdLeft{ text-align:left; }

  /* weekplanning niet te breed op desktop */
  .colPlan{ width:auto; }
  .tdPlanCell{ max-width: 300px; }
  .thPlan{ max-width: 300px; }

  .planGrid{ display:grid; gap:6px; }
  .planItem{
    display:flex; align-items:center; gap:8px;
    padding:6px 8px; border-radius:12px;
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.04);
    min-width:0;
  }
  .planBadge{
    font-size:11px; font-weight:980;
    padding:3px 8px; border-radius:999px;
    color:rgba(255,255,255,0.92);
    background:linear-gradient(135deg, ${colors.blue}, ${colors.teal});
    flex:0 0 auto;
  }
  .planText{
    color:${ui.muted};
    font-weight:850;
    font-size:12px;
    min-width:0;
    white-space:normal;
    overflow-wrap:anywhere;
    line-height:1.2;
  }

  .inputsGrid{ display:grid; gap:8px; }
  .inp{
    width:100%;
    height:36px;
    border-radius:12px;
    border:1px solid rgba(137,194,170,0.25);
    background:rgba(0,0,0,0.42);
    color:${ui.text};
    padding:0 10px;
    outline:none;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
  }

  /* mobile cards */
  .mCard{
    border:1px solid ${ui.border};
    background:${ui.glass2};
    border-radius:18px;
    padding:12px;
  }
  .mTop{ display:flex; gap:10px; align-items:flex-start; }
  .mCode{
    width:34px; height:34px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-weight:980;
    color:${ui.text};
    background:linear-gradient(135deg, rgba(37,89,113,0.75), rgba(75,142,141,0.55));
    border:1px solid rgba(255,255,255,0.14);
    flex:0 0 auto;
  }
  .mName{
    font-weight:980;
    color:${ui.text};
    line-height:1.15;
    font-size:14px;
  }
  .mMeta{
    margin-top:6px;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    color:${ui.muted};
    font-size:12.5px;
    font-weight:850;
  }
  .mPlan{ margin-top:10px; display:grid; gap:6px; }
  .mPlanRow{
    display:flex; gap:8px; align-items:flex-start;
    padding:8px 10px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.04);
  }
  .mBadge{
    font-size:11px; font-weight:980;
    padding:3px 8px; border-radius:999px;
    color:rgba(255,255,255,0.92);
    background:linear-gradient(135deg, ${colors.blue}, ${colors.teal});
    flex:0 0 auto;
    margin-top:1px;
  }
  .mPlanTxt{
    color:${ui.muted};
    font-weight:850;
    font-size:12.5px;
    line-height:1.2;
    overflow-wrap:anywhere;
  }

  .mInputs{ margin-top:10px; display:grid; gap:10px; }
  .mInputRow{ display:grid; gap:6px; }
  .mLabel{
    color:${ui.muted};
    font-size:12.5px;
    font-weight:950;
  }
  .mInp{
    width:100%;
    height:46px;
    border-radius:14px;
    border:1px solid rgba(137,194,170,0.28);
    background:rgba(0,0,0,0.45);
    color:${ui.text};
    padding:0 12px;
    outline:none;
    font-size:16px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
  }
`;