"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";

export default function EvaluatiesLeerlingenPage() {
  return (
    <AppShell title="KA LO App" subtitle="Mijn evaluaties">
      <BaseHero
        label="LES LO · MIJN EVALUATIES"
        title={
          <>
            Mijn{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              evaluaties
            </span>
          </>
        }
        description="Bekijk je eigen beoordelingen tijdens de lessen lichamelijke opvoeding. Ontdek je sterke punten en waar je nog kunt groeien."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Evaluaties lichamelijke opvoeding"
        quoteTitle="Elke stap telt"
        quote="Leren. Oefenen. Groeien."
        actions={
          <Link
            href="/les-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white transition hover:bg-white/10"
          >
            ← Terug naar Les LO
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BaseTile
            href="/les-lo/evaluaties/hockey"
            icon="🏑"
            title="Hockey"
            desc="Bekijk je techniek, wedstrijdvaardigheden en samenwerking."
          />
        </div>
      </main>
    </AppShell>
  );
}