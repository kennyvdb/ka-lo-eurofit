"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React from "react";

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const links = [
  {
    id: "sportnaschool",
    naam: "Sport Na School",
    url: "https://sportnaschool.be",
    beschrijving: "Ontdek sportactiviteiten en beweegkansen buiten de schooluren.",
    categorie: "sport",
  },
  {
    id: "start-to-run",
    naam: "Start to Run",
    url: "https://www.start-to-run.be",
    beschrijving: "Begeleiding en motivatie om stap voor stap te leren lopen.",
    categorie: "lopen",
  },
  {
    id: "moev",
    naam: "MOEV Activiteiten",
    url: "https://www.moev.be/activiteiten/filters:west-vlaanderen,secundair-onderwijs",
    beschrijving: "Activiteitenaanbod voor secundair onderwijs in West-Vlaanderen.",
    categorie: "school",
  },
  {
    id: "fit",
    naam: "FIT.nl",
    url: "https://www.fit.nl",
    beschrijving: "Informatie over training, gezondheid, voeding en fitheid.",
    categorie: "gezondheid",
  },
] as const;

function iconForCategorie(categorie?: string) {
  switch ((categorie ?? "").toLowerCase()) {
    case "sport":
      return "🏅";
    case "lopen":
      return "🏃";
    case "school":
      return "🎓";
    case "gezondheid":
      return "💪";
    default:
      return "🔗";
  }
}

type LinkCardProps = {
  item: {
    id: string;
    naam: string;
    url: string;
    beschrijving: string;
    categorie: string;
  };
};

function ExternalLinkCard({ item }: LinkCardProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.08)]"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(75,142,141,0.16)] blur-[16px] transition duration-200 group-hover:scale-110" />
      <div className="absolute inset-0 rounded-[24px] opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.18),rgba(75,142,141,0.16),rgba(137,194,170,0.12))]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/30 text-xl">
              {iconForCategorie(item.categorie)}
            </div>

            <div>
              <div className="text-[15px] font-black tracking-[0.01em] text-white">
                {item.naam}
              </div>
              <div className="mt-1 break-all text-xs text-white/60">{item.url}</div>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/70">
            {item.categorie}
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">
              Beschrijving
            </div>
            <div className="mt-1 text-sm leading-6 text-white/75">{item.beschrijving}</div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/70">
              Externe link
            </div>

            <div className="text-sm font-black text-white/90">Openen ↗</div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function LinksPage() {
  return (
    <AppShell title="LO App" subtitle="Links">
      <BaseHero
        label="HANDIGE LINKS"
        title={<>Externe websites en sportbronnen</>}
        description={
          <>
            Hier vind je een overzicht van nuttige websites rond sport, beweging,
            gezondheid en schoolactiviteiten.
          </>
        }
        imageSrc="/weblinks/weblinks.png"
        imageAlt="Links overzicht"
        imageClassName="max-h-[300px] md:max-h-[340px]"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
            >
              ← Terug naar home
            </Link>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
              {links.length} links
            </span>
          </div>
        }
      />

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-white">Overzicht</div>
            <div className="text-xs text-white/60">
              Klik op een kaart om de website in een nieuw tabblad te openen.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
            {links.length} items
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((item) => (
            <ExternalLinkCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}