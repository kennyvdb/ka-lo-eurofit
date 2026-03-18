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
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
  xp: number | null;
  streak: number | null;
  best_streak: number | null;
  last_login_date: string | null;
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
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

function toYMD(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(aYmd: string, bYmd: string) {
  const a = new Date(aYmd + "T00:00:00");
  const b = new Date(bYmd + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function applyDailyLoginRewards(userId: string, p: Profiel) {
  const today = toYMD();
  const last = p.last_login_date;
  const base = 10;

  if (!last) {
    const newStreak = 1;
    await supabase
      .from("profielen")
      .update({
        xp: (p.xp ?? 0) + base,
        streak: newStreak,
        best_streak: Math.max(p.best_streak ?? 0, newStreak),
        last_login_date: today,
      })
      .eq("id", userId);
    return;
  }

  const diff = daysBetween(last, today);
  if (diff === 0) return;

  if (diff === 1) {
    const newStreak = (p.streak ?? 0) + 1;
    const bonus = Math.min(newStreak * 2, 20);
    await supabase
      .from("profielen")
      .update({
        xp: (p.xp ?? 0) + base + bonus,
        streak: newStreak,
        best_streak: Math.max(p.best_streak ?? 0, newStreak),
        last_login_date: today,
      })
      .eq("id", userId);
    return;
  }

  await supabase
    .from("profielen")
    .update({
      xp: (p.xp ?? 0) + base,
      streak: 1,
      best_streak: Math.max(p.best_streak ?? 0, 1),
      last_login_date: today,
    })
    .eq("id", userId);
}

const LEVELS = [
  { name: "Rookie Beast", xp: 0 },
  { name: "Hungry Beast", xp: 150 },
  { name: "Alpha Beast", xp: 400 },
  { name: "Savage Beast", xp: 800 },
  { name: "Elite Beast", xp: 1400 },
  { name: "Legendary Beast", xp: 2200 },
];

function getBeastLevel(xp: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) current = LEVELS[i];
    if (xp < LEVELS[i].xp) {
      next = LEVELS[i];
      break;
    }
  }

  return { current, next };
}

function quoteOfMonth(d = new Date()) {
  const quotes = [
    { q: "Discipline beats motivation.", a: "Coach-mode" },
    { q: "Small steps. Big results.", a: "LO" },
    { q: "Earn your confidence.", a: "Beast code" },
    { q: "Train smart. Show up. Repeat.", a: "Routine" },
    { q: "Progress, not perfection.", a: "Daily" },
    { q: "You don’t find willpower. You build it.", a: "Mindset" },
    { q: "Strong body. Strong mind.", a: "LO" },
    { q: "Consistency is a superpower.", a: "Beasts" },
    { q: "Speed comes from technique.", a: "Coach tip" },
    { q: "Be the standard.", a: "Athlete" },
    { q: "You are one session away from better.", a: "Reminder" },
    { q: "Hard work is the talent you choose.", a: "Beast mode" },
  ];
  return quotes[d.getMonth() % quotes.length];
}

function WolfIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M4 9.2 7.2 4.6 10 7.2 12 5 14 7.2 16.8 4.6 20 9.2 18.6 18.3 12 21 5.4 18.3 4 9.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.3c.9.9 1.8 1.3 2.8 1.3s1.9-.4 2.8-1.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type DashboardTileProps = {
  href: string;
  icon: string;
  title: string;
  desc: string;
};

function DashboardTile({ href, icon, title, desc }: DashboardTileProps) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.06)] p-3.5 transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.08)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.08)] active:-translate-y-0.5"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(75,142,141,0.16)] blur-[14px] transition duration-200 group-hover:translate-x-2 group-hover:-translate-y-1.5" />

      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.32),rgba(75,142,141,0.28),rgba(137,194,170,0.20))_border-box] [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]" />

      <div className="pointer-events-none absolute inset-[-40%_-30%] opacity-0 transition group-hover:animate-[sweep_900ms_ease_forwards] group-hover:opacity-100 [background:linear-gradient(120deg,rgba(255,255,255,0)_35%,rgba(255,255,255,0.10)_50%,rgba(255,255,255,0)_65%)]" />

      <div className="relative z-10 grid gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-black/35 text-xl text-white">
          {icon}
        </div>
        <div className="text-[15px] font-black tracking-[0.01em] text-white">
          {title}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-xs leading-5 text-white/70">{desc}</div>
        <div className="tile-action mt-2.5 text-xs font-black text-white/90">
          Openen →
        </div>
      </div>

      <style jsx>{`
        .tile-action {
          display: block;
        }

        @media (max-width: 699px) {
          .tile-action {
            display: none;
          }
        }
      `}</style>
    </Link>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingYear, setConfirmingYear] = useState(false);

  const suggestedSchooljaar = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select(
        "id, volledige_naam, role, rol, klas_naam, schooljaar, schooljaar_bevestigd_op, xp, streak, best_streak, last_login_date"
      )
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

      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        window.location.replace("/login");
        return;
      }

      setUid(userId);

      const p = await fetchProfile(userId);
      if (p) {
        await applyDailyLoginRewards(userId, p);
        await fetchProfile(userId);
      }

      setLoading(false);
    };

    run();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("/login");
  };

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
        schooljaar_bevestigd_op: new Date().toISOString().slice(0, 10),
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

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Dashboard laden…</div>
      </main>
    );
  }

  const shownRoleRaw = (profiel?.role ?? profiel?.rol ?? "").toLowerCase();
  const shownRoleLabel =
    shownRoleRaw === "teacher" || shownRoleRaw === "leerkracht"
      ? "Leerkracht"
      : "Leerling";

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Welkom";
  const showSchooljaarBanner =
    !profiel?.schooljaar || !profiel?.schooljaar_bevestigd_op;

  return (
    <AppShell
      title="LO App"
      subtitle="GO! atheneum Avelgem"
      userName={profiel?.volledige_naam}
    >
      <Hero
        greetingName={greetingName}
        shownRoleLabel={shownRoleLabel}
        klasNaam={profiel?.klas_naam}
      />

      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Dag <b style={{ color: ui.text }}>{greetingName}</b> 👋 •{" "}
            {shownRoleLabel}
            {profiel?.klas_naam ? (
              <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span>
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
          {signingOut ? "Uitloggen..." : "Uitloggen"}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      )}

      <BeastStatusCard
        xp={profiel?.xp ?? 0}
        streak={profiel?.streak ?? 0}
        bestStreak={profiel?.best_streak ?? 0}
      />

      {showSchooljaarBanner && (
        <div style={styles.banner}>
          <div>
            <div style={{ fontWeight: 950, color: ui.text }}>
              Bevestig je schooljaar
            </div>
            <div style={{ marginTop: 3, fontSize: 13, color: ui.muted }}>
              We stellen voor:{" "}
              <b style={{ color: ui.text }}>{suggestedSchooljaar}</b>
            </div>
          </div>

          <button
            onClick={handleConfirmSchooljaar}
            disabled={confirmingYear}
            style={{
              ...styles.blackBtn,
              opacity: confirmingYear ? 0.7 : 1,
            }}
          >
            {confirmingYear ? "Bevestigen..." : "Bevestigen"}
          </button>
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <div
          style={{
            marginBottom: 10,
            fontSize: 13,
            fontWeight: 950,
            color: ui.text,
          }}
        >
          Trainingshub
        </div>

        <div className="hub-grid">
          <DashboardTile
            href="/eurofittest"
            icon="🧪"
            title="Eurofittest"
            desc="Test & resultaten"
          />
          <DashboardTile
            href="/functional-fitheidstest"
            icon="🏋️"
            title="Functional fitheidstest"
            desc="Fitheid & progressie"
          />
          <DashboardTile
            href="/challenges"
            icon="🎯"
            title="Challenges"
            desc="Opdrachten & doelen"
          />
          <DashboardTile
            href="/sportfolio"
            icon="📸"
            title="Sportfolio"
            desc="Bewijzen & reflecties"
          />
          <DashboardTile
            href="/workouts"
            icon="💪"
            title="Workouts"
            desc="Ab • Home • Fitness • Running"
          />
          <DashboardTile
            href="/hall-of-fame"
            icon="🏆"
            title="Hall of Fame"
            desc="Topprestaties & records"
          />
          <DashboardTile
            href="/les-lo"
            icon="🏃‍♂️"
            title="Les LO"
            desc="Lesinhoud & planning"
          />
          <DashboardTile
            href="/reservaties"
            icon="📅"
            title="Reservaties"
            desc="Zalen, materiaal & planning"
          />
          <DashboardTile
            href="/extramurale-sportactiviteiten"
            icon="🚴"
            title="Extramuros activiteiten"
            desc="Activiteiten buiten de school"
          />
          <DashboardTile
            href="/links"
            icon="🔗"
            title="Links"
            desc="Handige bronnen"
          />
          <DashboardTile
            href="/dashboard/profiel"
            icon="👤"
            title="Profiel"
            desc="Gegevens beheren"
          />
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

        <style jsx global>{`
          @keyframes sweep {
            0% {
              transform: translateX(-55%) rotate(10deg);
            }
            100% {
              transform: translateX(55%) rotate(10deg);
            }
          }
        `}</style>
      </section>
    </AppShell>
  );
}

function Hero({
  greetingName,
  shownRoleLabel,
  klasNaam,
}: {
  greetingName: string;
  shownRoleLabel: string;
  klasNaam?: string | null;
}) {
  const q = quoteOfMonth();

  return (
    <section className="hero" style={hero.wrap}>
      <div style={hero.bgGlow1} />
      <div style={hero.bgGlow2} />

      <div className="heroInner" style={hero.inner}>
        <div className="heroText" style={hero.content}>
          <div style={hero.kicker}>BEAST HQ</div>

          <h1
            style={{
              ...hero.title,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            Welkom, <span style={hero.accent}>Beast</span> {greetingName}
            <Image
              src="/hero/beast.png"
              alt="Beast icoon"
              width={68}
              height={68}
              priority
              style={{ display: "block", objectFit: "contain" }}
            />
          </h1>

          <div style={hero.sub}>
            {shownRoleLabel}
            {klasNaam ? (
              <span style={{ opacity: 0.85 }}> • {klasNaam}</span>
            ) : null}
            <span style={{ opacity: 0.85 }}> •</span> Login, train, verzamel XP
            en stijg in status.
          </div>

          <div style={hero.actions}>
            <Link href="/ideeenbus" style={hero.primary}>
              Ideeënbus →
            </Link>
          </div>

          <div style={hero.quoteCard}>
            <div style={hero.quoteLabel}>Quote van de maand</div>
            <div style={hero.quoteText}>“{q.q}”</div>
            <div style={hero.quoteAuthor}>— {q.a}</div>
          </div>
        </div>

        <div className="heroArt" style={hero.artCol}>
          <div className="illuBox" style={hero.illuBox}>
            <Image
              src="/hero/sportapp.png"
              alt="LO illustratie"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 440px"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                opacity: 0.94,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .heroInner {
          display: grid;
          gap: 14px;
          align-items: stretch;
          position: relative;
          z-index: 1;
        }

        .heroArt {
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
          height: 100%;
        }

        @media (min-width: 768px) {
          .heroInner {
            grid-template-columns: minmax(0, 1fr) 440px;
          }
        }

        @media (max-width: 767px) {
          .heroInner {
            grid-template-columns: 1fr;
          }

          .heroArt {
            margin-top: 8px;
            justify-content: flex-start;
          }

          .illuBox {
            width: 100%;
            min-height: 320px;
          }
        }

        @media (max-width: 420px) {
          .hero :global(h1) {
            font-size: 26px !important;
          }

          .illuBox {
            min-height: 280px;
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
  inner: {
    position: "relative",
  },
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
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.2,
    color: ui.muted,
  },
  title: {
    margin: "8px 0 0 0",
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 980,
    color: ui.text,
  },
  accent: {
    background: `linear-gradient(90deg, ${brand.blue}, ${brand.teal}, ${brand.mint})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: {
    marginTop: 10,
    fontSize: 13.5,
    color: ui.muted,
    maxWidth: 520,
  },
  actions: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
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
  quoteText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 950,
    color: ui.text,
    lineHeight: 1.25,
  },
  quoteAuthor: { marginTop: 8, fontSize: 12.5, color: ui.muted },
  artCol: {
    position: "relative",
    zIndex: 1,
    width: "100%",
  },
  illuBox: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 360,
    borderRadius: 22,
    overflow: "hidden",
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    boxSizing: "border-box",
  },
};

function BeastStatusCard({
  xp = 0,
  streak = 0,
  bestStreak = 0,
}: {
  xp?: number;
  streak?: number;
  bestStreak?: number;
}) {
  const { current, next } = getBeastLevel(xp);
  const from = current.xp;
  const to = next?.xp ?? current.xp + 500;
  const pct = Math.max(0, Math.min(100, ((xp - from) / (to - from)) * 100));

  return (
    <div style={beast.card}>
      <div style={beast.row}>
        <div>
          <div style={beast.label}>
            <span style={beast.wolfBadge}>
              <span style={{ color: "rgba(234,240,255,0.92)" }}>
                <WolfIcon size={16} />
              </span>
            </span>
            <span>Beast status</span>
          </div>

          <div style={beast.title}>{current.name}</div>

          <div style={beast.meta}>
            <b style={{ color: ui.text }}>{xp} XP</b> • 🔥 Streak:{" "}
            <b style={{ color: ui.text }}>{streak}</b>{" "}
            <span style={{ color: ui.muted }}>• Best: {bestStreak}</span>
          </div>
        </div>

        <div style={beast.pill}>LEVEL</div>
      </div>

      <div style={beast.barWrap}>
        <div style={beast.barHalo} />
        <div className="xpEnergyFull" />
        <div style={{ ...beast.barFill, width: `${pct}%` }}>
          <div style={beast.barEdgeGlow} />
        </div>
        <div style={beast.barShine} />

        <style jsx>{`
          .xpEnergyFull {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            pointer-events: none;
            overflow: hidden;
          }

          .xpEnergyFull:before {
            content: "";
            position: absolute;
            top: -60%;
            left: -60%;
            width: 220%;
            height: 220%;
            background: linear-gradient(
              100deg,
              rgba(255, 255, 255, 0) 35%,
              rgba(255, 255, 255, 0.16) 48%,
              rgba(255, 255, 255, 0.28) 50%,
              rgba(255, 255, 255, 0.16) 52%,
              rgba(255, 255, 255, 0) 65%
            );
            transform: translateX(-35%);
            animation: energyFlowFull 2.2s linear infinite;
            mix-blend-mode: screen;
            filter: blur(1px);
            opacity: 0.9;
          }

          @keyframes energyFlowFull {
            0% {
              transform: translateX(-45%);
            }
            100% {
              transform: translateX(45%);
            }
          }
        `}</style>
      </div>

      <div style={beast.bottom}>
        <span style={{ color: ui.muted }}>
          Volgende: <b style={{ color: ui.text }}>{next?.name ?? "Max level"}</b>
        </span>
        <span style={{ color: ui.muted }}>{next ? `${xp}/${to} XP` : "🚀"}</span>
      </div>
    </div>
  );
}

const beast: Record<string, React.CSSProperties> = {
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    fontWeight: 950,
    color: ui.muted,
    letterSpacing: 0.6,
  },
  wolfBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.40)",
    border: `1px solid ${ui.border}`,
    boxShadow:
      "0 10px 26px rgba(0,0,0,0.20), 0 0 0 1px rgba(75,142,141,0.22)",
  },
  title: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 980,
    color: ui.text,
  },
  meta: { marginTop: 6, fontSize: 13, color: ui.muted },
  pill: {
    height: 34,
    padding: "0 12px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${ui.border}`,
  },
  barWrap: {
    marginTop: 12,
    height: 14,
    borderRadius: 999,
    background: "rgba(0,0,0,0.40)",
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
    position: "relative",
  },
  barHalo: {
    position: "absolute",
    inset: 0,
    borderRadius: 999,
    background:
      "radial-gradient(120px 24px at 0% 50%, rgba(37,89,113,0.00) 0%, rgba(37,89,113,0.22) 40%, rgba(0,0,0,0) 72%)",
    opacity: 0.9,
    pointerEvents: "none",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    position: "relative",
    background: `linear-gradient(90deg, ${brand.blue}, ${brand.teal}, ${brand.mint})`,
    boxShadow:
      "0 0 18px rgba(75,142,141,0.35), 0 0 40px rgba(137,194,170,0.12)",
  },
  barEdgeGlow: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 26,
    height: 34,
    borderRadius: 999,
    background: "rgba(234,240,255,0.22)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  barShine: {
    position: "absolute",
    inset: 0,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.00) 60%)",
    mixBlendMode: "soft-light",
    pointerEvents: "none",
  },
  bottom: {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12.5,
  },
};

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
    transition: "transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
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