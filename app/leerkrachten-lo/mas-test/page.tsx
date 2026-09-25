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
type Draft = { id: string; leerling_id: string; value: string; testdatum: string; distance_m?: number; duration_s?: number; completed_speed?: number; reached_speed?: number; markers?: number };
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
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPupil, setSelectedPupil] = useState("");
  const [historyClass, setHistoryClass] = useState("");
  const [value, setValue] = useState("");
  const [testDate, setTestDate] = useState(today());
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [editingId, setEditingId] = useState("");
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
  const player = useRef<HTMLAudioElement | null>(null);
  const playerUrl = useRef<string | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopLock = useRef<Set<string>>(new Set());
  const sessionClosingRef = useRef(false);
  const [profileId, setProfileId] = useState("");
  const [showLive, setShowLive] = useState(true);
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
  useEffect(() => () => { player.current?.pause(); if (ticker.current) clearInterval(ticker.current); if (playerUrl.current) URL.revokeObjectURL(playerUrl.current); }, []);
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
  async function startLive() {
    if (!draftsLoaded || !teacherId || !audioReady || !timing || !participants.some(id => (attendance[id] ?? "deelneemt") === "deelneemt") || running || drafts.length) { setError("Bereid de audio voor, kies deelnemers en werk eventuele voorlopige scores eerst af."); return; }
    try {
      const response = await (await caches.open("lo-mas-test-audio-tempowissel-v5")).match(AUDIO_URL);
      if (!response) throw new Error("Offline MP3 niet gevonden.");
      const url = URL.createObjectURL(await response.blob()); playerUrl.current = url;
      const a = new Audio(url); player.current = a;
      a.onended = () => stopAllLive();
      a.onerror = () => { stopAllLive(); setError("Audio onderbroken. Controleer de voorlopige scores."); };
      await a.play(); setElapsed(0); setStopped([]); stopLock.current.clear(); sessionClosingRef.current = false; setRunning(true);
      ticker.current = setInterval(() => setElapsed(a.currentTime), 120);
    } catch (e) { setError(errText(e)); }
  }
  async function stopAllLive() {
    if (sessionClosingRef.current) return;
    sessionClosingRef.current = true;
    player.current?.pause(); if (ticker.current) clearInterval(ticker.current);
    setElapsed(player.current?.currentTime ?? 0); setRunning(false);
    try { await masWriteQueue; const latest=(await masGet<Draft[]>("drafts")) ?? []; setDrafts(latest); }
    catch(e) { setError(`Niet alle STOP-scores konden lokaal gecontroleerd worden: ${errText(e)}`); }
    setMessage("Test gestopt. Controleer de voorlopige scores voordat je bevestigt.");
  }
  function stopPupil(id: string) {
    if (!running || sessionClosingRef.current || !draftsLoaded || !timing || stopLock.current.has(id) || (attendance[id] ?? "deelneemt") !== "deelneemt") return;
    stopLock.current.add(id);
    const seconds = Math.max(0, (player.current?.currentTime ?? 0) - timing.countdown_s);
    const completed = [...timing.events].filter(e => e.type === "marker" && e.time_s <= seconds).at(-1);
    const currentSpeed = timing.events.find(e => e.type === "marker" && e.time_s > seconds)?.speed ?? timing.events.at(-1)?.speed ?? 7;
    const lastFull = completed?.speed ?? 7;
    const p = byId.get(id);
    if (!p || !player.current || player.current.paused) return;
    const d: Draft = { id: crypto.randomUUID(), leerling_id: id, value: String(lastFull || 7), testdatum: liveDate,
      distance_m: completed?.distance_m ?? 0, duration_s: seconds, completed_speed: lastFull,
      reached_speed: currentSpeed, markers: (completed?.distance_m ?? 0) / 50 };
    void persistDrafts(old => old.some(row => row.leerling_id === id && row.testdatum === liveDate) ? old : [...old, d])
      .then(() => { setStopped(old => [...new Set([...old,id])]); setMessage(`${p.volledige_naam}: lokaal opgeslagen. Controleer de MAS-waarde in Te bevestigen.`); })
      .catch(e => { stopLock.current.delete(id); setError(`OPSLAG MISLUKT voor ${p.volledige_naam}: ${errText(e)}. Noteer de score onmiddellijk!`); });
  }

  const refreshScores = useCallback(async (discipline: string) => {
    const all: Score[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error: queryError } = await supabase.from("sportfolio_scores")
        .select("id,leerling_id,discipline_id,schooljaar,klas_naam,score_nummer,score_tekst,status,bevestigd_op,extra_data")
        .eq("discipline_id", discipline).order("bevestigd_op", { ascending: false }).range(from, from + 999);
      if (queryError) throw queryError;
      all.push(...((data ?? []) as Score[]));
      if ((data ?? []).length < 1000) break;
    }
    setScores(all);
  }, []);

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

  const participantClasses = useMemo(() => [...new Set(schoolStudents.map(s => s.klas_naam))].sort((a,b)=>a.localeCompare(b,"nl-BE",{numeric:true})), [schoolStudents]);
  const candidatePupils = pupils.filter(p => (!participantClass || p.klas_naam === participantClass)
    && (!participantSearch.trim() || `${p.volledige_naam ?? ""} ${p.klas_naam ?? ""}`.toLocaleLowerCase("nl-BE").includes(participantSearch.trim().toLocaleLowerCase("nl-BE"))))
    .sort((a,b)=>String(a.volledige_naam).localeCompare(String(b.volledige_naam),"nl-BE"));

  const classes = useMemo(() => [...new Set(pupils.map(p => p.klas_naam).filter((x): x is string => !!x))].sort((a,b) => a.localeCompare(b,"nl",{numeric:true})), [pupils]);
  const byId = useMemo(() => new Map(pupils.map(p => [p.id, p])), [pupils]);
  const classPupils = pupils.filter(p => p.klas_naam === selectedClass).sort((a,b) => String(a.volledige_naam).localeCompare(String(b.volledige_naam),"nl"));
  const visibleScores = scores.filter(s => s.status === "bevestigd" && (!historyClass || (s.klas_naam ?? byId.get(s.leerling_id)?.klas_naam) === historyClass));
  const addDraft = () => {
    setError("");
    const n = validMas(value);
    if (!selectedPupil || n === null || !testDate) { setError("Kies een leerling, testdatum en een geldige MAS-waarde in km/u (bijvoorbeeld 12,5)."); return; }
    const p = byId.get(selectedPupil);
    if (!p) { setError("Leerling niet gevonden."); return; }
    if (drafts.some(d => d.leerling_id === selectedPupil && d.testdatum === testDate && d.id !== editingId)) { setError("Voor deze leerling staat al een voorlopige score op die testdatum. Bewerk de bestaande rij."); return; }
    void persistDrafts(old => editingId ? old.map(d => d.id === editingId ? { ...d, leerling_id: selectedPupil, value: String(n), testdatum: testDate } : d)
      : [...old, { id: crypto.randomUUID(), leerling_id: selectedPupil, value: String(n), testdatum: testDate }])
      .then(()=>{setValue("");setSelectedPupil("");setEditingId("");setMessage("Voorlopige score lokaal opgeslagen. Nog niets gepubliceerd in Sportfolio.");})
      .catch(e=>setError(`Lokale opslag mislukt: ${errText(e)}`));
  };
  const publish = async () => {
    const chosen = drafts.filter(d => selectedDrafts.includes(d.id));
    if (!chosen.length || busy || !disciplineId || !teacherId || !online || running) return;
    if (!window.confirm(`${chosen.length} MAS-score(s) definitief bevestigen in Sportfolio?`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user?.id !== teacherId) throw new Error("Je aanmelding is verlopen. Meld je opnieuw aan.");
      for (const d of chosen) {
        const p = byId.get(d.leerling_id);
        const n = validMas(d.value);
        if (!p || n === null) { setError(old => `${old ? old + " · " : ""}Ongeldige score of leerling niet gevonden; deze rij blijft lokaal.`); continue; }
        if (p.id.startsWith("email:") || !p.schooljaar) { setError(old => `${old ? old + " · " : ""}${p.volledige_naam ?? p.email}: geen gekoppeld profiel/schooljaar; deze rij blijft lokaal.`); continue; }
        // Een vaste ID voorkomt dubbele publicatie bij opnieuw proberen na netwerkverlies.
        const payload = {
          id: d.id, leerling_id: p.id, discipline_id: disciplineId, schooljaar: p.schooljaar,
          klas_naam: p.klas_naam, score_nummer: n, score_tekst: String(n).replace(".", ","), eenheid: "km/u",
          status: "bevestigd", bevestigd_door: teacherId, bevestigd_op: new Date().toISOString(),
          extra_data: { bron: "lo_mas_test", protocol_id: "leger_boucher_50m_workbook_cumulative", testdatum: `${d.testdatum}T12:00:00`, mas_km_u: n,
            ...(d.distance_m === undefined ? {} : { afstand_meter: d.distance_m, testduur_seconden: d.duration_s, laatste_volledige_snelheid: d.completed_speed, bereikte_snelheid: d.reached_speed, volledige_50m_stukken: d.markers }) },
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
      setMessage("Geselecteerde scores zijn bevestigd in Sportfolio.");
    } catch (e) { setError(`${errText(e)} Reeds bevestigde rijen blijven bewaard; controleer de historiek voordat je opnieuw probeert.`); }
    finally { setBusy(false); }
  };
  const currentStage = timing?.events.find(e => e.type === "marker" && e.time_s > Math.max(0, elapsed - timing.countdown_s))?.speed ?? timing?.events.at(-1)?.speed ?? 7;
  const lastMarker = [...(timing?.events ?? [])].filter(e => e.type === "marker" && e.time_s <= Math.max(0, elapsed - (timing?.countdown_s ?? 4))).at(-1);
  const tabButton = (name: typeof tab, label: string) => <button type="button" key={name} style={{ ...btn, background: tab === name ? "linear-gradient(90deg,#255971,#4B8E8D)" : "#17354b", flex: "1 1 160px" }} onClick={() => setTab(name)}>{label}</button>;
  return <AppShell title="LO App" subtitle="MAS-test (VMA)">
    <div style={panel}><h1 style={{ fontSize: 27, fontWeight: 900 }}>🏃 MAS-test (VMA)</h1><p>Gezamenlijke Léger-Boucher MAS-test: 7 km/u bij de start, tempowissels volgens je invulformulier, duidelijke passeersignalen en een dubbel signaal bij de tempowissels op de tijden uit je invulformulier (kolom D). Gesproken aftelling, geen muziek. Resultaten worden pas na jouw bevestiging naar Sportfolio geschreven.</p></div>
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
        <select id="mas-group" style={control} value={selectedGroup} disabled={running || drafts.length>0} onChange={e=>setSelectedGroup(e.target.value)}>
          <option value="">Kies een LO-klasgroep</option>{groups.map(g=><option key={g.id} value={g.id}>{g.naam} · {g.schooljaar}</option>)}
        </select>
        <p style={{fontSize:13,opacity:.8}}>Zoals in de Beep-test: een gekozen klasgroep wordt toegevoegd aan je bestaande deelnemers.</p>
        <label htmlFor="mas-class">Officiële klas</label>
        <select id="mas-class" style={control} value={participantClass} disabled={running || drafts.length>0} onChange={e=>setParticipantClass(e.target.value)}>
          <option value="">Alle officiële klassen</option>{participantClasses.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <label htmlFor="mas-search">Zoek leerling of klas</label>
        <input id="mas-search" style={control} value={participantSearch} disabled={running || drafts.length>0} onChange={e=>setParticipantSearch(e.target.value)} placeholder="Zoek op naam of klas…" />
        {schoolLoading && <p>Officiële klassen laden…</p>}
        {schoolError && <p role="alert" style={{color:"#ffd2a8"}}>{schoolError}</p>}
        {!schoolLoading && !participantClasses.length && <p>Geen officiële klassen gevonden. Controleer de melding hierboven en de toegang tot eurofit_class_students_view.</p>}
        <p>{candidatePupils.length} leerlingen gevonden · {schoolStudents.length} officiële leerlingen geladen.</p>
        {candidatePupils.some(p => p.id.startsWith("email:")) && <p style={{fontSize:13,color:"#ffd2a8"}}>⚠ {candidatePupils.filter(p => p.id.startsWith("email:")).length} leerling(en) in de huidige selectie hebben nog geen gekoppeld profiel. Je kunt hen selecteren en hun MAS voorlopig registreren; publicatie in Sportfolio vereist eerst een geldig profiel.</p>}
        {participantClass && <button type="button" style={btn} disabled={running || drafts.length>0} onClick={()=>setParticipants(old=>[...new Set([...old,...candidatePupils.map(p=>p.id)])])}>+ Volledige gekozen klas toevoegen</button>}
        <div style={{maxHeight:280,overflowY:"auto",display:"grid",gap:6,marginTop:10}}>{candidatePupils.map(p=><label key={p.id} style={{padding:10,background:"rgba(255,255,255,.06)",borderRadius:10,display:"flex",gap:10,alignItems:"center"}}><input type="checkbox" style={{width:20,height:20,accentColor:"#4B8E8D"}} disabled={running || drafts.length>0} checked={participants.includes(p.id)} onChange={e=>setParticipants(old=>e.target.checked?[...new Set([...old,p.id])]:old.filter(x=>x!==p.id))}/><span>{p.volledige_naam}{profileWarning(p)} · {p.klas_naam}</span></label>)}</div>
        <h3 style={{marginTop:18,paddingTop:12,borderTop:"1px solid rgba(137,194,170,.25)"}}>Geselecteerd voor deze test: {participants.length}</h3>
        <div style={{display:"grid",gap:6}}>{participants.map(id=>{const p=byId.get(id);const status=attendance[id] ?? "deelneemt";return <div key={id} style={{display:"grid",gridTemplateColumns:"minmax(150px,1fr) minmax(130px,180px) auto",alignItems:"center",gap:10,padding:8,border:"1px solid rgba(137,194,170,.2)",borderRadius:10}}><span>{p?.volledige_naam ?? "Leerling"}{profileWarning(p)} · {p?.klas_naam ?? ""}</span><select aria-label={`Status ${p?.volledige_naam ?? "leerling"}`} style={{...control,minHeight:40,padding:"6px 9px"}} value={status} disabled={running || drafts.length>0} onChange={e=>setAttendance(old=>({...old,[id]:e.target.value as AttendanceStatus}))}><option value="deelneemt">✓ Neemt deel</option><option value="afwezig">○ Afwezig</option><option value="geblesseerd">✚ Geblesseerd</option></select><button type="button" style={{...danger,minHeight:36,padding:"6px 10px"}} disabled={running || drafts.length>0} onClick={()=>{setParticipants(old=>old.filter(x=>x!==id));setAttendance(old=>{const next={...old};delete next[id];return next;});}}>✕</button></div>})}</div>
    </div>
    <div style={panel}>
        <h2>3. Gezamenlijke test</h2>
        <h3>Niveau {currentStage} km/u · {timeLabel(Math.max(0,elapsed-(timing?.countdown_s ?? 4)))} · laatst volledig afgelegd: {lastMarker?.distance_m ?? 0} m</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}><button type="button" style={btn} disabled={!audioReady || !participants.some(id => (attendance[id] ?? "deelneemt") === "deelneemt") || running || drafts.length>0} onClick={()=>void startLive()}>▶ Start MAS-test</button><button type="button" style={danger} disabled={!running} onClick={()=>void stopAllLive()}>■ STOP ALL</button></div>
        <p style={{fontSize:13,opacity:.85}}>Tik tijdens de test op de <strong>naam van de leerling</strong> zodra die stopt. De MAS-score wordt op dat exacte moment berekend uit de afspeeltijd van de MP3 en voorlopig opgeslagen.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:10,marginTop:12}}>{participants.map(id=>{const p=byId.get(id);const done=stopped.includes(id);const status=attendance[id] ?? "deelneemt";const excluded=status!=="deelneemt";const result=drafts.find(d=>d.leerling_id===id && d.testdatum===liveDate);return <button type="button" key={id} aria-label={`${p?.volledige_naam ?? "Leerling"}: ${done ? "score bewaard" : "MAS registreren"}`} style={{...btn,minHeight:94,width:"100%",textAlign:"left",display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:7,border:"1px solid rgba(137,194,170,.35)",background:done?"#89C2AA":excluded?"#48576a":"linear-gradient(90deg,#255971,#4B8E8D)",color:done?"#102b32":"#fff",opacity:!running&&!done?.75:1}} disabled={!running || done || excluded} onClick={()=>stopPupil(id)}><strong style={{fontSize:17}}>{p?.volledige_naam}{profileWarning(p)}</strong><span style={{fontSize:13}}>{done?`✓ MAS geregistreerd: ${result?.value ?? "—"} km/u · ${result?.distance_m ?? 0} m`:status==="afwezig"?"Afwezig":status==="geblesseerd"?"Geblesseerd":`${p?.klas_naam ?? ""} · Tik om MAS te registreren`}</span></button>})}</div>
        <p style={{fontSize:13}}>Een STOP-score is voorlopig. Controleer en corrigeer de MAS in ‘Te bevestigen’. Het laatst volledig afgelegde niveau is niet automatisch gelijk aan de snelheid waarbij de leerling stopte.</p>
    </div>
    </>}
    {tab === "invoer" && <div style={panel}><h2>Nieuwe MAS-test registreren</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 12 }}>
      <label>Klas<select style={control} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedPupil(""); }}><option value="">Kies een klas</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
      <label>Leerling<select style={control} value={selectedPupil} onChange={e => setSelectedPupil(e.target.value)}><option value="">Kies een leerling</option>{classPupils.map(p => <option key={p.id} value={p.id}>{p.volledige_naam}{p.id.startsWith("email:") ? " ⚠ Geen profiel" : ""}</option>)}</select></label>
      <label>Testdatum<input style={control} type="date" value={testDate} onChange={e => setTestDate(e.target.value)} /></label>
      <label>MAS (km/u)<input style={control} type="text" inputMode="decimal" placeholder="bv. 12,5" value={value} onChange={e => setValue(e.target.value)} /></label>
    </div><button type="button" style={{ ...btn, marginTop: 14 }} disabled={!teacherId || !disciplineId} onClick={addDraft}>{editingId ? "Wijziging bewaren" : "+ Voorlopige score toevoegen"}</button><p style={{ fontSize: 13, opacity: .8 }}>De score wordt pas naar Sportfolio geschreven nadat je ze in ‘Te bevestigen’ bevestigt. Voorlopige scores worden lokaal in deze browser bewaard totdat je ze bevestigt of verwijdert.</p></div>}
    {tab === "controle" && <div style={panel}><h2>Te bevestigen resultaten</h2><p>Controleer leerling, datum en km/u. Selecteer alleen de scores die je wilt publiceren.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}><button type="button" style={btn} onClick={() => setSelectedDrafts(drafts.map(d => d.id))}>Alles selecteren</button><button type="button" style={btn} onClick={() => setSelectedDrafts([])}>Selectie wissen</button><button type="button" style={danger} disabled={busy || !selectedDrafts.length} onClick={() => { if (window.confirm("Geselecteerde voorlopige scores verwijderen?")) { void persistDrafts(old => old.filter(d => !selectedDrafts.includes(d.id))).then(()=>setSelectedDrafts([])).catch(e=>setError(errText(e))); } }}>Geselecteerde voorlopige scores verwijderen</button></div>
      <div style={{ display: "grid", gap: 9 }}>{drafts.map(d => <div key={d.id} style={{ border: "1px solid #55748a", borderRadius: 12, padding: 12, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}><input type="checkbox" aria-label={`Selecteer ${byId.get(d.leerling_id)?.volledige_naam ?? "leerling"}`} checked={selectedDrafts.includes(d.id)} onChange={e => setSelectedDrafts(old => e.target.checked ? [...old, d.id] : old.filter(x => x !== d.id))}/><span style={{ flex: "1 1 170px" }}><strong>{byId.get(d.leerling_id)?.volledige_naam ?? "Leerling"}</strong><br/>{byId.get(d.leerling_id)?.klas_naam} · {fmt(d.testdatum)}</span><strong>{d.value} km/u</strong>{d.distance_m !== undefined && <small>{d.distance_m} m · {timeLabel(d.duration_s ?? 0)} · bereikte snelheid {d.reached_speed} km/u</small>}<button type="button" style={btn} disabled={busy} onClick={() => { const p = byId.get(d.leerling_id); setSelectedClass(p?.klas_naam ?? ""); setSelectedPupil(d.leerling_id); setValue(d.value); setTestDate(d.testdatum); setEditingId(d.id); setTab("invoer"); }}>Bewerken</button></div>)}</div>
      {!drafts.length && <p>Er staan geen voorlopige scores klaar.</p>}
      <button type="button" style={{ ...btn, marginTop: 14 }} disabled={busy || running || !online || !selectedDrafts.length || !disciplineId} onClick={() => void publish()}>{busy ? "Bevestigen…" : `Geselecteerde bevestigen (${selectedDrafts.length})`}</button>
    </div>}
    {tab === "historiek" && <div style={panel}><h2>Bevestigde MAS-scores in Sportfolio</h2><label>Klas<select style={control} value={historyClass} onChange={e => setHistoryClass(e.target.value)}><option value="">Alle klassen</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></label><button type="button" style={{ ...btn, marginTop: 10 }} disabled={!disciplineId || busy} onClick={() => void refreshScores(disciplineId).catch(e => setError(errText(e)))}>Historiek vernieuwen</button>
      <div style={{ overflowX: "auto", marginTop: 12 }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Testdatum", "Leerling", "Klas", "MAS", "Status"].map(x => <th key={x} style={{ padding: 10, borderBottom: "1px solid #668" }}>{x}</th>)}</tr></thead><tbody>{visibleScores.map(s => <tr key={s.id}><td style={{ padding: 10 }}>{fmt(typeof s.extra_data?.testdatum === "string" ? s.extra_data.testdatum : s.bevestigd_op)}</td><td style={{ padding: 10 }}>{byId.get(s.leerling_id)?.volledige_naam ?? s.leerling_id}</td><td style={{ padding: 10 }}>{s.klas_naam ?? byId.get(s.leerling_id)?.klas_naam ?? "—"}</td><td style={{ padding: 10 }}>{s.score_nummer ?? s.score_tekst ?? "—"} km/u</td><td style={{ padding: 10 }}>Bevestigd</td></tr>)}</tbody></table>{!visibleScores.length && <p>Geen bevestigde MAS-scores gevonden voor deze selectie.</p>}</div>
    </div>}
    {tab === "klassen" && <div style={panel}><h2>Overzicht per klas</h2><p>Een leerling telt als ‘met score’ zodra er minstens één bevestigde MAS-score in Sportfolio staat.</p><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{["Klas", "Leerlingen", "Met score", "Zonder score", "Voltooid"].map(x => <th key={x} style={{ padding: 10, borderBottom: "1px solid #668" }}>{x}</th>)}</tr></thead><tbody>{classes.map(c => { const members = pupils.filter(p => p.klas_naam === c); const scored = new Set(scores.filter(s => s.status === "bevestigd").map(s => s.leerling_id)); const done = members.filter(p => scored.has(p.id)).length; return <tr key={c}><td style={{ padding: 10 }}>{c}</td><td style={{ padding: 10 }}>{members.length}</td><td style={{ padding: 10 }}>{done}</td><td style={{ padding: 10 }}>{members.length - done}</td><td style={{ padding: 10 }}>{members.length ? Math.round(100 * done / members.length) : 0}%</td></tr>; })}</tbody></table></div></div>}
    {tab === "historiek" && <div style={panel}><h2>MAS-profielkaart</h2><label>Leerling<select style={control} value={profileId} onChange={e=>setProfileId(e.target.value)}><option value="">Kies een leerling</option>{pupils.filter(p=>visibleScores.some(s=>s.leerling_id===p.id)).map(p=><option key={p.id} value={p.id}>{p.volledige_naam} · {p.klas_naam}</option>)}</select></label>{profileId && (()=>{const s=visibleScores.find(x=>x.leerling_id===profileId);if(!s)return <p>Geen bevestigde score.</p>;const mas=Number(s.score_nummer);return <div style={{padding:16,marginTop:12,border:"1px solid #668",borderRadius:14}}><h3>{byId.get(profileId)?.volledige_naam}</h3><p>{byId.get(profileId)?.klas_naam} · {fmt(typeof s.extra_data?.testdatum==="string"?s.extra_data.testdatum:s.bevestigd_op)}</p><h2>{mas.toLocaleString("nl-BE")} km/u</h2><p>VO₂max (schatting volgens profielkaart): {Number.isFinite(mas)?(3.5*mas).toFixed(1):"—"} ml/kg/min</p><p>Afstand: {typeof s.extra_data?.afstand_meter==="number"?`${s.extra_data.afstand_meter} m`:"Niet geregistreerd"}</p><p>Testduur: {typeof s.extra_data?.testduur_seconden==="number"?timeLabel(s.extra_data.testduur_seconden):"Niet geregistreerd"}</p><p>Laatst volledig niveau: {typeof s.extra_data?.laatste_volledige_snelheid==="number"?`${s.extra_data.laatste_volledige_snelheid} km/u`:"Niet geregistreerd"}</p></div>})()}</div>}
    <div style={panel}><h2>Gebruik</h2><p>Start de gezamenlijke test met de MP3 zonder muziek of voer een eerder gemeten MAS handmatig in. Controleer de voorlopige scores en bevestig ze vervolgens in Sportfolio.</p><p style={{ fontSize: 13, opacity: .8 }}>MAS is de bevestigde snelheid in km/u. Bij een STOP tijdens een niveau is de voorgestelde score de snelheid van het laatst volledig voltooide niveau; controleer dit met je eigen beoordelingsafspraken. De profielkaart gebruikt VO₂max = 3,5 × MAS als schatting. Er worden geen Eurofitnormkleuren toegepast zonder MAS-specifieke normtabel.</p></div>
  </AppShell>;
}
