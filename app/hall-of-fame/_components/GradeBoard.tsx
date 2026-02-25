import React, { useEffect, useState } from "react";
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

  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(true); // desktop open, gsm wordt hieronder dicht gezet

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");

    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setOpen(!mobile); // ✅ gsm: gesloten, desktop: open
    };

    apply();

    // compat: addEventListener vs addListener
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  const canToggle = isMobile;

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

      {/* header (klikbaar enkel op gsm) */}
      <div
        onClick={canToggle ? () => setOpen((v) => !v) : undefined}
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
          cursor: canToggle ? "pointer" : "default",
          userSelect: canToggle ? "none" : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span>{gradeTitle}</span>

        {/* pijltje enkel op gsm */}
        {isMobile && (
          <span
            aria-hidden
            style={{
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* body (inklappen enkel op gsm) */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: !isMobile ? 12 : open ? 12 : "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,

          // animatie enkel relevant op gsm
          maxHeight: !isMobile ? undefined : open ? 5000 : 0,
          opacity: !isMobile ? 1 : open ? 1 : 0,
          overflow: !isMobile ? "visible" : "hidden",
          transition: !isMobile ? undefined : "all 0.3s ease",
        }}
      >
        {disciplines.map((d) => (
          <DisciplineCard
            key={d.key}
            t={t}
            discipline={d}
            schooljaar={schooljaar}
          />
        ))}
      </div>
    </section>
  );
}