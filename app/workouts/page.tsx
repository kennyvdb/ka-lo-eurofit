"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
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
        <div style={{ color: ui.text }}>Workouts laden…</div>
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
      subtitle="Running"
      userName={profiel?.volledige_naam ?? null}
    >
      <WorkoutsHero
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
          Workouts
        </div>

        <div className="hub-grid">
          {tiles.map((t) => (
            <DashboardTile key={t.href} href={t.href} icon={t.icon} title={t.title} desc={t.desc} />
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
    <BaseHero
      label="WORKOUTS HUB"
      title={
        <>
          Let’s go,
          <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
            {greetingName}
          </span>
          💪
          <img
            src="/hero/beast.png"
            alt="Beast icoon"
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
        </>
      }
      description={
        <>
          {shownRoleLabel}
          {klasNaam ? <span className="opacity-85"> • {klasNaam}</span> : null}
          <span className="opacity-85"> •</span> Kies een categorie en start meteen.
        </>
      }
      imageSrc="/workouts/workouts.png"
      imageAlt="LO illustratie"
      quoteTitle="Workout reminder"
      quote="Consistency is a superpower."
      quoteAuthor="Beast HQ"
      imageClassName="scale-110 md:scale-[1.14] transition-transform duration-500"
      actions={
        <>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            Terug naar dashboard
          </Link>
        </>
      }
    />
  );
}

type TileProps = {
  href: string;
  icon: string;
  title: string;
  desc: string;
};

function DashboardTile({ href, icon, title, desc }: TileProps) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[20px] border border-slate-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.045))] p-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-slate-300/28 hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.10)] active:-translate-y-0.5"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(75,142,141,0.14)] blur-[14px] transition duration-300 group-hover:translate-x-2 group-hover:-translate-y-1.5 group-hover:scale-110" />
      <div className="absolute left-[-20%] top-[-10%] h-32 w-32 rounded-full bg-[rgba(137,194,170,0.08)] blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.42),rgba(75,142,141,0.42),rgba(137,194,170,0.30))_border-box] [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[20px] opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-[-40%_-30%] opacity-0 transition group-hover:opacity-100 group-hover:animate-[sweep_900ms_ease_forwards] [background:linear-gradient(120deg,rgba(255,255,255,0)_35%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_65%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(220px_140px_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative z-10 grid gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.38),rgba(0,0,0,0.30))] text-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {icon}
        </div>
        <div className="text-[15px] font-black tracking-[0.01em] text-white">{title}</div>
      </div>

      <div className="relative z-10">
        <div className="text-xs leading-5 text-white/70">{desc}</div>
        <div className="mt-2.5 text-xs font-black text-white/90 transition duration-200 group-hover:translate-x-0.5">
          Openen →
        </div>
      </div>

      <style jsx>{`
        @keyframes sweep {
          0% {
            transform: translateX(-55%) rotate(10deg);
          }
          100% {
            transform: translateX(55%) rotate(10deg);
          }
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