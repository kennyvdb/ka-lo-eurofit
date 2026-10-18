"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
 const padding = "=".repeat((4 - value.length % 4) % 4);
 const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
 const bytes = new Uint8Array(new ArrayBuffer(raw.length));
 for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
 return bytes;
}
export default function PushInstellingen() {
 const [active, setActive] = useState(false);
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 const [supported, setSupported] = useState(true);
 useEffect(() => {
  const check = async () => {
   if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setSupported(false); return; }
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return;
   const registration = await navigator.serviceWorker.getRegistration("/");
   const sub = await registration?.pushManager.getSubscription();
   if (!sub) return;
   const response = await fetch(`/api/lo-berichten/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { cache: "no-store" });
   if (response.ok) { const data = await response.json(); setActive(Boolean(data.active)); }
  };
  void check();
 }, []);
 async function toggle() {
  setBusy(true);
  setMessage("");
  try {
   if (!active) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) throw new Error("Push is nog niet geconfigureerd.");
    if (Notification.permission === "denied") throw new Error("Sta meldingen eerst toe in de browserinstellingen.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Je hebt geen toestemming gegeven voor meldingen.");
    const registration = await navigator.serviceWorker.register("/lo-push-sw.js", { scope: "/" });
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) });
    const response = await fetch("/api/lo-berichten/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }) });
    if (!response.ok) { await subscription.unsubscribe(); throw new Error("Kon push niet inschakelen."); }
    setActive(true);
   } else {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
     const response = await fetch("/api/lo-berichten/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsubscribe", endpoint: subscription.endpoint }) });
     if (!response.ok) throw new Error("Kon push niet uitschakelen.");
     await subscription.unsubscribe();
    }
    setActive(false);
   }
  } catch (e: unknown) { setMessage(e instanceof Error ? e.message : "Er is iets misgelopen."); }
  finally { setBusy(false); }
 }
 return <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black">Pushmeldingen</h2><p className="mt-1 text-sm text-white/60">Ontvang meldingen van de LO App op dit toestel. Berichten blijven altijd in je inbox.</p></div><button type="button" disabled={!supported || busy} onClick={() => void toggle()} aria-pressed={active} className={`rounded-xl px-4 py-2 font-black disabled:opacity-50 ${active ? "bg-emerald-600" : "bg-white/15"}`}>{busy ? "Even wachten…" : active ? "Aan" : "Uit"}</button></div>{!supported ? <p className="mt-2 text-sm text-amber-200">Dit toestel ondersteunt geen webpush. Op iPhone: voeg de website toe aan je beginscherm en open de app van daaruit.</p> : null}{message ? <p className="mt-2 text-sm text-amber-200">{message}</p> : null}</section>;
}
