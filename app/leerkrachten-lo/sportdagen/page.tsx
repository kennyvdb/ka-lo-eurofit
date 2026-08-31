"use client";

import AppShell from "@/components/AppShell";
import React, {
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

const supabase =
  createClient();

const SCHOOLJAAR =
  "2026-2027";

const LEERJAREN_MET_KEUZE =
  [3, 5, 6, 7];

type Profiel = {
  id: string;
  volledige_naam: string | null;
  email: string | null;
  rol: string | null;
  leerjaar:
    | number
    | string
    | null;
  klas_naam: string | null;
};

type VervoersKeuze = {
  leerling_id: string;
  leerjaar: number;
  heen:
    | "fiets"
    | "eigen_vervoer";
  terug:
    | "fiets"
    | "eigen_vervoer";
  updated_at: string;
};

function getLeerjaar(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    typeof value ===
    "number"
  ) {
    return value;
  }

  if (!value) {
    return null;
  }

  const parsed =
    Number.parseInt(
      String(value),
      10
    );

  return Number.isNaN(
    parsed
  )
    ? null
    : parsed;
}

export default function SportdagenBeheerPage() {
  const [
    mijnProfiel,
    setMijnProfiel,
  ] =
    useState<Profiel | null>(
      null
    );

  const [
    leerlingen,
    setLeerlingen,
  ] =
    useState<Profiel[]>([]);

  const [
    keuzes,
    setKeuzes,
  ] =
    useState<
      VervoersKeuze[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        data: profile,
        error:
          profileError,
      } = await supabase
        .from("profielen")
        .select(
          `
          id,
          volledige_naam,
          email,
          rol,
          leerjaar,
          klas_naam
          `
        )
        .eq(
          "id",
          user.id
        )
        .single();

      if (
        profileError ||
        !profile
      ) {
        console.error(
          profileError
        );

        return;
      }

      setMijnProfiel(
        profile
      );

      const toegestaan =
        profile.rol ===
          "lo_leerkracht" ||
        profile.rol ===
          "admin";

      if (!toegestaan) {
        return;
      }

      const [
        leerlingenRes,
        keuzesRes,
      ] =
        await Promise.all([
          supabase
            .from(
              "profielen"
            )
            .select(
              `
              id,
              volledige_naam,
              email,
              rol,
              leerjaar,
              klas_naam
              `
            )
            .eq(
              "rol",
              "leerling"
            ),

          supabase
            .from(
              "sportdag_vervoer"
            )
            .select(
              `
              leerling_id,
              leerjaar,
              heen,
              terug,
              updated_at
              `
            )
            .eq(
              "schooljaar",
              SCHOOLJAAR
            ),
        ]);

      if (
        leerlingenRes.error
      ) {
        console.error(
          leerlingenRes.error
        );
      }

      if (
        keuzesRes.error
      ) {
        console.error(
          keuzesRes.error
        );
      }

      setLeerlingen(
        leerlingenRes.data ??
          []
      );

      setKeuzes(
        (keuzesRes.data ??
          []) as VervoersKeuze[]
      );
    } finally {
      setLoading(false);
    }
  }

  function getLeerlingen(
    leerjaar: number
  ) {
    return leerlingen
      .filter(
        (leerling) =>
          getLeerjaar(
            leerling.leerjaar
          ) === leerjaar
      )
      .sort((a, b) =>
        (
          a.volledige_naam ??
          ""
        ).localeCompare(
          b.volledige_naam ??
            "",
          "nl"
        )
      );
  }

  function getKeuzes(
    leerjaar: number
  ) {
    return keuzes.filter(
      (keuze) =>
        keuze.leerjaar ===
        leerjaar
    );
  }

  function getOntbrekend(
    leerjaar: number
  ) {
    const lln =
      getLeerlingen(
        leerjaar
      );

    const ids =
      new Set(
        getKeuzes(
          leerjaar
        ).map(
          (keuze) =>
            keuze.leerling_id
        )
      );

    return lln.filter(
      (leerling) =>
        !ids.has(
          leerling.id
        )
    );
  }

  const toegestaan =
    mijnProfiel?.rol ===
      "lo_leerkracht" ||
    mijnProfiel?.rol ===
      "admin";

  if (loading) {
    return (
      <AppShell
        title="KA LO App"
        subtitle="GO! Atheneum Avelgem"
        userName={null}
      >
        <style>{css}</style>

        <div className="loading">
          Overzicht laden...
        </div>
      </AppShell>
    );
  }

  if (!toegestaan) {
    return (
      <AppShell
        title="KA LO App"
        subtitle="GO! Atheneum Avelgem"
        userName={
          mijnProfiel
            ?.volledige_naam ??
          null
        }
      >
        <style>{css}</style>

        <div className="access">
          Geen toegang tot
          deze pagina.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={
        mijnProfiel
          ?.volledige_naam ??
        null
      }
    >
      <style>{css}</style>

      <main className="beheer-page">
        {/* HERO */}

        <section className="hero">
          <div className="hero-icon">
            🚲
          </div>

          <div>
            <span className="eyebrow">
              LEERKRACHTEN LO
            </span>

            <h1>
              Sportdagen
            </h1>

            <p>
              Overzicht van de
              vervoerskeuzes voor
              de sportdagen.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={
              loadData
            }
          >
            ↻ Vernieuwen
          </button>
        </section>

        {/* LEERJAREN */}

        <div className="year-grid">
          {LEERJAREN_MET_KEUZE.map(
            (leerjaar) => {
              const lln =
                getLeerlingen(
                  leerjaar
                );

              const jaarKeuzes =
                getKeuzes(
                  leerjaar
                );

              const ontbrekend =
                getOntbrekend(
                  leerjaar
                );

              const fietsHeen =
                jaarKeuzes.filter(
                  (keuze) =>
                    keuze.heen ===
                    "fiets"
                ).length;

              const eigenHeen =
                jaarKeuzes.filter(
                  (keuze) =>
                    keuze.heen ===
                    "eigen_vervoer"
                ).length;

              const fietsTerug =
                jaarKeuzes.filter(
                  (keuze) =>
                    keuze.terug ===
                    "fiets"
                ).length;

              const eigenTerug =
                jaarKeuzes.filter(
                  (keuze) =>
                    keuze.terug ===
                    "eigen_vervoer"
                ).length;

              const percentage =
                lln.length > 0
                  ? Math.round(
                      (jaarKeuzes.length /
                        lln.length) *
                        100
                    )
                  : 0;

              return (
                <section
                  key={
                    leerjaar
                  }
                  className="year-card"
                >
                  <div className="year-head">
                    <div>
                      <span className="year-label">
                        SPORTDAG
                      </span>

                      <h2>
                        {
                          leerjaar
                        }
                        e jaar
                      </h2>
                    </div>

                    <div className="year-percentage">
                      {
                        percentage
                      }
                      %
                    </div>
                  </div>

                  {/* HOOFDSTATISTIEKEN */}

                  <div className="stats">
                    <Stat
                      label="Leerlingen"
                      value={
                        lln.length
                      }
                    />

                    <Stat
                      label="Ingevuld"
                      value={
                        jaarKeuzes.length
                      }
                      type="success"
                    />

                    <Stat
                      label="Ontbrekend"
                      value={
                        ontbrekend.length
                      }
                      type={
                        ontbrekend.length >
                        0
                          ? "warning"
                          : "success"
                      }
                    />
                  </div>

                  {/* PROGRESS */}

                  <div className="progress">
                    <div
                      className="progress-value"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  {/* VERVOER */}

                  <div className="transport-grid">
                    <TransportStat
                      emoji="🚲"
                      label="Fiets heen"
                      value={
                        fietsHeen
                      }
                    />

                    <TransportStat
                      emoji="🚗"
                      label="Eigen vervoer heen"
                      value={
                        eigenHeen
                      }
                    />

                    <TransportStat
                      emoji="🚲"
                      label="Fiets terug"
                      value={
                        fietsTerug
                      }
                    />

                    <TransportStat
                      emoji="🚗"
                      label="Eigen vervoer terug"
                      value={
                        eigenTerug
                      }
                    />
                  </div>

                  {/* ONTBREKENDE LEERLINGEN */}

                  {ontbrekend.length >
                  0 ? (
                    <div className="missing-card">
                      <div className="missing-head">
                        <div>
                          <span className="warning-icon">
                            ⚠️
                          </span>

                          <strong>
                            Nog niet
                            ingevuld
                          </strong>
                        </div>

                        <span className="missing-count">
                          {
                            ontbrekend.length
                          }
                        </span>
                      </div>

                      <div className="missing-list">
                        {ontbrekend.map(
                          (
                            leerling
                          ) => (
                            <div
                              key={
                                leerling.id
                              }
                              className="missing-row"
                            >
                              <div>
                                <strong>
                                  {leerling.volledige_naam ??
                                    leerling.email ??
                                    "Onbekende leerling"}
                                </strong>

                                <small>
                                  {leerling.klas_naam ??
                                    "Geen klas"}
                                </small>
                              </div>

                              <span className="not-done">
                                Niet ingevuld
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="automatic-reminder-info">
                        🔔 Vanaf
                        8 september
                        verschijnt
                        automatisch een
                        reminder in de
                        app bij deze
                        leerlingen.
                      </div>
                    </div>
                  ) : (
                    <div className="complete-card">
                      ✓ Alle
                      leerlingen
                      hebben hun
                      vervoerskeuze
                      ingevuld.
                    </div>
                  )}

                  {/* INGEVULDE KEUZES */}

                  {jaarKeuzes.length >
                    0 && (
                    <details className="filled-details">
                      <summary>
                        Bekijk
                        ingevulde
                        keuzes
                      </summary>

                      <div className="filled-list">
                        {jaarKeuzes.map(
                          (
                            keuze
                          ) => {
                            const leerling =
                              lln.find(
                                (
                                  leerling
                                ) =>
                                  leerling.id ===
                                  keuze.leerling_id
                              );

                            return (
                              <div
                                key={
                                  keuze.leerling_id
                                }
                                className="filled-row"
                              >
                                <div className="student">
                                  <strong>
                                    {leerling?.volledige_naam ??
                                      leerling?.email ??
                                      "Leerling"}
                                  </strong>

                                  <small>
                                    {leerling?.klas_naam ??
                                      ""}
                                  </small>
                                </div>

                                <div className="choices">
                                  <span>
                                    {keuze.heen ===
                                    "fiets"
                                      ? "🚲"
                                      : "🚗"}{" "}
                                    heen
                                  </span>

                                  <span>
                                    {keuze.terug ===
                                    "fiets"
                                      ? "🚲"
                                      : "🚗"}{" "}
                                    terug
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </details>
                  )}
                </section>
              );
            }
          )}
        </div>
      </main>
    </AppShell>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type?:
    | "success"
    | "warning";
}) {
  return (
    <div
      className={`stat ${
        type ?? ""
      }`}
    >
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   TRANSPORT STAT
========================================================= */

function TransportStat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <div className="transport-stat">
      <div className="transport-stat-icon">
        {emoji}
      </div>

      <div>
        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   CSS
========================================================= */

const css = `
  * {
    box-sizing: border-box;
  }

  .loading,
  .access {
    min-height: 55vh;
    display: grid;
    place-items: center;
    color: rgba(234,240,255,0.70);
  }

  .beheer-page {
    width: 100%;
    max-width: 1250px;
    margin: 0 auto;
    padding: 24px 18px 60px;
    color: rgba(234,240,255,0.94);
  }

  /* HERO */

  .hero {
    padding: 28px;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.12);
    background:
      radial-gradient(
        500px 220px at 100% 0%,
        rgba(137,194,170,0.15),
        transparent 70%
      ),
      linear-gradient(
        135deg,
        rgba(37,89,113,0.48),
        rgba(75,142,141,0.26)
      );
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .hero-icon {
    width: 68px;
    height: 68px;
    flex: 0 0 auto;
    border-radius: 21px;
    display: grid;
    place-items: center;
    font-size: 32px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.13);
  }

  .eyebrow,
  .year-label {
    color: rgba(137,194,170,0.92);
    font-size: 10px;
    font-weight: 1000;
    letter-spacing: 1.4px;
  }

  .hero h1 {
    margin: 3px 0 0;
    font-size: 36px;
  }

  .hero p {
    margin: 7px 0 0;
    color: rgba(234,240,255,0.70);
  }

  .refresh-button {
    margin-left: auto;
    min-height: 42px;
    padding: 0 15px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.13);
    background: rgba(255,255,255,0.05);
    color: white;
    font-weight: 900;
    cursor: pointer;
  }

  /* GRID */

  .year-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 16px;
    align-items: start;
  }

  .year-card {
    min-width: 0;
    padding: 20px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.12);
    background:
      radial-gradient(
        500px 200px at 100% 0%,
        rgba(75,142,141,0.07),
        transparent 70%
      ),
      rgba(6,12,20,0.48);
  }

  .year-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .year-head h2 {
    margin: 3px 0 0;
    font-size: 23px;
  }

  .year-percentage {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.07);
    font-size: 15px;
    font-weight: 1000;
  }

  /* STATS */

  .stats {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 8px;
  }

  .stat {
    min-width: 0;
    padding: 13px;
    border-radius: 15px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .stat strong,
  .stat span {
    display: block;
  }

  .stat strong {
    font-size: 22px;
  }

  .stat span {
    margin-top: 2px;
    color: rgba(234,240,255,0.64);
    font-size: 11px;
  }

  .stat.success strong {
    color: #86efac;
  }

  .stat.warning strong {
    color: #fcd34d;
  }

  /* PROGRESS */

  .progress {
    height: 7px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
  }

  .progress-value {
    height: 100%;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        rgba(75,142,141,0.75),
        rgba(137,194,170,0.90)
      );
    transition: width 300ms ease;
  }

  /* TRANSPORT */

  .transport-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 8px;
  }

  .transport-stat {
    padding: 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .transport-stat-icon {
    width: 35px;
    height: 35px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: rgba(255,255,255,0.04);
  }

  .transport-stat strong,
  .transport-stat span {
    display: block;
  }

  .transport-stat strong {
    font-size: 16px;
  }

  .transport-stat span {
    margin-top: 1px;
    color: rgba(234,240,255,0.64);
    font-size: 10px;
  }

  /* MISSING */

  .missing-card {
    margin-top: 14px;
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(251,191,36,0.18);
    background: rgba(251,191,36,0.055);
  }

  .missing-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .missing-head > div {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  .missing-head strong {
    color: #fde68a;
    font-size: 13px;
  }

  .missing-count {
    min-width: 30px;
    height: 30px;
    padding: 0 7px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: #fde68a;
    background: rgba(251,191,36,0.09);
    font-weight: 950;
  }

  .missing-list {
    margin-top: 9px;
    max-height: 220px;
    overflow-y: auto;
  }

  .missing-row {
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .missing-row:last-child {
    border-bottom: 0;
  }

  .missing-row strong,
  .missing-row small {
    display: block;
  }

  .missing-row strong {
    font-size: 11px;
  }

  .missing-row small {
    margin-top: 2px;
    color: rgba(234,240,255,0.55);
  }

  .not-done {
    white-space: nowrap;
    color: #fcd34d;
    font-size: 9px;
    font-weight: 900;
  }

  .automatic-reminder-info {
    margin-top: 10px;
    padding: 9px;
    border-radius: 11px;
    background: rgba(0,0,0,0.10);
    color: rgba(253,230,138,0.78);
    font-size: 10px;
    line-height: 1.45;
  }

  .complete-card {
    margin-top: 14px;
    padding: 13px;
    border-radius: 15px;
    border: 1px solid rgba(34,197,94,0.18);
    background: rgba(34,197,94,0.07);
    color: #86efac;
    font-size: 12px;
    font-weight: 900;
  }

  /* FILLED */

  .filled-details {
    margin-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-top: 12px;
  }

  .filled-details summary {
    color: rgba(234,240,255,0.70);
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .filled-list {
    margin-top: 8px;
  }

  .filled-row {
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.055);
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .student strong,
  .student small {
    display: block;
  }

  .student strong {
    font-size: 11px;
  }

  .student small {
    color: rgba(234,240,255,0.54);
    font-size: 9px;
  }

  .choices {
    display: flex;
    gap: 8px;
  }

  .choices span {
    padding: 5px 7px;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    color: rgba(234,240,255,0.72);
    font-size: 9px;
    white-space: nowrap;
  }

  /* RESPONSIVE */

  @media(max-width: 850px) {
    .year-grid {
      grid-template-columns: 1fr;
    }
  }

  @media(max-width: 600px) {
    .beheer-page {
      padding: 14px 12px 45px;
    }

    .hero {
      padding: 20px 17px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .hero-icon {
      width: 54px;
      height: 54px;
      font-size: 25px;
    }

    .hero h1 {
      font-size: 29px;
    }

    .refresh-button {
      width: 100%;
      margin-left: 0;
    }

    .transport-grid {
      grid-template-columns: 1fr 1fr;
    }

    .filled-row {
      flex-direction: column;
    }
  }
`;