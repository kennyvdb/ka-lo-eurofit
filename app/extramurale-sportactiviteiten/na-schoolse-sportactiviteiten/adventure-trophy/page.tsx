"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

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

  useEffect(() => {
    const loadProfiel = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Fout bij ophalen sessie:", error.message);
        return;
      }

      const userId = data.session?.user?.id;

      if (!userId) return;

      const { data: profielData, error: profielError } = await supabase
        .from("profielen")
        .select("id, volledige_naam, rol")
        .eq("id", userId)
        .maybeSingle();

      if (profielError) {
        console.error("Fout bij ophalen profiel:", profielError.message);
        return;
      }

      setProfiel(profielData as Profiel);
    };

    loadProfiel();
  }, []);

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
                  value="Leerlingen 3e graad"
                />

                <InfoCard
                  icon="🏃"
                  label="Parcours"
                  value="5 kilometer"
                />

                <InfoCard
                  icon="🧗"
                  label="Obstakels"
                  value="25 obstakels"
                />

                <InfoCard
                  icon="💶"
                  label="Prijs"
                  value="Gratis"
                />
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

            {/* INSCHRIJVING SCHOOL */}
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
                    Inschrijving gebeurt via de school
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                    Per school kunnen minimaal 4 en maximaal 40 leerlingen
                    deelnemen. De officiële inschrijving bij Sport Vlaanderen
                    gebeurt door de school.
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                    De manier waarop leerlingen van onze school zich kandidaat
                    kunnen stellen voor deelname wordt hier meegedeeld zodra
                    de inschrijvingen binnen de school geopend worden.
                  </p>

                  <div className="mt-5 inline-flex rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-200">
                    ⏳ Inschrijving voor leerlingen volgt
                  </div>
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
                Bekijk foto's, verhalen, nieuwe beelden en
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

                <ExternalButton
                  href="https://www.moev.be/"
                  variant="dark"
                >
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
                Sport Vlaanderen organiseert in 2026 drie Survival Trophy's op
                woensdagnamiddag.
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