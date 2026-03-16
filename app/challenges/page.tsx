"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import ChallengeCard from "./ChallengeCard";
import { supabase } from "@/lib/supabaseClient";

type Profiel = {
  id: string;
  volledige_naam: string | null;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
};

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 38,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${ui.border}`,
        background: "rgba(0,0,0,0.28)",
        color: ui.text,
        fontWeight: 900,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 22,
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${ui.border}`,
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 950,
            color: ui.text,
            fontSize: 16,
          }}
        >
          {title}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 4,
              color: ui.muted,
              fontSize: 13,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

export default function Page() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  useEffect(() => {
    const loadProfiel = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Fout bij ophalen sessie:", error.message);
        return;
      }

      const userId = data.session?.user?.id;
      if (!userId) return;

      const { data: profielData, error: profielError } = await supabase
        .from("profielen")
        .select("id, volledige_naam")
        .eq("id", userId)
        .maybeSingle();

      if (profielError) {
        console.error("Fout bij ophalen profiel:", profielError.message);
        return;
      }

      setProfiel(profielData as Profiel);
    };

    loadProfiel();
  }, []);

  return (
    <AppShell
      title="Challenges"
      subtitle="GO! Atheneum Avelgem"
      userName={profiel?.volledige_naam ?? null}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <section style={hero.wrap}>
          <div style={hero.bgGlow1} />
          <div style={hero.bgGlow2} />

          <div style={hero.inner}>
            <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
              <div style={hero.kicker}>CHALLENGE HUB</div>

              <h1 style={hero.title}>
                Beweeg. Competeer.
                <br />
                <span style={hero.accent}>Scoor voor jezelf en je klas.</span>
              </h1>

              <div style={hero.sub}>
                Ontdek alle sportieve challenges van school. Doe mee aan de Run
                & Walk Challenge, test je kracht op de roeier of schrijf je in
                voor een tornooi.
              </div>

              <div style={hero.actions}>
                <InfoPill>🏆 Klassementen</InfoPill>
                <InfoPill>👟 Individuele prestaties</InfoPill>
              </div>

              <div style={{ marginTop: 18 }}>
                <Link href="/dashboard" style={styles.dashboardBtn}>
                  ← Terug naar dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SectionCard
          title="Actieve en komende challenges"
          subtitle="Kies een challenge en ontdek de details."
        >
          <div className="challengeGrid">
            <ChallengeCard
              href="/challenges/RunWalkChallenge"
              emoji="👟"
              subtitle="Actieve challenge"
              title="Run & Walk Challenge"
              description="Registreer je gelopen of gewandelde kilometers en help jouw klas naar de top van het klassement."
              status="Actief"
            />

            <ChallengeCard
              href="/challenges/roeichallenge"
              emoji="🚣"
              subtitle="Binnenkort"
              title="Roeichallenge"
              description="Een challenge rond afstand, snelheid of uithouding op de roeimachine."
              status="Binnenkort"
            />

            <ChallengeCard
              href="/challenges/pingpongtornooi"
              emoji="🏓"
              subtitle="Binnenkort"
              title="Pingpongtornooi"
              description="Daag andere leerlingen uit in een ladder- of tornooisysteem."
              status="Binnenkort"
            />

            <ChallengeCard
              href="/challenges/voetbaltornooi"
              emoji="⚽"
              subtitle="Binnenkort"
              title="Voetbaltornooi"
              description="Schrijf je klas of team in voor een schooltornooi."
              status="Binnenkort"
            />
          </div>
        </SectionCard>

        <style jsx>{`
          .challengeGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          @media (max-width: 900px) {
            .challengeGrid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: {
    position: "relative",
    zIndex: 1,
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
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.2,
    color: ui.muted,
  },
  title: {
    margin: "8px 0 0 0",
    fontSize: 32,
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
    marginTop: 12,
    fontSize: 14,
    color: ui.muted,
    maxWidth: 700,
    lineHeight: 1.6,
  },
  actions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};

const styles: Record<string, React.CSSProperties> = {
  dashboardBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(234,240,255,0.92)",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
  },
};