"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import ChallengeCard from "./ChallengeCard";
import BaseHero from "@/components/heroes/BaseHero";
import { supabase } from "@/lib/supabaseClient";

type Profiel = {
  id: string;
  volledige_naam: string | null;
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
      title="LO App"
      subtitle="Challenges"
      userName={profiel?.volledige_naam ?? null}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <BaseHero
          label="CHALLENGE HUB"
          title={
            <>
              Beweeg. Competeer.
              <br />
              <span
                className="bg-[linear-gradient(90deg,#255971,#4B8E8D,#89C2AA)] bg-clip-text text-transparent"
              >
                Scoor voor jezelf en je klas.
              </span>
            </>
          }
          description={
            <>
              Ontdek alle sportieve challenges van school. Doe mee aan de Run &
              Walk Challenge, test je kracht op de roeier of schrijf je in voor
              een tornooi.
            </>
          }
          imageSrc="/challenges/challenges.png"
          imageAlt="Overzicht van de challenges"
          actions={
            <>
              <InfoPill>🏆 Klassementen</InfoPill>
              <InfoPill>👟 Individuele prestaties</InfoPill>

              <div style={{ width: "100%", marginTop: 4 }}>
                <Link href="/dashboard" style={styles.dashboardBtn}>
                  ← Terug naar dashboard
                </Link>
              </div>
            </>
          }
          imageClassName="scale-[1.02]"
        />

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