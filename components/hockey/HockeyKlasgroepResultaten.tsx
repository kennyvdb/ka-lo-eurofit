"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
type Row = Record<string, any>;
type Props = { schooljaar: string; leden: { leerling_email: string; volledige_naam: string; positie: number; klas_naam: string }[] };
const types = ["techniek", "wedstrijd", "samenwerken"] as const;
const levels = ["−", "+/−", "+", "++"];
function avg(items: number[]) { return items.length ? items.reduce((a,b)=>a+b,0)/items.length : null; }
export default function HockeyKlasgroepResultaten({schooljaar,leden}:Props) {
 const [lessons,setLessons]=useState<Row[]>([]);const [lessonId,setLessonId]=useState("");
 const [participants,setParticipants]=useState<Row[]>([]);const [evaluations,setEvaluations]=useState<Row[]>([]);
 const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [expanded,setExpanded]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{try{const {data,error}=await supabase.from("hockey_lessen").select("id,naam,lesdatum,leerjaar,status").eq("schooljaar",schooljaar).order("lesdatum",{ascending:false}).limit(100);if(error)throw error;if(alive)setLessons(data??[]);}catch(e){if(alive)setError((e as Error).message);}})();return()=>{alive=false;};},[schooljaar]);
 useEffect(()=>{if(!lessonId){setParticipants([]);setEvaluations([]);return;}let alive=true;setLoading(true);(async()=>{try{const [p,e]=await Promise.all([supabase.from("hockey_deelnemers").select("id,leerling_email,volledige_naam").eq("les_id",lessonId),supabase.from("hockey_evaluaties").select("beoordeelde_id,type,rubrics,status").eq("les_id",lessonId)]);if(p.error)throw p.error;if(e.error)throw e.error;if(alive){setParticipants(p.data??[]);setEvaluations(e.data??[]);}}catch(e){if(alive)setError((e as Error).message);}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};},[lessonId]);
 const matrix=useMemo(()=>leden.slice().sort((a,b)=>a.positie-b.positie).map(l=>{const participant=participants.find(p=>p.leerling_email===l.leerling_email.toLowerCase());const scores=types.map(type=>{const values=evaluations.filter(e=>e.beoordeelde_id===participant?.id&&e.type===type&&e.status==="ingediend").flatMap(e=>Object.values(e.rubrics??{}).map(Number).filter(n=>n>=1&&n<=4));return avg(values);});return {l,scores};}),[leden,participants,evaluations]);
 return <section className="mt-5 rounded-3xl border border-white/15 bg-black/20 p-4 text-white">
  <button className="flex w-full items-center justify-between gap-3 text-left" onClick={()=>setExpanded(x=>!x)}><span className="text-lg font-black">🏑 Hockey-evaluaties</span><span className="text-sm text-[#89C2AA]">{expanded?"Sluiten ↑":"Openen ↓"}</span></button>
  {expanded&&<><p className="mt-2 text-sm text-white/60">Leerlingen volgen de opgeslagen klasgroepvolgorde. Scores zijn gemiddelden van ingediende rubrics op een schaal van 1 tot 4.</p><div className="mt-3 flex flex-wrap items-center gap-3"><select className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#14212d] p-3 text-white" value={lessonId} onChange={e=>setLessonId(e.target.value)}><option value="">Kies Hockey-les</option>{lessons.map(l=><option key={l.id} value={l.id}>{l.lesdatum} · {l.naam} ({l.status})</option>)}</select><Link href="/les-lo/evaluaties/hockey" className="rounded-xl border border-[#89C2AA]/40 px-3 py-2 text-sm font-bold text-[#89C2AA]">Open Hockey →</Link></div>
  {error&&<p className="mt-2 text-red-200">{error}</p>}{loading&&<p className="mt-2 text-white/60">Resultaten laden...</p>}
  {lessonId&&!loading&&<div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-white/20"><th className="p-2">Leerling</th>{types.map(t=><th key={t} className="p-2 capitalize">{t}</th>)}</tr></thead><tbody>{matrix.map(({l,scores})=><tr key={l.leerling_email} className="border-b border-white/10"><td className="p-2"><strong>{l.volledige_naam}</strong><small className="block text-white/55">{l.klas_naam}</small></td>{scores.map((v,i)=><td key={i} className="p-2"><span className={`inline-block min-w-14 rounded-lg p-2 text-center font-bold ${v===null?"bg-white/10 text-white/50":v<1.75?"bg-red-500/30":v<2.5?"bg-amber-500/30":v<3.25?"bg-teal-500/30":"bg-emerald-500/30"}`}>{v===null?"—":`${v.toFixed(2)} (${levels[Math.max(0,Math.min(3,Math.round(v)-1))]})`}</span></td>)}</tr>)}</tbody></table></div>}</>}
 </section>;
}
