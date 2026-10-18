"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
type Message = { bericht_id: string; gelezen_op: string | null; lo_berichten: { onderwerp: string; inhoud: string; link: string | null; aangemaakt_op: string } | null };
export default function BerichtenPage() {
 const [rows, setRows] = useState<Message[]>([]);
 const [error, setError] = useState("");
 useEffect(() => { void load(); }, []);
 async function load() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setError("Log eerst in."); return; }
  const { data, error: e } = await supabase.from("lo_bericht_ontvangers").select("bericht_id, gelezen_op, lo_berichten(onderwerp, inhoud, link, aangemaakt_op)").eq("gebruiker_id", user.id).order("bericht_id", { ascending: false }).limit(200);
  if (e) setError(e.message); else setRows((data ?? []) as unknown as Message[]);
 }
 async function markRead(id: string) {
  const { error: e } = await supabase.from("lo_bericht_ontvangers").update({ gelezen_op: new Date().toISOString() }).eq("bericht_id", id);
  if (e) setError(e.message); else setRows(p => p.map(x => x.bericht_id === id ? { ...x, gelezen_op: new Date().toISOString() } : x));
 }
 return <AppShell title="LO App" subtitle="Mijn berichten"><div className="mx-auto max-w-3xl space-y-3"><h1 className="text-2xl font-black text-white">Mijn berichten</h1>{error && <p className="text-red-200">{error}</p>}{rows.length === 0 && <p className="text-white/60">Geen berichten.</p>}{rows.map(row => <article key={row.bericht_id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"><div className="flex items-start justify-between gap-3"><h2 className="font-black">{row.lo_berichten?.onderwerp ?? "Bericht"}</h2>{!row.gelezen_op && <span className="rounded-full bg-sky-500/20 px-2 py-1 text-xs">Nieuw</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm">{row.lo_berichten?.inhoud}</p><div className="mt-3 flex gap-3">{row.lo_berichten?.link?.startsWith("/") && !row.lo_berichten.link.startsWith("//") && <Link href={row.lo_berichten.link} className="text-sm font-bold text-sky-200">Open link →</Link>}{!row.gelezen_op && <button onClick={() => void markRead(row.bericht_id)} className="text-sm font-bold text-emerald-200">Markeer gelezen</button>}</div></article>)}</div></AppShell>;
}
