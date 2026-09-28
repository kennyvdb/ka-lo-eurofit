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
            wie heeft ingediend en welke rubric bij de laatste inzending hoort.
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
                Rij 1: ingediend JA/NEE. Rij 2: rubric van de laatste inzending.
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
                const ingediend = Boolean(submission);

                return (
                  <div
                    key={leerling.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-center"
                  >
                    <div className="min-h-24 border-b border-white/10 bg-white/5 p-3">
                      <div className="text-sm font-black text-white">{leerling.naam}</div>
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
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/40">
                        Rubric
                      </div>
                      {rubric ? (
                        <div className={["mt-2 rounded-xl border px-3 py-2 text-lg font-black", rubricClass(rubric.level)].join(" ")}>
                          {rubric.level}
                        </div>
                      ) : (
                        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-lg font-black text-white/30">
                          —
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
