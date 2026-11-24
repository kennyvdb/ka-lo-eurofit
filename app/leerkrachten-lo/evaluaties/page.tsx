"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Group = { id: string; naam: string; schooljaar: string };
type Member = { leerling_email: string; volledige_naam: string | null; klas_naam: string | null; positie: number | null; family_name: string | null; given_name: string | null };
type Lesson = { id: string; naam: string; lesdatum: string; schooljaar?: string };
type HockeyParticipant = { id: string; les_id: string; leerling_email: string | null };
type HockeyEvaluation = { les_id: string; beoordeelde_id: string; type: string; rubrics: Record<string, unknown> | null; status: string };
type VolleyParticipant = { id: string; leerling_email: string; les_id: string };
type VolleyPeer = { beoordeelde_id: string; criteria: Record<string, unknown> | null; status: string };
type VolleySelf = { deelnemer_id: string; spelregels: number | null; spelniveau: number | null; status: string };
type VolleyState = { les: Lesson; participants: VolleyParticipant[]; peer: VolleyPeer[]; self: VolleySelf[] };
type Sport = "hockey" | "volleybal";
type Metric = { id: string; label: string; sport: Sport; mode: "mean" | "single" };
type Cell = { score: number | null; count: number };

// Nieuwe sporten later toevoegen via een extra configuratie én datakoppeling.
const METRICS: Metric[] = [
  { id: "hockey:techniek", label: "🏑 Hockey · techniek", sport: "hockey", mode: "mean" },
  { id: "hockey:wedstrijd", label: "🏑 Hockey · wedstrijd", sport: "hockey", mode: "mean" },
  { id: "hockey:samenwerken", label: "🏑 Hockey · samenwerken", sport: "hockey", mode: "mean" },
  { id: "volleybal:peer", label: "🏐 Volleybal · peerevaluatie", sport: "volleybal", mode: "mean" },
  { id: "volleybal:spelregels", label: "🏐 Volleybal · zelfevaluatie spelregels", sport: "volleybal", mode: "single" },
  { id: "volleybal:spelniveau", label: "🏐 Volleybal · zelfevaluatie spelniveau", sport: "volleybal", mode: "single" },
];
const PEER_KEYS = ["opslag", "aanval", "verdediging", "coaching"] as const;
const emailKey = (v: unknown) => String(v ?? "").trim().toLowerCase();
function schooljaarNu() { const d = new Date(); const y = d.getFullYear() - (d.getMonth() < 8 ? 1 : 0); return `${y}-${y + 1}`; }
function leerjaar(m: Member, g: Group | undefined): number | null {
  // Een klas zoals 5DSA of 4AM bepaalt het leerjaar; de groep is enkel een fallback.
  for (const raw of [m.klas_naam, g?.naam]) {
    const match = String(raw ?? "").match(/(?:^|[^\d])([3-6])\s*(?:e|de|ste|[A-Za-z]|\b)/i);
    if (match) return Number(match[1]);
  }
  return null;
}
function sportVoor(m: Member, g: Group | undefined): Sport | null {
  const year = leerjaar(m, g);
  return year === 3 || year === 4 ? "hockey" : year === 5 || year === 6 ? "volleybal" : null;
}
function displayName(m: Member) {
  const family = String(m.family_name ?? "").trim();
  const given = String(m.given_name ?? "").trim();
  return family && given ? `${family} ${given}` : m.volledige_naam || m.leerling_email;
}
// Kleuren volgens de aangeleverde evaluatieschaal: rood, oranje, lichtgroen, donkergroen.
function symbol(v: number | null) {
  if (v === null) return { label: "—", color: "text-white/45", bg: "bg-white/5", edge: "border-white/10" };
  if (v < 1.75) return { label: "−", color: "text-[#3B0B0B]", bg: "bg-[#FFA2A2]", edge: "border-[#FF2424]" };
  if (v < 2.5) return { label: "+/−", color: "text-[#49270B]", bg: "bg-[#FFC599]", edge: "border-[#FF9400]" };
  if (v < 3.25) return { label: "+", color: "text-[#103C13]", bg: "bg-[#B3F5B4]", edge: "border-[#29DB2C]" };
  return { label: "++", color: "text-[#102F0A]", bg: "bg-[#B0D4A7]", edge: "border-[#31880C]" };
}
function volleySymbol(v: number | null) {
  return v === null ? symbol(null) : symbol(Math.max(1, Math.min(4, Math.round(v))));
}
function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 4 ? n : null;
}
async function allRows<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
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
  const [hockeyLessons, setHockeyLessons] = useState<Lesson[]>([]);
  const [hockeyParticipants, setHockeyParticipants] = useState<HockeyParticipant[]>([]);
  const [hockeyEvaluations, setHockeyEvaluations] = useState<HockeyEvaluation[]>([]);
  const [volleyLessons, setVolleyLessons] = useState<Lesson[]>([]);
  const [volleyStates, setVolleyStates] = useState<VolleyState[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("all");
  const matrixScrollRef = useRef<HTMLDivElement>(null);

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
        if (active) {
          setAllowed(true);
          setGroups(gs);
          if (!gs.some(g => g.schooljaar === schooljaar) && gs.length) setSchooljaar([...gs].sort((a, b) => b.schooljaar.localeCompare(a.schooljaar))[0].schooljaar);
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Kon klasgroepen niet laden."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setMembers([]); setHockeyLessons([]); setHockeyParticipants([]); setHockeyEvaluations([]);
    setVolleyLessons([]); setVolleyStates([]); setSelectedLesson("all");
    if (!groupId) return;
    setBusy(true); setError("");
    (async () => {
      try {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const ms = await allRows<Member>((from, to) => supabase.from("lo_klasgroep_leden_view")
          .select("leerling_email,volledige_naam,klas_naam,positie,family_name,given_name")
          .eq("klasgroep_id", groupId).order("positie", { ascending: true }).range(from, to));
        if (!active) return;
        setMembers(ms);
        const needed = new Set(ms.map(m => sportVoor(m, group)));
        const loadHockey = async () => {
          const ls = await allRows<Lesson>((from, to) => supabase.from("hockey_lessen")
            .select("id,naam,lesdatum").eq("schooljaar", group.schooljaar).order("lesdatum", { ascending: false }).range(from, to));
          const ps: HockeyParticipant[] = [], es: HockeyEvaluation[] = [];
          for (let i = 0; i < ls.length; i += 50) {
            const ids = ls.slice(i, i + 50).map(l => l.id);
            const [part, ev] = await Promise.all([
              allRows<HockeyParticipant>((from, to) => supabase.from("hockey_deelnemers").select("id,les_id,leerling_email").in("les_id", ids).range(from, to)),
              allRows<HockeyEvaluation>((from, to) => supabase.from("hockey_evaluaties").select("les_id,beoordeelde_id,type,rubrics,status").in("les_id", ids).eq("status", "ingediend").range(from, to)),
            ]);
            ps.push(...part); es.push(...ev);
          }
          return { ls, ps, es };
        };
        const loadVolley = async () => {
          // De Volleybal-tabellen zijn bewust afgeschermd; uitsluitend bestaande teacher-RPC's gebruiken.
          const { data, error: listError } = await supabase.rpc("volleybal_lessen_lijst");
          if (listError) throw listError;
          const ls = (Array.isArray(data) ? data : [] as Lesson[]).filter((l: Lesson) => l.schooljaar === group.schooljaar);
          const states: VolleyState[] = [];
          for (let i = 0; i < ls.length; i += 5) {
            const batch = await Promise.all(ls.slice(i, i + 5).map(async (l: Lesson) => {
              const { data: state, error: stateError } = await supabase.rpc("volleybal_les_state", { p_les_id: l.id });
              if (stateError) throw stateError;
              return state as VolleyState;
            }));
            states.push(...batch);
          }
          return { ls, states };
        };
        // Laad geen sporten die niet tot de klasgroep behoren.
        const [hockey, volley] = await Promise.all([
          needed.has("hockey") ? loadHockey() : Promise.resolve(null),
          needed.has("volleybal") ? loadVolley() : Promise.resolve(null),
        ]);
        if (!active) return;
        if (hockey) { setHockeyLessons(hockey.ls); setHockeyParticipants(hockey.ps); setHockeyEvaluations(hockey.es); }
        if (volley) { setVolleyLessons(volley.ls); setVolleyStates(volley.states); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Kon evaluaties niet laden."); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [groupId, groups]);

  const schooljaren = useMemo(() => [...new Set([schooljaar, ...groups.map(g => g.schooljaar)])].sort().reverse(), [groups, schooljaar]);
  const availableGroups = useMemo(() => groups.filter(g => g.schooljaar === schooljaar), [groups, schooljaar]);
  const group = groups.find(g => g.id === groupId);
  const sortedMembers = useMemo(() => [...members].sort((a, b) => {
    const cls = String(a.klas_naam ?? "").localeCompare(String(b.klas_naam ?? ""), "nl-BE", { numeric: true });
    return cls || Number(a.positie ?? 0) - Number(b.positie ?? 0);
  }), [members]);
  const sports = useMemo(() => new Set(sortedMembers.map(m => sportVoor(m, group))), [sortedMembers, group]);
  const metrics = useMemo(() => METRICS.filter(m => sports.has(m.sport)), [sports]);
  const lessons = useMemo(() => [
    ...hockeyLessons.map(l => ({ ...l, sport: "hockey" as Sport })),
    ...volleyLessons.map(l => ({ ...l, sport: "volleybal" as Sport })),
  ].sort((a, b) => b.lesdatum.localeCompare(a.lesdatum)), [hockeyLessons, volleyLessons]);

  const matrix = useMemo(() => {
    const valid = new Set(sortedMembers.map(m => emailKey(m.leerling_email)));
    const values = new Map<string, number[]>(), counts = new Map<string, number>();
    const add = (mail: string | null | undefined, metric: string, score: number) => {
      const email = emailKey(mail);
      if (!valid.has(email)) return;
      const key = `${email}|${metric}`;
      values.set(key, [...(values.get(key) ?? []), score]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    };
    const hIdToEmail = new Map(hockeyParticipants.filter(p => selectedLesson === "all" || selectedLesson === `hockey:${p.les_id}`).map(p => [p.id, p.leerling_email]));
    for (const e of hockeyEvaluations) {
      const mail = hIdToEmail.get(e.beoordeelde_id);
      if (!mail || !["techniek", "wedstrijd", "samenwerken"].includes(e.type)) continue;
      const rubricValues = Object.values(e.rubrics ?? {}).map(numeric).filter((n): n is number => n !== null);
      // Bestaande Hockey-matrix middelt de afzonderlijke rubricwaarden.
      rubricValues.forEach(v => add(mail, `hockey:${e.type}`, v));
    }
    for (const state of volleyStates) {
      if (selectedLesson !== "all" && selectedLesson !== `volleybal:${state.les.id}`) continue;
      const idToEmail = new Map(state.participants.map(p => [p.id, p.leerling_email]));
      for (const e of state.peer ?? []) {
        if (e.status !== "ingediend") continue;
        const nums = PEER_KEYS.map(k => numeric(e.criteria?.[k]));
        if (nums.some(n => n === null)) continue;
        const avg = (nums as number[]).reduce((a, b) => a + b, 0) / nums.length;
        add(idToEmail.get(e.beoordeelde_id), "volleybal:peer", avg);
      }
      for (const e of state.self ?? []) {
        if (e.status !== "ingediend") continue;
        const rules = numeric(e.spelregels), level = numeric(e.spelniveau);
        if (rules !== null) add(idToEmail.get(e.deelnemer_id), "volleybal:spelregels", rules);
        if (level !== null) add(idToEmail.get(e.deelnemer_id), "volleybal:spelniveau", level);
      }
    }
    const result = new Map<string, Cell>();
    for (const [key, nums] of values) result.set(key, { score: nums.reduce((a, b) => a + b, 0) / nums.length, count: counts.get(key) ?? 0 });
    return result;
  }, [sortedMembers, selectedLesson, hockeyParticipants, hockeyEvaluations, volleyStates]);

  return (
    <AppShell title="KA LO App" subtitle="Evaluaties LO">
      <BaseHero
        label="LEERKRACHTEN LO"
        title={<>Evaluaties <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">per klasgroep</span></>}
        description="Alle evaluaties samen, met dezelfde leerlingvolgorde als bij Klasgroepen. Hockey voor 3e–4e, Volleybal voor 5e–6e."
        imageSrc="/functional/functionalfitness.png" imageAlt="Evaluaties lichamelijke opvoeding"
        quoteTitle="Evalueren om te groeien" quote="Observeer. Leer. Verbeter."
        actions={<Link href="/leerkrachten-lo" className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white">← Terug naar Leerkrachten LO</Link>}
      />
      <main className="mx-auto w-full min-w-0 max-w-[1500px] px-3 py-6 text-white sm:px-4">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">{error}</div>}
        {loading ? <p>Evaluaties laden...</p> : !allowed ? <p>Je hebt geen toegang tot dit overzicht.</p> : <>
          <section className="mb-5 rounded-3xl border border-white/15 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">Mijn klasgroepen</h2>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label htmlFor="evaluatie-schooljaar" className="text-sm font-bold text-white/75">Schooljaar</label>
              <select id="evaluatie-schooljaar" value={schooljaar} onChange={e => { setSchooljaar(e.target.value); setGroupId(""); }} className="rounded-xl border border-white/20 bg-[#152632] px-3 py-2 text-white">
                {schooljaren.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableGroups.map(g => <button key={g.id} type="button" onClick={() => setGroupId(g.id)} className={`rounded-2xl border p-4 text-left font-bold transition ${groupId === g.id ? "border-[#89C2AA] bg-[#89C2AA]/20" : "border-white/15 bg-black/20 hover:bg-white/10"}`}>{g.naam} <span className="float-right text-[#89C2AA]">→</span></button>)}
            </div>
            {!availableGroups.length && <p className="text-sm text-white/65">Geen klasgroepen voor dit schooljaar.</p>}
          </section>
          {group && <section className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-3 sm:p-6">
            <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0"><h2 className="break-words text-2xl font-black">{group.naam}</h2><p className="text-sm text-white/60">{sortedMembers.length} leerlingen · {group.schooljaar}</p></div>
              <label className="flex w-full min-w-0 flex-col gap-1.5 text-sm sm:w-auto sm:max-w-[330px]">Evaluatieles
                <select aria-label="Kies evaluatieles" value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} className="block h-11 w-full min-w-0 max-w-full rounded-xl border border-white/20 bg-[#152632] px-3 text-base text-white sm:max-w-[300px]">
                  <option value="all">Alle lessen samen</option>
                  {lessons.map(l => <option key={`${l.sport}:${l.id}`} value={`${l.sport}:${l.id}`}>{l.sport === "hockey" ? "🏑" : "🏐"} {l.naam} ({l.lesdatum})</option>)}
                </select>
              </label>
            </div>
            {busy ? <p>Resultaten laden...</p> : !sortedMembers.length ? <p>Geen leerlingen gevonden in deze klasgroep.</p> : <>
              <p className="mb-3 text-xs text-white/65">— = nog geen ingediende evaluatie. Tik op een score voor het gemiddelde. Veeg de tabel naar links om de leerlingen te zien.</p>
              {sortedMembers.some(m => !sportVoor(m, group)) && <p className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">Bij sommige leerlingen kon het leerjaar niet worden bepaald uit de klasnaam. Controleer hun klasgegevens.</p>}
              <div className="mb-2 flex items-center justify-end gap-2 sm:hidden">
                <span className="mr-auto text-xs text-white/65">← Veeg voor meer leerlingen →</span>
                <button type="button" aria-label="Scroll naar links" className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-lg" onClick={() => matrixScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}>←</button>
                <button type="button" aria-label="Scroll naar rechts" className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-lg" onClick={() => matrixScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}>→</button>
              </div>
              <div ref={matrixScrollRef} role="region" aria-label="Evaluatiematrix: horizontaal scrollbaar" tabIndex={0} className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-white/15" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                <table className="w-max min-w-full border-collapse text-sm">
                  <thead><tr className="bg-[#203846]">
                    <th className="sticky left-0 z-20 w-[132px] min-w-[132px] max-w-[132px] border-r border-white/20 bg-[#203846] p-2 text-left sm:w-[210px] sm:min-w-[210px] sm:max-w-none sm:p-3">Evaluatie</th>
                    {sortedMembers.map((m, i) => <th key={`${m.leerling_email}-${i}`} className="min-w-[108px] border-r border-white/10 p-2 text-center align-bottom"><span className="inline-block max-w-[110px] break-words">{displayName(m)}</span><span className="mt-1 block text-xs font-normal text-white/60">{m.klas_naam}</span></th>)}
                  </tr></thead>
                  <tbody>{metrics.map((metric, i) => <tr key={metric.id} className={i % 2 ? "bg-white/[0.04]" : "bg-black/10"}>
                    <th scope="row" className="sticky left-0 z-10 w-[132px] min-w-[132px] max-w-[132px] break-words border-r border-white/15 bg-[#182b37] p-2 text-left text-xs font-bold sm:w-[210px] sm:min-w-[210px] sm:max-w-none sm:p-3 sm:text-sm">{metric.label}</th>
                    {sortedMembers.map((m, j) => {
                      const relevant = sportVoor(m, group) === metric.sport;
                      const cell = relevant ? matrix.get(`${emailKey(m.leerling_email)}|${metric.id}`) : undefined;
                      const v = cell?.score ?? null;
                      const s = metric.sport === "volleybal" ? volleySymbol(v) : symbol(v);
                      const title = !relevant ? "Andere graad" : v === null ? "Nog geen ingediende beoordeling" : `${metric.mode === "mean" ? "Gemiddelde" : "Score"} ${v.toFixed(2)}/4 · ${cell?.count ?? 0} beoordeling(en)`;
                      return <td key={`${m.leerling_email}-${j}`} className="border-r border-white/10 p-3 text-center"><span title={title} className={`inline-flex min-w-12 items-center justify-center rounded-md border-b-[5px] px-3 py-2 text-base font-black ${relevant ? s.bg : "bg-transparent"} ${relevant ? s.color : "text-white/20"} ${relevant ? s.edge : "border-transparent"}`}>{relevant ? s.label : "·"}</span></td>;
                    })}
                  </tr>)}</tbody>
                </table>
              </div>
              {!metrics.length && <p className="mt-4 text-white/70">Geen evaluatiesport gekoppeld aan deze leerjaren.</p>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4 sm:text-sm">
                <span className="rounded-md border-b-4 border-[#FF2424] bg-[#FFA2A2] p-2 text-[#3B0B0B]">− Voldoet helemaal niet</span>
                <span className="rounded-md border-b-4 border-[#FF9400] bg-[#FFC599] p-2 text-[#49270B]">+/− Heeft extra ondersteuning nodig</span>
                <span className="rounded-md border-b-4 border-[#29DB2C] bg-[#B3F5B4] p-2 text-[#103C13]">+ Voert goed uit</span>
                <span className="rounded-md border-b-4 border-[#31880C] bg-[#B0D4A7] p-2 text-[#102F0A]">++ Onderscheidt zich</span>
              </div>
              <p className="mt-3 text-xs text-white/50">Hockey (3e–4e) en Volleybal (5e–6e). De gemiddelden worden berekend uit ingediende beoordelingen. Nieuwe sporten kunnen later als extra rijen worden gekoppeld.</p>
            </>}
          </section>}
        </>}
      </main>
    </AppShell>
  );
}
