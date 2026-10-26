"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
type Row = Record<string, any>;
type Lid = { leerling_email: string; volledige_naam: string; positie: number; klas_naam: string };
type Props = { schooljaar: string; leden: Lid[] };
const TYPES = ["techniek", "wedstrijd", "samenwerken"] as const;
const LEVELS = ["−", "+/−", "+", "++"] as const;
const COLORS = ["#f87171", "#fdba74", "#60a5fa", "#4ade80"] as const;
function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
}
function rating(value: number | null) {
  if (value === null) return { symbol: "—", color: "#94a3b8" };
  const index = Math.max(0, Math.min(3, Math.round(value) - 1));
  return { symbol: LEVELS[index], color: COLORS[index] };
}

export default function HockeyKlasgroepResultaten({ schooljaar, leden }: Props) {
  const [lessons, setLessons] = useState<Row[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [participants, setParticipants] = useState<Row[]>([]);
  const [evaluations, setEvaluations] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLessonId("");
    setLessons([]);
    (async () => {
      const { data, error } = await supabase.from("hockey_lessen")
        .select("id,naam,lesdatum,leerjaar,status")
        .eq("schooljaar", schooljaar)
        .order("lesdatum", { ascending: false }).limit(100);
      if (!alive) return;
      if (error) setError(error.message);
      else setLessons(data ?? []);
    })();
    return () => { alive = false; };
  }, [schooljaar]);

  useEffect(() => {
    if (!lessonId) { setParticipants([]); setEvaluations([]); return; }
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [p, e] = await Promise.all([
          supabase.from("hockey_deelnemers").select("id,leerling_email").eq("les_id", lessonId),
          supabase.from("hockey_evaluaties").select("beoordeelde_id,type,rubrics,status").eq("les_id", lessonId),
        ]);
        if (p.error) throw p.error;
        if (e.error) throw e.error;
        if (alive) { setParticipants(p.data ?? []); setEvaluations(e.data ?? []); }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Resultaten laden mislukt"); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [lessonId]);

  const matrix = useMemo(() => {
    const byEmail = new Map(participants.map(p => [String(p.leerling_email ?? "").toLowerCase(), p.id]));
    return [...leden].sort((a, b) => {
      const classOrder = String(a.klas_naam ?? "").localeCompare(String(b.klas_naam ?? ""), "nl-BE", { numeric: true });
      return classOrder || Number(a.positie ?? 0) - Number(b.positie ?? 0);
    }).map(lid => {
      const participantId = byEmail.get(lid.leerling_email.toLowerCase());
      const scores = TYPES.map(type => {
        const values = evaluations
          .filter(e => e.beoordeelde_id === participantId && e.type === type && e.status === "ingediend")
          .flatMap(e => Object.values(e.rubrics ?? {}).map(Number).filter(n => n >= 1 && n <= 4));
        return average(values);
      });
      return { lid, scores };
    });
  }, [leden, participants, evaluations]);

  return (
    <section className="mt-5 rounded-3xl border border-white/15 bg-black/20 p-4 text-white">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(x => !x)}>
        <span className="text-lg font-black">🏑 Hockey-evaluaties</span>
        <span className="text-sm text-[#89C2AA]">{expanded ? "Sluiten ↑" : "Openen ↓"}</span>
      </button>
      {expanded && <>
        <p className="mt-2 text-sm text-white/60">Beoordelingen in de volgorde van je klasgroep. − onvoldoende · +/− bijna voldoende · + goed · ++ zeer goed.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select aria-label="Kies Hockey-les" className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#14212d] p-3 text-white" value={lessonId} onChange={e => setLessonId(e.target.value)}>
            <option value="">Kies Hockey-les</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.lesdatum} · {l.naam} ({l.status})</option>)}
          </select>
          <Link href="/les-lo/evaluaties/hockey" className="rounded-xl border border-[#89C2AA]/40 px-3 py-2 text-sm font-bold text-[#89C2AA]">Open Hockey →</Link>
        </div>
        {error && <p role="alert" className="mt-2 text-red-200">{error}</p>}
        {loading && <p className="mt-2 text-white/60">Resultaten laden...</p>}
        {lessonId && !loading && <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-max min-w-full border-collapse text-center text-sm">
            <thead><tr className="bg-white/10">
              <th scope="col" className="sticky left-0 z-10 min-w-32 border-r border-white/15 bg-[#29343c] px-3 py-3 text-left">Evaluatie</th>
              {matrix.map(({ lid }) => <th scope="col" key={lid.leerling_email} className="min-w-28 border-r border-white/10 px-3 py-3 align-bottom font-bold">
                <span className="block max-w-36 whitespace-normal">{lid.volledige_naam}</span>
                <span className="block text-xs font-normal text-white/55">{lid.klas_naam}</span>
              </th>)}
            </tr></thead>
            <tbody>{TYPES.map((type, typeIndex) => <tr key={type} className="border-t border-white/15">
              <th scope="row" className="sticky left-0 z-10 border-r border-white/15 bg-[#202a32] px-3 py-4 text-left font-black capitalize">{type}</th>
              {matrix.map(({ lid, scores }) => {
                const value = scores[typeIndex];
                const result = rating(value);
                return <td key={lid.leerling_email} className="border-r border-white/10 px-3 py-4">
                  <span title={value === null ? "Geen ingediende evaluatie" : `Gemiddelde: ${value.toFixed(2)}/4`}
                    className="inline-block min-w-12 text-center text-xl font-black" style={{ color: result.color }}>{result.symbol}</span>
                </td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>}
      </>}
    </section>
  );
}
