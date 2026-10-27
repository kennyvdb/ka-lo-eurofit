"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

type Evaluation = {
  les_id: string;
  les_naam: string | null;
  les_datum: string | null;
  evaluatie_id: string;
  evaluatie_type: string;
  rubrics: Record<string, number> | null;
};

const criteria: Record<string, { key: string; label: string }[]> = {
  techniek: [
    { key: "gericht_passen", label: "Speelt gericht tegen de bank" },
    { key: "balcontrole", label: "Stopt en controleert de bal" },
    { key: "indian_dribbel", label: "Indian dribbel" },
    { key: "schijnbeweging", label: "Schijnbeweging" },
    { key: "push", label: "Correcte push" },
    { key: "forehand", label: "Drijven met forehand" },
    { key: "backhand", label: "Drijven met backhand" },
    { key: "shot", label: "Shot uitvoeren" },
  ],
  wedstrijd: [
    { key: "balherovering", label: "Verdediger: snelle balherovering" },
    { key: "aanspeelbaar", label: "Aanvaller zonder bal: aanspeelbaar en in beweging" },
    { key: "bal_afschermen", label: "Balbezitter: schermt af en houdt overzicht" },
  ],
  samenwerken: [{ key: "samenwerken", label: "Werkt constructief samen met verschillende leerlingen" }],
};

const labels: Record<string, string> = {
  techniek: "Techniek",
  wedstrijd: "Wedstrijd",
  samenwerken: "Samenwerken",
};

function rating(value: number) {
  if (value < 1.75) return { symbol: "−", style: "border-red-400/30 bg-red-400/15 text-red-200" };
  if (value < 2.5) return { symbol: "+/−", style: "border-amber-400/30 bg-amber-400/15 text-amber-200" };
  if (value < 3.25) return { symbol: "+", style: "border-sky-400/30 bg-sky-400/15 text-sky-200" };
  return { symbol: "++", style: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200" };
}

function average(rows: Evaluation[]) {
  const values = rows.flatMap((r) => Object.values(r.rubrics ?? {}).map(Number).filter((n) => n >= 1 && n <= 4));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export default function HockeyLeerlingEvaluatiesPage() {
  const [rows, setRows] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("hockey_mijn_resultaten");
      if (!active) return;
      if (rpcError) setError(rpcError.message);
      else setRows((data ?? []) as Evaluation[]);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const lessons = useMemo(() => {
    const map = new Map<string, { name: string; date: string | null; evaluations: Evaluation[] }>();
    for (const row of rows) {
      if (!map.has(row.les_id)) map.set(row.les_id, { name: row.les_naam || "Hockey-les", date: row.les_datum, evaluations: [] });
      map.get(row.les_id)!.evaluations.push(row);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <AppShell title="KA LO App" subtitle="Mijn Hockey-evaluaties">
      <BaseHero
        label="LES LO · MIJN EVALUATIES"
        title={<>Mijn <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">Hockey-evaluaties</span></>}
        description="Bekijk je eigen beoordelingen voor techniek, wedstrijdvaardigheden en samenwerking."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Hockey-evaluaties"
        quoteTitle="Elke stap telt"
        quote="Leren. Oefenen. Groeien."
        actions={<Link href="/les-lo/evaluaties" className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white hover:bg-white/10">← Terug naar evaluaties</Link>}
      />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
        {loading && <p className="text-white/70">Je beoordelingen worden geladen…</p>}
        {error && <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">Beoordelingen ophalen mislukt: {error}</div>}
        {!loading && !error && lessons.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">Er zijn nog geen definitief ingediende Hockey-beoordelingen beschikbaar.</div>}
        {lessons.map(([id, lesson]) => (
          <section key={id} className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-xl font-bold text-white">{lesson.name}</h2>
            {lesson.date && <p className="mt-1 text-sm text-white/60">{lesson.date.slice(0, 10).split("-").reverse().join("/")}</p>}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(["techniek", "wedstrijd", "samenwerken"] as const).map((type) => {
                const entries = lesson.evaluations.filter((e) => e.evaluatie_type === type);
                const avg = average(entries);
                const mark = avg === null ? null : rating(avg);
                return (
                  <div key={type} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-white">{labels[type]}</h3>
                      <span className={`rounded-xl border px-3 py-1 font-bold ${mark?.style ?? "border-white/10 bg-white/5 text-white/50"}`}>{mark?.symbol ?? "—"}</span>
                    </div>
                    {entries.length === 0 ? <p className="mt-3 text-sm text-white/60">Nog geen beoordeling.</p> : (
                      <div className="mt-3 space-y-3">
                        {entries.map((entry, index) => (
                          <details key={entry.evaluatie_id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <summary className="cursor-pointer font-semibold text-white">Beoordeling {index + 1} · Bekijk criteria</summary>
                            <div className="mt-3 space-y-2">
                              {(criteria[type] ?? []).map((criterion) => {
                                const value = Number(entry.rubrics?.[criterion.key]);
                                const valid = value >= 1 && value <= 4;
                                const result = valid ? rating(value) : null;
                                return (
                                  <div key={criterion.key} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-white/80">{criterion.label}</span>
                                    <span className={`shrink-0 rounded-lg border px-2 py-1 font-bold ${result?.style ?? "border-white/10 text-white/50"}`}>{result?.symbol ?? "—"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </AppShell>
  );
}
