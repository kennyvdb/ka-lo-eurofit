"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const AUDIO = { muziek: "/beep-test/met-muziek-v2.mp3", beeps: "/beep-test/alleen-beeps-v2.mp3" } as const;
const TIMING = "/beep-test/timing-v2.json";
const CACHE = "lo-beeptest-audio-v2";
const DB = "lo-beeptest-v1";
const STORE = "data";
type Group = { id: string; naam: string; schooljaar: string };
type Student = { leerling_email: string; volledige_naam: string; klas_naam: string; group_id?: string | null };
type AttendanceStatus = "deelneemt" | "afwezig" | "geblesseerd";
type SchoolRow = Record<string, unknown>;
type Event = { time_s: number; type: string; level: number; shuttle: number };
type Timing = { audio_start_s: number; events: Event[]; total_duration_s: number; stages: {level:number;shuttles:number;start_s:number;end_s:number}[] };
type Norm = { geslacht: string; leeftijd: number; p5:number; p20:number; p50:number; p80:number; p95:number };
type Result = {
  id: string; session_id: string; email: string; naam: string; klas: string; group_id: string | null;
  level: number; shuttle: number; stopped_at_s: number; saved_at: string;
  sync_status: "pending" | "synced"; confirmed?: boolean; sportfolio_synced?: boolean; archived?: boolean;
  parked?: boolean; parked_reason?: string;
};
const panel: React.CSSProperties = { padding: 16, border: "1px solid rgba(137,194,170,.24)", borderRadius: 20, background: "linear-gradient(180deg,rgba(37,89,113,.34),rgba(19,35,51,.96))", color: "#eaf0ff", marginBottom: 14 };
const button: React.CSSProperties = { minHeight: 48, borderRadius: 14, padding: "10px 14px", background: "linear-gradient(90deg,#255971,#4B8E8D)", color: "#fff", fontWeight: 850, border: "1px solid rgba(137,194,170,.35)", cursor: "pointer" };
const selectStyle: React.CSSProperties = { ...button, width: "100%", background: "#255971", color: "#fff" };
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function put(key: string, value: unknown) {
  const db = await openDb();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  }); } finally { db.close(); }
}
async function get<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  try { return await new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly"); const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined); req.onerror = () => reject(req.error);
  }); } finally { db.close(); }
}
// Supabase geeft vaak een gewoon foutobject terug (geen JavaScript Error).
// Toon de concrete fout in plaats van de nietszeggende melding "Synchronisatie mislukt".
function describeSyncError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint, e.code ? `code: ${e.code}` : null]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (parts.length) return parts.join(" | ");
  }
  return "Onbekende synchronisatiefout. Probeer opnieuw en controleer de netwerkverbinding.";
}

// Serializeert alle lokale resultaatschrijfacties: twee snelle STOP-tikken overschrijven elkaar niet.
let resultQueue: Promise<unknown> = Promise.resolve();
function updateResults(mutator: (rows: Result[]) => Result[]): Promise<Result[]> {
  const operation = resultQueue.then(async () => {
    const old = (await get<Result[]>("results")) ?? [];
    const next = mutator(old);
    await put("results", next);
    return next;
  });
  resultQueue = operation.catch(() => undefined);
  return operation;
}

export default function BeepTestPage() {
  const [tab, setTab] = useState<"invoer" | "controle" | "historiek" | "klassen">("invoer");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectionReady, setSelectionReady] = useState(false);
  const [schoolStudents, setSchoolStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState("");
  const [search, setSearch] = useState("");
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState("");
  const [timing, setTiming] = useState<Timing | null>(null);
  const [track, setTrack] = useState<keyof typeof AUDIO>("muziek");
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [running, setRunning] = useState(false);
  const [position, setPosition] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [review, setReview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [normInfo, setNormInfo] = useState("");
  const [normDiagnostics, setNormDiagnostics] = useState<Record<string,string>>({});
  const [historyClass, setHistoryClass] = useState("");
  const [historyGroup, setHistoryGroup] = useState("");
  const [historyRows, setHistoryRows] = useState<{id:string;leerling_id:string;naam:string;klas:string;datum:string;niveau:number;shuttle:number;afstand:number;duur:number;geslacht:string;geboortedatum:string}[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [norms, setNorms] = useState<Norm[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyDate, setHistoryDate] = useState("latest");
  const [historyExpanded, setHistoryExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("Laad je klasgroep en audio vóór de les.");
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef("");
  const resultsRef = useRef<Result[]>([]);
  const syncBusy = useRef(false);
  const stopLocks = useRef<Set<string>>(new Set());
  const sessionClosingRef = useRef(false);
  const teacherRef = useRef<string | null>(null);
  const authorizedRef = useRef(false);
  const classNames = [...new Set(schoolStudents.map(s => s.klas_naam).filter(Boolean))].sort((a,b) => a.localeCompare(b, "nl", { numeric: true }));
  const candidates = schoolStudents.filter(s => (!className || s.klas_naam === className) && (!search.trim() || `${s.volledige_naam} ${s.klas_naam}`.toLocaleLowerCase("nl").includes(search.trim().toLocaleLowerCase("nl"))));
  const historyDates = [...new Set(historyRows.map(r => r.datum.slice(0, 10)).filter(Boolean))].sort().reverse();
  const historyPupils = [...new Map(historyRows.map(r => [r.naam + "|" + r.klas, { naam:r.naam, klas:r.klas }])).values()]
    .sort((a,b) => a.naam.localeCompare(b.naam,"nl",{numeric:true}));
  const historyVisible = historyPupils.map(p => {
    const matches = historyRows.filter(r => r.naam === p.naam && r.klas === p.klas && (historyDate === "latest" || r.datum.slice(0,10) === historyDate));
    return { ...p, result: matches.sort((a,b)=>b.datum.localeCompare(a.datum))[0] ?? null };
  });
  // Profielen gebruiken M/V; eurofit_normen gebruikt jongen/meisje.
  const normalizeNormGender = (value: string): "jongen" | "meisje" | null => {
    const normalized = value.trim().toLocaleLowerCase("nl-BE");
    if (["m", "man", "j", "jongen", "jongens", "male"].includes(normalized)) return "jongen";
    if (["v", "vrouw", "meisje", "meisjes", "f", "female"].includes(normalized)) return "meisje";
    return null;
  };
   const normForHistory = (r: {niveau:number;shuttle:number;afstand:number;geslacht:string;geboortedatum:string;datum:string}) => {
     if (!r.geboortedatum) return {assessment:null, reason:"Geboortedatum ontbreekt in het leerlingprofiel."};
     const birthday = new Date(r.geboortedatum);
     const tested = new Date(r.datum);
     if (!Number.isFinite(birthday.getTime()) || !Number.isFinite(tested.getTime())) return {assessment:null,reason:"Geboortedatum of testdatum is ongeldig."};
     let age = tested.getFullYear()-birthday.getFullYear();
     if (tested.getMonth()<birthday.getMonth() || (tested.getMonth()===birthday.getMonth() && tested.getDate()<birthday.getDate())) age--;
     const gender = normalizeNormGender(r.geslacht);
     if (!gender) return {assessment:null,reason:`Geslacht ontbreekt of is niet herkend (${r.geslacht || "leeg"}).`};
     const norm = norms.find(n => Number(n.leeftijd) === age && normalizeNormGender(n.geslacht) === gender);
     if (!norm) return {assessment:null,reason:`Geen norm voor ${gender}, ${age} jaar.`};
     const percentiles = [norm.p5,norm.p20,norm.p50,norm.p80,norm.p95].map(Number);
     if (!percentiles.every(Number.isFinite) || percentiles.some((v,i)=>i>0 && v<percentiles[i-1])) return {assessment:null,reason:"Normpercentielen ontbreken of staan niet oplopend."};
     // Eurofit shuttle_run_20m is doorgaans een afstands-/shuttlenorm, niet een niveau.
     // Gebruik afstand wanneer de normen duidelijk in meters staan, shuttles wanneer ze
     // duidelijk aantallen shuttles zijn. Bij onduidelijke eenheden geen categorie gokken.
     const maxNorm = percentiles[4];
     const unit = maxNorm >= 200 ? "meter" : maxNorm >= 25 ? "shuttles" : "niveau";
     const stage = timing?.stages.find(st=>st.level===r.niveau);
     if (unit === "niveau" && (!stage || !stage.shuttles)) return {assessment:null,reason:"Timing voor dit niveau ontbreekt."};
     const value = unit === "meter" ? r.afstand : unit === "shuttles" ? r.afstand / 20 : r.niveau + r.shuttle / stage!.shuttles;
     if (!Number.isFinite(value) || value < 0) return {assessment:null,reason:"Score of afstand ontbreekt."};
     const colors = [
       {label:"Zeer zwak",color:"#7a0000"},
       {label:"Zwak",color:"#ff8c00"},
       {label:"Gemiddeld zwak",color:"#ffc966"},
       {label:"Gemiddeld goed",color:"#a6f3a6"},
       {label:"Goed",color:"#2e8b57"},
       {label:"Zeer goed",color:"#0f5a2f"},
     ];
     const index = value <= percentiles[0] ? 0 : value < percentiles[1] ? 1 : value < percentiles[2] ? 2 : value < percentiles[3] ? 3 : value < percentiles[4] ? 4 : 5;
     return {assessment:colors[index],reason:`${colors[index].label} · ${value.toFixed(unit==="niveau"?2:0)} ${unit} · ${age} jaar`};
   };
  const formatHistoryTime = (seconds:number) => Number.isFinite(seconds) ? `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}` : "—";
  const studentKey = (s: Student) => s.leerling_email.trim().toLowerCase();
  const elapsed = Math.max(0, position - (timing?.audio_start_s ?? 4));
  const last = timing?.events.filter(e => e.time_s <= position && (e.type === "stage_start" || e.type === "shuttle")).at(-1);
  const level = last?.level ?? 1;
  const shuttle = last?.shuttle ?? 0;
  const current = results.filter(r => r.session_id === sessionId && !r.confirmed && !r.sportfolio_synced && !r.archived && !r.parked);
  // Houd de controlelijst stabiel. Sorteren op score liet rijen verspringen zodra één score handmatig werd gewijzigd.
  const reviewRows = [...current].sort((a,b) => a.naam.localeCompare(b.naam,"nl",{numeric:true}) || a.saved_at.localeCompare(b.saved_at));
  const active = students.filter(s => (attendance[studentKey(s)] ?? "deelneemt") === "deelneemt" && !current.some(r => r.email === s.leerling_email));
  const participatingStudents = students.filter(s => (attendance[studentKey(s)] ?? "deelneemt") === "deelneemt");
  const absentCount = students.filter(s => attendance[studentKey(s)] === "afwezig").length;
  const injuredCount = students.filter(s => attendance[studentKey(s)] === "geblesseerd").length;
  const pending = results.filter(r => r.confirmed && !r.archived && r.sync_status !== "synced");
  const sessionSynced = current.filter(r => r.sync_status === "synced").length;
  const sessionPending = current.filter(r => r.sync_status !== "synced").length;
  const applyResults = (rows: Result[]) => { resultsRef.current = rows; setResults(rows); };
  function addStudents(incoming: Student[]) {
    if (running || review) return;
    setStudents(old => {
      const existing = new Set(old.map(studentKey));
      const next = [...old];
      for (const student of incoming) {
        if (!student.leerling_email || existing.has(studentKey(student))) continue;
        existing.add(studentKey(student)); next.push(student);
      }
      return next;
    });
  }
  function removeStudent(email: string) {
    if (running || review) return;
    const key = email.trim().toLowerCase();
    setStudents(old => old.filter(s => studentKey(s) !== key));
    setAttendance(old => { const next = { ...old }; delete next[key]; return next; });
  }
  function setStudentAttendance(student: Student, status: AttendanceStatus) {
    if (running || review) return;
    setAttendance(old => ({ ...old, [studentKey(student)]: status }));
  }

  const syncResults = useCallback(async () => {
    if (syncBusy.current || !authorizedRef.current || !teacherRef.current || !navigator.onLine) return;
    syncBusy.current = true;
    setSyncing(true);
    setSyncError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Aanmelden: ${describeSyncError(authError)}`);
      if (!auth.user || auth.user.id !== teacherRef.current) {
        throw new Error("Meld je opnieuw online aan om te synchroniseren.");
      }

      const rows = (await get<Result[]>("results")) ?? [];
      // Bewaar elke lokale score tot de server de rij met hetzelfde ID bevestigt.
      for (const row of rows.filter(r => r.confirmed && !r.archived && r.sync_status !== "synced")) {
        const label = `${row.naam || row.email} (${row.klas || "klas onbekend"})`;
        const payload = {
          id: row.id, session_id: row.session_id, leerkracht_id: auth.user.id,
          leerling_email: row.email, leerling_naam: row.naam, klas_naam: row.klas,
          klasgroep_id: row.group_id || null, niveau: row.level, shuttle: row.shuttle,
          gestopt_op_seconden: row.stopped_at_s, lokaal_opgeslagen_op: row.saved_at,
        };
        try {
          const { data: existing, error: lookupError } = await supabase
            .from("lo_beeptest_resultaten").select("id").eq("id", row.id).maybeSingle();
          if (lookupError) throw new Error(`Opzoeken: ${describeSyncError(lookupError)}`);
          if (!existing) {
            const { error: insertError } = await supabase.from("lo_beeptest_resultaten").insert(payload);
            if (insertError) {
              // Een dubbele sleutel kan ontstaan als de vorige poging wel opgeslagen werd.
              // Controleer dat op de server voordat we lokaal 'gesynchroniseerd' markeren.
              if (insertError.code !== "23505") throw new Error(`Opslaan: ${describeSyncError(insertError)}`);
              const { data: duplicate, error: duplicateError } = await supabase
                .from("lo_beeptest_resultaten").select("id").eq("id", row.id).maybeSingle();
              if (duplicateError || !duplicate) {
                throw new Error(`Dubbele sleutel niet bevestigd: ${describeSyncError(duplicateError)}`);
              }
            }
          }
          const updated = await updateResults(currentRows => currentRows.map(r =>
            r.id === row.id ? { ...r, sync_status: "synced" as const } : r
          ));
          applyResults(updated);
        } catch (error) {
          throw new Error(`Resultaat ${label}: ${describeSyncError(error)}`);
        }
      }
    } catch (error) {
      setSyncError(describeSyncError(error));
    } finally {
      syncBusy.current = false;
      setSyncing(false);
    }
  }, []);

  async function checkAudio(which: keyof typeof AUDIO) {
    if (!("caches" in window)) { setReady(false); return false; }
    const cache = await caches.open(CACHE);
    const [a, t] = await Promise.all([cache.match(AUDIO[which]), cache.match(TIMING)]);
    const ok = !!a && !!t && !!(await get<Timing>("timing"));
    setReady(ok); return ok;
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const local = (await get<Result[]>("results")) ?? [];
        if (cancelled) return;
        applyResults(local);
        setGroups((await get<Group[]>("groups")) ?? []);
        // Bewaar de samengestelde deelnemerslijst bij een herlaadbeurt.
        const savedTeacher = await get<string>("beep-selection-owner");
        if (savedTeacher) {
          // Selectie pas laden na verificatie van de aangemelde leerkracht.
          setSchoolStudents((await get<Student[]>(`school-students:${savedTeacher}`)) ?? []);
        }
        setTiming((await get<Timing>("timing")) ?? null);
        await checkAudio("muziek");
        const { data } = await supabase.auth.getUser();
        if (cancelled || !data.user) { setMessage("Log online in en bereid de test voor."); return; }
        const profile = await supabase.from("profielen").select("rol").eq("id", data.user.id).maybeSingle();
        if (cancelled || !profile.data || !["lo_leerkracht", "admin"].includes(String(profile.data.rol))) {
          setMessage("Geen toegang tot de leerkrachtenmodule."); return;
        }
        teacherRef.current = data.user.id; authorizedRef.current = true;
        // Oude lokale STOP-rijen kunnen nog als onbevestigd gemarkeerd zijn,
        // terwijl ze al in Sportfolio staan (bv. na een vorige app-versie).
        // Controleer dat eerst op de server; wis nooit een echt onafgewerkte score.
        let restored = (await get<Result[]>("results")) ?? [];
        const unresolved = restored.filter(r => !r.confirmed && !r.sportfolio_synced && !r.archived && !r.parked);
        if (unresolved.length) {
          if (navigator.onLine) {
            // Vergelijk uitsluitend unieke resultaat-ID's; aangepaste niveaus/shuttles
            // veranderen de identiteit van een bevestigde test niet.
            const publishedIds = new Set<string>();
            const {data: discipline, error: disciplineError} = await supabase.from("sportfolio_disciplines")
              .select("id").eq("slug","beep_test").single();
            if (disciplineError || !discipline) throw new Error("Beep-testdiscipline niet gevonden.");
            for (let i=0;i<unresolved.length;i+=100) {
              const {data: published,error: publishedError} = await supabase.from("sportfolio_scores")
                .select("id,extra_data").eq("discipline_id",discipline.id).eq("status","bevestigd")
                .in("id",unresolved.slice(i,i+100).map(r=>r.id));
              if (publishedError) throw new Error(`Bevestigde scores controleren: ${describeSyncError(publishedError)}`);
              for (const score of published ?? []) publishedIds.add(score.id);
            }
            // Migratie van oude app-versies: oude STOP-rijen kregen soms een
            // ander score-ID dan de definitieve Sportfolio-rij. Koppel daarom
            // alleen bij identieke leerling + unieke sessie-ID + testdatum.
            const {data: profiles,error: profileError} = await supabase.from("profielen")
              .select("id,email").in("email",[...new Set(unresolved.map(r=>r.email.trim().toLowerCase()))]);
            if (profileError) throw new Error(describeSyncError(profileError));
            const idByEmail = new Map((profiles??[]).map(p=>[String(p.email).trim().toLowerCase(),p.id]));
            const pupilIds = [...new Set((profiles??[]).map(p=>p.id))];
            for(let i=0;i<pupilIds.length;i+=100){
              const {data: published,error: publishedError}=await supabase.from("sportfolio_scores")
                .select("id,leerling_id,extra_data").eq("discipline_id",discipline.id).eq("status","bevestigd")
                .in("leerling_id",pupilIds.slice(i,i+100)).limit(1000);
              if(publishedError) throw new Error(describeSyncError(publishedError));
              for(const score of published??[]){
                const extra=(score.extra_data && typeof score.extra_data==="object" ? score.extra_data : {}) as Record<string,unknown>;
                for(const row of unresolved){
                  if(row.id===score.id){publishedIds.add(row.id);continue;}
                  if(idByEmail.get(row.email.trim().toLowerCase())!==score.leerling_id) continue;
                  if(extra.session_id!==row.session_id || !row.session_id) continue;
                  // Een sessie-ID is uniek per test; dezelfde leerling kan
                  // binnen die sessie maar één STOP-resultaat hebben.
                  publishedIds.add(row.id);
                }
              }
            }
            if(publishedIds.size){
              restored=await updateResults(rows=>rows.map(r=>publishedIds.has(r.id)
                ? {...r,confirmed:true,sportfolio_synced:true}:r));
              if(!cancelled) applyResults(restored);
            }
          }
          // Alleen werkelijk onafgewerkte resultaten mogen het controlescherm heropenen.
          const stillUnfinished = restored.filter(r => !r.confirmed && !r.sportfolio_synced && !r.archived && !r.parked);
          if (!cancelled && stillUnfinished.length) {
            const latest = [...stillUnfinished].sort((a,b) => b.saved_at.localeCompare(a.saved_at))[0];
            setSessionId(latest.session_id);
            sessionRef.current = latest.session_id;
            setReview(true);
            setTab("controle");
            setMessage("Er staan nog niet-bevestigde STOP-scores klaar. Controleer ze voordat je een nieuwe test start.");
          }
        }
        const savedOwner = await get<string>("beep-selection-owner");
        if (savedOwner && savedOwner !== data.user.id) { setStudents([]); setSchoolStudents([]); }
        await put("beep-selection-owner", data.user.id);
        // Een nieuwe pagina opent altijd met een blanco deelnemerslijst.
        // Onbevestigde STOP-scores blijven afzonderlijk bewaard in "results"
        // en kunnen via het controlescherm nog worden bevestigd.
        setStudents([]);
        setGroupId("");
        await put(`beep-selection:${data.user.id}`, []);
        setSelectionReady(true);
        setSchoolStudents((await get<Student[]>(`school-students:${data.user.id}`)) ?? []);
        setTeacherId(data.user.id); setAuthorized(true);
        const { data: gs, error } = await supabase.from("lo_klasgroepen").select("id,naam,schooljaar")
          .eq("leerkracht_id", data.user.id).order("naam");
        if (error) throw error;
        const list = (gs ?? []) as Group[]; setGroups(list); await put("groups", list);
        /* Synchronisatie start na bevestiging. */
        setLoadingSchool(true);
        try {
          // Zelfde gegevensbron en paginering als de werkende pagina Klasgroepen.
          const rows: SchoolRow[] = [];
          for (let from = 0; ; from += 1000) {
            const response = await supabase.from("eurofit_class_students_view")
              .select("*").order("email", { ascending: true }).range(from, from + 999);
            if (response.error) throw new Error([response.error.message, response.error.details, response.error.hint, response.error.code].filter(Boolean).join(" | "));
            const batch = (response.data ?? []) as SchoolRow[];
            rows.push(...batch);
            if (batch.length < 1000) break;
          }
          const text = (row: SchoolRow, keys: string[]) => {
            for (const key of keys) {
              const value = row[key];
              if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
            }
            return "";
          };
          const unique = new Map<string, Student>();
          for (const row of rows) {
            const email = text(row, ["email"]).toLowerCase();
            const klas = text(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"]);
            if (!email || !/^[0-9]/.test(klas)) continue;
            const name = text(row, ["volledige_naam", "naam", "full_name", "name"])
              || `${text(row, ["given_name"])} ${text(row, ["family_name"])}`.trim()
              || email;
            // Een leerling verschijnt maar één keer in de selectielijst.
            if (!unique.has(email)) unique.set(email, {
              leerling_email: email, volledige_naam: name, klas_naam: klas, group_id: null,
            });
          }
          const list = [...unique.values()].sort((a,b) =>
            a.klas_naam.localeCompare(b.klas_naam, "nl-BE", { numeric: true })
            || a.volledige_naam.localeCompare(b.volledige_naam, "nl-BE"));
          if (!cancelled) {
            setSchoolStudents(list);
            await put(`school-students:${data.user.id}`, list);
            setSchoolError(list.length ? "" : "De leerlingenview gaf geen bruikbare officiële klassen terug.");
          }
        } catch (error) {
          if (!cancelled) setSchoolError(`Officiële klassen konden niet vernieuwd worden: ${error instanceof Error ? error.message : "onbekende fout"}. Controleer de toegang tot eurofit_class_students_view.`);
        } finally { if (!cancelled) setLoadingSchool(false); }
      } catch { if (!cancelled) setMessage("Geen verbinding. Gebruik eerder voorbereide audio en klasgroepen; synchronisatie volgt online."); }
    })();
    const onOnline = () => { /* Alleen na bevestiging publiceren. */ };
    window.addEventListener("online", onOnline);
    return () => { cancelled = true; window.removeEventListener("online", onOnline); if (timer.current) clearInterval(timer.current); audio.current?.pause(); };
  }, [syncResults]);
  useEffect(() => { void checkAudio(track); }, [track]);
  useEffect(() => {
    if (!groupId || !authorized) return;
    let cancelled = false;
    (async () => {
      const key = `students:${teacherId}:${groupId}`;
      const local = (await get<Student[]>(key)) ?? [];
      if (!cancelled && local.length) addStudents(local.map(s => ({ ...s, group_id: groupId })));
      try {
        const { data, error } = await supabase.from("lo_klasgroep_leden_view")
          .select("leerling_email,volledige_naam,klas_naam").eq("klasgroep_id", groupId).order("positie");
        if (error) throw error;
        const list = (data ?? []).filter(x => x.leerling_email) as Student[];
        if (!cancelled) { addStudents(list.map(s => ({ ...s, group_id: groupId }))); await put(key, list); }
      } catch { if (!cancelled) setMessage("Offline: eerder bewaarde leerlingen geladen, indien beschikbaar."); }
    })();
    return () => { cancelled = true; };
  }, [groupId, authorized, teacherId]);

  useEffect(() => {
    if (!teacherId || !selectionReady || running || review) return;
    void put(`beep-selection:${teacherId}`, students).catch(() => setMessage("De deelnemerslijst kon niet lokaal bewaard worden."));
  }, [students, teacherId, running]);

  async function downloadAudio() {
    setDownloading(true); setMessage("Audio wordt opgeslagen. Houd de pagina open.");
    try {
      const cache = await caches.open(CACHE);
      for (const path of [TIMING, AUDIO[track]]) {
        if (await cache.match(path)) continue;
        const response = await fetch(path, { cache: "reload" });
        if (!response.ok) throw new Error(`Download mislukt: ${path}`);
        await cache.put(path, response);
      }
      const t = await (await cache.match(TIMING))!.json() as Timing;
      await put("timing", t); setTiming(t);
      if (!(await checkAudio(track))) throw new Error("Offlinecontrole mislukt.");
      setMessage("Audio en timing lokaal beschikbaar. Test vooraf ook in vliegtuigmodus.");
    } catch (error) { setReady(false); setMessage(error instanceof Error ? error.message : "Download mislukt."); }
    finally { setDownloading(false); }
  }
  async function start() {
    if (!authorized || !ready || !timing || !participatingStudents.length || running) return;
    if (review) setReview(false);
    const cache = await caches.open(CACHE); const response = await cache.match(AUDIO[track]);
    if (!response) { setReady(false); return; }
    const url = URL.createObjectURL(await response.blob());
    const player = new Audio(url); audio.current = player;
    player.onended = () => { setRunning(false); if (timer.current) clearInterval(timer.current); URL.revokeObjectURL(url); };
    player.onerror = () => { setRunning(false); setMessage("Audio onderbroken: controleer de resultaten."); URL.revokeObjectURL(url); };
    try {
      await player.play();
      const id = crypto.randomUUID(); stopLocks.current.clear(); sessionClosingRef.current = false;
      sessionRef.current = id; setSessionId(id); setPosition(0); setRunning(true);
      setMessage("Test loopt. Scores worden lokaal bewaard; Sportfolio wordt pas na bevestiging bijgewerkt.");
      timer.current = setInterval(() => {
        setPosition(player.currentTime);
        if (player.paused && !player.ended) { setRunning(false); setMessage("Audio onderbroken: controleer de testsessie."); }
      }, 120);
    } catch { URL.revokeObjectURL(url); setMessage("Audio kon niet starten. Controleer de geluidsinstellingen."); }
  }
  async function stopStudent(student: Student) {
    const sid = sessionRef.current;
    const key = studentKey(student);
    if ((attendance[key] ?? "deelneemt") !== "deelneemt") return;
    if (!running || sessionClosingRef.current || !sid || !audio.current || stopLocks.current.has(key)) return;
    if (resultsRef.current.some(r => r.session_id === sid && r.email.trim().toLowerCase() === key)) return;
    stopLocks.current.add(key);
    const at = audio.current.currentTime;
    const e = timing?.events.filter(x => x.time_s <= at && (x.type === "stage_start" || x.type === "shuttle")).at(-1);
    if (!e) { stopLocks.current.delete(key); return; }
    const completed = e.type === "stage_start" && e.level > 1 ? { level:e.level-1, shuttle:timing?.stages.find(s => s.level === e.level-1)?.shuttles ?? 0 } : e;
    const record: Result = { id: crypto.randomUUID(), session_id: sid, email: student.leerling_email, naam: student.volledige_naam, klas: student.klas_naam, group_id: student.group_id ?? null, level: completed.level, shuttle: completed.shuttle, stopped_at_s: at, saved_at: new Date().toISOString(), sync_status: "pending", confirmed: false, sportfolio_synced: false };
    try {
      const updated = await updateResults(rows => rows.some(r => r.session_id === sid && r.email.trim().toLowerCase() === key) ? rows : [...rows, record]);
      applyResults(updated);
      setMessage(`${student.volledige_naam}: lokaal bewaard. Bevestig na STOP ALL.`);
    } catch { stopLocks.current.delete(key); setMessage("LOKALE OPSLAG MISLUKT: noteer deze score onmiddellijk handmatig!"); }
  }

  async function stopAll() {
    if (!running || sessionClosingRef.current) return;
    sessionClosingRef.current = true;
    setPosition(audio.current?.currentTime ?? position); audio.current?.pause(); setRunning(false);
    if (timer.current) clearInterval(timer.current);
    try { await resultQueue; const latest = (await get<Result[]>("results")) ?? []; applyResults(latest); }
    catch { setMessage("Niet alle STOP-scores konden lokaal gecontroleerd worden. Controleer de resultaten zorgvuldig."); }
    setReview(true); setTab("controle");
    setMessage("Test gestopt. Controleer de scores van leerlingen die op STOP gedrukt zijn.");
  }
  async function editScore(id: string, field: "level" | "shuttle", value: number) {
    if (!timing || publishing || running || !review) return;
    const next = await updateResults(rows => rows.map(r => {
      if (r.id !== id || r.confirmed) return r;
      const level = field === "level" ? value : r.level;
      const stage = timing.stages.find(s => s.level === level);
      if (!stage) return r;
      const shuttle = field === "level" ? Math.min(r.shuttle, stage.shuttles) : value;
      if (!Number.isInteger(shuttle) || shuttle < 0 || shuttle > stage.shuttles) return r;
      return { ...r, level, shuttle };
    }));
    applyResults(next);
  }

  async function loadHistory() {
    if (!authorized || !teacherId || (!historyClass && !historyGroup)) return;
    setHistoryLoading(true); setHistoryError(""); setHistoryLoaded(false);
    try {
      let emails: string[] = [];
      if (historyGroup) {
        const {data, error} = await supabase.from("lo_klasgroep_leden_view")
          .select("leerling_email").eq("klasgroep_id",historyGroup);
        if (error) throw error;
        emails = (data ?? []).map(x => String(x.leerling_email ?? "").trim().toLowerCase()).filter(Boolean);
      }
      const {data: profiles, error: profileError} = historyGroup
        ? emails.length ? await supabase.from("profielen").select("id,email,volledige_naam,klas_naam,geslacht,geboortedatum").in("email",emails)
          : {data:[],error:null}
        : await supabase.from("profielen").select("id,email,volledige_naam,klas_naam,geslacht,geboortedatum").eq("klas_naam",historyClass);
      if (profileError) throw profileError;
      const pupils = profiles ?? [];
      if (!pupils.length) {setHistoryRows([]);setHistoryLoaded(true);return;}
      const {data: discipline,error: disciplineError} = await supabase.from("sportfolio_disciplines")
        .select("id").eq("slug","beep_test").single();
      if (disciplineError || !discipline) throw disciplineError ?? new Error("Beep-testdiscipline niet gevonden.");
      const {data:normData,error:normError}=await supabase.from("eurofit_normen")
        .select("geslacht,leeftijd,p5,p20,p50,p80,p95").eq("test_type","shuttle_run_20m");
      if(normError) throw new Error(`Eurofit-normen laden: ${describeSyncError(normError)}`);
      setNorms((normData??[]) as Norm[]);
      setNormInfo((normData??[]).length ? `${(normData??[]).length} normrijen geladen.` : "Geen normen gevonden voor test_type shuttle_run_20m. Controleer de test_type-waarde in eurofit_normen.");
      const byId = new Map(pupils.map(p=>[p.id,p]));
      const all: {id:string;leerling_id:string;score_tekst:string|null;score_nummer:number|null;bevestigd_op:string|null;extra_data:unknown}[] = [];
      const ids = pupils.map(p=>p.id);
      for (let i=0;i<ids.length;i+=100) {
        const {data,error} = await supabase.from("sportfolio_scores")
          .select("id,leerling_id,score_tekst,score_nummer,bevestigd_op,extra_data")
          .eq("discipline_id",discipline.id).eq("status","bevestigd").in("leerling_id",ids.slice(i,i+100))
          .order("bevestigd_op",{ascending:false}).limit(1000);
        if (error) throw error;
        all.push(...(data ?? []));
      }
      const rows = all.map(r=>{
        const p = byId.get(r.leerling_id);
        const extra = (r.extra_data && typeof r.extra_data === "object" ? r.extra_data : {}) as Record<string,unknown>;
        const parts = String(r.score_tekst ?? "").split(".");
        return {id:r.id,leerling_id:r.leerling_id,naam:String(p?.volledige_naam ?? p?.email ?? "Leerling"),klas:String(p?.klas_naam ?? ""),
          datum:String(extra.testdatum ?? r.bevestigd_op ?? ""),
          niveau:Number(extra.niveau ?? parts[0] ?? 0),shuttle:Number(extra.shuttle ?? parts[1] ?? 0),
          afstand:Number(extra.afstand_meter ?? 0),duur:Number(extra.testduur_seconden ?? (Number(r.score_nummer ?? 0)*60)),
          geslacht:String(p?.geslacht ?? ""),geboortedatum:String(p?.geboortedatum ?? "")};
      }).sort((a,b)=>a.naam.localeCompare(b.naam,"nl",{numeric:true}) || b.datum.localeCompare(a.datum));
      setHistoryRows(rows);setHistoryDate("latest");setHistoryExpanded(null);setHistoryLoaded(true);
    } catch(error) {setHistoryError(describeSyncError(error));setHistoryRows([]);setNormInfo("");}
    finally {setHistoryLoading(false);}
  }

  // Een oude lokale registratie kan een ander ID hebben dan de bevestigde Sportfolio-score.
  // Verberg ze uitsluitend na een expliciete keuze én controle op een bestaande bevestigde score.
  // Dit schrijft niets naar Sportfolio en verwijdert geen lokale gegevens.
  async function archiveOldStopScore(row: Result) {
    if (running || publishing || archivingId || !navigator.onLine || !teacherId) return;
    setArchivingId(row.id); setPublishError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== teacherId) throw new Error("Meld je opnieuw aan.");
      const { data: profile, error: profileError } = await supabase.from("profielen")
        .select("id").eq("email", row.email.trim().toLowerCase()).maybeSingle();
      if (profileError || !profile) throw new Error("Leerlingprofiel niet gevonden.");
      const { data: discipline, error: disciplineError } = await supabase.from("sportfolio_disciplines")
        .select("id").eq("slug", "beep_test").single();
      if (disciplineError || !discipline) throw new Error("Beep-testdiscipline niet gevonden.");
       const { data: confirmed, error: scoreError } = await supabase.from("sportfolio_scores")
         .select("id,extra_data,bevestigd_op,bevestigd_door,score_tekst")
         .eq("leerling_id", profile.id).eq("discipline_id", discipline.id)
         .eq("status", "bevestigd").order("bevestigd_op", {ascending:false}).limit(100);
       if (scoreError) throw new Error(describeSyncError(scoreError));
       const sameSession = (confirmed ?? []).some(score => {
         const extra = score.extra_data && typeof score.extra_data === "object"
           ? score.extra_data as Record<string, unknown> : {};
         return score.id === row.id || (Boolean(row.session_id) && extra.session_id === row.session_id);
       });
       // Oude app-versies gebruikten een ander score-ID en sloegen het sessie-ID niet
       // altijd op. Dan alleen handmatig verbergen na een expliciete controle van
       // de leerling en een bevestigde score op dezelfde kalenderdag.
       const day = row.saved_at.slice(0,10);
       const sameDay = (confirmed ?? []).filter(score => {
         const extra = score.extra_data && typeof score.extra_data === "object"
           ? score.extra_data as Record<string, unknown> : {};
         const date = String(extra.testdatum ?? score.bevestigd_op ?? "").slice(0,10);
         return date === day && (!score.bevestigd_door || score.bevestigd_door === teacherId);
       });
       if (!sameSession && sameDay.length !== 1) throw new Error(
         `Geen eenduidig bevestigde score voor ${row.naam} op ${day} gevonden. De lokale registratie blijft bewaard.`
       );
       if (!sameSession && !window.confirm(
         `${row.naam}: lokale STOP-score ${row.level}.${row.shuttle} verbergen?\n` +
         `Bevestigde Sportfolio-score op ${day}: ${sameDay[0].score_tekst ?? "onbekend"}.\n` +
         "Dit verandert niets in Sportfolio. Kies Annuleren als dit niet dezelfde test is."
       )) return;
      const updated = await updateResults(rows => rows.map(r => r.id === row.id ? { ...r, archived: true } : r));
      applyResults(updated);
      if (!updated.some(r => r.session_id === row.session_id && !r.confirmed && !r.sportfolio_synced && !r.archived)) {
        setReview(false); setSessionId(""); sessionRef.current = ""; setStudents([]); setAttendance({}); setGroupId("");
      }
      setMessage(`${row.naam}: oude STOP-registratie verborgen; bevestigde Sportfolio-score ongewijzigd.`);
    } catch (error) { setPublishError(describeSyncError(error)); }
    finally { setArchivingId(null); }
  }

  async function parkUnpublishableResult(row: Result, reason: string) {
    const updated = await updateResults(rows => rows.map(r => r.id === row.id ? { ...r, parked: true, parked_reason: reason } : r));
    applyResults(updated);
  }

  async function confirmAndPublish() {
    if (!timing || !teacherId || !navigator.onLine || !reviewRows.length || publishing) {
      setPublishError("Voor bevestigen is een internetverbinding en minstens één STOP-score nodig."); return;
    }
    setPublishing(true); setPublishError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== teacherId) throw new Error("Meld je opnieuw aan als LO-leerkracht.");
      const { data: discipline, error: disciplineError } = await supabase.from("sportfolio_disciplines").select("id").eq("slug", "beep_test").single();
      if (disciplineError || !discipline) throw new Error("Discipline beep_test niet gevonden.");
      const emails = [...new Set(reviewRows.map(r => r.email.trim().toLowerCase()).filter(Boolean))];
      const { data: profiles, error: profileError } = await supabase.from("profielen").select("id,email,schooljaar,klas_naam,leerjaar,graad,geslacht,volledige_naam").in("email", emails);
      if (profileError) throw new Error(`Leerlingen opzoeken: ${describeSyncError(profileError)}`);
      const byEmail = new Map((profiles ?? []).map(p => [String(p.email).trim().toLowerCase(),p]));
      const problems: string[] = []; let publishedCount = 0;
      for (const r of reviewRows) {
        if (r.sportfolio_synced) continue;
        const profile = byEmail.get(r.email.trim().toLowerCase());
        if (!profile?.id || !profile.schooljaar) {
          await parkUnpublishableResult(r, `Geen uniek bruikbaar profiel/schooljaar voor ${r.naam}.`);
          problems.push(`${r.naam}: niet gepubliceerd (profiel/schooljaar ontbreekt)`); continue;
        }
        const stage = timing.stages.find(st => st.level === r.level);
        if (!stage || !Number.isInteger(r.shuttle) || r.shuttle < 0 || r.shuttle > stage.shuttles) {
          await parkUnpublishableResult(r, `Ongeldige score ${r.level}.${r.shuttle}.`);
          problems.push(`${r.naam}: ongeldige score`); continue;
        }
        try {
          const previousShuttles = timing.stages.filter(st => st.level < r.level).reduce((sum,st) => sum+st.shuttles,0);
          const totalShuttles = previousShuttles + r.shuttle;
          const durationSeconds = r.shuttle === 0 ? stage.start_s - timing.audio_start_s : stage.start_s + r.shuttle*(stage.end_s-stage.start_s)/stage.shuttles - timing.audio_start_s;
          const payload = { id:r.id, leerling_id:profile.id, discipline_id:discipline.id, schooljaar:profile.schooljaar, klas_naam:profile.klas_naam ?? r.klas, score_nummer:Number((durationSeconds/60).toFixed(4)), score_tekst:`${r.level}.${r.shuttle}`, eenheid:"min", status:"bevestigd", bevestigd_door:teacherId, bevestigd_op:new Date().toISOString(), extra_data:{bron:"lo_beeptest",session_id:r.session_id,protocol_id:"leger_20m_8p5_fixed_shuttles_v2_countdown",niveau:r.level,shuttle:r.shuttle,totaal_shuttles:totalShuttles,afstand_meter:totalShuttles*20,testduur_seconden:Number(durationSeconds.toFixed(3)),testdatum:r.saved_at}, leerjaar_snapshot:profile.leerjaar ? Number(profile.leerjaar)||null:null, graad_snapshot:profile.graad ? Number(profile.graad)||null:null, geslacht_snapshot:profile.geslacht, naam_snapshot:profile.volledige_naam ?? r.naam };
          const { data: existing, error: lookupError } = await supabase.from("sportfolio_scores").select("id,leerling_id,discipline_id").eq("id",r.id).maybeSingle();
          if (lookupError) throw new Error(describeSyncError(lookupError));
          if (existing && (existing.leerling_id !== profile.id || existing.discipline_id !== discipline.id)) throw new Error("Score-ID-conflict; niets overschreven.");
          if (!existing) { const { error } = await supabase.from("sportfolio_scores").insert(payload); if (error && error.code !== "23505") throw new Error(describeSyncError(error)); }
          const next = await updateResults(rows => rows.map(x => x.id===r.id ? {...x,confirmed:true,sportfolio_synced:true,parked:false,parked_reason:undefined}:x)); applyResults(next); publishedCount++;
        } catch (error) { problems.push(`${r.naam}: ${describeSyncError(error)}`); }
      }
      const latest=(await get<Result[]>("results"))??[]; applyResults(latest);
      const remaining=latest.filter(r=>r.session_id===sessionId&&!r.confirmed&&!r.sportfolio_synced&&!r.archived&&!r.parked);
      if(!remaining.length){ setReview(false); setStudents([]); setAttendance({}); setGroupId(""); setClassName(""); setSearch(""); setSessionId(""); sessionRef.current=""; setPosition(0); await put(`beep-selection:${teacherId}`,[]); }
      setHistoryLoaded(false);
      if(problems.length) setPublishError(`${publishedCount} score(s) gepubliceerd. ${problems.join(" · ")}. Probleemregistraties zijn lokaal apart gezet en blokkeren geen nieuwe test.`);
      else setMessage("Bevestigde Beep-testresultaten staan in Sportfolio.");
      void syncResults();
    } catch(error){ setPublishError(describeSyncError(error)); } finally { setPublishing(false); }
  }

  async function deleteHistoryScores(rowsToDelete: typeof historyRows, label: string) {
    if (!teacherId || !authorized || !navigator.onLine || !rowsToDelete.length) return;
    const ok = window.confirm(`${label}\n\nJe verwijdert ${rowsToDelete.length} bevestigde Beep-testscore(s). Dit kan niet ongedaan worden gemaakt. Doorgaan?`);
    if (!ok) return;
    const typed = rowsToDelete.length > 1 ? window.confirm("Laatste controle: wil je deze scores definitief wissen?") : true;
    if (!typed) return;
    setHistoryLoading(true); setHistoryError("");
    try {
      const {data:auth,error:authError}=await supabase.auth.getUser();
      if(authError || auth.user?.id!==teacherId) throw new Error("Meld je opnieuw aan als LO-leerkracht.");
      const {data:me,error:meError}=await supabase.from("profielen").select("rol").eq("id",teacherId).maybeSingle();
      if(meError || !me || !["lo_leerkracht","admin"].includes(String(me.rol))) throw new Error("Geen toestemming om Beep-testscores te wissen.");
      const ids=rowsToDelete.map(r=>r.id);
      const {data:discipline,error:disciplineError}=await supabase.from("sportfolio_disciplines").select("id").eq("slug","beep_test").single();
      if(disciplineError || !discipline) throw new Error("Discipline beep_test niet gevonden.");
      for(let i=0;i<ids.length;i+=100){
        const batch=ids.slice(i,i+100);
        const {error}=await supabase.from("sportfolio_scores").delete().eq("discipline_id",discipline.id).in("id",batch);
        if(error) throw new Error(describeSyncError(error));
      }
      // Ook lokaal markeren, zodat een verwijderde score nooit opnieuw gesynchroniseerd wordt.
      const deleted=new Set(ids);
      const local=await updateResults(rows=>rows.map(r=>deleted.has(r.id)?{...r,archived:true,confirmed:true,sportfolio_synced:true,sync_status:"synced" as const}:r));
      applyResults(local);
      setHistoryRows(old=>old.filter(r=>!deleted.has(r.id)));
      setMessage(`${rowsToDelete.length} Beep-testscore(s) definitief verwijderd.`);
    } catch(error){ setHistoryError(describeSyncError(error)); } finally { setHistoryLoading(false); }
  }

  function backup() {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), results: pending }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "beeptest-niet-gesynchroniseerde-scores.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  return <AppShell title="LO App" subtitle="Beep Test">
    <div style={panel}><h1 style={{ fontSize: 24, fontWeight: 900 }}>🏃 Beep Test</h1>

      <p role="status">{message}</p></div>
    <nav aria-label="Beep-test tabbladen" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
      {([
        ["invoer", "✎ Scores invoeren"],
        ["controle", `✓ Te bevestigen (${reviewRows.length})`],
        ["historiek", "▥ Historiek"],
        ["klassen", "♙ Overzicht klassen"],
      ] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)}
        aria-current={tab === key ? "page" : undefined}
        style={{ ...button, flex: "1 1 160px", background: tab === key ? "linear-gradient(90deg,#255971,#4B8E8D)" : "#17354b" }}>{label}</button>)}
    </nav>
    {running && tab !== "invoer" && <div style={panel} role="status">▶ De test loopt nog. Ga naar ‘Scores invoeren’ om leerlingen te registreren.</div>}
    {tab === "invoer" && <>
    <div style={panel}><h2>1. Audio voorbereiden</h2>
      <select aria-label="Audioversie" value={track} disabled={running || review} onChange={e => setTrack(e.target.value as keyof typeof AUDIO)} style={selectStyle}>
        <option value="muziek">Met muziek</option><option value="beeps">Alleen beeps</option></select>
      <p>{ready ? "✅ Audio en timing lokaal beschikbaar" : "⚠️ Gekozen audioversie nog niet offline klaar"}</p>
      <button style={button} disabled={downloading || running} onClick={() => void downloadAudio()}>{downloading ? "Downloaden…" : "Audio offline beschikbaar maken"}</button></div>
    <div style={panel}><h2>2. Deelnemers samenstellen</h2>
      <p>Voeg je eigen klasgroep toe en vink daarnaast leerlingen uit andere officiële klassen aan. Alles loopt in één gezamenlijke test op deze iPhone.</p>
      <label htmlFor="beep-group">Mijn klasgroep toevoegen</label>
      <select id="beep-group" value={groupId} disabled={running || review} onChange={e => setGroupId(e.target.value)} style={selectStyle}>
        <option value="">Kies een klasgroep</option>{groups.map(g => <option key={g.id} value={g.id}>{g.naam} · {g.schooljaar}</option>)}
      </select>
      <p style={{ fontSize: 13, opacity: .8 }}>Bij het kiezen worden de leerlingen toegevoegd; je bestaande deelnemers blijven staan.</p>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(137,194,170,.25)" }}>
        <h3>Leerlingen uit andere klassen toevoegen</h3>
        <label htmlFor="beep-class">Officiële klas</label>
        <select id="beep-class" value={className} disabled={running || review} onChange={e => setClassName(e.target.value)} style={selectStyle}>
          <option value="">Alle officiële klassen</option>{classNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <label htmlFor="beep-search" style={{ display: "block", marginTop: 12 }}>Zoek op naam of klas</label>
        <input id="beep-search" value={search} disabled={running || review} onChange={e => setSearch(e.target.value)} placeholder="Zoek een leerling…" style={{ ...selectStyle, boxSizing: "border-box" }} />
        {loadingSchool && <p>Officiële klassen laden…</p>}
        {schoolError && <p role="alert" style={{ color: "#ffd2a8" }}>{schoolError}</p>}
        {!loadingSchool && !schoolStudents.length && <p>Geen officiële leerlingen beschikbaar. Controleer de verbinding en de toegang tot de schoolgegevens.</p>}
        <p>{candidates.length} leerlingen gevonden. Vink leerlingen aan om ze aan de gezamenlijke test toe te voegen.</p>
        {className && <button type="button" style={button} disabled={running} onClick={() => addStudents(candidates)}>+ Volledige gekozen klas toevoegen</button>}
        <div style={{ maxHeight: 300, overflowY: "auto", marginTop: 10, display: "grid", gap: 7 }}>
          {candidates.map(s => {
            const added = students.some(x => studentKey(x) === studentKey(s));
            return <label key={`${s.leerling_email}:${s.klas_naam}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, background: "rgba(255,255,255,.06)", cursor: running ? "default" : "pointer" }}>
              <input type="checkbox" checked={added} disabled={running} onChange={e => e.target.checked ? addStudents([s]) : removeStudent(s.leerling_email)} style={{ width: 20, height: 20, accentColor: "#4B8E8D", flexShrink: 0 }} />
              <span>{s.volledige_naam} <small style={{ opacity: .7 }}>· {s.klas_naam}</small></span>
            </label>;
          })}
        </div>
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(137,194,170,.25)" }}>
        <h3>Geselecteerd voor deze test: {students.length}</h3>
        <p style={{ fontSize: 13, opacity: .8 }}>Duid vóór de start per leerling aan: neemt deel, afwezig of geblesseerd. Alleen deelnemers krijgen tijdens de test een STOP-knop. Tijdens de test blijft deze status vaststaan.</p>
        <div style={{ display: "grid", gap: 7 }}>
          {students.map(s => {
            const status = attendance[studentKey(s)] ?? "deelneemt";
            return <div key={studentKey(s)} style={{ display: "grid", gridTemplateColumns: "minmax(150px,1fr) minmax(130px,180px) auto", alignItems: "center", gap: 8, padding: 8, border: "1px solid rgba(137,194,170,.2)", borderRadius: 10 }}>
              <span>{s.volledige_naam} <small style={{ opacity: .7 }}>· {s.klas_naam}</small></span>
              <select aria-label={`Status ${s.volledige_naam}`} value={status} disabled={running || review} onChange={e => setStudentAttendance(s, e.target.value as AttendanceStatus)} style={{ ...selectStyle, minHeight: 40, padding: "6px 9px" }}>
                <option value="deelneemt">✓ Neemt deel</option><option value="afwezig">○ Afwezig</option><option value="geblesseerd">✚ Geblesseerd</option>
              </select>
              <button type="button" disabled={running || review} onClick={() => removeStudent(s.leerling_email)} style={{ ...button, minHeight: 36, padding: "6px 10px", background: "#71394b" }} aria-label={`Verwijder ${s.volledige_naam}`}>✕</button>
            </div>;
          })}
        </div>
      </div>
    </div>
    <div style={panel}><h2>3. Gezamenlijke test</h2><p>Niveau {level} · shuttle {shuttle} · {elapsed.toFixed(1)} sec sinds startsignaal</p><p style={{fontSize:13,opacity:.8}}>Oude of niet-publiceerbare resultaten blokkeren nooit een nieuwe test.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={button} disabled={!authorized || !ready || !participatingStudents.length || running} onClick={() => void start()}>▶ Start test</button>
        <button style={{ ...button, background: "#71394b" }} disabled={!running} onClick={() => void stopAll()}>■ STOP ALL</button>
      </div>
      <p>Actief: {active.length} / {participatingStudents.length} · Afwezig: {absentCount} · Geblesseerd: {injuredCount}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 10 }}>
        {students.map(s => {
          const done = current.find(r => r.email === s.leerling_email);
          const status = attendance[studentKey(s)] ?? "deelneemt";
          const excluded = status !== "deelneemt";
          return <div key={s.leerling_email} style={{ border: "1px solid rgba(137,194,170,.28)", borderRadius: 14, padding: 12, minWidth: 0, opacity: excluded ? .65 : 1 }}>
            <strong>{s.volledige_naam}</strong><p>{s.klas_naam}</p>
            <button style={{ ...button, width: "100%", background: done ? "#89C2AA" : excluded ? "#48576a" : "linear-gradient(90deg,#255971,#4B8E8D)", color: done ? "#102b32" : "#fff" }} disabled={!running || !!done || excluded} onClick={() => void stopStudent(s)}>
              {done ? `Bewaard: ${done.level}.${done.shuttle}${done.sync_status === "synced" ? " ✓" : " · lokaal"}` : status === "afwezig" ? "Afwezig" : status === "geblesseerd" ? "Geblesseerd" : "STOP leerling"}
            </button>
          </div>;
        })}
      </div></div>
    </>}
    {tab === "controle" && <>
    {review && <div style={panel}><h2>4. STOP ALL · scores controleren</h2>
      <p>Alleen leerlingen met een STOP-score verschijnen. Controleer niveau en laatst volledig afgelegde shuttle.</p>
      {reviewRows.map(r => <div key={r.id} style={{border:"1px solid #668",padding:12,borderRadius:12,marginBottom:10}}>
        <strong>{r.naam}</strong> · {r.klas} {r.sportfolio_synced ? "✓ Bevestigd" : ""}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>
          <label>Niveau <select style={selectStyle} value={r.level} disabled={publishing || r.confirmed} onChange={e=>void editScore(r.id,"level",Number(e.target.value))}>
            {timing?.stages.map(s=><option key={s.level} value={s.level}>{s.level}</option>)}</select></label>
          <label>Shuttle <select style={selectStyle} value={r.shuttle} disabled={publishing || r.confirmed} onChange={e=>void editScore(r.id,"shuttle",Number(e.target.value))}>
            {Array.from({length:(timing?.stages.find(s=>s.level===r.level)?.shuttles ?? 0)+1},(_,i)=><option key={i} value={i}>{i}</option>)}</select></label>
        </div>
        <button type="button" style={{...button,marginTop:10,background:"#48576a"}} disabled={publishing || !!archivingId || !navigator.onLine} onClick={()=>void archiveOldStopScore(r)}>{archivingId===r.id ? "Bevestigde score controleren…" : "Oude registratie verbergen (alleen indien al bevestigd)"}</button>
      </div>)}
      {publishError && <p role="alert" style={{color:"#ffb8b8"}}>{publishError}</p>}
      <button style={button} disabled={publishing || !reviewRows.length} onClick={()=>void confirmAndPublish()}>
        {publishing ? "Bevestigde scores opslaan…" : "Opslaan als bevestigd in Sportfolio"}</button>
    </div>}
    {!review && <div style={panel}><h2>Te bevestigen resultaten</h2><p>Er zijn momenteel geen onafgewerkte STOP-scores. Start een test in ‘Scores invoeren’ en tik op STOP ALL om resultaten te controleren.</p></div>}
    </>}
    {tab === "historiek" && <>
    <div style={panel}><h2>5. Historiek per klasgroep</h2>
      <p>Bekijk de bevestigde Beep-testresultaten in één oogopslag. Dit overzicht is gescheiden van je blanco deelnemerslijst.</p>
      <label htmlFor="history-class">Officiële klas</label>
      <select id="history-class" style={selectStyle} value={historyClass} disabled={historyLoading}
        onChange={e=>{setHistoryClass(e.target.value);setHistoryGroup("");setHistoryLoaded(false);setHistoryRows([]);}}>
        <option value="">Kies een officiële klas</option>
        {classNames.map(name=><option key={name} value={name}>{name}</option>)}
      </select>
      <label htmlFor="history-group" style={{display:"block",marginTop:12}}>Of mijn LO-klasgroep</label>
      <select id="history-group" style={selectStyle} value={historyGroup} disabled={historyLoading}
        onChange={e=>{setHistoryGroup(e.target.value);setHistoryClass("");setHistoryLoaded(false);setHistoryRows([]);}}>
        <option value="">Kies een LO-klasgroep</option>
        {groups.map(g=><option key={g.id} value={g.id}>{g.naam} · {g.schooljaar}</option>)}
      </select>
      <button type="button" style={{...button,marginTop:12}} disabled={historyLoading || (!historyClass && !historyGroup) || !authorized}
        onClick={()=>void loadHistory()}>{historyLoading ? "Historiek laden…" : "Toon historiek"}</button>
      {historyError && <p role="alert" style={{color:"#ffb8b8"}}>{historyError}</p>}
      {historyLoaded && <div style={{marginTop:18}}>
        <h3 style={{fontSize:24,marginBottom:8}}>{historyClass || groups.find(g=>g.id===historyGroup)?.naam || "Klasgroep"}</h3>
        <label htmlFor="history-date">Testmoment</label>
        <select id="history-date" style={selectStyle} value={historyDate} onChange={e=>{setHistoryDate(e.target.value);setHistoryExpanded(null);}}>
          <option value="latest">Laatste bevestigde score per leerling</option>
          {historyDates.map(d=><option key={d} value={d}>{new Date(`${d}T12:00:00`).toLocaleDateString("nl-BE")}</option>)}
        </select>
        {historyDate !== "latest" && (()=>{ const dayRows=historyRows.filter(r=>r.datum.slice(0,10)===historyDate); return dayRows.length ? <button type="button" style={{...button,marginTop:10,background:"#71394b"}} disabled={historyLoading} onClick={()=>void deleteHistoryScores(dayRows,`Alle ${dayRows.length} Beep-testscores van ${new Date(`${historyDate}T12:00:00`).toLocaleDateString("nl-BE")} voor deze selectie wissen?`)}>🗑 Scores van dit testmoment wissen ({dayRows.length})</button> : null; })()}
        <p style={{fontSize:13,opacity:.8}}>{historyVisible.filter(p=>p.result).length} van {historyVisible.length} leerlingen met een bevestigde score. Tik op een leerling voor details en eerdere tests.</p>
        <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(137,194,170,.3)",marginTop:12}}>
          {historyVisible.map((p,i)=>{
            const r=p.result;
            const normResult = r ? normForHistory(r) : null;
            const assessment = normResult?.assessment ?? null;
            const key=`${p.naam}|${p.klas}`;
            const expanded=historyExpanded===key;
            const previous=historyRows.filter(x=>x.naam===p.naam && x.klas===p.klas).sort((x,y)=>y.datum.localeCompare(x.datum));
            return <div key={key} style={{borderBottom:i===historyVisible.length-1?"none":"1px solid rgba(137,194,170,.22)",background:i%2?"rgba(255,255,255,.035)":"rgba(0,0,0,.1)"}}>
              <button type="button" onClick={()=>setHistoryExpanded(expanded?null:key)} aria-expanded={expanded}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,minHeight:66,padding:"10px 12px",border:0,background:"transparent",color:"#eaf0ff",textAlign:"left",cursor:"pointer"}}>
                <span style={{flex:1,minWidth:0,overflowWrap:"anywhere",fontWeight:750}}>{p.naam}</span>
                <span style={{minWidth:78,textAlign:"center",borderRadius:10,padding:"9px 10px",fontWeight:900,fontSize:20,background:assessment?.color ?? (r?"#255971":"rgba(255,255,255,.1)"),color:assessment?.color==="#ffc966" || assessment?.color==="#a6f3a6" ? "#17212a":"#fff"}}>{r?`${r.niveau}.${r.shuttle}`:"—"}</span>
                <span aria-hidden="true" style={{fontSize:24,opacity:.75}}>{expanded?"⌄":"›"}</span>
              </button>
              {expanded && <div style={{padding:"0 14px 14px",fontSize:14}}>
                {r && <p style={{margin:"8px 0",opacity:.9}}>{normResult?.reason ?? "Geen normbeoordeling beschikbaar."}</p>}
                {r ? <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
                  <div>Testdatum<br/><strong>{new Date(r.datum).toLocaleDateString("nl-BE")}</strong></div>
                  <div>Afstand<br/><strong>{r.afstand} m</strong></div>
                  <div>Testduur<br/><strong>{formatHistoryTime(r.duur)}</strong></div>
                  <div>Volledige shuttles<br/><strong>{r.afstand/20}</strong></div>
                </div> : <p>Geen bevestigde score voor dit testmoment.</p>}
                {previous.length>0 && <div style={{marginTop:12}}><strong>Eerdere bevestigde tests</strong>
                  {previous.map(x=><div key={x.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(137,194,170,.18)"}}>
                    <span>{new Date(x.datum).toLocaleDateString("nl-BE")}</span><strong>{x.niveau}.{x.shuttle}</strong><span>{x.afstand} m</span><button type="button" style={{...button,minHeight:34,padding:"5px 9px",background:"#71394b"}} disabled={historyLoading} onClick={()=>void deleteHistoryScores([x],`Score van ${x.naam} (${new Date(x.datum).toLocaleDateString("nl-BE")}) wissen?`)}>🗑 Wis</button>
                  </div>)}
                </div>}
              </div>}
            </div>;
          })}
          {!historyVisible.length && <p style={{padding:14}}>Geen leerlingen met een bevestigde Beep-test gevonden voor deze selectie.</p>}
        </div>
        <p style={{fontSize:12,opacity:.8,marginTop:10}}>{normInfo} Een blauw scorevak betekent dat de normcategorie niet kon worden bepaald. Tik op de leerling voor de concrete reden.</p>
      </div>}
    </div>
    </>}
    {tab === "klassen" && <div style={panel}>
      <h2>Overzicht klassen</h2>
      <p>Dit overzicht toont de officiële leerlingenlijst. Bevestigde scores worden alleen geteld voor de klas waarvan je de historiek in het tabblad ‘Historiek’ hebt geladen.</p>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead><tr>{["Klas", "Leerlingen", "Bevestigde score", "Nog geen score", "Status"].map(h => <th key={h} style={{ padding: 10, borderBottom: "1px solid rgba(137,194,170,.3)" }}>{h}</th>)}</tr></thead>
        <tbody>{classNames.map(c => {
          const members = schoolStudents.filter(s => s.klas_naam === c);
          const loaded = historyLoaded && !historyGroup && historyClass === c && historyDate === "latest";
          const scored = loaded ? members.filter(s => historyRows.some(r => r.klas === c && r.naam === s.volledige_naam)).length : 0;
          return <tr key={c}><td style={{ padding: 10 }}>{c}</td><td style={{ padding: 10 }}>{members.length}</td><td style={{ padding: 10 }}>{loaded ? scored : "—"}</td><td style={{ padding: 10 }}>{loaded ? members.length - scored : "—"}</td><td style={{ padding: 10 }}>{loaded ? "Historiek geladen" : "Laad eerst historiek"}</td></tr>;
        })}</tbody>
      </table></div>
      {!classNames.length && <p>Er zijn nog geen officiële klassen geladen.</p>}
    </div>}
    {tab === "controle" && <div style={panel}><h2>Resultaten opslaan</h2>
      <p style={{ color: "#89C2AA", fontWeight: 800 }}>☁ {sessionSynced} lokaal als gesynchroniseerd gemarkeerd in deze testsessie</p>
      <p>{sessionPending ? `⚠ ${sessionPending} resultaat/resultaten in deze testsessie wachten op synchronisatie.` : "✅ Geen resultaten van deze testsessie die op synchronisatie wachten."}</p>
      {pending.length > sessionPending && <p style={{ fontSize: 12, opacity: .8 }}>Er staan nog {pending.length - sessionPending} oudere lokale resultaten klaar voor synchronisatie.</p>}
      {syncing && <p role="status">Synchroniseren…</p>}
      {syncError && <p role="alert" style={{ color: "#ffd2a8" }}>Synchronisatie mislukt: {syncError}</p>}
      {pending.some(r=>r.confirmed) && <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={button} disabled={syncing || !authorized || review} onClick={() => void syncResults()}>↻ Opnieuw synchroniseren</button>
        <button style={{ ...button, background: "#255971" }} onClick={backup}>Download lokale back-up (JSON)</button>
      </div>}
      <p style={{ fontSize: 12, opacity: .8 }}>De synchronisatiestatus is lokaal opgeslagen; een handmatige verwijdering in Supabase wordt niet automatisch in de lokale historiek verwerkt. De back-up bevat leerlinggegevens: bewaar ze veilig en verwijder ze wanneer de synchronisatie bevestigd is.</p>
    </div>}
  </AppShell>;
}
