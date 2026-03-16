"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  leerjaar: string | null;
  geslacht: string | null;
};

type Discipline = {
  id: string;
  slug: string;
  naam: string;
  categorie: string | null;
  eenheid: string | null;
  hoger_is_beter: boolean;
  actief: boolean;
};

type ScoreRow = {
  id: string;
  discipline_id: string;
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid: string | null;
  status: string | null;
  aangemaakt_op: string;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

function getRoleLabel(role?: string | null, rol?: string | null) {
  const raw = (role ?? rol ?? "").toLowerCase();
  if (raw === "teacher" || raw === "leerkracht") return "Leerkracht";
  return "Leerling";
}

function formatScore(score?: ScoreRow | null) {
  if (!score) return "Nog geen score";

  if (score.score_nummer !== null && score.score_nummer !== undefined) {
    return `${score.score_nummer} ${score.eenheid ?? ""}`.trim();
  }

  if (score.score_tekst) return score.score_tekst;

  return "Geen score";
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

type SportfolioCardProps = {
  discipline: Discipline;
  latestScore?: ScoreRow | null;
};

function SportfolioCard({ discipline, latestScore }: SportfolioCardProps) {
  return (
    <Link
      href={`/sportfolio/${discipline.slug}`}
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.08)]"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(75,142,141,0.16)] blur-[16px] transition duration-200 group-hover:scale-110" />
      <div className="absolute inset-0 rounded-[24px] opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.18),rgba(75,142,141,0.16),rgba(137,194,170,0.12))]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/30 text-xl">
              {iconForCategorie(discipline.categorie)}
            </div>

            <div>
              <div className="text-[15px] font-black tracking-[0.01em] text-white">
                {discipline.naam}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {discipline.eenheid ? `Eenheid: ${discipline.eenheid}` : "Sportfolio discipline"}
              </div>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/70">
            {discipline.categorie ?? "algemeen"}
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
              Laatste score
            </div>
            <div className="mt-1 text-base font-black text-white">
              {formatScore(latestScore)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
                Status
              </div>
              <div className="mt-1">
                <span
                  className={[
                    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                    getStatusClasses(latestScore?.status),
                  ].join(" ")}
                >
                  {getStatusLabel(latestScore?.status)}
                </span>
              </div>
            </div>

            <div className="text-sm font-black text-white/90">Openen →</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SportfolioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);

  const roleLabel = useMemo(
    () => getRoleLabel(profiel?.role, profiel?.rol),
    [profiel?.role, profiel?.rol]
  );

  useEffect(() => {
    const load = async () => {
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
          .select("id, volledige_naam, role, rol, klas_naam, schooljaar, leerjaar, geslacht")
          .eq("id", userId)
          .maybeSingle();

        if (profielError) throw profielError;
        if (!profielData) throw new Error("Profiel niet gevonden.");

        setProfiel(profielData as Profiel);

        const { data: disciplinesData, error: disciplinesError } = await supabase
          .from("sportfolio_disciplines")
          .select("id, slug, naam, categorie, eenheid, hoger_is_beter, actief")
          .eq("actief", true)
          .order("naam", { ascending: true });

        if (disciplinesError) throw disciplinesError;
        setDisciplines((disciplinesData ?? []) as Discipline[]);

        const { data: scoresData, error: scoresError } = await supabase
          .from("sportfolio_scores")
          .select("id, discipline_id, score_nummer, score_tekst, eenheid, status, aangemaakt_op")
          .eq("leerling_id", userId)
          .eq("schooljaar", profielData.schooljaar ?? "")
          .order("aangemaakt_op", { ascending: false });

        if (scoresError) throw scoresError;
        setScores((scoresData ?? []) as ScoreRow[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Onbekende fout.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const latestScoreByDiscipline = useMemo(() => {
    const map = new Map<string, ScoreRow>();

    for (const score of scores) {
      if (!map.has(score.discipline_id)) {
        map.set(score.discipline_id, score);
      }
    }

    return map;
  }, [scores]);

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Sportfolio laden…</div>
      </main>
    );
  }

  return (
    <AppShell
      title="Sportfolio"
      subtitle="GO! Atheneum Avelgem"
      userName={profiel?.volledige_naam}
    >
      <BaseHero
        label="SPORTFOLIO"
        title={<>Jouw prestaties per discipline</>}
        description={
          <>
            Bekijk je scores, open een discipline voor detail, en volg je voortgang
            binnen het huidige schooljaar.
          </>
        }
        imageSrc="/sportfolio/sportfolio.png"
        imageAlt="Sportfolio overzicht"
        quoteTitle="Focus"
        quote="Elke discipline toont je laatste score en status in één helder overzicht."
        quoteAuthor="Sportfolio"
        imageClassName="max-h-[320px] md:max-h-[360px]"
        actions={
          <>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
              {roleLabel}
            </span>

            {profiel?.klas_naam ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                {profiel.klas_naam}
              </span>
            ) : null}

            {profiel?.schooljaar ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                {profiel.schooljaar}
              </span>
            ) : null}
          </>
        }
      />

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

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-white">Disciplines</div>
            <div className="text-xs text-white/60">
              Klik op een discipline om je detailweergave te openen.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
            {disciplines.length} items
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {disciplines.map((discipline) => (
            <SportfolioCard
              key={discipline.id}
              discipline={discipline}
              latestScore={latestScoreByDiscipline.get(discipline.id) ?? null}
            />
          ))}
        </div>
      </section>

      {roleLabel === "Leerkracht" ? (
        <section className="mt-5">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-black text-white">Leerkrachtbeheer</div>
            <div className="mt-1 text-sm text-white/65">
              Beheerpagina volgt in de volgende stap.
            </div>

            <Link
              href="/sportfolio/beheer"
              className="mt-4 inline-flex h-11 items-center rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-black text-white transition hover:bg-black/55"
            >
              Naar beheer →
            </Link>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}