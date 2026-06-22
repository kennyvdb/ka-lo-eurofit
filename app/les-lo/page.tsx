"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

export default function LesLOHubPage() {
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
        .select("id, volledige_naam, rol")
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
      subtitle="Les LO"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="LES LO"
        title={
          <>
            Les LO hub <span className="opacity-85">🏃‍♂️</span>
          </>
        }
        description={
          <>
            Alles voor de les: <strong className="text-white">kijkwijzers</strong>,{" "}
            <strong className="text-white">rollen</strong>,{" "}
            <strong className="text-white">jaarplanning</strong>,{" "}
            <strong className="text-white">evaluaties</strong> en{" "}
            <strong className="text-white">afspraken</strong>.
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="Les LO illustratie"
        quoteTitle="Samen sterk in LO"
        quote="Iedere rol telt mee in een goede les."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
          >
            🏠 Terug naar dashboard
          </Link>
        }
      />

      <section className="mt-4">
        <div className="mb-3 text-[13px] font-black text-white/85">Les LO</div>

        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <BaseTile
            href="/les-lo/kijkwijzers"
            icon="👀"
            title="Kijkwijzers"
            desc="Waarop letten tijdens de les"
          />

          <BaseTile
            href="/les-lo/rollen"
            icon="🎭"
            title="Rollenkaarten"
            desc="Scheidsrechter, coach, timekeeper…"
          />

          <BaseTile
            href="/les-lo/jaarplanning"
            icon="🗓️"
            title="Jaarplanning"
            desc="Kies je leerkracht & planning"
          />

          <BaseTile
            href="/les-lo/evaluaties"
            icon="✅"
            title="Evaluaties"
            desc="Rubrics (SAM) & feedback"
          />

          <BaseTile
            href="/les-lo/afspraken"
            icon="📌"
            title="Afspraken LO"
            desc="Regels, veiligheid & afspraken"
          />
        </div>
      </section>
    </AppShell>
  );
}
