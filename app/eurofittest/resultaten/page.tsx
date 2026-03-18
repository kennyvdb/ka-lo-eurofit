"use client";

import AppShell from "@/components/AppShell";
import ProfileRequiredGate from "@/components/ProfileRequiredGate";
import BaseHero from "@/components/heroes/BaseHero";
import { checkProfileCompletion } from "@/lib/profileCompletion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/* ---------------------------
   Types
--------------------------- */
type EurofitResult = {
  id: string;
  test_datum: string;
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
   Tests
--------------------------- */
const TESTS = [
  { value: "flamingo", label: "Flamingo balans", eenheid: "fouten", icon: "🦩" },
  { value: "plate_tapping", label: "Plate tapping", eenheid: "sec", icon: "🖐️" },
  { value: "sit_and_reach", label: "Sit & reach", eenheid: "cm", icon: "🧘" },
  { value: "standing_broad_jump", label: "Verspringen uit stand", eenheid: "cm", icon: "🦘" },
  { value: "handgrip", label: "Handknijpkracht", eenheid: "kg", icon: "✊" },
  { value: "sit_ups", label: "Sit-ups (30s)", eenheid: "aantal", icon: "💪" },
  { value: "bent_arm_hang", label: "Bent-arm hang", eenheid: "sec", icon: "🪝" },
  { value: "agility_shuttle_run_10x5", label: "10×5 shuttle run", eenheid: "sec", icon: "⚡" },
  { value: "shuttle_run_20m", label: "20m shuttle run", eenheid: "stages", icon: "🏃" },
] as const;

function getTestMeta(testType: string) {
  return TESTS.find((t) => t.value === testType) ?? TESTS[0];
}

/* ---------------------------
   Lower is better
--------------------------- */
const LOWER_IS_BETTER = new Set<string>([
  "flamingo",
  "plate_tapping",
  "agility_shuttle_run_10x5",
]);

/* ---------------------------
   Helpers
--------------------------- */
function normalizeGeslacht(value: unknown): Geslacht | null {
  const v = String(value ?? "").trim().toLowerCase();

  if (["m", "man", "jongen", "boy"].includes(v)) return "jongen";
  if (["v", "vrouw", "meisje", "girl"].includes(v)) return "meisje";

  return null;
}

function berekenLeeftijd(geboortedatumISO: string, testDatumISO: string) {
  const birth = new Date(`${geboortedatumISO}T00:00:00`);
  const test = new Date(`${testDatumISO}T00:00:00`);

  let leeftijd = test.getFullYear() - birth.getFullYear();
  const m = test.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && test.getDate() < birth.getDate())) leeftijd--;

  if (leeftijd > 17) leeftijd = 17;
  if (leeftijd < 9) leeftijd = 9;

  return leeftijd;
}

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

  if (waarde <= norm.p95) return { label: "Zeer goed", kleur: COLORS.zeerGoed };
  if (waarde <= norm.p80) return { label: "Goed", kleur: COLORS.goed };
  if (waarde <= norm.p50) return { label: "Gemiddeld goed", kleur: COLORS.gemGoed };
  if (waarde <= norm.p20) return { label: "Gemiddeld zwak", kleur: COLORS.gemZwak };
  if (waarde <= norm.p5) return { label: "Zwak", kleur: COLORS.zwak };
  return { label: "Zeer zwak", kleur: COLORS.zeerZwak };
}

function formatVerschil(testType: string, current?: number | null, previous?: number | null) {
  if (current == null || previous == null) return null;

  const rawDiff = current - previous;
  const roundedDiff = Math.round(rawDiff * 100) / 100;

  const lowerBetter = LOWER_IS_BETTER.has(testType);
  const isSame = roundedDiff === 0;
  const isBetter = lowerBetter ? roundedDiff < 0 : roundedDiff > 0;

  return {
    tekst: `${roundedDiff > 0 ? "+" : ""}${roundedDiff.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`,
    beter: isSame ? null : isBetter,
  };
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
   UI
--------------------------- */
const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ui.border,
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
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
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
};

/* ---------------------------
   Page
--------------------------- */
export default function EurofitResultatenPage() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileReady, setProfileReady] = useState<null | {
    isReady: boolean;
    missing: string[];
    currentSchoolYear: string;
  }>(null);

  const [geslacht, setGeslacht] = useState<Geslacht | null>(null);
  const [geboortedatum, setGeboortedatum] = useState<string | null>(null);
  const [volledigeNaam, setVolledigeNaam] = useState<string | null>(null);

  const [results, setResults] = useState<EurofitResult[]>([]);
  const [normMap, setNormMap] = useState<Record<string, NormRow | null>>({});

  useEffect(() => {
    const run = async () => {
      const res = await checkProfileCompletion();
      setProfileReady(res);
    };
    run();
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

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
        setError("Kon profiel niet laden.");
        setLoading(false);
        return;
      }

      const g = normalizeGeslacht(prof.data?.geslacht);
      const gb = prof.data?.geboortedatum ?? null;
      const naam = prof.data?.volledige_naam ?? null;

      setGeslacht(g);
      setGeboortedatum(gb);
      setVolledigeNaam(naam);

      const { data: resultRows, error: resultError } = await supabase
        .from("eurofittest_resultaten")
        .select("id, test_datum, test_type, waarde, eenheid, schooljaar, aangemaakt_op")
        .eq("leerling_id", userId)
        .order("test_datum", { ascending: false })
        .order("aangemaakt_op", { ascending: false });

      if (resultError) {
        setError(resultError.message);
        setLoading(false);
        return;
      }

      const safeResults = (resultRows ?? []) as EurofitResult[];
      setResults(safeResults);

      if (g && gb && safeResults.length > 0) {
        const uniquePairs = Array.from(
          new Set(safeResults.map((r) => `${r.test_type}__${berekenLeeftijd(gb, r.test_datum)}`))
        );

        const allNorms: Record<string, NormRow | null> = {};

        for (const pair of uniquePairs) {
          const [test_type, leeftijdStr] = pair.split("__");
          const leeftijd = Number(leeftijdStr);

          const { data: normRow } = await supabase
            .from("eurofit_normen")
            .select("test_type, geslacht, leeftijd, p5,p10,p20,p30,p40,p50,p60,p70,p80,p90,p95")
            .eq("geslacht", g)
            .eq("leeftijd", leeftijd)
            .eq("test_type", test_type)
            .maybeSingle();

          allNorms[`${test_type}__${leeftijd}`] = (normRow as NormRow | null) ?? null;
        }

        setNormMap(allNorms);
      }

      setLoading(false);
    };

    init();
  }, []);

  const comparisonRows = useMemo(() => {
    const byTest: Record<string, EurofitResult[]> = {};

    for (const r of results) {
      if (!byTest[r.test_type]) byTest[r.test_type] = [];
      byTest[r.test_type].push(r);
    }

    return Object.entries(byTest)
      .map(([testType, rows]) => {
        const sorted = [...rows].sort((a, b) => {
          const dateCompare = b.test_datum.localeCompare(a.test_datum);
          if (dateCompare !== 0) return dateCompare;
          return (b.aangemaakt_op ?? "").localeCompare(a.aangemaakt_op ?? "");
        });

        const current = sorted[0] ?? null;
        const previous = sorted[1] ?? null;

        return {
          testType,
          current,
          previous,
          history: sorted,
        };
      })
      .sort((a, b) => {
        const labelA = getTestMeta(a.testType).label;
        const labelB = getTestMeta(b.testType).label;
        return labelA.localeCompare(labelB);
      });
  }, [results]);

  const greetingName = volledigeNaam?.split(" ")?.[0] ?? "Beast";

  if (!profileReady) {
    return (
      <AppShell title="LO App" subtitle="Eurofit resultaten" userName={volledigeNaam ?? undefined}>
        <div style={{ color: ui.text }}>Laden...</div>
      </AppShell>
    );
  }

  if (!profileReady.isReady) {
    return (
      <AppShell title="LO App" subtitle="Eurofit resultaten" userName={volledigeNaam ?? undefined}>
        <ProfileRequiredGate missing={profileReady.missing} currentSchoolYear={profileReady.currentSchoolYear} />
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Eurofit resultaten" userName={volledigeNaam ?? undefined}>
        <div style={{ color: ui.text }}>Resultaten laden…</div>
      </AppShell>
    );
  }

  if (!uid) {
    return (
      <AppShell title="LO App" subtitle="Eurofit resultaten">
        <div style={styles.panel}>
          <div style={{ fontWeight: 980, color: ui.text }}>Je bent niet ingelogd.</div>
          <Link href="/login" style={{ ...styles.blackBtnLink, marginTop: 12 }}>
            Naar login →
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Eurofit resultaten" userName={volledigeNaam ?? undefined}>
      <BaseHero
        label="Fysieke fitheid"
        title={
          <>
            Eurofittest{" "}
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
            Bekijk hier al je opgeslagen Eurofitresultaten en volg je progressie.
            {geslacht ? <span className="opacity-85"> • Geslacht: {geslacht}</span> : null}
            <span className="opacity-85"> • Vergelijk nieuwste met vorige resultaten</span>
          </>
        }
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="Eurofit illustratie"
        quoteTitle="Focus"
        quote="Measure. Improve. Repeat."
        quoteAuthor="Eurofit protocol"
        imageClassName="scale-105 md:scale-110 transition-transform duration-500"
        actions={
          <>
            <Link
              href="/eurofittest"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            >
              Invullen
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-200/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.32),0_0_0_1px_rgba(75,142,141,0.10)]"
            >
              Home →
            </Link>
          </>
        }
      />

      <div style={{ display: "grid", gap: 12 }}>
        <div style={styles.panel}>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div>
              <div style={{ fontWeight: 980, color: ui.text }}>📌 Mijn Eurofitresultaten</div>
              <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
                Hier zie je je nieuwste resultaat naast je vorige resultaat per test.
              </div>
            </div>

            <Link href="/eurofittest" style={styles.blackBtnLink}>
              ← Terug naar Eurofittest
            </Link>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <b>Oeps:</b> {error}
          </div>
        )}

        {results.length === 0 ? (
          <div style={styles.panel}>
            <div style={{ color: ui.muted }}>Nog geen resultaten.</div>
          </div>
        ) : (
          <div style={styles.panel}>
            <div style={{ fontWeight: 980, color: ui.text }}>📊 Vergelijking met vorige resultaten</div>
            <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
              Nieuwste score staat naast je vorige score, zodat je sneller progressie ziet.
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {comparisonRows.map(({ testType, current, previous }) => {
                if (!current) return null;

                const meta = getTestMeta(testType);
                const leeftijd = geboortedatum
                  ? berekenLeeftijd(geboortedatum, current.test_datum)
                  : null;

                const norm =
                  leeftijd !== null ? normMap[`${current.test_type}__${leeftijd}`] ?? null : null;

                const beoordeling = norm ? beoordeelWaarde(current.waarde, norm) : null;
                const verschil = formatVerschil(testType, current.waarde, previous?.waarde ?? null);

                return (
                  <div
                    key={testType}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(180px,1.3fr)_repeat(4,minmax(90px,1fr))] md:items-center">
                      <div className="min-w-0">
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {meta.icon} {meta.label}
                        </div>
                        <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                          Laatste test: {current.test_datum}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Nieuwste</div>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {current.waarde} {current.eenheid}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Vorige</div>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {previous ? `${previous.waarde} ${previous.eenheid}` : "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Verschil</div>
                        <div
                          style={{
                            fontWeight: 950,
                            color:
                              verschil?.beter == null
                                ? ui.text
                                : verschil.beter
                                ? "#7CFC98"
                                : "#FF8A8A",
                          }}
                        >
                          {verschil ? verschil.tekst : "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0">
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Beoordeling</div>
                        {beoordeling ? (
                          <span style={{ ...styles.badge, background: beoordeling.kleur }}>
                            {beoordeling.label}
                          </span>
                        ) : (
                          <span style={{ color: ui.muted2 }}>—</span>
                        )}
                      </div>
                    </div>

                    {previous ? (
                      <div
                        style={{
                          marginTop: 10,
                          color: ui.muted2,
                          fontSize: 12.5,
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          paddingTop: 10,
                        }}
                      >
                        Vorige testdatum: {previous.test_datum}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}