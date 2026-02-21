"use client";

import AppShell from "@/components/AppShell";
import Image from "next/image";
import React from "react";

type Entry = { name: string; record: string; extra?: string };
type GenderSet = {
  allTime: Entry[];
  schoolYear: Entry[];
};
type Discipline = {
  key: string;
  title: string;
  boys: GenderSet;
  girls: GenderSet;
  isTriatlon?: boolean;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
};

function getSuggestedSchooljaar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function themeVars(theme: "blue" | "green" | "greenDark") {
  if (theme === "blue") {
    return {
      header: "rgba(18, 86, 135, 0.92)",
      headerEdge: "rgba(255,255,255,0.16)",
      panel: "rgba(14, 70, 115, 0.35)",
      panelEdge: "rgba(130, 200, 255, 0.18)",
      block: "rgba(12, 54, 86, 0.55)",
      blockEdge: "rgba(255,255,255,0.14)",
      titlePill: "rgba(0,0,0,0.25)",
      subPill: "rgba(0,0,0,0.22)",
      chip: "rgba(0,0,0,0.32)",
    };
  }
  if (theme === "green") {
    return {
      header: "rgba(10, 112, 88, 0.92)",
      headerEdge: "rgba(255,255,255,0.16)",
      panel: "rgba(9, 97, 75, 0.35)",
      panelEdge: "rgba(120, 255, 210, 0.18)",
      block: "rgba(8, 74, 58, 0.55)",
      blockEdge: "rgba(255,255,255,0.14)",
      titlePill: "rgba(0,0,0,0.25)",
      subPill: "rgba(0,0,0,0.22)",
      chip: "rgba(0,0,0,0.32)",
    };
  }
  return {
    header: "rgba(14, 120, 62, 0.92)",
    headerEdge: "rgba(255,255,255,0.16)",
    panel: "rgba(11, 98, 52, 0.35)",
    panelEdge: "rgba(160, 255, 190, 0.16)",
    block: "rgba(9, 72, 40, 0.58)",
    blockEdge: "rgba(255,255,255,0.14)",
    titlePill: "rgba(0,0,0,0.25)",
    subPill: "rgba(0,0,0,0.22)",
    chip: "rgba(0,0,0,0.32)",
  };
}

/** Zet triatlon in het midden (ongeveer). */
function withTriatlonInMiddle(list: Discipline[]) {
  const triIndex = list.findIndex((d) => d.isTriatlon);
  if (triIndex === -1) return list;

  const tri = list[triIndex];
  const rest = list.filter((_, i) => i !== triIndex);

  const mid = Math.floor(rest.length / 2);
  return [...rest.slice(0, mid), tri, ...rest.slice(mid)];
}

export default function HallOfFamePage() {
  const schooljaar = getSuggestedSchooljaar();

  // ✅ Placeholder data — vervang dit later door echte records (Supabase)
  const graad1: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("hoogspringen", "HOOGSPRINGEN"),
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("sprint", "SPRINT"),
    mkDiscipline("mas-tes", "MAS-TES"),
    mkDiscipline("triatlon", "TRIATLON", true),
  ]);

  const graad2: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("sprint", "SPRINT"),
    mkDiscipline("mas-tes", "MAS-TES"),
    mkDiscipline("beeptest", "BEEPTEST"),
    mkDiscipline("triatlon", "TRIATLON", true),
  ]);

  const graad3: Discipline[] = withTriatlonInMiddle([
    mkDiscipline("hoogspringen", "HOOGSPRINGEN"),
    mkDiscipline("verspringen", "VERSPRINGEN"),
    mkDiscipline("mas-tes", "MAS-TES"),
    mkDiscipline("beeptest", "BEEPTEST"),
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
              height: 190,
              borderRadius: 22,
              overflow: "hidden",
              border: `1px solid ${ui.border}`,
              background: ui.panel,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <Image
              // ✅ werkt ook met spaties in bestandsnaam
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
            <span>
              🏆 Overzicht per discipline • jongens/meisjes • all-time & schooljaar
            </span>
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

/** Desktop 3 kolommen, mobiel 1 kolom — zonder styled-jsx */
function ResponsiveThreeCol({ children }: { children: React.ReactNode }) {
  const [isWide, setIsWide] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isWide ? "repeat(3, minmax(0, 1fr))" : "1fr",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function GradeBoard({
  gradeTitle,
  theme,
  schooljaar,
  disciplines,
}: {
  gradeTitle: string;
  theme: "blue" | "green" | "greenDark";
  schooljaar: string;
  disciplines: Discipline[];
}) {
  const t = themeVars(theme);

  return (
    <section
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${t.panelEdge}`,
        background: t.panel,
        boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
        position: "relative",
      }}
    >
      {/* glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(700px 240px at 50% 0%, rgba(255,255,255,0.12), rgba(0,0,0,0)), radial-gradient(500px 220px at 30% 40%, rgba(255,255,255,0.06), rgba(0,0,0,0))",
          pointerEvents: "none",
        }}
      />

      {/* header */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "16px 14px",
          fontWeight: 950,
          letterSpacing: 0.6,
          fontSize: 24,
          textTransform: "uppercase",
          color: "rgba(234,240,255,0.95)",
          background: t.header,
          borderBottom: `1px solid ${t.headerEdge}`,
          textAlign: "center",
        }}
      >
        {gradeTitle}
      </div>

      {/* body: alles onder elkaar */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {disciplines.map((d) => (
          <DisciplineCard key={d.key} t={t} discipline={d} schooljaar={schooljaar} />
        ))}
      </div>
    </section>
  );
}

function DisciplineCard({
  t,
  discipline,
  schooljaar,
}: {
  t: ReturnType<typeof themeVars>;
  discipline: Discipline;
  schooljaar: string;
}) {
  const isTri = !!discipline.isTriatlon;

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${t.blockEdge}`,
        background: t.block,
        overflow: "hidden",
        alignSelf: isTri ? "center" : "stretch",
        width: isTri ? "92%" : "100%",
        maxWidth: isTri ? 520 : undefined,
        boxShadow: isTri ? "0 14px 34px rgba(0,0,0,0.28)" : undefined,
      }}
    >
      {/* Title row */}
      <div
        style={{
          padding: "10px 10px",
          fontWeight: 980,
          fontSize: 13,
          letterSpacing: 0.8,
          color: "rgba(234,240,255,0.92)",
          background: t.titlePill,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span>{discipline.title}</span>

        {isTri ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 950,
              padding: "6px 10px",
              borderRadius: 999,
              background: t.chip,
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(234,240,255,0.92)",
              whiteSpace: "nowrap",
            }}
          >
            ⭐ Highlight
          </span>
        ) : null}
      </div>

      {/* Gender columns (2 naast elkaar) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: 10,
        }}
      >
        <GenderColumn label="JONGENS" t={t} allTime={discipline.boys.allTime} schoolYear={discipline.boys.schoolYear} schooljaar={schooljaar} />
        <GenderColumn label="MEISJES" t={t} allTime={discipline.girls.allTime} schoolYear={discipline.girls.schoolYear} schooljaar={schooljaar} />
      </div>
    </div>
  );
}

function GenderColumn({
  label,
  t,
  allTime,
  schoolYear,
  schooljaar,
}: {
  label: "JONGENS" | "MEISJES";
  t: ReturnType<typeof themeVars>;
  allTime: Entry[];
  schoolYear: Entry[];
  schooljaar: string;
}) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          fontWeight: 980,
          fontSize: 12.5,
          letterSpacing: 0.7,
          background: t.subPill,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(234,240,255,0.92)",
        }}
      >
        {label}
      </div>

      <div style={{ padding: 10, display: "grid", gap: 10 }}>
        <ScoreTable title="Aller tijden" entries={allTime} />
        <ScoreTable title={`Schooljaar ${schooljaar}`} entries={schoolYear} />
      </div>
    </div>
  );
}

function ScoreTable({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.20)",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 950,
          color: "rgba(234,240,255,0.86)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span>{title}</span>
        <span style={{ opacity: 0.85 }}>TOP</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "rgba(234,240,255,0.84)",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                  width: "72%",
                }}
              >
                <span style={{ opacity: 0.75, marginRight: 8 }}>{i + 1}.</span>
                {e.name}
                {e.extra ? <span style={{ opacity: 0.75 }}> • {e.extra}</span> : null}
              </td>
              <td
                style={{
                  padding: "7px 10px",
                  fontSize: 12.5,
                  color: "rgba(234,240,255,0.92)",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                  width: "28%",
                  textAlign: "right",
                  fontWeight: 950,
                  whiteSpace: "nowrap",
                }}
              >
                {e.record}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Helper: maakt snel placeholder discipline aan */
function mkDiscipline(key: string, title: string, isTriatlon = false): Discipline {
  return {
    key,
    title,
    isTriatlon,
    boys: {
      allTime: [
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
      ],
      schoolYear: [
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
      ],
    },
    girls: {
      allTime: [
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
      ],
      schoolYear: [
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
        { name: "Naam leerling", record: "—" },
      ],
    },
  };
}
