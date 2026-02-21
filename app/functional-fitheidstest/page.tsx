"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

// ✅ nieuw: huiswerk tab component
import HomeworkTab from "./HomeworkTab";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  okBg: "rgba(104,180,255,0.10)",
  okBorder: "rgba(104,180,255,0.24)",
};

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type ScoreValue = number | "";

/**
 * ✅ Matcht Excel (sheet "TEST 1") – 12 onderdelen
 */
type TestKey =
  | "vma_kmu"
  | "situp_floor_tap_60s"
  | "wallball_3kg_60s"
  | "pushups_60s"
  | "burpees_60s"
  | "wallsit_time_s"
  | "table_pullup_invertedrow_60s"
  | "plank_time_s"
  | "box_jumps_60s"
  | "dips_chairdips_60s"
  | "airsquats_60s"
  | "handstand_hold_time_s";

type TestDef = {
  key: TestKey;
  title: string;
  desc: string;
  unit: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  step?: number;
  min?: number;
  max?: number;
  icon: string;
  // eenvoudige “punten”-mapping (placeholder) – pas aan volgens je Excel-normen
  points: (v: number) => number; // 0..10
  hint?: string;
  image?: string; // optioneel: pad naar afbeelding in /public
};

/**
 * ✅ TESTS = exacte volgorde/benaming zoals Excel
 * Puntensysteem blijft placeholder (geen normtabellen in dit bestand).
 */
const TESTS: TestDef[] = [
  {
    key: "vma_kmu",
    title: "VMA-test",
    desc: "Snelheid op het einde van de test.",
    unit: "km/u",
    inputMode: "decimal",
    step: 0.1,
    min: 0,
    max: 30,
    icon: "🏃‍♂️",
    points: (v) => clamp10(Math.floor((v - 8) / 1.2)), // placeholder
    image: "/functional/vma.png",
  },
  {
    key: "situp_floor_tap_60s",
    title: "Sit-up floor tap (Abmat)",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 200,
    icon: "🧱",
    points: (v) => clamp10(Math.floor(v / 6)), // placeholder
    image: "/functional/situp-abmat.png",
  },
  {
    key: "wallball_3kg_60s",
    title: "Wallball (3 kg)",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 300,
    icon: "🎯",
    points: (v) => clamp10(Math.floor(v / 8)), // placeholder
    image: "/functional/wallball.png",
  },
  {
    key: "pushups_60s",
    title: "Push ups",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 200,
    icon: "💪",
    points: (v) => clamp10(Math.floor(v / 5)), // placeholder
    image: "/functional/pushups.png",
  },
  {
    key: "burpees_60s",
    title: "Burpees",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 200,
    icon: "🔥",
    points: (v) => clamp10(Math.floor(v / 4)), // placeholder
    image: "/functional/burpees.png",
  },
  {
    key: "wallsit_time_s",
    title: "Wallsit",
    desc: "Tijd vasthouden (for time).",
    unit: "sec",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 900,
    icon: "🧊",
    points: (v) => clamp10(Math.floor(v / 25)), // placeholder
    image: "/functional/wallsit.png",
  },
  {
    key: "table_pullup_invertedrow_60s",
    title: "Table pull up / Inverted row",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 200,
    icon: "🪝",
    points: (v) => clamp10(Math.floor(v / 4)), // placeholder
    image: "/functional/inverted-row.png",
  },
  {
    key: "plank_time_s",
    title: "Planking",
    desc: "Tijd vasthouden (for time).",
    unit: "sec",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 900,
    icon: "🧘‍♂️",
    points: (v) => clamp10(Math.floor(v / 30)), // placeholder
    hint: "Tip: rechte lijn schouders–heupen–hielen.",
    image: "/functional/plank.png",
  },
  {
    key: "box_jumps_60s",
    title: "Box jumps",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 250,
    icon: "🦘",
    points: (v) => clamp10(Math.floor(v / 6)), // placeholder
    image: "/functional/box-jumps.png",
  },
  {
    key: "dips_chairdips_60s",
    title: "Dips / Chairdips",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 200,
    icon: "🏋️",
    points: (v) => clamp10(Math.floor(v / 5)), // placeholder
    image: "/functional/dips.png",
  },
  {
    key: "airsquats_60s",
    title: "Airsquats",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 400,
    icon: "🦵",
    points: (v) => clamp10(Math.floor(v / 10)), // placeholder
    image: "/functional/airsquats.png",
  },
  {
    key: "handstand_hold_time_s",
    title: "Handstand hold",
    desc: "Tijd vasthouden (for time).",
    unit: "sec",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 900,
    icon: "🤸",
    points: (v) => clamp10(Math.floor(v / 15)), // placeholder
    image: "/functional/handstand.png",
  },
];

function clamp10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

function isTeacherRole(p?: Profiel | null) {
  const raw = (p?.role ?? p?.rol ?? "").toLowerCase();
  return raw === "teacher" || raw === "leerkracht";
}

type SavedRow = {
  id: string;
  user_id: string;
  schooljaar: string | null;
  date: string; // ymd
  scores: Record<string, number>;
  points: Record<string, number>;
  total_points: number;
  note: string | null;
  created_at: string;
};

export default function FunctionalFitheidstestPage() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ✅ nieuw: huiswerk tab
  const [activeTab, setActiveTab] = useState<"invullen" | "resultaten" | "info" | "huiswerk">("invullen");

  const [date, setDate] = useState(toYMD());
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);

  const [scores, setScores] = useState<Record<TestKey, ScoreValue>>(() => {
    const obj = {} as Record<TestKey, ScoreValue>;
    for (const t of TESTS) obj[t.key] = "";
    return obj;
  });

  const computed = useMemo(() => {
    const numeric: Record<TestKey, number> = {} as any;
    const pts: Record<TestKey, number> = {} as any;

    for (const t of TESTS) {
      const v = scores[t.key];
      const num = typeof v === "number" ? v : NaN;
      numeric[t.key] = Number.isFinite(num) ? num : 0;
      pts[t.key] = Number.isFinite(num) ? t.points(num) : 0;
    }

    const totalPoints = Object.values(pts).reduce((a, b) => a + b, 0);
    const maxPoints = TESTS.length * 10;

    // “Beast rating”
    const pct = maxPoints ? (totalPoints / maxPoints) * 100 : 0;
    const tier =
      pct >= 85
        ? "Legendary"
        : pct >= 70
        ? "Elite"
        : pct >= 55
        ? "Savage"
        : pct >= 40
        ? "Alpha"
        : pct >= 25
        ? "Hungry"
        : "Rookie";

    return { numeric, pts, totalPoints, maxPoints, pct, tier };
  }, [scores]);

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Beast";
  const teacherMode = isTeacherRole(profiel);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, role, rol, klas_naam, schooljaar, schooljaar_bevestigd_op")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Profiel) ?? null;
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        window.location.replace("/login");
        return;
      }

      setUid(userId);

      try {
        const p = await fetchProfile(userId);
        setProfiel(p);
      } catch (e: any) {
        setError(e?.message ?? "Kon profiel niet laden.");
      }

      setLoading(false);
    };

    run();
  }, []);

  const setOne = (k: TestKey, raw: string) => {
    setInfo(null);
    setError(null);

    if (raw.trim() === "") {
      setScores((s) => ({ ...s, [k]: "" }));
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;

    const def = TESTS.find((t) => t.key === k)!;
    const min = def.min ?? -Infinity;
    const max = def.max ?? Infinity;
    const clamped = Math.max(min, Math.min(max, n));

    setScores((s) => ({ ...s, [k]: clamped }));
  };

  const resetAll = () => {
    setScores(() => {
      const obj = {} as Record<TestKey, ScoreValue>;
      for (const t of TESTS) obj[t.key] = "";
      return obj;
    });
    setNote("");
    setInfo("Alles leeg gemaakt.");
    setError(null);
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      const payload = {
        user_id: uid,
        schooljaar: profiel?.schooljaar ?? null,
        date,
        scores: Object.fromEntries(TESTS.map((t) => [t.key, computed.numeric[t.key]])),
        points: Object.fromEntries(TESTS.map((t) => [t.key, computed.pts[t.key]])),
        total_points: computed.totalPoints,
        note: note.trim() ? note.trim() : null,
      };

      const { error } = await supabase.from("functional_fitheidstest_submissions").insert(payload);

      if (error) throw new Error(error.message);
      setInfo("✅ Opgeslagen!");
      setActiveTab("resultaten");
    } catch (e: any) {
      setError(e?.message ?? "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadLatest = async () => {
    if (!uid) return;
    setLoadingLatest(true);
    setError(null);
    setInfo(null);

    try {
      const { data, error } = await supabase
        .from("functional_fitheidstest_submissions")
        .select("id, user_id, schooljaar, date, scores, points, total_points, note, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw new Error(error.message);
      const row = (data?.[0] as SavedRow | undefined) ?? null;
      if (!row) {
        setInfo("Geen vorige meting gevonden.");
        return;
      }

      setDate(row.date ?? toYMD());
      setNote(row.note ?? "");
      setScores(() => {
        const obj = {} as Record<TestKey, ScoreValue>;
        for (const t of TESTS) {
          const v = (row.scores as any)?.[t.key];
          obj[t.key] = typeof v === "number" ? v : "";
        }
        return obj;
      });

      setInfo("Laatste meting geladen.");
      setActiveTab("invullen");
    } catch (e: any) {
      setError(e?.message ?? "Laden mislukt.");
    } finally {
      setLoadingLatest(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Functional laden…</div>
      </main>
    );
  }

    return (
    <AppShell title="LO App" subtitle="Functional fitheidstest" userName={profiel?.volledige_naam}>
      {/* HERO */}
      <HeroFunctional greetingName={greetingName} klasNaam={profiel?.klas_naam} />

      {/* header row */}
      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Vul je scores in zoals op het invulblad.{" "}
            <span style={{ color: ui.text, fontWeight: 950 }}>{teacherMode ? "Leerkrachtmodus" : "Leerlingmodus"}</span>
            {profiel?.klas_naam ? <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span> : null}
          </div>
        </div>

        <Link href="/dashboard" style={styles.blackBtnLink}>
          Terug →
        </Link>
      </div>

      {/* alerts */}
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

      {/* Tabs */}
      <div style={styles.tabs}>
        <TabBtn active={activeTab === "invullen"} onClick={() => setActiveTab("invullen")}>
          Invullen
        </TabBtn>
        <TabBtn active={activeTab === "resultaten"} onClick={() => setActiveTab("resultaten")}>
          Resultaten
        </TabBtn>
        <TabBtn active={activeTab === "info"} onClick={() => setActiveTab("info")}>
          Uitleg
        </TabBtn>
        {/* ✅ nieuw */}
        <TabBtn active={activeTab === "huiswerk"} onClick={() => setActiveTab("huiswerk")}>
          Huiswerk
        </TabBtn>
      </div>

      {/* Meta row (alleen relevant op invullen/resultaten) */}
      {activeTab !== "huiswerk" ? (
        <div className="meta-grid-2" style={styles.metaRow}>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>📅 Datum</div>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={styles.input}
              inputMode="text"
              placeholder="YYYY-MM-DD"
            />
            <div style={{ marginTop: 6, fontSize: 12, color: ui.muted }}>Tip: zet dezelfde datum als op je invulblad.</div>
          </div>

          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>📝 Opmerking (optioneel)</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={styles.input}
              placeholder="bv. blessure, natte zaal, ... "
            />
            <div style={{ marginTop: 6, fontSize: 12, color: ui.muted }}>Korte context helpt bij vergelijken.</div>
          </div>
        </div>
      ) : null}

      {/* Content */}
      {activeTab === "invullen" ? (
        <>
          {/* Quick actions */}
          <div style={styles.actionRow}>
            <button
              onClick={handleLoadLatest}
              disabled={loadingLatest}
              style={{ ...styles.blackBtn, opacity: loadingLatest ? 0.7 : 1 }}
            >
              {loadingLatest ? "Laden..." : "Laatste meting laden"}
            </button>

            <button onClick={resetAll} style={styles.ghostBtn}>
              Alles leegmaken
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
              title="Slaat je meting op in Supabase"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>

          {teacherMode && (
            <div style={styles.banner}>
              <div>
                <div style={{ fontWeight: 950, color: ui.text }}>Leerkrachtmodus</div>
                <div style={{ marginTop: 3, fontSize: 13, color: ui.muted }}>
                  Deze pagina is klaar als invulscherm. Wil je dat leerkrachten <b style={{ color: ui.text }}>leerlingen kunnen selecteren</b> en klasscores kunnen
                  ingeven zoals in Excel? Dan voeg ik een “klas-overzicht + leerling-selector” toe op basis van jullie tabellen.
                </div>
              </div>
              <div style={styles.pill}>TEACHER</div>
            </div>
          )}

          {/* Tests grid */}
          <section style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Onderdelen</div>

            <div className="grid">
              {TESTS.map((t) => (
                <TestCard key={t.key} def={t} value={scores[t.key]} points={computed.pts[t.key]} onChange={(raw) => setOne(t.key, raw)} />
              ))}
            </div>

            <style jsx>{`
              .grid {
                display: grid;
                grid-template-columns: repeat(1, minmax(0, 1fr));
                gap: 14px;
              }
              @media (min-width: 900px) {
                .grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              }
            `}</style>
          </section>

          {/* Summary */}
          <SummaryCard
            total={computed.totalPoints}
            max={computed.maxPoints}
            pct={computed.pct}
            tier={computed.tier}
            date={date}
            schooljaar={profiel?.schooljaar ?? null}
          />
        </>
      ) : activeTab === "resultaten" ? (
        <>
          <SummaryCard
            total={computed.totalPoints}
            max={computed.maxPoints}
            pct={computed.pct}
            tier={computed.tier}
            date={date}
            schooljaar={profiel?.schooljaar ?? null}
          />

          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div style={styles.panel}>
              <div style={{ fontWeight: 950, color: ui.text }}>📊 Detailpunten</div>
              <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                {TESTS.map((t) => (
                  <RowBar key={t.key} label={`${t.icon} ${t.title}`} value={computed.pts[t.key]} max={10} right={`${computed.pts[t.key]}/10`} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12.5, color: ui.muted }}>
                *Puntensysteem is momenteel <b style={{ color: ui.text }}>placeholder</b>. Vervang de punten-normen met je Excel-regels.
              </div>
            </div>

            <div style={styles.panel}>
              <div style={{ fontWeight: 950, color: ui.text }}>🧾 Ingevulde scores</div>
              <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                {TESTS.map((t) => (
                  <div key={t.key} style={styles.kvRow}>
                    <div style={{ color: ui.muted, fontSize: 12.5, minWidth: 0 }}>
                      {t.icon} {t.title}
                    </div>
                    <div style={{ color: ui.text, fontWeight: 950, fontSize: 12.5 }}>
                      {typeof scores[t.key] === "number" ? `${scores[t.key]} ${t.unit}` : "—"}
                    </div>
                  </div>
                ))}
              </div>
              {note?.trim() ? (
                <div style={{ marginTop: 10, color: ui.muted, fontSize: 12.5 }}>
                  <b style={{ color: ui.text }}>Opmerking:</b> {note.trim()}
                </div>
              ) : null}
            </div>

            <div style={styles.actionRow}>
              <button onClick={() => setActiveTab("invullen")} style={styles.blackBtn}>
                Aanpassen →
              </button>
              <button onClick={handleSave} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </>
      ) : activeTab === "info" ? (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Hoe werkt deze pagina?</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.35 }}>
              Dit is het invulscherm voor de <b style={{ color: ui.text }}>Functional Fitheidstest</b> in dezelfde stijl als je dashboard. Leerlingen vullen per
              onderdeel hun score in (zoals op het Excel-invulblad). Daarna zie je een overzicht en kan je opslaan.
              <br />
              <br />
              <b style={{ color: ui.text }}>Belangrijk:</b> de puntberekening in deze versie is een <b style={{ color: ui.text }}>placeholder</b>. Jij hebt een
              Excelbestand met de echte normtabellen. Zodra je die regels (of kolommen) overneemt, kan ik de punten exact laten matchen.
            </div>
          </div>

          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Wat heb je nodig om het 1-op-1 met Excel te matchen?</div>
            <ul style={{ marginTop: 10, color: ui.muted, fontSize: 13.5, lineHeight: 1.35, paddingLeft: 18 }}>
              <li>De lijst met tests + exacte kolomnamen.</li>
              <li>De normtabellen (per leeftijd/geslacht/klas indien van toepassing).</li>
              <li>Hoe de totaalscore berekend wordt (som, gemiddelde, weging, bonus, …).</li>
            </ul>
            <div style={{ marginTop: 10, color: ui.muted, fontSize: 13.5 }}>
              Als je de Excel-lay-out wil spiegelen, zet de afbeeldingen in <code>/public/functional/</code>.
            </div>
          </div>

          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Opslag in Supabase</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.35 }}>
              Deze pagina probeert op te slaan naar <b style={{ color: ui.text }}>functional_fitheidstest_submissions</b>. Als jullie tabel anders heet of andere
              kolommen heeft, pas dat aan in <code>handleSave()</code> en <code>handleLoadLatest()</code>.
            </div>
          </div>
        </div>
      ) : activeTab === "huiswerk" ? (
        <HomeworkTab
          uid={uid!}
          profiel={{
            id: profiel?.id ?? uid!,
            volledige_naam: profiel?.volledige_naam ?? null,
            klas_naam: profiel?.klas_naam ?? null,
            schooljaar: profiel?.schooljaar ?? null,
          }}
          defaultMas={computed.numeric.vma_kmu ?? null}
        />
      ) : null}
    </AppShell>
  );
}

/* ---------------------------
   Hero
--------------------------- */
function HeroFunctional({ greetingName, klasNaam }: { greetingName: string; klasNaam?: string | null }) {
  return (
    <section className="hero" style={hero.wrap}>
      <div style={hero.bgGlow1} />
      <div style={hero.bgGlow2} />

      <div className="heroInner" style={hero.inner}>
        <div style={hero.content}>
          <div style={hero.kicker}>FUNCTIONAL</div>

          <h1
            style={{
              ...hero.title,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            Fitheidstest <span style={hero.accent}>Beast</span> {greetingName}
            <Image src="/hero/beast.png" alt="Beast icoon" width={60} height={60} priority style={{ display: "block", objectFit: "contain" }} />
          </h1>

          <div style={hero.sub}>
            Vul je scores in en bewaak je progressie.
            {klasNaam ? <span style={{ opacity: 0.85 }}> • {klasNaam}</span> : null}
          </div>

          <div style={hero.actions}>
            <Link href="/challenges" style={hero.secondary}>
              Challenges
            </Link>
            <Link href="/eurofittest" style={hero.secondary}>
              Eurofit
            </Link>
            <Link href="/dashboard" style={hero.primary}>
              Dashboard →
            </Link>
          </div>

          <div style={hero.quoteCard}>
            <div style={hero.quoteLabel}>Focus</div>
            <div style={hero.quoteText}>“Meet. Train. Repeat.”</div>
            <div style={hero.quoteAuthor}>— Beast protocol</div>
          </div>
        </div>

        <div className="heroArt" style={hero.artCol}>
          <div style={hero.illuBox}>
            <Image
              src="/hero/sports-transparent.png"
              alt="LO illustratie"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 40vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                padding: 14,
                opacity: 0.96,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .heroInner {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 14px;
          align-items: start;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 700px) {
          .heroInner {
            grid-template-columns: 1fr;
          }
          .heroArt {
            margin-top: 8px;
          }
        }
        @media (max-width: 420px) {
          .hero :global(h1) {
            font-size: 26px !important;
          }
        }
      `}</style>
    </section>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(104,180,255,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(255,104,180,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: { position: "relative" },
  bgGlow1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    left: -120,
    top: -140,
    background: "rgba(104,180,255,0.22)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(255,104,180,0.18)",
    filter: "blur(26px)",
  },
  content: { position: "relative", maxWidth: 620, zIndex: 1 },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },
  title: { margin: "8px 0 0 0", fontSize: 30, lineHeight: 1.05, fontWeight: 980, color: ui.text },
  accent: {
    background: "linear-gradient(90deg, rgba(104,180,255,1), rgba(255,104,180,1))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: { marginTop: 10, fontSize: 13.5, color: ui.muted, maxWidth: 520 },
  actions: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.55)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
  quoteCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    maxWidth: 520,
  },
  quoteLabel: { fontSize: 12, fontWeight: 950, color: ui.muted },
  quoteText: { marginTop: 8, fontSize: 16, fontWeight: 950, color: ui.text, lineHeight: 1.25 },
  quoteAuthor: { marginTop: 8, fontSize: 12.5, color: ui.muted },
  artCol: { position: "relative", zIndex: 1 },
  illuBox: {
    position: "relative",
    width: "100%",
    height: 250,
    borderRadius: 22,
    overflow: "hidden",
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
  },
};

/* ---------------------------
   Components
--------------------------- */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabBtn,
        background: active ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)",
        borderColor: active ? ui.border2 : ui.border,
      }}
    >
      {children}
    </button>
  );
}

function TestCard({
  def,
  value,
  points,
  onChange,
}: {
  def: TestDef;
  value: ScoreValue;
  points: number;
  onChange: (raw: string) => void;
}) {
  const hasImg = Boolean(def.image);

  return (
    <div style={styles.testCard}>
      <div style={styles.testTop}>
        <div style={styles.iconBox}>{def.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={styles.testTitle}>{def.title}</div>
          <div style={styles.testDesc}>{def.desc}</div>
        </div>
        <div style={styles.pointsPill}>{points}/10</div>
      </div>

      {hasImg ? (
        <div style={styles.imgWrap}>
          <div style={styles.imgPad}>
            <Image
              src={def.image!}
              alt={def.title}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                padding: 8,
                opacity: 0.98,
              }}
            />
          </div>
        </div>
      ) : null}

      <div style={styles.inputRow}>
        <div style={{ flex: 1 }}>
          <div style={styles.smallLabel}>Score</div>
          <input
            value={value === "" ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            style={styles.input}
            inputMode={def.inputMode ?? "numeric"}
            placeholder={`0 ${def.unit}`}
            step={def.step ?? 1}
            min={def.min}
            max={def.max}
          />
          {def.hint ? <div style={styles.hint}>{def.hint}</div> : null}
        </div>

        <div style={styles.unitBox}>
          <div style={styles.smallLabel}>Eenheid</div>
          <div style={styles.unitText}>{def.unit}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  total,
  max,
  pct,
  tier,
  date,
  schooljaar,
}: {
  total: number;
  max: number;
  pct: number;
  tier: string;
  date: string;
  schooljaar: string | null;
}) {
  const w = Math.max(0, Math.min(100, pct));

  return (
    <div style={{ ...styles.panel, marginTop: 14 }}>
      <div style={styles.summaryTop}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 }}>🐺 Beast score</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 980, color: ui.text }}>
            {tier} • {total}/{max} punten
          </div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: ui.muted }}>
            Datum: <b style={{ color: ui.text }}>{date}</b>
            {schooljaar ? (
              <>
                {" "}
                • Schooljaar: <b style={{ color: ui.text }}>{schooljaar}</b>
              </>
            ) : null}
          </div>
        </div>

        <div style={styles.summaryPill}>TOTAL</div>
      </div>

      <div style={styles.barWrap}>
        <div style={{ ...styles.barFill, width: `${w}%` }} />
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12.5, color: ui.muted }}>
        <span>
          Progress: <b style={{ color: ui.text }}>{Math.round(w)}%</b>
        </span>
        <span style={{ opacity: 0.9 }}>Tip: houd dezelfde testvoorwaarden aan.</span>
      </div>
    </div>
  );
}

function RowBar({ label, value, max, right }: { label: string; value: number; max: number; right: string }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ color: ui.muted, fontSize: 12.5, minWidth: 0 }}>{label}</div>
        <div style={{ color: ui.text, fontSize: 12.5, fontWeight: 950 }}>{right}</div>
      </div>
      <div style={styles.miniBarWrap}>
        <div style={{ ...styles.miniBarFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------------------
   Styles
--------------------------- */
const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  blackBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.72)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  blackBtnLink: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.72)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  primaryBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "linear-gradient(90deg, rgba(104,180,255,0.28), rgba(255,104,180,0.22)), rgba(0,0,0,0.70)",
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
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
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
  banner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  pill: {
    height: 34,
    padding: "0 12px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${ui.border}`,
    flexShrink: 0,
  },
  tabs: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  tabBtn: {
    height: 46,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
  },
  metaRow: {
    marginTop: 12,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
  },
  metaCard: {
    padding: 14,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  metaLabel: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
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
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },

  testCard: {
    padding: 14,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
    position: "relative",
  },
  testTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
    color: ui.text,
    flexShrink: 0,
  },
  testTitle: { fontSize: 15, fontWeight: 980, color: ui.text, letterSpacing: 0.2 },
  testDesc: { marginTop: 4, fontSize: 12.5, color: ui.muted, lineHeight: 1.25 },
  pointsPill: {
    marginLeft: "auto",
    height: 34,
    padding: "0 12px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${ui.border}`,
    flexShrink: 0,
  },

  imgWrap: {
    marginTop: 12,
    position: "relative",
    width: "100%",
    height: 150,
    borderRadius: 18,
    overflow: "hidden",
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(700px 220px at 10% 20%, rgba(104,180,255,0.12), rgba(0,0,0,0) 60%), radial-gradient(700px 220px at 90% 80%, rgba(255,104,180,0.10), rgba(0,0,0,0) 60%), rgba(0,0,0,0.22)",
  },
  imgPad: {
    position: "absolute",
    inset: 10,
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
  },

  inputRow: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  smallLabel: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
  unitBox: {
    width: 110,
    padding: 12,
    borderRadius: 18,
    background: "rgba(0,0,0,0.28)",
    border: `1px solid ${ui.border}`,
  },
  unitText: { marginTop: 8, fontSize: 13.5, fontWeight: 980, color: ui.text },
  hint: { marginTop: 8, fontSize: 12.5, color: ui.muted, lineHeight: 1.25 },

  summaryTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  summaryPill: {
    height: 34,
    padding: "0 12px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${ui.border}`,
    flexShrink: 0,
  },
  barWrap: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(104,180,255,1), rgba(255,104,180,1))",
  },
  miniBarWrap: {
    height: 10,
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(104,180,255,1), rgba(255,104,180,1))",
  },
  kvRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 16,
    background: "rgba(0,0,0,0.28)",
    border: `1px solid ${ui.border}`,
  },
};

/**
 * ✅ Desktop: metaRow 2 kolommen
 */
(function injectMetaMedia() {
  if (typeof window === "undefined") return;
  const id = "functional-fit-meta-media";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (min-width: 900px) {
      .meta-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
