"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Profiel = {
  volledige_naam: string | null;
  rol: string | null;
};

/* =========================================================
   UI
========================================================= */

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
    href: "/leerkrachten-lo/extramurale-sportactiviteiten/sportdagen",
    icon: "🏆",
    title: "Sportdagen",
    desc: "Praktische informatie, vervoerskeuzes en opvolging per leerjaar.",
  },
];

/* =========================================================
   HELPERS
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

export default function ExtramuraleSportactiviteitenPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  useEffect(() => {
    injectResponsiveCSS();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

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
          console.error("Profiel laden mislukt:", error);
          setLoading(false);
          return;
        }

        const rol = normalizeRole(profielData?.rol);

        setProfiel(profielData as Profiel | null);
        setAllowed(isAllowedRole(rol));
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
      <AppShell title="LO App" subtitle="Extramurale sportactiviteiten">
        <section style={styles.panel}>
          <p style={{ margin: 0, color: ui.text }}>Laden...</p>
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
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
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
     PAGINA
  ======================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Extramurale sportactiviteiten"
      userName={profiel?.volledige_naam ?? null}
    >
      {/* HERO */}

      <BaseHero
        label="LEERKRACHTEN LO"
        title={
          <>
            Extramurale{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              sportactiviteiten
            </span>
          </>
        }
        description="Beheer en opvolging van sportdagen, sportuitstappen en andere activiteiten buiten de school."
        imageSrc="/lo/LO.png"
        imageAlt="Extramurale sportactiviteiten"
        quoteTitle="Buiten de school"
        quote="Alle praktische informatie en opvolging van extramurale sportactiviteiten op één plaats."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/leerkrachten-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            ← Terug naar Leerkrachten LO
          </Link>
        }
      />

      {/* MODULES */}

      <section style={{ marginTop: 16 }}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Activiteiten</div>

            <p style={styles.sectionDescription}>
              Kies een onderdeel om de praktische informatie en opvolging te
              bekijken.
            </p>
          </div>
        </div>

        <div
          className="extramurale-module-grid"
          style={styles.moduleGrid}
        >
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

  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
};

/* =========================================================
   RESPONSIVE CSS
========================================================= */

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "extramurale-sportactiviteiten-responsive-css";

  if (document.getElementById(id)) return;

  const style = document.createElement("style");

  style.id = id;

  style.innerHTML = `
    @media (max-width: 900px) {
      .extramurale-module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .extramurale-module-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }
  `;

  document.head.appendChild(style);
}