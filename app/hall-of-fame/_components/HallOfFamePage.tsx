import AppShell from "@/components/AppShell";
import Image from "next/image";
import React from "react";
import GradeBoard from "./GradeBoard";
import ResponsiveThreeCol from "./ResponsiveThreeCol";
import { ui } from "./theme";
import { getSuggestedSchooljaar, mkDiscipline, withTriatlonInMiddle } from "./utils";
import type { Discipline } from "./types";

export default function HallOfFamePage() {
  const schooljaar = getSuggestedSchooljaar();

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
    <AppShell title="LO App" subtitle="Hall of Fame" userName={null}>
      <main style={{ marginTop: 12 }}>
        {/* Header afbeelding */}
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

        {/* 3 graden */}
        <section style={{ marginTop: 14 }}>
          <ResponsiveThreeCol>
            <GradeBoard gradeTitle="1e GRAAD" theme="blue" schooljaar={schooljaar} disciplines={graad1} />
            <GradeBoard gradeTitle="2e GRAAD" theme="green" schooljaar={schooljaar} disciplines={graad2} />
            <GradeBoard gradeTitle="3e GRAAD" theme="greenDark" schooljaar={schooljaar} disciplines={graad3} />
          </ResponsiveThreeCol>
        </section>
      </main>
    </AppShell>
  );
}