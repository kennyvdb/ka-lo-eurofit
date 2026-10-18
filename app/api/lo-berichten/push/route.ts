import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export const runtime = "nodejs";
async function context(req: NextRequest) {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !anon || !secret) return null;
 const jar = await cookies();
 const client = createServerClient(url, anon, { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
 const authorization = req.headers.get("authorization") || "";
 const token = /^Bearer ([^\s]+)$/.exec(authorization)?.[1];
 const { data: { user } } = token ? await client.auth.getUser(token) : await client.auth.getUser();
 return { user, admin: createAdmin(url, secret, { auth: { persistSession: false } }) };
}
export async function GET(req: NextRequest) {
 const ctx = await context(req);
 if (!ctx) return NextResponse.json({ error: "Configuratie ontbreekt" }, { status: 500 });
 if (!ctx.user) return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
 const endpoint = req.nextUrl.searchParams.get("endpoint");
 if (!endpoint || endpoint.length > 2048) return NextResponse.json({ error: "Ongeldig endpoint" }, { status: 400 });
 const { data, error } = await ctx.admin.from("lo_push_abonnementen").select("id").eq("gebruiker_id", ctx.user.id).eq("endpoint", endpoint).maybeSingle();
 if (error) return NextResponse.json({ error: "Controleren mislukt" }, { status: 500 });
 return NextResponse.json({ active: Boolean(data) });
}
export async function POST(req: NextRequest) {
 try {
  if (Number(req.headers.get("content-length") || 0) > 10000) return NextResponse.json({ error: "Aanvraag te groot" }, { status: 413 });
  const ctx = await context(req);
  if (!ctx) return NextResponse.json({ error: "Configuratie ontbreekt" }, { status: 500 });
  if (!ctx.user) return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
  const body = await req.json();
  if (body.action === "subscribe") {
   const s = body.subscription;
   if (!s || typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://") || s.endpoint.length > 2048 || !s.keys || typeof s.keys.p256dh !== "string" || !/^[A-Za-z0-9_-]{50,200}$/.test(s.keys.p256dh) || typeof s.keys.auth !== "string" || !/^[A-Za-z0-9_-]{12,100}$/.test(s.keys.auth)) return NextResponse.json({ error: "Ongeldig abonnement" }, { status: 400 });
   const { data: existing, error: checkError } = await ctx.admin.from("lo_push_abonnementen").select("gebruiker_id").eq("endpoint", s.endpoint).maybeSingle();
   if (checkError) throw checkError;
   if (existing && existing.gebruiker_id !== ctx.user.id) return NextResponse.json({ error: "Abonnement hoort bij een ander account" }, { status: 409 });
   const { error } = await ctx.admin.from("lo_push_abonnementen").upsert({ gebruiker_id: ctx.user.id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth_secret: s.keys.auth }, { onConflict: "endpoint" });
   if (error) throw error;
   return NextResponse.json({ ok: true });
  }
  if (body.action === "unsubscribe") {
   if (typeof body.endpoint !== "string" || body.endpoint.length > 2048) return NextResponse.json({ error: "Ongeldig endpoint" }, { status: 400 });
   const { error } = await ctx.admin.from("lo_push_abonnementen").delete().eq("gebruiker_id", ctx.user.id).eq("endpoint", body.endpoint);
   if (error) throw error;
   return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Onbekende actie" }, { status: 400 });
 } catch (e) {
  console.error("LO push:", e);
  return NextResponse.json({ error: "Pushverwerking mislukt" }, { status: 500 });
 }
}
