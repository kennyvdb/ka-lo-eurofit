"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const EVENT_ID = "survival-trophy-2026";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  klas_naam: string | null;
  leerjaar: number | string | null;
};

type Config = {
  id: string;
  schooljaar: string;
  max_plaatsen: number;
  inschrijvingen_open: boolean;
  tweede_graad_open: boolean;
};

type Inschrijving = {
  id: string;
  event_id: string;
  leerling_id: string;
  status: "ingeschreven" | "uitgeschreven";
  ingeschreven_op: string;
  uitgeschreven_op: string | null;
};

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getLeerjaar(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;

  const parsed = Number(String(value).trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateTime(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
          {icon}
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
            {label}
          </div>

          <div className="mt-1 text-sm font-black leading-5 text-slate-100">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalButton({
  href,
  children,
  variant = "dark",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "cyan" | "orange";
}) {
  const styles = {
    dark:
      "border-white/[0.10] bg-white/[0.05] text-white hover:border-white/[0.18] hover:bg-white/[0.08]",
    cyan:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:border-cyan-400/30 hover:bg-cyan-400/15",
    orange:
      "border-orange-400/20 bg-orange-400/10 text-orange-200 hover:border-orange-400/30 hover:bg-orange-400/15",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-center text-sm font-black transition duration-200 hover:-translate-y-0.5 ${styles[variant]}`}
    >
      {children}
    </a>
  );
}

export default function AdventureTrophyPage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [inschrijving, setInschrijving] = useState<Inschrijving | null>(null);
  const [aantal, setAantal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setProfiel(null);
        return;
      }

      const [
        profielResult,
        configResult,
        inschrijvingResult,
        countResult,
      ] = await Promise.all([
        supabase
          .from("profielen")
          .select("id, volledige_naam, rol, klas_naam, leerjaar")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("adventure_trophy_config")
          .select(
            "id, schooljaar, max_plaatsen, inschrijvingen_open, tweede_graad_open"
          )
          .eq("id", EVENT_ID)
          .maybeSingle(),

        supabase
          .from("adventure_trophy_inschrijvingen")
          .select(
            "id, event_id, leerling_id, status, ingeschreven_op, uitgeschreven_op"
          )
          .eq("event_id", EVENT_ID)
          .eq("leerling_id", user.id)
          .maybeSingle(),

        supabase.rpc("get_adventure_trophy_count", {
          p_event_id: EVENT_ID,
        }),
      ]);

      if (profielResult.error) throw profielResult.error;
      if (configResult.error) throw configResult.error;
      if (inschrijvingResult.error) throw inschrijvingResult.error;
      if (countResult.error) throw countResult.error;

      setProfiel((profielResult.data as Profiel | null) ?? null);
      setConfig((configResult.data as Config | null) ?? null);
      setInschrijving(
        (inschrijvingResult.data as Inschrijving | null) ?? null
      );

      setAantal(Number(countResult.data ?? 0));
    } catch (error) {
      console.error("Adventure Trophy laden mislukt:", error);
      setErrorMessage(
        "De inschrijvingsgegevens konden niet geladen worden. Probeer de pagina opnieuw."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const leerjaar = getLeerjaar(profiel?.leerjaar);
  const rol = normalizeRole(profiel?.rol);

  const isLeerling = rol === "leerling";
  const derdeGraad = leerjaar === 5 || leerjaar === 6 || leerjaar === 7;
  const tweedeGraad = leerjaar === 3 || leerjaar === 4;

  const isActiefIngeschreven = inschrijving?.status === "ingeschreven";
  const wasUitgeschreven = inschrijving?.status === "uitgeschreven";

  const maxPlaatsen = config?.max_plaatsen ?? 20;
  const vrijePlaatsen = Math.max(0, maxPlaatsen - aantal);
  const volzet = aantal >= maxPlaatsen;

  const magDeelnemen = useMemo(() => {
    if (!isLeerling) return false;

    if (derdeGraad) return true;

    if (tweedeGraad && config?.tweede_graad_open) {
      return true;
    }

    return false;
  }, [
    isLeerling,
    derdeGraad,
    tweedeGraad,
    config?.tweede_graad_open,
  ]);

  const progressPercentage =
    maxPlaatsen > 0
      ? Math.min(100, Math.round((aantal / maxPlaatsen) * 100))
      : 0;

  async function inschrijven() {
    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "inschrijven_adventure_trophy",
        {
          p_event_id: EVENT_ID,
        }
      );

      if (error) {
        const message = `${error.message ?? ""} ${
          error.details ?? ""
        }`.toUpperCase();

        if (message.includes("ADVENTURE_TROPHY_VOLZET")) {
          setErrorMessage(
            "De 20 plaatsen zijn helaas intussen ingenomen. De Survival Trophy is volzet."
          );
          await loadData(false);
          return;
        }

        if (message.includes("INSCHRIJVINGEN_GESLOTEN")) {
          setErrorMessage(
            "De inschrijvingen zijn momenteel gesloten door de LO-leerkrachten."
          );
          await loadData(false);
          return;
        }

        if (message.includes("NIET_TOEGELATEN")) {
          setErrorMessage(
            "Je leerjaar kan zich momenteel niet inschrijven voor de Survival Trophy."
          );
          return;
        }

        if (message.includes("LEERJAAR_ONBEKEND")) {
          setErrorMessage(
            "We konden je leerjaar niet bepalen. Neem contact op met een LO-leerkracht."
          );
          return;
        }

        throw error;
      }

      setSuccessMessage(
        wasUitgeschreven
          ? "Je bent opnieuw ingeschreven voor de Survival Trophy! 🔥"
          : "Je bent ingeschreven voor de Survival Trophy! 🔥"
      );

      await loadData(false);
    } catch (error) {
      console.error("Inschrijven mislukt:", error);

      setErrorMessage(
        "Je inschrijving kon niet opgeslagen worden. Probeer opnieuw."
      );
    } finally {
      setSaving(false);
    }
  }

  async function uitschrijven() {
    if (saving) return;

    const confirmed = window.confirm(
      "Ben je zeker dat je je wilt uitschrijven voor de Survival Trophy? Je plaats komt opnieuw vrij voor een andere leerling."
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "uitschrijven_adventure_trophy",
        {
          p_event_id: EVENT_ID,
        }
      );

      if (error) throw error;

      setSuccessMessage(
        "Je bent uitgeschreven. Je plaats is opnieuw vrijgekomen."
      );

      await loadData(false);
    } catch (error) {
      console.error("Uitschrijven mislukt:", error);

      setErrorMessage(
        "Uitschrijven is niet gelukt. Probeer opnieuw of neem contact op met een LO-leerkracht."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Survival Trophy"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="NA-SCHOOLSE ACTIVITEIT"
        title={
          <>
            Survival Trophy <span className="opacity-85">🔥</span>
          </>
        }
        description={
          <>
            Omdat je geen zin hebt in een saaie woensdag.{" "}
            <strong className="text-white">Je wil avontuur.</strong>
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="Survival Trophy"
        quoteTitle="Durf jij het aan?"
        quote="25 obstakels. 1 team. 0 excuses."
        quoteAuthor="Survival Trophy"
        actions={
          <Link
            href="/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            ← Terug naar activiteiten
          </Link>
        }
      />

      <section className="mt-5">
        <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
          {/* POSTER */}
          <div className="lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-black shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
              <div className="relative aspect-[1024/1448] w-full">
                <Image
                  src="/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten/adventure-trophy.jpg"
                  alt="Poster Survival Trophy 2026"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 400px"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                ✓ Gratis deelname
              </span>

              <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                3e graad
              </span>

              {config?.tweede_graad_open && (
                <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-violet-300">
                  + 2e graad
                </span>
              )}
            </div>
          </div>

          {/* INHOUD */}
          <div className="space-y-5">
            {/* INTRO */}
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-orange-300">
                  🔥 Survival Trophy 2026
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                  Blaarmeersen • Gent
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Omdat je geen zin hebt in een saaie woensdag.
                <span className="block text-cyan-300">Je wil avontuur.</span>
              </h1>

              <p className="mt-5 max-w-3xl text-[15px] font-semibold leading-7 text-slate-300">
                In 2025 trotseerden maar liefst{" "}
                <strong className="text-white">
                  2.912 leerlingen en leerkrachten
                </strong>{" "}
                dit zinderende parcours van 5 kilometer. Onderweg wachten maar
                liefst 25 obstakels die je dwars door water, modder, hoogte en
                diepte leiden.
              </p>

              <p className="mt-4 max-w-3xl text-[15px] font-semibold leading-7 text-slate-300">
                De Survival Trophy is geen gewone sportdag en zeker geen
                wandeling in het park. Het is{" "}
                <strong className="text-white">
                  modder, zweet en pure teamspirit
                </strong>
                . Je springt, kruipt, klimt en ploetert samen met je
                klasgenoten door het parcours.
              </p>

              <div className="mt-6 rounded-[22px] border border-orange-400/15 bg-orange-400/[0.055] p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-300">
                  25 obstakels • 1 team • 0 excuses
                </div>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                  Water, touwen, muren, glijbanen, netten en obstakels die je
                  tot het uiterste drijven. Maar je geeft niet op. Samen bereik
                  je de finish.
                </p>
              </div>
            </div>

            {/* ONZE EDITIE */}
            <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(145deg,rgba(8,47,73,0.32),rgba(8,13,25,0.98))] p-5 sm:p-7 lg:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                Onze deelname
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                Woensdag 7 oktober 2026
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                Deze editie in de Blaarmeersen is specifiek voorzien voor
                West-Vlaamse scholen.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  icon="📅"
                  label="Datum"
                  value="Woensdag 7 oktober 2026"
                />

                <InfoCard
                  icon="📍"
                  label="Locatie"
                  value="Blaarmeersen • Gent"
                />

                <InfoCard
                  icon="🎓"
                  label="Voor wie?"
                  value={
                    config?.tweede_graad_open
                      ? "2e en 3e graad"
                      : "Leerlingen 3e graad"
                  }
                />

                <InfoCard icon="🏃" label="Parcours" value="5 kilometer" />

                <InfoCard icon="🧗" label="Obstakels" value="25 obstakels" />

                <InfoCard icon="💶" label="Prijs" value="Gratis" />
              </div>
            </div>

            {/* INSCHRIJVEN */}
            <div className="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(145deg,rgba(8,47,73,0.46),rgba(8,13,25,0.98))] shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                      Inschrijving GO! Atheneum Avelgem
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      Reserveer je plaats 🔥
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                      Er zijn maximaal{" "}
                      <strong className="text-white">
                        {maxPlaatsen} plaatsen
                      </strong>
                      . Inschrijven gebeurt volgens het principe: eerst
                      ingeschreven, eerst verzekerd van een plaats.
                    </p>
                  </div>

                  <div
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-center ${
                      volzet
                        ? "border-rose-400/20 bg-rose-400/10"
                        : "border-emerald-400/20 bg-emerald-400/10"
                    }`}
                  >
                    <div
                      className={`text-2xl font-black ${
                        volzet ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {loading ? "…" : vrijePlaatsen}
                    </div>

                    <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      plaatsen vrij
                    </div>
                  </div>
                </div>

                {/* CAPACITEIT */}
                <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-black text-white">
                      Bezetting
                    </strong>

                    <span className="text-sm font-black text-cyan-200">
                      {aantal} / {maxPlaatsen}
                    </span>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        volzet
                          ? "bg-rose-400"
                          : progressPercentage >= 75
                          ? "bg-orange-400"
                          : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${progressPercentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    {loading
                      ? "Beschikbaarheid laden..."
                      : volzet
                      ? "Alle plaatsen zijn momenteel ingenomen."
                      : vrijePlaatsen === 1
                      ? "Er is nog 1 plaats beschikbaar."
                      : `Er zijn nog ${vrijePlaatsen} plaatsen beschikbaar.`}
                  </p>
                </div>

                {/* FOUT / SUCCES */}
                {errorMessage && (
                  <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold leading-6 text-rose-200">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold leading-6 text-emerald-200">
                    ✓ {successMessage}
                  </div>
                )}

                {/* LOADING */}
                {loading && (
                  <div className="mt-5 rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-5 text-sm font-bold text-slate-400">
                    Inschrijvingsgegevens laden...
                  </div>
                )}

                {/* ACTIEF INGESCHREVEN */}
                {!loading && isActiefIngeschreven && (
                  <div className="mt-5 rounded-[24px] border border-emerald-400/25 bg-emerald-400/[0.08] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-2xl">
                        ✓
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                          Je bent ingeschreven
                        </div>

                        <h3 className="mt-1 text-xl font-black text-white">
                          Jouw plaats is gereserveerd!
                        </h3>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                          Je inschrijving werd geregistreerd op{" "}
                          <strong className="text-white">
                            {formatDateTime(inschrijving?.ingeschreven_op ?? null)}
                          </strong>
                          .
                        </p>

                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                          Kun je toch niet deelnemen? Schrijf je dan tijdig uit,
                          zodat je plaats beschikbaar komt voor een andere
                          leerling.
                        </p>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={uitschrijven}
                          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm font-black text-rose-200 transition hover:border-rose-400/35 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving ? "Even geduld..." : "Uitschrijven"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EERDER UITGESCHREVEN */}
                {!loading && wasUitgeschreven && (
                  <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-400/[0.07] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl">
                        ↩️
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                          Eerder uitgeschreven
                        </div>

                        <h3 className="mt-1 text-lg font-black text-white">
                          Je bent momenteel niet ingeschreven
                        </h3>

                        {inschrijving?.uitgeschreven_op && (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                            Je schreef je uit op{" "}
                            <strong className="text-white">
                              {formatDateTime(inschrijving.uitgeschreven_op)}
                            </strong>
                            .
                          </p>
                        )}

                        {magDeelnemen &&
                          config?.inschrijvingen_open &&
                          !volzet && (
                            <p className="mt-2 text-sm font-semibold text-slate-400">
                              Je kunt je opnieuw inschrijven zolang er plaatsen
                              beschikbaar zijn.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* INSCHRIJVEN */}
                {!loading &&
                  !isActiefIngeschreven &&
                  magDeelnemen &&
                  config?.inschrijvingen_open &&
                  !volzet && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={inschrijven}
                      className="mt-5 flex min-h-14 w-full items-center justify-center rounded-[20px] border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.25),rgba(20,184,166,0.18))] px-5 text-base font-black text-white shadow-[0_14px_40px_rgba(6,182,212,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:shadow-[0_18px_45px_rgba(6,182,212,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Inschrijving verwerken..."
                        : wasUitgeschreven
                        ? "🔥 Opnieuw inschrijven"
                        : "🔥 Schrijf mij in"}
                    </button>
                  )}

                {/* VOLZET */}
                {!loading &&
                  !isActiefIngeschreven &&
                  magDeelnemen &&
                  volzet && (
                    <div className="mt-5 rounded-[22px] border border-rose-400/20 bg-rose-400/[0.07] p-5">
                      <div className="text-lg font-black text-rose-200">
                        Volzet
                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                        Alle {maxPlaatsen} plaatsen zijn momenteel ingenomen.
                        Wanneer iemand zich uitschrijft, komt die plaats
                        automatisch opnieuw beschikbaar.
                      </p>
                    </div>
                  )}

                {/* INSCHRIJVINGEN GESLOTEN */}
                {!loading &&
                  !isActiefIngeschreven &&
                  magDeelnemen &&
                  !config?.inschrijvingen_open && (
                    <div className="mt-5 rounded-[22px] border border-amber-400/20 bg-amber-400/[0.07] p-5">
                      <div className="text-lg font-black text-amber-200">
                        Inschrijvingen gesloten
                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                        De LO-leerkrachten hebben de inschrijvingen momenteel
                        gesloten.
                      </p>
                    </div>
                  )}

                {/* 2E GRAAD NOG NIET OPEN */}
                {!loading &&
                  isLeerling &&
                  tweedeGraad &&
                  !config?.tweede_graad_open &&
                  !isActiefIngeschreven && (
                    <div className="mt-5 rounded-[22px] border border-violet-400/20 bg-violet-400/[0.07] p-5">
                      <div className="text-lg font-black text-violet-200">
                        Inschrijving nog niet geopend voor de 2e graad
                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                        Momenteel kunnen leerlingen van de 3e graad
                        inschrijven. Indien er later nog plaatsen vrij zijn,
                        kunnen de LO-leerkrachten de inschrijving ook openstellen
                        voor het 3e en 4e jaar.
                      </p>
                    </div>
                  )}

                {/* ANDERE LEERJAREN */}
                {!loading &&
                  isLeerling &&
                  !derdeGraad &&
                  !tweedeGraad && (
                    <div className="mt-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
                      <div className="font-black text-white">
                        Deze activiteit is niet voor jouw leerjaar.
                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                        De Survival Trophy is in eerste instantie bedoeld voor
                        de 3e graad en kan eventueel worden uitgebreid naar de
                        2e graad.
                      </p>
                    </div>
                  )}

                {!loading && !isLeerling && (
                  <div className="mt-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm font-semibold leading-6 text-slate-400">
                    De inschrijfknop wordt alleen weergegeven voor leerlingen.
                    LO-leerkrachten kunnen de inschrijvingen opvolgen via hun
                    beheerpagina.
                  </div>
                )}
              </div>
            </div>

            {/* PRAKTISCHE INFO */}
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7 lg:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
                  ℹ️
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Goed om te weten
                  </div>

                  <h2 className="text-xl font-black text-white">
                    Praktische informatie
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Deelname aan de Survival Trophy is gratis.",
                  "Deelnemers moeten minstens 100 meter kunnen zwemmen.",
                  "Leerlingen en leerkrachten gaan samen van start.",
                  "Per 4 leerlingen kan 1 leerkracht deelnemen.",
                  "De verantwoordelijke leerkracht meldt zich op de dag van de Survival Trophy tussen 12.30 en 14.30 uur aan bij het onthaal.",
                  "Bij het onthaal ontvangt de verantwoordelijke leerkracht de nodige informatie, het startuur en de polsbandjes.",
                  "Op de locatie zijn kleedkamers aanwezig.",
                  "De organisatie is niet aansprakelijk voor verlies of diefstal van persoonlijke voorwerpen.",
                  "Er is drinkbaar water voorzien voor alle deelnemers. Breng zelf een drinkbus mee.",
                  "De activiteit valt onder de schoolverzekering.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-black text-emerald-300">
                      ✓
                    </div>

                    <p className="text-sm font-semibold leading-6 text-slate-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* WAT MAG JE VERWACHTEN */}
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7 lg:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-xl">
                  💪
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                    Voor wie niet bang is om vuil te worden
                  </div>

                  <h2 className="text-xl font-black text-white">
                    Wat mag je verwachten?
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["💦", "Water", "Je blijft gegarandeerd niet droog."],
                  ["🪢", "Touwen", "Klimmen, vasthouden en samenwerken."],
                  ["🧱", "Muren", "Samen geraak je erover."],
                  ["🕸️", "Netten", "Kruipen, klimmen en doorzetten."],
                  ["🟤", "Modder", "Vuil worden hoort erbij."],
                  ["🤝", "Teamspirit", "Niemand blijft achter."],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="text-xl">{icon}</div>

                      <div>
                        <div className="text-sm font-black text-white">
                          {title}
                        </div>

                        <div className="mt-1 text-[13px] font-semibold leading-5 text-slate-400">
                          {text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OFFICIËLE INSCHRIJVING */}
            <div className="rounded-[28px] border border-orange-400/15 bg-orange-400/[0.045] p-5 sm:p-7 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10 text-xl">
                  ✍️
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                    Officiële inschrijving
                  </div>

                  <h2 className="mt-1 text-xl font-black text-white">
                    De school verzorgt de officiële inschrijving
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                    Via de inschrijfmodule hierboven geef je aan dat je met onze
                    school wilt deelnemen. De LO-leerkrachten verzamelen de
                    deelnemers en verzorgen daarna de officiële inschrijving bij
                    de organisatie.
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                    Onze school voorziet momenteel maximaal{" "}
                    <strong className="text-white">
                      {maxPlaatsen} leerlingen
                    </strong>{" "}
                    voor deze activiteit.
                  </p>
                </div>
              </div>
            </div>

            {/* MEDIA */}
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7 lg:p-8">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                Eerst zien, dan geloven?
              </div>

              <h2 className="mt-2 text-2xl font-black text-white">
                Bekijk de Survival Trophy in actie 🎥
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
                Bekijk sfeerbeelden en ontdek wat je te wachten staat op het
                parcours.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ExternalButton
                  href="https://media.sport.vlaanderen/m/7e988d1c9e01aa8a/original/Survival-Trophy.mp4"
                  variant="cyan"
                >
                  ▶️ Sfeerbeelden Survival Trophy
                </ExternalButton>

                <ExternalButton
                  href="https://youtu.be/7CXJyE_KALs"
                  variant="orange"
                >
                  ▶️ Bekijk VTI Roeselare in actie
                </ExternalButton>
              </div>
            </div>

            {/* SOCIALS */}
            <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7 lg:p-8">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Meer Survival Trophy
              </div>

              <h2 className="mt-2 text-xl font-black text-white">
                Volg de actie
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">
                Bekijk foto&apos;s, verhalen, nieuwe beelden en
                behind-the-scenes-content via de officiële kanalen.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <ExternalButton
                  href="https://www.facebook.com/survivaltrophy"
                  variant="dark"
                >
                  Facebook
                </ExternalButton>

                <ExternalButton
                  href="https://www.instagram.com/survivaltrophy?igsh=MTlod2dnMjd5c205Nw=="
                  variant="dark"
                >
                  Instagram @survivaltrophy
                </ExternalButton>

                <ExternalButton href="https://www.moev.be/" variant="dark">
                  MOEV
                </ExternalButton>

                <ExternalButton
                  href="https://www.farys.be/nl"
                  variant="dark"
                >
                  Farys
                </ExternalButton>
              </div>
            </div>

            {/* ANDERE EDITIES */}
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Survival Trophy 2026
              </div>

              <h2 className="mt-2 text-lg font-black text-white">
                Andere edities
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                Sport Vlaanderen organiseert in 2026 drie Survival Trophy&apos;s
                op woensdagnamiddag.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                  <div className="text-sm font-black text-slate-200">
                    30 september 2026
                  </div>

                  <div className="mt-1 text-[13px] font-semibold text-slate-500">
                    Blaarmeersen, Gent • Oost-Vlaamse scholen
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-white">
                      7 oktober 2026
                    </div>

                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
                      Onze editie
                    </span>
                  </div>

                  <div className="mt-1 text-[13px] font-semibold text-slate-300">
                    Blaarmeersen, Gent • West-Vlaamse scholen
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                  <div className="text-sm font-black text-slate-200">
                    14 oktober 2026
                  </div>

                  <div className="mt-1 text-[13px] font-semibold text-slate-500">
                    Provinciaal Recreatiedomein Zilvermeer • Mol
                  </div>
                </div>
              </div>
            </div>

            {/* AFSLUITER */}
            <div className="rounded-[28px] border border-orange-400/15 bg-[linear-gradient(135deg,rgba(249,115,22,0.09),rgba(8,13,25,0.96))] p-6 text-center sm:p-8">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
                Modder • Zweet • Pure teamspirit
              </div>

              <div className="mt-3 text-3xl font-black text-white">
                Durf jij het aan? 🔥
              </div>

              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-400">
                Vijf kilometer. Vijfentwintig obstakels. Eén team. Een
                woensdagnamiddag die je niet snel zult vergeten.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}