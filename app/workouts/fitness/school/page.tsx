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

type Ex = { code: string; name: string; sets: number; reps: string; rest?: string | null };
type Section = { title: string; exercises: Ex[] };

const SECTIONS: Section[] = [
  {
    title: "Dag 1 • Deel 1: Borst",
    exercises: [
      { code: "A", name: "INCLINE CHESTFLY", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "BARBEL BENCH PRESS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "INCLINE PLATE SQUEEZE", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "LOW TO HIGH CABLE FLY", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: PUSH UPS", sets: 1, reps: "3' (doel: 100)" },
    ],
  },
  {
    title: "Dag 1 • Deel 2: Triceps",
    exercises: [
      { code: "A", name: "LYING DB TRICEP EXTENSIONS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "STANDING TRICEP EXTENSIONS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "ROPE TRICEP PULLDOWN", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "DIPS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: DAIMOND CUTTER PUSH UPS", sets: 1, reps: "3' (doel: 100)" },
    ],
  },
  {
    title: "Dag 2 • Deel 1: Rug",
    exercises: [
      { code: "A", name: "LATPULLDOWN WIDE GRIP", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "CLOSE GRIP CABLE ROW", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "1 ARM DUMBBELL ROW", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "STRAIGHT ARM PULLDOWN", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: PULL UPS", sets: 1, reps: "3' (doel: 50)" },
    ],
  },
  {
    title: "Dag 2 • Deel 2: Biceps",
    exercises: [
      { code: "A", name: "DUMBBELL BICEP CURLS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "CABLE BICEP CURLS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "ROPE HAMMER CURLS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "BARBELL CURLS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: 21S (EZ BAR)", sets: 1, reps: "1 set (max effort)" },
    ],
  },
  {
    title: "Dag 3 • Deel 1: Quadriceps / Hips (Benen)",
    exercises: [
      { code: "A", name: "SQUAT", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "LEG PRESS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "BULGARIAN SPLIT SQUAT", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "LEG EXTENSIONS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: WALL SIT", sets: 1, reps: "3' (max)" },
    ],
  },
  {
    title: "Dag 3 • Deel 2: Hamstrings / Gluts (Benen)",
    exercises: [
      { code: "A", name: "ROMANIAN DEADLIFT", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "LYING LEG CURL", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "HIP THRUST", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "BACK EXTENSIONS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "HARDCORE SET: GLUTE BRIDGE HOLD", sets: 1, reps: "3' (max)" },
    ],
  },
  {
    title: "Dag 4 • Deel 1: Schouders",
    exercises: [
      { code: "A", name: "SEATED DB SHOULDER PRESS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "B", name: "LATERAL RAISES", sets: 3, reps: "10-12", rest: "2'" },
      { code: "C", name: "FRONT RAISES", sets: 3, reps: "10-12", rest: "2'" },
      { code: "D", name: "REAR DELT FLYS", sets: 3, reps: "10-12", rest: "2'" },
      { code: "E", name: "UPRIGHT ROW", sets: 3, reps: "10-12", rest: "2'" },
    ],
  },
  {
    title: "Dag 4 • Deel 2: Rotator Cuff",
    exercises: [
      { code: "A", name: "EXTERNAL ROTATION (CABLE/BAND)", sets: 3, reps: "12-15", rest: "1'" },
      { code: "B", name: "INTERNAL ROTATION (CABLE/BAND)", sets: 3, reps: "12-15", rest: "1'" },
      { code: "C", name: "FACE PULL (LIGHT)", sets: 3, reps: "12-15", rest: "1'" },
    ],
  },
];

type Week = 1 | 2 | 3 | 4;
type WeekMode = Week | "all";

function storageKey(userId: string) {
  // bewust geen backticks om parsing issues te vermijden
  return "fitness_school_v2_4w:" + userId;
}

export default function FitnessSchoolPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState<string>("");

  const [vals, setVals] = useState<Record<string, string>>({});
  const setVal = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const [weekMode, setWeekMode] = useState<WeekMode>("all");
  const weeks = useMemo(() => [1, 2, 3, 4] as const, []);
  const visibleWeeks = useMemo<Week[]>(() => (weekMode === "all" ? [...weeks] : [weekMode]), [weekMode, weeks]);

  const [openSecs, setOpenSecs] = useState<Set<number>>(() => new Set([0]));
  const secRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  const toggleSec = (idx: number) => {
    setOpenSecs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);

      requestAnimationFrame(() => {
        const el = secRefs.current[idx];
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
            <div style={styles.kicker}>FITNESS @ SCHOOL</div>
            <h1 style={{ fontSize: 24, fontWeight: 980, margin: "6px 0 0 0", color: ui.text }}>
              Invulbaar schema (Week 1–4)
            </h1>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              Vul je kg/reps per set in • {email && <>ingelogd als <b>{email}</b></>}
            </div>

            <div style={styles.chipsRow}>
              <button type="button" onClick={() => setWeekMode("all")} className={"chip " + (weekMode === "all" ? "chipActive" : "")}>
                Alles
              </button>
              {weeks.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeekMode(w)}
                  className={"chip " + (weekMode === w ? "chipActive" : "")}
                >
                  W{w}
                </button>
              ))}
            </div>

            <div style={styles.filterHint}>
              Filter:{" "}
              <b style={{ color: "rgba(255,255,255,0.92)" }}>
                {weekMode === "all" ? "alles (W1–W4)" : "week " + weekMode}
              </b>
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
            {SECTIONS.map((sec, secIdx) => {
              const isOpen = openSecs.has(secIdx);

              return (
                <div
                  key={sec.title}
                  style={styles.sectionCard}
                  ref={(el) => {
                    secRefs.current[secIdx] = el;
                  }}
                >
                  <button type="button" onClick={() => toggleSec(secIdx)} style={styles.accordionHeader} aria-expanded={isOpen}>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.sectionTitle}>{sec.title}</div>
                      <div style={styles.sectionMeta}>
                        {weekMode === "all" ? "4 weken zichtbaar" : "Alleen week " + weekMode} • auto-save
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                      <span style={styles.accordionPill}>{isOpen ? "Sluiten" : "Open"}</span>
                      <span style={{ ...styles.chev, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </button>

                  {isOpen && (
                    <>
                      {/* DESKTOP: tabel */}
                      <div style={{ marginTop: 10 }}>
                        <table className="fitTable">
                          <colgroup>
                            <col style={{ width: 44 }} />
                            <col />
                            <col style={{ width: 72 }} />
                            <col style={{ width: 88 }} />
                            <col style={{ width: 78 }} />
                            <col style={{ width: weekMode === "all" ? 520 : 320 }} />
                          </colgroup>

                          <thead>
                            <tr>
                              <th className="thTiny">#</th>
                              <th className="thLeft">Oefening</th>
                              <th className="thTiny">Sets</th>
                              <th className="thTiny">Reps</th>
                              <th className="thTiny">Rust</th>
                              <th className="thWeights">Jouw invulling {weekMode === "all" ? "(W1–W4)" : "(W" + weekMode + ")"}</th>
                            </tr>
                          </thead>

                          <tbody>
                            {sec.exercises.map((ex) => {
                              const base = "s" + secIdx + ":" + ex.code;

                              return (
                                <tr key={ex.code}>
                                  <td className="tdTiny">{ex.code}</td>
                                  <td className="tdLeft">
                                    <div style={styles.exName}>{ex.name}</div>
                                  </td>
                                  <td className="tdTiny">{ex.sets}</td>
                                  <td className="tdTiny">{ex.reps}</td>
                                  <td className="tdTiny">{ex.rest ?? "-"}</td>

                                  <td className="tdWeightsCell">
                                    <div
                                      className="weekGrid"
                                      style={{
                                        gridTemplateColumns: weekMode === "all" ? "repeat(2, minmax(0, 1fr))" : "repeat(1, minmax(0, 1fr))",
                                      }}
                                    >
                                      {visibleWeeks.map((w) => {
                                        const wkBase = base + ":w" + w;

                                        return (
                                          <div key={wkBase} className="weekBox">
                                            <div className="weekTop">
                                              <span className="weekBadge">W{w}</span>
                                              <span className="weekHint">3 sets</span>
                                            </div>

                                            <div className="setInputs">
                                              {[1, 2, 3].map((s) => {
                                                const k = wkBase + ":set" + s;
                                                return (
                                                  <input
                                                    key={k}
                                                    value={vals[k] ?? ""}
                                                    onChange={(e) => setVal(k, e.target.value)}
                                                    placeholder={"set " + s + " kg/reps"}
                                                    className="inp"
                                                    inputMode="decimal"
                                                  />
                                                );
                                              })}
                                            </div>
                                          </div>
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

                      {/* MOBILE: kaartjes (alleen op echte gsm/touch) */}
                      <div className="mobileOnly" style={{ marginTop: 10 }}>
                        {sec.exercises.map((ex) => {
                          const base = "s" + secIdx + ":" + ex.code;

                          return (
                            <div key={ex.code} className="mCard">
                              <div className="mTop">
                                <div className="mCode">{ex.code}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div className="mName">{ex.name}</div>
                                  <div className="mMeta">
                                    <span>
                                      Sets: <b>{ex.sets}</b>
                                    </span>
                                    <span style={{ opacity: 0.7 }}>•</span>
                                    <span>
                                      Reps: <b>{ex.reps}</b>
                                    </span>
                                    <span style={{ opacity: 0.7 }}>•</span>
                                    <span>
                                      Rust: <b>{ex.rest ?? "-"}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mInputs">
                                {visibleWeeks.map((w) => {
                                  const wkBase = base + ":w" + w;

                                  return (
                                    <div key={wkBase} className="mWeekBlock">
                                      <div className="mWeekTitle">
                                        <span className="mBadge">W{w}</span>
                                        <span className="mWeekHint">3 sets</span>
                                      </div>

                                      {[1, 2, 3].map((s) => {
                                        const k = wkBase + ":set" + s;
                                        return (
                                          <div key={k} className="mInputRow">
                                            <label className="mLabel">Set {s}</label>
                                            <input
                                              value={vals[k] ?? ""}
                                              onChange={(e) => setVal(k, e.target.value)}
                                              placeholder="kg/reps"
                                              className="mInp"
                                              inputMode="decimal"
                                            />
                                          </div>
                                        );
                                      })}
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
    border: "1px solid " + ui.border,
    background:
      "radial-gradient(900px 400px at 8% 0%, rgba(137,194,170,0.25), transparent 65%)," +
      "radial-gradient(900px 400px at 70% 20%, rgba(75,142,141,0.22), transparent 60%)," +
      "radial-gradient(900px 400px at 100% 0%, rgba(37,89,113,0.22), transparent 60%)," +
      ui.glass,
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
    border: "1px solid " + ui.border2,
    background: "linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35))",
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
    background:
      "radial-gradient(600px 240px at 0% 0%, rgba(37,89,113,0.16), transparent 60%)," +
      "radial-gradient(600px 240px at 100% 0%, rgba(137,194,170,0.14), transparent 60%)," +
      ui.glass,
    border: "1px solid " + ui.border,
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
    border: "1px solid rgba(255,255,255,0.14)",
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
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: ui.text,
    transition: "transform 160ms ease",
  },

  exName: { fontWeight: 950, color: ui.text, lineHeight: 1.15 },
  smallNote: { marginTop: 10, fontSize: 12.5, color: ui.muted },
};

const css =
  `
  .chip{
    height:34px; padding:0 12px; border-radius:999px;
    border:1px solid rgba(255,255,255,0.14);
    background:rgba(255,255,255,0.05);
    color:` +
  ui.muted +
  `;
    font-size:12.5px; font-weight:950;
    cursor:pointer; user-select:none;
  }
  .chipActive{
    color:rgba(255,255,255,0.95);
    border:1px solid rgba(137,194,170,0.35);
    background:linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35));
    box-shadow:0 10px 26px rgba(0,0,0,0.18);
  }

  .mobileOnly{ display:none; }
  .fitTable{ display:table; }

  @media (hover: none) and (pointer: coarse){
    .mobileOnly{ display:grid; gap:10px; }
    .fitTable{ display:none; }
  }

  .fitTable{
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    overflow:hidden;
    border-radius:16px;
    border:1px solid ` +
  ui.border +
  `;
    background:` +
  ui.glass2 +
  `;
    table-layout:auto;
  }

  .fitTable th{
    padding:10px;
    font-size:12px;
    color:` +
  ui.muted +
  `;
    font-weight:950;
    border-bottom:1px solid ` +
  ui.border +
  `;
    text-align:left;
    white-space:nowrap;
  }
  .fitTable td{
    padding:10px;
    border-bottom:1px solid ` +
  ui.border +
  `;
    color:` +
  ui.muted +
  `;
    vertical-align:top;
  }

  .thTiny, .tdTiny{ text-align:center; }
  .thLeft, .tdLeft{ text-align:left; }

  .weekGrid{ display:grid; gap:10px; }
  .weekBox{
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.04);
    border-radius:14px;
    padding:10px;
    min-width:0;
  }
  .weekTop{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom:8px;
  }
  .weekBadge{
    font-size:11px; font-weight:980;
    padding:3px 8px; border-radius:999px;
    color:rgba(255,255,255,0.92);
    background:linear-gradient(135deg, ` +
  colors.blue +
  `, ` +
  colors.teal +
  `);
    flex:0 0 auto;
  }
  .weekHint{
    color:` +
  ui.muted +
  `;
    font-weight:850;
    font-size:12px;
    opacity:0.9;
  }

  .setInputs{
    display:grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap:8px;
  }

  .inp{
    width:100%;
    height:36px;
    border-radius:12px;
    border:1px solid rgba(137,194,170,0.25);
    background:rgba(0,0,0,0.42);
    color:` +
  ui.text +
  `;
    padding:0 10px;
    outline:none;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
    min-width:0;
  }

  .mCard{
    border:1px solid ` +
  ui.border +
  `;
    background:` +
  ui.glass2 +
  `;
    border-radius:18px;
    padding:12px;
  }
  .mTop{ display:flex; gap:10px; align-items:flex-start; }
  .mCode{
    width:34px; height:34px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-weight:980;
    color:` +
  ui.text +
  `;
    background:linear-gradient(135deg, rgba(37,89,113,0.75), rgba(75,142,141,0.55));
    border:1px solid rgba(255,255,255,0.14);
    flex:0 0 auto;
  }
  .mName{
    font-weight:980;
    color:` +
  ui.text +
  `;
    line-height:1.15;
    font-size:14px;
  }
  .mMeta{
    margin-top:6px;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    color:` +
  ui.muted +
  `;
    font-size:12.5px;
    font-weight:850;
  }

  .mInputs{ margin-top:10px; display:grid; gap:10px; }
  .mWeekBlock{
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.04);
    border-radius:16px;
    padding:10px;
    display:grid;
    gap:10px;
  }
  .mWeekTitle{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }
  .mBadge{
    font-size:11px; font-weight:980;
    padding:3px 8px; border-radius:999px;
    color:rgba(255,255,255,0.92);
    background:linear-gradient(135deg, ` +
  colors.blue +
  `, ` +
  colors.teal +
  `);
    flex:0 0 auto;
  }
  .mWeekHint{
    color:` +
  ui.muted +
  `;
    font-weight:850;
    font-size:12px;
    opacity:0.9;
  }
  .mInputRow{ display:grid; gap:6px; }
  .mLabel{
    color:` +
  ui.muted +
  `;
    font-size:12.5px;
    font-weight:950;
  }
  .mInp{
    width:100%;
    height:46px;
    border-radius:14px;
    border:1px solid rgba(137,194,170,0.28);
    background:rgba(0,0,0,0.45);
    color:` +
  ui.text +
  `;
    padding:0 12px;
    outline:none;
    font-size:16px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
  }
`;

// let op: css string hierboven sluit correct af met een backtick in deze file (geen losse backticks elders).