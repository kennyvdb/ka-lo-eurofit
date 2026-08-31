"use client";

import AppShell from "@/components/AppShell";
import React, { useState } from "react";
import { PageHero, ui } from "../_ui";

/* ===============================
   BRAND COLORS
================================ */

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

/* ===============================
   TYPES
================================ */

type TeacherKey = "lien" | "kenny" | "tine";

type SpecialType = "vakantie" | "examens";

type WeekRow = {
  week: string;
  type?: SpecialType;

  lien?: string;
  kenny?: string;
  tine?: string;

  note?: string;
};

/* ===============================
   LEERKRACHTEN
================================ */

const teachers: Record<
  TeacherKey,
  {
    label: string;
    short: string;
    emoji: string;
  }
> = {
  lien: {
    label: "Mevr. Vandermeersch",
    short: "Mevr. Vandermeersch",
    emoji: "🏃‍♀️",
  },
  kenny: {
    label: "Mr. Vandeborre",
    short: "Mr. Vandeborre",
    emoji: "🏃‍♂️",
  },
  tine: {
    label: "Mevr. Desmet",
    short: "Mevr. Desmet",
    emoji: "🤸‍♀️",
  },
};

/* ===============================
   JAARPLANNING 2026 - 2027
================================ */

const planning: WeekRow[] = [
  {
    week: "week 1",
    lien: "Afspraken",
    kenny: "Afspraken",
    tine: "Afspraken",
    note: "Begint op dinsdag",
  },
  {
    week: "week 2",
    lien: "Conditie",
    kenny: "Racketlon / badminton",
    tine: "Conditie + kogelstoten",
  },
  {
    week: "week 3",
    lien: "Conditie",
    kenny: "Racketlon / badminton",
    tine: "Conditie + kogelstoten",
    note: "Op dinsdag sportdag",
  },
  {
    week: "week 4",
    lien: "Conditie",
    kenny: "Racketlon / badminton",
    tine: "VMA-test",
  },
  {
    week: "week 5",
    lien: "Kogelstoten",
    kenny: "Racketlon / badminton",
    tine: "Functional Fitness Test",
  },
  {
    week: "week 6",
    lien: "VMA",
    kenny: "VMA",
    tine: "Conditie",
  },
  {
    week: "week 7",
    lien: "Conditietest",
    kenny: "Functional Fitness Test",
    tine: "Conditietest",
  },
  {
    week: "week 8",
    lien: "Functional Fitness Test",
    kenny: "Sprint + kogelstoten",
  },
  {
    week: "week 9",
    note: "Klassenraden en rapport",
  },

  {
    week: "HERFSTVAKANTIE",
    type: "vakantie",
  },

  {
    week: "week 10",
    lien: "Hockey / volleybal",
    kenny: "Hockey / volleybal",
    tine: "Hockey / volleybal",
    note: "Woensdag Wapenstilstand",
  },
  {
    week: "week 11",
    lien: "Hockey / volleybal",
    kenny: "Hockey / volleybal",
    tine: "Hockey / volleybal",
  },
  {
    week: "week 12",
    lien: "Hockey / volleybal",
    kenny: "Hockey / volleybal",
    tine: "Hockey / volleybal",
  },
  {
    week: "week 13",
    lien: "Sportshopping",
    kenny: "Sportshopping",
    tine: "Sportshopping",
    note: "Dinsdagnamiddag geen les meer / woensdag start examens",
  },

  {
    week: "EXAMENS EN KLASSENRADEN",
    type: "examens",
  },

  {
    week: "KERSTVAKANTIE",
    type: "vakantie",
  },

  {
    week: "week 14",
    lien: "Basketbal",
    kenny: "Gym",
    tine: "Ritmiek",
  },
  {
    week: "week 15",
    lien: "Basketbal",
    kenny: "Gym",
    tine: "Ritmiek",
  },
  {
    week: "week 16",
    lien: "Basketbal",
    kenny: "Gym",
    tine: "Ritmiek",
  },
  {
    week: "week 17",
    lien: "Zelfverdediging",
    kenny: "Gym",
    tine: "Ritmiek",
  },
  {
    week: "week 18",
    lien: "Zelfverdediging",
    tine: "Sportshopping",
  },

  {
    week: "KROKUSVAKANTIE",
    type: "vakantie",
  },

  {
    week: "week 19",
    lien: "Ritmiek",
    kenny: "Ritmiek",
    tine: "Gym",
  },
  {
    week: "week 20",
    lien: "Ritmiek",
    kenny: "Ritmiek",
    tine: "Gym",
  },
  {
    week: "week 21",
    lien: "Ritmiek",
    kenny: "Ritmiek",
    tine: "Gym",
  },
  {
    week: "week 22",
    lien: "Ritmiek",
    kenny: "Ritmiek",
    tine: "Gym",
  },
  {
    week: "week 23",
  },
  {
    week: "week 24",
    lien: "GWP",
  },

  {
    week: "PAASVAKANTIE",
    type: "vakantie",
  },

  {
    week: "week 25",
    lien: "Gym",
    kenny: "CrossFit / bootcamp",
    tine: "Basketbal",
  },
  {
    week: "week 26",
    lien: "Gym",
    kenny: "CrossFit / bootcamp",
    tine: "Basketbal",
  },
  {
    week: "week 27",
    lien: "Gym",
    kenny: "CrossFit",
    tine: "Basketbal",
  },
  {
    week: "week 28",
    lien: "Gym",
    kenny: "Basketbal",
    tine: "Zelfverdediging / trek- en duwspelen / judo",
    note: "Donderdag en vrijdag Hemelvaart",
  },
  {
    week: "week 29",
    lien: "Sprint",
    kenny: "Basketbal",
    tine: "Zelfverdediging / trek- en duwspelen / judo",
  },
  {
    week: "week 30",
    lien: "Sprint",
    kenny: "Basketbal",
    tine: "Zelfverdediging / trek- en duwspelen / judo",
  },
  {
    week: "week 31",
    lien: "Triatlon",
    kenny: "Triatlon",
  },
  {
    week: "week 32",
    lien: "Triatlon",
    kenny: "Triatlon",
  },
  {
    week: "week 33",
    lien: "Sportshopping",
    kenny: "Sportshopping",
    tine: "Sportshopping",
    note: "Vrijdag starten de examens",
  },

  {
    week: "EXAMENS EN KLASSENRADEN",
    type: "examens",
  },

  {
    week: "ZOMERVAKANTIE",
    type: "vakantie",
  },
];

/* ===============================
   PAGE
================================ */

export default function JaarplanningPage() {
  const [teacher, setTeacher] = useState<TeacherKey>("lien");

  const activeTeacher = teachers[teacher];

  return (
    <AppShell
      title="LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={null}
    >
      <PageHero
        kicker="LES LO"
        title="Jaarplanning"
        subtitle="Schooljaar 2026–2027"
      />

      <section style={{ marginTop: 18 }}>
        {/* ===============================
            LEERKRACHT KEUZE
        ================================ */}

        <div style={teacherPanelStyle}>
          <div>
            <div style={smallLabelStyle}>JAARPLANNING VAN</div>

            <div style={selectedTeacherStyle}>
              <span style={{ fontSize: 24 }}>
                {activeTeacher.emoji}
              </span>

              <div>
                <div style={selectedTeacherNameStyle}>
                  {activeTeacher.label}
                </div>

                <div style={selectedTeacherSubStyle}>
                  Lichamelijke opvoeding
                </div>
              </div>
            </div>
          </div>

          <div style={teacherButtonsStyle}>
            {(Object.keys(teachers) as TeacherKey[]).map((key) => {
              const item = teachers[key];
              const active = key === teacher;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTeacher(key)}
                  style={{
                    ...teacherButtonStyle,
                    ...(active ? teacherButtonActiveStyle : {}),
                  }}
                >
                  <span>{item.emoji}</span>
                  <span>{item.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===============================
            PLANNING
        ================================ */}

        <div style={planningWrapStyle}>
          {planning.map((row, index) => {
            if (row.type === "vakantie") {
              return (
                <SpecialRow
                  key={`${row.week}-${index}`}
                  text={row.week}
                  tone="vakantie"
                />
              );
            }

            if (row.type === "examens") {
              return (
                <SpecialRow
                  key={`${row.week}-${index}`}
                  text={row.week}
                  tone="examens"
                />
              );
            }

            const activity = row[teacher];

            return (
              <WeekCard
                key={`${row.week}-${index}`}
                week={row.week}
                activity={activity}
                note={row.note}
              />
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

/* ===============================
   WEEK CARD
================================ */

function WeekCard({
  week,
  activity,
  note,
}: {
  week: string;
  activity?: string;
  note?: string;
}) {
  const hasActivity = Boolean(activity);

  return (
    <div style={weekCardStyle}>
      {/* accent links */}
      <div style={accentLineStyle} />

      <div style={weekNumberStyle}>
        <span style={weekIconStyle}>📅</span>
        {week}
      </div>

      <div style={weekContentStyle}>
        <div
          style={{
            ...activityStyle,
            ...(hasActivity ? {} : emptyActivityStyle),
          }}
        >
          {activity ?? "Nog geen activiteit gepland"}
        </div>

        {note && (
          <div style={noteStyle}>
            <span style={noteBadgeStyle}>INFO</span>
            <span>{note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===============================
   SPECIAL ROW
================================ */

function SpecialRow({
  text,
  tone,
}: {
  text: string;
  tone: "vakantie" | "examens";
}) {
  const vakantie = tone === "vakantie";

  return (
    <div
      style={{
        ...specialRowStyle,
        background: vakantie
          ? "linear-gradient(135deg, rgba(137,194,170,0.22), rgba(75,142,141,0.12))"
          : "linear-gradient(135deg, rgba(75,142,141,0.23), rgba(37,89,113,0.16))",

        borderColor: vakantie
          ? "rgba(137,194,170,0.32)"
          : "rgba(75,142,141,0.35)",
      }}
    >
      <div
        style={{
          ...specialIconStyle,
          background: vakantie
            ? "rgba(137,194,170,0.18)"
            : "rgba(75,142,141,0.20)",
        }}
      >
        {vakantie ? "🌿" : "📚"}
      </div>

      <div>
        <div style={specialLabelStyle}>
          {vakantie ? "VAKANTIE" : "SCHOOLORGANISATIE"}
        </div>

        <div style={specialTitleStyle}>{text}</div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */

const teacherPanelStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background:
    "linear-gradient(145deg, rgba(37,89,113,0.20), rgba(75,142,141,0.10))",
  border: `1px solid ${ui.border}`,
  boxShadow: "0 14px 36px rgba(0,0,0,0.20)",
  marginBottom: 18,
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 1.1,
  color: ui.muted,
  marginBottom: 8,
};

const selectedTeacherStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const selectedTeacherNameStyle: React.CSSProperties = {
  fontWeight: 950,
  color: ui.text,
  fontSize: 17,
};

const selectedTeacherSubStyle: React.CSSProperties = {
  marginTop: 2,
  color: ui.muted,
  fontSize: 12,
};

const teacherButtonsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 16,
};

const teacherButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  color: ui.muted,
  height: 44,
  borderRadius: 13,
  cursor: "pointer",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  transition: "all 160ms ease",
};

const teacherButtonActiveStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(75,142,141,0.95), rgba(37,89,113,0.95))",
  color: "white",
  border: "1px solid rgba(137,194,170,0.40)",
  boxShadow: "0 8px 20px rgba(0,0,0,0.24)",
};

const planningWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 9,
};

const weekCardStyle: React.CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "105px minmax(0,1fr)",
  gap: 14,
  padding: "14px 15px 14px 18px",
  borderRadius: 17,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
  overflow: "hidden",
};

const accentLineStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  background: `linear-gradient(
    180deg,
    ${brand.mint},
    ${brand.teal}
  )`,
};

const weekNumberStyle: React.CSSProperties = {
  color: ui.text,
  fontWeight: 950,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
};

const weekIconStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.8,
};

const weekContentStyle: React.CSSProperties = {
  minWidth: 0,
};

const activityStyle: React.CSSProperties = {
  color: ui.text,
  fontWeight: 800,
  fontSize: 14,
  lineHeight: 1.45,
};

const emptyActivityStyle: React.CSSProperties = {
  color: ui.muted,
  fontStyle: "italic",
  fontWeight: 600,
  opacity: 0.55,
};

const noteStyle: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 7,
  color: ui.muted,
  fontSize: 11.5,
  lineHeight: 1.4,
};

const noteBadgeStyle: React.CSSProperties = {
  padding: "3px 6px",
  borderRadius: 6,
  background: "rgba(137,194,170,0.12)",
  border: "1px solid rgba(137,194,170,0.20)",
  color: brand.mint,
  fontSize: 9,
  fontWeight: 950,
  letterSpacing: 0.6,
};

const specialRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 18,
  border: "1px solid",
  boxShadow: "0 9px 26px rgba(0,0,0,0.15)",
};

const specialIconStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  flexShrink: 0,
};

const specialLabelStyle: React.CSSProperties = {
  color: ui.muted,
  fontSize: 9,
  fontWeight: 950,
  letterSpacing: 1,
};

const specialTitleStyle: React.CSSProperties = {
  marginTop: 2,
  color: ui.text,
  fontSize: 14,
  fontWeight: 950,
};