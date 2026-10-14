
"use client";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
type Profiel = {
  volledige_naam: string | null;
  rol: string | null;
};
const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.74)",
  border: "rgba(255,255,255,0.12)",
  panel: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};
function normalizeRole(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}
function isAllowedRole(rol: string) {
  return rol === "leerkracht_lo" || rol === "lo_leerkracht" || rol === "admin";
}
export default function LeerkrachtenChallengesPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  useEffect(() => {
    const run = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Kon sessie niet laden:", sessionError.message);
        setLoading(false);
        return;
      }
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
        console.error("Kon profiel niet laden:", error.message);
        setLoading(false);
        return;
      }
      const rol = normalizeRole(profielData?.rol);
      setProfiel(profielData as Profiel | null);
      setAllowed(isAllowedRole(rol));
      setLoading(false);
    };
    void run();
  }, []);
  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Challenges">
        <section style={styles.panel}>
          <p style={{ margin: 0, color: ui.text }}>Laden...</p>
        </section>
      </AppShell>
    );
  }
  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Geen toegang" userName={profiel?.volledige_naam ?? null}>
        <section style={styles.panel}>
          <h1 style={{ margin: 0, color: ui.text, fontSize: 22 }}>Geen toegang</h1>
          <p style={{ color: ui.muted }}>Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.</p>
          <Link href="/dashboard" style={{ color: ui.text, fontWeight: 900, textDecoration: "none" }}>
            Terug naar dashboard →
          </Link>
        </section>
      </AppShell>
    );
  }
  return (
    <AppShell title="LO App" subtitle="Challenges" userName={profiel?.volledige_naam ?? null}>
      <div style={{ display: "grid", gap: 16 }}>
        <BaseHero
          label="LO-LEERKRACHT"
          title={
            <>
              Challenge{" "}
              <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
                beheer
              </span>
            </>
          }
          description="Beheer deelnemers, inschrijvingen, wedstrijden en resultaten van onze schoolchallenges. Bekijk ook welke tornooien binnenkort beschikbaar worden."
          imageSrc="/challenges/challenges.png"
          imageAlt="Challenges beheren"
          quoteTitle="Challengebeheer"
          quote="Eén centrale plaats voor scores, deelnemers en klassementen."
          quoteAuthor="LO team"
          actions={
            <Link
              href="/leerkrachten-lo"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            >
              ← Terug naar LO-dashboard
            </Link>
          }
        />
        <section>
          <div style={styles.sectionTitle}>Challenges beheren</div>
          <div className="challenge-admin-grid">
            <BaseTile
              href="/leerkrachten-lo/challenges/pingpongtornooi"
              icon="🏓"
              title="Pingpongtornooi"
              desc="Beheer inschrijvingen, deelnemers, wedstrijden, speelplanning en resultaten van het pingpongtornooi."
            />
            <BaseTile
              href="/leerkrachten-lo/challenges/roeichallenge"
              icon="🚣"
              title="Row Cup 2026"
              desc="Afgelopen challenge. Bekijk het klassement en beheer de teams, afstanden en resultaten."
            />
          </div>
        </section>
        <section>
          <div style={styles.sectionTitle}>Komende challenges</div>
          <div className="challenge-admin-grid">
            <BaseTile
              href="#"
              icon="👟"
              title="Run & Walk Challenge"
              desc="Binnenkort beschikbaar."
            />
            <BaseTile
              href="#"
              icon="⚽"
              title="Voetbaltornooi"
              desc="Binnenkort beschikbaar."
            />
            <BaseTile
              href="#"
              icon="🏐"
              title="Volleybaltornooi"
              desc="Binnenkort beschikbaar."
            />
          </div>
        </section>
        <style jsx>{`
          .challenge-admin-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
          @media (max-width: 1000px) {
            .challenge-admin-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 640px) {
            .challenge-admin-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  sectionTitle: {
    marginBottom: 12,
    color: ui.text,
    fontSize: 18,
    fontWeight: 980,
  },
};
