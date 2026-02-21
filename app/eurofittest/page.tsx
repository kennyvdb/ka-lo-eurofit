"use client";

import AppShell from "@/components/AppShell";
import ProfileRequiredGate from "@/components/ProfileRequiredGate";
import { checkProfileCompletion } from "@/lib/profileCompletion";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/* ---------------------------
   Types
--------------------------- */
type EurofitResult = {
  id: string;
  test_datum: string; // YYYY-MM-DD
  test_type: string;
  waarde: number;
  eenheid: string;
  schooljaar?: string | null;
  aangemaakt_op?: string;
};

type Geslacht = "jongen" | "meisje";

type NormRow = {
  test_type: string;
  geslacht: Geslacht;
  leeftijd: number;
  p5: number;
  p10: number;
  p20: number;
  p30: number;
  p40: number;
  p50: number;
  p60: number;
  p70: number;
  p80: number;
  p90: number;
  p95: number;
};

type Beoordeling =
  | { label: "Zeer zwak"; kleur: string }
  | { label: "Zwak"; kleur: string }
  | { label: "Gemiddeld zwak"; kleur: string }
  | { label: "Gemiddeld goed"; kleur: string }
  | { label: "Goed"; kleur: string }
  | { label: "Zeer goed"; kleur: string };

/* ---------------------------
   Tests (auto image)
   Verwacht: /public/eurofit/<test_type>.png
--------------------------- */
const TESTS = [
  { value: "flamingo", label: "Flamingo balans", eenheid: "fouten", icon: "🦩", desc: "Aantal fouten in 60 seconden." },
  { value: "plate_tapping", label: "Plate tapping", eenheid: "sec", icon: "🖐️", desc: "Tijd (sec)." },
  { value: "sit_and_reach", label: "Sit & reach", eenheid: "cm", icon: "🧘", desc: "Reikwijdte (cm)." },
  { value: "standing_broad_jump", label: "Verspringen uit stand", eenheid: "cm", icon: "🦘", desc: "Afstand (cm)." },
  { value: "handgrip", label: "Handknijpkracht", eenheid: "kg", icon: "✊", desc: "Kracht (kg)." },
  { value: "sit_ups", label: "Sit-ups (30s)", eenheid: "aantal", icon: "💪", desc: "Herhalingen in 30 sec." },
  { value: "bent_arm_hang", label: "Bent-arm hang", eenheid: "sec", icon: "🪝", desc: "Tijd (sec)." },
  { value: "shuttle_10x5", label: "10×5 shuttle run", eenheid: "sec", icon: "⚡", desc: "Tijd (sec)." },
  { value: "shuttle_20m", label: "20m shuttle run", eenheid: "stages", icon: "🏃", desc: "Stages/min." },
] as const;

type TestType = (typeof TESTS)[number]["value"];

type TestMeta = {
  value: TestType;
  label: string;
  eenheid: string;
  icon: string;
  desc: string;
  image: string;
};

function getTestMeta(testType: string): TestMeta {
  const found = TESTS.find((t) => t.value === (testType as TestType)) ?? TESTS[0];
  return {
    ...found,
    image: `/eurofit/${found.value}.png`,
  };
}

/* ---------------------------
   Lower is better
--------------------------- */
const LOWER_IS_BETTER = new Set<string>(["flamingo", "plate_tapping", "shuttle_10x5"]);

/* ---------------------------
   Helpers
--------------------------- */
function bepaalSchooljaar(testDatum: string) {
  const d = new Date(testDatum);
  const jaar = d.getFullYear();
  const maand = d.getMonth() + 1;
  if (maand >= 9) return `${jaar}-${jaar + 1}`;
  return `${jaar - 1}-${jaar}`;
}

function berekenLeeftijd(geboortedatumISO: string, testDatumISO: string) {
  const birth = new Date(geboortedatumISO);
  const test = new Date(testDatumISO);

  let leeftijd = test.getFullYear() - birth.getFullYear();
  const m = test.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && test.getDate() < birth.getDate())) leeftijd--;

  if (leeftijd > 17) leeftijd = 17;
  if (leeftijd < 9) leeftijd = 9;

  return leeftijd;
}

/**
 * ✅ Correcte interpretatie:
 * - Hoger = beter: p5 is zwak (laag), p95 is sterk (hoog)
 * - Lager = beter: p5 is sterk (laag), p95 is zwak (hoog)
 */
function beoordeelWaarde(waarde: number, norm: NormRow): Beoordeling {
  const lowerBetter = LOWER_IS_BETTER.has(norm.test_type);

  const COLORS = {
    zeerZwak: "#7a0000",
    zwak: "#ff8c00",
    gemZwak: "#ffc966",
    gemGoed: "#a6f3a6",
    goed: "#2e8b57",
    zeerGoed: "#0f5a2f",
  };

  if (!lowerBetter) {
    if (waarde <= norm.p5) return { label: "Zeer zwak", kleur: COLORS.zeerZwak };
    if (waarde < norm.p20) return { label: "Zwak", kleur: COLORS.zwak };
    if (waarde < norm.p50) return { label: "Gemiddeld zwak", kleur: COLORS.gemZwak };
    if (waarde < norm.p80) return { label: "Gemiddeld goed", kleur: COLORS.gemGoed };
    if (waarde < norm.p95) return { label: "Goed", kleur: COLORS.goed };
    return { label: "Zeer goed", kleur: COLORS.zeerGoed };
  }

  // lager = beter (omgekeerd)
  if (waarde <= norm.p5) return { label: "Zeer goed", kleur: COLORS.zeerGoed };
  if (waarde <= norm.p20) return { label: "Goed", kleur: COLORS.goed };
  if (waarde <= norm.p50) return { label: "Gemiddeld goed", kleur: COLORS.gemGoed };
  if (waarde <= norm.p80) return { label: "Gemiddeld zwak", kleur: COLORS.gemZwak };
  if (waarde <= norm.p95) return { label: "Zwak", kleur: COLORS.zwak };
  return { label: "Zeer zwak", kleur: COLORS.zeerZwak };
}

async function handleSessionError(sessionError: any): Promise<boolean> {
  const msg = String(sessionError?.message ?? "").toLowerCase();
  if (msg.includes("invalid refresh token") || msg.includes("refresh token not found")) {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
    return true;
  }
  return false;
}

/* ---------------------------
   UI tokens
--------------------------- */
const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  okBg: "rgba(104,180,255,0.10)",
  okBorder: "rgba(104,180,255,0.24)",
};

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
  },

  blackBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border2,
    background: "rgba(0,0,0,0.72)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  blackBtnLink: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border2,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border2,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.errorBorder,
    color: ui.text,
    fontSize: 14,
  },
  okBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.okBg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.okBorder,
    color: ui.text,
    fontSize: 14,
  },
  warnBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.warnBg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.warnBorder,
    color: ui.text,
    fontSize: 14,
  },

  tabs: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  tabBtn: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
  },
  metaLabel: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
  input: {
    marginTop: 10,
    width: "100%",
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    color: ui.text,
    flexShrink: 0,
  },
  testTitle: { fontSize: 15, fontWeight: 980, color: ui.text, letterSpacing: 0.2 },
  testDesc: { marginTop: 4, fontSize: 12.5, color: ui.muted, lineHeight: 1.25 },

  pill: {
    marginLeft: "auto",
    minHeight: 34,
    padding: "6px 10px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  inputRow: { marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" },
  smallLabel: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
  unitBox: {
    width: 110,
    padding: 12,
    borderRadius: 18,
    background: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
  },
  unitText: { marginTop: 8, fontSize: 13.5, fontWeight: 980, color: ui.text },
  hint: { marginTop: 8, fontSize: 12.5, color: ui.muted2, lineHeight: 1.25 },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12.5,
    color: "#fff",
    whiteSpace: "nowrap",
  },

  imgWrap: {
    marginTop: 12,
    position: "relative",
    width: "100%",
    height: 150,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    background:
      "radial-gradient(700px 220px at 10% 20%, rgba(104,180,255,0.12), rgba(0,0,0,0) 60%), radial-gradient(700px 220px at 90% 80%, rgba(255,104,180,0.10), rgba(0,0,0,0) 60%), rgba(0,0,0,0.22)",
  },
  imgPad: {
    position: "absolute",
    inset: 10,
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    overflow: "hidden",
  },
};

/* ---------------------------
   Page
--------------------------- */
export default function EurofittestPage() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [profileReady, setProfileReady] = useState<null | {
    isReady: boolean;
    missing: string[];
    currentSchoolYear: string;
  }>(null);

  const [geslacht, setGeslacht] = useState<Geslacht | null>(null);
  const [geboortedatum, setGeboortedatum] = useState<string | null>(null);
  const [volledigeNaam, setVolledigeNaam] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [testDatum, setTestDatum] = useState(today);

  const [activeTab, setActiveTab] = useState<"invullen" | "resultaten" | "info">("invullen");

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const t of TESTS) init[t.value] = "";
    return init;
  });

  const [norms, setNorms] = useState<Record<string, NormRow | null>>({});
  const [normLoading, setNormLoading] = useState(false);

  const [results, setResults] = useState<EurofitResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);

  // ✅ inject responsive CSS (zonder styled-jsx)
  useEffect(() => {
    injectEurofitResponsiveCSS();
  }, []);

  // profiel check
  useEffect(() => {
    const run = async () => {
      const res = await checkProfileCompletion();
      setProfileReady(res);
    };
    run();
  }, []);

  // init
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        const handled = await handleSessionError(sessionError);
        if (handled) return;

        setError(sessionError.message);
        setLoading(false);
        return;
      }

      const userId = data.session?.user?.id ?? null;
      setUid(userId);

      if (!userId) {
        setLoading(false);
        return;
      }

      const prof = await supabase
        .from("profielen")
        .select("geslacht, geboortedatum, volledige_naam")
        .eq("id", userId)
        .single();

      if (prof.error) {
        setError("Kon profiel niet laden (geslacht/geboortedatum ontbreekt?).");
      } else {
        setGeslacht((prof.data?.geslacht as Geslacht) ?? null);
        setGeboortedatum(prof.data?.geboortedatum ?? null);
        setVolledigeNaam(prof.data?.volledige_naam ?? null);
      }

      await loadMyResults(userId);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMyResults = async (userId: string) => {
    const { data, error } = await supabase
      .from("eurofittest_resultaten")
      .select("id, test_datum, test_type, waarde, eenheid, schooljaar, aangemaakt_op")
      .eq("leerling_id", userId)
      .order("test_datum", { ascending: false })
      .order("aangemaakt_op", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }
    setResults((data ?? []) as EurofitResult[]);
  };

  // norms (leeftijd + geslacht + testDatum)
  useEffect(() => {
    const run = async () => {
      setError(null);

      const reset: Record<string, NormRow | null> = {};
      for (const t of TESTS) reset[t.value] = null;
      setNorms(reset);

      if (!geslacht || !geboortedatum || !testDatum) return;

      const leeftijd = berekenLeeftijd(geboortedatum, testDatum);
      const testTypes = TESTS.map((t) => t.value);

      setNormLoading(true);

      const { data, error } = await supabase
        .from("eurofit_normen")
        .select("test_type, geslacht, leeftijd, p5,p10,p20,p30,p40,p50,p60,p70,p80,p90,p95")
        .eq("geslacht", geslacht)
        .eq("leeftijd", leeftijd)
        .in("test_type", testTypes);

      setNormLoading(false);

      if (error) {
        setError("Kon normen niet laden.");
        return;
      }

      const map: Record<string, NormRow | null> = {};
      for (const t of TESTS) map[t.value] = null;
      for (const row of (data ?? []) as NormRow[]) {
        map[row.test_type] = row;
      }
      setNorms(map);

      const missing = TESTS.filter((t) => !map[t.value]).map((t) => t.label);
      if (missing.length > 0) {
        setError(`Let op: geen norm gevonden voor: ${missing.join(", ")}`);
      }
    };

    run();
  }, [geslacht, geboortedatum, testDatum]);

  const schooljaarLive = useMemo(() => bepaalSchooljaar(testDatum), [testDatum]);
  const leeftijdLive = useMemo(() => {
    if (!geboortedatum || !testDatum) return null;
    return berekenLeeftijd(geboortedatum, testDatum);
  }, [geboortedatum, testDatum]);

  const greetingName = volledigeNaam?.split(" ")?.[0] ?? "Beast";

  function setScore(testType: string, value: string) {
    setInfo(null);
    setError(null);
    setScores((prev) => ({ ...prev, [testType]: value }));
  }

  function getLiveBeoordeling(testType: string): Beoordeling | null {
    const raw = scores[testType];
    const num = Number(raw);
    if (raw === "" || Number.isNaN(num)) return null;
    const norm = norms[testType];
    if (!norm) return null;
    return beoordeelWaarde(num, norm);
  }

  const resetAll = () => {
    const cleared: Record<string, string> = {};
    for (const t of TESTS) cleared[t.value] = "";
    setScores(cleared);
    setInfo("Alles leeg gemaakt.");
    setError(null);
  };

  const handleSaveAll = async () => {
    if (!uid) return;
    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      if (!geslacht || !geboortedatum) {
        throw new Error("Je profiel mist geslacht en/of geboortedatum. Vul dit aan bij Profiel.");
      }

      const inserts: any[] = [];

      for (const t of TESTS) {
        const raw = scores[t.value];
        if (!raw) continue;

        const num = Number(raw);
        if (Number.isNaN(num)) throw new Error(`Ongeldige score bij ${t.label}.`);

        inserts.push({
          test_datum: testDatum,
          test_type: t.value,
          waarde: num,
          eenheid: t.eenheid,
          schooljaar: schooljaarLive,
          leerling_id: uid,
        });
      }

      if (inserts.length === 0) throw new Error("Vul minstens één score in.");

      const { error } = await supabase.from("eurofittest_resultaten").insert(inserts);
      if (error) throw new Error(error.message);

      setInfo("✅ Opgeslagen!");
      await loadMyResults(uid);
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
      const { data: latest, error: e1 } = await supabase
        .from("eurofittest_resultaten")
        .select("test_datum")
        .eq("leerling_id", uid)
        .order("test_datum", { ascending: false })
        .order("aangemaakt_op", { ascending: false })
        .limit(1);

      if (e1) throw new Error(e1.message);
      const latestDate = (latest?.[0] as any)?.test_datum as string | undefined;
      if (!latestDate) {
        setInfo("Geen vorige meting gevonden.");
        return;
      }

      const { data: rows, error: e2 } = await supabase
        .from("eurofittest_resultaten")
        .select("test_type, waarde")
        .eq("leerling_id", uid)
        .eq("test_datum", latestDate);

      if (e2) throw new Error(e2.message);

      const nextScores: Record<string, string> = {};
      for (const t of TESTS) nextScores[t.value] = "";
      for (const r of (rows ?? []) as any[]) {
        if (typeof r?.test_type === "string") nextScores[r.test_type] = String(r?.waarde ?? "");
      }

      setTestDatum(latestDate);
      setScores(nextScores);
      setInfo("Laatste meting geladen.");
      setActiveTab("invullen");
    } catch (e: any) {
      setError(e?.message ?? "Laden mislukt.");
    } finally {
      setLoadingLatest(false);
    }
  };

  /* ---------------------------
     Guards
  --------------------------- */
  if (!profileReady) {
    return (
      <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={volledigeNaam ?? undefined}>
        <div style={{ color: ui.text }}>Laden...</div>
      </AppShell>
    );
  }

  if (!profileReady.isReady) {
    return (
      <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={volledigeNaam ?? undefined}>
        <ProfileRequiredGate missing={profileReady.missing} currentSchoolYear={profileReady.currentSchoolYear} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Eurofit" userName={volledigeNaam ?? undefined}>
        <div style={{ color: ui.text }}>Eurofit laden…</div>
      </AppShell>
    );
  }

  if (!uid) {
    return (
      <AppShell title="LO App" subtitle="Eurofit">
        <div style={styles.panel}>
          <div style={{ fontWeight: 980, color: ui.text }}>Eurofittest</div>
          <div style={{ marginTop: 8, color: ui.muted }}>Je bent niet ingelogd.</div>
          <Link href="/login" style={{ ...styles.blackBtnLink, marginTop: 12 }}>
            Naar login →
          </Link>
        </div>
      </AppShell>
    );
  }

  /* ---------------------------
     Render
  --------------------------- */
  return (
    <AppShell title="LO App" subtitle="Eurofittest" userName={volledigeNaam ?? undefined}>
      <HeroEurofit greetingName={greetingName} />

      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Vul je Eurofit-scores in.{" "}
            {normLoading ? (
              <span style={{ color: ui.text, fontWeight: 950 }}>Normen laden…</span>
            ) : (
              <span style={{ color: ui.muted2 }}>Normen staan klaar.</span>
            )}
            {leeftijdLive !== null ? <span style={{ color: ui.muted }}> • Leeftijd: {leeftijdLive}</span> : null}
            {geslacht ? <span style={{ color: ui.muted }}> • Geslacht: {geslacht}</span> : null}
            <span style={{ color: ui.muted }}> • Schooljaar: {schooljaarLive}</span>
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

      {!geslacht || !geboortedatum ? (
        <div style={styles.warnBox}>
          Je profiel mist <b>geslacht</b> en/of <b>geboortedatum</b>. Vul dit aan bij <b>Profiel</b>, anders kan ik geen normen berekenen.
        </div>
      ) : null}

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
      </div>

      <div className="meta-grid-2" style={styles.metaRow}>
        <div style={styles.metaCard}>
          <div style={styles.metaLabel}>📅 Testdatum</div>
          <input type="date" value={testDatum} onChange={(e) => setTestDatum(e.target.value)} style={styles.input} />
          <div style={{ marginTop: 6, fontSize: 12, color: ui.muted }}>Tip: zet dezelfde datum als op je invulblad.</div>
        </div>

        <div style={styles.metaCard}>
          <div style={styles.metaLabel}>🧾 Acties</div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleLoadLatest} disabled={loadingLatest} style={{ ...styles.blackBtn, opacity: loadingLatest ? 0.7 : 1 }}>
              {loadingLatest ? "Laden..." : "Laatste meting laden"}
            </button>

            <button onClick={resetAll} style={styles.ghostBtn}>
              Alles leegmaken
            </button>

            <button onClick={handleSaveAll} disabled={saving} style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Opslaan..." : "Alles opslaan"}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: ui.muted }}>
            Tip: je mag ook maar enkele testen invullen en toch opslaan.
          </div>
        </div>
      </div>

      {activeTab === "invullen" ? (
        <section style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Onderdelen</div>

          <div className="eurofit-grid" style={styles.gridWrap}>
            {TESTS.map((t) => {
              const meta = getTestMeta(t.value);
              const norm = norms[t.value];
              const beoordeling = getLiveBeoordeling(t.value);
              const richting = LOWER_IS_BETTER.has(t.value) ? "lager = beter" : "hoger = beter";

              return (
                <div key={t.value} style={styles.testCard}>
                  <div style={styles.testTop}>
                    <div style={styles.iconBox}>{meta.icon}</div>

                    <div style={{ minWidth: 0 }}>
                      <div style={styles.testTitle}>{meta.label}</div>
                      <div style={styles.testDesc}>
                        {meta.desc} <span style={{ opacity: 0.9 }}>• {richting}</span>
                      </div>
                    </div>

                    {beoordeling ? (
                      <div style={styles.pill}>
                        <span style={{ ...styles.badge, background: beoordeling.kleur }}>{beoordeling.label}</span>
                      </div>
                    ) : (
                      <div style={styles.pill}>—</div>
                    )}
                  </div>

                  {/* ✅ Afbeelding (zoals Functional) */}
                  <div style={styles.imgWrap}>
                    <div style={styles.imgPad}>
                      <Image
                        src={meta.image}
                        alt={meta.label}
                        fill
                        sizes="(max-width: 900px) 100vw, 50vw"
                        style={{ objectFit: "contain", objectPosition: "center", padding: 8, opacity: 0.98 }}
                      />
                    </div>
                  </div>

                  <div style={styles.inputRow}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.smallLabel}>Score</div>
                      <input
                        value={scores[t.value] ?? ""}
                        onChange={(e) => setScore(t.value, e.target.value)}
                        style={styles.input}
                        inputMode="decimal"
                        placeholder={`0 ${meta.eenheid}`}
                      />

                      <div style={styles.hint}>
                        {norm ? (
                          <>
                            Normen: P5 <b style={{ color: ui.text }}>{norm.p5}</b> • P20{" "}
                            <b style={{ color: ui.text }}>{norm.p20}</b> • P50{" "}
                            <b style={{ color: ui.text }}>{norm.p50}</b> • P80{" "}
                            <b style={{ color: ui.text }}>{norm.p80}</b> • P95{" "}
                            <b style={{ color: ui.text }}>{norm.p95}</b>
                          </>
                        ) : (
                          <>Norm: —</>
                        )}
                      </div>
                    </div>

                    <div style={styles.unitBox}>
                      <div style={styles.smallLabel}>Eenheid</div>
                      <div style={styles.unitText}>{meta.eenheid}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : activeTab === "resultaten" ? (
        <section style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>📌 Mijn resultaten</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
              Resultaten worden chronologisch getoond (nieuwste boven).
            </div>
          </div>

          {results.length === 0 ? (
            <div style={styles.panel}>
              <div style={{ color: ui.muted }}>Nog geen resultaten.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {results.map((r) => {
                const meta = getTestMeta(r.test_type);
                const norm = norms[r.test_type] ?? null; // normen van huidige datum/leeftijd
                const beoordeling = norm ? beoordeelWaarde(r.waarde, norm) : null;

                return (
                  <div
                    key={r.id}
                    style={{
                      ...styles.panel,
                      padding: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: ui.text }}>
                        {meta.icon} {meta.label}
                      </div>
                      <div style={{ color: ui.muted, marginTop: 4 }}>{r.test_datum}</div>
                      {r.schooljaar ? <div style={{ color: ui.muted }}>Schooljaar: {r.schooljaar}</div> : null}
                    </div>

                    <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
                      <div style={{ fontWeight: 950, color: ui.text, whiteSpace: "nowrap" }}>
                        {r.waarde} {r.eenheid}
                      </div>

                      {beoordeling ? (
                        <span style={{ ...styles.badge, background: beoordeling.kleur }}>{beoordeling.label}</span>
                      ) : (
                        <span style={{ color: ui.muted2 }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Hoe werkt Eurofit hier?</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5, lineHeight: 1.35 }}>
              Je vult per onderdeel je score in en je krijgt meteen een beoordeling op basis van percentielen (P5…P95).
              <br />
              <br />
              <b style={{ color: ui.text }}>Belangrijk:</b> Voor testen waarbij <b style={{ color: ui.text }}>lager beter is</b> (tijd/fouten),
              is de interpretatie omgekeerd: <b style={{ color: ui.text }}>P5 = best</b> (laagste tijd/fouten) en{" "}
              <b style={{ color: ui.text }}>P95 = zwakker</b> (hogere tijd/fouten).
            </div>
          </div>

          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>Welke testen zijn “lager = beter”?</div>
            <ul style={{ marginTop: 10, color: ui.muted, fontSize: 13.5, lineHeight: 1.35, paddingLeft: 18 }}>
              <li>Flamingo balans (fouten)</li>
              <li>Plate tapping (sec)</li>
              <li>10×5 shuttle run (sec)</li>
            </ul>
            <div style={{ marginTop: 10, color: ui.muted, fontSize: 13.5 }}>De rest is “hoger = beter”.</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---------------------------
   Hero
--------------------------- */
function HeroEurofit({ greetingName }: { greetingName: string }) {
  return (
    <section style={hero.wrap}>
      <div style={hero.bgGlow1} />
      <div style={hero.bgGlow2} />

      <div className="eurofit-hero-inner" style={hero.inner}>
        <div style={hero.content}>
          <div style={hero.kicker}>EUROFIT</div>

          <h1 style={{ ...hero.title, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            Eurofittest <span style={hero.accent}>{greetingName}</span>
            <Image src="/hero/beast.png" alt="Beast" width={54} height={54} priority style={{ display: "block", objectFit: "contain" }} />
          </h1>

          <div style={hero.sub}>Vul je scores in, vergelijk met normen en volg je progressie.</div>

          <div style={hero.actions}>
            <Link href="/functional-fitheidstest" style={hero.secondary}>
              Functional
            </Link>
            <Link href="/challenges" style={hero.secondary}>
              Challenges
            </Link>
            <Link href="/dashboard" style={hero.primary}>
              Dashboard →
            </Link>
          </div>

          <div style={hero.quoteCard}>
            <div style={hero.quoteLabel}>Focus</div>
            <div style={hero.quoteText}>“Measure. Improve. Repeat.”</div>
            <div style={hero.quoteAuthor}>— Eurofit protocol</div>
          </div>
        </div>

        <div style={hero.artCol}>
          <div style={hero.illuBox}>
            <Image
              src="/eurofit/eurofittest.png"
              alt="LO illustratie"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 40vw"
              style={{ objectFit: "contain", objectPosition: "center", padding: 14, opacity: 0.96 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(104,180,255,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(255,104,180,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
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
  inner: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 14,
    alignItems: "start",
    zIndex: 1,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border2,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
    background: "rgba(0,0,0,0.35)",
  },
  quoteCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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

/* ---------------------------
   ✅ CSS Injector (no styled-jsx)
--------------------------- */
function injectEurofitResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "eurofit-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (min-width: 900px) {
      .meta-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .eurofit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 700px) {
      .eurofit-hero-inner { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}
