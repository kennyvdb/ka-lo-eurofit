"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";

export default function LeerkrachtenLOLesPage() {
  return (
    <AppShell title="LO App" subtitle="Leerkrachten LO · Les LO">
      <BaseHero
        label="LEERKRACHTEN LO"
        title={
          <>
            Mijn{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              lessen
            </span>
          </>
        }
        description="Bereid lessen voor, begeleid leerlingen en volg de activiteiten tijdens de les."
        imageSrc="/lo/LO.png"
        imageAlt="Lessen lichamelijke opvoeding"
        quoteTitle="Samen leren"
        quote="Observeren, oefenen en groeien."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/leerkrachten-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/35 px-4 font-black text-white"
          >
            ← Terug naar Leerkrachten LO
          </Link>
        }
      />

      <section className="mt-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BaseTile
            href="/leerkrachten-lo/les-lo/hockey"
            icon="🏑"
            title="Hockey"
            desc="Lesvoorbereiding, groepsindeling, timer en leerlingenweergave."
          />
        </div>
      </section>
    </AppShell>
  );
}