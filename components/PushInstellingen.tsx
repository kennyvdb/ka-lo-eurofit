"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
function vapidKeyToBytes(value: string): Uint8Array<ArrayBuffer> {
 const key = value.trim().replace(/^["']|["']$/g, "");
 if (!/^[A-Za-z0-9_-]+={0,2}$/.test(key)) throw new Error("De publieke VAPID-sleutel bevat ongeldige tekens. Controleer NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel.");
 const base64 = key.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
 const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
 let raw: string;
 try { raw = atob(padded); } catch { throw new Error("De publieke VAPID-sleutel is ongeldig gecodeerd. Controleer de sleutel in Vercel."); }
 if (raw.length !== 65 || raw.charCodeAt(0) !== 4) throw new Error("De publieke VAPID-sleutel heeft niet het juiste formaat (65 bytes).");
 const bytes = new Uint8Array(new ArrayBuffer(raw.length));
 for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
 return bytes;
}
async function authHeaders(): Promise<Record<string, string>> {
 const { data: { session }, error } = await supabase.auth.getSession();
 if (error || !session?.access_token) throw new Error("Je aanmelding is verlopen. Meld je opnieuw aan in de LO App.");
 return { Authorization: `Bearer ${session.access_token}` };
}
export default function PushInstellingen() {
 const [active, setActive] = useState(false);
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 const [supported, setSupported] = useState(true);
 const [reason, setReason] = useState("");
 useEffect(() => {
  const check = async () => {
   if (!window.isSecureContext) { setSupported(false); setReason("Pushmeldingen vereisen een beveiligde HTTPS-verbinding."); return; }
   if (!("serviceWorker" in navigator)) { setSupported(false); setReason("Deze browser ondersteunt geen serviceworkers."); return; }
   if (!("PushManager" in window)) { setSupported(false); setReason("Deze browser ondersteunt geen webpush. Op iPhone moet je de website via het beginscherm openen."); return; }
   if (!("Notification" in window)) { setSupported(false); setReason("Deze browser biedt geen toegang tot meldingen."); return; }
   try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    const sub = await registration?.pushManager.getSubscription();
    if (!sub) return;
    const response = await fetch(`/api/lo-berichten/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) { const data = await response.json(); setActive(Boolean(data.active)); }
    else { const result = await response.json().catch(() => ({})); setMessage(`Pushinstellingen controleren mislukt (${response.status}): ${result.error || "Onbekende serverfout"}`); }
   } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "De huidige pushinstellingen konden niet worden gecontroleerd."); }
  };
  void check();
 }, []);
 async function toggle() {
  setBusy(true);
  setMessage("");
  try {
   if (!active) {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) throw new Error("Pushmeldingen zijn nog niet geconfigureerd.");
    const applicationServerKey = vapidKeyToBytes(vapid);
    const headers = await authHeaders();
    if (Notification.permission === "denied") throw new Error("Sta meldingen eerst toe in de browserinstellingen.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Je hebt geen toestemming gegeven voor meldingen.");
    const registration = await navigator.serviceWorker.register("/lo-push-sw.js", { scope: "/" });
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    const response = await fetch("/api/lo-berichten/push", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }) });
    if (!response.ok) {
     const result = await response.json().catch(() => ({}));
     await subscription.unsubscribe();
     throw new Error(`Opslaan mislukt (${response.status}): ${result.error || "Onbekende serverfout"}`);
    }
    setActive(true);
    setMessage("Pushmeldingen zijn ingeschakeld op dit toestel.");
   } else {
    const headers = await authHeaders();
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
     const response = await fetch("/api/lo-berichten/push", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsubscribe", endpoint: subscription.endpoint }) });
     if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(`Uitschakelen mislukt (${response.status}): ${result.error || "Onbekende serverfout"}`); }
     await subscription.unsubscribe();
    }
    setActive(false);
    setMessage("Pushmeldingen zijn uitgeschakeld op dit toestel.");
   }
  } catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Er is iets misgelopen."); }
  finally { setBusy(false); }
 }
 return <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black">Pushmeldingen</h2><p className="mt-1 text-sm text-white/60">Ontvang meldingen van de LO App op dit toestel. Berichten blijven altijd in je inbox.</p></div><button type="button" disabled={!supported || busy} onClick={() => void toggle()} aria-pressed={active} className={`rounded-xl px-4 py-2 font-black disabled:opacity-50 ${active ? "bg-emerald-600" : "bg-white/15"}`}>{busy ? "Even wachten…" : active ? "Aan" : "Uit"}</button></div>{!supported && <p className="mt-2 text-sm text-amber-200">{reason}</p>}{message && <p className="mt-2 text-sm text-amber-200">{message}</p>}</section>;
}
