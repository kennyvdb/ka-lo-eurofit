"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const shell = "rounded-3xl border border-white/15 bg-white/[0.055] p-4 sm:p-6";
const button = "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40";
const primary = "rounded-xl border border-[#89C2AA]/50 bg-[#4B8E8D]/40 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4B8E8D]/60 disabled:cursor-not-allowed disabled:opacity-40";
const field = "w-full rounded-xl border border-white/20 bg-[#14212d] px-3 py-2.5 text-white outline-none focus:border-[#89C2AA]";
const clean = (x: unknown) => String(x ?? "").trim();
const normalEmail = (x: unknown) => clean(x).toLowerCase();
const errText = (e: unknown) => e instanceof Error ? e.message : clean((e as {message?: string})?.message) || "Onbekende fout";
const schoolYear = () => { const d = new Date(); const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear()-1; return `${y}-${y+1}`; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

const PEER_CRITERIA = [
  { key: "opslag", title: "Bovenhandse opslag", detail: "Voert een gerichte bovenhandse opslag uit, aangepast aan het spelniveau." },
  { key: "aanval", title: "Aanval opbouwen", detail: "Bouwt een aanval op en probeert te scoren." },
  { key: "verdediging", title: "Actief verdedigen", detail: "Verdedigt actief en probeert de bal speelbaar te houden." },
  { key: "coaching", title: "Medespelers coachen", detail: "Coacht en communiceert met de medespelers." },
] as const;
type Criterion = typeof PEER_CRITERIA[number]["key"];
type PeerDraft = Partial<Record<Criterion, number>>;
const SELF_QUESTIONS = [
  { key: "spelregels" as const, title: "Ik pas de afgesproken spelregels toe", levels: [
    "Ik houd me niet aan de afgesproken spelregels.",
    "Ik houd me aan de regels wanneer de leerkracht mij hierop wijst.",
    "Ik houd me zelfstandig aan de afgesproken spelregels.",
    "Ik houd me zelfstandig aan de spelregels en spreek anderen aan op de naleving ervan.",
  ]},
  { key: "spelniveau" as const, title: "Ik kies een passend en uitdagend deelnameniveau", levels: [
    "Ik houd geen rekening met de verschillende spelniveaus.",
    "Ik wissel tussen verschillende spelniveaus zonder bewuste keuze.",
    "Ik kies een niveau, maar daag mezelf niet voldoende uit.",
    "Ik kies bewust een passend spelniveau dat mij voldoende uitdaagt.",
  ]},
];
const SYMBOLS = ["−", "+/−", "+", "++"];
const PEER_LEVELS = ["Nooit", "Soms", "Vaak", "Altijd"] as const;
const peerComplete = (c: PeerDraft) => PEER_CRITERIA.every(x => Number.isInteger(c[x.key]) && (c[x.key] ?? 0) >= 1 && (c[x.key] ?? 0) <= 4);
// Gemiddelde van 4 rubrics (1–4), afgerond naar het dichtstbijzijnde niveau.
const scorePeer = (c: PeerDraft) => peerComplete(c)
  ? SYMBOLS[Math.max(0, Math.min(3, Math.round(PEER_CRITERIA.reduce((sum, x) => sum + (c[x.key] ?? 0), 0) / 4) - 1))]
  : "—";

type Lesson = { id:string; naam:string; lesdatum:string; schooljaar:string; fase:"voorbereiding"|"peer"|"self"|"afgerond"; aangemaakt_op:string };
type Participant = { id:string; les_id:string; leerling_email:string; profiel_id:string|null; volledige_naam:string; klas_naam:string|null; aanwezigheid:"aanwezig"|"afwezig"; geblesseerd:boolean; toestel_beschikbaar:boolean };
type Peer = { id:string; observator_id:string|null; beoordeelde_id:string; criteria:PeerDraft; status:"concept"|"ingediend"; invoermethode:string };
type SelfReview = { deelnemer_id:string; spelregels:number|null; spelniveau:number|null; status:"concept"|"ingediend"; invoermethode:string };
type State = { les:Lesson; teacher:boolean; my_id:string|null; participants:Participant[]; peer:Peer[]; self:SelfReview[]; reserved_ids:string[] };
type StudentRow = { email:string; volledige_naam:string; klas_naam:string; profiel_id:string|null; schooljaar:string };

export default function VolleybalLesModule({ omgeving = "leerkracht" }: { omgeving?: "leerling" | "leerkracht" | "evaluaties" }) {
  const [uid, setUid] = useState("");
  const [teacher, setTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [state, setState] = useState<State|null>(null);
  const [smart, setSmart] = useState<StudentRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("Volleybal – les 3");
  const [editingLessonName, setEditingLessonName] = useState(false);
  const [lessonNameDraft, setLessonNameDraft] = useState("");
  const [date, setDate] = useState(today());
  const [year, setYear] = useState(5);
  const [finalities, setFinalities] = useState<string[]>(["AM", "DF", "DS"]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [peerDraft, setPeerDraft] = useState<PeerDraft>({});
  const [rules, setRules] = useState<number|null>(null);
  const [level, setLevel] = useState<number|null>(null);
  const [paperStudent, setPaperStudent] = useState("");
  const [paperPeer, setPaperPeer] = useState<PeerDraft>({});
  const [paperRules, setPaperRules] = useState<number|null>(null);
  const [paperLevel, setPaperLevel] = useState<number|null>(null);
  const [tab, setTab] = useState<"overzicht"|"papier"|"resultaten"|"leerling">("overzicht");
  const [controlFilter, setControlFilter] = useState<"iedereen"|"niet_ingediend"|"niet_beoordeeld"|"zelf_open">("iedereen");
  const [previewId, setPreviewId] = useState("");
  const previewMode = tab === "leerling";
  // Afzonderlijke lokale simulatie: nooit schrijven naar de leerlingenresultaten.
  const [previewPhase, setPreviewPhase] = useState<"peer"|"self">("peer");
  const [previewTarget, setPreviewTarget] = useState("");
  const [previewPeerDraft, setPreviewPeerDraft] = useState<PeerDraft>({});
  const [previewRules, setPreviewRules] = useState<number|null>(null);
  const [previewLevel, setPreviewLevel] = useState<number|null>(null);
  const [previewPeerSent, setPreviewPeerSent] = useState(false);
  const [previewSelfSent, setPreviewSelfSent] = useState(false);
  const [previewClaimed, setPreviewClaimed] = useState(false);
  const resetPreview = () => {
    setPreviewTarget(""); setPreviewPeerDraft({});
    setPreviewRules(null); setPreviewLevel(null);
    setPreviewPeerSent(false); setPreviewSelfSent(false);
    setPreviewClaimed(false); setPreviewPhase("peer");
  };

  const refresh = useCallback(async (id:string) => {
    if (!id) return;
    const {data,error:e} = await supabase.rpc("volleybal_les_state", {p_les_id:id});
    if (e) throw e;
    setState(data as State);
  }, []);
  const refreshList = useCallback(async () => {
    const {data,error:e} = await supabase.rpc("volleybal_lessen_lijst");
    if (e) throw e;
    setLessons((data ?? []) as Lesson[]);
  }, []);

  useEffect(() => { let alive=true;
    (async () => { try {
      const {data:{user},error:e} = await supabase.auth.getUser();
      if(e)throw e; if(!user)return;
      const {data:p,error:pe}=await supabase.from("profielen").select("rol").eq("id",user.id).single();
      if(pe)throw pe;
      const isTeacher=["lo_leerkracht","leerkracht_lo","admin"].includes(clean(p?.rol).toLowerCase());
      if(!alive)return;
      setUid(user.id);setTeacher(isTeacher);
      const {data:ls,error:le}=await supabase.rpc("volleybal_lessen_lijst");if(le)throw le;
      if(!alive)return;
      setLessons((ls??[]) as Lesson[]);
      if(isTeacher){
        const {data:ss,error:se}=await supabase.from("eurofit_class_students_view")
        .select("email,volledige_naam,klas_naam,profiel_id,schooljaar")
        .eq("schooljaar",schoolYear()).limit(2000);
        if(se)throw se;
        if(alive){ const unique=new Map<string,StudentRow>(); for(const x of (ss??[]) as StudentRow[]){
          if(normalEmail(x.email))unique.set(normalEmail(x.email),x);
        } setSmart([...unique.values()]); }
      }
    } catch(e) {if(alive)setError(errText(e));}finally{if(alive)setLoading(false);} })();
    return()=>{alive=false;};
  }, []);
  useEffect(() => { if(!lessonId && lessons.length && !creating)setLessonId(lessons[0].id); },[lessons,lessonId,creating]);
  useEffect(() => { if(!lessonId){setState(null);return;}
    let active=true;
    const run=async()=>{try{if(active)await refresh(lessonId);}catch(e){if(active)setError(errText(e));}};
    void run();const timer=window.setInterval(()=>void run(),5000);
    return()=>{active=false;clearInterval(timer);};
  },[lessonId,refresh]);

  const participants=state?.participants??[];
  const peers=state?.peer??[];
  const selfs=state?.self??[];
  const me=participants.find(p=>p.id===(previewMode ? previewId : state?.my_id));
  const mine=peers.find(p=>p.observator_id===me?.id);
  const mySelf=selfs.find(s=>s.deelnemer_id===me?.id);
  useEffect(()=>{
    setPeerDraft(mine?.criteria??{});
    setSelectedTarget(mine?.beoordeelde_id??"");
  },[mine?.id,mine?.status,JSON.stringify(mine?.criteria??{})]);
  useEffect(()=>{setRules(mySelf?.spelregels??null);setLevel(mySelf?.spelniveau??null);},[mySelf?.spelregels,mySelf?.spelniveau]);
  const present=participants.filter(p=>p.aanwezigheid==="aanwezig");
  const eligibleForAssessment=present.filter(p=>!p.geblesseerd);
  const expectedObservers=present.filter(p=>p.toestel_beschikbaar);
  const submitted = peers.filter(p=>p.status==="ingediend");
  const rated = new Set(submitted.map(x=>x.beoordeelde_id));
  const observerDone = new Set(submitted.map(x=>x.observator_id).filter(Boolean));
  const selfDone = new Set(selfs.filter(x=>x.status==="ingediend").map(x=>x.deelnemer_id));
  const reserved=new Set(state?.reserved_ids??[]);
  // Het leerjaar en de gekozen finaliteiten beperken zowel de klaskeuze als de leerlingenlijst.
  const matchingStudents = useMemo(() => smart.filter(s => {
    const klas = s.klas_naam.trim().toUpperCase();
    return klas.startsWith(String(year)) && finalities.some(f => klas.includes(f));
  }), [smart, year, finalities]);
  const studentCandidates = useMemo(() => matchingStudents.filter(s =>
    (selectedClasses.length === 0 || selectedClasses.includes(s.klas_naam)) &&
    (`${s.volledige_naam} ${s.klas_naam}`).toLowerCase().includes(filter.toLowerCase())
  ).sort((a,b) => a.klas_naam.localeCompare(b.klas_naam,"nl-BE") || a.volledige_naam.localeCompare(b.volledige_naam,"nl-BE")), [matchingStudents, selectedClasses, filter]);
  const classNames = useMemo(() => [...new Set(matchingStudents.map(s => s.klas_naam))].sort((a,b) => a.localeCompare(b,"nl-BE")), [matchingStudents]);
  const findName=(id?:string|null)=>participants.find(p=>p.id===id)?.volledige_naam??"—";
  const paperPerson=participants.find(p=>p.id===paperStudent);
  const paperExisting=peers.find(p=>p.beoordeelde_id===paperStudent);
  const paperSelfExisting=selfs.find(p=>p.deelnemer_id===paperStudent);

  async function action(work:()=>Promise<void>,message:string){
    setBusy(true);setError("");setNotice("");
    try{await work();setNotice(message);await refreshList();if(lessonId)await refresh(lessonId);}
    catch(e){setError(errText(e));}finally{setBusy(false);}
  }
  async function renameLesson(){
    if (!state || state.les.id !== lessonId) return;
    const newName = lessonNameDraft.trim();
    if (!newName) { setError("Vul een lesnaam in."); return; }
    if (newName === state.les.naam) { setEditingLessonName(false); return; }
    await action(async () => {
      const {error:e} = await supabase.rpc("volleybal_hernoem_les", {
        p_les_id: lessonId, p_nieuwe_naam: newName,
      });
      if (e) throw e;
      setEditingLessonName(false);
    }, "Naam van de volleyballes aangepast.");
  }
  async function createLesson(){await action(async()=>{
    const pupils=smart.filter(s=>selected.includes(normalEmail(s.email))).map(s=>({email:normalEmail(s.email),volledige_naam:s.volledige_naam,klas_naam:s.klas_naam,profiel_id:s.profiel_id}));
    if(pupils.length===0)throw new Error("Selecteer eerst leerlingen.");
    const {data,error:e}=await supabase.rpc("volleybal_maak_les",{p_naam:name,p_datum:date,p_schooljaar:schoolYear(),p_leerlingen:pupils});
    if(e)throw e;setLessonId(data as string);setCreating(false);setSelected([]);
  },"Volleybalsles aangemaakt. Controleer eerst de aanwezigheid.");}
  async function move(phase:"start"|"volgende"|"afsluiten"){
    if(phase==="volgende" && (expectedObservers.some(p=>!observerDone.has(p.id)) || eligibleForAssessment.some(p=>!rated.has(p.id)))){
      if(!window.confirm(`Er ontbreken nog ${expectedObservers.filter(p=>!observerDone.has(p.id)).length} ingediende peerevaluaties en ${eligibleForAssessment.filter(p=>!rated.has(p.id)).length} beoordelingen. Toch doorgaan naar zelfevaluatie?`))return;
    }
    if(phase==="afsluiten" && !window.confirm("Les definitief afsluiten? Leerlingen kunnen daarna geen evaluaties meer invoeren of aanpassen."))return;
    await action(async()=>{const {error:e}=await supabase.rpc("volleybal_fase",{p_les_id:lessonId,p_actie:phase});if(e)throw e;},"Lesfase aangepast.");
  }
  async function claim(target:string){await action(async()=>{
    const {error:e}=await supabase.rpc("volleybal_claim_peer",{p_les_id:lessonId,p_doel:target});if(e)throw e;
  },"Leerling gekozen. Je bent nu de enige observator voor deze leerling.");}
  async function savePeer(final:boolean){await action(async()=>{
    const {error:e}=await supabase.rpc("volleybal_bewaar_peer",{p_les_id:lessonId,p_criteria:peerDraft,p_indienen:final});if(e)throw e;
  },final?"Peerevaluatie definitief ingediend.":"Concept opgeslagen.");}
  async function saveSelf(final:boolean){await action(async()=>{
    const {error:e}=await supabase.rpc("volleybal_bewaar_zelf",{p_les_id:lessonId,p_spelregels:rules,p_spelniveau:level,p_indienen:final});if(e)throw e;
  },final?"Zelfevaluatie definitief ingediend.":"Concept opgeslagen.");}
  async function paperSave(kind:"peer"|"self"){
    await action(async()=>{
      if(!paperStudent)throw new Error("Selecteer een leerling.");
      const args=kind==="peer"? {p_les_id:lessonId,p_doel:paperStudent,p_criteria:paperPeer}:{p_les_id:lessonId,p_deelnemer:paperStudent,p_spelregels:paperRules,p_spelniveau:paperLevel};
      const {error:e}=kind==="peer"?await supabase.rpc("volleybal_papier_peer",args):await supabase.rpc("volleybal_papier_zelf",args);
      if(e)throw e;
    },"Papieren beoordeling opgeslagen.");
  }
  function changePaper(id:string){
    setPaperStudent(id);
    const peer=peers.find(p=>p.beoordeelde_id===id), self=selfs.find(s=>s.deelnemer_id===id);
    setPaperPeer(peer?.criteria??{});setPaperRules(self?.spelregels??null);setPaperLevel(self?.spelniveau??null);
  }
  function downloadCsv(){
    const rows=[ ["Naam","Klas","Aanwezig","Geblesseerd","Gsm beschikbaar","Observator","Peerevaluatie ingediend","Wedstrijdscore","Bovenhandse opslag","Aanval","Verdediging","Coaching","Zelfevaluatie ingediend","Spelregels","Deelnameniveau"],
      ...participants.map(p=>{const peer=peers.find(x=>x.beoordeelde_id===p.id),self=selfs.find(x=>x.deelnemer_id===p.id);
        return [p.volledige_naam,p.klas_naam??"",p.aanwezigheid,p.geblesseerd?"Ja":"Nee",p.toestel_beschikbaar?"Ja":"Nee",findName(peer?.observator_id),peer?.status??"niet begonnen",peer?.status==="ingediend"?scorePeer(peer.criteria):"",...PEER_CRITERIA.map(c=>peer?.criteria[c.key]===undefined?"":PEER_LEVELS[(peer?.criteria[c.key] ?? 1)-1]??""),self?.status??"niet begonnen",self?.spelregels?SYMBOLS[self.spelregels-1]:"",self?.spelniveau?SYMBOLS[self.spelniveau-1]:""]; }) ];
    const csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`volleybal-les3-${state?.les.lesdatum??today()}.csv`;a.click();URL.revokeObjectURL(url);
  }
  const visiblePresent=present.filter(p=>controlFilter==="iedereen"||
    (controlFilter==="niet_ingediend"&&p.toestel_beschikbaar&&!observerDone.has(p.id))||
    (controlFilter==="niet_beoordeeld"&&!p.geblesseerd&&!rated.has(p.id))||
    (controlFilter==="zelf_open"&&!p.geblesseerd&&!selfDone.has(p.id)));
  const showTeacher=teacher && omgeving!=="leerling";
  const studentView=!showTeacher;
  const isFinished=state?.les.fase==="afgerond";

  function PeerQuestions({value,onChange,locked}:{value:PeerDraft;onChange:(next:PeerDraft)=>void;locked:boolean}){
    return <div className="space-y-3">{PEER_CRITERIA.map(item=><div key={item.key} className="rounded-xl border border-white/15 bg-black/20 p-3">
      <div className="font-bold">{item.title}</div><p className="mb-3 text-sm text-white/70">{item.detail}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PEER_LEVELS.map((label,i)=><button key={label} type="button" disabled={locked}
      onClick={()=>onChange({...value,[item.key]:i+1})}
      aria-pressed={value[item.key]===i+1}
      className={`${value[item.key]===i+1?primary:button} disabled:opacity-50`}>{label}</button>)}</div>
    </div>)}<p className="font-bold text-[#b4e8d1]">Eindscore: {peerComplete(value)?scorePeer(value):"Vul eerst alle vier criteria in"}</p></div>;
  }
  function SelfQuestions({spelregels,spelniveau,onRules,onLevel,locked}:{spelregels:number|null;spelniveau:number|null;onRules:(n:number)=>void;onLevel:(n:number)=>void;locked:boolean}){
    return <div className="space-y-5">{SELF_QUESTIONS.map(q=>{const value=q.key==="spelregels"?spelregels:spelniveau;
    return <div key={q.key} className="space-y-2"><h3 className="font-bold">{q.title}</h3>{q.levels.map((description,i)=><button key={i} type="button" disabled={locked}
    onClick={()=>q.key==="spelregels"?onRules(i+1):onLevel(i+1)}
    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm disabled:opacity-60 ${value===i+1?"border-[#89C2AA] bg-[#4B8E8D]/40":"border-white/15 bg-black/20"}`}>
    <span className="min-w-9 font-black">{SYMBOLS[i]}</span><span>{description}</span></button>)}</div>;})}</div>;
  }
  if(loading)return <AppShell title="LO App" subtitle="Volleybal"><p className="p-6 text-white">Volleybal laden...</p></AppShell>;
  return <AppShell title="KA LO App" subtitle="Volleybal – les 3">
    <BaseHero label="LO · EVALUATIES" title={<>Volleybal <span className="text-[#89C2AA]">3e graad</span></>}
      description="Les 3 · peerevaluatie 3 tegen 3 · zelfevaluatie 4 tegen 4"
      imageSrc="/functional/functionalfitness.png" imageAlt="Lichamelijke opvoeding"
      quoteTitle="Samen groeien" quote="Observeren, beoordelen en reflecteren."
      actions={<Link href={showTeacher?"/leerkrachten-lo/evaluaties":"/les-lo/les"} className={button}>← Terug</Link>}/>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-white">
      {error&&<div role="alert" className="rounded-xl border border-red-400/40 bg-red-900/30 p-4 text-red-100">{error}</div>}
      {notice&&<div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-3 text-emerald-100">{notice}</div>}
      {!uid&&<section className={shell}>Log in om de module te gebruiken.</section>}
      {uid&&<section className={shell}>
        <label className="block text-sm font-bold">{showTeacher?"Kies een volleyballes":"Mijn volleyballes"}</label>
        <select className={`${field} mt-2`} value={lessonId} onChange={e=>{setLessonId(e.target.value);setTab("overzicht");setPreviewId("");setEditingLessonName(false);}}>
          <option value="">Selecteer een les</option>
          {lessons.map(l=><option key={l.id} value={l.id}>{l.naam} · {l.lesdatum} · {l.fase}</option>)}
        </select>
        {showTeacher&&<button type="button" className={`${button} mt-3`} onClick={()=>{setCreating(!creating);}}> {creating?"Annuleer nieuwe les":"＋ Nieuwe volleyballes"}</button>}
        {showTeacher && state?.les.id===lessonId && !creating && <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><span className="block text-xs text-white/60">Naam van de evaluatie</span><strong>{state.les.naam}</strong></div>
            {state.les.fase!=="afgerond" && !editingLessonName && <button type="button" className={button} disabled={busy} onClick={()=>{setLessonNameDraft(state.les.naam);setEditingLessonName(true);}}>✎ Naam wijzigen</button>}
          </div>
          {editingLessonName && state.les.fase!=="afgerond" && <div className="mt-3 space-y-2">
            <label className="block text-sm font-bold" htmlFor="volleybal-naam-wijzigen">Nieuwe naam</label>
            <input id="volleybal-naam-wijzigen" className={field} maxLength={120} value={lessonNameDraft} onChange={e=>setLessonNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();if(!busy)void renameLesson();}}}/>
            <div className="flex gap-2">
              <button type="button" className={primary} disabled={busy||!lessonNameDraft.trim()} onClick={()=>void renameLesson()}>Naam opslaan</button>
              <button type="button" className={button} disabled={busy} onClick={()=>setEditingLessonName(false)}>Annuleren</button>
            </div>
          </div>}
          {state.les.fase==="afgerond" && <p className="mt-2 text-xs text-white/55">Deze les is afgesloten. De naam kan niet meer worden gewijzigd.</p>}
        </div>}
      </section>}
      {showTeacher&&creating&&<section className={shell}>
        <h2 className="mb-4 text-xl font-black">Nieuwe volleyballes · les 3</h2>
        <div className="grid gap-3 sm:grid-cols-3"><label>Lesnaam<input className={field} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>Datum<input type="date" className={field} value={date} onChange={e=>setDate(e.target.value)}/></label>
          <label>Leerjaar<select className={field} value={year} onChange={e=>{setYear(Number(e.target.value));setSelectedClasses([]);setSelected([]);}}><option value={5}>5e jaar</option><option value={6}>6e jaar</option></select></label></div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-bold">Finaliteit</legend>
          <div className="flex flex-wrap gap-4">
            {["AM", "DF", "DS"].map(f => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={finalities.includes(f)} onChange={() => {
                  setFinalities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
                  setSelectedClasses([]); setSelected([]);
                }} />
                {f}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-white/60">Selecteer een of meerdere finaliteiten. De klas- en leerlingenlijst wordt automatisch gefilterd.</p>
        </fieldset>
        <fieldset className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3">
          <legend className="px-2 text-sm font-bold">Klassen (meerdere mogelijk)</legend>
          <p className="mb-3 text-xs text-white/65">Vink bijvoorbeeld twee klassen aan. Zonder vinkjes worden alle klassen van de gekozen finaliteiten getoond.</p>
          <div className="flex flex-wrap gap-2">
            {classNames.map(c => (
              <label key={c} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${selectedClasses.includes(c) ? "border-[#89C2AA] bg-[#4B8E8D]/30" : "border-white/15 bg-black/20"}`}>
                <input type="checkbox" checked={selectedClasses.includes(c)} onChange={e => setSelectedClasses(prev => e.target.checked ? [...prev, c] : prev.filter(x => x !== c))} />
                {c}
              </label>
            ))}
          </div>
          {classNames.length === 0 && <p className="text-sm text-amber-100">Geen klassen gevonden voor dit leerjaar en deze finaliteiten.</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className={button} onClick={() => setSelectedClasses([])}>Alle klassen tonen</button>
            <span className="text-xs text-white/65">{selectedClasses.length ? `${selectedClasses.length} klas(sen) gekozen` : "Alle klassen zichtbaar"}</span>
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black">Leerlingen ({selected.length} geselecteerd)</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={()=>setSelected(prev => [...new Set([...prev, ...studentCandidates.map(s=>normalEmail(s.email))])])}>Alle zichtbare selecteren</button>
            <button type="button" className={button} onClick={()=>setSelected(prev => prev.filter(x => !studentCandidates.some(s => normalEmail(s.email) === x)))}>Zichtbare deselecteren</button>
          </div>
        </div>
        <input className={`${field} my-3`} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Zoek leerling of klas"/>
        <div className="grid max-h-[360px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{studentCandidates.map(s=><label key={s.email} className="flex gap-2 rounded-lg border border-white/15 bg-white/5 p-2 text-sm">
          <input type="checkbox" checked={selected.includes(normalEmail(s.email))} onChange={e=>setSelected(prev=>e.target.checked?[...prev,normalEmail(s.email)]:prev.filter(x=>x!==normalEmail(s.email)))}/>
          <span>{s.volledige_naam}<span className="block text-xs text-white/60">{s.klas_naam}</span></span></label>)}</div>
        <button type="button" className={`${primary} mt-4`} disabled={busy||!selected.length} onClick={()=>void createLesson()}>Les met {selected.length} leerlingen aanmaken</button>
      </section>}
      {state&&showTeacher&&<>
        <nav aria-label="Volleybal lestabbladen" className="flex flex-wrap gap-2">
          {(["overzicht","papier","resultaten","leerling"] as const).map(t=><button
            type="button" key={t} aria-current={tab===t?"page":undefined}
            className={tab===t?primary:button}
            onClick={()=>{setTab(t);setPreviewId("");resetPreview();}}
          >{({overzicht:"Live les",papier:"Papieren evaluaties",resultaten:"Resultaten",leerling:"👁 Leerlingweergave"})[t]}</button>)}
        </nav>
        {tab==="leerling"&&<section className={shell}>
          <h2 className="text-xl font-black">👁 Leerlingweergave · interactieve test</h2>
          <p className="mt-2 text-sm text-white/70">Kies een leerling en probeer zelf alle knoppen uit, zoals een leerling dat zou doen. De test gebruikt uitsluitend tijdelijke antwoorden in jouw browser: er wordt <strong>niets opgeslagen in Supabase</strong>.</p>
          <label className="mt-4 block text-sm font-bold">Bekijk als leerling
            <select className={`${field} mt-2`} value={previewId} onChange={e=>{setPreviewId(e.target.value);resetPreview();}}>
              <option value="">Selecteer een leerling…</option>
              {[...participants].sort((a,b)=>a.volledige_naam.localeCompare(b.volledige_naam,"nl-BE")).map(p=><option value={p.id} key={p.id}>{p.volledige_naam} · {p.klas_naam??""}{p.aanwezigheid==="afwezig"?" (afwezig)":""}</option>)}
            </select>
          </label>
          {previewId&&<>
            <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">Testmodus: je kunt alles aanklikken, maar echte leerlinggegevens, keuzes en ingediende evaluaties blijven ongewijzigd.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={previewPhase==="peer"?primary:button} onClick={()=>setPreviewPhase("peer")}>1 · Peerevaluatie</button>
              <button type="button" className={previewPhase==="self"?primary:button} onClick={()=>setPreviewPhase("self")}>2 · Zelfevaluatie</button>
              <button type="button" className={button} onClick={resetPreview}>↺ Test opnieuw starten</button>
            </div>
            <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="font-black">Welkom, {findName(previewId)}</p>
              <p className="mt-1 text-sm text-white/60">Werkelijke lesfase: {state.les.fase} · Gesimuleerde fase: {previewPhase==="peer"?"Peerevaluatie 3 tegen 3":"Zelfevaluatie 4 tegen 4"}</p>
              <p className="mt-2 text-xs text-white/60">Dit is een oefenscherm, niet de daadwerkelijk ingediende evaluatie van de gekozen leerling.</p>
            </div>
            {previewPhase==="peer"&&<div className="mt-5 space-y-4">
              <h3 className="text-lg font-black">Peerevaluatie · wedstrijd 3 tegen 3</h3>
              {previewPeerSent?<p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-100">✓ Testevaluatie ingediend. Eindscore: {scorePeer(previewPeerDraft)}. Er is niets echt ingediend.</p>:
                <>
                  <label className="block text-sm font-bold">Ik beoordeel
                    <select className={`${field} mt-2`} disabled={previewClaimed} value={previewTarget} onChange={e=>setPreviewTarget(e.target.value)}>
                      <option value="">Kies een leerling…</option>
                      {present.filter(p=>p.id!==previewId).map(p=><option value={p.id} key={p.id}>{p.volledige_naam} · {p.klas_naam}</option>)}
                    </select>
                  </label>
                  {!previewClaimed?<button type="button" className={primary} disabled={!previewTarget} onClick={()=>setPreviewClaimed(true)}>Leerling vastleggen (test)</button>:
                    <>
                      <p className="text-sm">Ik beoordeel: <strong>{findName(previewTarget)}</strong></p>
                      <PeerQuestions value={previewPeerDraft} onChange={setPreviewPeerDraft} locked={false}/>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={button} onClick={()=>setNotice("Testconcept in de browser bijgehouden. Er is niets opgeslagen in Supabase.")}>Concept opslaan (test)</button>
                        <button type="button" className={primary} disabled={!peerComplete(previewPeerDraft)} onClick={()=>setPreviewPeerSent(true)}>Definitief indienen (test)</button>
                      </div>
                    </>}
                </>}
            </div>}
            {previewPhase==="self"&&<div className="mt-5 space-y-4">
              <h3 className="text-lg font-black">Mijn zelfevaluatie · wedstrijd 4 tegen 4</h3>
              {previewSelfSent?<p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-emerald-100">✓ Zelfevaluatie in de test ingediend. Er is niets echt opgeslagen.</p>:
                <>
                  <SelfQuestions spelregels={previewRules} spelniveau={previewLevel} onRules={setPreviewRules} onLevel={setPreviewLevel} locked={false}/>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={button} onClick={()=>setNotice("Testconcept in de browser bijgehouden. Er is niets opgeslagen in Supabase.")}>Concept opslaan (test)</button>
                    <button type="button" className={primary} disabled={previewRules===null||previewLevel===null} onClick={()=>setPreviewSelfSent(true)}>Mijn zelfevaluatie definitief indienen (test)</button>
                  </div>
                </>}
            </div>}
          </>}
        </section>}
        {tab!=="leerling"&&<>
        {tab==="overzicht"&&<>
          <section className={shell}>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Lesbediening</h2><span className="rounded-lg bg-white/10 px-3 py-1 text-sm">Fase: {state.les.fase}</span></div>
            <p className="mt-2 text-sm text-white/70">Fase 1: gesimuleerde wedstrijd 3–3 · fase 2: echte wedstrijd 4–4. Alleen de leerkracht schakelt door.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {state.les.fase==="voorbereiding"&&<button className={primary} disabled={busy||!present.length} onClick={()=>void move("start")}>▶ Start peerevaluatie</button>}
              {state.les.fase==="peer"&&<button className={primary} disabled={busy} onClick={()=>void move("volgende")}>Volgende fase → Zelfevaluatie</button>}
              {(state.les.fase==="peer"||state.les.fase==="self")&&<button className={button} disabled={busy} onClick={()=>void move("afsluiten")}>■ Les definitief afsluiten</button>}
              {isFinished&&<p className="text-emerald-200">De les is afgesloten; leerlingbewerkingen zijn geblokkeerd.</p>}
            </div>
          </section>
          {state.les.fase==="voorbereiding"&&<section className={shell}>
            <h2 className="mb-2 font-black">Aanwezigheid en hulpmiddelen</h2>
            <p className="mb-3 text-sm text-white/65">Geblesseerden kunnen observeren, maar hoeven niet zelf beoordeeld te worden. Leerlingen zonder gsm worden op papier beoordeeld.</p>
            <div className="grid gap-2 sm:grid-cols-2">{participants.map(p=><div key={p.id} className="rounded-xl bg-white/5 p-3">
              <p className="mb-2 font-semibold">{p.volledige_naam} <small className="font-normal text-white/60">{p.klas_naam}</small></p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={p.aanwezigheid==="afwezig"} disabled={busy} onChange={e=>void action(async()=>{const {error:ae}=await supabase.rpc("volleybal_aanwezigheid",{p_deelnemer_id:p.id,p_aanwezig:!e.target.checked});if(ae)throw ae;},"Aanwezigheid aangepast.")}/>Afwezig</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={p.geblesseerd??false} disabled={busy||p.aanwezigheid==="afwezig"} onChange={e=>void action(async()=>{const {error:ae}=await supabase.rpc("volleybal_wijzig_hulpmiddelen",{p_deelnemer_id:p.id,p_geblesseerd:e.target.checked,p_toestel_beschikbaar:p.toestel_beschikbaar??true});if(ae)throw ae;},"Leerlingstatus bijgewerkt.")}/>Geblesseerd</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!(p.toestel_beschikbaar??true)} disabled={busy||p.aanwezigheid==="afwezig"} onChange={e=>void action(async()=>{const {error:ae}=await supabase.rpc("volleybal_wijzig_hulpmiddelen",{p_deelnemer_id:p.id,p_geblesseerd:p.geblesseerd??false,p_toestel_beschikbaar:!e.target.checked});if(ae)throw ae;},"Leerlingstatus bijgewerkt.")}/>Geen gsm</label>
              </div>
            </div>)}</div>
          </section>}
          <section className={shell}>
            <h2 className="mb-4 text-xl font-black">Live evaluatiecontrole</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[["Peerevaluaties ingediend",expectedObservers.filter(p=>observerDone.has(p.id)).length],["Leerlingen beoordeeld",eligibleForAssessment.filter(p=>rated.has(p.id)).length],["Zelfevaluaties ingediend",eligibleForAssessment.filter(p=>selfDone.has(p.id)).length]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-black/20 p-4"><p className="text-sm text-white/65">{label}</p><p className="text-2xl font-black">{value} / {String(label)==="Peerevaluaties ingediend"?expectedObservers.length:eligibleForAssessment.length}</p></div>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{([ ["iedereen","Alle leerlingen"],["niet_ingediend","Niet ingediend"],["niet_beoordeeld","Niet beoordeeld"],["zelf_open","Zelfevaluatie open"] ] as const).map(([key,label])=><button key={key} className={controlFilter===key?primary:button} onClick={()=>setControlFilter(key)}>{label}</button>)}</div>
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-white/20 text-white/70"><th className="p-2">Leerling</th><th>Als observator</th><th>Beoordeeld door</th><th>Zelfevaluatie</th></tr></thead><tbody>
              {visiblePresent.map(p=>{const authored=peers.find(r=>r.observator_id===p.id),received=peers.find(r=>r.beoordeelde_id===p.id),self=selfs.find(r=>r.deelnemer_id===p.id);
                return <tr key={p.id} className="border-b border-white/10"><td className="p-2 font-semibold">{p.volledige_naam}<small className="block font-normal text-white/55">{p.klas_naam}{p.geblesseerd?" · geblesseerd":""}{!p.toestel_beschikbaar?" · geen gsm (papier)":""}</small></td>
                  <td>{authored?.status==="ingediend"?"✓ Ingediend":!p.toestel_beschikbaar?"📝 Papier nodig":authored?"◷ Concept":"✕ Niet ingediend"}</td>
                  <td>{p.geblesseerd?"Niet van toepassing":received?.status==="ingediend"?`✓ ${findName(received.observator_id)}`:received?"◷ Gekozen, nog niet ingediend":"✕ Nog niet gekozen"}</td>
                  <td>{p.geblesseerd?"Niet van toepassing":self?.status==="ingediend"?"✓ Ingediend":!p.toestel_beschikbaar?"📝 Papier nodig":self?"◷ Concept":"✕ Niet ingediend"}</td></tr>;})}
            </tbody></table></div>
            {visiblePresent.length===0&&<p className="mt-4 text-sm text-white/60">Geen leerlingen voor dit filter.</p>}
          </section>
        </>}
        {tab==="papier"&&<section className={shell}><h2 className="mb-2 text-xl font-black">Papieren evaluaties per leerling</h2>
          <p className="mb-4 text-sm text-white/65">Kies een leerling en voer de wedstrijdbeoordeling en/of zelfevaluatie in. Een papieren correctie overschrijft een bestaande beoordeling.</p>
          <select className={field} value={paperStudent} onChange={e=>changePaper(e.target.value)}><option value="">Selecteer een leerling…</option>
            {participants.filter(p=>p.aanwezigheid==="aanwezig").map(p=><option key={p.id} value={p.id}>{p.volledige_naam} · {p.klas_naam}</option>)}</select>
          {paperPerson&&<div className="mt-4 grid gap-5 lg:grid-cols-2"><div className="rounded-xl border border-white/15 p-4"><h3 className="mb-3 text-lg font-black">Peerevaluatie · 3 tegen 3</h3>
            <p className="mb-3 text-xs text-white/60">{paperExisting?`Bestaande beoordeling: ${paperExisting.status} (${paperExisting.invoermethode})`:"Nog geen beoordeling"}</p>
            <PeerQuestions value={paperPeer} onChange={setPaperPeer} locked={busy}/>
            <button className={`${primary} mt-4`} disabled={busy||!peerComplete(paperPeer)} onClick={()=>void paperSave("peer")}>Papieren wedstrijdscore opslaan</button></div>
            <div className="rounded-xl border border-white/15 p-4"><h3 className="mb-3 text-lg font-black">Zelfevaluatie · 4 tegen 4</h3>
              <p className="mb-3 text-xs text-white/60">{paperSelfExisting?`Bestaande beoordeling: ${paperSelfExisting.status} (${paperSelfExisting.invoermethode})`:"Nog geen beoordeling"}</p>
              <SelfQuestions spelregels={paperRules} spelniveau={paperLevel} onRules={setPaperRules} onLevel={setPaperLevel} locked={busy}/>
              <button className={`${primary} mt-4`} disabled={busy||paperRules===null||paperLevel===null} onClick={()=>void paperSave("self")}>Papieren zelfevaluatie opslaan</button>
            </div></div>}
        </section>}
        {tab==="resultaten"&&<section className={shell}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Resultatenmatrix</h2><button className={primary} onClick={downloadCsv}>⬇ CSV exporteren</button></div>
          <p className="mt-2 text-sm text-white/65">De wedstrijdscore is het afgeronde gemiddelde van de vier criteria (Nooit / Soms / Vaak / Altijd). Zelfevaluaties blijven twee afzonderlijke scores.</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-white/15"><th className="p-2">Leerling</th><th>Wedstrijd</th><th>Spelregels</th><th>Deelnameniveau</th><th>Status</th></tr></thead><tbody>
          {participants.map(p=>{const peer=peers.find(x=>x.beoordeelde_id===p.id),s=selfs.find(x=>x.deelnemer_id===p.id);return <tr key={p.id} className="border-b border-white/10"><td className="p-2">{p.volledige_naam}</td><td>{peer?.status==="ingediend"?scorePeer(peer.criteria):"—"}</td><td>{s?.status==="ingediend"&&s.spelregels?SYMBOLS[s.spelregels-1]:"—"}</td><td>{s?.status==="ingediend"&&s.spelniveau?SYMBOLS[s.spelniveau-1]:"—"}</td><td className="text-white/60">{p.aanwezigheid}</td></tr>;})}
          </tbody></table></div>
        </section>}
        </>}
      </>}
      {state&&studentView&&me&&<>
        <section className={shell}><h2 className="text-xl font-black">Welkom, {me.volledige_naam}</h2><p className="mt-2 text-white/70">{state.les.naam} · {state.les.lesdatum}</p>
          <div className="mt-3 rounded-lg bg-white/10 p-3 font-bold">{state.les.fase==="voorbereiding"?"De leerkracht start de peerevaluatie binnenkort.":state.les.fase==="peer"?"Fase 1 – Peerevaluatie (gesimuleerde wedstrijd 3 tegen 3)":state.les.fase==="self"?"Fase 2 – Zelfevaluatie (wedstrijd 4 tegen 4)":"De les is definitief afgesloten."}</div>
        </section>
        {me.aanwezigheid==="aanwezig"&&!me.toestel_beschikbaar&&<section className={shell}>Je staat geregistreerd als leerling zonder gsm. De leerkracht kan je evaluatie op papier invoeren.</section>}
        {(state.les.fase==="peer"||state.les.fase==="self")&&me.aanwezigheid==="aanwezig"&&me.toestel_beschikbaar&&<section className={shell}>
          <h2 className="text-xl font-black">Peerevaluatie · wedstrijd 3 tegen 3</h2>
          {mine?.status==="ingediend"?<p className="mt-3 text-emerald-200">✓ Definitief ingediend voor {findName(mine.beoordeelde_id)}. Je kunt deze niet meer aanpassen.</p>:
          !mine&&state.les.fase==="self"?<p className="mt-3 text-amber-100">Er werd nog geen leerling gekozen tijdens fase 1. Meld dit aan de leerkracht.</p>:
          <div className="mt-4 space-y-4">
            {!mine&&<><p className="text-sm text-white/70">Spreek met je medeleerling af wie wie beoordeelt. Een leerling kan slechts eenmaal gekozen worden.</p>
              <select disabled={previewMode} className={field} value={selectedTarget} onChange={e=>setSelectedTarget(e.target.value)}><option value="">Kies de leerling die jij beoordeelt…</option>
                {eligibleForAssessment.filter(p=>p.id!==me.id&&!reserved.has(p.id)).map(p=><option value={p.id} key={p.id}>{p.volledige_naam} · {p.klas_naam}</option>)}</select>
              <button className={primary} disabled={previewMode||busy||!selectedTarget} onClick={()=>void claim(selectedTarget)}>Leerling vastleggen</button></>}
            {mine&&<><p className="text-sm">Ik beoordeel: <strong>{findName(mine.beoordeelde_id)}</strong></p>
              <PeerQuestions value={peerDraft} onChange={setPeerDraft} locked={previewMode||busy}/>
              <div className="flex flex-wrap gap-2"><button className={button} disabled={previewMode||busy} onClick={()=>void savePeer(false)}>Concept opslaan</button>
                <button className={primary} disabled={previewMode||busy||!peerComplete(peerDraft)} onClick={()=>void savePeer(true)}>Definitief indienen</button></div></>}
          </div>}
        </section>}
        {me.geblesseerd&&<section className={shell}>Je bent als geblesseerd aangeduid. Je hoeft niet zelf beoordeeld te worden, maar kunt eventueel mee observeren.</section>}
        {state.les.fase==="self"&&me.aanwezigheid==="aanwezig"&&!me.geblesseerd&&me.toestel_beschikbaar&&<section className={shell}><h2 className="text-xl font-black">Mijn zelfevaluatie · wedstrijd 4 tegen 4</h2>
          {mySelf?.status==="ingediend"?<p className="mt-3 text-emerald-200">✓ Mijn zelfevaluatie is definitief ingediend.</p>:
          <div className="mt-4"><SelfQuestions spelregels={rules} spelniveau={level} onRules={setRules} onLevel={setLevel} locked={previewMode||busy}/>
            <div className="mt-4 flex flex-wrap gap-2"><button className={button} disabled={previewMode||busy} onClick={()=>void saveSelf(false)}>Concept opslaan</button>
              <button className={primary} disabled={previewMode||busy||rules===null||level===null} onClick={()=>void saveSelf(true)}>Mijn zelfevaluatie definitief indienen</button></div></div>}
        </section>}
      </>}
      {state&&studentView&&!me&&<section className={shell}>{previewMode?"Selecteer hierboven een leerling om de leerlingenpagina te bekijken.":"Je bent niet als leerling gekoppeld aan deze les."}</section>}
      {!state&&!loading&&uid&&!showTeacher&&<section className={shell}>Je hebt nog geen volleyballes toegewezen gekregen.</section>}
    </main>
  </AppShell>;
}
