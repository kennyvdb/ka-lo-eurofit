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

type Ex = {
  code: string;
  name: string;
  sets: number;
  reps: string;
  rest?: string | null;
  slug: string;
};

type Section = { title: string; exercises: Ex[] };

const SECTIONS: Section[] = [
  {
    title: "Dag 1 • Deel 1: Borst",
    exercises: [
      { code: "A", name: "ELEVATOR PUSH UPS", sets: 3, reps: "to failure", rest: "2'", slug: "elevator-push-up" },
      { code: "B", name: "SUPERMAN PUSH UPS", sets: 3, reps: "to failure", rest: "2'", slug: "superman-push-up" },
      { code: "C", name: "DIAMOND INCLINE PUSH UPS", sets: 3, reps: "to failure", rest: "2'", slug: "diamond-incline-push-up" },
      { code: "D", name: "DECLINE SPIDERMAN PUSH UPS", sets: 3, reps: "to failure", rest: "2'", slug: "decline-spiderman-push-up" },
      { code: "E", name: "HARDCORE SET: PUSH UPS", sets: 1, reps: "3' (doel: 100)", rest: null, slug: "push-up" },
    ],
  },

  {
    title: "Dag 1 • Deel 2: Triceps",
    exercises: [
      { code: "A", name: "TRICEPS UPRIGHT DIPS", sets: 3, reps: "to failure", rest: "2'", slug: "triceps-upright-dips" },
      { code: "B", name: "CHAIR / BENCH DIPS", sets: 3, reps: "to failure", rest: "2'", slug: "chair-bench-dips" },
      { code: "C", name: "CROSS TRICEPS EXTENSIONS", sets: 3, reps: "to failure", rest: "2'", slug: "cross-triceps-extensions" },
      { code: "D", name: "SKULL CRUSHERS", sets: 3, reps: "to failure", rest: "2'", slug: "skull-crushers" },
      { code: "E", name: "HARDCORE SET: DIAMOND CUTTER PUSH UPS", sets: 1, reps: "3' (doel: 100)", rest: null, slug: "diamond-cutter-push-up" },
    ],
  },

  {
    title: "Dag 2 • Deel 1: Rug",
    exercises: [
      { code: "A", name: "DB LATERAL PULL OVER", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-lateral-pull-over" },
      { code: "B", name: "DB RENEGADE ROW", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-renegade-row" },
      { code: "C", name: "DB BENT ROWS", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-bent-row" },
      { code: "D", name: "BENCH / CHAIR REVERSE HYPER", sets: 3, reps: "to failure", rest: "2'", slug: "bench-chair-reverse-hyper" },
      { code: "E", name: "HARDCORE SET: INVERTED CHIN ROWS", sets: 1, reps: "3' (doel: 75)", rest: null, slug: "inverted-chin-rows" },
    ],
  },

  {
    title: "Dag 2 • Deel 2: Biceps",
    exercises: [
      { code: "A", name: "ONE ARM TABLE ROWS", sets: 3, reps: "to failure", rest: "2'", slug: "one-arm-table-rows" },
      { code: "B", name: "ALTERNATING DB CURL", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "alternating-db-curl" },
      { code: "C", name: "DB FIELDER CURL", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-fielder-curl" },
      { code: "D", name: "JAMB HAMMER ROWS", sets: 3, reps: "to failure", rest: "2'", slug: "jamb-hammer-rows" },
      { code: "E", name: "HARDCORE SET: DOORWAY BICEPS CURL", sets: 1, reps: `1'30" / arm (doel: 75)`, rest: null, slug: "doorway-biceps-curl" },
    ],
  },

  {
    title: "Dag 3 • Deel 1: Quadriceps / Hips (Benen)",
    exercises: [
      { code: "A", name: "DB BULGARIAN SPLIT SQUATS", sets: 3, reps: "10 / been", rest: `30"`, slug: "db-bulgarian-split-squat" },
      { code: "B", name: "DB FRONT SQUATS", sets: 3, reps: "to failure (10–12)", rest: `30"`, slug: "db-front-squats" },
      { code: "C", name: "ALTERNATING HIGH BOX STEP UPS", sets: 3, reps: "to failure / been", rest: `30"`, slug: "alternating-high-box-step-up" },
      { code: "D", name: "ROCKET JUMPS", sets: 3, reps: `30"`, rest: `30"`, slug: "rocket-jumps" },
      { code: "E", name: "HARDCORE SET: BODYWEIGHT SQUATS", sets: 1, reps: "3' (doel: 100)", rest: null, slug: "bodyweight-squats" },
    ],
  },

  {
    title: "Dag 3 • Deel 2: Hamstrings / Gluts (Benen)",
    exercises: [
      { code: "A", name: "DB RDL'S", sets: 3, reps: "to failure", rest: "2'", slug: "db-rdl" },
      { code: "B", name: "DB / KB SWINGS", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-kb-swings" },
      { code: "C", name: "BENCH GLUTE HAM RAISE", sets: 3, reps: "to failure", rest: "2'", slug: "bench-glute-ham-raise" },
      { code: "D", name: "SINGLE LEG BRIDGE ISO HOLD", sets: 3, reps: "to failure / been", rest: "2'", slug: "single-leg-bridge-iso-hold" },
      { code: "E", name: "HARDCORE SET: MARCHING LONG LEG BRIDGES", sets: 1, reps: "3' (doel: 75)", rest: null, slug: "marching-long-leg-bridges" },
    ],
  },

  {
    title: "Dag 4 • Deel 1: Schouders",
    exercises: [
      { code: "A", name: "CHEAT LATERAL", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "cheat-lateral-raise" },
      { code: "B", name: "CLEAN TO OVERHEAD", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "clean-to-overhead" },
      { code: "C", name: "SEE SAW PRESS", sets: 3, reps: "to failure (10–12/arm)", rest: "2'", slug: "see-saw-press" },
      { code: "D", name: "DB THRUSTERS", sets: 3, reps: "to failure (10–12)", rest: "2'", slug: "db-thrusters" },
      { code: "E", name: "HARDCORE SET: PIKE PUSH UPS BRIDGE", sets: 1, reps: "3' (doel: 50)", rest: null, slug: "pike-push-up-bridge" },
    ],
  },

  {
    title: "Dag 4 • Deel 2: Rotator Cuff",
    exercises: [
      { code: "A", name: "V-W-T RAISES", sets: 3, reps: "10/oef (alles na elkaar)", rest: `10"`, slug: "v-w-t-raises" },
    ],
  },
];

type Week = 1 | 2 | 3 | 4 | 5 | 6;
type WeekMode = Week | "all";

function storageKey(userId: string) {
  return "workouts_home_6w_v3:" + userId;
}

export default function HomeWorkoutsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");

  const [vals, setVals] = useState<Record<string, string>>({});
  const setVal = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const [weekMode, setWeekMode] = useState<WeekMode>("all");
  const weeks = useMemo(() => [1, 2, 3, 4, 5, 6] as const, []);
  const visibleWeeks = useMemo<Week[]>(() => (weekMode === "all" ? [...weeks] : [weekMode]), [weekMode, weeks]);

  // start: alles dicht
  const [openSecs, setOpenSecs] = useState<Set<number>>(() => new Set());
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

  const doReset = () => {
    const ok = window.confirm("Logboek wissen? Dit verwijdert al je ingevulde scores voor W1–W6 op dit toestel.");
    if (!ok) return;

    setVals({});
    if (uid) {
      try {
        localStorage.removeItem(storageKey(uid));
      } catch {}
    }
  };

  return (
    <AppShell title="KA LO App" subtitle="Workouts • Home" userName={profile.volledige_naam ?? null}>
      <style>{css}</style>

      <div style={{ maxWidth: 1100 }}>
        <div style={styles.header}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.kicker}>WORKOUTS • HOME</div>
            <h1 style={{ fontSize: 24, fontWeight: 980, margin: "6px 0 0 0", color: ui.text }}>
              Schema + video’s + logboek (6 weken)
            </h1>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              Klik op een oefening voor de video • Log je kg/reps per set • {email && <>ingelogd als <b>{email}</b></>}
            </div>

            <div style={styles.topBtns}>
              <a href="/workouts/home/instructies" style={styles.primaryBtn}>
                Instructies
              </a>

              <button type="button" onClick={doReset} className="resetBtn">
                Reset logboek
              </button>

              <a href="/workouts" style={styles.backLink}>
                ← Terug
              </a>
            </div>

            <div style={styles.chipsRow}>
              <button type="button" onClick={() => setWeekMode("all")} className={"chip " + (weekMode === "all" ? "chipActive" : "")}>
                Alles
              </button>
              {weeks.map((w) => (
                <button key={w} type="button" onClick={() => setWeekMode(w)} className={"chip " + (weekMode === w ? "chipActive" : "")}>
                  W{w}
                </button>
              ))}
            </div>

            <div style={styles.filterHint}>
              Filter:{" "}
              <b style={{ color: "rgba(255,255,255,0.92)" }}>{weekMode === "all" ? "alles (W1–W6)" : "week " + weekMode}</b>
            </div>
          </div>
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
                      <div style={styles.sectionMeta}>Video + logboek • auto-save op dit toestel</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                      <span style={styles.accordionPill}>{isOpen ? "Sluiten" : "Open"}</span>
                      <span style={{ ...styles.chev, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </button>

                  {isOpen && (
                    <>
                      <div style={{ marginTop: 10 }}>
                        <table className="fitTable">
                          <colgroup>
                            <col style={{ width: 44 }} />
                            <col />
                            <col style={{ width: 72 }} />
                            <col style={{ width: 120 }} />
                            <col style={{ width: 78 }} />
                            <col style={{ width: 140 }} />
                            <col style={{ width: weekMode === "all" ? 640 : 360 }} />
                          </colgroup>

                          <thead>
                            <tr>
                              <th className="thTiny">#</th>
                              <th className="thLeft">Oefening</th>
                              <th className="thTiny">Sets</th>
                              <th className="thTiny">Reps</th>
                              <th className="thTiny">Rust</th>
                              <th className="thTiny">Video</th>
                              <th className="thWeights">Jouw invulling {weekMode === "all" ? "(W1–W6)" : "(W" + weekMode + ")"}</th>
                            </tr>
                          </thead>

                          <tbody>
                            {sec.exercises.map((ex) => {
                              const base = "s" + secIdx + ":" + ex.code + ":" + ex.slug;
                              const setsCount = Math.max(1, Math.min(6, ex.sets || 1));
                              const setNums = Array.from({ length: setsCount }, (_, i) => i + 1);

                              return (
                                <tr key={ex.slug}>
                                  <td className="tdTiny">{ex.code}</td>

                                  <td className="tdLeft">
                                    <a href={"/workouts/home/" + ex.slug} className="exLink">
                                      <div style={styles.exName}>{ex.name}</div>
                                    </a>
                                  </td>

                                  <td className="tdTiny">{ex.sets}</td>
                                  <td className="tdTiny">{ex.reps}</td>
                                  <td className="tdTiny">{ex.rest ?? "-"}</td>

                                  <td className="tdTiny">
                                    <a href={"/workouts/home/" + ex.slug} className="watchBtn">
                                      Bekijk →
                                    </a>
                                  </td>

                                  <td className="tdWeightsCell">
                                    <div
                                      className="weekGrid"
                                      style={{
                                        gridTemplateColumns: weekMode === "all" ? "repeat(3, minmax(0, 1fr))" : "repeat(1, minmax(0, 1fr))",
                                      }}
                                    >
                                      {visibleWeeks.map((w) => {
                                        const wkBase = base + ":w" + w;
                                        return (
                                          <div key={wkBase} className="weekBox">
                                            <div className="weekTop">
                                              <span className="weekBadge">W{w}</span>
                                              <span className="weekHint">
                                                {setsCount} set{setsCount === 1 ? "" : "s"}
                                              </span>
                                            </div>

                                            <div
                                              className="setInputs"
                                              style={{
                                                gridTemplateColumns:
                                                  setsCount >= 3 ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
                                              }}
                                            >
                                              {setNums.map((s) => {
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

                      <div className="mobileOnly" style={{ marginTop: 10 }}>
                        {sec.exercises.map((ex) => {
                          const base = "s" + secIdx + ":" + ex.code + ":" + ex.slug;
                          const setsCount = Math.max(1, Math.min(6, ex.sets || 1));
                          const setNums = Array.from({ length: setsCount }, (_, i) => i + 1);

                          return (
                            <div key={ex.slug} className="mCard">
                              <div className="mTop">
                                <div className="mCode">{ex.code}</div>
                                <div style={{ minWidth: 0 }}>
                                  <a href={"/workouts/home/" + ex.slug} className="mTitleLink">
                                    <div className="mName">{ex.name}</div>
                                  </a>
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

                              <div className="mActions">
                                <a href={"/workouts/home/" + ex.slug} className="mWatchBtn">
                                  Bekijk video →
                                </a>
                              </div>

                              <div className="mInputs">
                                {visibleWeeks.map((w) => {
                                  const wkBase = base + ":w" + w;
                                  return (
                                    <div key={wkBase} className="mWeekBlock">
                                      <div className="mWeekTitle">
                                        <span className="mBadge">W{w}</span>
                                        <span className="mWeekHint">
                                          {setsCount} set{setsCount === 1 ? "" : "s"}
                                        </span>
                                      </div>

                                      {setNums.map((s) => {
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

                      <div style={styles.smallNote}>Tip: alles wordt automatisch bewaard op dit toestel (per account).</div>
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

  topBtns: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" },

  primaryBtn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(137,194,170,0.35)",
    background: "linear-gradient(135deg, rgba(137,194,170,0.35), rgba(75,142,141,0.25))",
    color: ui.text,
    fontWeight: 980,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  },

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

  chipsRow: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 },
  filterHint: { marginTop: 10, fontSize: 12.5, color: ui.muted },

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

const css = `
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

  .resetBtn{
    height:44px; padding:0 14px; border-radius:16px;
    border:1px solid rgba(255,255,255,0.18);
    background:rgba(255,255,255,0.06);
    color:${ui.text};
    font-weight:980;
    cursor:pointer;
    box-shadow:0 10px 26px rgba(0,0,0,0.18);
  }
  .resetBtn:hover{ opacity:0.95; }

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
    border:1px solid ${ui.border};
    background:${ui.glass2};
    table-layout:auto;
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

  .exLink{ text-decoration:none; display:inline-block; }
  .exLink:hover{ opacity:0.95; }

  .watchBtn{
    text-decoration:none;
    font-weight:950;
    font-size:12.5px;
    padding:8px 10px;
    border-radius:12px;
    border:1px solid rgba(137,194,170,0.28);
    color:${ui.text};
    background:linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35));
    display:inline-flex;
    align-items:center;
    justify-content:center;
    min-width:92px;
  }

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
    background:linear-gradient(135deg, ${colors.blue}, ${colors.teal});
    flex:0 0 auto;
  }
  .weekHint{
    color:${ui.muted};
    font-weight:850;
    font-size:12px;
    opacity:0.9;
  }

  .setInputs{
    display:grid;
    gap:8px;
  }

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
    min-width:0;
  }

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
  .mTitleLink{ text-decoration:none; }
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

  .mActions{
    margin-top:10px;
    display:flex;
    justify-content:flex-end;
  }
  .mWatchBtn{
    text-decoration:none;
    font-weight:980;
    font-size:13px;
    padding:10px 12px;
    border-radius:14px;
    border:1px solid rgba(137,194,170,0.28);
    color:${ui.text};
    background:linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35));
    display:inline-flex;
    align-items:center;
    justify-content:center;
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
    background:linear-gradient(135deg, ${colors.blue}, ${colors.teal});
    flex:0 0 auto;
  }
  .mWeekHint{
    color:${ui.muted};
    font-weight:850;
    font-size:12px;
    opacity:0.9;
  }
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