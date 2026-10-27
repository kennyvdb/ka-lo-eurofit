"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";

export default function LessenPage() {
  return (
    <AppShell title="LO App" subtitle="Lessen">
      <BaseHero
        label="LES LO"
        title={
          <>
            Mijn <span className="text-[#89C2AA]">lessen</span>
          </>
        }
        description="Bekijk je lessen, opdrachten en groepsindelingen."
        imageSrc="/lo/LO.png"
        imageAlt="Lessen lichamelijke opvoeding"
        quoteTitle="Leren door te doen"
        quote="Samen oefenen, observeren en groeien."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/les-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/35 px-4 font-black text-white"
          >
            ← Terug naar Les LO
          </Link>
        }
      />

      <section className="mt-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <BaseTile
            href="/les-lo/les/hockey"
            icon="🏑"
            title="Hockey"
            desc="Stations, groepsindeling en observaties"
          />
        </div>
      </section>
    </AppShell>
  );
}