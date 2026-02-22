import React from "react";
import type { Entry, ThemeVars } from "./types";
import ScoreTable from "./ScoreTable";

export default function GenderColumn({
  label,
  t,
  allTime,
  schoolYear,
  schooljaar,
}: {
  label: "JONGENS" | "MEISJES";
  t: ThemeVars;
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