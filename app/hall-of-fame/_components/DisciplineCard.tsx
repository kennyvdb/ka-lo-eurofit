import React, { useState } from "react";
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
  const [open, setOpen] = useState(false); // ✅ start gesloten

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${t.blockEdge}`,
        background: t.block,
        overflow: "hidden",
        width: "100%", // ✅ altijd volle breedte (tri niet kleiner)
        alignSelf: "stretch",
      }}
    >
      {/* 🔹 Titel rij (klikbaar) */}
      <div
        onClick={() => setOpen(!open)}
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
          cursor: "pointer",
        }}
      >
        <span>{discipline.title}</span>
        <span
          style={{
            transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>

      {/* 🔹 Inhoud */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          padding: open ? 10 : "0 10px",
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease",
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