"use client";

import AppShell from "@/components/AppShell";
import React, { useMemo, useState } from "react";
import { PageHero, ui } from "../_ui";

/* ===============================
   BRAND COLORS (logo)
================================ */
const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

/* ===============================
   JAARPLANNING DATA
================================ */

type TeacherKey = "lien" | "kenny" | "tine";

const teachers: Record<TeacherKey, string> = {
  lien: "Mevr. Vandermeersch",
  kenny: "Mr. Vandeborre",
  tine: "Mevr. Desmet",
};

type WeekRow = {
  week: string;
  type?: "vakantie" | "examens" | "gwp";
  lien?: string;
  kenny?: string;
  tine?: string;
};

const planning: WeekRow[] = [
  { week: "week 1", lien: "afspraken", kenny: "afspraken en conditie", tine: "Afspraken" },
  { week: "week 2", lien: "conditie", kenny: "Eurofittest", tine: "Legertest + Ver" },
  { week: "week 3", lien: "conditie", kenny: "Legertest", tine: "Conditie / oriëntatie binnen" },
  { week: "week 4", lien: "legertest + conditie", kenny: "badm/rugby", tine: "Conditie / oriëntatie ster" },
  { week: "week 5", lien: "conditie", kenny: "badm/rugby", tine: "Test conditie/orientatie/eurofit" },
  { week: "week 6", lien: "eurofit", kenny: "badm/rugby", tine: "Ver" },
  { week: "week 7", lien: "ver", kenny: "badm/rugby", tine: "Eurofittest" },
  { week: "week 8", lien: "sportshopping", kenny: "sportshopping", tine: "Sportshopping" },

  { week: "HERFSTVAKANTIE", type: "vakantie" },

  { week: "week 9", lien: "korfbal", kenny: "korfbal", tine: "korfbal" },
  { week: "week 10", lien: "korfbal", kenny: "korfbal", tine: "korfbal" },
  { week: "week 11", lien: "korfbal", kenny: "korfbal", tine: "korfbal" },
  { week: "week 12", lien: "korfbal / sportshopping", kenny: "korfbal / sportshopping", tine: "korfbal / sportshopping" },
  { week: "week 13", lien: "examens", kenny: "examens", tine: "examens" },

  { week: "EXAMENS en KLASSENRADEN", type: "examens" },

  { week: "KERSTVAKANTIE", type: "vakantie" },

  { week: "week 15", lien: "handbal", kenny: "Gym", tine: "Ritmiek / badminton 6M" },
  { week: "week 16", lien: "handbal", kenny: "Gym", tine: "Ritmiek / badminton 6M" },
  { week: "week 17", lien: "handbal", kenny: "Gym", tine: "Ritmiek / badminton 6M" },
  { week: "week 18", lien: "badminton / racket", kenny: "Gym", tine: "Handbal" },
  { week: "week 19", lien: "badminton / racket", kenny: "Gym", tine: "Handbal" },
  { week: "week 20", lien: "badminton / racket", kenny: "Gym", tine: "Handbal" },

  { week: "KROKUSVAKANTIE", type: "vakantie" },

  { week: "week 21", lien: "ritmiek", kenny: "Ritmiek", tine: "Gym / Ritmiek 6M" },
  { week: "week 22", lien: "ritmiek", kenny: "Ritmiek", tine: "Gym / Ritmiek 6M" },
  { week: "week 23", lien: "ritmiek", kenny: "Ritmiek", tine: "Gym / Ritmiek 6M" },
  { week: "week 24", lien: "spurt", kenny: "Orientatielopen binnen", tine: "Gym" },
  { week: "week 25", lien: "spurt" },

  { week: "GWP", type: "gwp" },

  { week: "PAASVAKANTIE", type: "vakantie" },

  { week: "week 27", lien: "gym", kenny: "Zelfv/boksen", tine: "Badminton" },
  { week: "week 28", lien: "gym", kenny: "Zelfv/boksen", tine: "Badminton" },
  { week: "week 29", lien: "gym", kenny: "Zelfv/boksen", tine: "Badminton" },
  { week: "week 30", lien: "gym", kenny: "Handbal", tine: "Badminton / Gym 6M" },
  { week: "week 31", kenny: "Handbal", tine: "Spurt / Gym 6M" },
  { week: "week 32", kenny: "Handbal", tine: "Spurt / Gym 6M" },
  { week: "week 33", kenny: "Orientatielopen / 3000m", tine: "Gym 6M" },
  { week: "week 34", lien: "sportshopping", kenny: "sportshopping", tine: "sportshopping" },

  { week: "EXAMENS en KLASSENRADEN", type: "examens" },
  { week: "ZOMERVAKANTIE", type: "vakantie" },
];

/* ===============================
   PAGE
================================ */

export default function JaarplanningPage() {
  const [teacher, setTeacher] = useState<TeacherKey>("lien");

  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <PageHero kicker="LES LO" title="Jaarplanning" subtitle="Overzicht per week" />

      <section style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <select value={teacher} onChange={(e) => setTeacher(e.target.value as TeacherKey)} style={selectStyle}>
            {Object.entries(teachers).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={tableWrap}>
          {planning.map((row, i) => {
            if (row.type === "vakantie") {
              return <SpecialRow key={i} text={row.week} tone="vakantie" />;
            }
            if (row.type === "examens") {
              return <SpecialRow key={i} text={row.week} tone="examens" />;
            }
            if (row.type === "gwp") {
              return <SpecialRow key={i} text={row.week} tone="gwp" />;
            }

            return (
              <div key={i} style={rowStyle}>
                <div style={weekStyle}>{row.week}</div>
                <div style={contentStyle}>{row[teacher] ?? "—"}</div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

/* ===============================
   SPECIAL ROWS (brand synced)
================================ */

function SpecialRow({ text, tone }: { text: string; tone: "vakantie" | "examens" | "gwp" }) {
  const cfg =
    tone === "vakantie"
      ? {
          label: "🌿",
          bg: `linear-gradient(90deg, rgba(137,194,170,0.95), rgba(75,142,141,0.85))`,
          border: "rgba(137,194,170,0.55)",
        }
      : tone === "examens"
      ? {
          label: "📚",
          bg: `linear-gradient(90deg, rgba(75,142,141,0.95), rgba(37,89,113,0.85))`,
          border: "rgba(75,142,141,0.55)",
        }
      : {
          label: "🏕️",
          bg: `linear-gradient(90deg, rgba(37,89,113,0.95), rgba(75,142,141,0.85))`,
          border: "rgba(37,89,113,0.55)",
        };

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 16,
        textAlign: "center",
        fontWeight: 980,
        letterSpacing: 0.6,
        color: "rgba(255,255,255,0.95)",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ marginRight: 10 }}>{cfg.label}</span>
      {text}

      {/* subtiele shine */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 70%)",
          transform: "translateX(-55%)",
          animation: "shine 2.4s linear infinite",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-55%);
          }
          100% {
            transform: translateX(55%);
          }
        }
      `}</style>
    </div>
  );
}

/* ===============================
   STYLING
================================ */

const tableWrap: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 14,
  background: ui.panel,
  border: `1px solid ${ui.border}`,
};

const weekStyle: React.CSSProperties = {
  fontWeight: 900,
  color: ui.text,
  opacity: 0.95,
};

const contentStyle: React.CSSProperties = {
  color: ui.text,
};

const selectStyle: React.CSSProperties = {
  height: 46,
  padding: "0 12px",
  borderRadius: 14,
  border: `1px solid ${ui.border2}`,
  background: "rgba(0,0,0,0.55)",
  color: ui.text,
  fontWeight: 900,
  outline: "none",
  boxShadow: "0 10px 26px rgba(0,0,0,0.20)",
};

/* (brand const kept for future use; gradients already match palette) */
void brand;