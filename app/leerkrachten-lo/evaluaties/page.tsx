"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
type Group = { id: string; naam: string; schooljaar: string };
type Member = { leerling_email: string; volledige_naam: string | null; klas_naam: string | null; positie: number | null; family_name: string | null; given_name: string | null };
type Participant = { id: string; les_id: string; leerling_email: string | null };
type Evaluation = { les_id: string; beoordeelde_id: string; type: string; rubrics: Record<string, unknown> | null; status: string };
type Lesson = { id: string; naam: string; lesdatum: string };
type Cell = { score: number | null; count: number };
const TYPES = ["techniek", "wedstrijd", "samenwerken"] as const;
const LABELS: Record<string, string> = { techniek: "Hockey: techniek", wedstrijd: "Hockey: wedstrijd", samenwerken: "Hockey: samenwerken" };
function schooljaarNu() { const d = new Date(); const y = d.getFullYear() - (d.getMonth() < 8 ? 1 : 0); return `${y}-${y + 1}`; }
function normalize(v: unknown) { return String(v ?? "").trim().toLowerCase(); }
function symbol(v: number | null) {
  if (v === null) return { label: "—", color: "text-white/35", bg: "bg-white/5" };
  if (v < 1.75) return { label: "−", color: "text-red-200", bg: "bg-red-500/30" };
  if (v < 2.5) return { label: "+/−", color: "text-orange-200", bg: "bg-orange-500/30" };
  if (v < 3.25) return { label: "+", color: "text-sky-200", bg: "bg-sky-500/30" };
  return { label: "++", color: "text-green-200", bg: "bg-green-500/30" };
}
function displayName(m: Member) {
  const family = String(m.family_name ?? "").trim();
  const given = String(m.given_name ?? "").trim();
  return family && given ? `${family} ${given}` : m.volledige_naam || m.leerling_email;
}
async function allRows<T>(makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await makeQuery(from, from + 999);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    result.push(...batch);
    if (batch.length < 1000) break;
  }
  return result;
}
export default function EvaluatiesLeerkrachtenPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [schooljaar, setSchooljaar] = useState(schooljaarNu());
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) throw new Error("Meld je aan om evaluaties te bekijken.");
        const { data: profile, error: profileError } = await supabase.from("profielen").select("rol").eq("id", auth.user.id).single();
        if (profileError) throw profileError;
        if (!["lo_leerkracht", "admin"].includes(String(profile?.rol))) throw new Error("Geen toegang: enkel LO-leerkrachten en admins.");
        const gs = await allRows<Group>((from, to) => supabase.from("lo_klasgroepen")
          .select("id,naam,schooljaar").eq("leerkracht_id", auth.user!.id).order("naam").range(from, to));
        if (active) { setAllowed(true); setGroups(gs); if (!gs.some(g => g.schooljaar === schooljaar) && gs.length) setSchooljaar([...gs].sort((a,b)=>b.schooljaar.localeCompare(a.schooljaar))[0].schooljaar); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Kon klasgroepen niet laden."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []); // initiële controle

  useEffect(() => {
    let active = true;
    setMembers([]); setLessons([]); setParticipants([]); setEvaluations([]); setSelectedLesson("all");
    if (!groupId) return;
    setBusy(true); setError("");
    (async () => {
      try {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const [ms, ls] = await Promise.all([
          allRows<Member>((from, to) => supabase.from("lo_klasgroep_leden_view")
            .select("leerling_email,volledige_naam,klas_naam,positie,family_name,given_name")
            .eq("klasgroep_id", groupId).order("positie", { ascending: true }).range(from, to)),
          allRows<Lesson>((from, to) => supabase.from("hockey_lessen")
            .select("id,naam,lesdatum").eq("schooljaar", group.schooljaar).order("lesdatum", { ascending: false }).range(from, to)),
        ]);
        if (!active) return;
        setMembers(ms); setLessons(ls);
        if (!ls.length) return;
        const ps: Participant[] = [];
        const es: Evaluation[] = [];
        for (let i = 0; i < ls.length; i += 50) {
          const ids = ls.slice(i, i + 50).map(l => l.id);
          const [part, ev] = await Promise.all([
            allRows<Participant>((from, to) => supabase.from("hockey_deelnemers").select("id,les_id,leerling_email").in("les_id", ids).range(from, to)),
            allRows<Evaluation>((from, to) => supabase.from("hockey_evaluaties").select("les_id,beoordeelde_id,type,rubrics,status").in("les_id", ids).eq("status", "ingediend").range(from, to)),
          ]);
          ps.push(...part); es.push(...ev);
        }
        if (active) { setParticipants(ps); setEvaluations(es); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Kon evaluaties niet laden."); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [groupId, groups]);

  const schooljaren = useMemo(() => [...new Set([schooljaar, ...groups.map(g => g.schooljaar)])].sort().reverse(), [groups, schooljaar]);
  const availableGroups = useMemo(() => groups.filter(g => g.schooljaar === schooljaar), [groups, schooljaar]);
  const sortedMembers = useMemo(() => [...members].sort((a,b) => {
    const cls = String(a.klas_naam ?? "").localeCompare(String(b.klas_naam ?? ""), "nl-BE", { numeric: true });
    return cls || Number(a.positie ?? 0) - Number(b.positie ?? 0);
  }), [members]);
  const matrix = useMemo(() => {
    const valid = new Set(sortedMembers.map(m => normalize(m.leerling_email)));
    const byParticipant = new Map(participants.filter(p => valid.has(normalize(p.leerling_email)) && (selectedLesson === "all" || p.les_id === selectedLesson)).map(p => [p.id, normalize(p.leerling_email)]));
    const scores = new Map<string, number[]>();
    const counts = new Map<string, number>();
    for (const e of evaluations) {
      const mail = byParticipant.get(e.beoordeelde_id);
      if (!mail || !TYPES.some(t => t === e.type)) continue;
      const key = `${mail}|${e.type}`;
      const values = Object.values(e.rubrics ?? {}).map(Number).filter(v => Number.isFinite(v) && v >= 1 && v <= 4);
      if (!values.length) continue;
      scores.set(key, [...(scores.get(key) ?? []), ...values]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const out = new Map<string, Cell>();
    for (const m of sortedMembers) for (const t of TYPES) {
      const key = `${normalize(m.leerling_email)}|${t}`;
      const nums = scores.get(key) ?? [];
      out.set(key, { score: nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null, count: counts.get(key) ?? 0 });
    }
    return out;
  }, [sortedMembers, participants, evaluations, selectedLesson]);
  const group = groups.find(g => g.id === groupId);
  return (
    <AppShell title="KA LO App" subtitle="Evaluaties LO">
      <BaseHero label="LEERKRACHTEN LO" title={<>Evaluaties <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">per klasgroep</span></>}
        description="Alle evaluaties samen, met dezelfde leerlingvolgorde als bij Klasgroepen."
        imageSrc="/functional/functionalfitness.png" imageAlt="Evaluaties lichamelijke opvoeding"
        quoteTitle="Evalueren om te groeien" quote="Observeer. Leer. Verbeter."
        actions={<Link href="/leerkrachten-lo" className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white">← Terug naar Leerkrachten LO</Link>} />
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 text-white">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">{error}</div>}
        {loading ? <p>Evaluaties laden...</p> : !allowed ? <p>Je hebt geen toegang tot dit overzicht.</p> : <>
          <section className="mb-5 rounded-3xl border border-white/15 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">Mijn klasgroepen</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label htmlFor="evaluatie-schooljaar" className="text-sm font-bold text-white/75">Schooljaar</label>
              <select id="evaluatie-schooljaar" value={schooljaar} onChange={e => { setSchooljaar(e.target.value); setGroupId(""); }} className="rounded-xl border border-white/20 bg-[#152632] px-3 py-2 text-white">
                {schooljaren.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableGroups.map(g => <button key={g.id} type="button" onClick={() => setGroupId(g.id)} className={`rounded-2xl border p-4 text-left font-bold transition ${groupId === g.id ? "border-[#89C2AA] bg-[#89C2AA]/20" : "border-white/15 bg-black/20 hover:bg-white/10"}`}>{g.naam} <span className="float-right text-[#89C2AA]">→</span></button>)}
            </div>
            {!availableGroups.length && <p className="text-sm text-white/65">Geen klasgroepen voor dit schooljaar.</p>}
          </section>
          {group && <section className="rounded-3xl border border-white/15 bg-white/5 p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-2xl font-black">{group.naam}</h2><p className="text-sm text-white/60">{sortedMembers.length} leerlingen · {group.schooljaar}</p></div>
              <label className="flex items-center gap-2 text-sm">Hockeylessen
                <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} className="max-w-[240px] rounded-xl border border-white/20 bg-[#152632] p-2 text-white">
                  <option value="all">Alle lessen samen</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.naam} ({l.lesdatum})</option>)}
                </select>
              </label>
            </div>
            {busy ? <p>Resultaten laden...</p> : !sortedMembers.length ? <p>Geen leerlingen gevonden in deze klasgroep.</p> : <>
              <p className="mb-3 text-xs text-white/65">Horizontaal scrollen om alle leerlingen te bekijken. — = nog geen ingediende evaluatie. Klik op een score om het gemiddelde te zien.</p>
              <div className="overflow-x-auto rounded-2xl border border-white/15">
                <table className="w-max min-w-full border-collapse text-sm">
                  <thead><tr className="bg-[#203846]">
                    <th className="sticky left-0 z-20 min-w-[175px] border-r border-white/20 bg-[#203846] p-3 text-left">Evaluatie</th>
                    {sortedMembers.map((m,i) => <th key={`${m.leerling_email}-${i}`} className="min-w-[95px] border-r border-white/10 p-2 text-center align-bottom"><span className="inline-block max-w-[110px] break-words">{displayName(m)}</span><span className="mt-1 block text-xs font-normal text-white/60">{m.klas_naam}</span></th>)}
                  </tr></thead>
                  <tbody>{TYPES.map((t,i) => <tr key={t} className={i%2 ? "bg-white/[0.04]" : "bg-black/10"}>
                    <th scope="row" className="sticky left-0 z-10 border-r border-white/15 bg-[#182b37] p-3 text-left font-bold">{LABELS[t]}</th>
                    {sortedMembers.map((m,j) => { const c = matrix.get(`${normalize(m.leerling_email)}|${t}`) ?? { score: null, count: 0 }; const s = symbol(c.score); return <td key={`${m.leerling_email}-${j}`} className="border-r border-white/10 p-3 text-center"><span title={c.score === null ? "Nog geen beoordeling" : `Gemiddelde ${c.score.toFixed(2)}/4 · ${c.count} ingediend`} className={`inline-flex min-w-12 items-center justify-center rounded-xl px-2 py-2 text-base font-black ${s.bg} ${s.color}`}>{s.label}</span></td>; })}
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70"><span>🔴 − onvoldoende</span><span>🟠 +/− bijna voldoende</span><span>🔵 + goed</span><span>🟢 ++ zeer goed</span></div>
              <p className="mt-3 text-xs text-white/50">Dit overzicht toont momenteel Hockey. Nieuwe evaluatiesporten kunnen later als extra rijen worden toegevoegd.</p>
            </>}
          </section>}
        </>}
      </main>
    </AppShell>
  );
}
