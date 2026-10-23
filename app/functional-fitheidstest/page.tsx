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
    max: 7200,
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
type RankRow = { plaats: number; naam: string | null; score: number; schooljaar: string | null };
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
  status?: "in_uitvoering" | "afgerond";
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
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [activePeriod, setActivePeriod] = useState<{id:string;naam:string;schooljaar:string;gesloten_op:string|null}|null>(null);
  const [measurementReady, setMeasurementReady] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [masInfo, setMasInfo] = useState<string | null>(null);
  const [masLoading, setMasLoading] = useState(false);
  const [confirmedMas, setConfirmedMas] = useState<number | null>(null);
  const teacherMode = isTeacherRole(profiel);
  const [rankTest, setRankTest] = useState<TestDef | null>(null);
  const [rankGender, setRankGender] = useState("M");
  const [rankGrade, setRankGrade] = useState(1);
  const [rankAllTime, setRankAllTime] = useState(false);
  const [rankModified, setRankModified] = useState(false);
  const [rankRows, setRankRows] = useState<RankRow[]>([]);
  const [rankBusy, setRankBusy] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);
  useEffect(() => {
    if (!rankTest) return;
    let alive = true;
    setRankBusy(true);
    setRankError(null);
    supabase.rpc("functional_fitheidstest_klassement", { p_test_key: rankTest.key, p_graad: teacherMode ? rankGrade : null, p_geslacht: teacherMode ? rankGender : null, p_aller_tijden: teacherMode && rankAllTime, p_aangepast: rankModified }).then(({data,error}) => {
      if (!alive) return;
      setRankRows((data ?? []) as RankRow[]);
      setRankError(error?.message ?? null);
      setRankBusy(false);
    });
    return () => { alive = false; };
  }, [rankTest,rankGrade,rankGender,rankAllTime,rankModified,teacherMode]);
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
        if (typeof draft.note === "string") setNote(draft.note);
        if (draft.scores) { const otherScores = { ...draft.scores }; delete otherScores.vma_kmu; setScores((old) => ({ ...old, ...otherScores, vma_kmu: "" })); }
        if (draft.modifications) setModifications({ pushups_on_knees: Boolean(draft.modifications.pushups_on_knees), table_pullup_bent_legs: Boolean(draft.modifications.table_pullup_bent_legs) });
      }
    } catch {
      localStorage.removeItem(key);
    } finally {
      setDraftReady(true);
    }
  }, [uid]);
  useEffect(() => {
    if (!uid || !draftReady || !measurementReady) return;
    localStorage.setItem(`functional-fitheidstest-draft:${uid}`, JSON.stringify({ note, scores: { ...scores, vma_kmu: "" }, modifications }));
  }, [uid, draftReady, measurementReady, note, scores, modifications]);
  useEffect(() => {
    if (!uid || !draftReady || !profiel?.schooljaar) return;
    let cancelled = false;
    const loadMas = async () => {
      setMasLoading(true);
      setConfirmedMas(null);
      setMasInfo(null);
      setScores((old) => ({ ...old, vma_kmu: "" }));
      try {
        const { data: discipline, error: disciplineError } = await supabase.from("sportfolio_disciplines").select("id").eq("slug", "mas_test").maybeSingle();
        if (disciplineError) throw disciplineError;
        if (!discipline?.id) { if (!cancelled) setMasInfo("Nog geen MAS-score beschikbaar in Sportfolio."); return; }
        const { data, error: scoreError } = await supabase.from("sportfolio_scores").select("score_nummer, score_tekst, extra_data, bevestigd_op").eq("leerling_id", uid).eq("discipline_id", discipline.id).eq("schooljaar", profiel.schooljaar).eq("status", "bevestigd").order("bevestigd_op", { ascending: false }).limit(1);
        if (scoreError) throw scoreError;
        if (cancelled) return;
        const latest = data?.[0];
        if (!latest) { setMasInfo("Nog geen bevestigde MAS-score beschikbaar in Sportfolio."); return; }
        const rawMas = latest.score_nummer ?? latest.extra_data?.mas_km_u ?? latest.score_tekst;
        const mas = typeof rawMas === "number" ? rawMas : Number(String(rawMas ?? "").trim().replace(",", "."));
        if (!Number.isFinite(mas) || mas <= 0) { setMasInfo("De bevestigde MAS-score kon niet worden gelezen."); return; }
        setConfirmedMas(mas);
        setScores((old) => ({ ...old, vma_kmu: String(mas).replace(".", ",") }));
        setMasInfo(`MAS automatisch overgenomen uit Sportfolio: ${String(mas).replace(".", ",")} km/u (niet aanpasbaar).`);
      } catch {
        if (!cancelled) setMasInfo("MAS-score kon niet worden opgehaald. Probeer de pagina opnieuw te laden.");
      } finally {
        if (!cancelled) setMasLoading(false);
      }
    };
    void loadMas();
    return () => { cancelled = true; };
  }, [uid, draftReady, profiel?.schooljaar]);
  const loadPeriod = async () => {
    if (!uid || !profiel?.schooljaar) { setMeasurementReady(true); return; }
    setMeasurementReady(false);
    const {data:periodRows,error:periodError}=await supabase.from("functional_fitheidstest_meetperiodes")
      .select("id,naam,schooljaar,gesloten_op").eq("schooljaar",profiel.schooljaar).order("aangemaakt_op",{ascending:false});
    if(periodError){setError(periodError.message);setMeasurementReady(true);return;}
    const all=periodRows??[];
    const period=all.find(p=>p.gesloten_op===null)??null;
    setActivePeriod(period);
    if(period){
      const {data:rows,error:rowError}=await supabase.from("functional_fitheidstest_submissions")
        .select("id,user_id,schooljaar,date,scores,points,total_points,modifications,note,created_at,status")
        .eq("user_id",uid).eq("meetperiode_id",period.id).order("created_at",{ascending:true});
      if(rowError)setError(rowError.message);
      else if(rows?.length){
        const merged=rows.reduce((acc,row)=>({...acc,...(row.scores??{})}),{} as Record<string,number>);
        const last=rows[rows.length-1] as SavedRow;
        setNote(last.note??"");
        const mods=rows.reduce((acc,row)=>({...acc,...(row.modifications??{})}),{} as Record<string,boolean>);
        setModifications({pushups_on_knees:Boolean(mods.pushups_on_knees),table_pullup_bent_legs:Boolean(mods.table_pullup_bent_legs)});
        setScores(old=>{const next={...old};for(const t of TESTS)if(t.key!=="vma_kmu")next[t.key]=typeof merged[t.key]==="number"?merged[t.key]:"";return next;});
      }
    }
    setMeasurementReady(true);
  };
  useEffect(()=>{if(uid&&draftReady&&profiel?.schooljaar)void loadPeriod();},[uid,draftReady,profiel?.schooljaar]);
  const setOne = (k: TestKey, raw: string) => {
    if (k === "vma_kmu") return;
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
      for (const t of TESTS) obj[t.key] = t.key === "vma_kmu" && confirmedMas !== null ? String(confirmedMas).replace(".", ",") : "";
      return obj;
    });
    setNote("");
    setModifications({ pushups_on_knees: false, table_pullup_bent_legs: false });
    setInfo("Alles leeg gemaakt.");
    setMasInfo(null);
    setError(null);
  };
  const handleSave = async () => {
    if(!uid||!measurementReady||!activePeriod||saving)return;
    setSaving(true);setError(null);setInfo(null);
    try{
      const currentScores:Record<string,number>={};
      for(const t of TESTS){
        if(t.key==="vma_kmu")continue;
        const raw=scores[t.key];if(String(raw).trim()==="")continue;
        const value=Number(String(raw).replace(",","."));
        if(!Number.isFinite(value)||value<(t.min??0)||value>(t.max??Infinity))throw new Error(`Ongeldige score voor ${t.title}.`);
        currentScores[t.key]=value;
      }
      if(confirmedMas!==null)currentScores.vma_kmu=confirmedMas;
      if(!Object.keys(currentScores).some(key=>key!=="vma_kmu"))throw new Error("Vul eerst minstens één oefening in.");
      const {error}=await supabase.rpc("functional_scores_opslaan",{
        p_meetperiode_id:activePeriod.id,p_scores:currentScores,p_modifications:modifications,p_note:note.trim()||null
      });
      if(error)throw error;
      setInfo("Scores succesvol opgeslagen. Je kunt later verderwerken in dezelfde meetperiode.");
      localStorage.removeItem(`functional-fitheidstest-draft:${uid}`);
      await loadPeriod();
    }catch(e:any){setError(e?.message??"Opslaan mislukt.");}
    finally{setSaving(false);}
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
          <div style={styles.panel}>
            <div style={{fontWeight:900,color:ui.text}}>Meetperiode: {activePeriod?.naam??"Geen open meetperiode"}</div>
            <div style={{marginTop:6,color:ui.muted,fontSize:13}}>{activePeriod?"Je scores worden binnen deze periode aangevuld. Je kunt later verderwerken.":"De leerkracht moet eerst een meetperiode openen."}</div>
            <div style={{marginTop:8,color:ui.muted,fontSize:13}}>{TESTS.filter(t=>t.key!=="vma_kmu"&&String(scores[t.key]).trim()!=="").length} van 11 handmatig in te vullen oefeningen ingevuld</div>
          </div>
          <div style={{...styles.actionRow,marginTop:14}}>
            <button type="button" onClick={resetAll} style={styles.ghostBtn}>Invoer leegmaken</button>
            <button type="button" onClick={()=>void handleSave()} disabled={saving||!measurementReady||!activePeriod} style={{...styles.primaryBtn,opacity:saving||!activePeriod?0.6:1}}>{saving?"Opslaan...":"Scores opslaan"}</button>
          </div>
          <section style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Onderdelen</div>
            <div className="functional-grid" style={styles.gridWrap}>
              {TESTS.map((t) => (
                <TestCard
                  key={t.key}
                  def={t}
                onRank={() => { setRankTest(t); setRankAllTime(false); setRankModified(false); setRankGrade(Number(profiel?.graad) || Math.ceil(Number(profiel?.leerjaar || 1) / 2)); setRankGender("M"); }}
                  value={scores[t.key]}
                  onChange={(raw) => setOne(t.key, raw)}
                readOnly={t.key === "vma_kmu"}
                loadingValue={t.key === "vma_kmu" && masLoading}
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
          defaultMas={confirmedMas}
        />
      ) : null}
    {rankTest && <div role="presentation" onMouseDown={(e) => { if(e.target===e.currentTarget)setRankTest(null); }} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.78)",display:"grid",placeItems:"center",padding:12}}>
  <section role="dialog" aria-modal="true" aria-label={`Klassement ${rankTest.title}`} style={{background:"#102638",color:"white",border:"1px solid #4B8E8D",borderRadius:20,padding:20,width:"min(100%,600px)",maxHeight:"85dvh",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><h2 style={{fontSize:20,fontWeight:900}}>🏆 {rankTest.title}</h2><button type="button" onClick={()=>setRankTest(null)} style={{padding:10,color:"white"}} aria-label="Sluiten">✕</button></div>
    {["pushups_60s","table_pullup_invertedrow_60s"].includes(rankTest.key) && <label style={{display:"block",marginTop:14}}>Uitvoering <select value={rankModified ? "aangepast" : "standaard"} onChange={e=>setRankModified(e.target.value==="aangepast")} style={{color:"#111",padding:8,borderRadius:8,marginLeft:8}}><option value="standaard">{rankTest.key==="pushups_60s" ? "Gewone push-ups" : "Gestrekte benen"}</option><option value="aangepast">{rankTest.key==="pushups_60s" ? "Op de knieën" : "Geplooide benen"}</option></select></label>}
  {teacherMode ? <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:14}}>
      <label>Geslacht <select value={rankGender} onChange={e=>setRankGender(e.target.value)} style={{color:"#111",padding:8,borderRadius:8}}><option value="M">Jongens</option><option value="V">Meisjes</option></select></label>
      <label>Graad <select value={rankGrade} onChange={e=>setRankGrade(Number(e.target.value))} style={{color:"#111",padding:8,borderRadius:8}}>{[1,2,3].map(g=><option key={g} value={g}>{g}e graad</option>)}</select></label>
      <label>Periode <select value={rankAllTime?"all":"current"} onChange={e=>setRankAllTime(e.target.value==="all")} style={{color:"#111",padding:8,borderRadius:8}}><option value="current">Dit schooljaar</option><option value="all">Aller tijden</option></select></label>
    </div> : <p style={{marginTop:10,opacity:.8}}>Dit schooljaar · jouw geslacht · jouw graad · anoniem</p>}
    {rankBusy ? <p style={{marginTop:20}}>Klassement laden…</p> : rankError ? <p role="alert" style={{marginTop:20,color:"#ffb4b4"}}>{rankError}</p> : rankRows.length===0 ? <p style={{marginTop:20}}>Nog geen resultaten beschikbaar.</p> : <div style={{overflowX:"auto",marginTop:18}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left",padding:8}}>Plaats</th>{teacherMode&&<th style={{textAlign:"left",padding:8}}>Naam</th>}<th style={{textAlign:"right",padding:8}}>Score</th>{teacherMode&&rankAllTime&&<th style={{textAlign:"right",padding:8}}>Schooljaar</th>}</tr></thead><tbody>{rankRows.map((r,i)=><tr key={i} style={{borderTop:"1px solid #ffffff25"}}><td style={{padding:8}}>{r.plaats}</td>{teacherMode&&<td style={{padding:8}}>{r.naam??"—"}</td>}<td style={{padding:8,textAlign:"right"}}>{r.score.toLocaleString("nl-BE")} {rankTest.unit}</td>{teacherMode&&rankAllTime&&<td style={{padding:8,textAlign:"right"}}>{r.schooljaar}</td>}</tr>)}</tbody></table></div>}
  </section>
</div>}
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
type ExerciseGuide = { spiergroepen: string; uitvoering: string[]; aandacht: string[]; geldig: string; ongeldig: string };
const EXERCISE_GUIDES: Partial<Record<TestKey, ExerciseGuide>> = {
  situp_floor_tap_60s: { spiergroepen: "Buikspieren (vooral rechte buikspier); heupbuigers helpen mee.", uitvoering: ["Ga op je rug liggen met gebogen knieën en de voeten op de grond.", "Raak met je handen de vloer achter je hoofd aan en kom rechtop tot je de vloer bij je voeten aantikt.", "Herhaal gedurende 60 seconden."], aandacht: ["Houd de voeten zoveel mogelijk op de grond.", "Werk gecontroleerd en gebruik dezelfde bewegingsuitslag bij elke herhaling."], geldig: "Beide aantikpunten worden bereikt: achter het hoofd en bij de voeten.", ongeldig: "Geen volledige beweging of de aantikpunten niet bereikt." },
  wallball_3kg_60s: { spiergroepen: "Bovenbenen (quadriceps), bilspieren en schouders; rompstabiliteit.", uitvoering: ["Houd de wallball voor je borst en sta voor het afgesproken doel.", "Zak in een squat en kom krachtig recht om de bal naar het doel te werpen.", "Vang de bal op en herhaal gedurende 60 seconden."], aandacht: ["Gebruik het afgesproken balgewicht (op de kaart: 5 kg).", "Zak telkens voldoende diep en werp naar de afgesproken doelhoogte."], geldig: "Correcte squat én de bal raakt het afgesproken doel.", ongeldig: "Onvoldoende squatdiepte of het doel wordt niet geraakt." },
  pushups_60s: { spiergroepen: "Borstspieren, triceps en voorste schouders; buikspieren stabiliseren.", uitvoering: ["Start in hoge plank met handen onder of iets breder dan de schouders.", "Buig je ellebogen tot de borst bijna de grond raakt.", "Duw terug omhoog met gestrekte armen gedurende 60 seconden."], aandacht: ["Houd romp en benen in één lijn.", "Vermijd doorhangende heupen en halve herhalingen.", "Push-ups op de knieën moeten afzonderlijk worden aangeduid."], geldig: "Volledige neerwaartse en opwaartse beweging met stabiele romp.", ongeldig: "Onvoldoende zakken, niet uitstrekken of verlies van correcte lichaamshouding." },
  burpees_60s: { spiergroepen: "Hele lichaam: bovenbenen, bilspieren, borst, schouders, triceps en romp.", uitvoering: ["Start rechtop, plaats je handen op de grond en breng je voeten naar achter in plank.", "Breng je voeten weer naar voren en kom rechtop met een sprong.", "Herhaal gedurende 60 seconden."], aandacht: ["Houd je romp stevig in plank.", "Volg steeds dezelfde afgesproken variant; een borstcontact met de grond telt alleen als dat vooraf is afgesproken."], geldig: "De volledige afgesproken cyclus van staand naar plank en terug met sprong is uitgevoerd.", ongeldig: "Een fase overslaan of niet volledig rechtkomen." },
  wallsit_time_s: { spiergroepen: "Vooral bovenbenen (quadriceps); bilspieren helpen stabiliseren.", uitvoering: ["Leun met je rug tegen de muur.", "Zak tot je knieën ongeveer 90 graden gebogen zijn.", "Houd de houding zo lang mogelijk vast; de score is in seconden."], aandacht: ["Houd de rug tegen de muur en de voeten stabiel.", "Steun niet met je handen op je bovenbenen."], geldig: "De houding blijft correct met ongeveer 90 graden kniebuiging.", ongeldig: "De heupen komen omhoog, de handen steunen op de benen of de houding wordt verlaten." },
  table_pullup_invertedrow_60s: { spiergroepen: "Bovenrug (brede rugspier en spieren tussen schouderbladen), biceps en achterste schouders.", uitvoering: ["Neem een stevige, veilige stang of tafelrand vast en hang eronder met het lichaam gestrekt.", "Trek je borst gecontroleerd richting stang of rand.", "Laat je terug zakken tot de armen gestrekt zijn; herhaal 60 seconden."], aandacht: ["Controleer vooraf de stabiliteit van het materiaal.", "Houd romp en heupen in lijn.", "Geplooide benen moeten afzonderlijk worden aangeduid."], geldig: "De borst bereikt de afgesproken hoogte en de armen strekken opnieuw.", ongeldig: "Halve trekbeweging, heupen laten zakken of onvoldoende armstrekking." },
  plank_time_s: { spiergroepen: "Romp: rechte en schuine buikspieren, diepe rompspieren; billen en schouders stabiliseren.", uitvoering: ["Steun op je onderarmen en tenen, met ellebogen onder de schouders.", "Span buik en billen aan en houd je lichaam in één rechte lijn.", "Houd de positie zo lang mogelijk vast."], aandacht: ["Adem rustig door.", "Vermijd doorhangende of te hoog geheven heupen."], geldig: "Een stabiele rechte lijn van schouders tot hielen blijft behouden.", ongeldig: "Heupen zakken of stijgen duidelijk, of knieën raken de grond." },
  box_jumps_60s: { spiergroepen: "Bovenbenen (quadriceps), bilspieren en kuiten.", uitvoering: ["Ga voor een stabiele box op de afgesproken hoogte staan.", "Spring met beide voeten op de box en kom volledig rechtop.", "Stap of spring veilig terug naar beneden en herhaal 60 seconden."], aandacht: ["Gebruik een antislipbox en zorg voor voldoende vrije ruimte.", "Land zacht met gebogen knieën."], geldig: "Beide voeten landen op de box en je staat bovenaan volledig recht.", ongeldig: "Niet volledig rechtstaan, de box missen of onveilig landen." },
  dips_chairdips_60s: { spiergroepen: "Vooral triceps; borstspieren en voorste schouders helpen mee.", uitvoering: ["Plaats je handen op een stevige bank of stoel achter je, met voeten voor je.", "Buig je ellebogen om je lichaam gecontroleerd te laten zakken.", "Duw omhoog tot je armen bijna gestrekt zijn; herhaal 60 seconden."], aandacht: ["Gebruik materiaal dat niet kan schuiven.", "Houd schouders laag en forceer geen pijnlijke bewegingsuitslag."], geldig: "Een duidelijke gecontroleerde neerwaartse en opwaartse beweging.", ongeldig: "Enkel korte veerbewegingen of afzetten met de benen in plaats van de armen." },
  airsquats_60s: { spiergroepen: "Bovenbenen (quadriceps), bilspieren en hamstrings; romp stabiliseert.", uitvoering: ["Sta met voeten ongeveer op schouderbreedte.", "Buig knieën en heupen en zak tot de afgesproken diepte.", "Kom volledig rechtop en herhaal gedurende 60 seconden."], aandacht: ["Houd de hielen op de grond en knieën in de richting van de tenen.", "Houd de rug neutraal."], geldig: "De afgesproken squatdiepte wordt bereikt en heupen en knieën strekken bovenaan.", ongeldig: "Te ondiep zakken of niet volledig rechtkomen." },
  handstand_hold_time_s: { spiergroepen: "Schouders, triceps en rompspieren; polsen en onderarmen stabiliseren.", uitvoering: ["Plaats je handen stevig op de grond, ongeveer schouderbreed.", "Kom gecontroleerd in handstand tegen een muur als steun volgens de afspraak.", "Houd de houding zo lang mogelijk vast."], aandacht: ["Gebruik een veilige ondergrond en laat waar nodig iemand beveiligen.", "Span de romp aan en voorkom overmatig holtrekken."], geldig: "De afgesproken handstandpositie blijft behouden zonder bijkomende steun.", ongeldig: "Voeten komen op de grond of de afgesproken handstandpositie wordt verlaten." }
};
function TestCard({
  def,
  value,
  onChange,
  modificationChecked,
  modificationLabel,
  onModificationChange,
  onRank,
  readOnly = false,
  loadingValue = false,
}: {
  def: TestDef;
  onRank: () => void;
  readOnly?: boolean;
  loadingValue?: boolean;
  value: ScoreValue;
  onChange: (raw: string) => void;
  modificationChecked?: boolean;
  modificationLabel?: string;
  onModificationChange?: (checked: boolean) => void;
}) {
  const hasImg = Boolean(def.image);
  const [showGuide, setShowGuide] = useState(false);
  const guide = EXERCISE_GUIDES[def.key];
  return (
    <div style={{...styles.testCard,position:"relative"}}>
      <button type="button" onClick={onRank} title={`Klassement ${def.title}`} aria-label={`Klassement ${def.title}`} style={{position:"absolute",top:12,right:12,zIndex:3,border:"1px solid rgba(255,255,255,.2)",background:"#255971",color:"white",borderRadius:12,padding:"9px 11px",cursor:"pointer",fontSize:19}}>🏆</button>
      <div style={{...styles.testTop,paddingRight:48}}>
        <div style={styles.iconBox}>{def.icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={styles.testTitle}>{def.title}</div>
          <div style={styles.testDesc}>{def.desc}</div>
        </div>
      </div>
      {guide ? <button type="button" onClick={() => setShowGuide(true)} style={{marginTop:12,padding:"9px 13px",borderRadius:12,border:"1px solid rgba(137,194,170,.45)",background:"rgba(37,89,113,.45)",color:"white",fontWeight:800,cursor:"pointer"}}>ⓘ Uitleg & aandachtspunten</button> : null}
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
            readOnly={readOnly}
            style={{...styles.input,opacity:readOnly?0.8:1,cursor:readOnly?"not-allowed":undefined}}
            inputMode={def.inputMode ?? "numeric"}
            placeholder={`0 ${def.unit}`}
            step={def.step ?? 1}
            min={def.min}
            max={def.max}
          />
          {readOnly ? <div style={styles.hint}>{loadingValue ? "MAS-score laden uit Sportfolio…" : "Deze score wordt automatisch door de LO-leerkracht bevestigd in Sportfolio en kan hier niet worden aangepast."}</div> : null}
        {def.hint ? <div style={styles.hint}>{def.hint}</div> : null}
        </div>
        <div style={styles.unitBox}>
          <div style={styles.smallLabel}>Eenheid</div>
          <div style={styles.unitText}>{def.unit}</div>
        </div>
      </div>
      {showGuide && guide ? <div role="presentation" onMouseDown={(e) => {if(e.target===e.currentTarget)setShowGuide(false);}} style={{position:"fixed",inset:0,zIndex:10020,background:"rgba(0,0,0,.8)",display:"grid",placeItems:"center",padding:12}}><section role="dialog" aria-modal="true" aria-label={`Uitvoering ${def.title}`} style={{background:"#102638",color:"white",border:"1px solid #4B8E8D",borderRadius:20,padding:20,width:"min(100%,580px)",maxHeight:"85dvh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><h2 style={{fontSize:19,fontWeight:900}}>{def.icon} {def.title}</h2><button type="button" onClick={() => setShowGuide(false)} aria-label="Sluiten" style={{padding:10,color:"white"}}>✕</button></div><h3 style={{fontWeight:900,marginTop:16,color:"#89C2AA"}}>💪 Geteste spiergroepen</h3><p style={{marginTop:5}}>{guide.spiergroepen}</p><h3 style={{fontWeight:900,marginTop:16}}>Uitvoering</h3><ol style={{paddingLeft:22,listStyle:"decimal",marginTop:6}}>{guide.uitvoering.map((item,i)=><li key={i} style={{marginBottom:6}}>{item}</li>)}</ol><h3 style={{fontWeight:900,marginTop:16}}>Aandachtspunten</h3><ul style={{paddingLeft:22,listStyle:"disc",marginTop:6}}>{guide.aandacht.map((item,i)=><li key={i} style={{marginBottom:6}}>{item}</li>)}</ul><h3 style={{fontWeight:900,marginTop:16,color:"#89C2AA"}}>✓ Geldige herhaling / houding</h3><p style={{marginTop:5}}>{guide.geldig}</p><h3 style={{fontWeight:900,marginTop:16,color:"#ffb4b4"}}>✕ Niet geldig</h3><p style={{marginTop:5}}>{guide.ongeldig}</p><button type="button" onClick={() => setShowGuide(false)} style={{marginTop:20,padding:"11px 18px",borderRadius:12,background:"#255971",color:"white",fontWeight:900}}>Begrepen</button></section></div> : null}
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
