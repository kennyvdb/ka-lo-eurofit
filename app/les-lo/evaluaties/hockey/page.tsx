"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
type Row = Record<string, any>;
type Lesson = { id: string; naam: string; schooljaar: string; lesdatum: string; leerjaar: number; finaliteiten: string[]; aantal_circuits: number; eindtijd: string | null; status: string; aangemaakt_door: string; zelfevaluatie_seconden: number };
type Participant = { id: string; les_id: string; leerling_email: string; leerling_username: string | null; profiel_id: string | null; volledige_naam: string; klas_naam: string | null; geslacht: string | null; aanwezigheid: string; geblesseerd: boolean; toestel_beschikbaar: boolean; groep_code: string | null };
type Assignment = { id: string; les_id: string; ronde: number; type: "techniek" | "wedstrijd"; observator_id: string; beoordeelde_id: string; status: string };
type Evaluation = { id: string; les_id: string; observatie_id: string | null; beoordeelde_id: string; type: string; rubrics: Record<string, number>; status: string };
type Timer = { les_id: string; klokbeheerder_id: string | null; huidige_ronde: number; fase: string; loopt: boolean; resterende_seconden: number | null; eindigt_op: string | null; versie: number };
type SmartStudent = { email: string; volledige_naam: string; username: string | null; klas_naam: string; profiel_id: string | null; geslacht: string | null; schooljaar: string };
const RUBRICS: Record<string, { key: string; label: string }[]> = {
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
const LEVELS = ["−", "+/−", "+", "++"];
const panel = "rounded-3xl border border-white/15 bg-white/[0.055] p-4 sm:p-6";
const btn = "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40";
const primary = "rounded-xl border border-[#89C2AA]/50 bg-[#4B8E8D]/35 px-4 py-2.5 text-sm font-black text-white hover:bg-[#4B8E8D]/50 disabled:cursor-not-allowed disabled:opacity-40";
const input = "w-full rounded-xl border border-white/20 bg-[#14212d] px-3 py-2.5 text-white outline-none focus:border-[#89C2AA]";
const text = (v: unknown) => String(v ?? "").trim();
const email = (v: unknown) => text(v).toLowerCase();
const schoolYear = () => { const d = new Date(); const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${y + 1}`; };
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const isTeacher = (role: unknown) => ["lo_leerkracht", "leerkracht_lo", "admin"].includes(text(role).toLowerCase());
const station = (code: string | null, round: number) => code ? ((Number(code.slice(1)) + round - 2) % 5) + 1 : null;
const getError = (e: unknown) => e instanceof Error ? e.message : text((e as Row)?.message) || "Onbekende fout";
function scoreColor(v: number | null) { return v === null ? "bg-white/10 text-white/50" : v < 1.75 ? "bg-red-500/30 text-red-100" : v < 2.5 ? "bg-amber-500/30 text-amber-100" : v < 3.25 ? "bg-teal-500/30 text-teal-100" : "bg-emerald-500/30 text-emerald-100"; }
function mean(values: number[]): number | null { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : null; }
function score(evals: Evaluation[], type: string) { return mean(evals.filter(e=>e.type===type && e.status==="ingediend").flatMap(e=>Object.values(e.rubrics ?? {}).map(Number).filter(v=>v>=1&&v<=4))); }
function clockDisplay(s: number) { return `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`; }
function lessonLabel(l: Lesson) { return `${l.naam} · ${l.lesdatum} · ${l.leerjaar}e jaar`; }

export default function HockeyPage() {
 const [uid,setUid]=useState(""); const [profileEmail,setProfileEmail]=useState(""); const [creating,setCreating]=useState(false); const [role,setRole]=useState(""); const [userName,setUserName]=useState<string|null>(null);
 const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 const [lessons,setLessons]=useState<Lesson[]>([]); const [lessonId,setLessonId]=useState(""); const [lesson,setLesson]=useState<Lesson|null>(null);
 const [participants,setParticipants]=useState<Participant[]>([]); const [assignments,setAssignments]=useState<Assignment[]>([]); const [evaluations,setEvaluations]=useState<Evaluation[]>([]); const [timer,setTimer]=useState<Timer|null>(null);
 const [teachers,setTeachers]=useState<{leerkracht_id:string}[]>([]); const [teacherOptions,setTeacherOptions]=useState<{id:string;volledige_naam:string}[]>([]);
 const [smart,setSmart]=useState<SmartStudent[]>([]); const [selected,setSelected]=useState<Set<string>>(new Set());
 const [year,setYear]=useState(3); const [finalities,setFinalities]=useState<string[]>(["AM","DF","DS"]); const [circuits,setCircuits]=useState(1);
 const [name,setName]=useState("Hockey evaluatieles"); const [date,setDate]=useState(localDate()); const [endTime,setEndTime]=useState("15:00");
 const [now,setNow]=useState(Date.now()); const [tab,setTab]=useState<"voorbereiding"|"groepen"|"les"|"resultaten">("voorbereiding");
 const [activeAssignment,setActiveAssignment]=useState<string|null>(null); const [draft,setDraft]=useState<Record<string,number>>({}); const [saveState,setSaveState]=useState("");
 const [selfDraft,setSelfDraft]=useState<Record<string,number>>({}); const [selectedResult,setSelectedResult]=useState<string|null>(null);
 const [studentSearch,setStudentSearch]=useState(""); const [showAll,setShowAll]=useState(false);
 const [showTeacherSelect,setShowTeacherSelect]=useState(false);
 const [assignmentNames,setAssignmentNames]=useState<Record<string,string>>({});
 const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const teacher=isTeacher(role);
 const myParticipant=useMemo(()=>participants.find(p=>p.profiel_id===uid || (p.profiel_id===null && p.leerling_email===profileEmail))??null,[participants,uid,profileEmail]);
 const currentSeconds=useMemo(()=>timer ? Math.max(0,timer.loopt&&timer.eindigt_op ? Math.ceil((new Date(timer.eindigt_op).getTime()-now)/1000) : (timer.resterende_seconden??0)) : 0,[timer,now]);
 const currentRound=timer?.huidige_ronde??1;
 const studentsForYear=useMemo(()=>smart.filter(s=>s.schooljaar===schoolYear() && s.klas_naam.startsWith(String(year)) && finalities.some(f=>s.klas_naam.toUpperCase().includes(f)) && (s.volledige_naam+" "+s.klas_naam).toLowerCase().includes(studentSearch.toLowerCase())).sort((a,b)=>a.klas_naam.localeCompare(b.klas_naam,"nl-BE")||a.volledige_naam.localeCompare(b.volledige_naam,"nl-BE")),[smart,year,finalities,studentSearch]);
 const groupCodes=useMemo(()=>Array.from({length:(lesson?.aantal_circuits??circuits)*5},(_,i)=>`${i<5?"A":"B"}${i%5+1}`),[lesson,circuits]);
 const myAssignments=useMemo(()=>assignments.filter(a=>a.observator_id===myParticipant?.id && a.ronde===currentRound),[assignments,myParticipant,currentRound]);
 useEffect(()=>{
  if(!lessonId || teacher || !uid){setAssignmentNames({});return;}
  let cancelled=false;
  async function loadAssignmentNames(){
   const {data,error}=await supabase.rpc("hockey_mijn_observatieopdrachten",{p_les_id:lessonId});
   if(error){console.error("Hockey-opdrachten:",error.message);return;}
   if(cancelled)return;
   const names:Record<string,string>={};
   for(const row of data??[]){if(row.observatie_id && row.beoordeelde_naam)names[row.observatie_id]=row.beoordeelde_naam;}
   setAssignmentNames(names);
  }
  void loadAssignmentNames();
  return()=>{cancelled=true;};
 },[lessonId,teacher,uid]);
 const selectedAssignment=assignments.find(a=>a.id===activeAssignment);
 const assignmentEvaluation=evaluations.find(e=>e.observatie_id===activeAssignment);
 const mySelf=evaluations.find(e=>e.type==="samenwerken"&&e.beoordeelde_id===myParticipant?.id);
 const pupilName=(id:string)=>{
  const participant=participants.find(p=>p.id===id);
  if(participant?.volledige_naam)return participant.volledige_naam;
  const assignment=assignments.find(a=>a.beoordeelde_id===id && assignmentNames[a.id]);
  return assignment ? assignmentNames[assignment.id] : "Leerling";
 };
 const ownTeacher=teachers.some(t=>t.leerkracht_id===uid);
 const canClock=timer?.klokbeheerder_id===uid;

 const loadLesson=useCallback(async(id:string)=>{
  if(!id) return;
  const [l,p,a,e,t,ts]=await Promise.all([
   supabase.from("hockey_lessen").select("*").eq("id",id).single(),
   supabase.from("hockey_deelnemers").select("*").eq("les_id",id).order("volledige_naam"),
   supabase.from("hockey_observaties").select("*").eq("les_id",id),
   supabase.from("hockey_evaluaties").select("*").eq("les_id",id),
   supabase.from("hockey_timer").select("*").eq("les_id",id).maybeSingle(),
   supabase.from("hockey_leerkrachten").select("leerkracht_id").eq("les_id",id),
  ]);
  for(const r of [l,p,a,e,t,ts]) if(r.error) throw r.error;
  setLesson(l.data as Lesson);setParticipants((p.data??[]) as Participant[]);setAssignments((a.data??[]) as Assignment[]);
  setEvaluations((e.data??[]) as Evaluation[]);setTimer((t.data??null) as Timer|null);setTeachers((ts.data??[]) as {leerkracht_id:string}[]);
 },[]);
 const refresh=useCallback(async()=>{if(lessonId) try{await loadLesson(lessonId);}catch(e){setError(getError(e));}},[lessonId,loadLesson]);
 useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i);},[]);
 useEffect(()=>{if(!lessonId)return;const i=setInterval(()=>{void refresh();},5000);return()=>clearInterval(i);},[lessonId,refresh]);
 useEffect(()=>{let mounted=true;(async()=>{try{
  const {data:{user},error:ae}=await supabase.auth.getUser();if(ae)throw ae;if(!user)return;
  const {data:p,error:pe}=await supabase.from("profielen").select("rol,volledige_naam,email").eq("id",user.id).single();if(pe)throw pe;
  if(!mounted)return;setUid(user.id);setProfileEmail(email(p?.email??user.email));setRole(text(p?.rol));setUserName(p?.volledige_naam??null);
  if(isTeacher(p?.rol)){
   const [ls,ss,tt]=await Promise.all([
    supabase.from("hockey_lessen").select("*").order("lesdatum",{ascending:false}).limit(100),
    supabase.from("eurofit_class_students_view").select("email,volledige_naam,username,klas_naam,profiel_id,geslacht,schooljaar").eq("schooljaar",schoolYear()).order("email").limit(1000),
    supabase.from("profielen").select("id,volledige_naam,rol").in("rol",["lo_leerkracht","leerkracht_lo","admin"]),
   ]);
   for(const r of [ls,ss,tt])if(r.error)throw r.error;
   const dedup=new Map<string,SmartStudent>();for(const s of ss.data??[]){const key=email(s.email);if(key&&!dedup.has(key))dedup.set(key,s as SmartStudent);}
   if(!mounted)return;setLessons((ls.data??[]) as Lesson[]);setSmart([...dedup.values()]);setTeacherOptions((tt.data??[]) as {id:string;volledige_naam:string}[]);
  }else{
   const {data:mine,error:me}=await supabase.from("hockey_deelnemers").select("les_id").eq("profiel_id",user.id).limit(30);if(me)throw me;
   const ids=[...new Set((mine??[]).map(x=>x.les_id))];
   if(ids.length){const {data:ls,error:le}=await supabase.from("hockey_lessen").select("*").in("id",ids).order("lesdatum",{ascending:false});if(le)throw le;if(mounted)setLessons((ls??[]) as Lesson[]);}
  }
 }catch(e){if(mounted)setError(getError(e));}finally{if(mounted)setLoading(false);}})();return()=>{mounted=false;};},[]);
 useEffect(()=>{if(lessons.length&&!lessonId&&!creating)setLessonId(lessons[0].id);},[lessons,lessonId,creating]);
 useEffect(()=>{if(lessonId)void loadLesson(lessonId).catch(e=>setError(getError(e)));},[lessonId,loadLesson]);
 useEffect(()=>{if(!activeAssignment){setDraft({});return;}const e=evaluations.find(x=>x.observatie_id===activeAssignment);setDraft(e?.rubrics??{});},[activeAssignment,evaluations]);
 useEffect(()=>{setSelfDraft(mySelf?.rubrics??{});},[mySelf?.id]);
 async function run(action:()=>Promise<unknown>,success:string){setBusy(true);setError("");setNotice("");try{await action();setNotice(success);await refresh();}catch(e){setError(getError(e));}finally{setBusy(false);}}
 async function createLesson(){await run(async()=>{
  if(!selected.size)throw new Error("Selecteer eerst leerlingen.");
  const iso=new Date(`${date}T${endTime}:00`).toISOString();
  const {data:l,error:le}=await supabase.from("hockey_lessen").insert({schooljaar:schoolYear(),naam:name,lesdatum:date,leerjaar:year,finaliteiten:finalities,aantal_circuits:circuits,eindtijd:iso,zelfevaluatie_seconden:120,aangemaakt_door:uid}).select("*").single();if(le)throw le;
  const id=l.id as string;
  const chosen=smart.filter(s=>selected.has(email(s.email)));
  for(let i=0;i<chosen.length;i+=150){const {error:e}=await supabase.from("hockey_deelnemers").insert(chosen.slice(i,i+150).map(s=>({les_id:id,leerling_email:email(s.email),leerling_username:s.username,profiel_id:s.profiel_id,volledige_naam:s.volledige_naam,klas_naam:s.klas_naam,geslacht:s.geslacht})));if(e)throw e;}
  const {error:te}=await supabase.from("hockey_leerkrachten").insert({les_id:id,leerkracht_id:uid});if(te)throw te;
  const {error:ce}=await supabase.rpc("hockey_stel_klokbeheerder_in",{p_les_id:id,p_leerkracht_id:uid});if(ce)throw ce;
  setCreating(false);setLessons(prev=>[l as Lesson,...prev]);setLessonId(id);setTab("groepen");
 },"Les en leerlingen aangemaakt. Controleer de aanwezigheid en maak daarna de groepen.");}
 async function changeParticipant(id:string,changes:Partial<Participant>){await run(async()=>{const {error:e}=await supabase.from("hockey_deelnemers").update(changes).eq("id",id);if(e)throw e;},"Leerling bijgewerkt.");}
 async function makeGroups(){await run(async()=>{const {error:e}=await supabase.rpc("hockey_maak_indeling",{p_les_id:lessonId});if(e)throw e;setTab("groepen");},"Groepen en observatieopdrachten aangemaakt.");}
 async function rebuild(){await run(async()=>{const {error:e}=await supabase.rpc("hockey_herbouw_observaties",{p_les_id:lessonId});if(e)throw e;},"Observatieopdrachten opnieuw verdeeld.");}
 async function changeGroup(p:Participant,code:string){await run(async()=>{const {error:e}=await supabase.rpc("hockey_wijzig_groep",{p_deelnemer_id:p.id,p_groep_code:code});if(e)throw e;},"Groep gewijzigd. Klik nu op 'Opdrachten herberekenen'.");}
 async function addTeacher(id:string){await run(async()=>{if(teachers.length>=3)throw new Error("Maximaal drie leerkrachten per les.");const {error:e}=await supabase.from("hockey_leerkrachten").insert({les_id:lessonId,leerkracht_id:id});if(e)throw e;},"Begeleidende leerkracht toegevoegd.");}
 async function clockOwner(id:string){await run(async()=>{const {error:e}=await supabase.rpc("hockey_stel_klokbeheerder_in",{p_les_id:lessonId,p_leerkracht_id:id});if(e)throw e;},"Klokbeheerder ingesteld.");}
 async function clock(action:string){await run(async()=>{const {error:e}=await supabase.rpc("hockey_bedien_timer",{p_les_id:lessonId,p_actie:action});if(e)throw e;},"Timer bijgewerkt.");}
 async function savePeer(values:Record<string,number>,submit=false){if(!activeAssignment)return;setSaveState("Opslaan...");try{
  const {error:e}=await supabase.rpc("hockey_bewaar_peerevaluatie",{p_observatie_id:activeAssignment,p_rubrics:values,p_indienen:submit});if(e)throw e;
  setSaveState(submit?"Definitief ingediend":"Concept opgeslagen");await refresh();
 }catch(e){setSaveState("Fout bij opslaan");setError(getError(e));}}
 async function saveSelf(values:Record<string,number>,submit=false){setSaveState("Opslaan...");try{
  const {error:e}=await supabase.rpc("hockey_bewaar_zelfevaluatie",{p_les_id:lessonId,p_rubrics:values,p_indienen:submit});if(e)throw e;
  setSaveState(submit?"Definitief ingediend":"Concept opgeslagen");await refresh();
 }catch(e){setSaveState("Fout bij opslaan");setError(getError(e));}}
 function changePeer(key:string,value:number){const next={...draft,[key]:value};setDraft(next);setSaveState("Nog niet opgeslagen");if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>void savePeer(next),700);}
 function changeSelf(key:string,value:number){const next={...selfDraft,[key]:value};setSelfDraft(next);setSaveState("Nog niet opgeslagen");if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>void saveSelf(next),700);}
 const results=useMemo(()=>participants.filter(p=>p.aanwezigheid==="aanwezig").map(p=>{const es=evaluations.filter(e=>e.beoordeelde_id===p.id);return {p,techniek:score(es,"techniek"),wedstrijd:score(es,"wedstrijd"),samenwerken:score(es,"samenwerken"),count:es.filter(e=>e.status==="ingediend").length};}),[participants,evaluations]);
 function downloadReport(){if(!lesson)return;const rows=[["Naam","Klas","Techniek","Wedstrijd","Samenwerken","Ingediende evaluaties"],...results.map(r=>[r.p.volledige_naam,r.p.klas_naam??"",r.techniek?.toFixed(2)??"",r.wedstrijd?.toFixed(2)??"",r.samenwerken?.toFixed(2)??"",String(r.count)])];const csv="\uFEFF"+rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(";")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`hockey-${lesson.lesdatum}.csv`;a.click();URL.revokeObjectURL(url);}

 function RubricForm({kind,values,onChange,locked}:{kind:string;values:Record<string,number>;onChange:(key:string,v:number)=>void;locked:boolean}){return <div className="space-y-3">{RUBRICS[kind].map(item=><div key={item.key} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="mb-2 text-sm font-semibold text-white">{item.label}</div><div className="grid grid-cols-4 gap-2">{LEVELS.map((label,i)=><button type="button" key={i} disabled={locked} onClick={()=>onChange(item.key,i+1)} className={`${values[item.key]===i+1?"border-[#89C2AA] bg-[#4B8E8D]/70":"border-white/15 bg-white/5"} rounded-xl border py-2 font-black text-white disabled:opacity-70`}>{label}</button>)}</div></div>)}</div>}

 if(loading)return <AppShell title="LO App" subtitle="Hockey"><p className="p-6 text-white">Hockey laden...</p></AppShell>;
 return <AppShell title="KA LO App" subtitle="Hockey" userName={userName}>
  <BaseHero label="LO · EVALUATIES" title={<>Hockey <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">2e graad</span></>} description="Vijf rotaties · techniek · wedstrijd · samenwerken" imageSrc="/functional/functionalfitness.png" imageAlt="Lichamelijke opvoeding" quoteTitle="Samen leren" quote="Observeren, spelen en groeien." actions={<Link href="/les-lo/evaluaties" className={btn}>← Evaluaties</Link>}/>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 text-white">
   {error&&<div role="alert" className="rounded-xl border border-red-400/50 bg-red-900/30 p-4 text-red-100">{error}</div>}
   {notice&&<div className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 p-3 text-emerald-100">{notice}</div>}
   {!uid&&<div className={panel}>Meld je aan om Hockey te gebruiken.</div>}
   {uid&&<section className={panel}><label className="mb-2 block text-sm font-bold text-white/75">{teacher?"Kies een Hockey-les":"Mijn Hockey-les"}</label><select className={input} value={lessonId} onChange={e=>{setLessonId(e.target.value);setActiveAssignment(null);}}><option value="">Selecteer een les</option>{lessons.map(l=><option key={l.id} value={l.id}>{lessonLabel(l)} ({l.status})</option>)}</select></section>}
   {teacher&&<nav className="flex flex-wrap gap-2">{(["voorbereiding","groepen","les","resultaten"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?primary:btn}>{({voorbereiding:"Lesvoorbereiding",groepen:"Groepen",les:"Live les",resultaten:"Resultaten"})[t]}</button>)}</nav>}
   {teacher&&tab==="voorbereiding"&&(!lesson||creating)&&<section className={panel}><h2 className="mb-4 text-xl font-black">Nieuwe Hockey-les</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label>Naam<input className={input} value={name} onChange={e=>setName(e.target.value)}/></label><label>Datum<input type="date" className={input} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Eindtijd<input type="time" className={input} value={endTime} onChange={e=>setEndTime(e.target.value)}/></label><label>Leerjaar<select className={input} value={year} onChange={e=>{setYear(Number(e.target.value));setSelected(new Set());}}><option value={3}>3e jaar</option><option value={4}>4e jaar</option></select></label><label>Circuits<select className={input} value={circuits} onChange={e=>setCircuits(Number(e.target.value))}><option value={1}>1 circuit (5 groepen)</option><option value={2}>2 circuits (10 groepen)</option></select></label></div><div className="mt-4 flex flex-wrap gap-4">{["AM","DF","DS"].map(f=><label key={f} className="flex items-center gap-2"><input type="checkbox" checked={finalities.includes(f)} onChange={()=>{setFinalities(p=>p.includes(f)?p.filter(x=>x!==f):[...p,f]);setSelected(new Set());}}/>{f}</label>)}</div><div className="my-4 flex items-center justify-between"><h3 className="font-black">Leerlingen ({selected.size} geselecteerd)</h3><button className={btn} onClick={()=>setSelected(new Set(studentsForYear.map(s=>email(s.email))))}>Alle zichtbare selecteren</button></div><input placeholder="Zoek naam of klas" className={input} value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}/><div className="mt-3 grid max-h-[400px] gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">{studentsForYear.map(s=><label key={s.email} className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-2"><input type="checkbox" checked={selected.has(email(s.email))} onChange={()=>setSelected(prev=>{const next=new Set(prev);const key=email(s.email);next.has(key)?next.delete(key):next.add(key);return next;})}/><span>{s.volledige_naam} <small className="block text-white/55">{s.klas_naam}{!s.profiel_id?" · geen profiel":""}</small></span></label>)}</div><button className={`${primary} mt-5`} disabled={busy||selected.size===0} onClick={()=>void createLesson()}>Les met {selected.size} leerlingen aanmaken</button></section>}
   {teacher&&lesson&&tab==="voorbereiding"&&<section className={panel}><h2 className="text-xl font-black">{lessonLabel(lesson)}</h2><p className="mt-2 text-white/65">Status: {lesson.status} · {participants.length} leerlingen · {lesson.aantal_circuits} circuit(s)</p><div className="mt-4 flex flex-wrap gap-2"><button className={btn} onClick={()=>setTab("groepen")}>Groepsindeling →</button><button className={btn} onClick={()=>{setCreating(true);setLesson(null);setLessonId("");}}>Nieuwe les maken</button></div><h3 className="mt-6 mb-3 font-black">Aanwezigheid en hulpmiddelen</h3><div className="max-h-[500px] overflow-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="text-white/65"><th className="p-2">Leerling</th><th>Groep</th><th>Aanwezig</th><th>Geblesseerd</th><th>Gsm beschikbaar</th></tr></thead><tbody>{participants.map(p=><tr key={p.id} className="border-t border-white/10"><td className="p-2">{p.volledige_naam}<span className="block text-xs text-white/50">{p.klas_naam}</span></td><td>{p.groep_code??"—"}</td><td><input type="checkbox" disabled={busy||lesson.status!=="voorbereiding"} checked={p.aanwezigheid==="aanwezig"} onChange={e=>void changeParticipant(p.id,{aanwezigheid:e.target.checked?"aanwezig":"afwezig"})}/></td><td><input type="checkbox" disabled={busy||lesson.status!=="voorbereiding"} checked={p.geblesseerd} onChange={e=>void changeParticipant(p.id,{geblesseerd:e.target.checked})}/></td><td><input type="checkbox" disabled={busy||lesson.status!=="voorbereiding"} checked={p.toestel_beschikbaar} onChange={e=>void changeParticipant(p.id,{toestel_beschikbaar:e.target.checked})}/></td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-white/60">Wijzig je aanwezigheid na het genereren van de groepen? Genereer de indeling opnieuw.</p></section>}
   {teacher&&lesson&&tab==="groepen"&&<section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Groepen en rotaties</h2><div className="flex flex-wrap gap-2"><button className={primary} disabled={busy||lesson.status!=="voorbereiding"} onClick={()=>void makeGroups()}>Automatisch verdelen</button><button className={btn} disabled={busy||lesson.status!=="voorbereiding"} onClick={()=>void rebuild()}>Opdrachten herberekenen</button></div></div><p className="mt-2 text-sm text-white/65">Groep A1 start op station 1, A2 op station 2, enz. Elke ronde schuift één station door. Handmatig wisselen kan vóór de les; bereken daarna de opdrachten opnieuw.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{groupCodes.map(code=><div key={code} className="rounded-2xl border border-white/15 bg-black/20 p-3"><h3 className="mb-2 font-black text-[#89C2AA]">Groep {code} · station {station(code,currentRound)}</h3>{participants.filter(p=>p.groep_code===code).map(p=><div key={p.id} className="mb-2 text-sm"><span>{p.volledige_naam}{p.geblesseerd?" 🩹":""}</span><select aria-label={`Groep van ${p.volledige_naam}`} className={`${input} mt-1 py-1 text-xs`} value={p.groep_code??""} disabled={busy||lesson.status!=="voorbereiding"} onChange={e=>void changeGroup(p,e.target.value)}>{groupCodes.map(c=><option key={c} value={c}>{c}</option>)}</select></div>)}</div>)}</div><div className="mt-4 rounded-xl border border-white/10 p-3 text-sm text-white/75">Station 1 → observeert techniek op station 2 · Station 3 → observeert wedstrijd op stations 4 en 5 · Geblesseerden worden niet als beoordeelde speler ingepland.</div><p className="mt-2 text-sm">{assignments.length} observatieopdrachten gegenereerd.</p></section>}
   {teacher&&lesson&&tab==="les"&&<><section className={panel}><h2 className="text-xl font-black">Live lesbediening</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-black/20 p-4"><div className="text-white/60">Fase</div><div className="text-2xl font-black">{timer?.fase??"voorbereiding"}</div><div>Ronde {currentRound} / 5</div></div><div className="rounded-xl bg-black/20 p-4"><div className="text-white/60">Resterende tijd</div><div className="text-5xl font-black tabular-nums">{clockDisplay(currentSeconds)}</div></div><div className="rounded-xl bg-black/20 p-4"><div className="text-white/60">Klokbeheerder</div><div className="font-black">{teacherOptions.find(t=>t.id===timer?.klokbeheerder_id)?.volledige_naam??"Niet ingesteld"}</div><div className="mt-2 text-sm">{canClock?"Jij bedient de klok":"Alleen de klokbeheerder bedient de klok"}</div></div></div><div className="mt-4 flex flex-wrap gap-2"><button className={primary} disabled={busy||!canClock||timer?.fase!=="voorbereiding"||!assignments.length} onClick={()=>void clock("start")}>▶ Start les</button><button className={btn} disabled={busy||!canClock||!timer?.loopt} onClick={()=>void clock("pauzeer")}>⏸ Pauzeer</button><button className={btn} disabled={busy||!canClock||timer?.loopt||!["rotatie","zelfevaluatie"].includes(timer?.fase??"")} onClick={()=>void clock("hervat")}>▶ Hervat</button><button className={primary} disabled={busy||!canClock||!["rotatie","zelfevaluatie"].includes(timer?.fase??"")} onClick={()=>{if(window.confirm("Naar de volgende ronde of fase gaan?"))void clock("volgende");}}>Volgende →</button></div></section><section className={panel}><h3 className="text-lg font-black">Begeleidende leerkrachten ({teachers.length}/3)</h3><div className="mt-3 flex flex-wrap gap-2">{teachers.map(t=><div key={t.leerkracht_id} className="rounded-xl border border-white/15 p-3 text-sm">{teacherOptions.find(x=>x.id===t.leerkracht_id)?.volledige_naam??"Leerkracht"}{timer?.klokbeheerder_id===t.leerkracht_id?" · klokbeheerder":""}{timer?.klokbeheerder_id!==t.leerkracht_id&&<button className="ml-2 text-[#89C2AA]" disabled={busy} onClick={()=>void clockOwner(t.leerkracht_id)}>Maak klokbeheerder</button>}</div>)}</div>{teachers.length<3&&<div className="mt-3 flex gap-2"><select className={input} value={showTeacherSelect?"select":""} onChange={e=>{if(e.target.value)void addTeacher(e.target.value);setShowTeacherSelect(false);}}><option value="">Voeg leerkracht toe...</option>{teacherOptions.filter(t=>!teachers.some(x=>x.leerkracht_id===t.id)).map(t=><option key={t.id} value={t.id}>{t.volledige_naam}</option>)}</select></div>}</section><section className={panel}><h3 className="mb-3 text-lg font-black">Live evaluatievoortgang</h3><p className="text-sm text-white/65">{assignments.filter(a=>a.status==="ingediend").length}/{assignments.length} peerevaluaties ingediend</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#89C2AA]" style={{width:`${assignments.length?100*assignments.filter(a=>a.status==="ingediend").length/assignments.length:0}%`}}/></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{assignments.filter(a=>a.ronde===currentRound).map(a=><div key={a.id} className={`rounded-xl border p-2 text-sm ${a.status==="ingediend"?"border-emerald-500/30 bg-emerald-500/10":"border-amber-500/20 bg-white/5"}`}>{pupilName(a.observator_id)} → {pupilName(a.beoordeelde_id)}<div className="text-xs text-white/55">{a.type} · {a.status}</div></div>)}</div></section></>}
   {teacher && lesson && tab === "resultaten" && (
    <section className={panel}>
     <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-black">Resultatenmatrix</h2>
      <button className={btn} onClick={downloadReport}>⬇ CSV-lesrapport</button>
     </div>
     <p className="mt-2 text-sm text-white/60">Gemiddelden op schaal 1–4. Klik op een leerling om de oorspronkelijke beoordelingen te bekijken. Resultaten zijn ook tijdens een actieve les zichtbaar. Geen klassement.</p>
     <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[650px] text-sm">
       <thead>
        <tr className="border-b border-white/20 text-left">
         <th className="p-3">Leerling</th><th>Techniek</th><th>Wedstrijd</th><th>Samenwerken</th><th>Ingediend</th>
        </tr>
       </thead>
       <tbody>
        {results.map(r => {
         const opened = selectedResult === r.p.id;
         const studentEvaluations = evaluations.filter(e => e.beoordeelde_id === r.p.id);
         return (
          <React.Fragment key={r.p.id}>
           <tr className={`border-b border-white/10 ${opened ? "bg-[#4B8E8D]/15" : ""}`}>
            <td className="p-2">
             <button
              type="button"
              aria-expanded={opened}
              aria-controls={`hockey-detail-${r.p.id}`}
              className="flex items-center gap-2 text-left font-bold text-[#b4e8d1] underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#89C2AA]"
              onClick={() => setSelectedResult(opened ? null : r.p.id)}
             >
              <span aria-hidden="true">{opened ? "▾" : "▸"}</span>
              {r.p.volledige_naam}
             </button>
             <span className="block text-xs text-white/50">{r.p.klas_naam}</span>
            </td>
            {([r.techniek, r.wedstrijd, r.samenwerken] as (number | null)[]).map((v, i) => (
             <td key={i}><span className={`inline-block min-w-14 rounded-lg p-2 text-center font-black ${scoreColor(v)}`}>{v?.toFixed(2) ?? "—"}</span></td>
            ))}
            <td>{r.count}</td>
           </tr>
           {opened && (
            <tr id={`hockey-detail-${r.p.id}`} className="border-b border-[#89C2AA]/30 bg-black/25">
             <td colSpan={5} className="p-3 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
               <h3 className="text-lg font-black text-white">{r.p.volledige_naam} · beoordelingsdetails</h3>
               <button type="button" className={btn} onClick={() => setSelectedResult(null)}>Sluiten ✕</button>
              </div>
              {studentEvaluations.length === 0 ? (
               <p className="mt-3 text-sm text-white/65">Voor deze leerling zijn nog geen beoordelingen opgeslagen.</p>
              ) : (
               <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {(["techniek", "wedstrijd", "samenwerken"] as const).map(kind => {
                 const kindEvaluations = studentEvaluations.filter(e => e.type === kind);
                 const label = kind === "techniek" ? "Techniek" : kind === "wedstrijd" ? "Wedstrijd" : "Samenwerken (zelfevaluatie)";
                 return (
                  <div key={kind} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                   <h4 className="text-base font-black text-[#b4e8d1]">{label}</h4>
                   {kindEvaluations.length === 0 ? (
                    <p className="mt-2 text-sm text-white/55">Nog geen beoordeling beschikbaar.</p>
                   ) : kindEvaluations.map(ev => {
                    const observation = assignments.find(a => a.id === ev.observatie_id);
                    const observer = observation ? participants.find(p => p.id === observation.observator_id)?.volledige_naam : null;
                    const criteria = RUBRICS[kind] ?? [];
                    const numbers = criteria.map(c => Number(ev.rubrics?.[c.key])).filter(v => v >= 1 && v <= 4);
                    const average = mean(numbers);
                    return (
                     <div key={ev.id} className="mt-3 border-t border-white/10 pt-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
                       <span>{kind === "samenwerken" ? "Zelfevaluatie" : `Observator: ${observer ?? "Niet bekend"}`}{observation ? ` · ronde ${observation.ronde}` : ""}</span>
                       <span className={`rounded-lg px-2 py-1 font-bold ${ev.status === "ingediend" ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100"}`}>{ev.status === "ingediend" ? "Definitief ingediend" : "Concept"}</span>
                      </div>
                      <div className="space-y-2">
                       {criteria.map(c => {
                        const value = Number(ev.rubrics?.[c.key]);
                        const symbol = value >= 1 && value <= 4 ? LEVELS[value - 1] : "—";
                        return (
                         <div key={c.key} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
                          <span className="text-sm text-white/85">{c.label}</span>
                          <span className={`min-w-12 rounded-lg px-2 py-1 text-center text-base font-black ${value >= 1 && value <= 4 ? scoreColor(value) : "bg-white/10 text-white/55"}`}>{symbol}</span>
                         </div>
                        );
                       })}
                      </div>
                      <p className="mt-3 text-right text-sm font-bold text-white/80">Gemiddelde: {average === null ? "—" : `${average.toFixed(2)}/4`}</p>
                     </div>
                    );
                   })}
                  </div>
                 );
                })}
               </div>
              )}
             </td>
            </tr>
           )}
          </React.Fragment>
         );
        })}
       </tbody>
      </table>
     </div>
    </section>
   )}
   {!teacher&&lesson&&myParticipant&&<><section className={panel}><h2 className="text-xl font-black">Welkom, {myParticipant.volledige_naam}</h2><p className="mt-2 text-white/70">{lessonLabel(lesson)}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-black/20 p-4">Mijn groep<div className="text-3xl font-black">{myParticipant.groep_code??"—"}</div></div><div className="rounded-xl bg-black/20 p-4">Mijn station<div className="text-3xl font-black">{station(myParticipant.groep_code,currentRound)??"—"}</div></div><div className="rounded-xl bg-black/20 p-4">Ronde {currentRound} · {timer?.fase??"voorbereiding"}<div className="text-3xl font-black tabular-nums">{clockDisplay(currentSeconds)}</div></div></div>{myParticipant.geblesseerd&&<p className="mt-3 rounded-xl border border-amber-400/30 p-3 text-amber-100">Je bent als geblesseerd aangeduid. Vraag de leerkracht naar je scheidsrechter- of observatietaak.</p>}</section>{timer?.fase==="rotatie"&&<section className={panel}><h2 className="mb-3 text-xl font-black">Mijn observatieopdrachten</h2>{myAssignments.length===0?<p className="text-white/65">In deze ronde heb je geen digitale observatieopdracht.</p>:<div className="flex flex-wrap gap-2">{myAssignments.map(a=><button key={a.id} className={activeAssignment===a.id?primary:btn} onClick={()=>{setActiveAssignment(a.id);setSaveState("");}}>{a.type}: {assignmentNames[a.id]??pupilName(a.beoordeelde_id)} {a.status==="ingediend"?"✓":""}</button>)}</div>}{selectedAssignment&&selectedAssignment.ronde===currentRound&&<div className="mt-5"><h3 className="mb-3 text-lg font-black">{selectedAssignment.type} · {assignmentNames[selectedAssignment.id]??pupilName(selectedAssignment.beoordeelde_id)}</h3><RubricForm kind={selectedAssignment.type} values={draft} onChange={changePeer} locked={assignmentEvaluation?.status==="ingediend"}/><div className="mt-4 flex items-center gap-3"><button className={primary} disabled={assignmentEvaluation?.status==="ingediend"||RUBRICS[selectedAssignment.type].some(x=>!draft[x.key])} onClick={()=>{if(saveTimer.current)clearTimeout(saveTimer.current);void savePeer(draft,true);}}>Definitief indienen</button><span className="text-sm text-white/65">{saveState}</span></div></div>}</section>}{timer?.fase==="zelfevaluatie"&&<section className={panel}><h2 className="mb-3 text-xl font-black">Zelfevaluatie samenwerken</h2><RubricForm kind="samenwerken" values={selfDraft} onChange={changeSelf} locked={mySelf?.status==="ingediend"}/><div className="mt-4 flex items-center gap-3"><button className={primary} disabled={mySelf?.status==="ingediend"||!selfDraft.samenwerken} onClick={()=>{if(saveTimer.current)clearTimeout(saveTimer.current);void saveSelf(selfDraft,true);}}>Zelfevaluatie indienen</button><span className="text-sm text-white/65">{saveState}</span></div></section>}{timer?.fase==="afgerond"&&<section className={panel}>De Hockey-les is afgerond. Bedankt voor je inzet!</section>}</>}
   {!teacher&&uid&&!lesson&&<section className={panel}>Er is nog geen Hockey-les voor jouw account beschikbaar. Vraag je LO-leerkracht om je aan de les toe te voegen.</section>}
  </main>
 </AppShell>;
}
