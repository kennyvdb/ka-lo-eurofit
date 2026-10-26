"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { allowedRoles, type Audience } from "@/lib/lo-messaging";

const supabase = createClient();
type Group = { id: string; naam: string };
type Person = { id: string; volledige_naam: string | null; rol: string; klas_naam: string | null };
type ExtendedAudience = Audience | "sneeuwstage_2026";

const audienceOptions: { value: ExtendedAudience; label: string }[] = [
  { value: "sneeuwstage_2026", label: "🏔️ Sneeuwstage 2026" },
  { value: "alle_leerlingen", label: "Alle leerlingen" },
  { value: "alle_leerkrachten", label: "Alle leerkrachten" },
  { value: "iedereen", label: "Iedereen" },
  { value: "lo_team", label: "LO-team" },
  { value: "klasgroepen", label: "Mijn LO-klasgroepen" },
  { value: "klassen", label: "Officiële klassen" },
  { value: "personen", label: "Individuele personen" },
];

const SNEEUWSTAGE_ID = "84654025-e4f5-4fd9-aea3-a3d7dd35787f";
const EXTRA_IDS = [
  "fe806ca7-3d8b-4d71-9842-cd7b0744ad1f", // Glenn Labie
  "db4ff4a1-9770-474d-ae09-aa53d8ec3a83", // Joni Vandewalle
];

export default function BerichtencentrumPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [audience, setAudience] = useState<ExtendedAudience>("klasgroepen");
  const [selection, setSelection] = useState<string[]>([]);
  const [onderwerp, setOnderwerp] = useState("");
  const [inhoud, setInhoud] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [aanvraagId, setAanvraagId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState("");
  const [errorResult, setErrorResult] = useState(false);
  const [search, setSearch] = useState("");
  const [sneeuwstageCount, setSneeuwstageCount] = useState<number | null>(null);
  const [sneeuwstageError, setSneeuwstageError] = useState("");
  const [checking, setChecking] = useState(false);

  const classes = useMemo(
    () => [...new Set(people.filter(p => p.rol === "leerling").map(p => p.klas_naam).filter((x): x is string => Boolean(x)))].sort(),
    [people]
  );

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profielen").select("rol").eq("id", user.id).maybeSingle();
      if (!allowedRoles.includes(String(profile?.rol))) { setLoading(false); return; }
      setAllowed(true);
      const [g, p] = await Promise.all([
        supabase.from("lo_klasgroepen").select("id, naam").eq("leerkracht_id", user.id).order("naam"),
        supabase.from("profielen").select("id, volledige_naam, rol, klas_naam").order("volledige_naam").limit(10000),
      ]);
      setGroups((g.data ?? []) as Group[]);
      setPeople((p.data ?? []) as Person[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!allowed || audience !== "sneeuwstage_2026") return;
    let cancelled = false;
    void (async () => {
      setChecking(true);
      setSneeuwstageError("");
      setSneeuwstageCount(null);
      const { data, error } = await supabase.from("sneeuwstage_deelnemers")
        .select("leerling_id")
        .eq("sneeuwstage_id", SNEEUWSTAGE_ID)
        .eq("actief", true);
      if (cancelled) return;
      if (error) {
        setSneeuwstageError("De actuele deelnemerslijst kon niet worden gecontroleerd. De server controleert de ontvangers opnieuw bij verzending.");
      } else {
        const unique = new Set((data ?? []).map(x => x.leerling_id).filter(Boolean));
        EXTRA_IDS.forEach(id => unique.add(id));
        setSneeuwstageCount(unique.size);
      }
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [allowed, audience]);

  function toggle(id: string) {
    setSelection(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function send() {
    if (!onderwerp.trim() || !inhoud.trim()) return;
    const schoolWide = ["alle_leerlingen", "alle_leerkrachten", "iedereen"].includes(audience);
    if (schoolWide && !window.confirm("Je verstuurt dit bericht naar een volledige schooldoelgroep. Ben je zeker?")) return;
    if (audience === "sneeuwstage_2026") {
      if (sneeuwstageCount !== 53) {
        setErrorResult(true);
        setResult("De doelgroep telt niet precies 53 ontvangers of kon niet worden gecontroleerd. Verzending is geblokkeerd.");
        return;
      }
      if (!window.confirm("Je verstuurt dit bericht naar de 51 actieve sneeuwstageleerlingen, Glenn Labie en Joni Vandewalle (53 ontvangers). Ben je zeker?")) return;
    }
    if (!window.confirm("Bericht definitief verzenden?")) return;
    setBusy(true);
    setResult("");
    setErrorResult(false);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Je sessie is verlopen. Meld je opnieuw aan.");
      const response = await fetch("/api/lo-berichten/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          onderwerp, inhoud, link, doelgroep: audience, selectie: selection,
          bevestigSchoolbreed: schoolWide, aanvraag_id: aanvraagId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? `Verzenden mislukt (${response.status})`);
      setResult(`Bericht opgeslagen voor ${data.ontvangers} ontvanger(s). Pushmeldingen worden via de wachtrij verwerkt.`);
      setAanvraagId(crypto.randomUUID());
      setOnderwerp("");
      setInhoud("");
      setLink("");
    } catch (e: unknown) {
      setErrorResult(true);
      setResult(e instanceof Error ? e.message : "Verzenden mislukt");
    } finally {
      setBusy(false);
    }
  }

  const choices = audience === "klasgroepen"
    ? groups.map(g => ({ id: g.id, label: g.naam }))
    : audience === "klassen"
      ? classes.map(c => ({ id: c, label: c }))
      : audience === "personen"
        ? people.filter(p => (p.volledige_naam ?? "").toLowerCase().includes(search.toLowerCase())).slice(0, 100)
          .map(p => ({ id: p.id, label: `${p.volledige_naam ?? "Onbekend"} (${p.rol})` }))
        : [];

  const needsSelection = ["klasgroepen", "klassen", "personen"].includes(audience);
  const canSend = !busy && !checking && !!onderwerp.trim() && !!inhoud.trim()
    && (!needsSelection || selection.length > 0)
    && (audience !== "sneeuwstage_2026" || sneeuwstageCount === 53);

  return (
    <AppShell title="LO App" subtitle="Berichtencentrum">
      <div className="mx-auto max-w-3xl space-y-4 text-white">
        <h1 className="text-2xl font-black">LO Berichtencentrum</h1>
        {loading ? <p>Laden…</p> : !allowed ? <p>Geen toegang.</p> : <>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label htmlFor="bericht-doelgroep" className="block text-sm font-bold">Ontvangers</label>
            <select id="bericht-doelgroep" value={audience} onChange={e => {
              setAudience(e.target.value as ExtendedAudience);
              setSelection([]);
              setResult("");
            }} className="mt-2 w-full rounded-xl bg-slate-900 p-3">
              {audienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {audience === "sneeuwstage_2026" && (
              <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">🏔️</span>
                  <div>
                    <h2 className="font-black text-white">Sneeuwstage 2026</h2>
                    <p className="text-xs text-white/70">Actieve deelnemers + twee LO-leerkrachten</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-6 text-white/85">
                  <p>🎿 51 actieve leerlingen</p>
                  <p>👨‍🏫 Glenn Labie</p>
                  <p>👨‍🏫 Joni Vandewalle</p>
                </div>
                <p className="mt-3 text-sm font-bold text-emerald-100" role="status">
                  {checking ? "Ontvangers controleren…" : sneeuwstageCount !== null
                    ? `${sneeuwstageCount} unieke ontvangers gevonden${sneeuwstageCount === 53 ? " ✓" : " — verzending geblokkeerd"}`
                    : "Ontvangers nog niet gecontroleerd"}
                </p>
                {sneeuwstageError && <p className="mt-2 text-xs text-amber-200">{sneeuwstageError}</p>}
                <p className="mt-2 text-xs leading-5 text-white/60">
                  De server haalt de actuele deelnemerslijst opnieuw op bij verzending.
                  Bij een afwijking van de verwachte 53 ontvangers wordt niet verzonden.
                </p>
              </div>
            )}

            {audience === "personen" && <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Zoek een naam" aria-label="Zoek een persoon"
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-3" />}
            {choices.length > 0 && <div className="mt-3 max-h-60 space-y-2 overflow-auto">
              {choices.map(o => <label key={o.id} className="flex items-center gap-3 rounded-lg bg-black/20 p-2">
                <input type="checkbox" checked={selection.includes(o.id)} onChange={() => toggle(o.id)} />
                {o.label}
              </label>)}
            </div>}
            {needsSelection && <p className="mt-2 text-xs text-white/60">{selection.length} geselecteerd</p>}
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="block text-sm font-bold">Onderwerp
              <input maxLength={120} value={onderwerp} onChange={e => setOnderwerp(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3" />
            </label>
            <label className="block text-sm font-bold">Bericht
              <textarea maxLength={2000} rows={5} value={inhoud} onChange={e => setInhoud(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3" />
            </label>
            <label className="block text-sm font-bold">Link binnen de LO App (optioneel)
              <input placeholder="/challenges" value={link} onChange={e => setLink(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3" />
            </label>
            <button disabled={!canSend} onClick={() => void send()}
              className="rounded-xl bg-sky-600 px-5 py-3 font-black transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Verzenden…" : "Bericht verzenden"}
            </button>
            {result && <p role="status" className={`text-sm ${errorResult ? "text-red-200" : "text-sky-200"}`}>{result}</p>}
          </section>
        </>}
      </div>
    </AppShell>
  );
}
