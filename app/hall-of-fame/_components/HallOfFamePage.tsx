"use client";

import AppShell from "@/components/AppShell";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GradeBoard from "./GradeBoard";
import ResponsiveThreeCol from "./ResponsiveThreeCol";
import { ui } from "./theme";
import { getSuggestedSchooljaar, mkDiscipline, withTriatlonInMiddle } from "./utils";
import type { Discipline } from "./types";

type Profiel = {
  id: string;
  volledige_naam: string | null;
};

export default function HallOfFamePage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const schooljaar = getSuggestedSchooljaar();

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

  // Placeholder data — later vervangbaar door Supabase
  const graad1: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("hoogspringen", "HOOGSPRINGEN"),
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("sprint", "SPRINT"),
    mkDiscipline("mas-test", "MAS-TEST"),
    mkDiscipline("triatlon", "TRIATLON", true),
  ]);

  const graad2: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("hoogspringen", "HOOGSPRINGEN"),
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("sprint", "SPRINT"),
    mkDiscipline("mas-test", "MAS-TEST"),
    mkDiscipline("triatlon", "TRIATLON", true),
  ]);

  const graad3: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("hoogspringen", "HOOGSPRINGEN"),
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("sprint", "SPRINT"),
    mkDiscipline("mas-test", "MAS-TEST"),
    mkDiscipline("triatlon", "TRIATLON", true),
  ]);

  return (
    <AppShell
      title="LO App"
      subtitle="Hall of Fame"
      userName={profiel?.volledige_naam ?? null}
    >
      <main style={{ marginTop: 12 }}>
        <section style={{ width: "100%" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(190px, 25vw, 320px)",
              borderRadius: 22,
              overflow: "hidden",
              border: `1px solid ${ui.border}`,
              background: ui.panel,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <Image
              src="/Hall%20Of%20Fame%20(transparent).png"
              alt="Hall of Fame"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12.5,
              color: ui.muted,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>🏆 Overzicht per discipline • jongens/meisjes • all-time & schooljaar</span>
            <span>
              Schooljaar: <b style={{ color: ui.text }}>{schooljaar}</b>
            </span>
          </div>
        </section>

        <section style={{ marginTop: 14 }}>
          <ResponsiveThreeCol>
            <GradeBoard
              gradeTitle="1e GRAAD"
              theme="blue"
              schooljaar={schooljaar}
              disciplines={graad1}
            />
            <GradeBoard
              gradeTitle="2e GRAAD"
              theme="green"
              schooljaar={schooljaar}
              disciplines={graad2}
            />
            <GradeBoard
              gradeTitle="3e GRAAD"
              theme="greenDark"
              schooljaar={schooljaar}
              disciplines={graad3}
            />
          </ResponsiveThreeCol>
        </section>
      </main>
    </AppShell>
  );
}