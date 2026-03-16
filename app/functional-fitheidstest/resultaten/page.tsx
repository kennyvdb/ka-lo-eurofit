"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
};

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

type FunctionalSubmission = {
  id: string;
  user_id: string;
  schooljaar: string | null;
  date: string;
  scores: Partial<Record<TestKey, number>>;
  note: string | null;
  created_at: string;
};

type TestMeta = {
  key: TestKey;
  label: string;
  unit: string;
  icon: string;
};

const TESTS: TestMeta[] = [
  { key: "vma_kmu", label: "VMA-test", unit: "km/u", icon: "🏃‍♂️" },
  { key: "situp_floor_tap_60s", label: "Sit-up floor tap (Abmat)", unit: "reps", icon: "🧱" },
  { key: "wallball_3kg_60s", label: "Wallball (3 kg)", unit: "reps", icon: "🎯" },
  { key: "pushups_60s", label: "Push ups", unit: "reps", icon: "💪" },
  { key: "burpees_60s", label: "Burpees", unit: "reps", icon: "🔥" },
  { key: "wallsit_time_s", label: "Wallsit", unit: "sec", icon: "🧊" },
  { key: "table_pullup_invertedrow_60s", label: "Table pull up / Inverted row", unit: "reps", icon: "🪝" },
  { key: "plank_time_s", label: "Planking", unit: "sec", icon: "🧘‍♂️" },
  { key: "box_jumps_60s", label: "Box jumps", unit: "reps", icon: "🦘" },
  { key: "dips_chairdips_60s", label: "Dips / Chairdips", unit: "reps", icon: "🏋️" },
  { key: "airsquats_60s", label: "Airsquats", unit: "reps", icon: "🦵" },
  { key: "handstand_hold_time_s", label: "Handstand hold", unit: "sec", icon: "🤸" },
];

function formatDiff(current?: number | null, previous?: number | null) {
  if (current == null || previous == null) return null;

  const rawDiff = current - previous;
  const roundedDiff = Math.round(rawDiff * 100) / 100;

  return {
    tekst: `${roundedDiff > 0 ? "+" : ""}${roundedDiff.toLocaleString("nl-NL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`,
    beter: roundedDiff === 0 ? null : roundedDiff > 0,
  };
}

function formatValue(value?: number | null, unit?: string) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value} ${unit ?? ""}`.trim();
}

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
};

export default function FunctionalFitheidstestResultatenPage() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [results, setResults] = useState<FunctionalSubmission[]>([]);

  useEffect(() => {
    injectResponsiveCSS();

    const init = async () => {
      setLoading(true);
      setError(null);

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
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
        .select("id, volledige_naam, role, rol, klas_naam, schooljaar")
        .eq("id", userId)
        .maybeSingle();

      if (!prof.error) {
        setProfiel((prof.data as Profiel | null) ?? null);
      }

      const { data: rows, error: rowsError } = await supabase
        .from("functional_fitheidstest_submissions")
        .select("id, user_id, schooljaar, date, scores, note, created_at")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (rowsError) {
        setError(rowsError.message);
        setLoading(false);
        return;
      }

      setResults(((rows ?? []) as FunctionalSubmission[]) ?? []);
      setLoading(false);
    };

    init();
  }, []);

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Beast";

  const latest = results[0] ?? null;
  const previous = results[1] ?? null;

  const comparisonRows = useMemo(() => {
    if (!latest) return [];

    return TESTS.map((test) => {
      const currentScore = latest.scores?.[test.key] ?? null;
      const previousScore = previous?.scores?.[test.key] ?? null;
      const diff = formatDiff(currentScore, previousScore);

      return {
        ...test,
        currentScore,
        previousScore,
        diff,
      };
    });
  }, [latest, previous]);

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Functional fitheidstest resultaten" userName={profiel?.volledige_naam ?? undefined}>
        <div style={{ color: ui.text }}>Resultaten laden…</div>
      </AppShell>
    );
  }

  if (!uid) {
    return (
      <AppShell title="LO App" subtitle="Functional fitheidstest resultaten">
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
    <AppShell title="LO App" subtitle="Functional fitheidstest resultaten" userName={profiel?.volledige_naam ?? undefined}>
      <BaseHero
        label="Functional"
        title={
          <>
            Resultaten{" "}
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
            Bekijk hier al je opgeslagen Functional Fitheidstest-resultaten en volg je progressie.
            {profiel?.klas_naam ? <span className="opacity-85"> • {profiel.klas_naam}</span> : null}
            <span className="opacity-85"> • Vergelijk nieuwste met vorige meting</span>
          </>
        }
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Functional fitheidstest illustratie"
        quoteTitle="Focus"
        quote="Measure. Improve. Repeat."
        quoteAuthor="Functional protocol"
        imageClassName="scale-105 md:scale-110 transition-transform duration-500"
        actions={
          <>
            <Link
              href="/functional-fitheidstest"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            >
              Invullen
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-200/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.32),0_0_0_1px_rgba(75,142,141,0.10)]"
            >
              Dashboard →
            </Link>
          </>
        }
      />

      <div style={{ display: "grid", gap: 12 }}>
        <div style={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 980, color: ui.text }}>📌 Mijn Functional-resultaten</div>
              <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
                Hier zie je je nieuwste meting naast je vorige meting per test.
              </div>
            </div>

            <Link href="/functional-fitheidstest" style={styles.blackBtnLink}>
              ← Terug naar invullen
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
            <div style={{ color: ui.muted }}>Nog geen resultaten gevonden.</div>
          </div>
        ) : (
          <>
            <div style={styles.panel}>
              <div style={{ fontWeight: 980, color: ui.text }}>📊 Vergelijking per test</div>
              <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
                Nieuwste score staat naast je vorige score, inclusief verschil.
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {comparisonRows.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div className="functional-results-row" style={rowGridStyle}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {row.icon} {row.label}
                        </div>
                        <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                          Eenheid: {row.unit}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Nieuwste</div>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {formatValue(row.currentScore, row.unit)}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Vorige</div>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {formatValue(row.previousScore, row.unit)}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: ui.muted2, fontSize: 12 }}>Verschil</div>
                        <div
                          style={{
                            fontWeight: 950,
                            color:
                              row.diff?.beter == null
                                ? ui.text
                                : row.diff.beter
                                ? "#7CFC98"
                                : "#FF8A8A",
                          }}
                        >
                          {row.diff ? row.diff.tekst : "—"}
                        </div>
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
                          display: "flex",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>Laatste testdatum: {latest?.date ?? "—"}</span>
                        <span>Vorige testdatum: {previous?.date ?? "—"}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.panel}>
              <div style={{ fontWeight: 980, color: ui.text }}>🗂️ Meetgeschiedenis</div>
              <div style={{ marginTop: 8, color: ui.muted, fontSize: 13.5 }}>
                Overzicht van al je opgeslagen metingen, meest recente eerst.
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {results.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 950, color: ui.text }}>
                          {row.date}
                        </div>
                        <div style={{ color: ui.muted, marginTop: 4, fontSize: 13 }}>
                          {row.schooljaar ? `${row.schooljaar}` : "Geen schooljaar"}
                        </div>
                      </div>
                    </div>

                    {row.note ? (
                      <div style={{ marginTop: 10, color: ui.muted2, fontSize: 12.5 }}>
                        <b style={{ color: ui.text }}>Opmerking:</b> {row.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

const rowGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 1.3fr) repeat(3, minmax(90px, 1fr))",
  gap: 12,
  alignItems: "center",
};

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "functional-results-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (max-width: 980px) {
      .functional-results-row {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(style);
}