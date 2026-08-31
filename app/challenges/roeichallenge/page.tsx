"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Profiel = {
  volledige_naam: string | null;
};

type Score = {
  id: string;
  schooljaar: string;

  roeier_1_id: string;
  roeier_1_naam: string;
  roeier_1_klas: string | null;

  roeier_2_id: string;
  roeier_2_naam: string;
  roeier_2_klas: string | null;

  roeier_3_id: string;
  roeier_3_naam: string;
  roeier_3_klas: string | null;

  afstand_meter: number;

  created_at: string;
  updated_at: string;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.70)",
  border: "rgba(255,255,255,0.12)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

function formatMeter(value: number) {
  return new Intl.NumberFormat("nl-BE").format(value);
}

function Medal({ position }: { position: number }) {
  if (position === 1) {
    return <span style={{ fontSize: 30 }}>🥇</span>;
  }

  if (position === 2) {
    return <span style={{ fontSize: 30 }}>🥈</span>;
  }

  if (position === 3) {
    return <span style={{ fontSize: 30 }}>🥉</span>;
  }

  return (
    <span
      style={{
        color: ui.muted,
        fontSize: 16,
        fontWeight: 950,
      }}
    >
      {position}
    </span>
  );
}

export default function RoeichallengePage() {
  const [loading, setLoading] = useState(true);

  const [profiel, setProfiel] =
    useState<Profiel | null>(null);

  const [scores, setScores] =
    useState<Score[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        /*
        =====================================================
        PROFIEL OPHALEN
        =====================================================
        */

        const { data: sessionData } =
          await supabase.auth.getSession();

        const uid =
          sessionData.session?.user?.id;

        if (uid) {
          const { data: profielData } =
            await supabase
              .from("profielen")
              .select("volledige_naam")
              .eq("id", uid)
              .maybeSingle();

          if (profielData) {
            setProfiel(
              profielData as Profiel
            );
          }
        }

        /*
        =====================================================
        ROW CUP SCORES OPHALEN
        =====================================================
        */

        const { data, error } =
          await supabase
            .from("roeichallenge_scores")
            .select("*")
            .order("schooljaar", {
              ascending: false,
            })
            .order("afstand_meter", {
              ascending: false,
            })
            .order("created_at", {
              ascending: true,
            });

        if (error) {
          throw error;
        }

        setScores(
          (data ?? []) as Score[]
        );
      } catch (err: any) {
        console.error(
          "Row Cup laden mislukt:",
          err
        );

        setError(
          err?.message ??
            "Het klassement kon niet geladen worden."
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  /*
  ===========================================================
  RECENTSTE SCHOOLJAAR MET RESULTATEN
  ===========================================================
  */

  const actiefSchooljaar =
    useMemo(() => {
      if (scores.length === 0) {
        return null;
      }

      const schooljaren =
        Array.from(
          new Set(
            scores
              .map(
                (score) =>
                  score.schooljaar
              )
              .filter(Boolean)
          )
        ).sort((a, b) =>
          b.localeCompare(a)
        );

      return schooljaren[0] ?? null;
    }, [scores]);

  /*
  ===========================================================
  KLASSEMENT
  ===========================================================
  */

  const ranking =
    useMemo(() => {
      if (!actiefSchooljaar) {
        return [];
      }

      return scores
        .filter(
          (score) =>
            score.schooljaar ===
            actiefSchooljaar
        )
        .sort((a, b) => {
          if (
            b.afstand_meter !==
            a.afstand_meter
          ) {
            return (
              b.afstand_meter -
              a.afstand_meter
            );
          }

          return (
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
          );
        });
    }, [scores, actiefSchooljaar]);

  const top3 = ranking.slice(0, 3);

  return (
    <AppShell
      title="LO App"
      subtitle="Row Cup 2026"
      userName={
        profiel?.volledige_naam ??
        null
      }
    >
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        {/* =================================================
            HERO
        ================================================= */}

        <BaseHero
          label="1E GRAAD · ROW CUP 2026"
          title={
            <>
              3 roeiers.{" "}
              <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
                6 minuten.
              </span>
            </>
          }
          description="Vorm een team van drie en roei samen in zes minuten zoveel mogelijk meters. Elke meter telt."
          imageSrc="/challenges/roeichallenge.png"
          imageAlt="Row Cup 2026"
          quoteTitle="ÉÉN DOEL"
          quote="Samen zoveel mogelijk meters verzamelen."
          quoteAuthor="Row Cup 2026"
          actions={
            <Link
              href="/challenges"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45"
            >
              ← Terug naar challenges
            </Link>
          }
        />

        {/* =================================================
            CHALLENGE INFO
        ================================================= */}

        <section style={styles.panel}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.eyebrow}>
                DE CHALLENGE
              </div>

              <h2 style={styles.h2}>
                Vorm jouw team
              </h2>
            </div>

            <div style={styles.challengeBadge}>
              🚣 ROW CUP 2026
            </div>
          </div>

          <p style={styles.intro}>
            Zoek twee medeleerlingen en vorm
            samen een team van drie. Jullie
            krijgen <b>6 minuten</b> om samen
            zoveel mogelijk meters te roeien.
          </p>

          <div
            className="rules-grid"
            style={styles.rulesGrid}
          >
            <InfoCard
              icon="👥"
              value="3"
              label="roeiers"
              text="Vorm een team van drie leerlingen."
            />

            <InfoCard
              icon="⏱️"
              value="6"
              label="minuten"
              text="Jullie hebben samen zes minuten."
            />

            <InfoCard
              icon="🚣"
              value="MAX"
              label="meters"
              text="Roei samen zoveel mogelijk meters."
            />

            <InfoCard
              icon="🏆"
              value="TOP"
              label="teams"
              text="De beste teams plaatsen zich voor de finale."
            />
          </div>
        </section>

        {/* =================================================
            PRAKTISCHE INFO
        ================================================= */}

        <section style={styles.panel}>
          <div style={styles.eyebrow}>
            PRAKTISCH
          </div>

          <h2 style={styles.h2}>
            Hoe werkt het?
          </h2>

          <div
            className="steps-grid"
            style={styles.stepsGrid}
          >
            <Step
              number="1"
              title="Vorm je team"
              text="Zoek twee medeleerlingen en vorm een team van drie."
            />

            <Step
              number="2"
              title="Schrijf je in"
              text="Schrijf je team in bij mevr. De Smet (LO), ten laatste op zondag 13 september."
            />

            <Step
              number="3"
              title="Row Cup"
              text="Vanaf de week van 21 september krijgen jullie 6 minuten om zoveel mogelijk meters te verzamelen."
            />

            <Step
              number="4"
              title="Finale"
              text="De beste teams plaatsen zich voor de finale: een 3 × 500 meter relay."
            />
          </div>
        </section>

        {/* =================================================
            TOP 3
        ================================================= */}

        {!loading &&
        !error &&
        top3.length > 0 ? (
          <section style={styles.panel}>
            <div style={styles.sectionHeading}>
              <div>
                <div style={styles.eyebrow}>
                  PODIUM
                </div>

                <h2 style={styles.h2}>
                  Top 3
                </h2>
              </div>

              <div style={styles.livePill}>
                <span
                  style={styles.liveDot}
                />
                LIVE
              </div>
            </div>

            <div
              className="podium-grid"
              style={styles.podiumGrid}
            >
              {top3.map(
                (score, index) => (
                  <PodiumCard
                    key={score.id}
                    score={score}
                    position={index + 1}
                  />
                )
              )}
            </div>
          </section>
        ) : null}

        {/* =================================================
            LIVE KLASSEMENT
        ================================================= */}

        <section style={styles.panel}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.eyebrow}>
                LIVE RANKING
              </div>

              <h2 style={styles.h2}>
                Klassement
              </h2>

              {actiefSchooljaar ? (
                <p style={styles.muted}>
                  Schooljaar{" "}
                  {actiefSchooljaar} ·{" "}
                  {ranking.length}{" "}
                  {ranking.length === 1
                    ? "team"
                    : "teams"}
                </p>
              ) : (
                <p style={styles.muted}>
                  Row Cup 2026
                </p>
              )}
            </div>

            <div style={styles.livePill}>
              <span
                style={styles.liveDot}
              />
              LIVE
            </div>
          </div>

          {loading ? (
            <div style={styles.emptyBox}>
              Klassement laden...
            </div>
          ) : error ? (
            <div style={styles.errorBox}>
              Het klassement kon niet
              geladen worden.
            </div>
          ) : ranking.length === 0 ? (
            <div style={styles.emptyState}>
              <div
                style={{
                  fontSize: 38,
                }}
              >
                🚣
              </div>

              <div>
                <div
                  style={{
                    color: ui.text,
                    fontWeight: 950,
                    fontSize: 16,
                  }}
                >
                  Nog geen resultaten
                </div>

                <p
                  style={{
                    ...styles.muted,
                    marginTop: 5,
                  }}
                >
                  Zodra de eerste teams hun
                  Row Cup hebben geroeid,
                  verschijnt het klassement
                  hier automatisch.
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.rankingList}>
              {ranking.map(
                (score, index) => (
                  <RankingRow
                    key={score.id}
                    score={score}
                    position={index + 1}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            FINALE
        ================================================= */}

        <section style={styles.finalPanel}>
          <div style={styles.finalIcon}>
            🏆
          </div>

          <div>
            <div style={styles.eyebrow}>
              DE FINALE
            </div>

            <h2
              style={{
                ...styles.h2,
                marginTop: 4,
              }}
            >
              3 × 500 meter relay
            </h2>

            <p
              style={{
                ...styles.muted,
                maxWidth: 680,
                marginTop: 7,
              }}
            >
              De beste teams uit de Row Cup
              plaatsen zich voor de finale.
              Daar neemt elke roeier 500 meter
              voor zijn of haar rekening. Het
              snelste team wint.
            </p>
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .rules-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }

          .steps-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }

          .podium-grid {
            grid-template-columns:
              1fr !important;
          }

          .ranking-row {
            grid-template-columns:
              48px minmax(0, 1fr)
              auto !important;
          }
        }

        @media (max-width: 640px) {
          .rules-grid,
          .steps-grid {
            grid-template-columns:
              1fr !important;
          }

          .ranking-row {
            grid-template-columns:
              42px minmax(0, 1fr) !important;
          }

          .ranking-distance {
            grid-column: 2;
            justify-self: start !important;
            margin-top: 7px;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  value,
  label,
  text,
}: {
  icon: string;
  value: string;
  label: string;
  text: string;
}) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoIcon}>
        {icon}
      </div>

      <div style={styles.infoValue}>
        {value}
      </div>

      <div style={styles.infoLabel}>
        {label}
      </div>

      <p style={styles.infoText}>
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   STAP
========================================================= */

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNumber}>
        {number}
      </div>

      <div>
        <div style={styles.stepTitle}>
          {title}
        </div>

        <p style={styles.stepText}>
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PODIUM
========================================================= */

function PodiumCard({
  score,
  position,
}: {
  score: Score;
  position: number;
}) {
  return (
    <div
      style={{
        ...styles.podiumCard,
        ...(position === 1
          ? styles.firstPlace
          : {}),
      }}
    >
      <div style={styles.podiumTop}>
        <Medal position={position} />

        <div style={styles.podiumPosition}>
          #{position}
        </div>
      </div>

      <div style={styles.podiumRiders}>
        <RoeierNaam
          naam={score.roeier_1_naam}
          klas={score.roeier_1_klas}
        />

        <RoeierNaam
          naam={score.roeier_2_naam}
          klas={score.roeier_2_klas}
        />

        <RoeierNaam
          naam={score.roeier_3_naam}
          klas={score.roeier_3_klas}
        />
      </div>

      <div style={styles.podiumDistance}>
        {formatMeter(
          score.afstand_meter
        )}
        <span> m</span>
      </div>
    </div>
  );
}

/* =========================================================
   RANKING ROW
========================================================= */

function RankingRow({
  score,
  position,
}: {
  score: Score;
  position: number;
}) {
  return (
    <div
      className="ranking-row"
      style={{
        ...styles.rankingRow,
        ...(position <= 3
          ? styles.topRankingRow
          : {}),
      }}
    >
      <div style={styles.position}>
        <Medal position={position} />
      </div>

      <div style={styles.teamMembers}>
        <RoeierNaam
          naam={score.roeier_1_naam}
          klas={score.roeier_1_klas}
        />

        <RoeierNaam
          naam={score.roeier_2_naam}
          klas={score.roeier_2_klas}
        />

        <RoeierNaam
          naam={score.roeier_3_naam}
          klas={score.roeier_3_klas}
        />
      </div>

      <div
        className="ranking-distance"
        style={styles.distance}
      >
        {formatMeter(
          score.afstand_meter
        )}
        <span> m</span>
      </div>
    </div>
  );
}

/* =========================================================
   ROEIER
========================================================= */

function RoeierNaam({
  naam,
  klas,
}: {
  naam: string;
  klas: string | null;
}) {
  return (
    <div style={styles.rider}>
      <span style={styles.riderName}>
        {naam}
      </span>

      {klas ? (
        <span style={styles.classBadge}>
          {klas}
        </span>
      ) : null}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow:
      "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },

  sectionHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },

  eyebrow: {
    color: "#89C2AA",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.2,
  },

  h2: {
    margin: "3px 0 0",
    color: ui.text,
    fontSize: 21,
    fontWeight: 950,
  },

  muted: {
    margin: "5px 0 0",
    color: ui.muted,
    fontSize: 13,
    lineHeight: 1.55,
  },

  intro: {
    margin: "15px 0 0",
    maxWidth: 760,
    color: ui.muted,
    fontSize: 14,
    lineHeight: 1.7,
  },

  challengeBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 36,
    padding: "0 12px",
    borderRadius: 999,
    border:
      "1px solid rgba(137,194,170,0.24)",
    background:
      "rgba(137,194,170,0.09)",
    color: ui.text,
    fontSize: 11,
    fontWeight: 950,
  },

  rulesGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0,1fr))",
    gap: 10,
  },

  infoCard: {
    padding: 16,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.20)",
  },

  infoIcon: {
    fontSize: 25,
  },

  infoValue: {
    marginTop: 10,
    color: ui.text,
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 980,
  },

  infoLabel: {
    marginTop: 4,
    color: "#89C2AA",
    fontSize: 12,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  infoText: {
    margin: "9px 0 0",
    color: ui.muted,
    fontSize: 12,
    lineHeight: 1.55,
  },

  stepsGrid: {
    marginTop: 17,
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0,1fr))",
    gap: 10,
  },

  stepCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 11,
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.18)",
  },

  stepNumber: {
    width: 30,
    height: 30,
    flex: "0 0 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border:
      "1px solid rgba(137,194,170,0.30)",
    background:
      "rgba(137,194,170,0.12)",
    color: "#89C2AA",
    fontSize: 12,
    fontWeight: 950,
  },

  stepTitle: {
    color: ui.text,
    fontSize: 13,
    fontWeight: 950,
  },

  stepText: {
    margin: "5px 0 0",
    color: ui.muted,
    fontSize: 12,
    lineHeight: 1.55,
  },

  livePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 34,
    padding: "0 11px",
    borderRadius: 999,
    border:
      "1px solid rgba(80,220,140,0.25)",
    background:
      "rgba(80,220,140,0.10)",
    color: ui.text,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 0.7,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "#50dc8c",
    boxShadow:
      "0 0 10px rgba(80,220,140,0.7)",
  },

  podiumGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0,1fr))",
    gap: 11,
  },

  podiumCard: {
    padding: 16,
    borderRadius: 21,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.22)",
  },

  firstPlace: {
    borderColor:
      "rgba(137,194,170,0.34)",
    background:
      "linear-gradient(180deg, rgba(137,194,170,0.13), rgba(0,0,0,0.22))",
  },

  podiumTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  podiumPosition: {
    color: ui.muted,
    fontSize: 12,
    fontWeight: 950,
  },

  podiumRiders: {
    marginTop: 14,
    display: "grid",
    gap: 7,
  },

  podiumDistance: {
    marginTop: 15,
    color: ui.text,
    fontSize: 27,
    fontWeight: 980,
  },

  rankingList: {
    marginTop: 16,
    display: "grid",
    gap: 8,
  },

  rankingRow: {
    display: "grid",
    gridTemplateColumns:
      "56px minmax(0,1fr) 150px",
    alignItems: "center",
    gap: 12,
    padding: "13px 14px",
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.20)",
  },

  topRankingRow: {
    borderColor:
      "rgba(137,194,170,0.20)",
    background:
      "linear-gradient(90deg, rgba(137,194,170,0.08), rgba(0,0,0,0.20))",
  },

  position: {
    display: "flex",
    justifyContent: "center",
  },

  teamMembers: {
    display: "grid",
    gap: 5,
    minWidth: 0,
  },

  rider: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },

  riderName: {
    color: ui.text,
    fontSize: 13,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  classBadge: {
    display: "inline-flex",
    flexShrink: 0,
    padding: "2px 7px",
    borderRadius: 999,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(255,255,255,0.05)",
    color: ui.muted,
    fontSize: 10,
    fontWeight: 900,
  },

  distance: {
    justifySelf: "end",
    color: ui.text,
    fontSize: 23,
    fontWeight: 980,
    whiteSpace: "nowrap",
  },

  emptyBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.18)",
    color: ui.muted,
    fontSize: 13,
  },

  emptyState: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 15,
    padding: 20,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.18)",
  },

  errorBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    border:
      "1px solid rgba(255,85,112,0.28)",
    background:
      "rgba(255,85,112,0.10)",
    color: ui.text,
  },

  finalPanel: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 24,
    border:
      "1px solid rgba(137,194,170,0.25)",
    background:
      "linear-gradient(135deg, rgba(137,194,170,0.12), rgba(37,89,113,0.09), rgba(0,0,0,0.20))",
    boxShadow:
      "0 14px 34px rgba(0,0,0,0.18)",
  },

  finalIcon: {
    width: 58,
    height: 58,
    flex: "0 0 58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    border:
      "1px solid rgba(137,194,170,0.25)",
    background:
      "rgba(0,0,0,0.22)",
    fontSize: 28,
  },
};