"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PushInstellingen from "@/components/PushInstellingen";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
type Message = { bericht_id: string; gelezen_op: string | null; lo_berichten: { onderwerp: string; inhoud: string; link: string | null; aangemaakt_op: string } | null };
export default function BerichtenPage() {
 const [rows, setRows] = useState<Message[]>([]);
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(true);
 useEffect(() => { void load(); }, []);
 async function load() {
  setLoading(true);
  setError("");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setError("Log eerst in."); setLoading(false); return; }
  const { data, error: e } = await supabase.from("lo_bericht_ontvangers").select("bericht_id, gelezen_op, lo_berichten(onderwerp, inhoud, link, aangemaakt_op)").eq("gebruiker_id", user.id).limit(1000);
  if (e) setError(e.message);
  else setRows(((data ?? []) as unknown as Message[]).sort((a, b) => (b.lo_berichten?.aangemaakt_op ?? "").localeCompare(a.lo_berichten?.aangemaakt_op ?? "")).slice(0, 200));
  setLoading(false);
 }
 async function markRead(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setError("Log eerst in."); return; }
  const now = new Date().toISOString();
  const { error: e } = await supabase.from("lo_bericht_ontvangers").update({ gelezen_op: now }).eq("bericht_id", id).eq("gebruiker_id", user.id);
  if (e) setError(e.message);
  else setRows(p => p.map(x => x.bericht_id === id ? { ...x, gelezen_op: now } : x));
 }
 return (
  <AppShell title="LO App" subtitle="Mijn berichten">
   <div className="mx-auto max-w-3xl space-y-3">
    <h1 className="text-2xl font-black text-white">Mijn berichten</h1>
    <PushInstellingen />
    {error && <p className="text-red-200">{error}</p>}
    {loading ? <p className="text-white/60">Laden…</p> : !error && rows.length === 0 ? <p className="text-white/60">Geen berichten.</p> : null}
    {rows.map(row => (
     <article key={row.bericht_id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
       <h2 className="font-black">{row.lo_berichten?.onderwerp ?? "Bericht"}</h2>
       {!row.gelezen_op && <span className="rounded-full bg-sky-500/20 px-2 py-1 text-xs">Nieuw</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{row.lo_berichten?.inhoud}</p>
      <div className="mt-3 flex gap-3">
       {row.lo_berichten?.link?.startsWith("/") && !row.lo_berichten.link.startsWith("//") && !row.lo_berichten.link.includes("\\") && <Link href={row.lo_berichten.link} className="text-sm font-bold text-sky-200">Open link →</Link>}
       {!row.gelezen_op && <button onClick={() => void markRead(row.bericht_id)} className="text-sm font-bold text-emerald-200">Markeer gelezen</button>}
      </div>
     </article>
    ))}
   </div>
  </AppShell>
 );
}
