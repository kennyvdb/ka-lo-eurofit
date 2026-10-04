"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
type RawRow = Record<string, any>;
type GradeMode = "2e" | "3e";
type DoelType = "klas" | "klasgroep";
type RubricLevel = "-" | "+/-" | "+" | "++";
type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  schooljaar: string | null;
};
type Leerling = {
  id: string;
  naam: string;
  email: string | null;
  klas_naam: string | null;
  leerjaar: number | null;
  heeftProfiel: boolean;
};
type Klasgroep = {
  id: string;
  naam: string;
  schooljaar: string;
  leerkracht_id: string;
};
type HomeworkSubmission = {
  id: string;
  user_id: string;
  schooljaar: string | null;
  klas_naam: string | null;
  date: string;
  grade: GradeMode;
  payload: any;
  created_at: string;
};
function suggestedSchoolyear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
function getValue(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}
function getEmail(row: RawRow) {
  return String(getValue(row, ["email", "leerling_email", "mail", "user_email"]) || "")
    .trim()
    .toLowerCase();
}
function getNaam(row: RawRow) {
  const full = getValue(row, ["volledige_naam", "full_name", "naam", "display_name"]);
  if (full) return String(full).trim();
  const first = String(getValue(row, ["given_name", "voornaam"]) || "").trim();
  const last = String(getValue(row, ["family_name", "achternaam", "familienaam"]) || "").trim();
  return `${first} ${last}`.trim();
}
function getKlas(row: RawRow) {
  return String(getValue(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"]) || "").trim();
}
function isEchteKlas(klas: string) {
  return /^[0-9]/.test(klas.trim());
}
function readableError(error: any, context: string) {
  return [context, error?.message, error?.details, error?.hint, error?.code ? `code: ${error.code}` : null]
    .filter(Boolean)
    .join(" | ");
}
function rubricClass(level?: string | null) {
  if (level === "++") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (level === "+") return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  if (level === "+/-") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (level === "-") return "border-red-400/30 bg-red-400/10 text-red-100";
  return "border-white/10 bg-white/5 text-white/45";
}
function mainRubric(row: HomeworkSubmission | null): { level: RubricLevel; title?: string; description?: string } | null {
  if (!row) return null;
  const items = Array.isArray(row.payload?.rubrics) ? row.payload.rubrics : [];
  const preferred =
    items.find((x: any) => x?.key === "huiswerk_2e_totaal") ??
    items.find((x: any) => x?.key === "energiebalans_voeding") ??
    items[0];
  if (!preferred?.level) return null;
  return preferred;
}
type AiCriterion = { name?: string; level?: RubricLevel | null; feedback?: string };
type AiAssessment = {
  status?: "completed" | "unavailable" | string;
  level?: RubricLevel | null;
  summary?: string;
  criteria?: AiCriterion[];
};
function aiAssessment(row: HomeworkSubmission | null): AiAssessment | null {
  if (!row) return null;
  const value = row.payload?.aiAssessment;
  return value && typeof value === "object" ? value : null;
}
function displayValue(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  return String(value);
}
function HomeworkDetail({
  leerling,
  submission,
  onClose,
}: {
  leerling: Leerling;
  submission: HomeworkSubmission;
  onClose: () => void;
}) {
  const form = submission.payload?.form ?? {};
  const normalAssessment = mainRubric(submission);
  const ai = aiAssessment(submission);
  const isThird = submission.grade === "3e";
  const secondRows = [
    ["Datum", form.date],
    ["MAS", form.mas ? `${form.mas} km/u` : ""],
    ["Trainingstype", form.trainingType],
    ["Trainingsdoel", form.trainingGoal],
    ["Verwachte RPE", form.expectedRpe],
    ["Verwachte praattest", form.expectedTalk],
    ["Opwarming", form.warmupMin ? `${form.warmupMin} min` : ""],
    ["Kern van de training", form.coreText],
    ["Cooling-down", form.cooldownMin ? `${form.cooldownMin} min` : ""],
    ["Hartslag rust", form.hrRest ? `${form.hrRest} bpm` : ""],
    ["Hartslag piek", form.hrPeak ? `${form.hrPeak} bpm` : ""],
    ["Hartslag herstel na 1 min", form.hrRec1 ? `${form.hrRec1} bpm` : ""],
    ["Praattest", form.talk],
    ["Uitleg praattest", form.talkExplain],
    ["RPE", form.rpe],
    ["Reflectie", form.reflection],
    ["Krachttraining uitgevoerd", form.didStrength],
    ["Krachtcircuit", form.strengthCircuitName],
    ["RPE kracht", form.strengthRpe],
  ];
  const thirdRows = [
    ["Datum", form.date],
    ["Gewicht", form.weightKg ? `${form.weightKg} kg` : ""],
    ["Voedingsapp", form.intakeApp || "Virtuafood"],
    ["Energie-inname", form.kcalIntake ? `${form.kcalIntake} kcal` : ""],
    ["Eiwitten", form.proteinG ? `${form.proteinG} g` : ""],
    ["Koolhydraten", form.carbsG ? `${form.carbsG} g` : ""],
    ["Vetten", form.fatG ? `${form.fatG} g` : ""],
    ["Aantal eetmomenten", form.mealsCount],
    ["Meeste kcal", form.highestKcalMeal],
    ["Energieverbruik", form.kcalTotalBurn ? `${form.kcalTotalBurn} kcal` : ""],
    ["Bron energieverbruik", form.burnSource || "TDEE Calculator"],
    ["Uitleg energiebalans", form.balanceExplain],
    ["Gevolg op langere termijn", form.longTermExplain],
    ["Macro's volgens gekozen doel", form.macroExplain],
    ["Reflectie", form.reflection],
  ];
  const rows = isThird ? thirdRows : secondRows;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[28px] border border-white/10 bg-[#10131a] shadow-2xl sm:max-w-3xl sm:rounded-[28px]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#10131a]/95 p-5 backdrop-blur">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-200">
              Huistaak {submission.grade === "3e" ? "3e graad" : "2e graad"}
            </div>
            <h2 className="mt-1 text-xl font-black text-white">{leerling.naam}</h2>
            <div className="mt-1 text-xs text-white/50">
              {leerling.klas_naam ?? "—"} · ingediend op {submission.date}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-xl font-black text-white/80 hover:bg-white/10"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div
                key={String(label)}
                className={[
                  "rounded-2xl border border-white/10 bg-white/5 p-4",
                  String(value ?? "").length > 80 ? "sm:col-span-2" : "",
                ].join(" ")}
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-white/45">
                  {label}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/90">
                  {displayValue(value)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-white/55">
              Vergelijking beoordelingen — alleen zichtbaar voor LO-leerkrachten
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-white/45">Normale beoordeling</div>
                {normalAssessment ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={["rounded-xl border px-3 py-1 text-lg font-black", rubricClass(normalAssessment.level)].join(" ")}>
                        {normalAssessment.level}
                      </span>
                      <span className="text-sm font-black text-white">{normalAssessment.title ?? "Bestaande rubric"}</span>
                    </div>
                    {normalAssessment.description ? (
                      <div className="mt-3 text-sm leading-6 text-white/65">{normalAssessment.description}</div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-3 text-sm text-white/45">Geen normale beoordeling opgeslagen.</div>
                )}
              </div>
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-200/70">AI-beoordeling</div>
                {ai?.status === "completed" && ai.level ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={["rounded-xl border px-3 py-1 text-lg font-black", rubricClass(ai.level)].join(" ")}>
                        {ai.level}
                      </span>
                      <span className="text-sm font-black text-white">Onafhankelijke AI-rubric</span>
                    </div>
                    {ai.summary ? <div className="mt-3 text-sm leading-6 text-white/70">{ai.summary}</div> : null}
                  </>
                ) : (
                  <div className="mt-3 text-sm leading-6 text-white/45">
                    {ai?.summary || "Voor deze inzending is nog geen AI-beoordeling opgeslagen."}
                  </div>
                )}
              </div>
            </div>
            {ai?.status === "completed" && Array.isArray(ai.criteria) && ai.criteria.length ? (
              <div className="mt-3 rounded-2xl border border-violet-400/15 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-200/70">AI — beoordeling per criterium</div>
                <div className="mt-3 space-y-3">
                  {ai.criteria.map((criterion, index) => (
                    <div key={`${criterion.name ?? "criterium"}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {criterion.level ? (
                          <span className={["rounded-lg border px-2 py-1 text-xs font-black", rubricClass(criterion.level)].join(" ")}>
                            {criterion.level}
                          </span>
                        ) : null}
                        <span className="text-sm font-black text-white">{criterion.name ?? `Criterium ${index + 1}`}</span>
                      </div>
                      {criterion.feedback ? <div className="mt-2 text-sm leading-6 text-white/65">{criterion.feedback}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-3 text-xs leading-5 text-white/40">
              Beide beoordelingen zijn voorlopig uitsluitend bedoeld voor vergelijking door de LO-leerkrachten. Er wordt nog geen definitieve rubric aan de leerling getoond.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function FunctionalFitheidstestLeerkrachtPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [schooljaar, setSchooljaar] = useState("");
  const [grade, setGrade] = useState<GradeMode>("2e");
  const [doelType, setDoelType] = useState<DoelType>("klas");
  const [classRows, setClassRows] = useState<RawRow[]>([]);
  const [selectedKlas, setSelectedKlas] = useState("");
  const [klasgroepen, setKlasgroepen] = useState<Klasgroep[]>([]);
  const [selectedKlasgroepId, setSelectedKlasgroepId] = useState("");
  const [selectedKlasgroepRows, setSelectedKlasgroepRows] = useState<RawRow[]>([]);
  const [leerlingen, setLeerlingen] = useState<Leerling[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [detail, setDetail] = useState<{ leerling: Leerling; submission: HomeworkSubmission } | null>(null);
  const klassen = useMemo(() => {
    const wantedYears = grade === "2e" ? [3, 4] : [5, 6];
    return [...new Set(
      classRows
        .map(getKlas)
        .filter((k) => k && isEchteKlas(k) && wantedYears.includes(Number.parseInt(k, 10)))
    )].sort((a, b) => a.localeCompare(b, "nl"));
  }, [classRows, grade]);
  const latestByUser = useMemo(() => {
    const map = new Map<string, HomeworkSubmission>();
    for (const row of submissions) {
      const existing = map.get(row.user_id);
      if (!existing || String(row.created_at).localeCompare(String(existing.created_at)) > 0) {
        map.set(row.user_id, row);
      }
    }
    return map;
  }, [submissions]);
  const stats = useMemo(() => {
    const submitted = leerlingen.filter((l) => l.heeftProfiel && latestByUser.has(l.id)).length;
    return { submitted, missing: leerlingen.length - submitted };
  }, [leerlingen, latestByUser]);
  async function loadClassStudents(year: string) {
    const rows: RawRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("class_students")
        .select("class_name, given_name, family_name, email, username, role, primary_class, schooljaar")
        .eq("schooljaar", year)
        .eq("role", "student")
        .range(from, from + 999);
      if (error) throw new Error(readableError(error, "Kon officiële klassen niet laden."));
      const batch = (data ?? []) as RawRow[];
      rows.push(...batch);
      if (batch.length < 1000) break;
    }
    setClassRows(rows);
    return rows;
  }
  async function loadKlasgroepen(uid: string, year: string) {
    const { data, error } = await supabase
      .from("lo_klasgroepen")
      .select("id, naam, schooljaar, leerkracht_id")
      .eq("leerkracht_id", uid)
      .eq("schooljaar", year)
      .order("naam", { ascending: true });
    if (error) throw new Error(readableError(error, "Kon klasgroepen niet laden."));
    setKlasgroepen((data ?? []) as Klasgroep[]);
  }
  async function loadKlasgroepRows(id: string) {
    if (!id) {
      setSelectedKlasgroepRows([]);
      return [];
    }
    const rows: RawRow[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("lo_klasgroep_leden_view")
        .select("*")
        .eq("klasgroep_id", id)
        .order("positie", { ascending: true })
        .range(from, from + 999);
      if (error) throw new Error(readableError(error, "Kon klasgroepleerlingen niet laden."));
      const batch = (data ?? []) as RawRow[];
      rows.push(...batch);
      if (batch.length < 1000) break;
    }
    setSelectedKlasgroepRows(rows);
    return rows;
  }
  async function resolveProfiles(rows: RawRow[], preserveOrder: boolean) {
    const unique = new Map<string, RawRow>();
    for (const row of rows) {
      const email = getEmail(row);
      if (email && !unique.has(email)) unique.set(email, row);
    }
    const emails = [...unique.keys()];
    const profiles: RawRow[] = [];
    for (let i = 0; i < emails.length; i += 100) {
      const { data, error } = await supabase
        .from("profielen")
        .select("id, volledige_naam, email, klas_naam, leerjaar")
        .in("email", emails.slice(i, i + 100));
      if (error) throw new Error(readableError(error, "Kon leerlingprofielen niet laden."));
      profiles.push(...(data ?? []));
    }
    const byEmail = new Map(profiles.map((p) => [getEmail(p), p]));
    let result: Leerling[] = [...unique.entries()].map(([email, row]) => {
      const p = byEmail.get(email);
      const klas = getKlas(row) || String(p?.klas_naam ?? "");
      const parsedYear = Number.parseInt(klas, 10);
      return {
        id: p?.id ? String(p.id) : `zonder-profiel:${email}`,
        naam: getNaam(row) || String(p?.volledige_naam ?? email),
        email,
        klas_naam: klas || null,
        leerjaar: p?.leerjaar == null ? (Number.isFinite(parsedYear) ? parsedYear : null) : Number(p.leerjaar),
        heeftProfiel: Boolean(p?.id),
      };
    });
    if (!preserveOrder) {
      result = result.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
    }
    return result;
  }
  async function loadOverview() {
    setLoadingOverview(true);
    setError(null);
    try {
      let sourceRows: RawRow[] = [];
      if (doelType === "klas") {
        if (!selectedKlas) {
          setLeerlingen([]);
          setSubmissions([]);
          return;
        }
        sourceRows = classRows.filter((r) => getKlas(r) === selectedKlas);
      } else {
        if (!selectedKlasgroepId) {
          setLeerlingen([]);
          setSubmissions([]);
          return;
        }
        sourceRows = selectedKlasgroepRows.length
          ? selectedKlasgroepRows
          : await loadKlasgroepRows(selectedKlasgroepId);
      }
      const resolved = await resolveProfiles(sourceRows, doelType === "klasgroep");
      setLeerlingen(resolved);
      const ids = resolved.filter((l) => l.heeftProfiel).map((l) => l.id);
      if (!ids.length) {
        setSubmissions([]);
        return;
      }
      const all: HomeworkSubmission[] = [];
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await supabase
          .from("eurofit_huiswerk_submissions")
          .select("id, user_id, schooljaar, klas_naam, date, grade, payload, created_at")
          .eq("schooljaar", schooljaar)
          .eq("grade", grade)
          .in("user_id", ids.slice(i, i + 100))
          .order("created_at", { ascending: false });
        if (error) throw new Error(readableError(error, "Kon huiswerken niet laden."));
        all.push(...((data ?? []) as HomeworkSubmission[]));
      }
      setSubmissions(all);
    } catch (e: any) {
      setError(e?.message ?? "Kon overzicht niet laden.");
    } finally {
      setLoadingOverview(false);
    }
  }
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (!uid) {
          window.location.replace("/login");
          return;
        }
        const { data: p, error: pe } = await supabase
          .from("profielen")
          .select("id, volledige_naam, rol, schooljaar")
          .eq("id", uid)
          .single();
        if (pe) throw new Error(readableError(pe, "Kon profiel niet laden."));
        if (!["lo_leerkracht", "admin"].includes(String(p?.rol ?? "").trim().toLowerCase())) {
          setAllowed(false);
          return;
        }
        const profile = p as Profiel;
        setProfiel(profile);
        setAllowed(true);
        const year =
          profile.schooljaar === "2025-2026"
            ? suggestedSchoolyear()
            : profile.schooljaar ?? suggestedSchoolyear();
        setSchooljaar(year);
        const rows = await loadClassStudents(year);
        await loadKlasgroepen(uid, year);
        const first = [...new Set(rows.map(getKlas).filter((k) => /^[34]/.test(k)))]
          .sort((a, b) => a.localeCompare(b, "nl"))[0] ?? "";
        setSelectedKlas(first);
      } catch (e: any) {
        setError(e?.message ?? "Kon pagina niet laden.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);
  useEffect(() => {
    if (!allowed || loading) return;
    const first = klassen[0] ?? "";
    if (doelType === "klas" && !klassen.includes(selectedKlas)) setSelectedKlas(first);
    setLeerlingen([]);
    setSubmissions([]);
  }, [grade, doelType, klassen.join("|"), allowed, loading]);
  useEffect(() => {
    if (!allowed || loading) return;
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKlas, selectedKlasgroepId, grade, doelType]);
  async function reloadSchoolyear() {
    if (!profiel) return;
    setLoadingOverview(true);
    setError(null);
    try {
      await loadClassStudents(schooljaar);
      await loadKlasgroepen(profiel.id, schooljaar);
      setSelectedKlasgroepId("");
      setSelectedKlasgroepRows([]);
      setLeerlingen([]);
      setSubmissions([]);
    } catch (e: any) {
      setError(e?.message ?? "Kon schooljaar niet laden.");
    } finally {
      setLoadingOverview(false);
    }
  }
  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Functional fitheidstest">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
          Laden…
        </div>
      </AppShell>
    );
  }
  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Functional fitheidstest">
        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-100">
          Deze pagina is alleen beschikbaar voor LO-leerkrachten.
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell
      title="LO App"
      subtitle="Functional fitheidstest"
      userName={profiel?.volledige_naam}
    >
      <section className="rounded-[26px] border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leerkrachten-lo"
            className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/80 transition hover:bg-white/10"
          >
            ← Terug naar Leerkrachten LO
          </Link>
          <Link
            href="/functional-fitheidstest"
            className="inline-flex h-10 items-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-black text-sky-100 transition hover:bg-sky-400/15"
          >
            Functional fitheidstest leerlingen →
          </Link>
        </div>
        <div className="mt-4">
          <div className="text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
            LO Leerkrachtbeheer
          </div>
          <h1 className="mt-2 text-[28px] font-black text-white sm:text-[34px]">
            Functional fitheidstest
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            Overzicht van het huiswerk per klas of klasgroep. Je ziet onmiddellijk
            wie heeft ingediend en hoe de normale en AI-beoordeling van de laatste inzending zich tot elkaar verhouden.
          </p>
        </div>
      </section>
      {error ? (
        <div className="mt-4 rounded-[20px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          <b>Oeps:</b> {error}
        </div>
      ) : null}
      <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
        <div className="text-base font-black text-white">Selectie</div>
        <div className="mt-1 text-xs text-white/60">
          Zelfde werkwijze als bij Sportfolio: schooljaar, officiële klas of eigen klasgroep.
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/55">
              Schooljaar
            </label>
            <input
              value={schooljaar}
              onChange={(e) => setSchooljaar(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/55">
              Graad
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeMode)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white"
            >
              <option value="2e" className="bg-neutral-900">2e graad</option>
              <option value="3e" className="bg-neutral-900">3e graad</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/55">
              Doelgroep
            </label>
            <select
              value={doelType}
              onChange={(e) => {
                setDoelType(e.target.value as DoelType);
                setSelectedKlasgroepId("");
              }}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white"
            >
              <option value="klas" className="bg-neutral-900">Officiële klas</option>
              <option value="klasgroep" className="bg-neutral-900">Mijn klasgroep</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void reloadSchoolyear()}
              disabled={loadingOverview}
              className="h-12 w-full rounded-2xl border border-white/15 bg-black/40 px-5 text-sm font-black text-white disabled:opacity-50"
            >
              Schooljaar laden
            </button>
          </div>
        </div>
        <div className="mt-3">
          {doelType === "klas" ? (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/55">
                Klas
              </label>
              <select
                value={selectedKlas}
                onChange={(e) => setSelectedKlas(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white"
              >
                {klassen.length === 0 ? (
                  <option value="" className="bg-neutral-900">Geen klassen gevonden</option>
                ) : null}
                {klassen.map((k) => (
                  <option key={k} value={k} className="bg-neutral-900">{k}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-white/55">
                Klasgroep
              </label>
              <select
                value={selectedKlasgroepId}
                onChange={async (e) => {
                  const id = e.target.value;
                  setSelectedKlasgroepId(id);
                  await loadKlasgroepRows(id);
                }}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white"
              >
                <option value="" className="bg-neutral-900">Kies een klasgroep</option>
                {klasgroepen.map((g) => (
                  <option key={g.id} value={g.id} className="bg-neutral-900">{g.naam}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
      <section className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
        <div className="border-b border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-black text-white">Huiswerk & rubric overzicht</div>
              <div className="mt-1 text-xs text-white/60">
                Per leerling zie je meteen de normale en AI-beoordeling van de laatste inzending. Klik op de naam om de volledige huistaak en beide beoordelingen te bekijken.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-white/70">
                {leerlingen.length} leerlingen
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                {stats.submitted} ingediend
              </span>
              <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-100">
                {stats.missing} niet ingediend
              </span>
              <button
                type="button"
                onClick={() => void loadOverview()}
                disabled={loadingOverview}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50"
              >
                {loadingOverview ? "Laden…" : "Vernieuwen"}
              </button>
            </div>
          </div>
        </div>
        {leerlingen.length === 0 ? (
          <div className="p-5 text-sm text-white/55">
            {loadingOverview ? "Overzicht laden…" : "Kies een klas of klasgroep."}
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <div
              className="grid min-w-max gap-2"
              style={{ gridTemplateColumns: `repeat(${leerlingen.length}, minmax(125px, 155px))` }}
            >
              {leerlingen.map((leerling) => {
                const submission = leerling.heeftProfiel ? latestByUser.get(leerling.id) ?? null : null;
                const rubric = mainRubric(submission);
                const ai = aiAssessment(submission);
                const ingediend = Boolean(submission);
                return (
                  <div
                    key={leerling.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-center"
                  >
                    <div className="min-h-24 border-b border-white/10 bg-white/5 p-3">
                      {submission ? (
                      <button
                        type="button"
                        onClick={() => setDetail({ leerling, submission })}
                        className="text-sm font-black text-sky-200 underline decoration-sky-300/30 underline-offset-4 transition hover:text-sky-100"
                        title="Bekijk ingevulde huistaak"
                      >
                        {leerling.naam}
                      </button>
                    ) : (
                      <div className="text-sm font-black text-white">{leerling.naam}</div>
                    )}
                      <div className="mt-1 text-[11px] text-white/45">{leerling.klas_naam ?? "—"}</div>
                      {!leerling.heeftProfiel ? (
                        <div className="mt-1 text-[10px] font-bold text-amber-200">geen profiel</div>
                      ) : null}
                    </div>
                    <div className="border-b border-white/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/40">
                        Ingediend
                      </div>
                      <div
                        className={[
                          "mt-2 rounded-xl border px-3 py-2 text-base font-black",
                          ingediend
                            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                            : "border-red-400/25 bg-red-400/10 text-red-100",
                        ].join(" ")}
                      >
                        {ingediend ? "JA" : "NEE"}
                      </div>
                      {submission ? (
                        <div className="mt-1 text-[10px] text-white/40">{submission.date}</div>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wider text-white/40">Normaal</div>
                          {rubric ? (
                            <div className={["mt-2 rounded-xl border px-2 py-2 text-base font-black", rubricClass(rubric.level)].join(" ")}>
                              {rubric.level}
                            </div>
                          ) : (
                            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-base font-black text-white/30">—</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wider text-violet-200/60">AI</div>
                          {ai?.status === "completed" && ai.level ? (
                            <div className={["mt-2 rounded-xl border px-2 py-2 text-base font-black", rubricClass(ai.level)].join(" ")}>
                              {ai.level}
                            </div>
                          ) : (
                            <div
                              className="mt-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-base font-black text-white/30"
                              title={ai?.summary || "Nog geen AI-beoordeling opgeslagen"}
                            >
                              —
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
        {detail ? (
      <HomeworkDetail
        leerling={detail.leerling}
        submission={detail.submission}
        onClose={() => setDetail(null)}
      />
    ) : null}
</AppShell>
  );
}
