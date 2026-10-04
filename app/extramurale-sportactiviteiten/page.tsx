"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import { TileGrid } from "@/components/tiles/TileGrid";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
type Profiel = { volledige_naam: string | null; rol: string | null };

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.74)",
  border: "rgba(255,255,255,0.12)",
  panel: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

// Dit is het gewone overzicht: iedereen opent dezelfde leerlingpagina's.
const modules = [
  {
    href: "/extramurale-sportactiviteiten/sportdagen",
    icon: "🏆",
    title: "Sportdagen",
    desc: "Praktische informatie & deelname",
  },
  {
    href: "/extramurale-sportactiviteiten/sneeuwstage",
    icon: "❄️",
    title: "Sneeuwstage",
    desc: "Info, checklist & eigen materiaal",
  },
  {
    href: "/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten",
    icon: "🌙",
    title: "Na-schoolse sportactiviteiten",
    desc: "Activiteiten & inschrijvingen",
  },
];

export default function ExtramuraleSportactiviteitenPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;
        const { data, error: profielError } = await supabase
          .from("profielen").select("volledige_naam, rol")
          .eq("id", user.id).maybeSingle();
        if (profielError) throw profielError;
        if (active) {
          setProfiel(data as Profiel | null);
          setSignedIn(true);
        }
      } catch (err) {
        if (active) setError(
          err instanceof Error ? err.message : "Kon je gegevens niet laden. Probeer de pagina opnieuw te laden."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading || error || !signedIn) {
    return (
      <AppShell title="LO App" subtitle="Extramurale sportactiviteiten" userName={profiel?.volledige_naam ?? null}>
        <section style={styles.panel}>
          {loading ? <p style={{ margin: 0, color: ui.text }}>Laden…</p> : error ? (
            <p role="alert" style={{ color: ui.text }}>{error}</p>
          ) : <>
            <h1 style={{ margin: 0, color: ui.text, fontSize: 22 }}>Log in</h1>
            <p style={{ color: ui.muted, lineHeight: 1.6 }}>Log in met je schoolaccount om de activiteiten te bekijken.</p>
            <Link href="/login" style={{ color: ui.text, fontWeight: 900 }}>Naar de login →</Link>
          </>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Extramurale sportactiviteiten" userName={profiel?.volledige_naam ?? null}>
      <BaseHero
        label="EXTRAMURALE SPORTACTIVITEITEN"
        title={<>Extramurale{" "}<span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">sportactiviteiten</span></>}
        description="Ontdek de sportdagen, sneeuwstage en sportactiviteiten buiten de school. Hier vind je alle praktische informatie."
        imageSrc="/lo/LO.png"
        imageAlt="Extramurale sportactiviteiten"
        quoteTitle="Buiten de school"
        quote="Samen sporten, ontdekken en beleven."
        quoteAuthor="LO team"
        actions={<Link href="/dashboard" className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]">← Terug naar dashboard</Link>}
      />
      <section className="mt-[18px]">
        <div className="mb-3 text-[13px] font-black text-white/85">Activiteiten</div>
        <TileGrid>
          {modules.map(module => <BaseTile key={module.title} href={module.href} icon={module.icon} title={module.title} desc={module.desc} />)}
        </TileGrid>
      </section>
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
};
