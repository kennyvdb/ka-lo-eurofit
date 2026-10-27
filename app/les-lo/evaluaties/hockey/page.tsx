"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

type Evaluation = {
  les_id: string; les_naam: string | null; les_datum: string | null;
  evaluatie_id: string; evaluatie_type: string; rubrics: Record<string, number> | null;
};
type Student = {
  deelnemer_id: string; volledige_naam: string; klas_naam: string | null; les_naam: string | null;
};
const types = ["techniek", "wedstrijd", "samenwerken"] as const;
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
  techniek: "Techniek", wedstrijd: "Wedstrijd", samenwerken: "Samenwerken",
};
function rating(value: number) {
  if (value < 1.75) return { symbol: "−", style: "border-red-400/30 bg-red-400/15 text-red-200" };
  if (value < 2.5) return { symbol: "+/−", style: "border-amber-400/30 bg-amber-400/15 text-amber-200" };
  if (value < 3.25) return { symbol: "+", style: "border-sky-400/30 bg-sky-400/15 text-sky-200" };
  return { symbol: "++", style: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200" };
}
function average(rows: Evaluation[]) {
  const values = rows.flatMap(r => Object.values(r.rubrics ?? {}).map(Number).filter(n => n >= 1 && n <= 4));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}
const demo: Evaluation[] = types.map((type, index) => ({
  les_id: "demo", les_naam: "Voorbeeldles Hockey", les_datum: "2026-10-27",
  evaluatie_id: `demo-${type}`, evaluatie_type: type,
  rubrics: Object.fromEntries(criteria[type].map((item, i) => [item.key, ((i + index) % 4) + 1])),
}));

export default function HockeyLeerlingEvaluatiesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Evaluation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [mode, setMode] = useState<"eigen" | "demo" | "leerling">("eigen");
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function init() {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !authData.user) {
        setError("Meld je eerst aan om je evaluaties te bekijken.");
        setLoading(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profielen").select("rol").eq("id", authData.user.id).maybeSingle();
      if (!active) return;
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
      const teacher = ["lo_leerkracht", "leerkracht_lo", "admin"].includes(
        String(profile?.rol ?? "").toLowerCase()
      );
      setIsTeacher(teacher);
      if (teacher) {
        setMode("demo");
        const { data, error: listError } = await supabase.rpc("hockey_leerkracht_leerlingen");
        if (!active) return;
        if (listError) setError(listError.message);
        else setStudents((data ?? []) as Student[]);
        setRows(demo);
      } else {
        const { data, error: rpcError } = await supabase.rpc("hockey_mijn_resultaten");
        if (!active) return;
        if (rpcError) setError(rpcError.message);
        else setRows((data ?? []) as Evaluation[]);
      }
      setLoading(false);
    }
    void init();
    return () => { active = false; };
  }, [supabase]);

  async function selectStudent(id: string) {
    if (!isTeacher) return;
    setSelected(id);
    setMode("leerling");
    setRows([]);
    setError("");
    if (!id) return;
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc(
      "hockey_leerling_resultaten_voorbeeld", { p_deelnemer_id: id }
    );
    if (rpcError) setError(rpcError.message);
    else setRows((data ?? []) as Evaluation[]);
    setLoading(false);
  }

  const filteredStudents = useMemo(() => students.filter(s =>
    `${s.volledige_naam} ${s.klas_naam ?? ""} ${s.les_naam ?? ""}`
      .toLocaleLowerCase("nl-BE").includes(search.toLocaleLowerCase("nl-BE"))
  ), [students, search]);

  const lessons = useMemo(() => {
    const map = new Map<string, { name: string; date: string | null; evaluations: Evaluation[] }>();
    for (const row of rows) {
      if (!map.has(row.les_id))
        map.set(row.les_id, { name: row.les_naam || "Hockey-les", date: row.les_datum, evaluations: [] });
      map.get(row.les_id)!.evaluations.push(row);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <AppShell title="KA LO App" subtitle="Mijn Hockey-evaluaties">
      <BaseHero
        label="LES LO · MIJN EVALUATIES"
        title={<>Mijn <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">Hockey-evaluaties</span></>}
        description="Bekijk je beoordelingen voor techniek, wedstrijdvaardigheden en samenwerking."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Hockey-evaluaties"
        quoteTitle="Elke stap telt"
        quote="Leren. Oefenen. Groeien."
        actions={<Link href="/les-lo/evaluaties" className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white hover:bg-white/10">← Terug naar evaluaties</Link>}
      />
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
        {isTeacher && (
          <section className="rounded-3xl border border-teal-400/30 bg-teal-400/10 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-white">👁️ Leerlingweergave testen</h2>
            <p className="mt-1 text-sm text-white/70">Alleen zichtbaar voor LO-leerkrachten en admins. Je kunt hier niets wijzigen.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setMode("demo"); setSelected(""); setRows(demo); setError(""); }}
                className={`rounded-xl border px-4 py-2 font-semibold ${mode === "demo" ? "border-teal-300 bg-teal-500/30 text-white" : "border-white/20 text-white/80"}`}>
                Voorbeeldleerling
              </button>
              <button type="button" onClick={() => { setMode("leerling"); setRows([]); setError(""); }}
                className={`rounded-xl border px-4 py-2 font-semibold ${mode === "leerling" ? "border-teal-300 bg-teal-500/30 text-white" : "border-white/20 text-white/80"}`}>
                Echte leerling
              </button>
            </div>
            {mode === "leerling" && (
              <div className="mt-4 space-y-2">
                <label htmlFor="hockey-search" className="block text-sm font-semibold text-white">Zoek op naam, klas of les</label>
                <input id="hockey-search" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Zoek leerling…" className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/40" />
                <label htmlFor="hockey-student" className="block text-sm font-semibold text-white">Kies een leerling</label>
                <select id="hockey-student" value={selected} onChange={e => void selectStudent(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#193846] p-3 text-white">
                  <option value="">Selecteer een leerling…</option>
                  {filteredStudents.map(s => (
                    <option key={s.deelnemer_id} value={s.deelnemer_id}>
                      {s.volledige_naam} · {s.klas_naam || "geen klas"} · {s.les_naam || "Hockey"}
                    </option>
                  ))}
                </select>
                {students.length === 0 && <p className="text-sm text-white/60">Er zijn nog geen Hockey-deelnemers gevonden.</p>}
              </div>
            )}
            {mode === "demo" && <p className="mt-3 text-sm text-teal-100">DEMO · De onderstaande resultaten zijn fictief en worden niet opgeslagen.</p>}
            {mode === "leerling" && selected && <p className="mt-3 text-sm text-teal-100">Echte leerling · Alleen definitief ingediende evaluaties.</p>}
          </section>
        )}

        {loading && <p className="text-white/70">Beoordelingen worden geladen…</p>}
        {error && <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">Beoordelingen ophalen mislukt: {error}</div>}
        {!loading && !error && isTeacher && mode === "leerling" && !selected &&
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">Selecteer hierboven een leerling om de weergave te openen.</div>}
        {!loading && !error && lessons.length === 0 && (!isTeacher || (mode === "leerling" && selected)) &&
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">Er zijn nog geen definitief ingediende Hockey-beoordelingen beschikbaar.</div>}

        {!loading && !error && lessons.map(([id, lesson]) => (
          <section key={id} className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-xl font-bold text-white">{lesson.name}</h2>
            {lesson.date && <p className="mt-1 text-sm text-white/60">{lesson.date.slice(0, 10).split("-").reverse().join("/")}</p>}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {types.map(type => {
                const entries = lesson.evaluations.filter(e => e.evaluatie_type === type);
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
                              {criteria[type].map(criterion => {
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
