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

type Activiteit = {
  id: string;
  titel: string;
  subtitel: string;
  afbeelding: string;
  afbeeldingAlt: string;
  datum: string;
  locatie: string;
  doelgroep: string;
  omschrijving: string;
  href: string;
  status: "Inschrijven" | "Binnenkort" | "Volzet" | "Afgelopen";
};

const activiteiten: Activiteit[] = [
  {
    id: "adventure-trophy",
    titel: "Adventure Trophy",
    subtitel: "Survival Trophy 2026",
    afbeelding:
      "/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten/adventure-trophy.jpg",
    afbeeldingAlt: "Poster Adventure Trophy 2026",
    datum: "7 oktober 2026",
    locatie: "Blaarmeersen • Gent",
    doelgroep: "Leerlingen van de 3e graad",
    omschrijving:
      "Een uitdagend survivalparcours van 5 kilometer met 25 obstakels. Modder, zweet, samenwerking en vooral heel veel teamspirit.",
    href: "/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten/adventure-trophy",
    status: "Binnenkort",
  },
];

function StatusBadge({ status }: { status: Activiteit["status"] }) {
  const styles = {
    Inschrijven:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    Binnenkort:
      "border-amber-400/25 bg-amber-400/10 text-amber-300",
    Volzet: "border-red-400/25 bg-red-400/10 text-red-300",
    Afgelopen:
      "border-slate-400/20 bg-slate-400/10 text-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function CompactInfo({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </div>

        <div className="mt-0.5 text-[13px] font-bold leading-5 text-slate-200">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function NaschoolseSportactiviteitenPage() {
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
      subtitle="Na-schoolse sportactiviteiten"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="NA SCHOOL"
        title={
          <>
            Na-schoolse sportactiviteiten{" "}
            <span className="opacity-85">🏃‍♂️</span>
          </>
        }
        description={
          <>
            Sport stopt niet wanneer de schoolbel gaat. Ontdek onze{" "}
            <strong className="text-white">
              na-schoolse sportactiviteiten
            </strong>
            , ga nieuwe uitdagingen aan en beleef sport samen met anderen.
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="Na-schoolse sportactiviteiten"
        quoteTitle="Samen beleven"
        quote="Uitdaging, plezier en teamspirit buiten de gewone lesuren."
        quoteAuthor="LO-team"
        actions={
          <Link
            href="/extramurale-sportactiviteiten"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            ← Terug naar extramurale activiteiten
          </Link>
        }
      />

      <section className="mt-5">
        <div className="mb-4">
          <div className="text-[13px] font-black text-white/85">
            Activiteiten
          </div>

          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Bekijk het actuele aanbod en klik op een activiteit voor alle
            praktische informatie.
          </p>
        </div>

        {activiteiten.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activiteiten.map((activiteit) => (
              <Link
                key={activiteit.id}
                href={activiteit.href}
                className="group overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
              >
                <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr]">
                  {/* POSTER */}
                  <div className="relative flex min-h-[235px] items-center justify-center overflow-hidden bg-black sm:min-h-[285px]">
                    <Image
                      src={activiteit.afbeelding}
                      alt={activiteit.afbeeldingAlt}
                      fill
                      className="object-contain transition duration-500 group-hover:scale-[1.015]"
                      sizes="160px"
                    />
                  </div>

                  {/* INFO */}
                  <div className="flex min-w-0 flex-col p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">
                        {activiteit.subtitel}
                      </div>

                      <StatusBadge status={activiteit.status} />
                    </div>

                    <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                      {activiteit.titel}
                    </h2>

                    <p className="mt-2 hidden text-[13px] font-semibold leading-5 text-slate-400 sm:block">
                      {activiteit.omschrijving}
                    </p>

                    <div className="mt-4 space-y-3">
                      <CompactInfo
                        icon="📅"
                        label="Datum"
                        value={activiteit.datum}
                      />

                      <CompactInfo
                        icon="📍"
                        label="Locatie"
                        value={activiteit.locatie}
                      />

                      <CompactInfo
                        icon="🎓"
                        label="Voor wie?"
                        value={activiteit.doelgroep}
                      />
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="inline-flex items-center text-[13px] font-black text-cyan-300 transition group-hover:translate-x-1">
                        Bekijk activiteit →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] px-6 py-14 text-center">
            <div className="text-4xl">🏃‍♂️</div>

            <h2 className="mt-4 text-xl font-black text-white">
              Momenteel geen activiteiten
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-400">
              Zodra er nieuwe na-schoolse sportactiviteiten gepland zijn,
              verschijnen ze hier.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}