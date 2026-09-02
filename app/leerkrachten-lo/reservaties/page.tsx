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
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  role: string | null;
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
   HELPERS
========================================================= */

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isAllowedRole(role: string) {
  return (
    role === "lo_leerkracht" ||
    role === "leerkracht_lo" ||
    role === "admin"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LeerkrachtenReservatiesPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  useEffect(() => {
    injectResponsiveCSS();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Sessie laden mislukt:", sessionError);
          setLoading(false);
          return;
        }

        const uid = sessionData.session?.user?.id;

        if (!uid) {
          setLoading(false);
          return;
        }

        const { data: profielData, error: profielError } = await supabase
          .from("profielen")
          .select("id, volledige_naam, rol, role")
          .eq("id", uid)
          .maybeSingle();

        if (profielError) {
          console.error("Profiel laden mislukt:", profielError);
          setLoading(false);
          return;
        }

        const p = profielData as Profiel | null;

        setProfiel(p);

        /*
         * Eerst de nieuwe kolom 'rol'.
         * Alleen indien die leeg is, vallen we terug op legacy 'role'.
         */
        const role = normalizeRole(p?.rol || p?.role);

        setAllowed(isAllowedRole(role));
      } catch (error) {
        console.error("Reservatiebeheer laden mislukt:", error);
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
      <AppShell title="LO App" subtitle="Reservaties">
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
              margin: "10px 0 0",
              color: ui.muted,
              lineHeight: 1.6,
            }}
          >
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
          </p>

          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: 14,
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
     PAGE
  ======================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Reservaties"
      userName={profiel?.volledige_naam ?? null}
    >
      {/* ===================================================
          HERO
      =================================================== */}

      <BaseHero
        label="LEERKRACHTEN LO"
        title={
          <>
            Beheer de{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              reservaties
            </span>
          </>
        }
        description="Beheer de reservaties voor de verschillende sportfaciliteiten."
        imageSrc="/reservaties/reservaties.png"
        imageAlt="Reservaties"
        quoteTitle="Reservatiebeheer"
        quote="Een duidelijk overzicht van alle reservatiemogelijkheden."
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

      {/* ===================================================
          MODULES
      =================================================== */}

      <section style={{ marginTop: 16 }}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Reservaties</div>

            <p style={styles.sectionDescription}>
              Kies een onderdeel om de reservaties te beheren.
            </p>
          </div>
        </div>

        <div
          className="reservaties-module-grid"
          style={styles.moduleGrid}
        >
          {/* ===============================================
              FITNESS
          =============================================== */}

          <BaseTile
            href="/leerkrachten-lo/reservaties/fitness"
            icon="🏋️"
            title="Fitness"
            desc="Bekijk en beheer de reservaties van de fitness."
          />

          {/* ===============================================
              PINGPONG - BINNENKORT
          =============================================== */}

          <div className="coming-soon-tile">
            <div className="coming-soon-glow" />

            <div className="coming-soon-top">
              <div className="coming-soon-icon">🏓</div>

              <div className="coming-soon-badge">
                Binnenkort
              </div>
            </div>

            <div className="coming-soon-title">
              Pingpongtafels
            </div>

            <div className="coming-soon-desc">
              Beheer van de reservaties voor de pingpongtafels.
            </div>
          </div>
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

  /*
   * Zelfde basis als /leerkrachten-lo:
   * 4 kolommen op grote schermen.
   *
   * Daardoor zijn de tegels even groot als de tegels
   * op het hoofdscherm Leerkrachten LO.
   */
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

  const id = "leerkrachten-reservaties-responsive-css";

  if (document.getElementById(id)) return;

  const style = document.createElement("style");

  style.id = id;

  style.innerHTML = `
    /* =====================================================
       GRID
    ===================================================== */

    @media (max-width: 1100px) {
      .reservaties-module-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 900px) {
      .reservaties-module-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .reservaties-module-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }

    /* =====================================================
       PINGPONG - BINNENKORT

       Zelfde afmetingen/stijl als BaseTile.
    ===================================================== */

    .coming-soon-tile {
      position: relative;
      display: flex;
      aspect-ratio: 1 / 1;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;

      padding: 16px;

      border-radius: 22px;

      border:
        1px solid rgba(148, 163, 184, 0.16);

      background:
        linear-gradient(
          180deg,
          rgba(255,255,255,0.045),
          rgba(255,255,255,0.025)
        );

      box-shadow:
        0 12px 28px rgba(0,0,0,0.15);

      opacity: 0.72;

      cursor: default;
    }

    .coming-soon-glow {
      position: absolute;

      right: -56px;
      top: -56px;

      width: 176px;
      height: 176px;

      border-radius: 999px;

      background:
        rgba(75,142,141,0.10);

      filter: blur(18px);
    }

    .coming-soon-top {
      position: relative;
      z-index: 2;

      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      gap: 10px;
    }

    .coming-soon-icon {
      display: grid;

      width: 48px;
      height: 48px;

      place-items: center;

      border-radius: 16px;

      border:
        1px solid rgba(148,163,184,0.18);

      background:
        linear-gradient(
          180deg,
          rgba(0,0,0,0.38),
          rgba(0,0,0,0.30)
        );

      color: white;

      font-size: 20px;

      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.03);
    }

    .coming-soon-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-height: 26px;

      padding: 0 9px;

      border-radius: 999px;

      border:
        1px solid rgba(251,191,36,0.22);

      background:
        rgba(251,191,36,0.08);

      color: #fde68a;

      font-size: 9px;

      font-weight: 950;

      letter-spacing: 0.04em;
    }

    .coming-soon-title {
      position: absolute;

      z-index: 2;

      top: 76px;
      left: 16px;
      right: 16px;

      color:
        rgba(255,255,255,0.76);

      font-size: 15px;

      font-weight: 950;

      letter-spacing: 0.01em;
    }

    .coming-soon-desc {
      position: relative;

      z-index: 2;

      color:
        rgba(255,255,255,0.50);

      font-size: 12px;

      line-height: 20px;
    }
  `;

  document.head.appendChild(style);
}