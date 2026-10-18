import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdmin } from "@supabase/supabase-js";
export async function POST(req: NextRequest) {
 const jar = await cookies();
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !anon || !secret) return NextResponse.json({ error: "Configuratie ontbreekt" }, { status: 500 });
 const client = createServerClient(url, anon, { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
 const { data: { user } } = await client.auth.getUser();
 if (!user) return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
 const body = await req.json();
 const admin = createAdmin(url, secret, { auth: { persistSession: false } });
 if (body.action === "subscribe") {
  const s = body.subscription;
  if (!s || typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://") || !s.keys || typeof s.keys.p256dh !== "string" || typeof s.keys.auth !== "string" || s.endpoint.length > 2048) return NextResponse.json({ error: "Ongeldig abonnement" }, { status: 400 });
  const { data: existing } = await admin.from("lo_push_abonnementen").select("gebruiker_id").eq("endpoint", s.endpoint).maybeSingle();
  if (existing && existing.gebruiker_id !== user.id) return NextResponse.json({ error: "Abonnement hoort bij een ander account" }, { status: 409 });
  const { error } = await admin.from("lo_push_abonnementen").upsert({ gebruiker_id: user.id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth_secret: s.keys.auth }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  return NextResponse.json({ ok: true });
 }
 if (body.action === "unsubscribe") {
  if (typeof body.endpoint !== "string") return NextResponse.json({ error: "Ongeldig endpoint" }, { status: 400 });
  const { error } = await admin.from("lo_push_abonnementen").delete().eq("gebruiker_id", user.id).eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: "Uitschakelen mislukt" }, { status: 500 });
  return NextResponse.json({ ok: true });
 }
 return NextResponse.json({ error: "Onbekende actie" }, { status: 400 });
}
