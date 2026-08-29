"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
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
    href: "/sportfolio",
    icon: "📁",
    title: "Sportfolio",
    desc: "Bewijsstukken, reflecties en feedback.",
  },
  {
    href: "/challenges",
    icon: "🏆",
    title: "Challenges",
    desc: "Deelname, scores en klassement.",
  },
  {
    href: "/reservaties",
    icon: "📅",
    title: "Reservaties",
    desc: "Fitness, pingpong en materiaal.",
  },
  {
    href: "/leerkrachten-lo/klasgroepen",
    icon: "👥",
    title: "Klasgroepen",
    desc: "Mijn klasgroepen maken met klassen.",
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

export default function LeerkrachtenLOPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  useEffect(() => {
    injectResponsiveCSS();
  }, []);

  useEffect(() => {
    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;

      if (!uid) {
        setLoading(false);
        return;
      }

      const { data: profielData } = await supabase
        .from("profielen")
        .select("volledige_naam, rol")
        .eq("id", uid)
        .maybeSingle();

      const rol = normalizeRole(profielData?.rol);

      setProfiel(profielData as Profiel | null);
      setAllowed(isAllowedRole(rol));
      setLoading(false);
    };

    run();
  }, []);

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Leerkrachten LO">
        <section style={styles.panel}>
          <p style={{ margin: 0, color: ui.text }}>Laden...</p>
        </section>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell
        title="LO App"
        subtitle="Geen toegang"
        userName={profiel?.volledige_naam ?? null}
      >
        <section style={styles.panel}>
          <h1 style={{ margin: 0, color: ui.text, fontSize: 22 }}>
            Geen toegang
          </h1>

          <p style={{ color: ui.muted }}>
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
          </p>

          <Link href="/dashboard" style={{ color: ui.text, fontWeight: 900 }}>
            Terug naar dashboard →
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Leerkrachten LO"
      userName={profiel?.volledige_naam ?? null}
    >
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

      <section style={{ marginTop: 16 }}>
        <div style={styles.sectionTitle}>Modules</div>

        <div className="lo-module-grid" style={styles.moduleGrid}>
          {modules.map((module) => (
            <BaseTile
              key={module.title}
              href={module.href}
              icon={module.icon}
              title={module.title}
              desc={module.desc}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  sectionTitle: {
    marginBottom: 12,
    color: ui.text,
    fontSize: 18,
    fontWeight: 980,
  },
  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
};

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "leerkrachten-lo-dashboard-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (max-width: 900px) {
      .lo-module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .lo-module-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }
  `;

  document.head.appendChild(style);
}

