"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";

export default function EvaluatiesLeerkrachtenPage() {
  return (
    <AppShell title="KA LO App" subtitle="Evaluaties LO">
      <BaseHero
        label="LEERKRACHTEN LO"
        title={<>Evaluaties <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">LO</span></>}
        description="Bekijk beoordelingen en individuele resultaten van leerlingen. De lesvoorbereiding en live lesbediening staan voortaan onder Les LO."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Evaluaties lichamelijke opvoeding"
        quoteTitle="Evalueren om te groeien"
        quote="Observeren. Begeleiden. Bijsturen."
        actions={<Link href="/leerkrachten-lo" className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white transition hover:bg-white/10">← Terug naar Leerkrachten LO</Link>}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BaseTile href="/leerkrachten-lo/evaluaties/hockey" icon="🏑" title="Hockey" desc="Resultatenmatrix, rubrics, papieren evaluaties en CSV-export." />
        </div>
      </main>
    </AppShell>
  );
}
