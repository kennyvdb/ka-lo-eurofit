"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

export default function WorkoutsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [email, setEmail] = useState<string>("");

  const tiles = useMemo(
    () => [
      { href: "/workouts/abs", icon: "🧱", title: "Ab Workouts", desc: "Core & buikspieren" },
      { href: "/workouts/home", icon: "🏠", title: "Bodyweight / DB @ Home", desc: "Thuis trainen" },
      { href: "/workouts/fitness", icon: "🏋️", title: "Fitness Workout", desc: "Gym sessies" },
      { href: "/workouts/running", icon: "🏃‍♂️", title: "Running Workouts", desc: "Intervals & endurance" },
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
      const userId = user?.id ?? null;

      if (!userId) {
        window.location.replace("/login");
        return;
      }

      setUid(userId);
      setEmail(user?.email ?? "");

      await fetchProfile(userId);
      setLoading(false);
    };

    run();
  }, []);

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Workouts laden…</div>
      </main>
    );
  }

  const shownRoleRaw = (profiel?.role ?? profiel?.rol ?? "").toLowerCase();
  const shownRoleLabel =
    shownRoleRaw === "teacher" || shownRoleRaw === "leerkracht" ? "Leerkracht" : "Leerling";

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Welkom";

  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={profiel?.volledige_naam ?? null}>
      {/* HERO */}
      <WorkoutsHero greetingName={greetingName} shownRoleLabel={shownRoleLabel} klasNaam={profiel?.klas_naam} />

      {/* Header row (zelfde vibe als dashboard) */}
      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Kies een categorie •{" "}
            {email ? (
              <>
                ingelogd als <b style={{ color: ui.text }}>{email}</b> • {shownRoleLabel}
                {profiel?.klas_naam ? <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span> : null}
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

      {/* Tiles (Dashboard SquareTiles look & feel) */}
      <section style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Workouts</div>

        <div className="hub-grid">
          {tiles.map((t) => (
            <SquareTile key={t.href} href={t.href} icon={t.icon} title={t.title} desc={t.desc} />
          ))}
        </div>

        <div style={{ marginTop: 12, color: "rgba(234,240,255,0.55)", fontSize: 13 }}>
          Tip: tik op een tegel om meteen te starten.
        </div>

        <style jsx>{`
          .hub-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media (min-width: 900px) {
            .hub-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>
    </AppShell>
  );
}

/* ---------------------------
   HERO (dashboard-stijl, maar workouts copy)
--------------------------- */
function WorkoutsHero({
  greetingName,
  shownRoleLabel,
  klasNaam,
}: {
  greetingName: string;
  shownRoleLabel: string;
  klasNaam?: string | null;
}) {
  return (
    <section className="hero" style={hero.wrap}>
      <div style={hero.bgGlow1} />
      <div style={hero.bgGlow2} />

      <div className="heroInner" style={hero.inner}>
        <div className="heroText" style={hero.content}>
          <div style={hero.kicker}>WORKOUTS HUB</div>

          <h1
            style={{
              ...hero.title,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            Let’s go, <span style={hero.accent}>{greetingName}</span> 💪
            <Image
              src="/hero/beast.png"
              alt="Beast icoon"
              width={64}
              height={64}
              priority
              style={{ display: "block", objectFit: "contain" }}
            />
          </h1>

          <div style={hero.sub}>
            {shownRoleLabel}
            {klasNaam ? <span style={{ opacity: 0.85 }}> • {klasNaam}</span> : null}
            <span style={{ opacity: 0.85 }}> •</span> Kies een categorie en start meteen.
          </div>

          <div style={hero.actions}>
            <Link href="/dashboard" style={hero.secondary}>
              Terug naar dashboard
            </Link>
            <Link href="/challenges" style={hero.primary}>
              Challenges →
            </Link>
          </div>

          <div style={hero.quoteCard}>
            <div style={hero.quoteLabel}>Workout reminder</div>
            <div style={hero.quoteText}>“Consistency is a superpower.”</div>
            <div style={hero.quoteAuthor}>— Beast HQ</div>
          </div>
        </div>

        <div className="heroArt" style={hero.artCol}>
          <div className="illuBox" style={hero.illuBox}>
            <Image
              src="/workouts/workouts.png"
              alt="LO illustratie"
              width={1200}
              height={1200}
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                opacity: 0.94,
                display: "block",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .heroInner {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 14px;
          align-items: stretch;
          position: relative;
          z-index: 1;
        }

        .heroArt {
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 700px) {
          .heroInner {
            grid-template-columns: 1fr;
          }
          .heroArt {
            margin-top: 8px;
            justify-content: flex-start;
          }
          .illuBox {
            max-height: 320px;
            height: auto !important;
            width: 100%;
            aspect-ratio: 1 / 1;
          }
        }

        @media (max-width: 420px) {
          .hero :global(h1) {
            font-size: 26px !important;
          }
          .illuBox {
            max-height: 280px;
          }
        }
      `}</style>
    </section>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: { position: "relative" },
  bgGlow1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    left: -120,
    top: -140,
    background: "rgba(75,142,141,0.20)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(137,194,170,0.16)",
    filter: "blur(26px)",
  },

  content: { position: "relative", maxWidth: 620, zIndex: 1 },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },
  title: { margin: "8px 0 0 0", fontSize: 30, lineHeight: 1.05, fontWeight: 980, color: ui.text },
  accent: {
    background: `linear-gradient(90deg, ${brand.blue}, ${brand.teal}, ${brand.mint})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: { marginTop: 10, fontSize: 13.5, color: ui.muted, maxWidth: 520 },
  actions: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.55)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
  quoteCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    maxWidth: 520,
  },
  quoteLabel: { fontSize: 12, fontWeight: 950, color: ui.muted },
  quoteText: { marginTop: 8, fontSize: 16, fontWeight: 950, color: ui.text, lineHeight: 1.25 },
  quoteAuthor: { marginTop: 8, fontSize: 12.5, color: ui.muted },

  artCol: { position: "relative", zIndex: 1 },
  illuBox: {
    position: "relative",
    height: "100%",
    aspectRatio: "1 / 1",
    width: "auto",
    maxWidth: "100%",
    marginLeft: "auto",
    borderRadius: 22,
    overflow: "hidden",
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    boxSizing: "border-box",
  },
};

/* ---------------------------
   SquareTile (zelfde als dashboard)
--------------------------- */
function SquareTile({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="sq">
      <div className="top">
        <div className="icon">{icon}</div>
        <div className="title">{title}</div>
      </div>

      <div className="desc">{desc}</div>
      <div className="cta">Openen →</div>

      <style jsx>{`
        .sq {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 14px;
          border-radius: 20px;
          background: ${ui.panel};
          border: 1px solid ${ui.border};
          text-decoration: none;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          position: relative;

          transform: translateY(0) scale(1);
          transition: transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 180ms ease,
            border-color 180ms ease, background 180ms ease;
          will-change: transform;
        }

        .sq:before {
          content: "";
          position: absolute;
          inset: -50px -50px auto auto;
          width: 160px;
          height: 160px;
          border-radius: 999px;
          background: rgba(75, 142, 141, 0.16);
          filter: blur(14px);
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 180ms ease, transform 180ms ease;
          transform: translate3d(0, 0, 0);
        }

        .sq:after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(37, 89, 113, 0.55),
            rgba(75, 142, 141, 0.55),
            rgba(137, 194, 170, 0.45)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 180ms ease;
          pointer-events: none;
        }

        .shine {
          position: absolute;
          inset: -40% -30%;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 65%
          );
          transform: translateX(-40%) rotate(10deg);
          opacity: 0;
          pointer-events: none;
        }

        .sq:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: ${ui.border2};
          background: ${ui.panel2};
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(75, 142, 141, 0.1);
        }

        .sq:hover:before {
          opacity: 1;
          transform: translate3d(10px, -6px, 0);
        }

        .sq:hover:after {
          opacity: 1;
        }

        .sq:hover .shine {
          opacity: 1;
          animation: sweep 900ms ease forwards;
        }

        .sq:active {
          transform: translateY(-2px) scale(1.005);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
        }

        @keyframes sweep {
          0% {
            transform: translateX(-55%) rotate(10deg);
          }
          100% {
            transform: translateX(55%) rotate(10deg);
          }
        }

        .top {
          display: grid;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 20px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid ${ui.border};
          color: ${ui.text};
        }

        .title {
          font-size: 15px;
          font-weight: 980;
          color: ${ui.text};
          letter-spacing: 0.2px;
          position: relative;
          z-index: 1;
        }

        .desc {
          margin-top: 4px;
          font-size: 12.5px;
          color: ${ui.muted};
          line-height: 1.25;
          position: relative;
          z-index: 1;
        }

        .cta {
          margin-top: 10px;
          font-size: 12.5px;
          font-weight: 950;
          color: ${ui.text};
          opacity: 0.92;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="shine" />
    </Link>
  );
}

/* ---------------------------
   Styles (dashboard-stijl)
--------------------------- */
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
  },
  rolePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
    whiteSpace: "nowrap",
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(137,194,170,0.85))",
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