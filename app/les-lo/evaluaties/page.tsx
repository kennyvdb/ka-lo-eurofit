"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";

export default function EvaluatiesPage() {
  return (
    <AppShell
      title="KA LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={null}
    >
      <BaseHero
        label="LICHAMELIJKE OPVOEDING"
        title={
          <>
            Evaluaties{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              LO
            </span>
          </>
        }
        description="Bekijk en voer evaluaties uit tijdens de lessen lichamelijke opvoeding."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Illustratie lichamelijke opvoeding"
        quoteTitle="Evalueren om te groeien"
        quote="Observeer. Leer. Verbeter."
        actions={
          <Link
            href="/les-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white transition hover:bg-white/10"
          >
            ← Terug naar LO
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/les-lo/evaluaties/hockey"
            className="group block rounded-3xl border border-white/15 bg-white/5 p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-300/40 hover:bg-white/10"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[#255971]/60 to-[#4B8E8D]/40 text-4xl">
              🏑
            </div>

            <h2 className="text-xl font-black text-white">
              Hockey
            </h2>

            <p className="mt-2 text-sm text-white/70">
              2e graad · 3e en 4e jaar
            </p>

            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Techniek, wedstrijd en samenwerken.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#89C2AA]">
              Open evaluatie
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}