"use client";

import AppShell from "@/components/AppShell";
import KlasgroepSelector from "@/components/klasgroepen/KlasgroepSelector";
import type { KlasgroepLid } from "@/types/klasgroepen";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

type RawRow = Record<string, any>;
type Tab = "scores" | "openstellingen" | "beheer";
type DoelType = "klas" | "klasgroep";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  schooljaar: string | null;
};

type Discipline = {
  id: string;
  slug: string;
  naam: string;
  categorie: string | null;
  eenheid: string | null;
  hoger_is_beter: boolean | null;
  actief: boolean | null;
};

type Openstelling = {
  id: string;
  discipline_id: string;
  klas_naam: string | null;
  klasgroep_id: string | null;
  schooljaar: string;
  open_voor_leerlingen: boolean | null;
};

type RubricRow = {
  id: string;
  discipline_id: string;
  geslacht: string | null;
  leerjaar: number | null;
  min_score: number | null;
  max_score: number | null;
  niveau: string | null;
  label: string | null;
  volgorde: number | null;
};

type Leerling = {
  id: string;
  naam: string;
  email: string | null;
  klas_naam: string | null;
  leerjaar: number | null;
  graad: number | null;
  geslacht: string | null;
};

type ScoreDraft = {
  nummer: string;
  tekst: string;
};

type ExistingScore = {
  id: string;
  leerling_id: string;
  discipline_id: string;
  schooljaar: string;
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid: string | null;
  status: string | null;
  bevestigd_op: string | null;
  aangemaakt_op: string | null;
};

type GradeMap = Record<string, number[]>;

const EMPTY_DRAFT: ScoreDraft = { nummer: "", tekst: "" };

function getValue(row: RawRow, keys: string[]) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function isEchteKlas(klas: string) {
  return /^[0-9]/.test(klas.trim());
}

function getKlasNaam(row: RawRow) {
  return String(
    getValue(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"])
  ).trim();
}

function getEmail(row: RawRow) {
  const value = getValue(row, ["email", "mail", "user_email"]);
  return value ? String(value).trim().toLowerCase() : "";
}

function getNaam(row: RawRow) {
  const full = getValue(row, [
    "volledige_naam",
    "full_name",
    "naam",
    "display_name",
  ]);
  if (full) return String(full).trim();

  const given = String(getValue(row, ["given_name", "voornaam"]) || "").trim();
  const family = String(getValue(row, ["family_name", "achternaam", "familienaam"]) || "").trim();
  return `${given} ${family}`.trim();
}

function readableSupabaseError(error: any, context: string) {
  const parts = [
    context,
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `code: ${error.code}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function suggestedSchoolyear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function normalizeGender(value: unknown) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["m", "man", "jongen", "male"].includes(v)) return "jongen";
  if (["v", "vrouw", "meisje", "female"].includes(v)) return "meisje";
  return v || null;
}

function toNullableNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRubricForScore(
  rubrics: RubricRow[],
  disciplineId: string,
  score: number | null,
  geslacht: string | null,
  leerjaar: number | null
) {
  if (score == null) return null;

  const gender = normalizeGender(geslacht);

  const candidates = rubrics
    .filter((r) => r.discipline_id === disciplineId)
    .filter((r) => r.leerjaar == null || leerjaar == null || r.leerjaar === leerjaar)
    .filter((r) => {
      const rg = normalizeGender(r.geslacht);
      return !rg || !gender || rg === gender;
    })
    .filter((r) => {
      const minOk = r.min_score == null || score >= Number(r.min_score);
      const maxOk = r.max_score == null || score < Number(r.max_score);
      return minOk && maxOk;
    })
    .sort((a, b) => Number(a.volgorde ?? 999) - Number(b.volgorde ?? 999));

  return candidates[0] ?? null;
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rubricBadgeClass(niveau: string | null | undefined) {
  if (niveau === "++") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (niveau === "+") return "border-sky-400/25 bg-sky-400/10 text-sky-100";
  if (niveau === "+/-") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (niveau === "-") return "border-red-400/25 bg-red-400/10 text-red-100";
  return "border-white/10 bg-white/5 text-white/60";
}

function ExistingScoreRow({
  score,
  leerling,
  rubric,
  savingId,
  onSave,
  onDelete,
}: {
  score: ExistingScore;
  leerling?: Leerling;
  rubric: RubricRow | null;
  savingId: string | null;
  onSave: (score: ExistingScore, nummer: string, tekst: string) => Promise<void>;
  onDelete: (scoreId: string) => Promise<void>;
}) {
  const [nummer, setNummer] = useState(
    score.score_nummer == null ? "" : String(score.score_nummer)
  );
  const [tekst, setTekst] = useState(score.score_tekst ?? "");

  useEffect(() => {
    setNummer(score.score_nummer == null ? "" : String(score.score_nummer));
    setTekst(score.score_tekst ?? "");
  }, [score.id, score.score_nummer, score.score_tekst]);

  const busy =
    savingId === `score-${score.id}` ||
    savingId === `delete-score-${score.id}`;

  return (
    <tr className="text-sm text-white/80">
      <td className="px-4 py-3">
        <div className="font-bold text-white">
          {leerling?.naam ?? "Onbekende leerling"}
        </div>
        <div className="mt-0.5 text-[11px] text-white/40">
          {leerling?.klas_naam ?? "—"}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            value={nummer}
            onChange={(e) => setNummer(e.target.value)}
            className="h-10 w-28 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white outline-none focus:border-white/25"
          />
          <span className="text-xs text-white/45">{score.eenheid ?? ""}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          className="h-10 min-w-44 rounded-xl border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-white/25"
        />
      </td>
      <td className="px-4 py-3">
        {rubric ? (
          <span
            className={[
              "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
              rubricBadgeClass(rubric.niveau),
            ].join(" ")}
          >
            {rubric.niveau ?? rubric.label ?? "Rubric"}
          </span>
        ) : (
          <span className="text-xs text-white/35">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-black text-emerald-100">
          {score.status ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => void onSave(score, nummer, tekst)}
            disabled={busy}
            className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-black text-sky-100 disabled:opacity-40"
          >
            Wijzigen
          </button>
          <button
            onClick={() => void onDelete(score.id)}
            disabled={busy}
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-black text-red-100 disabled:opacity-40"
          >
            Verwijderen
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SportfolioBeheerPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("scores");

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [gradeMap, setGradeMap] = useState<GradeMap>({});
  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [openstellingen, setOpenstellingen] = useState<Openstelling[]>([]);

  const [selectedSchooljaar, setSelectedSchooljaar] = useState("");
  const [doelType, setDoelType] = useState<DoelType>("klas");
  const [selectedKlasNaam, setSelectedKlasNaam] = useState("");
  const [selectedKlasgroepId, setSelectedKlasgroepId] = useState<string | null>(null);
  const [selectedKlasgroepLeden, setSelectedKlasgroepLeden] = useState<KlasgroepLid[]>([]);

  const [selectedDisciplineId, setSelectedDisciplineId] = useState("");
  const [targetLeerlingen, setTargetLeerlingen] = useState<Leerling[]>([]);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, ScoreDraft>>({});
  const [existingScores, setExistingScores] = useState<ExistingScore[]>([]);
  const [loadingExistingScores, setLoadingExistingScores] = useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newNaam, setNewNaam] = useState("");
  const [newCategorie, setNewCategorie] = useState("");
  const [newEenheid, setNewEenheid] = useState("");
  const [newHogerIsBeter, setNewHogerIsBeter] = useState(true);
  const [newGraden, setNewGraden] = useState<number[]>([]);
  const [savingDiscipline, setSavingDiscipline] = useState(false);

  const [rubricDisciplineId, setRubricDisciplineId] = useState("");
  const [rubricLeerjaar, setRubricLeerjaar] = useState(3);
  const [rubricGeslacht, setRubricGeslacht] = useState<"jongen" | "meisje" | "algemeen">("jongen");
  const [rubricMin, setRubricMin] = useState("");
  const [rubricMax, setRubricMax] = useState("");
  const [rubricNiveau, setRubricNiveau] = useState("-");
  const [rubricLabel, setRubricLabel] = useState("");
  const [rubricVolgorde, setRubricVolgorde] = useState(1);
  const [savingRubric, setSavingRubric] = useState(false);

  const klassen = useMemo(() => {
    const set = new Set<string>();

    leerlingenRows
      .filter(
        (row) =>
          !selectedSchooljaar ||
          String(getValue(row, ["schooljaar", "school_year"]) || selectedSchooljaar) ===
            selectedSchooljaar
      )
      .forEach((row) => {
        const klas = getKlasNaam(row);
        if (klas && isEchteKlas(klas)) set.add(klas);
      });

    return Array.from(set).sort((a, b) => a.localeCompare(b, "nl"));
  }, [leerlingenRows, selectedSchooljaar]);

  const activeDisciplines = useMemo(
    () => disciplines.filter((d) => d.actief !== false),
    [disciplines]
  );

  const selectedDiscipline = useMemo(
    () => disciplines.find((d) => d.id === selectedDisciplineId) ?? null,
    [disciplines, selectedDisciplineId]
  );

  const rubricDiscipline = useMemo(
    () => disciplines.find((d) => d.id === rubricDisciplineId) ?? null,
    [disciplines, rubricDisciplineId]
  );

  const visibleRubrics = useMemo(() => {
    if (!rubricDisciplineId) return [];
    return rubrics
      .filter((r) => r.discipline_id === rubricDisciplineId)
      .sort((a, b) => {
        const ly = Number(a.leerjaar ?? 99) - Number(b.leerjaar ?? 99);
        if (ly !== 0) return ly;
        const g = String(a.geslacht ?? "").localeCompare(String(b.geslacht ?? ""), "nl");
        if (g !== 0) return g;
        return Number(a.volgorde ?? 999) - Number(b.volgorde ?? 999);
      });
  }, [rubrics, rubricDisciplineId]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function loadDisciplinesAndRubrics() {
    const [
      { data: disciplineData, error: disciplineError },
      { data: rubricData, error: rubricError },
      { data: gradeData, error: gradeError },
    ] = await Promise.all([
      supabase
        .from("sportfolio_disciplines")
        .select("id, slug, naam, categorie, eenheid, hoger_is_beter, actief")
        .order("naam", { ascending: true }),
      supabase
        .from("sportfolio_rubrics")
        .select("id, discipline_id, geslacht, leerjaar, min_score, max_score, niveau, label, volgorde")
        .order("leerjaar", { ascending: true })
        .order("volgorde", { ascending: true }),
      supabase
        .from("sportfolio_discipline_graden")
        .select("discipline_id, graad"),
    ]);

    if (disciplineError) {
      throw new Error(readableSupabaseError(disciplineError, "Kon disciplines niet laden."));
    }
    if (rubricError) {
      throw new Error(readableSupabaseError(rubricError, "Kon rubrics niet laden."));
    }
    if (gradeError) {
      throw new Error(readableSupabaseError(gradeError, "Kon graadkoppelingen niet laden."));
    }

    const ds = (disciplineData ?? []) as Discipline[];
    setDisciplines(ds);
    setRubrics((rubricData ?? []) as RubricRow[]);

    const map: GradeMap = {};
    for (const row of gradeData ?? []) {
      const disciplineId = String((row as any).discipline_id);
      const graad = Number((row as any).graad);
      map[disciplineId] = [...(map[disciplineId] ?? []), graad].sort();
    }
    setGradeMap(map);

    setSelectedDisciplineId((current) => current || ds.find((d) => d.actief !== false)?.id || "");
    setRubricDisciplineId((current) => current || ds[0]?.id || "");
  }

  async function loadOpenstellingen(args: {
    type: DoelType;
    klasNaam?: string;
    klasgroepId?: string | null;
    schooljaar: string;
  }) {
    if (!args.schooljaar) return;
    if (args.type === "klas" && !args.klasNaam) return;
    if (args.type === "klasgroep" && !args.klasgroepId) return;

    let query = supabase
      .from("sportfolio_openstellingen")
      .select("id, discipline_id, klas_naam, klasgroep_id, schooljaar, open_voor_leerlingen")
      .eq("schooljaar", args.schooljaar);

    query =
      args.type === "klas"
        ? query.eq("klas_naam", args.klasNaam!).is("klasgroep_id", null)
        : query.eq("klasgroep_id", args.klasgroepId!).is("klas_naam", null);

    const { data, error } = await query;
    if (error) {
      throw new Error(readableSupabaseError(error, "Kon openstellingen niet laden."));
    }

    setOpenstellingen((data ?? []) as Openstelling[]);
  }

  async function loadClassStudents(schooljaar: string) {
    // class_students bevat veel meer dan 1000 rijen (ook LO-, levensbeschouwelijke
    // en andere groepen). Supabase/PostgREST geeft standaard maximaal 1000 rijen
    // per request terug. Daarom laden we het gekozen schooljaar gepagineerd.
    const PAGE_SIZE = 1000;
    const rows: RawRow[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("class_students")
        .select("class_name, given_name, family_name, email, username, role, primary_class, schooljaar")
        .eq("schooljaar", schooljaar)
        .eq("role", "student")
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Kon klassen en leerlingen niet laden uit class_students.")
        );
      }

      const batch = (data ?? []) as RawRow[];
      rows.push(...batch);

      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    setLeerlingenRows(rows);

    const klasList = Array.from(
      new Set(
        rows
          .map(getKlasNaam)
          .filter((klas) => klas && isEchteKlas(klas))
      )
    ).sort((a, b) => a.localeCompare(b, "nl"));

    const firstKlasNaam =
      selectedKlasNaam && klasList.includes(selectedKlasNaam)
        ? selectedKlasNaam
        : klasList[0] ?? "";

    setSelectedKlasNaam(firstKlasNaam);

    if (firstKlasNaam) {
      await loadOpenstellingen({
        type: "klas",
        klasNaam: firstKlasNaam,
        schooljaar,
      });
    } else {
      setOpenstellingen([]);
    }
  }

  async function resolveProfiles(rows: RawRow[]): Promise<Leerling[]> {
    if (!rows.length) return [];

    const directIds = Array.from(
      new Set(
        rows
          .map((row) =>
            String(
              getValue(row, [
                "profiel_id",
                "leerling_id",
                "user_id",
                "id",
              ]) || ""
            )
          )
          .filter(Boolean)
      )
    );

    const emails = Array.from(
      new Set(rows.map(getEmail).filter(Boolean))
    );

    let query = supabase
      .from("profielen")
      .select("id, volledige_naam, email, klas_naam, leerjaar, graad, geslacht");

    if (directIds.length) {
      query = query.in("id", directIds);
    } else if (emails.length) {
      query = query.in("email", emails);
    } else {
      return [];
    }

    let { data, error } = await query;

    // Sommige views bevatten een eigen rij-id die niet het profiel-id is.
    // In dat geval proberen we veilig opnieuw via e-mail.
    if ((!data || data.length === 0) && emails.length) {
      const retry = await supabase
        .from("profielen")
        .select("id, volledige_naam, email, klas_naam, leerjaar, graad, geslacht")
        .in("email", emails);
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      throw new Error(readableSupabaseError(error, "Kon leerlingprofielen niet laden."));
    }

    return (data ?? [])
      .map((p: any) => ({
        id: String(p.id),
        naam: String(p.volledige_naam ?? p.email ?? "Onbekende leerling"),
        email: p.email ? String(p.email) : null,
        klas_naam: p.klas_naam ? String(p.klas_naam) : null,
        leerjaar: p.leerjaar == null ? null : Number(p.leerjaar),
        graad: p.graad == null ? null : Number(p.graad),
        geslacht: normalizeGender(p.geslacht),
      }))
      .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  }

  async function loadTargetLeerlingen() {
    clearMessages();

    try {
      let leerlingen: Leerling[] = [];

      if (doelType === "klas") {
        if (!selectedKlasNaam) {
          setTargetLeerlingen([]);
          return;
        }

        const rows = leerlingenRows.filter((row) => {
          const schooljaar = String(
            getValue(row, ["schooljaar", "school_year"]) || selectedSchooljaar
          );
          return (
            getKlasNaam(row) === selectedKlasNaam &&
            schooljaar === selectedSchooljaar
          );
        });

        leerlingen = await resolveProfiles(rows);
      } else {
        const leden = selectedKlasgroepLeden as unknown as RawRow[];
        leerlingen = await resolveProfiles(leden);
      }

      setTargetLeerlingen(leerlingen);

      const next: Record<string, ScoreDraft> = {};
      for (const leerling of leerlingen) {
        next[leerling.id] = { ...EMPTY_DRAFT };
      }
      setScoreDrafts(next);

      if (leerlingen.length === 0) {
        setExistingScores([]);
        setError("Geen leerlingprofielen gevonden voor deze selectie.");
      } else {
        await loadExistingScores(leerlingen, selectedDisciplineId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon leerlingen niet laden.");
    }
  }

  async function loadExistingScores(
    leerlingen: Leerling[] = targetLeerlingen,
    disciplineId: string = selectedDisciplineId
  ) {
    if (!disciplineId || !selectedSchooljaar || leerlingen.length === 0) {
      setExistingScores([]);
      return;
    }

    try {
      setLoadingExistingScores(true);

      const leerlingIds = leerlingen.map((l) => l.id);
      const { data, error } = await supabase
        .from("sportfolio_scores")
        .select(
          "id, leerling_id, discipline_id, schooljaar, score_nummer, score_tekst, eenheid, status, bevestigd_op, aangemaakt_op"
        )
        .eq("discipline_id", disciplineId)
        .eq("schooljaar", selectedSchooljaar)
        .in("leerling_id", leerlingIds)
        .order("aangemaakt_op", { ascending: false });

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Bestaande scores laden mislukt.")
        );
      }

      setExistingScores((data ?? []) as ExistingScore[]);
    } catch (err) {
      setExistingScores([]);
      setError(
        err instanceof Error ? err.message : "Kon bestaande scores niet laden."
      );
    } finally {
      setLoadingExistingScores(false);
    }
  }

  async function updateExistingScore(
    score: ExistingScore,
    nummer: string,
    tekstWaarde: string
  ) {
    if (!profiel) return;

    const scoreNummer = toNullableNumber(nummer);
    const scoreTekst = tekstWaarde.trim() || null;

    if (nummer.trim() && scoreNummer == null) {
      setError("De score is geen geldig getal.");
      return;
    }
    if (scoreNummer == null && !scoreTekst) {
      setError("Een score kan niet volledig leeg zijn.");
      return;
    }

    clearMessages();
    setSavingId(`score-${score.id}`);

    try {
      const { error } = await supabase
        .from("sportfolio_scores")
        .update({
          score_nummer: scoreNummer,
          score_tekst: scoreTekst,
          status: "bevestigd",
          bevestigd_door: profiel.id,
          bevestigd_op: new Date().toISOString(),
        })
        .eq("id", score.id);

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Score wijzigen mislukt.")
        );
      }

      await loadExistingScores();
      setSuccess("Score aangepast.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon score niet aanpassen.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteExistingScore(scoreId: string) {
    if (!window.confirm("Deze score definitief verwijderen?")) return;

    clearMessages();
    setSavingId(`delete-score-${scoreId}`);

    try {
      const { error } = await supabase
        .from("sportfolio_scores")
        .delete()
        .eq("id", scoreId);

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Score verwijderen mislukt.")
        );
      }

      await loadExistingScores();
      setSuccess("Score verwijderd.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon score niet verwijderen.");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmGroupScores() {
    if (!profiel || !selectedDiscipline || targetLeerlingen.length === 0) return;

    const submitted = existingScores.filter(
      (score) => String(score.status ?? "").toLowerCase() === "ingediend"
    );

    if (submitted.length === 0) {
      setError("Er zijn geen ingediende scores om te bevestigen.");
      return;
    }

    const groupLabel =
      doelType === "klas"
        ? selectedKlasNaam
        : `de gekozen klasgroep (${targetLeerlingen.length} leerlingen)`;

    const confirmed = window.confirm(
      `${submitted.length} ingediende score${submitted.length === 1 ? "" : "s"} voor ${selectedDiscipline.naam} van ${groupLabel} in ${selectedSchooljaar} bevestigen?`
    );

    if (!confirmed) return;

    clearMessages();
    setSavingId("confirm-group");

    try {
      const scoreIds = submitted.map((score) => score.id);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("sportfolio_scores")
        .update({
          status: "bevestigd",
          bevestigd_door: profiel.id,
          bevestigd_op: now,
        })
        .in("id", scoreIds);

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Groepsscores bevestigen mislukt.")
        );
      }

      await loadExistingScores();
      setSuccess(
        `${submitted.length} ingediende score${submitted.length === 1 ? "" : "s"} bevestigd.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kon de groepsscores niet bevestigen."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteGroupScores() {
    if (!selectedDiscipline || targetLeerlingen.length === 0) return;

    const groupLabel =
      doelType === "klas"
        ? selectedKlasNaam
        : `de gekozen klasgroep (${targetLeerlingen.length} leerlingen)`;

    const confirmed = window.confirm(
      `Alle scores voor ${selectedDiscipline.naam} van ${groupLabel} in ${selectedSchooljaar} verwijderen?\n\nDit verwijdert ALLE pogingen voor deze discipline van de leerlingen in de huidige selectie. Deze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) return;

    clearMessages();
    setSavingId("delete-group");

    try {
      const leerlingIds = targetLeerlingen.map((l) => l.id);

      const { error } = await supabase
        .from("sportfolio_scores")
        .delete()
        .eq("discipline_id", selectedDiscipline.id)
        .eq("schooljaar", selectedSchooljaar)
        .in("leerling_id", leerlingIds);

      if (error) {
        throw new Error(
          readableSupabaseError(error, "Groepsscores verwijderen mislukt.")
        );
      }

      await loadExistingScores();
      setSuccess(
        `Alle scores voor ${selectedDiscipline.naam} van de huidige selectie zijn verwijderd.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kon groepsscores niet verwijderen."
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      clearMessages();

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;

        if (!uid) {
          setAllowed(false);
          return;
        }

        const { data: profielData, error: profielError } = await supabase
          .from("profielen")
          .select("id, volledige_naam, rol, schooljaar")
          .eq("id", uid)
          .single();

        if (profielError) {
          throw new Error(readableSupabaseError(profielError, "Kon profiel niet laden."));
        }

        if (!["lo_leerkracht", "admin"].includes(String(profielData?.rol))) {
          setAllowed(false);
          return;
        }

        setAllowed(true);

        const profielValue = profielData as Profiel;
        setProfiel(profielValue);

        const schooljaar =
          profielValue.schooljaar === "2025-2026"
            ? suggestedSchoolyear()
            : profielValue.schooljaar ?? suggestedSchoolyear();

        setSelectedSchooljaar(schooljaar);

        await Promise.all([
          loadDisciplinesAndRubrics(),
          loadClassStudents(schooljaar),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon Sportfolio beheer niet laden.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!loading && allowed) {
      void loadTargetLeerlingen();
    }
    // doelgroep/klas/klasgroep wisselt: invoerlijst opnieuw opbouwen
  }, [
    doelType,
    selectedKlasNaam,
    selectedKlasgroepId,
    selectedKlasgroepLeden,
    selectedSchooljaar,
    loading,
    allowed,
  ]);

  useEffect(() => {
    if (!loading && allowed && targetLeerlingen.length > 0 && selectedDisciplineId) {
      void loadExistingScores(targetLeerlingen, selectedDisciplineId);
    } else {
      setExistingScores([]);
    }
  }, [selectedDisciplineId]);

  async function handleKlasChange(klasNaam: string) {
    setSelectedKlasNaam(klasNaam);
    clearMessages();

    try {
      await loadOpenstellingen({
        type: "klas",
        klasNaam,
        schooljaar: selectedSchooljaar,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon openstellingen niet laden.");
    }
  }

  async function handleSchooljaarLoad() {
    clearMessages();

    try {
      await loadClassStudents(selectedSchooljaar);

      if (doelType === "klasgroep" && selectedKlasgroepId) {
        await loadOpenstellingen({
          type: "klasgroep",
          klasgroepId: selectedKlasgroepId,
          schooljaar: selectedSchooljaar,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon schooljaar niet laden.");
    }
  }

  async function handleKlasgroepChange(id: string | null, leden: KlasgroepLid[]) {
    setSelectedKlasgroepId(id);
    setSelectedKlasgroepLeden(leden);
    clearMessages();

    if (!id) {
      setOpenstellingen([]);
      return;
    }

    try {
      await loadOpenstellingen({
        type: "klasgroep",
        klasgroepId: id,
        schooljaar: selectedSchooljaar,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon openstellingen niet laden.");
    }
  }

  async function toggleDiscipline(disciplineId: string, nextValue: boolean) {
    const doelGekozen =
      doelType === "klas" ? Boolean(selectedKlasNaam) : Boolean(selectedKlasgroepId);

    if (!profiel || !doelGekozen || !selectedSchooljaar) return;

    try {
      setSavingId(disciplineId);
      clearMessages();

      const existing = openstellingen.find(
        (row) => row.discipline_id === disciplineId
      );

      if (existing) {
        const { error } = await supabase
          .from("sportfolio_openstellingen")
          .update({
            open_voor_leerlingen: nextValue,
            geopend_door: profiel.id,
            geopend_op: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          throw new Error(readableSupabaseError(error, "Update openstelling mislukt."));
        }
      } else {
        const insertPayload = {
          discipline_id: disciplineId,
          klas_naam: doelType === "klas" ? selectedKlasNaam : null,
          klasgroep_id: doelType === "klasgroep" ? selectedKlasgroepId : null,
          schooljaar: selectedSchooljaar,
          open_voor_leerlingen: nextValue,
          geopend_door: profiel.id,
          geopend_op: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("sportfolio_openstellingen")
          .insert(insertPayload);

        if (error) {
          throw new Error(readableSupabaseError(error, "Insert openstelling mislukt."));
        }
      }

      await loadOpenstellingen({
        type: doelType,
        klasNaam: selectedKlasNaam,
        klasgroepId: selectedKlasgroepId,
        schooljaar: selectedSchooljaar,
      });

      setSuccess(nextValue ? "Discipline is opengezet." : "Discipline is gesloten.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon discipline niet aanpassen.");
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(
    leerlingId: string,
    field: keyof ScoreDraft,
    value: string
  ) {
    setScoreDrafts((current) => ({
      ...current,
      [leerlingId]: {
        ...(current[leerlingId] ?? EMPTY_DRAFT),
        [field]: value,
      },
    }));
  }

  async function saveClassScores() {
    if (!profiel || !selectedDiscipline) return;

    clearMessages();

    const rows = targetLeerlingen
      .map((leerling) => {
        const draft = scoreDrafts[leerling.id] ?? EMPTY_DRAFT;
        const scoreNummer = toNullableNumber(draft.nummer);
        const scoreTekst = draft.tekst.trim() || null;

        if (scoreNummer == null && !scoreTekst) return null;

        return {
          leerling_id: leerling.id,
          discipline_id: selectedDiscipline.id,
          schooljaar: selectedSchooljaar,
          klas_naam: leerling.klas_naam ?? (doelType === "klas" ? selectedKlasNaam : null),
          score_nummer: scoreNummer,
          score_tekst: scoreTekst,
          eenheid: selectedDiscipline.eenheid,
          status: "bevestigd",
          bevestigd_door: profiel.id,
          bevestigd_op: new Date().toISOString(),
          extra_data: {
            bron: "sportfolio_beheer_klasinvoer",
            doelgroep: doelType,
            klasgroep_id: doelType === "klasgroep" ? selectedKlasgroepId : null,
          },
        };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      setError("Vul minstens één score in.");
      return;
    }

    try {
      setSavingScores(true);

      const { error } = await supabase
        .from("sportfolio_scores")
        .insert(rows as any[]);

      if (error) {
        throw new Error(readableSupabaseError(error, "Scores opslaan mislukt."));
      }

      setSuccess(
        `${rows.length} ${rows.length === 1 ? "score is" : "scores zijn"} bevestigd en opgeslagen.`
      );

      const cleared: Record<string, ScoreDraft> = {};
      for (const leerling of targetLeerlingen) {
        cleared[leerling.id] = { ...EMPTY_DRAFT };
      }
      setScoreDrafts(cleared);
      await loadExistingScores(targetLeerlingen, selectedDiscipline.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon scores niet opslaan.");
    } finally {
      setSavingScores(false);
    }
  }

  async function addDiscipline() {
    const naam = newNaam.trim();
    const eenheid = newEenheid.trim();

    if (!naam) {
      setError("Geef een naam voor de discipline.");
      return;
    }

    if (!eenheid) {
      setError("Geef een eenheid voor de discipline.");
      return;
    }

    clearMessages();

    try {
      setSavingDiscipline(true);

      const slug = makeSlug(naam);
      if (!slug) {
        throw new Error("Kon geen geldige slug maken van de disciplinenaam.");
      }

      const { data, error } = await supabase
        .from("sportfolio_disciplines")
        .insert({
          slug,
          naam,
          categorie: newCategorie.trim() || null,
          eenheid,
          hoger_is_beter: newHogerIsBeter,
          actief: true,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(readableSupabaseError(error, "Discipline toevoegen mislukt."));
      }

      if (newGraden.length) {
        const { error: gradeError } = await supabase
          .from("sportfolio_discipline_graden")
          .insert(
            newGraden.map((graad) => ({
              discipline_id: data.id,
              graad,
            }))
          );

        if (gradeError) {
          throw new Error(
            readableSupabaseError(
              gradeError,
              "Discipline is gemaakt, maar de graadkoppeling mislukte."
            )
          );
        }
      }

      setNewNaam("");
      setNewCategorie("");
      setNewEenheid("");
      setNewHogerIsBeter(true);
      setNewGraden([]);

      await loadDisciplinesAndRubrics();
      setSuccess("Nieuwe discipline toegevoegd.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon discipline niet toevoegen.");
    } finally {
      setSavingDiscipline(false);
    }
  }

  async function toggleGrade(disciplineId: string, graad: number) {
    clearMessages();
    setSavingId(`grade-${disciplineId}-${graad}`);

    try {
      const current = gradeMap[disciplineId] ?? [];
      const hasGrade = current.includes(graad);

      if (hasGrade) {
        const { error } = await supabase
          .from("sportfolio_discipline_graden")
          .delete()
          .eq("discipline_id", disciplineId)
          .eq("graad", graad);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sportfolio_discipline_graden")
          .insert({ discipline_id: disciplineId, graad });

        if (error) throw error;
      }

      await loadDisciplinesAndRubrics();
    } catch (err: any) {
      setError(readableSupabaseError(err, "Graadkoppeling aanpassen mislukt."));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(discipline: Discipline) {
    clearMessages();
    setSavingId(`active-${discipline.id}`);

    try {
      const { error } = await supabase
        .from("sportfolio_disciplines")
        .update({ actief: discipline.actief === false })
        .eq("id", discipline.id);

      if (error) throw error;

      await loadDisciplinesAndRubrics();
    } catch (err: any) {
      setError(readableSupabaseError(err, "Discipline aanpassen mislukt."));
    } finally {
      setSavingId(null);
    }
  }

  async function addRubric() {
    if (!rubricDisciplineId) {
      setError("Kies eerst een discipline.");
      return;
    }

    const min = toNullableNumber(rubricMin);
    const max = toNullableNumber(rubricMax);

    if (rubricMin.trim() && min == null) {
      setError("Minimumscore is geen geldig getal.");
      return;
    }
    if (rubricMax.trim() && max == null) {
      setError("Maximumscore is geen geldig getal.");
      return;
    }
    if (min != null && max != null && min >= max) {
      setError("Minimumscore moet kleiner zijn dan maximumscore.");
      return;
    }

    clearMessages();

    try {
      setSavingRubric(true);

      const { error } = await supabase
        .from("sportfolio_rubrics")
        .insert({
          discipline_id: rubricDisciplineId,
          geslacht: rubricGeslacht === "algemeen" ? null : rubricGeslacht,
          leerjaar: rubricLeerjaar,
          min_score: min,
          max_score: max,
          niveau: rubricNiveau,
          label: rubricLabel.trim() || null,
          volgorde: rubricVolgorde,
        });

      if (error) {
        throw new Error(readableSupabaseError(error, "Rubric toevoegen mislukt."));
      }

      setRubricMin("");
      setRubricMax("");
      setRubricLabel("");
      setRubricVolgorde((v) => Math.min(4, v + 1));

      await loadDisciplinesAndRubrics();
      setSuccess("Rubricregel toegevoegd.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon rubric niet toevoegen.");
    } finally {
      setSavingRubric(false);
    }
  }

  async function deleteRubric(id: string) {
    clearMessages();
    setSavingId(`rubric-${id}`);

    try {
      const { error } = await supabase
        .from("sportfolio_rubrics")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadDisciplinesAndRubrics();
      setSuccess("Rubricregel verwijderd.");
    } catch (err: any) {
      setError(readableSupabaseError(err, "Rubric verwijderen mislukt."));
    } finally {
      setSavingId(null);
    }
  }

  function rubricCoverage(disciplineId: string) {
    const rows = rubrics.filter((r) => r.discipline_id === disciplineId);
    if (!rows.length) return { ok: false, text: "Geen rubrics" };

    const grades = gradeMap[disciplineId] ?? [];
    const relevantYears =
      grades.length > 0
        ? Array.from(
            new Set(
              grades.flatMap((g) =>
                g === 1 ? [1, 2] : g === 2 ? [3, 4] : [5, 6]
              )
            )
          )
        : Array.from(new Set(rows.map((r) => r.leerjaar).filter(Boolean))) as number[];

    if (!relevantYears.length) {
      return { ok: true, text: `${rows.length} rubricregels` };
    }

    const missing: string[] = [];
    for (const leerjaar of relevantYears) {
      for (const geslacht of ["jongen", "meisje"]) {
        const matching = rows.filter(
          (r) =>
            r.leerjaar === leerjaar &&
            (!r.geslacht || normalizeGender(r.geslacht) === geslacht)
        );
        if (matching.length < 4) {
          missing.push(`${geslacht} L${leerjaar}`);
        }
      }
    }

    if (missing.length) {
      return {
        ok: false,
        text: `Onvolledig: ${missing.join(", ")}`,
      };
    }

    return { ok: true, text: "Rubrics volledig" };
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Sportfolio beheer">
        <p className="text-white/80">Laden...</p>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Geen toegang">
        <section className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <h2 className="m-0 text-xl font-black text-white">Geen toegang</h2>
          <p className="mt-2 text-sm text-white/65">
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
          </p>
          <Link href="/sportfolio" className="mt-4 inline-flex font-black text-white">
            Terug naar Sportfolio →
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Sportfolio beheer"
      userName={profiel?.volledige_naam}
    >
      <section className="rounded-[26px] border border-white/10 bg-white/5 p-5">
        <Link
          href="/sportfolio"
          className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/80 transition hover:bg-white/10"
        >
          ← Terug naar Sportfolio
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
              LO Leerkrachtbeheer
            </div>
            <h1 className="mt-2 text-[28px] font-black text-white sm:text-[34px]">
              Sportfolio beheren
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              Voer resultaten in voor een volledige klas of klasgroep, beheer
              leerlinginvoer en onderhoud disciplines en rubrics.
            </p>
          </div>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            {profiel?.rol}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["scores", "Scores invoeren"],
            ["openstellingen", "Openstellingen"],
            ["beheer", "Disciplines & rubrics"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={[
                "rounded-2xl border px-4 py-2.5 text-sm font-black transition",
                tab === key
                  ? "border-white/25 bg-white text-black"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-[20px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {(tab === "scores" || tab === "openstellingen") && (
        <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-black text-white">Doelgroep</div>
          <div className="mt-1 text-xs text-white/60">
            Kies het schooljaar en werk met een officiële klas of met één van je klasgroepen.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                Schooljaar
              </label>
              <input
                value={selectedSchooljaar}
                onChange={(e) => setSelectedSchooljaar(e.target.value)}
                placeholder="2026-2027"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                Doelgroep
              </label>
              <select
                value={doelType}
                onChange={(e) => {
                  const next = e.target.value as DoelType;
                  setDoelType(next);
                  setOpenstellingen([]);
                  if (next === "klas" && selectedKlasNaam) {
                    void loadOpenstellingen({
                      type: "klas",
                      klasNaam: selectedKlasNaam,
                      schooljaar: selectedSchooljaar,
                    });
                  }
                }}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                <option value="klas" className="bg-neutral-900">
                  Officiële klas
                </option>
                <option value="klasgroep" className="bg-neutral-900">
                  Mijn klasgroep
                </option>
              </select>
            </div>

            {doelType === "klas" ? (
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                  Klas
                </label>
                <select
                  value={selectedKlasNaam}
                  onChange={(e) => void handleKlasChange(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
                >
                  {klassen.length === 0 ? (
                    <option value="" className="bg-neutral-900">
                      Geen klassen gevonden
                    </option>
                  ) : (
                    klassen.map((klas) => (
                      <option key={klas} value={klas} className="bg-neutral-900">
                        {klas}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <KlasgroepSelector
                schooljaar={selectedSchooljaar}
                value={selectedKlasgroepId}
                onChange={handleKlasgroepChange}
                includeAllOption={false}
              />
            )}

            <div className="flex items-end">
              <button
                onClick={() => void handleSchooljaarLoad()}
                className="h-12 rounded-2xl border border-white/15 bg-black/40 px-5 text-sm font-black text-white transition hover:bg-black/55"
              >
                Laden
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === "scores" ? (
        <>
          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                  Discipline
                </label>
                <select
                  value={selectedDisciplineId}
                  onChange={(e) => setSelectedDisciplineId(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
                >
                  {activeDisciplines.map((discipline) => (
                    <option
                      key={discipline.id}
                      value={discipline.id}
                      className="bg-neutral-900"
                    >
                      {discipline.naam}
                      {discipline.eenheid ? ` (${discipline.eenheid})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                  {targetLeerlingen.length} leerlingen
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-4">
              <div className="text-base font-black text-white">
                {selectedDiscipline?.naam ?? "Scores"}
              </div>
              <div className="mt-1 text-xs text-white/60">
                Scores die je hier opslaat worden onmiddellijk als bevestigd bewaard.
                De rubric wordt tijdens het invoeren al berekend.
              </div>
            </div>

            {targetLeerlingen.length === 0 ? (
              <div className="p-5 text-sm text-white/60">
                Geen leerlingen gevonden voor deze selectie.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left">
                  <thead className="bg-black/20 text-xs uppercase tracking-[0.08em] text-white/50">
                    <tr>
                      <th className="px-4 py-3">Leerling</th>
                      <th className="px-4 py-3">Klas</th>
                      <th className="px-4 py-3">Geslacht</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Tekst / opmerking</th>
                      <th className="px-4 py-3">Rubric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {targetLeerlingen.map((leerling) => {
                      const draft = scoreDrafts[leerling.id] ?? EMPTY_DRAFT;
                      const numericScore = toNullableNumber(draft.nummer);
                      const rubric = selectedDiscipline
                        ? getRubricForScore(
                            rubrics,
                            selectedDiscipline.id,
                            numericScore,
                            leerling.geslacht,
                            leerling.leerjaar
                          )
                        : null;

                      return (
                        <tr key={leerling.id} className="text-sm text-white/80">
                          <td className="px-4 py-3 font-bold text-white">
                            {leerling.naam}
                            <div className="mt-0.5 text-[11px] font-medium text-white/40">
                              L{leerling.leerjaar ?? "?"} • graad {leerling.graad ?? "?"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/60">
                            {leerling.klas_naam ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-white/60">
                            {leerling.geslacht ?? "onbekend"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                inputMode="decimal"
                                value={draft.nummer}
                                onChange={(e) =>
                                  updateDraft(leerling.id, "nummer", e.target.value)
                                }
                                placeholder="0"
                                className="h-10 w-28 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white outline-none focus:border-white/25"
                              />
                              <span className="text-xs text-white/45">
                                {selectedDiscipline?.eenheid ?? ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={draft.tekst}
                              onChange={(e) =>
                                updateDraft(leerling.id, "tekst", e.target.value)
                              }
                              placeholder="optioneel"
                              className="h-10 w-full min-w-44 rounded-xl border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-white/25"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {numericScore == null ? (
                              <span className="text-xs text-white/35">—</span>
                            ) : rubric ? (
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                                  rubricBadgeClass(rubric.niveau),
                                ].join(" ")}
                              >
                                {rubric.niveau ?? rubric.label ?? "Rubric"}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-100">
                                Geen rubric
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
              <div className="text-xs text-white/50">
                Lege rijen worden niet opgeslagen.
              </div>
              <button
                onClick={() => void saveClassScores()}
                disabled={
                  savingScores ||
                  !selectedDiscipline ||
                  targetLeerlingen.length === 0
                }
                className="h-11 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-50"
              >
                {savingScores ? "Opslaan..." : "Scores bevestigen & opslaan"}
              </button>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <div className="text-base font-black text-white">
                  Reeds opgeslagen scores
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Alle pogingen voor de gekozen discipline, het schooljaar en de huidige klas/klasgroep.
                  Je kunt ingediende leerlingenscores in één keer bevestigen, een score corrigeren of verwijderen, of de volledige selectie wissen.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void confirmGroupScores()}
                  disabled={
                    savingId === "confirm-group" ||
                    !selectedDiscipline ||
                    existingScores.every(
                      (score) => String(score.status ?? "").toLowerCase() !== "ingediend"
                    )
                  }
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingId === "confirm-group"
                    ? "Bevestigen..."
                    : `Alle ingediende scores bevestigen${
                        existingScores.filter(
                          (score) => String(score.status ?? "").toLowerCase() === "ingediend"
                        ).length > 0
                          ? ` (${existingScores.filter(
                              (score) => String(score.status ?? "").toLowerCase() === "ingediend"
                            ).length})`
                          : ""
                      }`}
                </button>

                <button
                  onClick={() => void deleteGroupScores()}
                  disabled={
                    savingId === "delete-group" ||
                    existingScores.length === 0 ||
                    !selectedDiscipline
                  }
                  className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingId === "delete-group"
                    ? "Verwijderen..."
                    : "Alle scores van deze groep verwijderen"}
                </button>
              </div>
            </div>

            {loadingExistingScores ? (
              <div className="p-5 text-sm text-white/60">Bestaande scores laden...</div>
            ) : existingScores.length === 0 ? (
              <div className="p-5 text-sm text-white/55">
                Nog geen opgeslagen scores voor deze selectie.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="bg-black/20 text-xs uppercase tracking-[0.08em] text-white/50">
                    <tr>
                      <th className="px-4 py-3">Leerling</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Tekst</th>
                      <th className="px-4 py-3">Rubric</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {existingScores.map((score) => {
                      const leerling = targetLeerlingen.find(
                        (l) => l.id === score.leerling_id
                      );
                      const rubric = selectedDiscipline
                        ? getRubricForScore(
                            rubrics,
                            selectedDiscipline.id,
                            score.score_nummer == null
                              ? null
                              : Number(score.score_nummer),
                            leerling?.geslacht ?? null,
                            leerling?.leerjaar ?? null
                          )
                        : null;

                      return (
                        <ExistingScoreRow
                          key={score.id}
                          score={score}
                          leerling={leerling}
                          rubric={rubric}
                          savingId={savingId}
                          onSave={updateExistingScore}
                          onDelete={deleteExistingScore}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {tab === "openstellingen" ? (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-white">Disciplines</div>
              <div className="text-xs text-white/60">
                {doelType === "klas" && selectedKlasNaam
                  ? `Openstellingen voor ${selectedKlasNaam} • ${selectedSchooljaar}`
                  : doelType === "klasgroep" && selectedKlasgroepId
                  ? `Openstellingen voor je klasgroep • ${selectedKlasgroepLeden.length} leerlingen • ${selectedSchooljaar}`
                  : "Kies eerst een doelgroep."}
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
              {activeDisciplines.length} disciplines
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeDisciplines.map((discipline) => {
              const openstelling = openstellingen.find(
                (row) => row.discipline_id === discipline.id
              );
              const isOpen = Boolean(openstelling?.open_voor_leerlingen);

              return (
                <div
                  key={discipline.id}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-white">
                        {discipline.naam}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        {discipline.categorie ?? "Algemeen"}
                        {discipline.eenheid ? ` • ${discipline.eenheid}` : ""}
                      </div>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-black",
                        isOpen
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-white/60",
                      ].join(" ")}
                    >
                      {isOpen ? "Open" : "Gesloten"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      void toggleDiscipline(discipline.id, !isOpen)
                    }
                    disabled={
                      savingId === discipline.id ||
                      (doelType === "klas"
                        ? !selectedKlasNaam
                        : !selectedKlasgroepId)
                    }
                    className={[
                      "mt-4 h-11 w-full rounded-2xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                      isOpen
                        ? "border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/15"
                        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
                    ].join(" ")}
                  >
                    {savingId === discipline.id
                      ? "Opslaan..."
                      : isOpen
                      ? "Discipline sluiten"
                      : "Discipline openzetten"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "beheer" ? (
        <>
          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-base font-black text-white">
              Nieuwe discipline
            </div>
            <div className="mt-1 text-xs text-white/60">
              Een nieuwe actieve discipline wordt beschikbaar in Sportfolio.
              De Hall of Fame koppelen we in de volgende stap aan dezelfde tabel.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={newNaam}
                onChange={(e) => setNewNaam(e.target.value)}
                placeholder="Naam, bv. Speerwerpen"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />
              <input
                value={newCategorie}
                onChange={(e) => setNewCategorie(e.target.value)}
                placeholder="Categorie, bv. werpen"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />
              <input
                value={newEenheid}
                onChange={(e) => setNewEenheid(e.target.value)}
                placeholder="Eenheid, bv. m"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />
              <select
                value={newHogerIsBeter ? "hoog" : "laag"}
                onChange={(e) => setNewHogerIsBeter(e.target.value === "hoog")}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                <option value="hoog" className="bg-neutral-900">
                  Hoger = beter
                </option>
                <option value="laag" className="bg-neutral-900">
                  Lager = beter
                </option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-black uppercase tracking-[0.08em] text-white/50">
                Graden
              </span>
              {[1, 2, 3].map((graad) => (
                <button
                  key={graad}
                  onClick={() =>
                    setNewGraden((current) =>
                      current.includes(graad)
                        ? current.filter((g) => g !== graad)
                        : [...current, graad].sort()
                    )
                  }
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-black",
                    newGraden.includes(graad)
                      ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
                      : "border-white/10 bg-white/5 text-white/55",
                  ].join(" ")}
                >
                  {graad}e graad
                </button>
              ))}

              <button
                onClick={() => void addDiscipline()}
                disabled={savingDiscipline}
                className="ml-auto h-10 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-black text-emerald-100 disabled:opacity-50"
              >
                {savingDiscipline ? "Toevoegen..." : "Discipline toevoegen"}
              </button>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3">
              <div className="text-base font-black text-white">
                Bestaande disciplines
              </div>
              <div className="mt-1 text-xs text-white/60">
                Koppel disciplines aan graden en controleer of rubrics volledig zijn.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {disciplines.map((discipline) => {
                const coverage = rubricCoverage(discipline.id);
                const grades = gradeMap[discipline.id] ?? [];

                return (
                  <div
                    key={discipline.id}
                    className="rounded-[22px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-white">
                          {discipline.naam}
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          {discipline.categorie ?? "Algemeen"} •{" "}
                          {discipline.eenheid ?? "geen eenheid"} •{" "}
                          {discipline.hoger_is_beter === false
                            ? "lager = beter"
                            : "hoger = beter"}
                        </div>
                      </div>

                      <button
                        onClick={() => void toggleActive(discipline)}
                        disabled={savingId === `active-${discipline.id}`}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-black",
                          discipline.actief !== false
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                            : "border-white/10 bg-white/5 text-white/45",
                        ].join(" ")}
                      >
                        {discipline.actief !== false ? "Actief" : "Inactief"}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[1, 2, 3].map((graad) => {
                        const active = grades.includes(graad);
                        return (
                          <button
                            key={graad}
                            onClick={() => void toggleGrade(discipline.id, graad)}
                            disabled={
                              savingId === `grade-${discipline.id}-${graad}`
                            }
                            className={[
                              "rounded-xl border px-3 py-2 text-xs font-black transition",
                              active
                                ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
                                : "border-white/10 bg-white/5 text-white/45",
                            ].join(" ")}
                          >
                            {graad}e graad
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className={[
                        "mt-3 rounded-xl border px-3 py-2 text-xs font-bold",
                        coverage.ok
                          ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-100"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-100",
                      ].join(" ")}
                    >
                      {coverage.ok ? "✓ " : "⚠ "}
                      {coverage.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-base font-black text-white">Rubrics beheren</div>
            <div className="mt-1 text-xs text-white/60">
              Voeg grenswaarden toe per discipline, leerjaar en geslacht.
              Maximum is exclusief: 1800–2400 betekent ≥1800 en &lt;2400.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={rubricDisciplineId}
                onChange={(e) => setRubricDisciplineId(e.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                {disciplines.map((discipline) => (
                  <option
                    key={discipline.id}
                    value={discipline.id}
                    className="bg-neutral-900"
                  >
                    {discipline.naam}
                  </option>
                ))}
              </select>

              <select
                value={rubricLeerjaar}
                onChange={(e) => setRubricLeerjaar(Number(e.target.value))}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((leerjaar) => (
                  <option
                    key={leerjaar}
                    value={leerjaar}
                    className="bg-neutral-900"
                  >
                    Leerjaar {leerjaar}
                  </option>
                ))}
              </select>

              <select
                value={rubricGeslacht}
                onChange={(e) =>
                  setRubricGeslacht(
                    e.target.value as "jongen" | "meisje" | "algemeen"
                  )
                }
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                <option value="jongen" className="bg-neutral-900">
                  Jongen
                </option>
                <option value="meisje" className="bg-neutral-900">
                  Meisje
                </option>
                <option value="algemeen" className="bg-neutral-900">
                  Algemeen
                </option>
              </select>

              <select
                value={rubricNiveau}
                onChange={(e) => setRubricNiveau(e.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              >
                {["-", "+/-", "+", "++"].map((niveau) => (
                  <option key={niveau} value={niveau} className="bg-neutral-900">
                    Niveau {niveau}
                  </option>
                ))}
              </select>

              <input
                value={rubricMin}
                onChange={(e) => setRubricMin(e.target.value)}
                placeholder="Minimum (leeg = geen)"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />

              <input
                value={rubricMax}
                onChange={(e) => setRubricMax(e.target.value)}
                placeholder="Maximum (leeg = geen)"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />

              <input
                value={rubricLabel}
                onChange={(e) => setRubricLabel(e.target.value)}
                placeholder="Label (optioneel)"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
              />

              <div className="grid grid-cols-[100px_1fr] gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={rubricVolgorde}
                  onChange={(e) => setRubricVolgorde(Number(e.target.value))}
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
                  title="Volgorde"
                />
                <button
                  onClick={() => void addRubric()}
                  disabled={savingRubric}
                  className="h-12 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-sm font-black text-emerald-100 disabled:opacity-50"
                >
                  {savingRubric ? "Opslaan..." : "Toevoegen"}
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10">
              <div className="border-b border-white/10 bg-black/20 px-4 py-3">
                <div className="font-black text-white">
                  {rubricDiscipline?.naam ?? "Rubrics"}
                </div>
                <div className="text-xs text-white/45">
                  {visibleRubrics.length} rubricregels
                </div>
              </div>

              {visibleRubrics.length === 0 ? (
                <div className="p-4 text-sm text-amber-100">
                  ⚠ Deze discipline heeft nog geen rubrics.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead className="bg-black/20 text-xs uppercase tracking-[0.08em] text-white/45">
                      <tr>
                        <th className="px-4 py-3">Leerjaar</th>
                        <th className="px-4 py-3">Geslacht</th>
                        <th className="px-4 py-3">Minimum</th>
                        <th className="px-4 py-3">Maximum</th>
                        <th className="px-4 py-3">Niveau</th>
                        <th className="px-4 py-3">Label</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {visibleRubrics.map((rubric) => (
                        <tr key={rubric.id} className="text-white/75">
                          <td className="px-4 py-3">{rubric.leerjaar ?? "alle"}</td>
                          <td className="px-4 py-3">
                            {rubric.geslacht ?? "algemeen"}
                          </td>
                          <td className="px-4 py-3">
                            {rubric.min_score ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {rubric.max_score ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-black",
                                rubricBadgeClass(rubric.niveau),
                              ].join(" ")}
                            >
                              {rubric.niveau ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{rubric.label ?? "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => void deleteRubric(rubric.id)}
                              disabled={savingId === `rubric-${rubric.id}`}
                              className="rounded-xl border border-red-400/15 bg-red-400/10 px-3 py-1.5 text-xs font-black text-red-100 disabled:opacity-50"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
