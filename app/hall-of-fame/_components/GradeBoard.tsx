import React from "react";
import type { Discipline, ThemeName } from "./types";
import { themeVars } from "./theme";
import DisciplineCard from "./DisciplineCard";

export default function GradeBoard({
  gradeTitle,
  theme,
  schooljaar,
  disciplines,
}: {
  gradeTitle: string;
  theme: ThemeName;
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

      {/* body */}
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