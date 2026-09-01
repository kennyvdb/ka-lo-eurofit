"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import { TileGrid } from "@/components/tiles/TileGrid";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
};

type RealRole =
  | "leerling"
  | "leerkracht"
  | "lo_leerkracht"
  | "admin";

/* ===============================
   ROLE HELPERS
================================ */

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function mapProfileRole(
  rol: unknown,
  role: unknown
): RealRole | null {
  const dbRol = normalizeRole(rol);
  const dbRole = normalizeRole(role);

  if (dbRol === "admin" || dbRole === "admin") {
    return "admin";
  }

  if (
    dbRol === "lo_leerkracht" ||
    dbRol === "loleerkracht"
  ) {
    return "lo_leerkracht";
  }

  if (
    dbRol === "leerkracht" ||
    dbRole === "teacher"
  ) {
    return "leerkracht";
  }

  if (
    dbRol === "leerling" ||
    dbRole === "student"
  ) {
    return "leerling";
  }

  return null;
}

function getShownRoleLabel(role: RealRole | null) {
  if (role === "admin") return "Admin";
  if (role === "lo_leerkracht") return "LO-leerkracht";
  if (role === "leerkracht") return "Leerkracht";
  if (role === "leerling") return "Leerling";

  return "Gebruiker";
}

/* ===============================
   UI
================================ */

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

/* ===============================
   QUOTE
================================ */

function quoteOfMonth(d = new Date()) {
  const quotes = [
    {
      q: "Discipline beats motivation.",
      a: "Coach-mode",
    },
    {
      q: "Small steps. Big results.",
      a: "LO",
    },
    {
      q: "Earn your confidence.",
      a: "Mindset",
    },
    {
      q: "Train smart. Show up. Repeat.",
      a: "Routine",
    },
    {
      q: "Progress, not perfection.",
      a: "Daily",
    },
    {
      q: "You don’t find willpower. You build it.",
      a: "Mindset",
    },
    {
      q: "Strong body. Strong mind.",
      a: "LO",
    },
    {
      q: "Consistency is a superpower.",
      a: "Training",
    },
    {
      q: "Speed comes from technique.",
      a: "Coach tip",
    },
    {
      q: "Be the standard.",
      a: "Athlete",
    },
    {
      q: "You are one session away from better.",
      a: "Reminder",
    },
    {
      q: "Hard work is the talent you choose.",
      a: "Sport",
    },
  ];

  return quotes[d.getMonth() % quotes.length];
}

/* ===============================
   PAGE
================================ */

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  const [uid, setUid] = useState<string | null>(
    null
  );

  const [profiel, setProfiel] =
    useState<Profiel | null>(null);

  const [signingOut, setSigningOut] =
    useState(false);

  const [confirmingYear, setConfirmingYear] =
    useState(false);

  const [realRole, setRealRole] =
    useState<RealRole | null>(null);

  /* ===============================
     SCHOOLJAAR
  ================================ */

  const suggestedSchooljaar = useMemo(() => {
    const now = new Date();

    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    return m >= 9
      ? `${y}-${y + 1}`
      : `${y - 1}-${y}`;
  }, []);

  /* ===============================
     PROFILE
  ================================ */

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select(
        "id, volledige_naam, role, rol, klas_naam, schooljaar, schooljaar_bevestigd_op"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setProfiel(null);
      setRealRole(null);

      return null;
    }

    const p = (data as Profiel) ?? null;

    if (!p) {
      window.location.replace("/login");
      return null;
    }

    const appRole = mapProfileRole(
      p.rol,
      p.role
    );

    if (!appRole) {
      setError(
        "Je profiel heeft geen geldige rol. Contacteer een beheerder."
      );

      setProfiel(p);
      setRealRole(null);

      return null;
    }

    setProfiel(p);
    setRealRole(appRole);

    return p;
  };

  /* ===============================
     LOAD
  ================================ */

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut({
          scope: "local",
        });

        window.location.replace("/login");
        return;
      }

      setUid(user.id);

      await fetchProfile(user.id);

      setLoading(false);
    };

    run();
  }, []);

  /* ===============================
     LOGOUT
  ================================ */

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);

    await supabase.auth.signOut({
      scope: "local",
    });

    window.location.replace("/login");
  };

  /* ===============================
     SCHOOLJAAR BEVESTIGEN
  ================================ */

  const handleConfirmSchooljaar = async () => {
    if (!uid) return;

    if (!profiel) {
      setError("Profiel niet gevonden.");
      return;
    }

    setConfirmingYear(true);
    setError(null);

    const { error } = await supabase
      .from("profielen")
      .update({
        schooljaar: suggestedSchooljaar,
        schooljaar_bevestigd_op: new Date()
          .toISOString()
          .slice(0, 10),
      })
      .eq("id", uid);

    if (error) {
      setError(error.message);
      setConfirmingYear(false);

      return;
    }

    await fetchProfile(uid);

    setConfirmingYear(false);
  };

  /* ===============================
     LOADING
  ================================ */

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div style={{ color: ui.text }}>
          Dashboard laden…
        </div>
      </main>
    );
  }

  /* ===============================
     DATA VOOR UI
  ================================ */

  const shownRoleLabel =
    getShownRoleLabel(realRole);

  const greetingName =
    profiel?.volledige_naam
      ?.split(" ")
      ?.[0] ?? "Welkom";

  const showSchooljaarBanner =
    !profiel?.schooljaar ||
    !profiel?.schooljaar_bevestigd_op;

  const q = quoteOfMonth();

  /* ===============================
     RENDER
  ================================ */

  return (
    <AppShell
      title="LO App"
      subtitle="GO! atheneum Avelgem"
      userName={
        profiel?.volledige_naam ?? null
      }
    >
      {/* ===========================
          HERO
      ============================ */}

      <BaseHero
        label="GO! ATHENEUM AVELGEM"
        title={
          <>
            Welkom,{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {greetingName}
            </span>
          </>
        }
        description={
          <>
            <span>{shownRoleLabel}</span>

            {realRole === "leerling" &&
            profiel?.klas_naam ? (
              <span className="opacity-85">
                {" "}
                • {profiel.klas_naam}
              </span>
            ) : null}

            <span className="opacity-85">
              {" "}
              • Alles voor LO op één plaats.
            </span>
          </>
        }
        imageSrc="/hero/sportapp.png"
        imageAlt="LO illustratie"
        quoteTitle="Quote van de maand"
        quote={q.q}
        quoteAuthor={q.a}
        actions={
          <Link
            href="/ideeenbus"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/55 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/65 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            💡 Ideeënbus
          </Link>
        }
      />

      {/* ===========================
          GEBRUIKER / UITLOGGEN
      ============================ */}

      <div
        style={{
          ...styles.headerRow,
          marginTop: 14,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              marginTop: 0,
              fontSize: 13,
              color: ui.muted,
            }}
          >
            Dag{" "}
            <b style={{ color: ui.text }}>
              {greetingName}
            </b>{" "}
            👋 • {shownRoleLabel}

            {realRole === "leerling" &&
            profiel?.klas_naam ? (
              <span style={{ color: ui.muted }}>
                {" "}
                • {profiel.klas_naam}
              </span>
            ) : null}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            ...styles.blackBtn,
            opacity: signingOut ? 0.7 : 1,
          }}
        >
          {signingOut
            ? "Uitloggen..."
            : "Uitloggen"}
        </button>
      </div>

      {/* ===========================
          ERROR
      ============================ */}

      {error ? (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      {/* ===========================
          SCHOOLJAAR
      ============================ */}

      {showSchooljaarBanner ? (
        <div style={styles.banner}>
          <div>
            <div
              style={{
                fontWeight: 950,
                color: ui.text,
              }}
            >
              Bevestig je schooljaar
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 13,
                color: ui.muted,
              }}
            >
              We stellen voor:{" "}
              <b style={{ color: ui.text }}>
                {suggestedSchooljaar}
              </b>
            </div>
          </div>

          <button
            onClick={
              handleConfirmSchooljaar
            }
            disabled={confirmingYear}
            style={{
              ...styles.blackBtn,
              opacity: confirmingYear
                ? 0.7
                : 1,
            }}
          >
            {confirmingYear
              ? "Bevestigen..."
              : "Bevestigen"}
          </button>
        </div>
      ) : null}

      {/* ===========================
          TRAININGSHUB
      ============================ */}

      <section className="mt-[18px]">
        <div className="mb-3 text-[13px] font-black text-white/85">
          Trainingshub
        </div>

        <TileGrid>
          <BaseTile
            href="/eurofittest"
            icon="🧪"
            title="Eurofittest"
            desc="Test & resultaten"
          />

          <BaseTile
            href="/functional-fitheidstest"
            icon="🏋️"
            title="Functional fitheidstest"
            desc="Fitheid & progressie"
          />

          <BaseTile
            href="/challenges"
            icon="🎯"
            title="Challenges"
            desc="Opdrachten & doelen"
          />

          <BaseTile
            href="/sportfolio"
            icon="📸"
            title="Sportfolio"
            desc="Bewijzen & reflecties"
          />

          <BaseTile
            href="/workouts"
            icon="💪"
            title="Workouts"
            desc="Ab • Home • Fitness • Running"
          />

          <BaseTile
            href="/hall-of-fame"
            icon="🏆"
            title="Hall of Fame"
            desc="Topprestaties & records"
          />

          <BaseTile
            href="/les-lo"
            icon="🏃‍♂️"
            title="Les LO"
            desc="Lesinhoud & planning"
          />

          {(realRole === "lo_leerkracht" ||
            realRole === "admin") && (
            <BaseTile
              href="/leerkrachten-lo"
              icon="👨‍🏫"
              title="Leerkrachten LO"
              desc="Dashboard voor LO-leerkrachten"
            />
          )}

          <BaseTile
            href="/reservaties"
            icon="📅"
            title="Reservaties"
            desc="Zalen, materiaal & planning"
          />

          <BaseTile
            href="/extramurale-sportactiviteiten"
            icon="🚴"
            title="Extramuros activiteiten"
            desc="Activiteiten buiten de school"
          />

          <BaseTile
            href="/links"
            icon="🔗"
            title="Links"
            desc="Handige bronnen"
          />

          <BaseTile
            href="/dashboard/profiel"
            icon="👤"
            title="Profiel"
            desc="Gegevens beheren"
          />
        </TileGrid>
      </section>
    </AppShell>
  );
}

/* ===============================
   STYLES
================================ */

const styles: Record<
  string,
  React.CSSProperties
> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },

  blackBtn: {
    height: 50,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.72)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  banner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
  },
};