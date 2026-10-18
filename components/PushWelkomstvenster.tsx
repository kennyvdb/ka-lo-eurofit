"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
function vapidBytes(value: string): Uint8Array<ArrayBuffer> {
 const key = value.trim().replace(/^["']|["']$/g, "");
 if (!/^[A-Za-z0-9_-]+={0,2}$/.test(key)) throw new Error("Ongeldige publieke VAPID-sleutel.");
 const b64 = key.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
 const raw = atob(b64 + "=".repeat((4 - b64.length % 4) % 4));
 if (raw.length !== 65 || raw.charCodeAt(0) !== 4) throw new Error("Ongeldig formaat van de VAPID-sleutel.");
 const result = new Uint8Array(new ArrayBuffer(raw.length));
 for (let i = 0; i < raw.length; i++) result[i] = raw.charCodeAt(i);
 return result;
}
export default function PushWelkomstvenster() {
 const [visible, setVisible] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [storageKey, setStorageKey] = useState("");
 useEffect(() => {
  let cancelled = false;
  async function check() {
   if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || Notification.permission === "denied") return;
   const { data: { user } } = await supabase.auth.getUser();
   if (!user || cancelled) return;
   const key = `lo-push-vraag-v1:${user.id}`;
   if (localStorage.getItem(key) === "later") return;
   try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
     const { data: { session } } = await supabase.auth.getSession();
     if (!session?.access_token) return;
     const response = await fetch(`/api/lo-berichten/push?endpoint=${encodeURIComponent(subscription.endpoint)}`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
     if (!response.ok) return;
     const status = await response.json();
     if (status.active) return;
    }
    if (!cancelled) { setStorageKey(key); setVisible(true); }
   } catch { /* Bij netwerkfouten geen melding tonen. */ }
  }
  void check();
  return () => { cancelled = true; };
 }, []);
 function dismiss() {
  if (storageKey) localStorage.setItem(storageKey, "later");
  setVisible(false);
 }
 async function enable() {
  setBusy(true);
  setError("");
  try {
   const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
   if (!vapid) throw new Error("Pushmeldingen zijn nog niet geconfigureerd.");
   const key = vapidBytes(vapid);
   const { data: { session } } = await supabase.auth.getSession();
   if (!session?.access_token) throw new Error("Meld je opnieuw aan in de LO App.");
   const permission = await Notification.requestPermission();
   if (permission !== "granted") { dismiss(); return; }
   const registration = await navigator.serviceWorker.register("/lo-push-sw.js", { scope: "/" });
   const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
   const response = await fetch("/api/lo-berichten/push", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }) });
   if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Inschakelen mislukt (${response.status}).`);
   }
   setVisible(false);
  } catch (e: unknown) { setError(e instanceof Error ? e.message : "Inschakelen mislukt."); }
  finally { setBusy(false); }
 }
 if (!visible) return null;
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="push-vraag-titel"><div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-6 text-white shadow-2xl"><div className="mb-3 text-3xl">🔔</div><h2 id="push-vraag-titel" className="text-xl font-black">Meldingen van de LO App</h2><p className="mt-3 text-sm text-white/80">Wil je een melding ontvangen wanneer je LO-leerkracht je een bericht stuurt? Je kunt dit later altijd wijzigen bij Mijn berichten.</p>{error && <p className="mt-3 text-sm text-amber-200" role="alert">{error}</p>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void enable()} className="rounded-xl bg-sky-600 px-4 py-3 font-bold disabled:opacity-50">{busy ? "Even wachten…" : "Pushmeldingen inschakelen"}</button><button type="button" disabled={busy} onClick={dismiss} className="rounded-xl border border-white/20 px-4 py-3 font-bold disabled:opacity-50">Niet nu</button></div></div></div>;
}
