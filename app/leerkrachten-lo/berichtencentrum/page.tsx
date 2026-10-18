"use client";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { allowedRoles, type Audience } from "@/lib/lo-messaging";
const supabase = createClient();
type Group = { id: string; naam: string };
type Person = { id: string; volledige_naam: string | null; rol: string; klas_naam: string | null };
const audienceOptions: { value: Audience; label: string }[] = [{ value: "alle_leerlingen", label: "Alle leerlingen" }, { value: "alle_leerkrachten", label: "Alle leerkrachten" }, { value: "iedereen", label: "Iedereen" }, { value: "lo_team", label: "LO-team" }, { value: "klasgroepen", label: "Mijn LO-klasgroepen" }, { value: "klassen", label: "Officiële klassen" }, { value: "personen", label: "Individuele personen" }];
export default function BerichtencentrumPage() {
 const [allowed, setAllowed] = useState(false);
 const [loading, setLoading] = useState(true);
 const [groups, setGroups] = useState<Group[]>([]);
 const [people, setPeople] = useState<Person[]>([]);
 const [audience, setAudience] = useState<Audience>("klasgroepen");
 const [selection, setSelection] = useState<string[]>([]);
 const [onderwerp, setOnderwerp] = useState("");
 const [inhoud, setInhoud] = useState("");
 const [link, setLink] = useState("");
 const [busy, setBusy] = useState(false);
 const [aanvraagId, setAanvraagId] = useState(() => crypto.randomUUID());
 const [result, setResult] = useState("");
 const [search, setSearch] = useState("");
 const classes = useMemo(() => [...new Set(people.filter(p => p.rol === "leerling").map(p => p.klas_naam).filter((x): x is string => Boolean(x)))].sort(), [people]);
 useEffect(() => { void (async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setLoading(false); return; }
  const { data: profile } = await supabase.from("profielen").select("rol").eq("id", user.id).maybeSingle();
  if (!allowedRoles.includes(String(profile?.rol))) { setLoading(false); return; }
  setAllowed(true);
  const [g, p] = await Promise.all([supabase.from("lo_klasgroepen").select("id, naam").eq("leerkracht_id", user.id).order("naam"), supabase.from("profielen").select("id, volledige_naam, rol, klas_naam").order("volledige_naam").limit(10000)]);
  setGroups((g.data ?? []) as Group[]);
  setPeople((p.data ?? []) as Person[]);
  setLoading(false);
 })(); }, []);
 function toggle(id: string) { setSelection(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
 async function send() {
  if (!onderwerp.trim() || !inhoud.trim()) return;
  const schoolWide = ["alle_leerlingen", "alle_leerkrachten", "iedereen"].includes(audience);
  if (schoolWide && !window.confirm("Je verstuurt dit bericht naar een volledige schooldoelgroep. Ben je zeker?")) return;
  if (!window.confirm("Bericht definitief verzenden?")) return;
  setBusy(true);
  setResult("");
  try {
   const response = await fetch("/api/lo-berichten/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onderwerp, inhoud, link, doelgroep: audience, selectie: selection, bevestigSchoolbreed: schoolWide, aanvraag_id: aanvraagId }) });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error ?? "Verzenden mislukt");
   setResult(`Opgeslagen voor ${data.ontvangers} ontvangers. ${data.push_uitgesteld ? "Push voor grote groepen is nog niet geactiveerd." : `${data.push_verzonden} pushmeldingen aangeboden aan de pushdienst.`}`);
   setAanvraagId(crypto.randomUUID());
   setOnderwerp(""); setInhoud(""); setLink("");
  } catch (e: unknown) { setResult(e instanceof Error ? e.message : "Verzenden mislukt"); }
  finally { setBusy(false); }
 }
 const choices = audience === "klasgroepen" ? groups.map(g => ({ id: g.id, label: g.naam })) : audience === "klassen" ? classes.map(c => ({ id: c, label: c })) : audience === "personen" ? people.filter(p => (p.volledige_naam ?? "").toLowerCase().includes(search.toLowerCase())).slice(0, 100).map(p => ({ id: p.id, label: `${p.volledige_naam ?? "Onbekend"} (${p.rol})` })) : [];
 return <AppShell title="LO App" subtitle="Berichtencentrum"><div className="mx-auto max-w-3xl space-y-4 text-white"><h1 className="text-2xl font-black">LO Berichtencentrum</h1>{loading ? <p>Laden…</p> : !allowed ? <p>Geen toegang.</p> : <><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><label className="block text-sm font-bold">Ontvangers</label><select value={audience} onChange={e => { setAudience(e.target.value as Audience); setSelection([]); }} className="mt-2 w-full rounded-xl bg-slate-900 p-3">{audienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{audience === "personen" && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek een naam" className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-3"/>}{choices.length > 0 && <div className="mt-3 max-h-60 space-y-2 overflow-auto">{choices.map(o => <label key={o.id} className="flex items-center gap-3 rounded-lg bg-black/20 p-2"><input type="checkbox" checked={selection.includes(o.id)} onChange={() => toggle(o.id)}/>{o.label}</label>)}</div>}{["klasgroepen", "klassen", "personen"].includes(audience) && <p className="mt-2 text-xs text-white/60">{selection.length} geselecteerd</p>}</section><section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"><label className="block text-sm font-bold">Onderwerp<input maxLength={120} value={onderwerp} onChange={e => setOnderwerp(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"/></label><label className="block text-sm font-bold">Bericht<textarea maxLength={2000} rows={5} value={inhoud} onChange={e => setInhoud(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"/></label><label className="block text-sm font-bold">Link binnen de LO App (optioneel)<input placeholder="/challenges" value={link} onChange={e => setLink(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3"/></label><button disabled={busy || !onderwerp.trim() || !inhoud.trim() || (["klasgroepen", "klassen", "personen"].includes(audience) && selection.length === 0)} onClick={() => void send()} className="rounded-xl bg-sky-600 px-5 py-3 font-black disabled:opacity-40">{busy ? "Verzenden…" : "Bericht verzenden"}</button>{result && <p className="text-sm text-sky-200">{result}</p>}</section></>}</div></AppShell>;
}
