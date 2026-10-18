
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
export const maxDuration = 60;
type Job = { id: string; bericht_id: string; abonnement_id: string; pogingen: number };
type Subscription = { id: string; endpoint: string; p256dh: string; auth_secret: string };
type Resultaat = "verzonden" | "opnieuw" | "mislukt";
function authorized(req: NextRequest, secret: string): boolean {
 const header = req.headers.get("authorization") ?? "";
 const provided = header.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
 const a = Buffer.from(provided);
 const b = Buffer.from(secret);
 return a.length === b.length && timingSafeEqual(a, b);
}
function foutmelding(error: unknown): string {
 if (error instanceof Error) return error.message.slice(0, 500);
 return "Onbekende fout";
}
function httpStatus(error: unknown): number | null {
 if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
 const status = (error as { statusCode?: unknown }).statusCode;
 return typeof status === "number" ? status : null;
}
export async function GET(req: NextRequest) {
 const secret = process.env.CRON_SECRET;
 if (!secret || !authorized(req, secret)) {
  return NextResponse.json({ error: "Geen toegang" }, { status: 401 });
 }
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const publicKey = process.env.VAPID_PUBLIC_KEY;
 const privateKey = process.env.VAPID_PRIVATE_KEY;
 const subject = process.env.VAPID_SUBJECT;
 if (!url || !key || !publicKey || !privateKey || !subject) {
  return NextResponse.json({ error: "Serverconfiguratie ontbreekt" }, { status: 500 });
 }
 try {
  const admin = createClient(url, key, {
   auth: { persistSession: false, autoRefreshToken: false }
  });
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const { data, error } = await admin.rpc("lo_push_claim_batch", { p_limit: 8 });
  if (error) {
   console.error("Pushwachtrij claimen mislukt:", error.message);
   return NextResponse.json({ error: "Wachtrij ophalen mislukt" }, { status: 500 });
  }
  const jobs = (data ?? []) as Job[];
  let verzonden = 0;
  let mislukt = 0;
  let opnieuw = 0;
  let verwijderd = 0;
  let afhandelFouten = 0;
  for (const job of jobs) {
   let resultaat: Resultaat = "opnieuw";
   let fout: string | null = null;
   let ongeldigAbonnement = false;
   try {
    const { data: sub, error: subError } = await admin
     .from("lo_push_abonnementen")
     .select("id,endpoint,p256dh,auth_secret")
     .eq("id", job.abonnement_id)
     .maybeSingle();
    if (subError) throw subError;
    if (!sub) {
     resultaat = "mislukt";
     fout = "Pushabonnement niet gevonden";
    } else {
     const subscription = sub as Subscription;
     await webpush.sendNotification(
      {
       endpoint: subscription.endpoint,
       keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_secret
       }
      },
      JSON.stringify({
       title: "Nieuw bericht in de LO App",
       body: "Je hebt een nieuw bericht ontvangen.",
       url: "/berichten"
      }),
      { TTL: 86400, timeout: 5000 }
     );
     resultaat = "verzonden";
    }
   } catch (error: unknown) {
    const status = httpStatus(error);
    fout = foutmelding(error);
    if (status === 404 || status === 410) {
     resultaat = "mislukt";
     ongeldigAbonnement = true;
    } else if ([400, 401, 403, 413].includes(status ?? 0)) {
     resultaat = "mislukt";
    } else {
     resultaat = "opnieuw";
    }
   }
   const { data: completed, error: completeError } = await admin.rpc("lo_push_voltooi", {
    p_id: job.id,
    p_pogingen: job.pogingen,
    p_resultaat: resultaat,
    p_fout: fout
   });
   if (completeError || completed !== true) {
    afhandelFouten++;
    console.error("Pushopdracht afronden mislukt:", job.id, completeError?.message ?? "Vergrendeling verlopen");
    continue;
   }
   if (resultaat === "verzonden") {
    verzonden++;
   } else if (resultaat === "mislukt" || job.pogingen >= 5) {
    mislukt++;
   } else {
    opnieuw++;
   }
   if (ongeldigAbonnement) {
    const { error: deleteError } = await admin
     .from("lo_push_abonnementen")
     .delete()
     .eq("id", job.abonnement_id);
    if (deleteError) {
     console.error("Ongeldig pushabonnement verwijderen mislukt:", job.abonnement_id, deleteError.message);
     afhandelFouten++;
    } else {
     verwijderd++;
    }
   }
  }
  return NextResponse.json({
   verwerkt: jobs.length,
   verzonden,
   mislukt,
   opnieuw,
   verwijderde_abonnementen: verwijderd,
   afhandelFouten
  });
 } catch (error: unknown) {
  console.error("Pushverwerking mislukt:", foutmelding(error));
  return NextResponse.json({ error: "Pushverwerking mislukt" }, { status: 500 });
 }
}
