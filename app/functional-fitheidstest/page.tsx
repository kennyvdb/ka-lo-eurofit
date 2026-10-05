"use client";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import HomeworkTab from "./HomeworkTab";
const supabase = createClient();
const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};
type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
  leerjaar?: number | string | null;
  graad?: number | string | null;
};
const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  okBg: "rgba(37,89,113,0.14)",
  okBorder: "rgba(137,194,170,0.28)",
};
function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
type ScoreValue = number | string;
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
  hint?: string;
  image?: string;
};
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
    image: "/functional/situp-abmat.png",
  },
  {
    key: "wallball_3kg_60s",
    title: "Wallball (5 kg)",
    desc: "Aantal herhalingen in 60 seconden.",
    unit: "reps",
    inputMode: "numeric",
    step: 1,
    min: 0,
    max: 300,
    icon: "🎯",
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
    image: "/functional/handstand.png",
  },
];
function isTeacherRole(p?: Profiel | null) {
  const raw = (p?.role ?? p?.rol ?? "").trim().toLowerCase();
  return ["teacher", "leerkracht", "lo_leerkracht", "admin"].includes(raw);
}
type SavedRow = {
  id: string;
  user_id: string;
  schooljaar: string | null;
  date: string;
  scores: Record<string, number>;
  points: Record<string, number>;
  total_points: number;
  note: string | null;
  created_at: string;
  modifications?: {
    pushups_on_knees?: boolean;
    table_pullup_bent_legs?: boolean;
  };
};
export default function FunctionalFitheidstestPage() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"invullen" | "info" | "huiswerk">("invullen");
  const [date, setDate] = useState(toYMD());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [masInfo, setMasInfo] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<TestKey, ScoreValue>>(() => {
    const obj = {} as Record<TestKey, ScoreValue>;
    for (const t of TESTS) obj[t.key] = "";
    return obj;
  });
  const [modifications, setModifications] = useState({
    pushups_on_knees: false,
    table_pullup_bent_legs: false,
  });
  const computed = useMemo(() => {
    const numeric: Record<TestKey, number> = {} as Record<TestKey, number>;
    for (const t of TESTS) {
      const v = scores[t.key];
      const num = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
      numeric[t.key] = Number.isFinite(num) ? num : 0;
    }
    return { numeric };
  }, [scores]);
  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Beast";
  const teacherMode = isTeacherRole(profiel);
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, role, rol, klas_naam, schooljaar, schooljaar_bevestigd_op, leerjaar, graad")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profiel) ?? null;
  };
  useEffect(() => {
    injectFunctionalResponsiveCSS();
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
  useEffect(() => {
    if (!uid) return;
    const key = `functional-fitheidstest-draft:${uid}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const draft = JSON.parse(saved) as { date?: string; note?: string; scores?: Partial<Record<TestKey, ScoreValue>>; modifications?: { pushups_on_knees?: boolean; table_pullup_bent_legs?: boolean } };
        if (draft.date) setDate(draft.date);
        if (typeof draft.note === "string") setNote(draft.note);
        if (draft.scores) setScores((old) => ({ ...old, ...draft.scores }));
        if (draft.modifications) setModifications({ pushups_on_knees: Boolean(draft.modifications.pushups_on_knees), table_pullup_bent_legs: Boolean(draft.modifications.table_pullup_bent_legs) });
      }
    } catch {
      localStorage.removeItem(key);
    } finally {
      setDraftReady(true);
    }
  }, [uid]);
  useEffect(() => {
    if (!uid || !draftReady) return;
    localStorage.setItem(`functional-fitheidstest-draft:${uid}`, JSON.stringify({ date, note, scores, modifications }));
  }, [uid, draftReady, date, note, scores, modifications]);
  useEffect(() => {
    if (!uid || !draftReady || !profiel?.schooljaar) return;
    let cancelled = false;
    const loadMas = async () => {
      try {
        const { data: discipline, error: disciplineError } = await supabase.from("sportfolio_disciplines").select("id").eq("slug", "mas_test").maybeSingle();
        if (disciplineError) throw disciplineError;
        if (!discipline?.id) return;
        const { data, error: scoreError } = await supabase.from("sportfolio_scores").select("score_nummer, score_tekst, extra_data, bevestigd_op").eq("leerling_id", uid).eq("discipline_id", discipline.id).eq("schooljaar", profiel.schooljaar).eq("status", "bevestigd").order("bevestigd_op", { ascending: false }).limit(1);
        if (scoreError) throw scoreError;
        const latest = data?.[0];
        if (!latest || cancelled) return;
        const rawMas = latest.score_nummer ?? latest.extra_data?.mas_km_u ?? latest.score_tekst;
        const mas = typeof rawMas === "number" ? rawMas : Number(String(rawMas ?? "").trim().replace(",", "."));
        if (!Number.isFinite(mas)) return;
        setScores((old) => String(old.vma_kmu ?? "").trim() ? old : { ...old, vma_kmu: String(mas).replace(".", ",") });
        setMasInfo(`MAS automatisch ingevuld uit Sportfolio: ${String(mas).replace(".", ",")} km/u`);
      } catch {
        // MAS kan nog altijd handmatig ingevuld worden.
      }
    };
    void loadMas();
    return () => { cancelled = true; };
  }, [uid, draftReady, profiel?.schooljaar]);
  const setOne = (k: TestKey, raw: string) => {
    setInfo(null);
    setError(null);
    if (raw.trim() === "") {
      setScores((old) => ({ ...old, [k]: "" }));
      return;
    }
    const def = TESTS.find((t) => t.key === k)!;
    if (def.inputMode === "decimal") {
      if (!/^\d*(?:[.,]\d*)?$/.test(raw)) return;
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) return;
      if (n < (def.min ?? -Infinity) || n > (def.max ?? Infinity)) return;
      setScores((old) => ({ ...old, [k]: raw }));
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(def.min ?? -Infinity, Math.min(def.max ?? Infinity, n));
    setScores((old) => ({ ...old, [k]: clamped }));
  };
  const resetAll = () => {
    setScores(() => {
      const obj = {} as Record<TestKey, ScoreValue>;
      for (const t of TESTS) obj[t.key] = "";
      return obj;
    });
    setNote("");
    setModifications({ pushups_on_knees: false, table_pullup_bent_legs: false });
    setInfo("Alles leeg gemaakt.");
    setMasInfo(null);
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
        // Oude databasekolommen behouden voor compatibiliteit.
        // De app gebruikt geen arbitraire punten op 10 meer.
        points: {},
        total_points: 0,
        modifications,
        note: note.trim() ? note.trim() : null,
      };
      const { error } = await supabase.from("functional_fitheidstest_submissions").insert(payload);
      if (error) throw new Error(error.message);
      localStorage.removeItem(`functional-fitheidstest-draft:${uid}`);
      setInfo("✅ Opgeslagen!");
      window.location.href = "/functional-fitheidstest/resultaten";
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
        .select("id, user_id, schooljaar, date, scores, points, total_points, modifications, note, created_at")
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
      setModifications({
        pushups_on_knees: Boolean(row.modifications?.pushups_on_knees),
        table_pullup_bent_legs: Boolean(row.modifications?.table_pullup_bent_legs),
      });
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
      <BaseHero
        label="Functional"
        title={
          <>
            Fitheidstest{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {greetingName}
            </span>
            <img
              src="/hero/beast.png"
              alt="Beast icoon"
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            />
          </>
        }
        description={
          <>
            Vul je scores in en bewaak je progressie.
            <span className="opacity-85"> • {teacherMode ? "Leerkrachtmodus" : "Leerlingmodus"}</span>
            {profiel?.klas_naam ? <span className="opacity-85"> • {profiel.klas_naam}</span> : null}
          </>
        }
        imageSrc="/functional/functionalfitness.png"
        imageAlt="LO illustratie"
        quoteTitle="Focus"
        quote="Meet. Train. Repeat."
        quoteAuthor="Beast protocol"
        imageClassName="scale-105 md:scale-110 transition-transform duration-500"
        actions={
          <>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-200/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.32),0_0_0_1px_rgba(75,142,141,0.10)]"
            >
              Dashboard →
            </Link>
          </>
        }
      />
      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Vul je scores in zoals op het invulblad.{" "}
            <span style={{ color: ui.text, fontWeight: 950 }}>
              {teacherMode ? "Leerkrachtmodus" : "Leerlingmodus"}
            </span>
            {profiel?.klas_naam ? <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span> : null}
          </div>
        </div>
        <Link href="/dashboard" style={styles.blackBtnLink}>
          Terug →
        </Link>
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
      {masInfo && (
        <div style={styles.okBox}>
          <b>MAS:</b> {masInfo}
        </div>
      )}
      <div style={styles.tabs}>
        <TabBtn active={activeTab === "invullen"} onClick={() => setActiveTab("invullen")}>
          Invullen
        </TabBtn>
        <Link href="/functional-fitheidstest/resultaten" style={styles.tabLink}>
          Resultaten
        </Link>
        <TabBtn active={activeTab === "info"} onClick={() => setActiveTab("info")}>
          Uitleg
        </TabBtn>
        <TabBtn active={activeTab === "huiswerk"} onClick={() => setActiveTab("huiswerk")}>
          Huiswerk
        </TabBtn>
      </div>
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
            <div style={{ marginTop: 6, fontSize: 12, color: ui.muted }}>
              Tip: zet dezelfde datum als op je invulblad.
            </div>
          </div>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>📝 Opmerking (optioneel)</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={styles.input}
              placeholder="bv. blessure, natte zaal, ... "
            />
            <div style={{ marginTop: 6, fontSize: 12, color: ui.muted }}>
              Korte context helpt bij vergelijken.
            </div>
          </div>
        </div>
      ) : null}
      {activeTab === "invullen" ? (
        <>
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
              {saving ? "Opslaan..." : "Alles opslaan"}
            </button>
          </div>
                    <section style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Onderdelen</div>
            <div className="functional-grid" style={styles.gridWrap}>
              {TESTS.map((t) => (
                <TestCard
                  key={t.key}
                  def={t}
                  value={scores[t.key]}
                  onChange={(raw) => setOne(t.key, raw)}
                  modificationChecked={
                    t.key === "pushups_60s"
                      ? modifications.pushups_on_knees
                      : t.key === "table_pullup_invertedrow_60s"
                        ? modifications.table_pullup_bent_legs
                        : undefined
                  }
                  modificationLabel={
                    t.key === "pushups_60s"
                      ? "Op de knieën"
                      : t.key === "table_pullup_invertedrow_60s"
                        ? "Geplooide benen"
                        : undefined
                  }
                  onModificationChange={
                    t.key === "pushups_60s"
                      ? (checked) => setModifications((m) => ({ ...m, pushups_on_knees: checked }))
                      : t.key === "table_pullup_invertedrow_60s"
                        ? (checked) => setModifications((m) => ({ ...m, table_pullup_bent_legs: checked }))
                        : undefined
                  }
                />
              ))}
            </div>
          </section>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Opslaan..." : "Alles opslaan"}
            </button>
          </div>
        </>
      ) : activeTab === "info" ? (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Wat is de functionele fitheidstest?</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.5 }}>
              De <b style={{ color: ui.text }}>functionele fitheidstest</b> is een startmeting die we afnemen
              vóór de leerlingen beginnen aan hun workoutprogramma. Tijdens deze test voeren ze een aantal
              oefeningen uit die verschillende onderdelen van hun fysieke fitheid meten, zoals{" "}
              <b style={{ color: ui.text }}>kracht</b>, <b style={{ color: ui.text }}>uithoudingsvermogen</b>,{" "}
              <b style={{ color: ui.text }}>stabiliteit</b> en <b style={{ color: ui.text }}>mobiliteit</b>.
            </div>
          </div>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Waarom doen we deze meting?</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.5 }}>
              De resultaten vormen een <b style={{ color: ui.text }}>eikpunt (nulmeting)</b>. Zo krijgen de
              leerlingen een duidelijk beeld van hun huidige niveau en weten ze waar ze kunnen groeien.
            </div>
          </div>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Wat gebeurt er daarna?</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.5 }}>
              Na enkele weken training wordt dezelfde test opnieuw uitgevoerd. Door de resultaten te vergelijken,
              kunnen de leerlingen zien of en hoeveel ze vooruitgang hebben geboekt.
            </div>
          </div>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Doel van de test 💪</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.5 }}>
              Het doel is om leerlingen te motiveren, hun evolutie zichtbaar te maken en hen bewust te laten
              werken aan hun eigen fitheid.
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
            role: profiel?.role ?? null,
            rol: profiel?.rol ?? null,
            leerjaar: profiel?.leerjaar ?? null,
            graad: profiel?.graad ?? null,
          }}
          defaultMas={computed.numeric.vma_kmu ?? null}
        />
      ) : null}
    </AppShell>
  );
}
function TabBtn({
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
          ? "linear-gradient(90deg, rgba(37,89,113,0.35), rgba(75,142,141,0.22)), rgba(0,0,0,0.55)"
          : "rgba(0,0,0,0.25)",
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
  onChange,
  modificationChecked,
  modificationLabel,
  onModificationChange,
}: {
  def: TestDef;
  value: ScoreValue;
  onChange: (raw: string) => void;
  modificationChecked?: boolean;
  modificationLabel?: string;
  onModificationChange?: (checked: boolean) => void;
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
      {modificationLabel && onModificationChange ? (
        <label style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, color: ui.text, fontWeight: 900, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={Boolean(modificationChecked)}
            onChange={(e) => onModificationChange(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: brand.teal }}
          />
          <span>{modificationLabel}</span>
        </label>
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
    background: "linear-gradient(90deg, rgba(37,89,113,0.45), rgba(75,142,141,0.35)), rgba(0,0,0,0.70)",
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
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  tabBtn: {
    minWidth: 150,
    flex: "1 1 150px",
    height: 46,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
  },
  tabLink: {
    minWidth: 150,
    flex: "1 1 150px",
    height: 46,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.25)",
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
  metaLabel: {
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
  gridWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 14,
  },
  testCard: {
    padding: 14,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
    position: "relative",
  },
  testTop: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
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
  testTitle: {
    fontSize: 15,
    fontWeight: 980,
    color: ui.text,
    letterSpacing: 0.2,
  },
  testDesc: {
    marginTop: 4,
    fontSize: 12.5,
    color: ui.muted,
    lineHeight: 1.25,
  },
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
      "radial-gradient(700px 220px at 10% 20%, rgba(37,89,113,0.18), rgba(0,0,0,0) 60%), radial-gradient(700px 220px at 90% 80%, rgba(137,194,170,0.16), rgba(0,0,0,0) 60%), rgba(0,0,0,0.22)",
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
  smallLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: ui.muted,
    letterSpacing: 0.6,
  },
  unitBox: {
    width: 110,
    padding: 12,
    borderRadius: 18,
    background: "rgba(0,0,0,0.28)",
    border: `1px solid ${ui.border}`,
  },
  unitText: {
    marginTop: 8,
    fontSize: 13.5,
    fontWeight: 980,
    color: ui.text,
  },
  hint: {
    marginTop: 8,
    fontSize: 12.5,
    color: ui.muted,
    lineHeight: 1.25,
  },
};
function injectFunctionalResponsiveCSS() {
  if (typeof window === "undefined") return;
  const id = "functional-fit-responsive-css";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (min-width: 900px) {
      .meta-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .functional-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(style);
}