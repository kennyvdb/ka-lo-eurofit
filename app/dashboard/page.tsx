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

/* ---------------------------
   XP + streak
--------------------------- */
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

/* ---------------------------
   Beast levels
--------------------------- */
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

/* ---------------------------
   Quote
--------------------------- */
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

/* ---------------------------
   Page
--------------------------- */
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
    setConfirmingYear(true);
    setError(null);

    const { error } = await supabase
      .from("profielen")
      .upsert(
        {
          id: uid,
          schooljaar: suggestedSchooljaar,
          schooljaar_bevestigd_op: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

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
    shownRoleRaw === "teacher" || shownRoleRaw === "leerkracht" ? "Leerkracht" : "Leerling";

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Welkom";
  const showSchooljaarBanner = !profiel?.schooljaar || !profiel?.schooljaar_bevestigd_op;

  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={profiel?.volledige_naam}>
      {/* HERO */}
      <Hero greetingName={greetingName} shownRoleLabel={shownRoleLabel} klasNaam={profiel?.klas_naam} />

      {/* header row */}
      <div style={{ ...styles.headerRow, marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginTop: 0, fontSize: 13, color: ui.muted }}>
            Dag <b style={{ color: ui.text }}>{greetingName}</b> 👋 • {shownRoleLabel}
            {profiel?.klas_naam ? <span style={{ color: ui.muted }}> • {profiel.klas_naam}</span> : null}
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

      <BeastStatusCard xp={profiel?.xp ?? 0} streak={profiel?.streak ?? 0} bestStreak={profiel?.best_streak ?? 0} />

      {showSchooljaarBanner && (
        <div style={styles.banner}>
          <div>
            <div style={{ fontWeight: 950, color: ui.text }}>Bevestig je schooljaar</div>
            <div style={{ marginTop: 3, fontSize: 13, color: ui.muted }}>
              We stellen voor: <b style={{ color: ui.text }}>{suggestedSchooljaar}</b>
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

      {/* Trainingshub - squares */}
      <section style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Trainingshub</div>

        <div className="hub-grid">
          <SquareTile href="/eurofittest" icon="🧪" title="Eurofit" desc="Test & resultaten" />
          <SquareTile href="/functional-fitheidstest" icon="🏋️" title="Functional" desc="Fitheid & progressie" />
          <SquareTile href="/challenges" icon="🎯" title="Challenges" desc="Opdrachten & doelen" />
          <SquareTile href="/sportfolio" icon="📸" title="Sportfolio" desc="Bewijzen & reflecties" />

          {/* ✅ NIEUW */}
          <SquareTile href="/hall-of-fame" icon="🏆" title="Hall of Fame" desc="Topprestaties & records" />

          <SquareTile href="/links" icon="🔗" title="Links" desc="Handige bronnen" />
          <SquareTile href="/dashboard/profiel" icon="👤" title="Profiel" desc="Gegevens beheren" />
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
   HERO (iPhone-proof)
   - Vierkant groeit mee tot onderkant quote
   - Afbeelding altijd passend (contain)
   - Mini-override: mobiel max-hoogte
--------------------------- */
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
        {/* Text */}
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
            {klasNaam ? <span style={{ opacity: 0.85 }}> • {klasNaam}</span> : null}
            <span style={{ opacity: 0.85 }}> •</span> Login, train, verzamel XP en stijg in status.
          </div>

          <div style={hero.actions}>
            <Link href="/challenges" style={hero.primary}>
              Start challenge →
            </Link>
            <Link href="/eurofittest" style={hero.secondary}>
              Resultaten
            </Link>
          </div>

          <div style={hero.quoteCard}>
            <div style={hero.quoteLabel}>Quote van de maand</div>
            <div style={hero.quoteText}>“{q.q}”</div>
            <div style={hero.quoteAuthor}>— {q.a}</div>
          </div>
        </div>

        {/* Illustration */}
        <div className="heroArt" style={hero.artCol}>
          <div className="illuBox" style={hero.illuBox}>
            <Image
              src="/hero/sports-transparent.png"
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
          align-items: stretch; /* ✅ kolommen even hoog */
          position: relative;
          z-index: 1;
        }

        .heroArt {
          display: flex;
          justify-content: flex-end; /* ✅ box onderaan */
        }

        /* ✅ Mini-override: mobiel max-hoogte (desktop unchanged) */
        @media (max-width: 700px) {
          .heroInner {
            grid-template-columns: 1fr;
          }
          .heroArt {
            margin-top: 8px;
            justify-content: flex-start;
          }
          .illuBox {
            max-height: 320px; /* ✅ limiet op mobiel */
            height: auto !important; /* ✅ laat max-height winnen */
            width: 100%;
            aspect-ratio: 1 / 1;
          }
        }

        @media (max-width: 420px) {
          .hero :global(h1) {
            font-size: 26px !important;
          }
          .illuBox {
            max-height: 280px; /* extra klein scherm */
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
      "radial-gradient(900px 520px at 0% 0%, rgba(104,180,255,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(255,104,180,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
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
    background: "rgba(104,180,255,0.22)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(255,104,180,0.18)",
    filter: "blur(26px)",
  },

  content: { position: "relative", maxWidth: 620, zIndex: 1 },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },
  title: { margin: "8px 0 0 0", fontSize: 30, lineHeight: 1.05, fontWeight: 980, color: ui.text },
  accent: {
    background: "linear-gradient(90deg, rgba(104,180,255,1), rgba(255,104,180,1))",
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

  /* ✅ Vierkant groeit mee tot onderkant linker kolom (desktop) */
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
   Beast card
--------------------------- */
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
          <div style={beast.label}>🐺 Beast status</div>
          <div style={beast.title}>{current.name}</div>
          <div style={beast.meta}>
            <b style={{ color: ui.text }}>{xp} XP</b> • 🔥 Streak: <b style={{ color: ui.text }}>{streak}</b>{" "}
            <span style={{ color: ui.muted }}>• Best: {bestStreak}</span>
          </div>
        </div>
        <div style={beast.pill}>LEVEL</div>
      </div>

      <div style={beast.barWrap}>
        <div style={{ ...beast.barFill, width: `${pct}%` }} />
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
  card: { marginTop: 14, padding: 16, borderRadius: 22, background: ui.panel, border: `1px solid ${ui.border}` },
  row: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  label: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 18, fontWeight: 980, color: ui.text },
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
    height: 12,
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${ui.border}`,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(104,180,255,1), rgba(255,104,180,1))",
  },
  bottom: { marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12.5 },
};

/* ---------------------------
   Square Tile
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
          transform: translateY(0);
          transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease,
            background 140ms ease;
          overflow: hidden;
          position: relative;
        }
        .sq:before {
          content: "";
          position: absolute;
          inset: -40px -40px auto auto;
          width: 140px;
          height: 140px;
          border-radius: 999px;
          background: rgba(104, 180, 255, 0.12);
          filter: blur(10px);
          pointer-events: none;
        }
        .sq:hover {
          transform: translateY(-3px);
          border-color: ${ui.border2};
          background: ${ui.panel2};
          box-shadow: 0 14px 38px rgba(0, 0, 0, 0.35);
        }
        .sq:active {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
        }
        .top {
          display: grid;
          gap: 8px;
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
        }
        .desc {
          margin-top: 4px;
          font-size: 12.5px;
          color: ${ui.muted};
          line-height: 1.25;
        }
        .cta {
          margin-top: 10px;
          font-size: 12.5px;
          font-weight: 950;
          color: ${ui.text};
          opacity: 0.92;
        }
      `}</style>
    </Link>
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
