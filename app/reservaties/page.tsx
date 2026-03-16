"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import { TileGrid } from "@/components/tiles/TileGrid";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(148,163,184,0.18)",
  borderStrong: "rgba(148,163,184,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

export default function ReservatiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [email, setEmail] = useState<string>("");

  const tiles = useMemo(
    () => [
      {
        href: "/reservaties/fitness",
        icon: "🏋️",
        title: "Fitness",
        desc: "Reserveer een fitnessmoment",
      },
      {
        href: "/reservaties/pingpongtafels",
        icon: "🏓",
        title: "Pingpongtafels",
        desc: "Reserveer een pingpongtafel",
      },
    ],
    []
  );

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, role, rol, klas_naam")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setProfiel(null);
      return null;
    }

    const p = (data as Profiel) ?? null;
    setProfiel(p);
    return p;
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const user = data.session?.user ?? null;

      if (!user?.id) {
        window.location.replace("/login");
        return;
      }

      setUid(user.id);
      setEmail(user.email ?? "");

      await fetchProfile(user.id);
      setLoading(false);
    };

    run();
  }, []);

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div style={{ color: ui.text }}>Reservaties laden…</div>
      </main>
    );
  }

  const shownRoleRaw = (profiel?.role ?? profiel?.rol ?? "").toLowerCase();
  const shownRoleLabel =
    shownRoleRaw === "teacher" || shownRoleRaw === "leerkracht" ? "Leerkracht" : "Leerling";

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Welkom";

  return (
    <AppShell
      title="LO App"
      subtitle="Reservaties"
      userName={profiel?.volledige_naam ?? null}
    >
      <ReservatiesHero
        greetingName={greetingName}
        shownRoleLabel={shownRoleLabel}
        klasNaam={profiel?.klas_naam}
      />

      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Kies een categorie •{" "}
            {email ? (
              <>
                ingelogd als <b style={{ color: ui.text }}>{email}</b> • {shownRoleLabel}
                {profiel?.klas_naam ? (
                  <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span>
                ) : null}
              </>
            ) : (
              <span style={{ color: ui.muted }}>…</span>
            )}
          </div>
        </div>

        <div style={styles.rolePill} title={uid ?? ""}>
          <span style={styles.pillDot} />
          <span style={{ color: ui.muted, fontWeight: 950 }}>{shownRoleLabel}</span>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>
          Reservaties
        </div>

        <TileGrid>
          {tiles.map((t) => (
            <BaseTile
              key={t.href}
              href={t.href}
              icon={t.icon}
              title={t.title}
              desc={t.desc}
            />
          ))}
        </TileGrid>

        <div style={{ marginTop: 12, color: "rgba(234,240,255,0.55)", fontSize: 13 }}>
          Tip: tik op een tegel om een reservatie te starten.
        </div>
      </section>
    </AppShell>
  );
}

function ReservatiesHero({
  greetingName,
  shownRoleLabel,
  klasNaam,
}: {
  greetingName: string;
  shownRoleLabel: string;
  klasNaam?: string | null;
}) {
  return (
    <BaseHero
      label="RESERVATIES"
      title={
        <>
          Reserveer je moment,
          <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
            {" "}
            {greetingName}
          </span>
          🎯
        </>
      }
      description={
        <>
          {shownRoleLabel}
          {klasNaam ? <span className="opacity-85"> • {klasNaam}</span> : null}
          <span className="opacity-85"> •</span> Kies wat je wil reserveren en plan je activiteit.
        </>
      }
      imageSrc="/reservaties/reservaties.png"
      imageAlt="Reservaties illustratie"
      quoteTitle="Reservatie reminder"
      quote="Plan slim, sport met plezier."
      quoteAuthor="LO Team"
      imageClassName="scale-110 md:scale-[1.14] transition-transform duration-500"
      actions={
        <>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            Terug naar dashboard
          </Link>

          <Link
            href="/reservaties/fitness"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-200/25 hover:shadow-[0_16px_34px_rgba(0,0,0,0.32),0_0_0_1px_rgba(75,142,141,0.10)]"
          >
            Start reservatie →
          </Link>
        </>
      }
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.02)",
  },
  rolePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.30)",
    border: `1px solid ${ui.borderStrong}`,
    whiteSpace: "nowrap",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(137,194,170,0.85))",
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