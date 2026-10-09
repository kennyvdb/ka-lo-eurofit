"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const MAS_SLUG = "mas_test"; // Controleer de slug in sportfolio_disciplines vóór gebruik.
const panel: React.CSSProperties = { padding: 18, borderRadius: 18, border: "1px solid rgba(137,194,170,.24)", background: "linear-gradient(180deg,rgba(37,89,113,.34),rgba(19,35,51,.96))", color: "#eaf0ff", marginBottom: 14 };
const control: React.CSSProperties = { width: "100%", minHeight: 48, padding: "10px 14px", borderRadius: 14, border: "1px solid rgba(137,194,170,.35)", background: "#255971", color: "#fff", boxSizing: "border-box" };
const btn: React.CSSProperties = { minHeight: 48, padding: "10px 14px", borderRadius: 14, border: "1px solid rgba(137,194,170,.35)", background: "linear-gradient(90deg,#255971,#4B8E8D)", color: "#fff", fontWeight: 850, cursor: "pointer" };
const danger: React.CSSProperties = { ...btn, background: "#71394b", borderColor: "rgba(255,255,255,.2)" };
type Pupil = { id: string; email: string | null; volledige_naam: string | null; klas_naam: string | null; schooljaar: string | null; leerjaar: string | number | null; graad: string | number | null; geslacht: string | null };
type Group = { id: string; naam: string; schooljaar: string };
type SchoolRow = Record<string, unknown>;
type SchoolStudent = { leerling_email: string; volledige_naam: string; klas_naam: string; group_id?: string | null };
type AttendanceStatus = "deelneemt" | "afwezig" | "geblesseerd";
type Score = { id: string; leerling_id: string; discipline_id: string; schooljaar: string | null; klas_naam: string | null; score_nummer: number | null; score_tekst: string | null; status: string; bevestigd_op: string | null; extra_data: Record<string, unknown> | null };
type Draft = { id: string; leerling_id: string; leerling_email?: string; leerling_naam?: string; value: string; testdatum: string; schooljaar?: string | null; klas_naam?: string | null; distance_m?: number; duration_s?: number; completed_speed?: number; reached_speed?: number; markers?: number };
type MasEvent = { time_s: number; type: "stage" | "marker"; speed: number; distance_m: number };
type MasTiming = { protocol: string; duration_s: number; countdown_s: number; events: MasEvent[] };
const AUDIO_URL = "/mas-test/alleen-beeps-tempowissel-v5.mp3";
const TIMING_URL = "/mas-test/timing-tempowissel-v5.json";
const DRAFT_KEY = "lo-mas-drafts-v1";
const MAS_DB = "lo-mas-test-v2";
const MAS_STORE = "data";
function masDb(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const r = indexedDB.open(MAS_DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(MAS_STORE)) r.result.createObjectStore(MAS_STORE); }; r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
async function masGet<T>(key: string): Promise<T | undefined> { const db = await masDb(); try { return await new Promise((resolve,reject) => { const tx=db.transaction(MAS_STORE,"readonly"); const r=tx.objectStore(MAS_STORE).get(key); r.onsuccess=()=>resolve(r.result as T | undefined); r.onerror=()=>reject(r.error); }); } finally { db.close(); } }
async function masPut(key: string, value: unknown): Promise<void> { const db = await masDb(); try { await new Promise<void>((resolve,reject) => { const tx=db.transaction(MAS_STORE,"readwrite"); tx.objectStore(MAS_STORE).put(value,key); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); }); } finally { db.close(); } }
let masWriteQueue: Promise<unknown> = Promise.resolve();
function masUpdateDrafts(change: (rows: Draft[]) => Draft[]): Promise<Draft[]> { const operation=masWriteQueue.then(async()=>{ const old=(await masGet<Draft[]>("drafts")) ?? []; const next=change(old); await masPut("drafts",next); return next; }); masWriteQueue=operation.catch(()=>undefined); return operation; }
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const today = () => new Date().toLocaleDateString("sv-SE");
const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString("nl-BE") : "—";
const errText = (e: unknown) => e && typeof e === "object" && "message" in e ? String(e.message) : String(e);
const validMas = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 && n <= 35 ? n : null; };
const currentSchoolYear = (date = new Date()) => { const y=date.getFullYear(); const start=date.getMonth()>=8?y:y-1; return `${start}-${start+1}`; };
const MAS_BY_50M = [6.00,6.12,6.24,6.33,6.48,7.00,7.19,7.38,7.56,7.75,8.00,8.17,8.33,8.50,8.67,8.83,9.00,9.15,9.30,9.45,9.60,9.75,9.90,10.00,10.14,10.27,10.41,10.55,10.68,10.82,10.95,11.00,11.13,11.25,11.38,11.50,11.63,11.75,11.88,12.00,12.12,12.23,12.35,12.46,12.58,12.69,12.81,12.92,13.00,13.11,13.21,13.32,13.43,13.54,13.64,13.75,13.86,13.96,14.00,14.10,14.20,14.30,14.40,14.50,14.60,14.70,14.80,14.90,15.00,15.09,15.19,15.28,15.38,15.47,15.56,15.66,15.75,15.84,15.94,16.00,16.09,16.18,16.26,16.35,16.44,16.53,16.62,16.71,16.79,16.88,16.97,17.00,17.08,17.17,17.25,17.33,17.42,17.50,17.58,17.67,17.75,17.83,17.92,18.00,18.08,18.16,18.24,18.32,18.39,18.47,18.55,18.63,18.71,18.79,18.87,18.95,19.00,19.08,19.15,19.23,19.30,19.38,19.45,19.53,19.60,19.68,19.75,19.83,19.90,19.98,20.00] as const;
const masForDistance = (distanceM: number) => { const index=Math.floor(distanceM/50)-1; return index>=0 && index<MAS_BY_50M.length ? MAS_BY_50M[index] : null; };
export default function MasTestPage() {
  const [teacherId, setTeacherId] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [schoolStudents, setSchoolStudents] = useState<SchoolStudent[]>([]);
  const [participantClass, setParticipantClass] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolError, setSchoolError] = useState("");
  const [scores, setScores] = useState<Score[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState<"invoer" | "controle" | "historiek" | "klassen">("invoer");
  const [historyClass, setHistoryClass] = useState("");
  const [historyGroup, setHistoryGroup] = useState("");
  const [historyGroupIds, setHistoryGroupIds] = useState<string[]>([]);
  const schoolYear = currentSchoolYear();
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [timing, setTiming] = useState<MasTiming | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [stopped, setStopped] = useState<string[]>([]);
  const [liveDate, setLiveDate] = useState(today());
  const livePanelRef = useRef<HTMLDivElement | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const playerUrl = useRef<string | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const testStartPerf = useRef<number | null>(null);
  const lastOfficialElapsed = useRef(0);
  const lastAudioSyncPerf = useRef(0);
  const stopLock = useRef<Set<string>>(new Set());
  const sessionClosingRef = useRef(false);
  const [showLive, setShowLive] = useState(true);
  useEffect(() => { if (running) livePanelRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, [running]);
  const profileWarning = (p: Pupil | undefined) => p?.id.startsWith("email:") ? <span title="Geen gekoppeld leerlingprofiel: MAS kan voorlopig bewaard worden, maar nog niet naar Sportfolio gepubliceerd." aria-label="Geen gekoppeld leerlingprofiel" style={{color:"#ffd166",fontWeight:900,marginLeft:6}} role="img">⚠</span> : null;
  useEffect(() => {
    let cancelled=false;
    (async()=>{ try {
      let saved=await masGet<Draft[]>("drafts");
      if (!saved) { const old=localStorage.getItem(DRAFT_KEY); saved=old ? JSON.parse(old) as Draft[] : []; await masPut("drafts",saved); }
      if (!cancelled) { setDrafts(saved); setDraftsLoaded(true); }
    } catch(e) { if (!cancelled) setError(`Voorlopige scores laden mislukt: ${errText(e)}. Start geen test voordat dit is opgelost.`); } })();
    const updateOnline=()=>setOnline(navigator.onLine); updateOnline();
    window.addEventListener("online",updateOnline); window.addEventListener("offline",updateOnline);
    return ()=>{cancelled=true;window.removeEventListener("online",updateOnline);window.removeEventListener("offline",updateOnline);};
  }, []);
  const persistDrafts = async (change: (rows: Draft[]) => Draft[]) => { const rows=await masUpdateDrafts(change); setDrafts(rows); return rows; };
  useEffect(() => () => { player.current?.pause(); if (ticker.current) clearInterval(ticker.current); testStartPerf.current=null; if (playerUrl.current) URL.revokeObjectURL(playerUrl.current); }, []);
  useEffect(() => { let cancelled=false; (async()=>{ try { const cache=await caches.open("lo-mas-test-audio-tempowissel-v5"); const [a,t]=await Promise.all([cache.match(AUDIO_URL),cache.match(TIMING_URL)]); if (!a || !t) return; const data=await t.json() as MasTiming; if (!cancelled && data.protocol==="leger_boucher_50m_workbook_cumulative" && data.events?.length) { setTiming(data);setAudioReady(true); } } catch { /* Audio kan opnieuw voorbereid worden. */ } })(); return ()=>{cancelled=true;}; }, []);
  async function prepareAudio() {
    setPreparing(true); setError("");
    try {
      if (!("caches" in window)) throw new Error("Deze browser ondersteunt geen offline audio-opslag.");
      const cache = await caches.open("lo-mas-test-audio-tempowissel-v5");
      for (const url of [AUDIO_URL, TIMING_URL]) {
        if (await cache.match(url)) continue;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url} ontbreekt. Plaats de MP3 en timing.json in public/mas-test/.`);
        await cache.put(url, response);
      }
      const data = await (await cache.match(TIMING_URL))!.json() as MasTiming;
      if (!data.events?.length || data.protocol !== "leger_boucher_50m_workbook_cumulative") throw new Error("Timingbestand heeft een ander testprotocol.");
      setTiming(data); setAudioReady(true); setMessage("MP3 en timing zijn lokaal opgeslagen. Test het geluid vóór de les.");
    } catch (e) { setAudioReady(false); setError(errText(e)); }
    finally { setPreparing(false); }
  }
  const officialElapsedNow = () => testStartPerf.current === null ? lastOfficialElapsed.current : Math.max(0,(performance.now()-testStartPerf.current)/1000);
  async function startLive() {
    if (!draftsLoaded || !teacherId || !audioReady || !timing || !participants.some(id => (attendance[id] ?? "deelneemt") === "deelneemt") || running) { setError("Bereid de audio voor en kies minstens één deelnemende leerling."); return; }
    try {
      const response = await (await caches.open("lo-mas-test-audio-tempowissel-v5")).match(AUDIO_URL);
      if (!response) throw new Error("Offline MP3 niet gevonden.");
      if (playerUrl.current) URL.revokeObjectURL(playerUrl.current);
    const url = URL.createObjectURL(await response.blob()); playerUrl.current = url;
    const a = new Audio(url); player.current = a; a.preload = "auto"; a.defaultPlaybackRate = 1; a.playbackRate = 1;
    a.onended = () => { void stopAllLive(); };
    a.onerror = () => { void stopAllLive(); setError("Audio onderbroken. Controleer de voorlopige scores."); };
    await a.play();
    testStartPerf.current = performance.now() - a.currentTime * 1000;
    lastOfficialElapsed.current = a.currentTime;
    lastAudioSyncPerf.current = 0;
    setElapsed(a.currentTime); setStopped([]); stopLock.current.clear(); sessionClosingRef.current = false; setRunning(true);
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = setInterval(() => {
      if (testStartPerf.current === null) return;
      const official = officialElapsedNow();
      lastOfficialElapsed.current = official;
      setElapsed(official);
      if (!a.paused && a.readyState >= 2) {
        const drift = a.currentTime - official;
        const now = performance.now();
        if (Math.abs(drift) > 0.75 && now - lastAudioSyncPerf.current > 1000) {
          try { a.currentTime = Math.max(0,Math.min(official,Number.isFinite(a.duration) ? Math.max(0,a.duration-0.05) : official)); lastAudioSyncPerf.current=now; }
          catch { /* De officiële testklok blijft verder lopen. */ }
        }
      }
    }, 120);
    } catch (e) { setError(errText(e)); }
  }
  async function stopAllLive() {
    if (sessionClosingRef.current) return;
    sessionClosingRef.current = true;
    const official = officialElapsedNow();
    lastOfficialElapsed.current = official; testStartPerf.current = null;
    player.current?.pause(); if (ticker.current) { clearInterval(ticker.current); ticker.current=null; }
    setElapsed(official); setRunning(false);
    try { await masWriteQueue; const latest=(await masGet<Draft[]>("drafts")) ?? []; setDrafts(latest); }
    catch(e) { setError(`Niet alle STOP-scores konden lokaal gecontroleerd worden: ${errText(e)}`); }
    setTab("controle");
    setMessage("Test gestopt. Controleer de voorlopige scores voordat je bevestigt. Oude voorlopige scores blokkeren een nieuwe test nooit.");
  }
  function stopPupil(id: string) {
    if (!running || sessionClosingRef.current || !draftsLoaded || !timing || stopLock.current.has(id) || (attendance[id] ?? "deelneemt") !== "deelneemt") return;
    stopLock.current.add(id);
    const seconds = Math.max(0, officialElapsedNow() - timing.countdown_s);
    const completed = [...timing.events].filter(e => e.type === "marker" && e.time_s <= seconds).at(-1);
    const currentSpeed = timing.events.find(e => e.type === "marker" && e.time_s > seconds)?.speed ?? timing.events.at(-1)?.speed ?? 7;
    const lastFull = completed?.speed ?? 7;
    const distanceM = completed?.distance_m ?? 0;
    const exactMas = masForDistance(distanceM) ?? lastFull;
    const p = byId.get(id);
    if (!p || !player.current || player.current.paused) { stopLock.current.delete(id); return; }
    const d: Draft = { id: crypto.randomUUID(), leerling_id: id, leerling_email: p.email ?? undefined, leerling_naam: p.volledige_naam ?? undefined, value: String(exactMas), testdatum: liveDate, schooljaar: p.schooljaar ?? schoolYear, klas_naam: p.klas_naam,
      distance_m: distanceM, duration_s: seconds, completed_speed: lastFull,
      reached_speed: currentSpeed, markers: distanceM / 50 };
    void persistDrafts(old => old.some(row => row.leerling_id === id && row.testdatum === liveDate) ? old : [...old, d])
      .then(() => { setStopped(old => [...new Set([...old,id])]); setMessage(`${p.volledige_naam}: lokaal opgeslagen. Controleer de MAS-waarde in Te bevestigen.`); })
      .catch(e => { stopLock.current.delete(id); setError(`OPSLAG MISLUKT voor ${p.volledige_naam}: ${errText(e)}. Noteer de score onmiddellijk!`); });
  }
  const refreshScores = useCallback(async (discipline: string) => {
    const all: Score[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error: queryError } = await supabase.from("sportfolio_scores")
        .select("id,leerling_id,discipline_id,schooljaar,klas_naam,score_nummer,score_tekst,status,bevestigd_op,extra_data")
        .eq("discipline_id", discipline).eq("schooljaar", schoolYear).order("bevestigd_op", { ascending: false }).range(from, from + 999);
      if (queryError) throw queryError;
      all.push(...((data ?? []) as Score[]));
      if ((data ?? []).length < 1000) break;
    }
    setScores(all);
  }, [schoolYear]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw new Error("Meld je aan met je schoolaccount.");
        const { data: me, error: meError } = await supabase.from("profielen").select("rol").eq("id", auth.user.id).single();
        if (meError || !["lo_leerkracht", "admin"].includes(String(me?.rol))) throw new Error("Deze pagina is alleen voor LO-leerkrachten.");
        const { data: discipline, error: disciplineError } = await supabase.from("sportfolio_disciplines").select("id,slug").eq("slug", MAS_SLUG).maybeSingle();
        if (disciplineError) throw disciplineError;
        if (!discipline) throw new Error(`Geen discipline met slug '${MAS_SLUG}' gevonden. Controleer de bestaande MAS-discipline in Sportfolio; maak geen tweede discipline aan.`);
        // Zelfde officiële klassenbron en paginering als de werkende Beep-test.
        setSchoolLoading(true);
        let official: SchoolStudent[] = (await masGet<SchoolStudent[]>(`official:${auth.user.id}`)) ?? [];
        if (!cancelled && official.length) setSchoolStudents(official);
        try {
          const rows: SchoolRow[] = [];
          for (let from = 0; ; from += 1000) {
            const response = await supabase.from("eurofit_class_students_view")
              .select("*").order("email", { ascending: true }).range(from, from + 999);
            if (response.error) throw response.error;
            rows.push(...((response.data ?? []) as SchoolRow[]));
            if ((response.data ?? []).length < 1000) break;
          }
          const text = (row: SchoolRow, keys: string[]) => {
            for (const key of keys) {
              const value = row[key];
              if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
            }
            return "";
          };
          const unique = new Map<string, SchoolStudent>();
          for (const row of rows) {
            const email = text(row, ["email"]).toLowerCase();
            const klas = text(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"]);
            if (!email || !/^[0-9]/.test(klas)) continue;
            const naam = text(row, ["volledige_naam", "naam", "full_name", "name"])
              || `${text(row, ["given_name"])} ${text(row, ["family_name"])}`.trim() || email;
            if (!unique.has(email)) unique.set(email, { leerling_email: email, volledige_naam: naam, klas_naam: klas });
          }
          official = [...unique.values()].sort((a,b) => a.klas_naam.localeCompare(b.klas_naam,"nl-BE",{numeric:true}) || a.volledige_naam.localeCompare(b.volledige_naam,"nl-BE"));
          if (!cancelled) setSchoolStudents(official);
          await masPut(`official:${auth.user.id}`,official);
        } catch (e) { if (!cancelled) setSchoolError(`Officiële klassen vernieuwen mislukt: ${errText(e)}${official.length ? " · eerder bewaarde klaslijst beschikbaar" : ""}`); }
        finally { if (!cancelled) setSchoolLoading(false); }
        if (!cancelled) setGroups((await masGet<Group[]>(`groups:${auth.user.id}`)) ?? []);
        const { data: ownGroups, error: groupError } = await supabase.from("lo_klasgroepen")
          .select("id,naam,schooljaar").eq("leerkracht_id", auth.user.id).order("naam");
        if (groupError) { if (!cancelled) setSchoolError(old => `${old} Eigen klasgroepen: ${errText(groupError)}`.trim()); }
        else { if (!cancelled) setGroups((ownGroups ?? []) as Group[]); await masPut(`groups:${auth.user.id}`,ownGroups ?? []); }
        const emails = official.map(p => p.leerling_email);
        const all: Pupil[] = [];
        // Profielen zijn nodig voor Sportfolio-ID, schooljaar en publicatie.
        for (let i = 0; i < emails.length; i += 100) {
          const { data, error: pupilsError } = await supabase.from("profielen")
            .select("id,email,volledige_naam,klas_naam,schooljaar,leerjaar,graad,geslacht")
            .in("email", emails.slice(i, i + 100));
          if (pupilsError) throw pupilsError;
          all.push(...((data ?? []) as Pupil[]));
        }
        // Toon officiële klasnaam en naam, ook wanneer profielen verouderde klasgegevens heeft.
        const profilesByEmail = new Map(all.map(p => [String(p.email ?? "").trim().toLowerCase(), p]));
        // De Beep-test toont alle leerlingen uit de officiële view, ook zonder profiel.
        // Gebruik voor zulke leerlingen een stabiele tijdelijke sleutel op basis van hun e-mail.
        // Een score kan pas naar Sportfolio wanneer het echte profiel beschikbaar is.
        const matched: Pupil[] = official.map(row => {
          const profile = profilesByEmail.get(row.leerling_email);
          return profile
            ? { ...profile, volledige_naam: row.volledige_naam, klas_naam: row.klas_naam }
            : { id: `email:${row.leerling_email}`, email: row.leerling_email,
                volledige_naam: row.volledige_naam, klas_naam: row.klas_naam,
                schooljaar: null, leerjaar: null, graad: null, geslacht: null };
        });
        if (cancelled) return;
        setTeacherId(auth.user.id); setDisciplineId(discipline.id); setPupils(matched);
        await refreshScores(discipline.id);
      } catch (e) { if (!cancelled) setError(errText(e)); }
    })();
    return () => { cancelled = true; };
  }, [refreshScores]);
  useEffect(() => {
    if (!selectedGroup || !teacherId || running) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error: groupError } = await supabase.from("lo_klasgroep_leden_view")
          .select("leerling_email,volledige_naam,klas_naam").eq("klasgroep_id", selectedGroup).order("positie");
        if (groupError) throw groupError;
        const emails = new Set((data ?? []).map(row => String(row.leerling_email ?? "").trim().toLowerCase()));
        const ids = pupils.filter(p => emails.has(String(p.email ?? "").trim().toLowerCase())).map(p => p.id);
        if (!cancelled) { setParticipants(old => [...new Set([...old, ...ids])]);
          if (ids.length < emails.size) setSchoolError(`${emails.size - ids.length} leerling(en) uit de klasgroep staan niet in de officiële leerlingenlijst.`);
        }
      } catch (e) { if (!cancelled) setSchoolError(`Klasgroep laden mislukt: ${errText(e)}`); }
    })();
    return () => { cancelled = true; };
  }, [selectedGroup, teacherId, pupils, running]);
  useEffect(() => {
    if (!historyGroup) { setHistoryGroupIds([]); return; }
    let cancelled=false;
    (async()=>{
      try {
        const {data,error:groupError}=await supabase.from("lo_klasgroep_leden_view").select("leerling_email").eq("klasgroep_id",historyGroup).order("positie");
        if(groupError) throw groupError;
        const emails=new Set((data??[]).map(row=>String(row.leerling_email??"").trim().toLowerCase()));
        const ids=pupils.filter(p=>emails.has(String(p.email??"").trim().toLowerCase())).map(p=>p.id);
        if(!cancelled) setHistoryGroupIds(ids);
      } catch(e) { if(!cancelled){setHistoryGroupIds([]);setError(`Historiek klasgroep laden mislukt: ${errText(e)}`);} }
    })();
    return()=>{cancelled=true;};
  },[historyGroup,pupils]);
  const participantClasses = useMemo(() => [...new Set(schoolStudents.map(s => s.klas_naam))].sort((a,b)=>a.localeCompare(b,"nl-BE",{numeric:true})), [schoolStudents]);
  const candidatePupils = pupils.filter(p => (!participantClass || p.klas_naam === participantClass)
    && (!participantSearch.trim() || `${p.volledige_naam ?? ""} ${p.klas_naam ?? ""}`.toLocaleLowerCase("nl-BE").includes(participantSearch.trim().toLocaleLowerCase("nl-BE"))))
    .sort((a,b)=>String(a.volledige_naam).localeCompare(String(b.volledige_naam),"nl-BE"));
  const classes = useMemo(() => [...new Set(pupils.map(p => p.klas_naam).filter((x): x is string => !!x))].sort((a,b) => a.localeCompare(b,"nl",{numeric:true})), [pupils]);
  const byId = useMemo(() => new Map(pupils.map(p => [p.id, p])), [pupils]);
  const resolveDraftPupil = (d: Draft) => pupils.find(p => p.id === d.leerling_id) ?? pupils.find(p => !!(d.leerling_email || d.leerling_id.startsWith("email:")) && String(p.email ?? "").toLowerCase() === String(d.leerling_email ?? d.leerling_id.slice(6)).toLowerCase());
  const draftName = (d: Draft) => resolveDraftPupil(d)?.volledige_naam ?? d.leerling_naam ?? d.leerling_email ?? (d.leerling_id.startsWith("email:") ? d.leerling_id.slice(6) : "Leerling");
  const sortedParticipantIds = useMemo(() => [...participants].sort((a,b) => String(byId.get(a)?.volledige_naam ?? "").localeCompare(String(byId.get(b)?.volledige_naam ?? ""), "nl-BE", { sensitivity: "base" })), [participants, byId]);
  const historyPupils = (historyGroup ? pupils.filter(p=>historyGroupIds.includes(p.id)) : historyClass ? pupils.filter(p=>p.klas_naam===historyClass) : []).sort((a,b)=>String(a.volledige_naam??"").localeCompare(String(b.volledige_naam??""),"nl-BE",{sensitivity:"base"}));
  const visibleScores = scores.filter(s => s.status === "bevestigd" && s.schooljaar === schoolYear && (historyGroup ? historyGroupIds.includes(s.leerling_id) : !historyClass || (s.klas_naam ?? byId.get(s.leerling_id)?.klas_naam) === historyClass));
  const historyDates = [...new Set(visibleScores.map(s => String(s.extra_data?.testdatum ?? s.bevestigd_op ?? "").slice(0,10)).filter(Boolean))].sort().reverse();
  const publish = async () => {
    const chosen = drafts.filter(d => selectedDrafts.includes(d.id));
    if (!chosen.length || busy || !disciplineId || !teacherId || !online || running) return;
    if (!window.confirm(`${chosen.length} MAS-score(s) definitief bevestigen in Sportfolio?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id !== teacherId) throw new Error("Je aanmelding is verlopen. Meld je opnieuw aan.");
      for (const d of chosen) {
        const p = resolveDraftPupil(d);
        const n = validMas(d.value);
        if (n === null || (!p && !d.leerling_email && !d.leerling_id.startsWith("email:"))) { setError(old => `${old ? old + " · " : ""}Ongeldige score of leerling niet gevonden; deze rij blijft lokaal.`); continue; }
        const email = String(d.leerling_email ?? p?.email ?? (d.leerling_id.startsWith("email:") ? d.leerling_id.slice(6) : "")).trim().toLowerCase();
      const year = d.schooljaar ?? schoolYear;
      const klas = d.klas_naam ?? p?.klas_naam ?? "";
      const extra = { bron: "lo_mas_test", protocol_id: "leger_boucher_50m_workbook_cumulative", testdatum: `${d.testdatum}T12:00:00`, mas_km_u: n, session_id: d.id, mas_draft_id: d.id,
        ...(d.distance_m === undefined ? {} : { afstand_meter: d.distance_m, testduur_seconden: d.duration_s, laatste_volledige_snelheid: d.completed_speed, bereikte_snelheid: d.reached_speed, volledige_50m_stukken: d.markers }) };
      if (!p || p.id.startsWith("email:")) {
        if (!email || !klas) { setError(old => `${old ? old + " · " : ""}${draftName(d)}: geen betrouwbare identiteit/klas; lokaal behouden.`); continue; }
        const { data: pending, error: pendingError } = await supabase.rpc("sportfolio_save_and_link_pending_score", {
          p_email: email, p_username: "", p_name: draftName(d), p_discipline_id: disciplineId, p_schooljaar: year, p_klas_naam: klas,
          p_score_nummer: n, p_score_tekst: String(n).replace(".", ","), p_eenheid: "km/u", p_extra_data: extra
        });
        if (pendingError || !pending) { setError(old => `${old ? old + " · " : ""}${draftName(d)}: ${errText(pendingError ?? "Opslag niet bevestigd")}; lokaal behouden.`); continue; }
        await persistDrafts(old => old.filter(x => x.id !== d.id));
        setSelectedDrafts(old => old.filter(id => id !== d.id));
        continue;
      }
        // Een vaste ID voorkomt dubbele publicatie bij opnieuw proberen na netwerkverlies.
        const payload = {
          id: d.id, leerling_id: p.id, discipline_id: disciplineId, schooljaar: year,
          klas_naam: klas, score_nummer: n, score_tekst: String(n).replace(".", ","), eenheid: "km/u",
          status: "bevestigd", bevestigd_door: teacherId, bevestigd_op: new Date().toISOString(),
          extra_data: extra,
          leerjaar_snapshot: p.leerjaar ? Number(p.leerjaar) || null : null,
          graad_snapshot: p.graad ? Number(p.graad) || null : null,
          geslacht_snapshot: p.geslacht, naam_snapshot: p.volledige_naam,
        };
        const { data: existing, error: lookupError } = await supabase.from("sportfolio_scores")
          .select("id,leerling_id,discipline_id,status").eq("id", d.id).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) {
          if (existing.leerling_id !== p.id || existing.discipline_id !== disciplineId || existing.status !== "bevestigd") throw new Error(`Scoreconflict voor ${p.volledige_naam}; niets overschreven.`);
        } else {
          const { error: insertError } = await supabase.from("sportfolio_scores").insert(payload);
          if (insertError) { if (insertError.code !== "23505") throw new Error(`${p.volledige_naam}: ${errText(insertError)}`);
            const {data: duplicate,error: duplicateError}=await supabase.from("sportfolio_scores").select("id,leerling_id,discipline_id,status").eq("id",d.id).maybeSingle();
            if (duplicateError || !duplicate || duplicate.leerling_id!==p.id || duplicate.discipline_id!==disciplineId || duplicate.status!=="bevestigd") throw new Error(`${p.volledige_naam}: dubbele sleutel niet veilig bevestigd.`);
          }
        }
        await persistDrafts(old => old.filter(x => x.id !== d.id));
        setSelectedDrafts(old => old.filter(id => id !== d.id));
      }
      await refreshScores(disciplineId);
      setMessage("Geselecteerde scores zijn veilig opgeslagen in Sportfolio of als voorlopige score in Supabase.");
    } catch (e) { setError(`${errText(e)} Reeds bevestigde rijen blijven bewaard; controleer de historiek voordat je opnieuw probeert.`); }
    finally { setBusy(false); }
  };
  async function deleteScores(rows: Score[], label: string) {
    if (!rows.length || !teacherId || !disciplineId || !online || busy) return;
    if (!window.confirm(`${label}\n\nJe verwijdert ${rows.length} bevestigde MAS-score(s). Dit kan niet ongedaan worden gemaakt. Doorgaan?`)) return;
    if (rows.length > 1 && !window.confirm("Laatste controle: deze MAS-scores definitief wissen?")) return;
    setBusy(true); setError("");
    try {
      const {data:auth,error:authError}=await supabase.auth.getUser();
      if(authError || auth.user?.id!==teacherId) throw new Error("Meld je opnieuw aan als LO-leerkracht.");
      const {data:me,error:meError}=await supabase.from("profielen").select("rol").eq("id",teacherId).maybeSingle();
      if(meError || !me || !["lo_leerkracht","admin"].includes(String(me.rol))) throw new Error("Geen toestemming om MAS-scores te wissen.");
      const ids=rows.map(r=>r.id);
      for(let i=0;i<ids.length;i+=100){
        const {error:deleteError}=await supabase.from("sportfolio_scores").delete().eq("discipline_id",disciplineId).in("id",ids.slice(i,i+100));
        if(deleteError) throw deleteError;
      }
      setScores(old=>old.filter(s=>!ids.includes(s.id)));
      await persistDrafts(old=>old.filter(d=>!ids.includes(d.id)));
      setMessage(`${ids.length} MAS-score(s) definitief verwijderd.`);
    } catch(e) { setError(errText(e)); } finally { setBusy(false); }
  }
  const testSeconds = Math.max(0, elapsed - (timing?.countdown_s ?? 4));
  const markerEvents = (timing?.events ?? []).filter(e => e.type === "marker");
  const nextMarker = markerEvents.find(e => e.time_s > testSeconds);
  const currentStage = nextMarker?.speed ?? markerEvents.at(-1)?.speed ?? 7;
  const lastMarker = [...markerEvents].filter(e => e.time_s <= testSeconds).at(-1);
  const currentStageMarkers = markerEvents.filter(e => e.speed === currentStage);
  const completedStageMarkers = currentStageMarkers.filter(e => e.time_s <= testSeconds).length;
  const stageMarkerTotal = currentStageMarkers.length;
  const markersRemaining = Math.max(0, stageMarkerTotal - completedStageMarkers);
  const secondsToNextMarker = nextMarker ? Math.max(0, Math.ceil(nextMarker.time_s - testSeconds)) : 0;
  const tabButton = (name: typeof tab, label: string) => <button type="button" key={name} style={{ ...btn, background: tab === name ? "linear-gradient(90deg,#255971,#4B8E8D)" : "#17354b", flex: "1 1 160px" }} onClick={() => setTab(name)}>{label}</button>;
  return <AppShell title="LO App" subtitle="MAS-test (VMA)">
    <div style={panel}><h1 style={{ fontSize: 27, fontWeight: 900 }}>🏃 MAS-test (VMA)</h1></div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>{tabButton("invoer", "✎ Scores invoeren")}{tabButton("controle", `✓ Te bevestigen (${drafts.length})`)}{tabButton("historiek", "▥ Historiek")}{tabButton("klassen", "♙ Overzicht klassen")}</div>
    {error && <div role="alert" style={{ ...panel, borderColor: "#e68d8d", color: "#ffd0d0" }}>{error}</div>}
    {message && <div role="status" style={panel}>{message}</div>}
    {!online && <div role="status" style={panel}>Offline: je kunt de voorbereide test gebruiken; Sportfolio-publicatie kan pas wanneer je opnieuw online bent.</div>}
    {!draftsLoaded && <div role="status" style={panel}>Lokale resultaten controleren… Start pas wanneer deze controle klaar is.</div>}
    {tab === "invoer" && <>
    <div style={panel}>
      <h2>1. Gezamenlijke MAS-test · alleen pieptonen</h2>
      <p>Gebruik een parcours met markeringen om de 50 meter. De audio start met de gesproken aftelling 3, 2, 1, START; na 4 seconden begint het eerste niveau van 7 km/u. Controleer de geluidssterkte en de markeringen vooraf.</p>
      <button type="button" style={btn} disabled={preparing || running} onClick={() => void prepareAudio()}>{preparing ? "Audio voorbereiden…" : audioReady ? "✓ Audio opnieuw controleren" : "MP3 en timing offline klaarzetten"}</button>
      <p>{audioReady ? "✓ Audio en timing lokaal beschikbaar" : "Audio nog niet offline voorbereid"}</p>
    </div>
    <div style={panel}>
      <h2>2. Deelnemers samenstellen</h2>
      <p>Voeg je LO-klasgroep toe en vink daarnaast leerlingen uit andere officiële klassen aan. Alle geselecteerde leerlingen doen mee aan dezelfde gezamenlijke MAS-test.</p>
        <label style={{display:"block",marginTop:12}}>Testdatum<input style={control} type="date" value={liveDate} disabled={running} onChange={e => setLiveDate(e.target.value)}/></label>
        <label htmlFor="mas-group">Mijn LO-klasgroep toevoegen</label>
        <select id="mas-group" style={control} value={selectedGroup} disabled={running} onChange={e=>setSelectedGroup(e.target.value)}>
          <option value="">Kies een LO-klasgroep</option>{groups.map(g=><option key={g.id} value={g.id}>{g.naam} · {g.schooljaar}</option>)}
        </select>
        <label htmlFor="mas-class">Officiële klas</label>
        <select id="mas-class" style={control} value={participantClass} disabled={running} onChange={e=>setParticipantClass(e.target.value)}>
          <option value="">Alle officiële klassen</option>{participantClasses.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <label htmlFor="mas-search">Zoek leerling of klas</label>
        <input id="mas-search" style={control} value={participantSearch} disabled={running} onChange={e=>setParticipantSearch(e.target.value)} placeholder="Zoek op naam of klas…" />
        {schoolLoading && <p>Officiële klassen laden…</p>}
        {schoolError && <p role="alert" style={{color:"#ffd2a8"}}>{schoolError}</p>}
        {!schoolLoading && !participantClasses.length && <p>Geen officiële klassen gevonden. Controleer de melding hierboven en de toegang tot eurofit_class_students_view.</p>}
        <p>{candidatePupils.length} leerlingen gevonden · {schoolStudents.length} officiële leerlingen geladen.</p>
        {candidatePupils.some(p => p.id.startsWith("email:")) && <p style={{fontSize:13,color:"#ffd2a8"}}>⚠ {candidatePupils.filter(p => p.id.startsWith("email:")).length} leerling(en) in de huidige selectie hebben nog geen gekoppeld profiel. Je kunt hen selecteren en hun MAS voorlopig registreren; publicatie in Sportfolio vereist eerst een geldig profiel.</p>}
        {participantClass && <button type="button" style={btn} disabled={running} onClick={()=>setParticipants(old=>[...new Set([...old,...candidatePupils.map(p=>p.id)])])}>+ Volledige gekozen klas toevoegen</button>}
        <div style={{maxHeight:280,overflowY:"auto",display:"grid",gap:6,marginTop:10}}>{candidatePupils.map(p=><label key={p.id} style={{padding:10,background:"rgba(255,255,255,.06)",borderRadius:10,display:"flex",gap:10,alignItems:"center"}}><input type="checkbox" style={{width:20,height:20,accentColor:"#4B8E8D"}} disabled={running} checked={participants.includes(p.id)} onChange={e=>setParticipants(old=>e.target.checked?[...new Set([...old,p.id])]:old.filter(x=>x!==p.id))}/><span>{p.volledige_naam}{profileWarning(p)} · {p.klas_naam}</span></label>)}</div>
        <h3 style={{marginTop:18,paddingTop:12,borderTop:"1px solid rgba(137,194,170,.25)"}}>Geselecteerd voor deze test: {participants.length}</h3>
        <div style={{display:"grid",gap:6}}>{sortedParticipantIds.map(id=>{const p=byId.get(id);const status=attendance[id] ?? "deelneemt";return <div key={id} style={{display:"grid",gridTemplateColumns:"minmax(150px,1fr) minmax(130px,180px) auto",alignItems:"center",gap:10,padding:8,border:"1px solid rgba(137,194,170,.2)",borderRadius:10}}><span>{p?.volledige_naam ?? "Leerling"}{profileWarning(p)} · {p?.klas_naam ?? ""}</span><select aria-label={`Status ${p?.volledige_naam ?? "leerling"}`} style={{...control,minHeight:40,padding:"6px 9px"}} value={status} disabled={running} onChange={e=>setAttendance(old=>({...old,[id]:e.target.value as AttendanceStatus}))}><option value="deelneemt">✓ Neemt deel</option><option value="afwezig">○ Afwezig</option><option value="geblesseerd">✚ Geblesseerd</option></select><button type="button" style={{...danger,minHeight:36,padding:"6px 10px"}} disabled={running} onClick={()=>{setParticipants(old=>old.filter(x=>x!==id));setAttendance(old=>{const next={...old};delete next[id];return next;});}}>✕</button></div>})}</div>
    </div>
    <div ref={livePanelRef} style={{...panel,scrollMarginTop:0}}>
        <div style={running ? {position:"sticky",top:0,zIndex:30,background:"#17354b",padding:"10px 8px",borderRadius:14,boxShadow:"0 5px 16px rgba(0,0,0,.35)"} : undefined}>
        <h2 style={{marginTop:0}}>3. Gezamenlijke test</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:12}}> 
        <div style={{padding:12,borderRadius:14,background:"rgba(255,255,255,.06)"}}><div style={{fontSize:12,opacity:.7}}>Snelheid</div><strong style={{fontSize:24}}>{currentStage} km/u</strong></div>
        <div style={{padding:12,borderRadius:14,background:"rgba(255,255,255,.06)"}}><div style={{fontSize:12,opacity:.7}}>Kegels in deze snelheid</div><strong style={{fontSize:24}}>{completedStageMarkers}/{stageMarkerTotal || "—"}</strong><div style={{fontSize:12}}>nog {markersRemaining} tot volgende snelheid</div></div>
        <div style={{padding:12,borderRadius:14,background:"rgba(255,255,255,.06)"}}><div style={{fontSize:12,opacity:.7}}>Afstand</div><strong style={{fontSize:24}}>{lastMarker?.distance_m ?? 0} m</strong><div style={{fontSize:12}}>testtijd {timeLabel(testSeconds)}</div></div>
        <div style={{padding:12,borderRadius:14,background:running?"rgba(137,194,170,.18)":"rgba(255,255,255,.06)"}}><div style={{fontSize:12,opacity:.7}}>Volgende kegel over</div><strong style={{fontSize:32}}>{running ? secondsToNextMarker : "—"} s</strong></div>
      </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}><button type="button" style={btn} disabled={!audioReady || !participants.some(id => (attendance[id] ?? "deelneemt") === "deelneemt") || running} onClick={()=>void startLive()}>▶ Start MAS-test</button><button type="button" style={danger} disabled={!running} onClick={()=>void stopAllLive()}>■ STOP ALL</button></div>
        </div>
        <p style={{fontSize:13,opacity:.85}}>Tik tijdens de test op de <strong>naam van de leerling</strong> zodra die stopt. De MAS-score wordt op dat exacte moment berekend uit de beveiligde testklok en voorlopig opgeslagen.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginTop:12,...(running?{maxHeight:"calc(100dvh - 285px)",minHeight:160,overflowY:"auto" as const,overscrollBehavior:"contain" as const,WebkitOverflowScrolling:"touch" as const}: {})}}>{sortedParticipantIds.map(id=>{const p=byId.get(id);const done=stopped.includes(id);const status=attendance[id] ?? "deelneemt";const excluded=status!=="deelneemt";const result=drafts.find(d=>d.leerling_id===id && d.testdatum===liveDate);return <button type="button" key={id} aria-label={`${p?.volledige_naam ?? "Leerling"}: ${done ? "score bewaard" : "MAS registreren"}`} style={{...btn,minHeight:108,width:"100%",padding:"10px 9px",textAlign:"left",display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:7,border:"1px solid rgba(137,194,170,.35)",background:done?"#89C2AA":excluded?"#48576a":"linear-gradient(90deg,#255971,#4B8E8D)",color:done?"#102b32":"#fff",opacity:!running&&!done?.75:1}} disabled={!running || done || excluded} onClick={()=>stopPupil(id)}><strong style={{fontSize:15,lineHeight:1.15,overflowWrap:"anywhere"}}>{p?.volledige_naam}{profileWarning(p)}</strong><span style={{fontSize:13}}>{done?`✓ MAS geregistreerd: ${result?.value ?? "—"} km/u · ${result?.distance_m ?? 0} m`:status==="afwezig"?"Afwezig":status==="geblesseerd"?"Geblesseerd":`${p?.klas_naam ?? ""} · Tik om MAS te registreren`}</span></button>})}</div>
        <p style={{fontSize:13}}>Een STOP-score is voorlopig. Controleer en corrigeer de MAS in ‘Te bevestigen’. Het laatst volledig afgelegde niveau is niet automatisch gelijk aan de snelheid waarbij de leerling stopte.</p>
    </div>
    </>}
  {tab === "controle" && <div style={panel}><h2>Te bevestigen resultaten</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}><button type="button" style={btn} onClick={() => setSelectedDrafts(drafts.map(d => d.id))}>Alles selecteren</button><button type="button" style={btn} onClick={() => setSelectedDrafts([])}>Selectie wissen</button><button type="button" style={danger} disabled={busy || !selectedDrafts.length} onClick={() => { if (window.confirm("Geselecteerde voorlopige scores verwijderen?")) { void persistDrafts(old => old.filter(d => !selectedDrafts.includes(d.id))).then(()=>setSelectedDrafts([])).catch(e=>setError(errText(e))); } }}>Geselecteerde voorlopige scores verwijderen</button></div>
      <div style={{ display: "grid", gap: 9 }}>{drafts.map(d => <div key={d.id} style={{ border: "1px solid #55748a", borderRadius: 12, padding: 12, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}><input type="checkbox" aria-label={`Selecteer ${draftName(d)}`} checked={selectedDrafts.includes(d.id)} onChange={e => setSelectedDrafts(old => e.target.checked ? [...old, d.id] : old.filter(x => x !== d.id))}/><span style={{ flex: "1 1 170px" }}><strong>{draftName(d)}</strong><br/>{resolveDraftPupil(d)?.klas_naam ?? d.klas_naam} · {fmt(d.testdatum)}</span><strong>{d.value} km/u</strong>{d.distance_m !== undefined && <small>{d.distance_m} m · {timeLabel(d.duration_s ?? 0)} · bereikte snelheid {d.reached_speed} km/u</small>}<button type="button" style={btn} disabled={busy} onClick={() => { const next=window.prompt(`MAS-score voor ${draftName(d)} (km/u)`, d.value); if(next===null)return; const n=validMas(next); if(n===null){setError("Geef een geldige MAS-waarde tussen 0 en 35 km/u.");return;} void persistDrafts(old=>old.map(row=>row.id===d.id?{...row,value:String(n)}:row)).catch(e=>setError(errText(e))); }}>MAS aanpassen</button></div>)}</div>
      {!drafts.length && <p>Er staan geen voorlopige scores klaar.</p>}
      <button type="button" style={{ ...btn, marginTop: 14 }} disabled={busy || running || !online || !selectedDrafts.length || !disciplineId} onClick={() => void publish()}>{busy ? "Bevestigen…" : `Geselecteerde bevestigen (${selectedDrafts.length})`}</button>
    </div>}
    {tab === "historiek" && <div style={panel}>
    <h2>Historiek MAS-test · {schoolYear}</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
    <label>Officiële klas<select style={control} value={historyClass} onChange={e => {setHistoryClass(e.target.value);setHistoryGroup("");}}><option value="">Kies een klas</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
    <label>LO-klasgroep<select style={control} value={historyGroup} onChange={e => {setHistoryGroup(e.target.value);setHistoryClass("");}}><option value="">Kies een LO-klasgroep</option>{groups.map(g=><option key={g.id} value={g.id}>{g.naam} · {g.schooljaar}</option>)}</select></label>
   </div>
    <button type="button" style={{ ...btn, marginTop: 10 }} disabled={!disciplineId || busy} onClick={() => void refreshScores(disciplineId).catch(e => setError(errText(e)))}>↻ Historiek vernieuwen</button>
    {(historyClass || historyGroup) && <div style={{display:"grid",gap:10,marginTop:14}}>{historyPupils.map(p=>{const pupilScores=visibleScores.filter(s=>s.leerling_id===p.id).sort((a,b)=>String(b.extra_data?.testdatum??b.bevestigd_op??"").localeCompare(String(a.extra_data?.testdatum??a.bevestigd_op??"")));const latest=pupilScores[0];return <div key={p.id} style={{border:"1px solid rgba(137,194,170,.3)",borderRadius:14,padding:12,background:latest?"rgba(75,142,141,.10)":"rgba(255,255,255,.025)"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><strong style={{fontSize:17}}>{p.volledige_naam}</strong><div style={{fontSize:13,opacity:.75}}>{p.klas_naam}</div></div><div style={{textAlign:"right"}}>{latest?<><strong style={{fontSize:20}}>{latest.score_nummer ?? latest.score_tekst ?? "—"} km/u</strong><div style={{fontSize:12,opacity:.8}}>laatste: {fmt(typeof latest.extra_data?.testdatum==="string"?latest.extra_data.testdatum:latest.bevestigd_op)}</div></>:<strong style={{opacity:.6}}>Geen MAS-score</strong>}</div></div>{pupilScores.length>0&&<div style={{display:"grid",gap:6,marginTop:10}}>{pupilScores.map(score=>{const day=String(score.extra_data?.testdatum??score.bevestigd_op??"").slice(0,10);return <div key={score.id} style={{display:"grid",gridTemplateColumns:"minmax(90px,1fr) auto auto",gap:8,alignItems:"center",padding:"8px 0",borderTop:"1px solid rgba(137,194,170,.18)"}}><span>{day?fmt(`${day}T12:00:00`):"—"}</span><strong>{score.score_nummer ?? score.score_tekst ?? "—"} km/u</strong><button type="button" style={{...danger,minHeight:34,padding:"5px 8px"}} disabled={busy} onClick={()=>void deleteScores([score],`Score van ${p.volledige_naam ?? "leerling"} op ${day?fmt(`${day}T12:00:00`):"deze datum"} wissen?`)}>🗑</button></div>})}</div>}</div>})}</div>}
    {(historyClass || historyGroup) && historyPupils.length===0 && <p>Geen leerlingen gevonden voor deze selectie.</p>}
  </div>}
  {tab === "klassen" && <div style={panel}><h2>Overzicht klassen · {schoolYear}</h2><button type="button" style={btn} disabled={!disciplineId || busy} onClick={()=>void refreshScores(disciplineId).catch(e=>setError(errText(e)))}>↻ Overzicht vernieuwen</button><div style={{ overflowX: "auto",marginTop:12 }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Klas","Leerlingen","Getest","Laatste test","Testmomenten"].map(x => <th key={x} style={{ padding: 10, borderBottom: "1px solid #668" }}>{x}</th>)}</tr></thead><tbody>{classes.map(c => { const members=pupils.filter(p=>p.klas_naam===c); const ids=new Set(members.filter(p=>!p.id.startsWith("email:")).map(p=>p.id)); const classScores=scores.filter(s=>s.status==="bevestigd"&&s.schooljaar===schoolYear&&ids.has(s.leerling_id)); const tested=new Set(classScores.map(s=>s.leerling_id)).size; const dates=[...new Set(classScores.map(s=>String(s.extra_data?.testdatum ?? s.bevestigd_op ?? "").slice(0,10)).filter(Boolean))].sort().reverse(); return <tr key={c}><td style={{padding:10}}>{c}</td><td style={{padding:10}}>{members.length}</td><td style={{padding:10,fontWeight:800}}>{tested}/{members.length}</td><td style={{padding:10}}>{dates[0]?fmt(`${dates[0]}T12:00:00`):"—"}</td><td style={{padding:10}}>{dates.length}</td></tr>; })}</tbody></table></div>{!classes.length&&<p>Er zijn nog geen officiële klassen geladen.</p>}</div>}
  </AppShell>;
}
