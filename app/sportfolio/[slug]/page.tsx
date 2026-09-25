"use client";

import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  leerjaar: string | null;
  geslacht: string | null;
  graad: string | null;
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

type ScoreRow = {
  id: string;
  leerling_id: string;
  discipline_id: string;
  schooljaar: string;
  klas_naam: string | null;
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid: string | null;
  status: string | null;
  bevestigd_door: string | null;
  bevestigd_op: string | null;
  aangemaakt_op: string;
  extra_data: Record<string, unknown> | null;
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

type LeaderboardRow = {
  leerling_id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  geslacht: string | null;
  graad: number | null;
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid: string | null;
};


function BeepDetail({ score, previous }: { score: ScoreRow; previous?: ScoreRow }) {
  const d = score.extra_data ?? {};
  if (d.bron !== "lo_beeptest") return null;
  const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : null;
  const distance = number(d.afstand_meter);
  const duration = number(d.testduur_seconden);
  const prevDistance = previous?.extra_data?.bron === "lo_beeptest" ? number(previous.extra_data.afstand_meter) : null;
  const time = duration === null ? "—" : `${Math.floor(duration/60)}:${String(Math.round(duration%60)).padStart(2,"0")}`;
  return <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-white">
    <h3 className="text-lg font-black">Jouw Beep-test in detail</h3>
    <p className="mt-1 text-3xl font-black">Niveau {String(d.niveau)} · shuttle {String(d.shuttle)}</p>
    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-xl bg-black/20 p-3"><div className="text-white/60">Afstand</div><b>{distance === null ? "—" : `${distance} m`}</b></div>
      <div className="rounded-xl bg-black/20 p-3"><div className="text-white/60">Testduur</div><b>{time}</b></div>
      <div className="rounded-xl bg-black/20 p-3"><div className="text-white/60">Volledige shuttles</div><b>{String(d.totaal_shuttles ?? "—")}</b></div>
      <div className="rounded-xl bg-black/20 p-3"><div className="text-white/60">Testdatum</div><b>{d.testdatum ? new Date(String(d.testdatum)).toLocaleDateString("nl-BE") : "—"}</b></div>
    </div>
    {prevDistance !== null && distance !== null && <p className="mt-3 text-sm">Evolutie tegenover vorige bevestigde Beep-test: {distance-prevDistance >= 0 ? "+" : ""}{distance-prevDistance} meter.</p>}
    <p className="mt-3 text-xs text-white/65">De beoordeling en VO₂max worden niet getoond zolang de Eurofit-normeenheid en schattingsformule niet gevalideerd zijn.</p>
  </div>;
}

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

function getRoleLabel(role?: string | null, rol?: string | null) {
  const raw = (rol ?? role ?? "").trim().toLowerCase();
  if (["teacher", "leerkracht", "lo_leerkracht", "admin"].includes(raw)) {
    return "Leerkracht";
  }
  return "Leerling";
}

function normalizeGender(value?: string | null) {
  const raw = (value ?? "").toLowerCase().trim();
  if (raw === "jongen" || raw === "man" || raw === "m") return "jongen";
  if (raw === "meisje" || raw === "vrouw" || raw === "v") return "meisje";
  return raw || null;
}

function getRubricForScore(args: {
  score: number | null;
  rubrics: RubricRow[];
  geslacht?: string | null;
  leerjaar?: string | null;
}) {
  const { score, rubrics, geslacht, leerjaar } = args;

  if (score === null || score === undefined) return null;

  const normalizedGender = normalizeGender(geslacht);
  const numericLeerjaar = leerjaar ? Number(leerjaar) : null;

  const matches = rubrics.filter((r) => {
    const genderOk =
      !r.geslacht ||
      r.geslacht.toLowerCase() === normalizedGender ||
      r.geslacht.toLowerCase() === "algemeen";

    const leerjaarOk =
      r.leerjaar === null ||
      r.leerjaar === undefined ||
      !numericLeerjaar ||
      r.leerjaar === numericLeerjaar;

    const minOk = r.min_score === null || r.min_score === undefined || score >= r.min_score;
    const maxOk = r.max_score === null || r.max_score === undefined || score < r.max_score;

    return genderOk && leerjaarOk && minOk && maxOk;
  });

  return matches[0] ?? null;
}

function getStatusLabel(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "bevestigd":
      return "Bevestigd";
    case "ingediend":
      return "Ingediend";
    case "te_herzien":
      return "Te herzien";
    case "afgekeurd":
      return "Afgekeurd";
    default:
      return "Nog niets";
  }
}

function getStatusClasses(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "bevestigd":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "ingediend":
      return "border-amber-300/20 bg-amber-300/10 text-amber-100";
    case "te_herzien":
      return "border-orange-300/20 bg-orange-300/10 text-orange-100";
    case "afgekeurd":
      return "border-red-400/20 bg-red-400/10 text-red-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function getRubricClasses(niveau?: string | null) {
  switch ((niveau ?? "").trim()) {
    case "++":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "+":
      return "border-yellow-300/20 bg-yellow-300/10 text-yellow-100";
    case "+/-":
      return "border-orange-300/20 bg-orange-300/10 text-orange-100";
    case "-":
      return "border-red-400/20 bg-red-400/10 text-red-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function iconForCategorie(categorie?: string | null) {
  switch ((categorie ?? "").toLowerCase()) {
    case "springen":
      return "🦘";
    case "werpen":
      return "💥";
    case "duur":
      return "🏃";
    case "lopen":
      return "⚡";
    case "combi":
      return "🔥";
    default:
      return "🏅";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatScoreValue(args: {
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid?: string | null;
}) {
  if (args.score_nummer !== null && args.score_nummer !== undefined) {
    return `${args.score_nummer} ${args.eenheid ?? ""}`.trim();
  }

  if (args.score_tekst) return args.score_tekst;
  return "—";
}

export default function DisciplineDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [scoresAlleJaren, setScoresAlleJaren] = useState<ScoreRow[]>([]);
  const [scoresHuidigSchooljaar, setScoresHuidigSchooljaar] = useState<ScoreRow[]>([]);
  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);

  const [scoreInput, setScoreInput] = useState("");
  const [tekstInput, setTekstInput] = useState("");
  const [deelnameStatus, setDeelnameStatus] = useState<"score" | "afwezig" | "geblesseerd">("score");

  const roleLabel = useMemo(
    () => getRoleLabel(profiel?.role, profiel?.rol),
    [profiel?.role, profiel?.rol]
  );

  const isLeerling = roleLabel === "Leerling";
  const isLeerkracht = roleLabel === "Leerkracht";

  const latestCurrentYearScore = useMemo(
    () => (scoresHuidigSchooljaar.length > 0 ? scoresHuidigSchooljaar[0] : null),
    [scoresHuidigSchooljaar]
  );

  // In Sportfolio tonen we voor het huidige schooljaar altijd de BESTE numerieke score.
  // Afwezig/geblesseerd (tekstscore zonder nummer) telt nooit mee als prestatie.
  const bestCurrentYearScore = useMemo(() => {
    const numeric = scoresHuidigSchooljaar.filter(
      (row) => row.score_nummer !== null && row.score_nummer !== undefined
    );
    if (numeric.length === 0) return latestCurrentYearScore;

    return [...numeric].sort((a, b) => {
      const av = Number(a.score_nummer);
      const bv = Number(b.score_nummer);
      return discipline?.hoger_is_beter ? bv - av : av - bv;
    })[0] ?? latestCurrentYearScore;
  }, [scoresHuidigSchooljaar, latestCurrentYearScore, discipline?.hoger_is_beter]);

  const currentRubric = useMemo(() => {
    return getRubricForScore({
      score: bestCurrentYearScore?.score_nummer ?? null,
      rubrics,
      geslacht: profiel?.geslacht,
      leerjaar: profiel?.leerjaar,
    });
  }, [bestCurrentYearScore, rubrics, profiel?.geslacht, profiel?.leerjaar]);

  const leerlingMagIngeven = useMemo(() => {
    if (isLeerkracht) return true;
    if (!isLeerling) return false;
    if (!disciplineOpen) return false;

    if (!latestCurrentYearScore) return true;

    const status = (latestCurrentYearScore.status ?? "").toLowerCase();
    return status !== "bevestigd";
  }, [isLeerkracht, isLeerling, disciplineOpen, latestCurrentYearScore]);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const userId = sessionData.session?.user?.id;
      if (!userId) {
        window.location.replace("/login");
        return;
      }

      const { data: profielData, error: profielError } = await supabase
        .from("profielen")
        .select("id, volledige_naam, role, rol, klas_naam, schooljaar, leerjaar, geslacht, graad")
        .eq("id", userId)
        .maybeSingle();

      if (profielError) throw profielError;
      if (!profielData) throw new Error("Profiel niet gevonden.");

      const profielValue = profielData as Profiel;
      setProfiel(profielValue);

      const { data: disciplineData, error: disciplineError } = await supabase
        .from("sportfolio_disciplines")
        .select("id, slug, naam, categorie, eenheid, hoger_is_beter, actief")
        .eq("slug", slug)
        .maybeSingle();

      if (disciplineError) throw disciplineError;
      if (!disciplineData) throw new Error("Discipline niet gevonden.");

      const disciplineValue = disciplineData as Discipline;
      setDiscipline(disciplineValue);

      const { data: rubricData, error: rubricError } = await supabase
        .from("sportfolio_rubrics")
        .select("id, discipline_id, geslacht, leerjaar, min_score, max_score, niveau, label, volgorde")
        .eq("discipline_id", disciplineValue.id)
        .order("leerjaar", { ascending: true })
        .order("geslacht", { ascending: true })
        .order("volgorde", { ascending: true });

      if (rubricError) throw rubricError;
      setRubrics((rubricData ?? []) as RubricRow[]);

      const { data: allScoresData, error: allScoresError } = await supabase
        .from("sportfolio_scores")
        .select(`
          id,
          leerling_id,
          discipline_id,
          schooljaar,
          klas_naam,
          score_nummer,
          score_tekst,
          eenheid,
          status,
          bevestigd_door,
          bevestigd_op,
          aangemaakt_op,
          extra_data
        `)
        .eq("leerling_id", userId)
        .eq("discipline_id", disciplineValue.id)
        .order("schooljaar", { ascending: false })
        .order("aangemaakt_op", { ascending: false });

      if (allScoresError) throw allScoresError;

      const allScores = (allScoresData ?? []) as ScoreRow[];
      setScoresAlleJaren(allScores);

      const currentYearScores = allScores.filter(
        (row) => row.schooljaar === (profielValue.schooljaar ?? "")
      );
      setScoresHuidigSchooljaar(currentYearScores);

      if (currentYearScores.length > 0) {
        const first = currentYearScores[0];
        setScoreInput(
          first.score_nummer !== null && first.score_nummer !== undefined
            ? String(first.score_nummer)
            : ""
        );
        setTekstInput(first.score_tekst ?? "");
        const tekst = (first.score_tekst ?? "").trim().toLowerCase();
        setDeelnameStatus(
          tekst === "afwezig" ? "afwezig" : tekst === "geblesseerd" ? "geblesseerd" : "score"
        );
      } else {
        setScoreInput("");
        setTekstInput("");
        setDeelnameStatus("score");
      }

      const { data: openData, error: openstellingError } = await supabase.rpc(
        "sportfolio_discipline_is_open",
        {
          p_discipline_id: disciplineValue.id,
          p_schooljaar: profielValue.schooljaar ?? "",
        }
      );

      if (openstellingError) throw openstellingError;
      setDisciplineOpen(Boolean(openData));

      const profielGraad = Number(profielValue.graad);

      if (Number.isFinite(profielGraad) && profielGraad >= 1 && profielGraad <= 3) {
        const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
          "sportfolio_leaderboard",
          {
            p_discipline_id: disciplineValue.id,
            p_schooljaar: profielValue.schooljaar ?? "",
            p_graad: profielGraad,
          }
        );

        if (leaderboardError) throw leaderboardError;

        const rawLeaderboard = (leaderboardData ?? []) as LeaderboardRow[];

        // Veiligheidsnet: als de RPC meerdere scores per leerling teruggeeft,
        // behouden we hier expliciet alleen de beste score van dit schooljaar.
        const bestPerLeerling = new Map<string, LeaderboardRow>();
        for (const row of rawLeaderboard) {
          const current = bestPerLeerling.get(row.leerling_id);
          if (!current) {
            bestPerLeerling.set(row.leerling_id, row);
            continue;
          }

          const rv = row.score_nummer;
          const cv = current.score_nummer;
          if (rv == null) continue;
          if (cv == null || (disciplineValue.hoger_is_beter ? rv > cv : rv < cv)) {
            bestPerLeerling.set(row.leerling_id, row);
          }
        }

        const sortedLeaderboard = [...bestPerLeerling.values()].sort((a, b) => {
          const av = a.score_nummer;
          const bv = b.score_nummer;
          if (av === null || av === undefined) return 1;
          if (bv === null || bv === undefined) return -1;
          return disciplineValue.hoger_is_beter ? bv - av : av - bv;
        });

        setLeaderboard(sortedLeaderboard);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kon discipline niet laden.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!slug) return;
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const meisjesLeaderboard = useMemo(
    () => leaderboard.filter((row) => row.geslacht === "meisje"),
    [leaderboard]
  );

  const jongensLeaderboard = useMemo(
    () => leaderboard.filter((row) => row.geslacht === "jongen"),
    [leaderboard]
  );

  const graadLabel = profiel?.graad ? `${profiel.graad}e graad` : "jouw graad";

  async function handleSubmitScore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!profiel || !discipline) return;
    if (!leerlingMagIngeven) return;

    try {
      setSubmitting(true);
      setError(null);

      const numericValue =
        deelnameStatus === "score" &&
        scoreInput.trim().length > 0 &&
        !Number.isNaN(Number(scoreInput))
          ? Number(scoreInput)
          : null;

      const textValue =
        deelnameStatus === "afwezig"
          ? "Afwezig"
          : deelnameStatus === "geblesseerd"
          ? "Geblesseerd"
          : tekstInput.trim().length > 0
          ? tekstInput.trim()
          : null;

      if (numericValue === null && !textValue) {
        throw new Error("Geef een score in of kies afwezig/geblesseerd.");
      }

      const payload = {
        leerling_id: profiel.id,
        discipline_id: discipline.id,
        schooljaar: profiel.schooljaar ?? "",
        klas_naam: profiel.klas_naam ?? null,
        score_nummer: numericValue,
        score_tekst: textValue,
        eenheid: discipline.eenheid ?? null,
        status: "ingediend",
        bevestigd_door: null,
        bevestigd_op: null,
        extra_data: null,
      };

      if (latestCurrentYearScore) {
        const currentStatus = (latestCurrentYearScore.status ?? "").toLowerCase();

        if (currentStatus === "bevestigd" && isLeerling) {
          throw new Error("Deze score is bevestigd en kan niet meer aangepast worden.");
        }

        const { error: updateError } = await supabase
          .from("sportfolio_scores")
          .update(payload)
          .eq("id", latestCurrentYearScore.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("sportfolio_scores")
          .insert(payload);

        if (insertError) throw insertError;
      }

      await loadPage();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kon score niet opslaan.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Discipline laden…</div>
      </main>
    );
  }

  if (!profiel || !discipline) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Discipline niet gevonden.</div>
      </main>
    );
  }

  return (
    <AppShell
      title="Sportfolio"
      subtitle="GO! Atheneum Avelgem"
      userName={profiel.volledige_naam}
    >
      <section
        className="relative overflow-hidden rounded-[26px] border border-white/10 p-4 sm:p-5"
        style={{
          background:
            "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
        }}
      >
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[rgba(75,142,141,0.18)] blur-[26px]" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[rgba(137,194,170,0.14)] blur-[32px]" />

        <div className="relative z-10">
          <Link
            href="/sportfolio"
            className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            ← Terug
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
                Discipline
              </div>

              <h1 className="mt-2 flex items-center gap-3 text-[28px] font-black leading-tight text-white sm:text-[34px]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/30 text-2xl">
                  {iconForCategorie(discipline.categorie)}
                </span>
                {discipline.naam}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                Bekijk je laatste score, je historiek over schooljaren en het klassement van dit schooljaar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profiel.schooljaar ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                  {profiel.schooljaar}
                </span>
              ) : null}

              {profiel.klas_naam ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                  {profiel.klas_naam}
                </span>
              ) : null}

              <span
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-bold",
                  disciplineOpen
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/65",
                ].join(" ")}
              >
                {disciplineOpen ? "Open voor invoer" : "Gesloten"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="mt-4 rounded-[20px] border p-4 text-sm"
          style={{
            background: ui.errorBg,
            borderColor: ui.errorBorder,
            color: ui.text,
          }}
        >
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-white">Beste score huidig schooljaar</div>
                <div className="text-xs text-white/60">Beste geregistreerde prestatie voor {profiel.schooljaar ?? "dit schooljaar"}</div>
              </div>

              <span
                className={[
                  "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  getStatusClasses(bestCurrentYearScore?.status),
                ].join(" ")}
              >
                {getStatusLabel(bestCurrentYearScore?.status)}
              </span>
            </div>

            <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
                Score
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                {bestCurrentYearScore
                  ? formatScoreValue({
                      score_nummer: bestCurrentYearScore.score_nummer,
                      score_tekst: bestCurrentYearScore.score_tekst,
                      eenheid: discipline.eenheid,
                    })
                  : "Nog geen score"}
              </div>

              {discipline.slug === "beep_test" && bestCurrentYearScore?.status === "bevestigd" &&
                <BeepDetail score={bestCurrentYearScore} previous={scoresAlleJaren.find(s => s.id !== bestCurrentYearScore.id && s.status === "bevestigd" && s.extra_data?.bron === "lo_beeptest")} />}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
                    Datum
                  </div>
                  <div className="mt-1 text-sm font-bold text-white/90">
                    {formatDateTime(bestCurrentYearScore?.aangemaakt_op)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
                    Niveau
                  </div>
                  <div className="mt-1">
                    {currentRubric ? (
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1.5 text-sm font-black",
                          getRubricClasses(currentRubric.niveau),
                        ].join(" ")}
                      >
                        {currentRubric.niveau ?? "—"}
                      </span>
                    ) : (
                      <span className="text-sm text-white/60">Nog geen rubric</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-black text-white">Score ingeven / aanpassen</div>
            <div className="mt-1 text-sm text-white/60">
              Leerlingen kunnen enkel indienen als de discipline open staat. Bevestigde scores zijn niet meer wijzigbaar.
            </div>

            <form onSubmit={handleSubmitScore} className="mt-4 grid gap-3">
              {isLeerling ? (
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                    Deelname
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["score", "Score"],
                      ["afwezig", "Afwezig"],
                      ["geblesseerd", "Geblesseerd"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        disabled={!leerlingMagIngeven}
                        onClick={() => setDeelnameStatus(value as "score" | "afwezig" | "geblesseerd")}
                        className={[
                          "min-h-11 rounded-xl border px-3 text-sm font-black transition",
                          deelnameStatus === value
                            ? "border-white/30 bg-white text-black"
                            : "border-white/10 bg-white/5 text-white/70",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                  Numerieke score
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder={`Bijv. 12 ${discipline.eenheid ?? ""}`}
                  disabled={!leerlingMagIngeven || deelnameStatus !== "score"}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
                  Tekstscore / opmerking
                </label>
                <input
                  type="text"
                  value={tekstInput}
                  onChange={(e) => setTekstInput(e.target.value)}
                  placeholder="Optioneel"
                  disabled={!leerlingMagIngeven || deelnameStatus !== "score"}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !leerlingMagIngeven}
                  className="inline-flex h-12 items-center rounded-2xl border border-white/15 bg-black/40 px-5 text-sm font-black text-white transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Opslaan..."
                    : latestCurrentYearScore
                    ? "Score bijwerken"
                    : "Score indienen"}
                </button>

                <div className="text-sm text-white/60">
                  {!disciplineOpen && isLeerling
                    ? "Deze discipline is momenteel gesloten voor leerlingen."
                    : latestCurrentYearScore?.status?.toLowerCase() === "bevestigd" && isLeerling
                    ? "Je score is bevestigd en kan niet meer aangepast worden."
                    : "Je score krijgt status 'ingediend'."}
                </div>
              </div>
            </form>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-black text-white">Jouw historiek over schooljaren</div>
            <div className="mt-1 text-xs text-white/60">
              Deze scores blijven zichtbaar in volgende schooljaren.
            </div>

            <div className="mt-4 grid gap-3">
              {scoresAlleJaren.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  Nog geen scores geregistreerd.
                </div>
              ) : (
                scoresAlleJaren.map((score) => {
                  const rowRubric = getRubricForScore({
                    score: score.score_nummer,
                    rubrics,
                    geslacht: profiel.geslacht,
                    leerjaar: profiel.leerjaar,
                  });

                  return (
                    <div
                      key={score.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-black text-white">
                            {formatScoreValue({
                              score_nummer: score.score_nummer,
                              score_tekst: score.score_tekst,
                              eenheid: discipline.eenheid,
                            })}
                          </div>

                          <div className="mt-1 text-xs text-white/55">
                            {score.schooljaar} • {formatDateTime(score.aangemaakt_op)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {rowRubric ? (
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                                getRubricClasses(rowRubric.niveau),
                              ].join(" ")}
                            >
                              {rowRubric.niveau}
                            </span>
                          ) : null}

                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                              getStatusClasses(score.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(score.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-white">Automatisch klassement</div>
                <div className="mt-1 text-xs text-white/60">
                  Enkel bevestigde scores van dit schooljaar en jouw graad. Meisjes en jongens hebben een apart klassement.
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
                {leaderboard.length} leerlingen
              </div>
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-1 gap-4">
              {[
                { titel: "Meisjes", rows: meisjesLeaderboard },
                { titel: "Jongens", rows: jongensLeaderboard },
              ].map((groep) => (
                <div
                  key={groep.titel}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-white">
                        {groep.titel} · {graadLabel}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/50">
                        {groep.rows.length} bevestigde leerlingen
                      </div>
                    </div>
                  </div>

                  <div className="grid max-h-[430px] min-h-0 content-start gap-2 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:max-h-[520px]" role="region" aria-label={`Scrolbaar klassement ${groep.titel}` } tabIndex={0}>
                    {groep.rows.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                        Nog geen bevestigde scores.
                      </div>
                    ) : (
                      groep.rows.map((row, index) => (
                        <div
                          key={`${groep.titel}-${row.leerling_id}`}
                          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(110px,auto)] sm:items-center sm:p-4"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-base font-black text-white">
                            {index + 1}
                          </div>

                          <div className="min-w-0 self-center">
                            <div className="break-words text-[15px] font-extrabold leading-snug text-white sm:text-base [overflow-wrap:anywhere]">
                              {row.volledige_naam ?? "Onbekende leerling"}
                            </div>
                            <div className="mt-1 break-words text-xs font-semibold text-white/75">
                              {row.klas_naam ?? "Geen klas"}
                            </div>
                          </div>

                          <div className="col-span-2 min-w-0 rounded-xl border border-emerald-300/30 bg-emerald-950/70 px-3 py-2.5 sm:col-span-1 sm:justify-self-end sm:text-right">
                            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-100/90">
                              Behaalde score
                            </div>
                            <div className="mt-0.5 break-words text-lg font-black leading-tight text-white sm:text-xl [overflow-wrap:anywhere]">
                              {formatScoreValue({
                                score_nummer: row.score_nummer,
                                score_tekst: row.score_tekst,
                                eenheid: discipline.eenheid,
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-black text-white">Hoe werkt het klassement?</div>
            <div className="mt-3 grid gap-2 text-sm text-white/65">
              <div>• Alleen scores met status <span className="font-black text-white">bevestigd</span> tellen mee.</div>
              <div>• Het klassement kijkt enkel naar <span className="font-black text-white">dit schooljaar en jouw graad</span>.</div>
              <div>• <span className="font-black text-white">Meisjes en jongens</span> worden afzonderlijk gerangschikt.</div>
              <div>• Per leerling telt automatisch de <span className="font-black text-white">beste bevestigde score</span>.</div>
              <div>
                • Bij <span className="font-black text-white">sprint / triatlon / 3000m</span> is lager beter.
              </div>
              <div>
                • Bij <span className="font-black text-white">springen / werpen / MAS / beep test / cooper</span> is hoger beter.
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
