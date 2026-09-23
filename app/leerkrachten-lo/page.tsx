
"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import { TileGrid } from "@/components/tiles/TileGrid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Profiel = {
  volledige_naam: string | null;
  rol: string | null;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.74)",
  border: "rgba(255,255,255,0.12)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

/* =========================================================
   MODULES
========================================================= */

const modules = [
  {
    href: "/eurofittest",
    icon: "🏃",
    title: "Eurofittest",
    desc: "Ingevuld, niet ingevuld, automatische evaluatie en resultaten.",
  },
  {
    href: "/functional-fitheidstest",
    icon: "💪",
    title: "Functional Fitheidstest",
    desc: "Ingevuld, niet ingevuld, automatische evaluatie en resultaten.",
  },
  {
    href: "/leerkrachten-lo/beep-test",
    icon: "🏃‍♂️",
    title: "Beep Test",
    desc: "20 meter shuttle run afnemen, leerlingen stoppen en resultaten opvolgen.",
  },
  {
    href: "/leerkrachten-lo/mas-test",
    icon: "⏱️",
    title: "MAS-test (VMA)",
    desc: "Léger-Boucher MAS-test afnemen, scores invoeren en resultaten opvolgen.",
   },
   {
    href: "/sportfolio",
    icon: "📁",
    title: "Sportfolio",
    desc: "Bewijsstukken, reflecties en feedback.",
  },
  {
    href: "/leerkrachten-lo/challenges",
    icon: "🏆",
    title: "Challenges",
    desc: "Scores invoeren, deelnemers beheren en klassementen opvolgen.",
  },
  {
    href: "/leerkrachten-lo/extramurale-sportactiviteiten",
    icon: "🚌",
    title: "Extramurale sportactiviteiten",
    desc: "Sportdagen, uitstappen en andere sportactiviteiten buiten de school.",
  },
  {
    href: "/leerkrachten-lo/reservaties",
    icon: "📅",
    title: "Reservaties",
    desc: "Beheer fitnessreservaties en andere reservatiemodules.",
  },
  {
    href: "/leerkrachten-lo/klasgroepen",
    icon: "👥",
    title: "Klasgroepen",
    desc: "Mijn klasgroepen maken met klassen.",
  },  
  {
    href: "/leerkrachten-lo/notities",
    icon: "📝",
    title: "LO-notities & verslagen",
    desc: "Gedeelde notities, verslagen, actiepunten en archief voor het LO-team.",
  },
  {
    href: "#",
    icon: "✅",
    title: "Evaluaties",
    desc: "Opvolging, feedback en evaluatieoverzichten.",
  },
  {
    href: "#",
    icon: "📊",
    title: "Statistieken",
    desc: "Grafieken, gemiddelden en evoluties.",
  },
];

/* =========================================================
   ROLE HELPERS
========================================================= */

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isAllowedRole(rol: string) {
  return (
    rol === "leerkracht_lo" ||
    rol === "lo_leerkracht" ||
    rol === "administratief_personeel" ||
    rol === "admin"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LeerkrachtenLOPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  /* =======================================================
     PROFIEL EN TOEGANG LADEN
  ======================================================= */

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData } =
          await supabase.auth.getSession();

        const uid = sessionData.session?.user?.id;

        if (!uid) {
          setLoading(false);
          return;
        }

        const { data: profielData, error } = await supabase
          .from("profielen")
          .select("volledige_naam, rol")
          .eq("id", uid)
          .maybeSingle();

        if (error) {
          console.error(
            "Profiel laden mislukt:",
            error
          );

          setLoading(false);
          return;
        }

        const rol = normalizeRole(profielData?.rol);

        setProfiel(profielData as Profiel | null);
        setAllowed(isAllowedRole(rol));
      } catch (error) {
        console.error(
          "Fout bij laden leerkrachtenpagina:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <AppShell
        title="LO App"
        subtitle="Leerkrachten LO"
      >
        <section style={styles.panel}>
          <p
            style={{
              margin: 0,
              color: ui.text,
            }}
          >
            Laden...
          </p>
        </section>
      </AppShell>
    );
  }

  /* =======================================================
     GEEN TOEGANG
  ======================================================= */

  if (!allowed) {
    return (
      <AppShell
        title="LO App"
        subtitle="Geen toegang"
        userName={profiel?.volledige_naam ?? null}
      >
        <section style={styles.panel}>
          <h1
            style={{
              margin: 0,
              color: ui.text,
              fontSize: 22,
            }}
          >
            Geen toegang
          </h1>

          <p
            style={{
              color: ui.muted,
              lineHeight: 1.6,
            }}
          >
            Deze pagina is alleen toegankelijk
            voor LO-leerkrachten en admins.
          </p>

          <Link
            href="/dashboard"
            style={{
              color: ui.text,
              fontWeight: 900,
            }}
          >
            Terug naar dashboard →
          </Link>
        </section>
      </AppShell>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Leerkrachten LO"
      userName={profiel?.volledige_naam ?? null}
    >
      {/* ===================================================
          HERO
      =================================================== */}

      <BaseHero
        label="GO! Atheneum Avelgem"
        title={
          <>
            Leerkrachten{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              LO
            </span>
          </>
        }
        description="Centraal dashboard voor alles wat met leerlingen in lichamelijke opvoeding te maken heeft."
        imageSrc="/lo/LO.png"
        imageAlt="Leerkrachten LO dashboard"
        quoteTitle="LO-dashboard"
        quote="Eén centrale plek voor opvolging, modules en statistieken."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            🏠 Terug naar dashboard
          </Link>
        }
      />

      {/* ===================================================
          MODULES
      =================================================== */}

      <section className="mt-[18px]">
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>
              Modules
            </div>

            <p style={styles.sectionDescription}>
              Kies een onderdeel om de leerlingen
              en activiteiten op te volgen.
            </p>
          </div>
        </div>

        {/* Zelfde tegelindeling als het beginscherm */}

        <TileGrid>
          {modules.map((module) => (
            <BaseTile
              key={module.title}
              href={module.href}
              icon={module.icon}
              title={module.title}
              desc={module.desc}
            />
          ))}
        </TileGrid>
      </section>
    </AppShell>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  sectionTitle: {
    color: ui.text,
    fontSize: 18,
    fontWeight: 980,
  },

  sectionDescription: {
    margin: "4px 0 0",
    color: ui.muted,
    fontSize: 13,
    lineHeight: 1.55,
  },
};