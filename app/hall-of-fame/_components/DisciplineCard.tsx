import React from "react";
import type { Discipline, ThemeVars } from "./types";
import GenderColumn from "./GenderColumn";

export default function DisciplineCard({
  t,
  discipline,
  schooljaar,
}: {
  t: ThemeVars;
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
      </div>

      {/* ✅ Nu 2 rijen: jongens boven, meisjes onder */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          padding: 10,
        }}
      >
        <GenderColumn
          label="JONGENS"
          t={t}
          allTime={discipline.boys.allTime}
          schoolYear={discipline.boys.schoolYear}
          schooljaar={schooljaar}
        />
        <GenderColumn
          label="MEISJES"
          t={t}
          allTime={discipline.girls.allTime}
          schoolYear={discipline.girls.schoolYear}
          schooljaar={schooljaar}
        />
      </div>
    </div>
  );
}