import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import webpush from "web-push";
import { allowedRoles, teacherRoles, validInternalLink, type Audience } from "@/lib/lo-messaging";
export const runtime = "nodejs";
const audiences: Audience[] = ["alle_leerlingen", "alle_leerkrachten", "iedereen", "lo_team", "klasgroepen", "klassen", "personen"];
export async function POST(req: NextRequest) {
 try {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !secret) return NextResponse.json({ error: "Serverconfiguratie ontbreekt" }, { status: 500 });
  const supabase = createServerClient(url, anon, { cookies: { getAll: () => jar.getAll(), setAll: () => {} } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
  const admin = createAdmin(url, secret, { auth: { persistSession: false } });
  const { data: sender } = await admin.from("profielen").select("rol").eq("id", user.id).single();
  if (!allowedRoles.includes(String(sender?.rol))) return NextResponse.json({ error: "Geen verzendrechten" }, { status: 403 });
  const body = await req.json();
  const onderwerp = String(body.onderwerp ?? "").trim();
  const inhoud = String(body.inhoud ?? "").trim();
  const doelgroep = String(body.doelgroep ?? "") as Audience;
  const link = String(body.link ?? "").trim();
  const selection = Array.isArray(body.selectie) ? body.selectie.filter((v: unknown) => typeof v === "string").slice(0, 100) : [];
  if (!audiences.includes(doelgroep) || !onderwerp || onderwerp.length > 120 || !inhoud || inhoud.length > 2000 || !validInternalLink(link)) return NextResponse.json({ error: "Ongeldig bericht" }, { status: 400 });
  if (["klasgroepen", "klassen", "personen"].includes(doelgroep) && !selection.length) return NextResponse.json({ error: "Geen ontvangers geselecteerd" }, { status: 400 });
  if (["alle_leerlingen", "alle_leerkrachten", "iedereen"].includes(doelgroep) && body.bevestigSchoolbreed !== true) return NextResponse.json({ error: "Schoolbrede verzending moet bevestigd worden" }, { status: 400 });
  const { data: profiles, error: profileError } = await admin.from("profielen").select("id, email, rol, klas_naam").limit(10000);
  if (profileError) throw profileError;
  if ((profiles ?? []).length === 10000) return NextResponse.json({ error: "Te veel profielen voor één verzending; paginering nodig" }, { status: 409 });
  const ids = new Set<string>();
  if (doelgroep === "alle_leerlingen" || doelgroep === "iedereen") for (const p of profiles ?? []) if (p.rol === "leerling") ids.add(p.id);
  if (doelgroep === "alle_leerkrachten" || doelgroep === "iedereen") for (const p of profiles ?? []) if (teacherRoles.includes(p.rol)) ids.add(p.id);
  if (doelgroep === "lo_team") for (const p of profiles ?? []) if (allowedRoles.includes(p.rol)) ids.add(p.id);
  if (doelgroep === "klassen") for (const p of profiles ?? []) if (p.rol === "leerling" && selection.includes(p.klas_naam)) ids.add(p.id);
  if (doelgroep === "personen") for (const p of profiles ?? []) if (selection.includes(p.id)) ids.add(p.id);
  if (doelgroep === "klasgroepen") {
   const { data: groups, error: ge } = await admin.from("lo_klasgroepen").select("id").in("id", selection).eq("leerkracht_id", user.id);
   if (ge) throw ge;
   if ((groups ?? []).length !== new Set(selection).size) return NextResponse.json({ error: "Je kunt alleen eigen klasgroepen selecteren" }, { status: 403 });
   const { data: members, error: me } = await admin.from("lo_klasgroep_leden_view").select("leerling_email, klasgroep_id").in("klasgroep_id", selection).limit(10000);
   if (me) throw me;
   const emails = new Set((members ?? []).map(m => String(m.leerling_email ?? "").toLowerCase()));
   for (const p of profiles ?? []) if (p.rol === "leerling" && emails.has(String(p.email ?? "").toLowerCase())) ids.add(p.id);
  }
  if (!ids.size) return NextResponse.json({ error: "Geen ontvangers gevonden" }, { status: 400 });
  const { data: msg, error: msgError } = await admin.from("lo_berichten").insert({ afzender_id: user.id, onderwerp, inhoud, doelgroep, link: link || null }).select("id").single();
  if (msgError) throw msgError;
  const recipients = [...ids];
  for (let i = 0; i < recipients.length; i += 250) {
   const { error } = await admin.from("lo_bericht_ontvangers").insert(recipients.slice(i, i + 250).map(gebruiker_id => ({ bericht_id: msg.id, gebruiker_id })));
   if (error) throw error;
  }
  let pushes = 0;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
   webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
   for (let i = 0; i < recipients.length; i += 100) {
    const { data: subscriptions } = await admin.from("lo_push_abonnementen").select("id, endpoint, p256dh, auth_secret").in("gebruiker_id", recipients.slice(i, i + 100));
    for (const sub of subscriptions ?? []) {
     try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_secret } }, JSON.stringify({ title: "Nieuw bericht in de LO App", body: "Je hebt een nieuw bericht ontvangen.", url: "/berichten" }), { TTL: 86400 });
      pushes++;
     } catch (e: unknown) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await admin.from("lo_push_abonnementen").delete().eq("id", sub.id);
     }
    }
   }
  }
  return NextResponse.json({ ok: true, bericht_id: msg.id, ontvangers: recipients.length, push_verzonden: pushes });
 } catch (e: unknown) {
  console.error("LO bericht verzenden:", e);
  return NextResponse.json({ error: "Verzenden mislukt" }, { status: 500 });
 }
}
