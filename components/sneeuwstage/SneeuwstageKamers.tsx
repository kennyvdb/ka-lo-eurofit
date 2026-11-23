"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Bewoner = { id: string; naam: string };
type Kamer = { id: string; nummer: number; verdieping: string; categorie: "M" | "V"; capaciteit: number; leerlingen: Bewoner[] };
type Verzoek = { id: string; van: string; naar: string; status: string; naam: string };
type ZonderKamer = { id: string | null; naam: string; categorie: "M" | "V" | null };
type KamerOverzicht = {
  status: "gepauzeerd" | "open" | "afgesloten";
  admin: boolean;
  user_id: string;
  categorie: "M" | "V" | null;
  kamers: Kamer[];
  verzoeken: Verzoek[];
  zonder_kamer: ZonderKamer[];
};

const knop = "rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40";
const primair = `${knop} bg-[#89C2AA] text-[#10313A] hover:bg-[#A8DDC8]`;
const secundair = `${knop} border border-white/25 bg-white/10 text-white hover:bg-white/20`;

export default function SneeuwstageKamers({ beheer = false }: { beheer?: boolean }) {
  const [gegevens, setGegevens] = useState<KamerOverzicht | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState("");
  const [melding, setMelding] = useState("");
  const [doel, setDoel] = useState<string>("");
  const [afdruk, setAfdruk] = useState<"per_kamer" | "alfabetisch">("per_kamer");
  const [categorie, setCategorie] = useState<"M" | "V">("M");

  const laad = useCallback(async () => {
    const { data, error } = await supabase.rpc("sneeuwstage_kamer_overzicht");
    if (error) throw new Error(error.message);
    setGegevens(data as KamerOverzicht);
  }, []);

  useEffect(() => {
    let actief = true;
    const starten = async () => {
      try { await laad(); } catch (e) { if (actief) setFout(e instanceof Error ? e.message : "Kan kamerverdeling niet laden"); }
      finally { if (actief) setLoading(false); }
    };
    void starten();
    const interval = window.setInterval(() => { void laad().catch(() => undefined); }, 15000);
    return () => { actief = false; window.clearInterval(interval); };
  }, [laad]);

  async function actie(naam: string, parameters: Record<string, unknown>, succes = "Wijziging opgeslagen") {
    setBusy(true); setFout(""); setMelding("");
    try {
      const { error } = await supabase.rpc(naam, parameters);
      if (error) throw new Error(error.message);
      await laad(); setMelding(succes);
    } catch (e) { setFout(e instanceof Error ? e.message : "De wijziging is niet gelukt"); }
    finally { setBusy(false); }
  }

  const mijnKamer = useMemo(() => gegevens?.kamers.find(k => k.leerlingen.some(l => l.id === gegevens.user_id)), [gegevens]);
  const inschrijvingen = useMemo(() => (gegevens?.kamers ?? []).flatMap(k => k.leerlingen.map(l => ({ ...l, kamer: k }))), [gegevens]);
  const totaal = inschrijvingen.length;
  const maximaal = (gegevens?.kamers ?? []).reduce((a, k) => a + k.capaciteit, 0);
  const leerlingenKamers = (gegevens?.kamers ?? []).filter(k => k.categorie === categorie);
  const open = gegevens?.status === "open";

  function drukAf() {
    window.print();
  }

  if (loading) return <p className="mt-5 text-white/70">🛏️ Kamerverdeling laden…</p>;
  if (!gegevens) return <div role="alert" className="mt-5 rounded-xl border border-rose-400/30 p-4 text-rose-200">{fout || "Er zijn momenteel geen kamergegevens beschikbaar."}</div>;
  if (beheer && !gegevens.admin) return <p className="mt-5 text-white/80">Deze pagina is alleen voor LO-leerkrachten.</p>;

  const wijzigStatus = (status: KamerOverzicht["status"]) => {
    if (status === "afgesloten" && !window.confirm("Reservaties definitief afsluiten? Alleen leerkrachten kunnen daarna nog wijzigen.")) return;
    void actie("sneeuwstage_kamer_status", { p_status: status }, `Reservaties: ${status}`);
  };

  return (
    <section className="mt-6 space-y-5 text-white" aria-label="Sneeuwstage kamerverdeling">
      <style>{`@media print {
        body * { visibility:hidden!important; }
        #sneeuwstage-print, #sneeuwstage-print * {visibility:visible!important;}
        #sneeuwstage-print {display:block!important;position:absolute!important;left:0;top:0;width:100%!important;color:#111!important;background:white!important;padding:12mm!important;font-family:Arial,sans-serif!important;}
        #sneeuwstage-print h1 {font-size:19pt;margin:0 0 5mm}
        #sneeuwstage-print h2 {font-size:13pt;margin:6mm 0 2mm}
        #sneeuwstage-print li {font-size:11pt;margin:1.5mm 0}
        #sneeuwstage-print .print-room {break-inside:avoid;margin:4mm 0}
        @page {size:A4;margin:12mm}
      }`}</style>
      <div className="rounded-3xl border border-[#89C2AA]/30 bg-gradient-to-br from-[#173A4D] to-[#23594F] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-widest text-[#C3E9D7]">🎿 Pension Rotbach</p>
            <h2 className="mt-2 text-2xl font-black">🛏️ Kamerverdeling 2026</h2>
            <p className="mt-2 text-sm text-white/70">{totaal} van {maximaal} slaapplaatsen ingevuld · 23 jongensplaatsen en 27 meisjesplaatsen</p>
          </div>
          <span className={`rounded-full px-3 py-2 text-sm font-black ${open ? "bg-emerald-400/20 text-emerald-100" : "bg-amber-400/20 text-amber-100"}`}>
            {open ? "🟢 Reserveren geopend" : gegevens.status === "gepauzeerd" ? "⏸️ Reserveren gepauzeerd" : "🔒 Reserveren afgesloten"}
          </span>
        </div>
      </div>

      {fout && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-900/25 p-3 text-sm text-rose-100">{fout}</p>}
      {melding && <p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-900/25 p-3 text-sm text-emerald-100">{melding}</p>}

      {beheer && <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-5 space-y-4">
        <h3 className="font-black text-lg">⚙️ Beheer door leerkrachten</h3>
        <p className="text-sm text-white/70">Je kunt alles vooraf klaarzetten. Bij pauzeren blijven de huidige reservaties behouden; leerlingacties worden ook in de databank geblokkeerd.</p>
        <div className="flex flex-wrap gap-2">
          <button className={primair} type="button" disabled={busy || open} onClick={() => wijzigStatus("open")}>▶ Openen / hervatten</button>
          <button className={secundair} type="button" disabled={busy || gegevens.status === "gepauzeerd"} onClick={() => wijzigStatus("gepauzeerd")}>⏸ Pauzeren</button>
          <button className={secundair} type="button" disabled={busy || gegevens.status === "afgesloten"} onClick={() => wijzigStatus("afgesloten")}>🔒 Afsluiten</button>
          <button className={secundair} type="button" disabled={busy} onClick={() => void laad().catch(e => setFout(String(e)))}>↻ Vernieuwen</button>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t border-white/15 pt-4">
          <label className="text-sm font-semibold">Afdruktype
            <select className="mt-1 block rounded-lg border border-white/20 bg-[#173A4D] px-3 py-2 text-white" value={afdruk} onChange={e => setAfdruk(e.target.value as typeof afdruk)}>
              <option value="per_kamer">Per kamer en verdieping</option><option value="alfabetisch">Alfabetisch per leerling</option>
            </select>
          </label>
          <button className={primair} type="button" onClick={drukAf}>🖨️ Kamerverdeling afdrukken / bewaren als PDF</button>
        </div>
      </div>}

      {!beheer && <div className="rounded-2xl border border-white/15 bg-white/[0.055] p-4 text-sm text-white/85">
        {mijnKamer ? <p>✅ Jij verblijft momenteel in <strong>kamer {mijnKamer.nummer}</strong> ({mijnKamer.verdieping}).</p> :
        <p>{open ? "Kies je kamer. Iedereen kan alleen zichzelf inschrijven. Wie eerst reserveert, heeft voorrang." : "Bekijk alvast de kamers en bespreek met je vrienden waar jullie willen verblijven. Reserveren is nu niet mogelijk."}</p>}
        {!gegevens.categorie && <p className="mt-2 text-amber-200">Je kamercategorie moet eerst door een LO-leerkracht gecontroleerd worden.</p>}
      </div>}

      <div className="flex gap-2" role="group" aria-label="Kamercategorie">
        <button type="button" className={categorie === "M" ? primair : secundair} onClick={() => setCategorie("M")}>Jongens · 23</button>
        <button type="button" className={categorie === "V" ? primair : secundair} onClick={() => setCategorie("V")}>Meisjes · 27</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {leerlingenKamers.map(k => {
          const vrij = k.capaciteit - k.leerlingen.length;
          const eigen = mijnKamer?.id === k.id;
          const toegestaan = gegevens.categorie === k.categorie;
          return <article key={k.id} className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 shadow-lg">
            <div className="flex flex-wrap justify-between gap-2"><div><h3 className="text-xl font-black">Kamer {k.nummer}</h3><p className="mt-1 text-xs text-white/55">{k.verdieping}</p></div>
              <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${vrij ? "bg-emerald-400/15 text-emerald-100" : "bg-white/10 text-white/65"}`}>{k.leerlingen.length}/{k.capaciteit} plaatsen</span></div>
            <div className="my-4 flex flex-wrap gap-2">
              {k.leerlingen.map(l => <span key={l.id} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${l.id === gegevens.user_id ? "border-[#89C2AA] bg-[#89C2AA]/20" : "border-white/10 bg-black/15"}`}>{l.naam}{l.id === gegevens.user_id ? " (jij)" : ""}</span>)}
              {Array.from({length:vrij},(_,i) => <span key={`vrij-${i}`} className="rounded-lg border border-dashed border-white/20 px-2.5 py-1.5 text-xs text-white/45">Vrij bed</span>)}
            </div>
            {!beheer && <div className="flex flex-wrap gap-2">
              <button type="button" className={primair} disabled={busy || !open || !toegestaan || !vrij || eigen}
                onClick={() => void actie("sneeuwstage_kamer_boek",{p_kamer:k.id}, eigen ? "" : `Je kamerkeuze is bijgewerkt naar kamer ${k.nummer}`)}>
                {eigen ? "✓ Jouw kamer" : vrij ? mijnKamer ? "Verhuis naar deze kamer" : "Kies deze kamer" : "Volzet"}
              </button>
              {open && mijnKamer && !eigen && !vrij && toegestaan && k.leerlingen.length > 0 &&
                <select aria-label={`Ruilverzoek naar kamer ${k.nummer}`} className="rounded-xl border border-white/20 bg-[#173A4D] px-3 py-2 text-sm text-white" value={doel} onChange={e => { const id=e.target.value;setDoel(""); if (id && window.confirm("Een ruilverzoek sturen? De andere leerling moet akkoord gaan.")) void actie("sneeuwstage_kamer_ruil_vraag",{p_naar:id},"Ruilverzoek verstuurd"); }}>
                  <option value="">↔ Vraag om te ruilen met…</option>{k.leerlingen.map(l => <option key={l.id} value={l.id}>{l.naam}</option>)}
                </select>}
            </div>}
            {beheer && <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              <label className="text-xs text-white/70">Leerling plaatsen / verplaatsen
                <select className="mt-1 block max-w-full rounded-lg border border-white/20 bg-[#173A4D] p-2 text-white" defaultValue="" disabled={busy}
                  onChange={e => { const id=e.target.value; e.target.value=""; if (id) void actie("sneeuwstage_kamer_leerkracht_plaats",{p_leerling:id,p_kamer:k.id}); }}>
                  <option value="">Selecteer leerling…</option>
                  {gegevens.zonder_kamer.filter(l => l.id && l.categorie===k.categorie).map(l => <option key={l.id} value={l.id!}>{l.naam}</option>)}
                  {inschrijvingen.filter(l => l.kamer.id!==k.id && l.kamer.categorie===k.categorie).map(l => <option key={l.id} value={l.id}>{l.naam} (kamer {l.kamer.nummer})</option>)}
                </select>
              </label>
              {k.leerlingen.map(l => <button type="button" key={l.id} className="text-xs underline underline-offset-2 text-white/65" disabled={busy} onClick={() => { if(window.confirm(`${l.naam} uit kamer ${k.nummer} verwijderen?`)) void actie("sneeuwstage_kamer_leerkracht_plaats",{p_leerling:l.id,p_kamer:null}); }}>Verwijder {l.naam}</button>)}
            </div>}
          </article>;
        })}
      </div>
      {!beheer && gegevens.verzoeken.length > 0 && <div className="rounded-2xl border border-[#89C2AA]/25 bg-white/[0.05] p-4 space-y-3">
        <h3 className="font-black">↔ Ruilverzoeken</h3>
        {gegevens.verzoeken.map(v => <div key={v.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span>{v.naar === gegevens.user_id ? `${v.naam} vraagt om met jou te ruilen.` : "Je ruilverzoek staat open."}</span>
          {v.naar === gegevens.user_id && <><button className={primair} disabled={busy || !open} onClick={() => void actie("sneeuwstage_kamer_ruil_antwoord",{p_verzoek:v.id,p_akkoord:true},"Kamers omgewisseld")}>Akkoord</button>
            <button className={secundair} disabled={busy || !open} onClick={() => void actie("sneeuwstage_kamer_ruil_antwoord",{p_verzoek:v.id,p_akkoord:false},"Ruilverzoek geweigerd")}>Weigeren</button></>}
        </div>)}
      </div>}
      {beheer && <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 space-y-3">
        <h3 className="text-lg font-black">Leerlingen zonder kamer ({gegevens.zonder_kamer.length})</h3>
        {gegevens.zonder_kamer.map((l,i) => <div key={`${l.id ?? l.naam}-${i}`} className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 text-sm">
          <span className="flex-1">{l.naam} <span className="text-white/50">({l.categorie ?? "categorie onbekend"})</span>{!l.id && <span className="text-amber-200"> · nog geen app-profiel</span>}</span>
          {l.id && <><button className={secundair} disabled={busy} onClick={() => void actie("sneeuwstage_kamer_categorie_instellen",{p_leerling:l.id,p_categorie:"M"},"Kamercategorie opgeslagen")}>Jongens</button>
            <button className={secundair} disabled={busy} onClick={() => void actie("sneeuwstage_kamer_categorie_instellen",{p_leerling:l.id,p_categorie:"V"},"Kamercategorie opgeslagen")}>Meisjes</button></>}
        </div>)}
        <p className="text-xs text-white/60">Een afwijkende kamercategorie is uitsluitend zichtbaar in het leerkrachtenbeheer. Stem uitzonderingen vooraf vertrouwelijk af met de leerling.</p>
      </div>}
      {beheer && <div id="sneeuwstage-print" className="hidden" aria-hidden="true">
        <h1>Sneeuwstage 2026 – kamerverdeling Pension Rotbach</h1>
        <p>Afgedrukt: {new Date().toLocaleString("nl-BE")} · {totaal}/{maximaal} plaatsen bezet</p>
        {afdruk === "per_kamer" ? <>
          {(["M","V"] as const).map(cat => <div key={cat}>
            <h2>{cat === "M" ? "Jongens" : "Meisjes"}</h2>
            {gegevens.kamers.filter(k => k.categorie === cat).map(k => <div key={k.id} className="print-room"><strong>Kamer {k.nummer} · {k.verdieping} ({k.leerlingen.length}/{k.capaciteit})</strong>
              <ol>{k.leerlingen.map(l => <li key={l.id}>{l.naam}</li>)}</ol></div>)}
          </div>)}
        </> : <ol>{inschrijvingen.slice().sort((a,b) => a.naam.localeCompare(b.naam,"nl-BE")).map(l => <li key={l.id}>{l.naam} – kamer {l.kamer.nummer} ({l.kamer.verdieping})</li>)}</ol>}
        <h2>Nog zonder kamer ({gegevens.zonder_kamer.length})</h2>
        <ol>{gegevens.zonder_kamer.map((l,i) => <li key={`${l.id}-${i}`}>{l.naam}</li>)}</ol>
      </div>}
    </section>
  );
}
