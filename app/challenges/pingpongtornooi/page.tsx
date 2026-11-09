"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Tornooi = { id: string; naam: string; schooljaar: string; status: string; inschrijven_tot: string | null; tornooivorm: string | null };
type Profiel = { id: string; volledige_naam: string | null; klas_naam: string | null };
type Inschrijving = { id: string; leerling_id: string; tornooi_id: string };
type Poule = { id: string; naam: string; tornooi_id: string };
type Lid = { poule_id: string; inschrijving_id: string };
type Wedstrijd = { id: string; tornooi_id: string; poule_id: string | null; ronde: string; speler1_id: string; speler2_id: string; status: string; speelslot_id: string | null; score1: number | null; score2: number | null; winnaar_id: string | null; score_ingediend_door: string | null; score_bevestigd_op: string | null };
type Slot = { id: string; speeldatum: string; pauze: string; tafel: number; volgnummer: number };
type Voorstel = { id: string; wedstrijd_id: string; speelslot_id: string; status: string; speler1_akkoord: boolean | null; speler2_akkoord: boolean | null; vervalt_op: string };
type Beschikbaarheid = { id: string; pauze: string; beschikbaar: boolean };
type Afwezigheid = { id: string; van_datum: string; tot_datum: string; reden: string | null };
type Melding = { id: string; bericht: string; gelezen_op: string | null; aangemaakt_op: string };
type Stand = { poule_id: string; leerling_id: string; gespeeld: number; gewonnen: number; verloren: number; punten: number };
type Tab = "wedstrijden" | "klassement" | "knockout" | "regels" | "mijn";

const pauzes = [
  { id: "ochtend", naam: "Ochtend", aantal: 4 },
  { id: "voormiddag", naam: "Voormiddag", aantal: 2 },
  { id: "middag", naam: "Middag", aantal: 4 },
  { id: "namiddag", naam: "Namiddag", aantal: 2 },
];
const pauzeIndex = (p: string) => Math.max(0, pauzes.findIndex(x => x.id === p));
const datum = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
const fouttekst = (e: unknown) => e instanceof Error ? e.message : String(e);
const paneel: React.CSSProperties = { padding: 18, borderRadius: 22, background: "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035))", border: "1px solid rgba(255,255,255,.13)" };
const muted: React.CSSProperties = { color: "rgba(234,240,255,.72)", fontSize: 13, lineHeight: 1.6 };
const knop: React.CSSProperties = { borderRadius: 13, padding: "10px 14px", background: "rgba(137,194,170,.16)", border: "1px solid rgba(137,194,170,.38)", color: "#eaf0ff", fontWeight: 750, cursor: "pointer" };
const tabs: { id: Tab; titel: string; icoon: string }[] = [
  { id: "wedstrijden", titel: "Wedstrijden", icoon: "📅" },
  { id: "klassement", titel: "Klassement", icoon: "🏆" },
  { id: "knockout", titel: "Knock-out", icoon: "🥇" },
  { id: "regels", titel: "Spelregels", icoon: "📖" },
  { id: "mijn", titel: "Mijn tornooi", icoon: "🎯" },
];

function Sectie({ titel, children }: { titel: string; children: React.ReactNode }) {
  return <section style={paneel}><h2 style={{ fontSize: 19, fontWeight: 850, margin: "0 0 15px" }}>{titel}</h2>{children}</section>;
}
function Status({ status, scoreIngediend }: { status: string; scoreIngediend?: boolean }) {
  const text = status === "gespeeld" ? "Uitslag definitief" : status === "betwist" ? "Betwist" : status === "afgelast" ? "Afgelast" : scoreIngediend ? "Wacht op scorebevestiging" : status === "bevestigd" ? "Ingepland" : status === "voorstel" ? "Voorstel" : "Nog te plannen";
  const color = status === "gespeeld" ? "#9fe2ba" : status === "betwist" ? "#fda4af" : "#d4e5f5";
  return <span style={{ display: "inline-block", border: `1px solid ${color}55`, background: `${color}15`, borderRadius: 99, padding: "4px 9px", color, fontSize: 12, fontWeight: 700 }}>{text}</span>;
}

export default function PingpongtornooiPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [tornooi, setTornooi] = useState<Tornooi | null>(null);
  const [inschrijvingen, setInschrijvingen] = useState<Inschrijving[]>([]);
  const [namen, setNamen] = useState<Record<string, Profiel>>({});
  const [poules, setPoules] = useState<Poule[]>([]);
  const [leden, setLeden] = useState<Lid[]>([]);
  const [wedstrijden, setWedstrijden] = useState<Wedstrijd[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [voorstellen, setVoorstellen] = useState<Voorstel[]>([]);
  const [beschikbaarheid, setBeschikbaarheid] = useState<Beschikbaarheid[]>([]);
  const [afwezigheden, setAfwezigheden] = useState<Afwezigheid[]>([]);
  const [meldingen, setMeldingen] = useState<Melding[]>([]);
  const [stand, setStand] = useState<Stand[]>([]);
  const [tab, setTab] = useState<Tab>("wedstrijden");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [nietPauzes, setNietPauzes] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [afVan, setAfVan] = useState("");
  const [afTot, setAfTot] = useState("");
  const [afReden, setAfReden] = useState("");
  const [filterDatum, setFilterDatum] = useState("alle");
  const [filterPoule, setFilterPoule] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [alleenEigen, setAlleenEigen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      const missingSession = authError?.name === "AuthSessionMissingError" || authError?.message?.toLowerCase().includes("auth session missing");
      if (authError && !missingSession) throw authError;
      const user = missingSession ? null : auth.user;
      setUid(user?.id ?? null);
      if (!user) {
        setProfiel(null); setTornooi(null); setInschrijvingen([]); setPoules([]); setLeden([]);
        setWedstrijden([]); setSlots([]); setNamen({}); setStand([]); setVoorstellen([]);
        setBeschikbaarheid([]); setAfwezigheden([]); setMeldingen([]);
        return;
      }
      const { data: prf, error: pe } = await supabase.from("profielen").select("id,volledige_naam,klas_naam").eq("id", user.id).maybeSingle();
      if (pe) throw pe;
      setProfiel(prf as Profiel | null);
      const { data: ts, error: te } = await supabase.from("pingpong_tornooien").select("id,naam,schooljaar,status,inschrijven_tot,tornooivorm").order("aangemaakt_op", { ascending: false }).limit(1);
      if (te) throw te;
      const t = (ts?.[0] ?? null) as Tornooi | null;
      setTornooi(t);
      if (!t) {
        setInschrijvingen([]); setPoules([]); setLeden([]); setWedstrijden([]); setSlots([]);
        setNamen({}); setStand([]); setVoorstellen([]); setBeschikbaarheid([]); setAfwezigheden([]); setMeldingen([]);
        return;
      }
      // Algemene tornooigegevens worden voor alle aangemelde gebruikers opgevraagd.
      // Supabase RLS bepaalt wie ze daadwerkelijk mag lezen.
      const [ir, por, wr, sr, lr, kr] = await Promise.all([
        supabase.from("pingpong_inschrijvingen").select("id,leerling_id,tornooi_id").eq("tornooi_id", t.id),
        supabase.from("pingpong_poules").select("id,naam,tornooi_id").eq("tornooi_id", t.id),
        supabase.from("pingpong_wedstrijden").select("*").eq("tornooi_id", t.id),
        supabase.from("pingpong_speelslots").select("id,speeldatum,pauze,tafel,volgnummer").eq("tornooi_id", t.id),
        supabase.from("pingpong_poule_leden").select("poule_id,inschrijving_id"),
        supabase.from("pingpong_klassement").select("poule_id,leerling_id,gespeeld,gewonnen,verloren,punten").eq("tornooi_id", t.id),
      ]);
      for (const r of [ir, por, wr, sr, lr, kr]) if (r.error) throw r.error;
      const ii = (ir.data ?? []) as Inschrijving[];
      const ww = (wr.data ?? []) as Wedstrijd[];
      setInschrijvingen(ii); setPoules((por.data ?? []) as Poule[]); setWedstrijden(ww);
      setSlots((sr.data ?? []) as Slot[]); setLeden((lr.data ?? []) as Lid[]); setStand((kr.data ?? []) as Stand[]);
      const ids = [...new Set([...ii.map(x => x.leerling_id), ...ww.flatMap(x => [x.speler1_id, x.speler2_id])])];
      if (ids.length) {
        const { data: pp, error: npe } = await supabase.from("profielen").select("id,volledige_naam,klas_naam").in("id", ids);
        if (npe) throw npe;
        setNamen(Object.fromEntries(((pp ?? []) as Profiel[]).map(p => [p.id, p])));
      } else setNamen({});
      const deelnemer = ii.some(x => x.leerling_id === user.id);
      if (!deelnemer) {
        setVoorstellen([]); setBeschikbaarheid([]); setAfwezigheden([]); setMeldingen([]);
        return;
      }
      const [br, ar, mr] = await Promise.all([
        supabase.from("pingpong_beschikbaarheid").select("id,pauze,beschikbaar").eq("tornooi_id", t.id).eq("leerling_id", user.id),
        supabase.from("pingpong_afwezigheden").select("id,van_datum,tot_datum,reden").eq("tornooi_id", t.id).eq("leerling_id", user.id),
        supabase.from("pingpong_meldingen").select("id,bericht,gelezen_op,aangemaakt_op").eq("tornooi_id", t.id).eq("ontvanger_id", user.id).order("aangemaakt_op", { ascending: false }).limit(30),
      ]);
      for (const r of [br, ar, mr]) if (r.error) throw r.error;
      setBeschikbaarheid((br.data ?? []) as Beschikbaarheid[]);
      setAfwezigheden((ar.data ?? []) as Afwezigheid[]);
      setMeldingen((mr.data ?? []) as Melding[]);
      const eigenIds = ww.filter(w => w.speler1_id === user.id || w.speler2_id === user.id).map(w => w.id);
      if (eigenIds.length) {
        const { data: vv, error: ve } = await supabase.from("pingpong_voorstellen").select("id,wedstrijd_id,speelslot_id,status,speler1_akkoord,speler2_akkoord,vervalt_op").in("wedstrijd_id", eigenIds).eq("status", "open");
        if (ve) throw ve;
        setVoorstellen((vv ?? []) as Voorstel[]);
      } else setVoorstellen([]);
    } catch (e) { setError(`Gegevens konden niet volledig worden geladen: ${fouttekst(e)}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const deelnemer = !!uid && inschrijvingen.some(i => i.leerling_id === uid);
  const slotMap = useMemo(() => new Map(slots.map(s => [s.id, s])), [slots]);
  const pouleMap = useMemo(() => new Map(poules.map(p => [p.id, p.naam])), [poules]);
  const inschrijvingMap = useMemo(() => new Map(inschrijvingen.map(i => [i.id, i.leerling_id])), [inschrijvingen]);
  const naam = (id: string) => namen[id]?.volledige_naam || (id === uid ? profiel?.volledige_naam : null) || "Deelnemer";
  const slot = (id: string | null) => id ? slotMap.get(id) : undefined;
  const slotTekst = (id: string | null) => { const s = slot(id); return s ? `${datum(s.speeldatum)} · ${pauzes.find(p => p.id === s.pauze)?.naam ?? s.pauze} · tafel ${s.tafel} · beurt ${s.volgnummer}` : "Nog niet gepland"; };
  const gesorteerd = useMemo(() => [...wedstrijden].sort((a, b) => {
    const x = a.speelslot_id ? slotMap.get(a.speelslot_id) : undefined;
    const y = b.speelslot_id ? slotMap.get(b.speelslot_id) : undefined;
    return (x?.speeldatum ?? "9999").localeCompare(y?.speeldatum ?? "9999") || pauzeIndex(x?.pauze ?? "") - pauzeIndex(y?.pauze ?? "") || (x?.volgnummer ?? 0) - (y?.volgnummer ?? 0) || (x?.tafel ?? 0) - (y?.tafel ?? 0);
  }), [wedstrijden, slotMap]);
  const eigen = useMemo(() => gesorteerd.filter(w => w.speler1_id === uid || w.speler2_id === uid), [gesorteerd, uid]);
  const volgende = eigen.find(w => !["gespeeld", "afgelast"].includes(w.status) && !!w.speelslot_id);
  const gespeeld = wedstrijden.filter(w => w.status === "gespeeld").length;
  const datums = [...new Set(gesorteerd.map(w => slot(w.speelslot_id)?.speeldatum).filter((x): x is string => !!x))].sort();
  const gefilterd = gesorteerd.filter(w => (filterDatum === "alle" || slot(w.speelslot_id)?.speeldatum === filterDatum) && (filterPoule === "alle" || w.poule_id === filterPoule) && (filterStatus === "alle" || (filterStatus === "gespeeld" ? w.status === "gespeeld" : w.status !== "gespeeld")) && (!alleenEigen || w.speler1_id === uid || w.speler2_id === uid));

  const actie = async (fn: () => Promise<void>) => {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); await load(); } catch (e) { setError(fouttekst(e)); } finally { setBusy(false); }
  };
  const inschrijven = () => actie(async () => { if (!uid || !tornooi) throw Error("Niet aangemeld"); const { error: e } = await supabase.from("pingpong_inschrijvingen").insert({ tornooi_id: tornooi.id, leerling_id: uid }); if (e) throw e; setInfo("Je bent ingeschreven!"); });
  const uitschrijven = () => actie(async () => { if (!uid || !tornooi || !window.confirm("Wil je je echt uitschrijven?")) return; const { error: e } = await supabase.from("pingpong_inschrijvingen").delete().eq("tornooi_id", tornooi.id).eq("leerling_id", uid); if (e) throw e; setInfo("Je bent uitgeschreven."); });
  const antwoord = (v: Voorstel, ok: boolean) => actie(async () => { const { error: e } = await supabase.rpc("pingpong_antwoord_voorstel", { p_voorstel_id: v.id, p_akkoord: ok, p_niet_beschikbaar: ok ? [] : nietPauzes }); if (e) throw e; setNietPauzes([]); setInfo(ok ? "Antwoord opgeslagen." : "We zoeken een ander wedstrijdmoment."); });
  const scoreIndienen = (w: Wedstrijd) => actie(async () => { const s = scores[w.id]; if (!s || s.a === "" || s.b === "") throw Error("Vul beide scores in"); const a = Number(s.a), b = Number(s.b); if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || Math.max(a, b) < 11 || Math.abs(a - b) < 2) throw Error("Een geldige set eindigt op minstens 11 punten, met 2 punten verschil."); const { error: e } = await supabase.rpc("pingpong_score_indienen", { p_wedstrijd_id: w.id, p_score1: a, p_score2: b }); if (e) throw e; setInfo("Score ingediend. Je tegenstander moet bevestigen."); });
  const scoreBevestigen = (w: Wedstrijd, ok: boolean) => actie(async () => { const { error: e } = await supabase.rpc("pingpong_score_bevestigen", { p_wedstrijd_id: w.id, p_akkoord: ok }); if (e) throw e; setInfo(ok ? "Uitslag bevestigd." : "Uitslag betwist. Een LO-leerkracht kijkt dit na."); });
  const pauzeWijzigen = (id: string, beschikbaar: boolean) => actie(async () => { if (!uid || !tornooi) throw Error("Niet aangemeld"); const { error: e } = await supabase.from("pingpong_beschikbaarheid").upsert({ tornooi_id: tornooi.id, leerling_id: uid, pauze: id, beschikbaar }, { onConflict: "tornooi_id,leerling_id,pauze" }); if (e) throw e; setInfo("Beschikbaarheid opgeslagen. Reeds ingeplande wedstrijden veranderen niet automatisch."); });
  const afwezig = () => actie(async () => { if (!uid || !tornooi || !afVan || !afTot || afTot < afVan) throw Error("Kies geldige datums"); const { error: e } = await supabase.from("pingpong_afwezigheden").insert({ tornooi_id: tornooi.id, leerling_id: uid, van_datum: afVan, tot_datum: afTot, reden: afReden || null }); if (e) throw e; setAfVan(""); setAfTot(""); setAfReden(""); setInfo("Afwezigheid geregistreerd. Contacteer een LO-leerkracht als je wedstrijd moet worden verplaatst."); });

  const wedstrijdKaart = (w: Wedstrijd, persoonlijk = false) => {
    const v = voorstellen.find(x => x.wedstrijd_id === w.id);
    const eigenAkkoord = uid === w.speler1_id ? v?.speler1_akkoord : v?.speler2_akkoord;
    const s = scores[w.id] ?? { a: "", b: "" };
    const isEigen = uid === w.speler1_id || uid === w.speler2_id;
    return <div key={w.id} style={{ ...paneel, padding: 15, display: "grid", gap: 10 }}>
      <div className="ping-flex ping-between"><span style={muted}>{w.ronde === "poule" ? `Poule ${pouleMap.get(w.poule_id ?? "") ?? "?"}` : w.ronde}</span><Status status={w.status} scoreIngediend={!!w.score_ingediend_door} /></div>
      <div className="ping-flex ping-between" style={{ gap: 12 }}><strong>{naam(w.speler1_id)} <span style={{ color: "#9eb0c2" }}>vs.</span> {naam(w.speler2_id)}</strong>{w.status === "gespeeld" && <strong style={{ color: "#9fe2ba" }}>{w.score1} – {w.score2}</strong>}</div>
      <div style={muted}>🕒 {slotTekst(w.speelslot_id)}</div>
      {persoonlijk && isEigen && <>
        {v && eigenAkkoord === null && <div style={{ display: "grid", gap: 9 }}><p style={muted}>Voorstel beantwoorden vóór {new Date(v.vervalt_op).toLocaleString("nl-BE")}. Voorgesteld moment: {slotTekst(v.speelslot_id)}</p><div className="ping-flex">{pauzes.map(p => <label key={p.id} style={muted}><input type="checkbox" checked={nietPauzes.includes(p.id)} onChange={e => setNietPauzes(old => e.target.checked ? [...old, p.id] : old.filter(x => x !== p.id))} /> {p.naam} niet beschikbaar</label>)}</div><div className="ping-flex"><button style={knop} disabled={busy} onClick={() => antwoord(v, true)}>✓ Akkoord</button><button style={knop} disabled={busy} onClick={() => antwoord(v, false)}>✕ Niet akkoord</button></div></div>}
        {v && eigenAkkoord === true && <p style={muted}>Je hebt dit voorstel goedgekeurd. We wachten op je tegenstander.</p>}
        {w.status === "bevestigd" && w.score_ingediend_door === null && <div style={{ display: "grid", gap: 8 }}><p style={muted}>Na de wedstrijd voert de winnaar de score in, in de volgorde van de namen hierboven.</p><div className="ping-flex"><input aria-label={`Score ${naam(w.speler1_id)}`} className="ping-input ping-score" type="number" min="0" step="1" placeholder="Score 1" value={s.a} onChange={e => setScores(o => ({ ...o, [w.id]: { ...s, a: e.target.value } }))} /><span>–</span><input aria-label={`Score ${naam(w.speler2_id)}`} className="ping-input ping-score" type="number" min="0" step="1" placeholder="Score 2" value={s.b} onChange={e => setScores(o => ({ ...o, [w.id]: { ...s, b: e.target.value } }))} /><button disabled={busy} style={knop} onClick={() => scoreIndienen(w)}>Score indienen</button></div></div>}
        {w.status === "bevestigd" && w.score_ingediend_door && <div style={{ display: "grid", gap: 8 }}><strong>Ingediende score: {w.score1} – {w.score2}</strong>{w.score_ingediend_door !== uid ? <div className="ping-flex"><button disabled={busy} style={knop} onClick={() => scoreBevestigen(w, true)}>✓ Score bevestigen</button><button disabled={busy} style={knop} onClick={() => scoreBevestigen(w, false)}>Betwisten</button></div> : <p style={muted}>Wacht op bevestiging door je tegenstander.</p>}</div>}
        {w.status === "betwist" && <p style={muted}>Een LO-leerkracht kijkt de uitslag na.</p>}
      </>}
    </div>;
  };

  return <AppShell title="KA LO App" subtitle="PingpongCHAMP" userName={profiel?.volledige_naam ?? null}>
    <div className="ping-root" style={{ display: "grid", gap: 16, color: "#eaf0ff" }}>
      <BaseHero label="CHALLENGES · PINGPONGTORNOOI" title={<>Word jij de <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">PingpongCHAMP</span> van den Athenee?</>} description="Volg de wedstrijden, het klassement en de weg naar de finale." imageSrc="/challenges/pingpongchamp-poster.png" imageAlt="PingpongCHAMP van den Athenee" quoteTitle="PingpongCHAMP" quote="Word jij de PingpongCHAMP van den Athenee?" quoteAuthor="Atheneum Avelgem" actions={<Link href="/challenges" style={{ ...knop, textDecoration: "none" }}>← Terug naar challenges</Link>} />
      {error && <div role="alert" style={{ ...paneel, borderColor: "#fb7185" }}>{error} <button style={{ ...knop, marginLeft: 10 }} onClick={() => void load()}>Opnieuw laden</button></div>}
      {info && <div role="status" style={{ ...paneel, borderColor: "#89C2AA" }}>{info}</div>}
      {loading && <div style={paneel}>Tornooigegevens laden...</div>}
      {!loading && !uid && <Sectie titel="🔐 Aanmelden"><p style={muted}>Meld je aan met je schoolaccount om de tornooigegevens te bekijken.</p><Link href="/login?next=%2Fchallenges%2Fpingpongtornooi" style={{ ...knop, display: "inline-block", textDecoration: "none" }}>Inloggen met schoolaccount</Link></Sectie>}
      {!loading && uid && !tornooi && <Sectie titel="🏓 PingpongCHAMP"><p style={muted}>Er is momenteel geen zichtbaar tornooi. Controleer eventueel de Supabase-toegangsregels.</p></Sectie>}
      {!loading && uid && tornooi && <>
        <div className="ping-stats">
          <div style={paneel}><div style={muted}>Tornooi</div><strong style={{ fontSize: 18 }}>{tornooi.status === "lopend" ? "🟢 Lopend" : tornooi.status}</strong><div style={muted}>{tornooi.schooljaar}</div></div>
          <div style={paneel}><div style={muted}>Deelnemers</div><strong style={{ fontSize: 25 }}>{inschrijvingen.length}</strong></div>
          <div style={paneel}><div style={muted}>Wedstrijden gespeeld</div><strong style={{ fontSize: 25 }}>{gespeeld} / {wedstrijden.length}</strong></div>
          <div style={paneel}><div style={muted}>Poules</div><strong style={{ fontSize: 25 }}>{poules.length}</strong></div>
        </div>
        {deelnemer && <div style={{ ...paneel, borderColor: "rgba(137,194,170,.4)" }}><div className="ping-flex ping-between"><div><strong>🎯 Jouw volgende wedstrijd</strong><p style={{ ...muted, margin: "6px 0 0" }}>{volgende ? `${naam(volgende.speler1_id === uid ? volgende.speler2_id : volgende.speler1_id)} · ${slotTekst(volgende.speelslot_id)}` : "Geen openstaande ingeplande wedstrijd."}</p></div><button style={knop} onClick={() => setTab("mijn")}>Mijn wedstrijden</button></div></div>}
        {!deelnemer && <div style={paneel}><p style={{ ...muted, marginTop: 0 }}>{tornooi.status === "inschrijvingen" ? "Je bent nog niet ingeschreven." : "Het tornooi is gestart. Je kunt de beschikbare tornooigegevens volgen."}</p>{tornooi.status === "inschrijvingen" && (!tornooi.inschrijven_tot || new Date(tornooi.inschrijven_tot) > new Date()) && <button style={knop} disabled={busy} onClick={inschrijven}>🏓 Schrijf mij in</button>}</div>}
        {deelnemer && tornooi.status === "inschrijvingen" && <div style={paneel}><strong>✓ Je bent ingeschreven</strong><div style={{ marginTop: 10 }}><button style={knop} disabled={busy} onClick={uitschrijven}>Uitschrijven</button></div></div>}
        <nav aria-label="Pingpongtornooi tabbladen" className="ping-tabs">{tabs.map(t => <button key={t.id} aria-current={tab === t.id ? "page" : undefined} style={{ ...knop, background: tab === t.id ? "rgba(137,194,170,.30)" : "rgba(0,0,0,.22)", borderColor: tab === t.id ? "#89C2AA" : "rgba(255,255,255,.15)" }} onClick={() => setTab(t.id)}>{t.icoon} {t.titel}{t.id === "mijn" && meldingen.some(m => !m.gelezen_op) ? " ●" : ""}</button>)}</nav>
        {tab === "wedstrijden" && <Sectie titel="📅 Wedstrijdkalender">
          <div className="ping-filters"><label>Datum<select className="ping-input" value={filterDatum} onChange={e => setFilterDatum(e.target.value)}><option value="alle">Alle dagen</option>{datums.map(d => <option key={d} value={d}>{datum(d)}</option>)}</select></label><label>Poule<select className="ping-input" value={filterPoule} onChange={e => setFilterPoule(e.target.value)}><option value="alle">Alle poules</option>{[...poules].sort((a,b)=>a.naam.localeCompare(b.naam)).map(p => <option key={p.id} value={p.id}>Poule {p.naam}</option>)}</select></label><label>Status<select className="ping-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="alle">Alle wedstrijden</option><option value="open">Nog niet gespeeld</option><option value="gespeeld">Gespeeld</option></select></label>{deelnemer && <label className="ping-flex" style={{ alignSelf: "end", ...muted }}><input type="checkbox" checked={alleenEigen} onChange={e => setAlleenEigen(e.target.checked)} /> Alleen mijn wedstrijden</label>}</div>
          {gefilterd.length === 0 ? <p style={muted}>Geen wedstrijden gevonden. {wedstrijden.length === 0 ? "Als er wel wedstrijden in Supabase staan, controleer de SELECT-toegang (RLS) voor leerlingen." : "Pas eventueel je filters aan."}</p> : <div style={{ display: "grid", gap: 10 }}>{gefilterd.map(w => wedstrijdKaart(w))}</div>}
        </Sectie>}
        {tab === "klassement" && <Sectie titel="🏆 Pouleklassementen">
          <p style={muted}>3 punten per overwinning. Alleen definitief gespeelde wedstrijden tellen mee. Bij een gelijke stand is de definitieve rangschikking afhankelijk van de tornooiregels.</p>
          {poules.length === 0 && <p style={muted}>Nog geen poules zichtbaar.</p>}
          {[...poules].sort((a,b)=>a.naam.localeCompare(b.naam)).map(p => {
            const spelers = leden.filter(l => l.poule_id === p.id).map(l => inschrijvingMap.get(l.inschrijving_id)).filter((x): x is string => !!x);
            const rijen = spelers.map(id => ({ id, s: stand.find(x => x.poule_id === p.id && x.leerling_id === id) }));
            rijen.sort((a,b) => (b.s?.punten ?? 0) - (a.s?.punten ?? 0) || (b.s?.gewonnen ?? 0) - (a.s?.gewonnen ?? 0) || naam(a.id).localeCompare(naam(b.id)));
            return <div key={p.id} style={{ marginBottom: 22 }}><h3 style={{ marginBottom: 8 }}>Poule {p.naam}</h3><div style={{ overflowX: "auto" }}><table className="ping-table"><thead><tr><th>#</th><th>Leerling</th><th>G</th><th>W</th><th>V</th><th>Ptn</th></tr></thead><tbody>{rijen.map((r, i) => <tr key={r.id} style={{ background: r.id === uid ? "rgba(137,194,170,.12)" : undefined }}><td>{i + 1}</td><td>{naam(r.id)}{r.id === uid ? " (jij)" : ""}</td><td>{r.s?.gespeeld ?? 0}</td><td>{r.s?.gewonnen ?? 0}</td><td>{r.s?.verloren ?? 0}</td><td><strong>{r.s?.punten ?? 0}</strong></td></tr>)}</tbody></table>{rijen.length === 0 && <p style={muted}>De pouleleden zijn niet zichtbaar. Controleer de leesrechten.</p>}</div></div>;
          })}
        </Sectie>}
        {tab === "knockout" && <Sectie titel="🥇 Weg naar de finale">
          <p style={muted}>De knock-outwedstrijden worden getoond zodra ze in Supabase zijn aangemaakt. De onderstaande plaatsen zijn voorlopig, zonder automatisch spelers te kwalificeren.</p>
          {wedstrijden.filter(w => w.ronde !== "poule").length === 0 ?
            <div className="ping-bracket">{[{ label: "Kwartfinales", count: 4 }, { label: "Halve finales", count: 2 }, { label: "Finale · 26 november", count: 1 }].map(r => <div key={r.label} style={{ ...paneel, padding: 12 }}><h3 style={{ fontSize: 15, margin: "0 0 10px" }}>{r.label}</h3>{Array.from({ length: r.count }, (_, i) => <div key={i} style={{ border: "1px solid rgba(255,255,255,.13)", borderRadius: 12, padding: 10, marginBottom: 8 }}><div style={muted}>{r.count === 1 ? "Finale" : `Wedstrijd ${i + 1}`}</div><strong style={{ fontSize: 13 }}>Nog te bepalen</strong></div>)}</div>)}</div>
            : <div style={{ display: "grid", gap: 10 }}>{gesorteerd.filter(w => w.ronde !== "poule").map(w => wedstrijdKaart(w))}</div>}
        </Sectie>}
        {tab === "regels" && <Sectie titel="📖 Spelregels en afspraken">
          <div style={{ display: "grid", gap: 11, ...muted }}><div><strong>1. Puntentelling.</strong> Eén set tot 11 punten. Bij 10–10 wordt doorgespeeld tot een speler twee punten verschil heeft.</div><div><strong>2. Opslag.</strong> De opslag wisselt na elke twee punten; vanaf 10–10 na elk punt.</div><div><strong>3. Correct serveren.</strong> Bij de opslag botst de bal eerst op je eigen helft en daarna op de helft van de tegenstander.</div><div><strong>4. Netbal bij opslag.</strong> Een verder correcte opslag die het net raakt, wordt opnieuw gespeeld.</div><div><strong>5. Randbal.</strong> Een bal die de bovenrand van de tafel raakt, is geldig.</div><div><strong>6. Wedstrijdmoment.</strong> Bekijk je ingeplande datum, pauze, tafel en beurt bij Mijn tornooi. De namiddag blijft in de poulefase vrij voor inhaalwedstrijden.</div><div><strong>7. Score.</strong> De winnaar dient de uitslag in. De tegenstander bevestigt of betwist de score. Alleen definitieve uitslagen tellen mee.</div><div><strong>8. Afwezig?</strong> Meld dit tijdig en spreek een LO-leerkracht aan. Een afwezigheidsmelding verplaatst een ingeplande wedstrijd niet automatisch.</div><div><strong>9. Fair play.</strong> Respecteer je tegenstander, het materiaal en de beslissing van de begeleidende leerkracht.</div></div>
        </Sectie>}
        {tab === "mijn" && (deelnemer ? <div style={{ display: "grid", gap: 15 }}>
          <Sectie titel="🎯 Mijn wedstrijden">{eigen.length === 0 ? <p style={muted}>Er zijn momenteel geen wedstrijden zichtbaar voor jouw account.</p> : <div style={{ display: "grid", gap: 10 }}>{eigen.map(w => wedstrijdKaart(w, true))}</div>}</Sectie>
          <Sectie titel="⏰ Mijn beschikbaarheid"><p style={muted}>Geef aan wanneer je doorgaans kunt spelen. Dit geldt voor toekomstige voorstellen; bestaande vaste wedstrijden worden niet automatisch verplaatst.</p>{pauzes.map(p => <label key={p.id} className="ping-flex" style={{ ...muted, margin: "10px 0" }}><input disabled={busy} type="checkbox" checked={beschikbaarheid.find(x => x.pauze === p.id)?.beschikbaar !== false} onChange={e => pauzeWijzigen(p.id, e.target.checked)} /> {p.naam}</label>)}</Sectie>
          <Sectie titel="🗓️ Afwezigheid melden"><div className="ping-flex"><label style={muted}>Van <input className="ping-input" type="date" value={afVan} onChange={e => setAfVan(e.target.value)} /></label><label style={muted}>Tot <input className="ping-input" type="date" value={afTot} onChange={e => setAfTot(e.target.value)} /></label><input className="ping-input" aria-label="Reden" placeholder="Reden (optioneel)" value={afReden} onChange={e => setAfReden(e.target.value)} /><button style={knop} disabled={busy} onClick={afwezig}>Afwezigheid melden</button></div>{afwezigheden.map(a => <div className="ping-flex ping-between ping-line" key={a.id}><span>{datum(a.van_datum)} t.e.m. {datum(a.tot_datum)}</span><button disabled={busy} style={knop} onClick={() => actie(async () => { const { error: e } = await supabase.from("pingpong_afwezigheden").delete().eq("id", a.id); if (e) throw e; })}>Verwijderen</button></div>)}</Sectie>
          <Sectie titel="🔔 Mijn meldingen">{meldingen.length === 0 ? <p style={muted}>Nog geen meldingen.</p> : meldingen.map(m => <div className="ping-flex ping-between ping-line" key={m.id}><span>{!m.gelezen_op && "● "}{m.bericht}</span><small style={muted}>{new Date(m.aangemaakt_op).toLocaleDateString("nl-BE")}</small></div>)}</Sectie>
        </div> : <Sectie titel="🎯 Mijn tornooi"><p style={muted}>Dit onderdeel is beschikbaar voor ingeschreven deelnemers.</p></Sectie>)}
        <div className="ping-flex ping-between" style={muted}><span>Gegevens uit Supabase · Scorebevestiging door de tegenstander</span><button style={knop} disabled={loading || busy} onClick={() => void load()}>↻ Vernieuwen</button></div>
      </>}
      <style jsx>{`
        .ping-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .ping-tabs{display:flex;gap:8px;flex-wrap:wrap}
        .ping-flex{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .ping-between{justify-content:space-between}
        .ping-filters{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px;align-items:end}
        .ping-filters label{display:grid;gap:6px;font-size:12px;color:rgba(234,240,255,.8)}
        .ping-input{background:rgba(0,0,0,.35);color:#eaf0ff;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:9px;max-width:230px;min-height:40px}
        .ping-input option{color:#111827;background:white}
        .ping-score{width:88px}
        .ping-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}
        .ping-table th,.ping-table td{padding:10px;border-bottom:1px solid rgba(255,255,255,.13)}
        .ping-bracket{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .ping-line{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12)}
        @media(max-width:800px){.ping-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ping-bracket{grid-template-columns:1fr}}
        @media(max-width:520px){.ping-filters label{width:100%}.ping-filters select{max-width:none;width:100%}.ping-tabs button{flex:1 1 auto}}
      `}</style>
    </div>
  </AppShell>;
}
