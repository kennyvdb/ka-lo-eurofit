"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================================================
   CONSTANTEN
========================================================= */

const SCHOOLJAAR_SPORTDAG = "2026-2027";
const LEERJAREN_MET_VERVOERSKEUZE = [3, 5, 6, 7];

/* =========================================================
   TYPES
========================================================= */

type MijnProfiel = {
  volledige_naam: string | null;
  rol: string | null;
};

type SmartschoolLeerling = {
  email: string | null;
  given_name: string | null;
  family_name: string | null;
  volledige_naam: string | null;
  username: string | null;
  klas_naam: string | null;
  lo_groepen: string | null;
  profiel_id: string | null;
  schooljaar: string | null;
};

type GekoppeldeLeerling = SmartschoolLeerling & {
  gekoppeld_profiel_id: string | null;
  koppeling:
    | "smartschool_profiel_id"
    | "niet_gekoppeld";
};


type VervoersKeuze = {
  leerling_id: string;
  leerjaar: number;
  heen: "fiets" | "eigen_vervoer";
  terug: "fiets" | "eigen_vervoer";
  updated_at: string;
};

/* =========================================================
   UI
========================================================= */

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  glass: "rgba(6, 12, 20, 0.42)",
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isAllowedRole(role: string) {
  return (
    role === "leerkracht_lo" ||
    role === "lo_leerkracht" ||
    role === "administratief_personeel" ||
    role === "admin"
  );
}

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeId(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getLeerjaarUitKlas(klasNaam: string | null) {
  if (!klasNaam) return null;

  const match = klasNaam.trim().match(/^([1-7])/);

  if (!match) return null;

  const leerjaar = Number(match[1]);

  return Number.isNaN(leerjaar) ? null : leerjaar;
}

function getNaam(leerling: SmartschoolLeerling) {
  if (leerling.volledige_naam?.trim()) {
    return leerling.volledige_naam.trim();
  }

  const naam = [
    leerling.given_name?.trim(),
    leerling.family_name?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  if (naam) return naam;

  if (leerling.email) return leerling.email;

  return "Onbekende leerling";
}

function formatTransport(value: VervoersKeuze["heen"]) {
  return value === "fiets" ? "Fiets" : "Eigen vervoer";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function SportdagenBeheerPage() {
  const [loading, setLoading] = useState(true);
  const [profiel, setProfiel] = useState<MijnProfiel | null>(null);
  const [allowed, setAllowed] = useState(false);

  const [leerlingen, setLeerlingen] = useState<GekoppeldeLeerling[]>([]);
  const [vervoersKeuzes, setVervoersKeuzes] = useState<VervoersKeuze[]>([]);

  const [smartschoolSchooljaar, setSmartschoolSchooljaar] =
    useState<string | null>(null);


  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* =======================================================
     DATA LADEN
  ======================================================= */

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      /* ---------------------------------------------------
         1. INGelogde gebruiker
      --------------------------------------------------- */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Gebruiker laden mislukt:", userError);

        setErrorMessage(
          "De ingelogde gebruiker kon niet worden geladen."
        );

        return;
      }

      if (!user) {
        setErrorMessage("Je bent niet aangemeld.");
        return;
      }

      /* ---------------------------------------------------
         2. EIGEN PROFIEL / ROL
      --------------------------------------------------- */

      const { data: profielData, error: profielError } = await supabase
        .from("profielen")
        .select("volledige_naam, rol")
        .eq("id", user.id)
        .maybeSingle();

      if (profielError) {
        console.error("Profiel laden mislukt:", profielError);

        setErrorMessage("Je profiel kon niet worden geladen.");

        return;
      }

      const mijnProfiel = profielData as MijnProfiel | null;

      setProfiel(mijnProfiel);

      const role = normalizeRole(mijnProfiel?.rol);
      const magBeheren = isAllowedRole(role);

      setAllowed(magBeheren);

      if (!magBeheren) {
        return;
      }

      /* ---------------------------------------------------
         3. SMARTSCHOOL LEERLINGEN
      --------------------------------------------------- */

      const { data: smartschoolData, error: smartschoolError } =
        await supabase
          .from("sportdag_class_students_view")
          .select(`
            email,
            given_name,
            family_name,
            volledige_naam,
            username,
            klas_naam,
            lo_groepen,
            profiel_id,
            schooljaar
          `)
          .range(0, 4999);

      if (smartschoolError) {
        console.error(
          "Smartschool leerlingen laden mislukt:",
          smartschoolError
        );

        setErrorMessage(
          "De leerlingen konden niet uit Smartschool worden geladen."
        );

        return;
      }

      const alleSmartschoolRijen =
        (smartschoolData ?? []) as SmartschoolLeerling[];

      /* ---------------------------------------------------
         4. SCHOOLJAAR KIEZEN

         Voorkeur:
         2026-2027

         Indien niet aanwezig:
         meest recente schooljaar
      --------------------------------------------------- */

      const beschikbareSchooljaren = Array.from(
        new Set(
          alleSmartschoolRijen
            .map((row) => row.schooljaar)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => b.localeCompare(a));

      const gekozenSchooljaar =
        beschikbareSchooljaren.includes(SCHOOLJAAR_SPORTDAG)
          ? SCHOOLJAAR_SPORTDAG
          : beschikbareSchooljaren[0] ?? null;

      setSmartschoolSchooljaar(gekozenSchooljaar);

      let actieveSmartschoolRijen = gekozenSchooljaar
        ? alleSmartschoolRijen.filter(
            (row) => row.schooljaar === gekozenSchooljaar
          )
        : alleSmartschoolRijen;

      /* ---------------------------------------------------
         5. DUBBELE SMARTSCHOOL-RIJEN VERWIJDEREN

         E-mail is primair.
         Username is fallback.
      --------------------------------------------------- */

      const uniekeLeerlingen = new Map<string, SmartschoolLeerling>();

      for (const leerling of actieveSmartschoolRijen) {
        const emailKey = normalizeEmail(leerling.email);

        const key =
          emailKey ||
          leerling.username?.trim().toLowerCase() ||
          "";

        if (!key) continue;

        const bestaande = uniekeLeerlingen.get(key);

        if (!bestaande) {
          uniekeLeerlingen.set(key, leerling);
          continue;
        }

        /*
          Bij dubbele rij:
          voorkeur voor rij met profiel_id.
        */

        if (!bestaande.profiel_id && leerling.profiel_id) {
          uniekeLeerlingen.set(key, leerling);
        }
      }

      actieveSmartschoolRijen =
        Array.from(uniekeLeerlingen.values());

      /* ---------------------------------------------------
         6. SMARTSCHOOL -> PROFIEL KOPPELEN

         De view sportdag_class_students_view bevat al profiel_id.
         We gebruiken dit veld rechtstreeks en normaliseren de UUID.
         Zo vermijden we een extra query naar profielen en dus ook
         mogelijke RLS/PostgREST-problemen op die fallback-query.
      --------------------------------------------------- */

      const gekoppeldeLeerlingen: GekoppeldeLeerling[] =
        actieveSmartschoolRijen.map((leerling) => {
          const profielId = normalizeId(leerling.profiel_id);

          if (profielId) {
            return {
              ...leerling,
              gekoppeld_profiel_id: profielId,
              koppeling: "smartschool_profiel_id",
            };
          }

          return {
            ...leerling,
            gekoppeld_profiel_id: null,
            koppeling: "niet_gekoppeld",
          };
        });

      setLeerlingen(gekoppeldeLeerlingen);

      /* ---------------------------------------------------
         9. VERVOERSKEUZES
      --------------------------------------------------- */

      const { data: vervoerData, error: vervoerError } =
        await supabase
          .from("sportdag_vervoer")
          .select(`
            leerling_id,
            leerjaar,
            heen,
            terug,
            updated_at
          `)
          .eq("schooljaar", SCHOOLJAAR_SPORTDAG)
          .range(0, 4999);


      if (vervoerError) {
        console.error(
          "Vervoerskeuzes laden mislukt:",
          vervoerError
        );

        setErrorMessage(
          "De vervoerskeuzes konden niet worden geladen."
        );

        return;
      }

      setVervoersKeuzes(
        (vervoerData ?? []) as VervoersKeuze[]
      );
    } catch (error) {
      console.error(
        "Sportdagenoverzicht laden mislukt:",
        error
      );

      setErrorMessage(
        "Er ging iets mis tijdens het laden van het sportdagenoverzicht."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     LEERLINGEN PER LEERJAAR
  ======================================================= */

  const leerlingenPerLeerjaar = useMemo(() => {
    const result: Record<number, GekoppeldeLeerling[]> = {
      3: [],
      5: [],
      6: [],
      7: [],
    };

    for (const leerling of leerlingen) {
      const leerjaar =
        getLeerjaarUitKlas(leerling.klas_naam);

      if (!leerjaar) continue;

      if (
        !LEERJAREN_MET_VERVOERSKEUZE.includes(leerjaar)
      ) {
        continue;
      }

      result[leerjaar].push(leerling);
    }

    for (const leerjaar of LEERJAREN_MET_VERVOERSKEUZE) {
      result[leerjaar].sort((a, b) =>
        getNaam(a).localeCompare(getNaam(b), "nl")
      );
    }

    return result;
  }, [leerlingen]);

  /* =======================================================
     VERVOER MAP

     Hierdoor moeten we niet telkens .find() uitvoeren.
  ======================================================= */

  const vervoerPerLeerling = useMemo(() => {
    const result = new Map<string, VervoersKeuze>();

    for (const keuze of vervoersKeuzes) {
      const leerlingId = normalizeId(keuze.leerling_id);

      if (!leerlingId) continue;

      result.set(leerlingId, keuze);
    }

    return result;
  }, [vervoersKeuzes]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <AppShell
        title="LO App"
        subtitle="Sportdagen"
        userName={profiel?.volledige_naam ?? null}
      >
        <style>{css}</style>

        <div className="loading-state">
          <div className="loading-icon">🏆</div>

          <strong>Sportdagen laden...</strong>

          <span>
            Smartschoolgegevens en vervoerskeuzes worden
            opgehaald.
          </span>
        </div>
      </AppShell>
    );
  }

  /* =======================================================
     GEEN TOEGANG
  ======================================================= */

  if (!allowed) {
    return (
      <AppShell
        title="LO App"
        subtitle="Geen toegang"
        userName={profiel?.volledige_naam ?? null}
      >
        <style>{css}</style>

        <section className="access-card">
          <div className="access-icon">🔒</div>

          <h1>Geen toegang</h1>

          <p>
            Deze pagina is alleen toegankelijk voor
            LO-leerkrachten en admins.
          </p>

          <Link
            href="/dashboard"
            className="back-button"
          >
            ← Terug naar dashboard
          </Link>
        </section>
      </AppShell>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Sportdagen"
      userName={profiel?.volledige_naam ?? null}
    >
      <style>{css}</style>

      <main className="page">
        {/* HERO */}

        <BaseHero
          label="EXTRAMURALE SPORTACTIVITEITEN"
          title={
            <>
              Beheer{" "}
              <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
                sportdagen
              </span>
            </>
          }
          description="Bekijk per leerjaar wie zijn vervoerskeuze al heeft ingevuld en wie nog ontbreekt."
          imageSrc="/lo/LO.png"
          imageAlt="Sportdagen"
          quoteTitle="Sportdagen"
          quote="Alle vervoerskeuzes overzichtelijk per leerjaar."
          quoteAuthor="LO team"
          actions={
            <div className="hero-actions">
              <Link
                href="/leerkrachten-lo/extramurale-sportactiviteiten"
                className="hero-button"
              >
                ← Terug
              </Link>

              <button
                type="button"
                className="hero-button"
                onClick={loadData}
              >
                ↻ Vernieuwen
              </button>
            </div>
          }
        />

        {/* BRONINFO */}

        <section className="source-bar">
          <div className="source-left">
            <span className="source-dot" />

            <div>
              <strong>
                Leerlingen uit Smartschool
              </strong>

              <span>
                {leerlingen.length} leerlingen geladen
                {smartschoolSchooljaar
                  ? ` • schooljaar ${smartschoolSchooljaar}`
                  : ""}
              </span>
            </div>
          </div>

          <div className="source-badges">
            {smartschoolSchooljaar &&
              smartschoolSchooljaar !==
                SCHOOLJAAR_SPORTDAG && (
                <div className="schoolyear-warning">
                  ⚠️ Smartschool bevat momenteel nog{" "}
                  {smartschoolSchooljaar}
                </div>
              )}
          </div>
        </section>

        {errorMessage && (
          <section className="error-card">
            ⚠️ {errorMessage}
          </section>
        )}

        {/* LEERJAREN */}

        <section className="year-grid">
          {LEERJAREN_MET_VERVOERSKEUZE.map(
            (leerjaar) => {
              const leerlingenVanLeerjaar =
                leerlingenPerLeerjaar[leerjaar] ?? [];

              /*
                INGevuld:

                leerling heeft gekoppeld profiel
                EN
                sportdag_vervoer bevat dat leerling_id
                EN
                keuze hoort bij dit leerjaar
              */

              const ingevuldeLeerlingen =
                leerlingenVanLeerjaar.filter(
                  (leerling) => {
                    const profielId = normalizeId(
                      leerling.gekoppeld_profiel_id
                    );

                    if (!profielId) {
                      return false;
                    }

                    const keuze =
                      vervoerPerLeerling.get(profielId);

                    if (!keuze) {
                      return false;
                    }

                    return (
                      Number(keuze.leerjaar) ===
                      Number(leerjaar)
                    );
                  }
                );

              /*
                Ontbrekend = iedereen die niet bij
                ingevuld zit.
              */

              const ingevuldeIds = new Set(
                ingevuldeLeerlingen
                  .map((leerling) =>
                    normalizeId(
                      leerling.gekoppeld_profiel_id
                    )
                  )
                  .filter(Boolean)
              );

              const ontbrekendeLeerlingen =
                leerlingenVanLeerjaar.filter(
                  (leerling) => {
                    const profielId = normalizeId(
                      leerling.gekoppeld_profiel_id
                    );

                    if (!profielId) {
                      return true;
                    }

                    return !ingevuldeIds.has(profielId);
                  }
                );

              /* ------------------------------------------------
                 VERVOERSTOTALEN
              ------------------------------------------------ */

              let fietsHeen = 0;
              let eigenHeen = 0;
              let fietsTerug = 0;
              let eigenTerug = 0;

              for (const leerling of ingevuldeLeerlingen) {
                const profielId = normalizeId(
                  leerling.gekoppeld_profiel_id
                );

                if (!profielId) continue;

                const keuze =
                  vervoerPerLeerling.get(profielId);

                if (!keuze) continue;

                if (keuze.heen === "fiets") {
                  fietsHeen += 1;
                }

                if (keuze.heen === "eigen_vervoer") {
                  eigenHeen += 1;
                }

                if (keuze.terug === "fiets") {
                  fietsTerug += 1;
                }

                if (
                  keuze.terug === "eigen_vervoer"
                ) {
                  eigenTerug += 1;
                }
              }

              const percentage =
                leerlingenVanLeerjaar.length > 0
                  ? Math.round(
                      (ingevuldeLeerlingen.length /
                        leerlingenVanLeerjaar.length) *
                        100
                    )
                  : 0;

              return (
                <article
                  key={leerjaar}
                  className="year-card"
                >
                  {/* HEADER */}

                  <div className="year-header">
                    <div>
                      <span className="year-label">
                        SPORTDAG
                      </span>

                      <h2>{leerjaar}e jaar</h2>
                    </div>

                    <div className="percentage">
                      {percentage}%
                    </div>
                  </div>

                  {/* STATS */}

                  <div className="stats-grid">
                    <StatCard
                      value={
                        leerlingenVanLeerjaar.length
                      }
                      label="Leerlingen"
                      icon="👥"
                    />

                    <StatCard
                      value={
                        ingevuldeLeerlingen.length
                      }
                      label="Ingevuld"
                      icon="✓"
                      variant="success"
                    />

                    <StatCard
                      value={
                        ontbrekendeLeerlingen.length
                      }
                      label="Ontbrekend"
                      icon="!"
                      variant={
                        ontbrekendeLeerlingen.length >
                        0
                          ? "warning"
                          : "success"
                      }
                    />
                  </div>

                  {/* PROGRESS */}

                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  {/* VERVOER */}

                  <div className="transport-title">
                    Vervoerskeuzes
                  </div>

                  <div className="transport-grid">
                    <TransportCounter
                      emoji="🚲"
                      value={fietsHeen}
                      label="Fiets heen"
                    />

                    <TransportCounter
                      emoji="🚗"
                      value={eigenHeen}
                      label="Eigen vervoer heen"
                    />

                    <TransportCounter
                      emoji="🚲"
                      value={fietsTerug}
                      label="Fiets terug"
                    />

                    <TransportCounter
                      emoji="🚗"
                      value={eigenTerug}
                      label="Eigen vervoer terug"
                    />
                  </div>

                  {/* GEEN LEERLINGEN */}

                  {leerlingenVanLeerjaar.length ===
                    0 && (
                    <div className="no-students">
                      <strong>
                        Geen leerlingen gevonden
                      </strong>

                      <span>
                        Voor het {leerjaar}e jaar werden
                        geen Smartschool-leerlingen
                        gevonden.
                      </span>
                    </div>
                  )}

                  {/* ONTBREKEND */}

                  {leerlingenVanLeerjaar.length > 0 &&
                    ontbrekendeLeerlingen.length >
                      0 && (
                      <div className="missing-card">
                        <div className="missing-header">
                          <div>
                            <span>⚠️</span>

                            <strong>
                              Nog niet ingevuld
                            </strong>
                          </div>

                          <span className="missing-badge">
                            {
                              ontbrekendeLeerlingen.length
                            }
                          </span>
                        </div>

                        <div className="student-list">
                          {ontbrekendeLeerlingen.map(
                            (leerling) => (
                              <div
                                key={
                                  leerling.email ??
                                  leerling.username ??
                                  getNaam(leerling)
                                }
                                className="student-row"
                              >
                                <div className="student-avatar">
                                  {getNaam(leerling)
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="student-main">
                                  <strong>
                                    {getNaam(leerling)}
                                  </strong>

                                  <span>
                                    {leerling.klas_naam ??
                                      "Geen klas"}
                                  </span>
                                </div>

                                {!leerling.gekoppeld_profiel_id && (
                                  <span className="profile-badge">
                                    Nog niet ingelogd
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        <div className="reminder-info">
                          🔔 Vanaf 8 september krijgen
                          leerlingen die nog niets hebben
                          ingevuld automatisch een reminder
                          in de app.
                        </div>
                      </div>
                    )}

                  {/* ALLES INGEVULD */}

                  {leerlingenVanLeerjaar.length > 0 &&
                    ontbrekendeLeerlingen.length ===
                      0 && (
                      <div className="complete-card">
                        <span className="complete-icon">
                          ✓
                        </span>

                        <div>
                          <strong>
                            Alle leerlingen hebben hun
                            vervoerskeuze ingevuld.
                          </strong>

                          <span>
                            {
                              leerlingenVanLeerjaar.length
                            }{" "}
                            van{" "}
                            {
                              leerlingenVanLeerjaar.length
                            }{" "}
                            leerlingen zijn in orde.
                          </span>
                        </div>
                      </div>
                    )}

                  {/* INGEVULDE KEUZES */}

                  {ingevuldeLeerlingen.length > 0 && (
                    <details className="filled-details">
                      <summary>
                        <span>
                          ✓ Bekijk ingevulde keuzes
                        </span>

                        <span className="summary-count">
                          {
                            ingevuldeLeerlingen.length
                          }
                        </span>
                      </summary>

                      <div className="filled-list">
                        {ingevuldeLeerlingen.map(
                          (leerling) => {
                            const profielId = normalizeId(
                              leerling.gekoppeld_profiel_id
                            );

                            if (!profielId) {
                              return null;
                            }

                            const keuze =
                              vervoerPerLeerling.get(
                                profielId
                              );

                            if (!keuze) {
                              return null;
                            }

                            return (
                              <div
                                key={
                                  profielId ??
                                  leerling.email ??
                                  ""
                                }
                                className="filled-row"
                              >
                                <div className="filled-header">
                                  <div className="filled-student">
                                    <strong>
                                      {getNaam(leerling)}
                                    </strong>

                                    <span>
                                      {leerling.klas_naam ??
                                        "Geen klas"}
                                    </span>
                                  </div>
                                </div>

                                <div className="filled-choices">
                                  <div className="choice-pill">
                                    <span>
                                      {keuze.heen ===
                                      "fiets"
                                        ? "🚲"
                                        : "🚗"}
                                    </span>

                                    <div>
                                      <small>
                                        HEEN
                                      </small>

                                      <strong>
                                        {formatTransport(
                                          keuze.heen
                                        )}
                                      </strong>
                                    </div>
                                  </div>

                                  <div className="choice-pill">
                                    <span>
                                      {keuze.terug ===
                                      "fiets"
                                        ? "🚲"
                                        : "🚗"}
                                    </span>

                                    <div>
                                      <small>
                                        TERUG
                                      </small>

                                      <strong>
                                        {formatTransport(
                                          keuze.terug
                                        )}
                                      </strong>
                                    </div>
                                  </div>
                                </div>

                                <span className="updated">
                                  Laatst opgeslagen:{" "}
                                  {formatDate(
                                    keuze.updated_at
                                  )}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </details>
                  )}
                </article>
              );
            }
          )}
        </section>
      </main>
    </AppShell>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  value,
  label,
  icon,
  variant = "default",
}: {
  value: number;
  label: string;
  icon: string;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-top">
        <span className="stat-icon">
          {icon}
        </span>

        <strong>{value}</strong>
      </div>

      <span className="stat-label">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   TRANSPORT COUNTER
========================================================= */

function TransportCounter({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <div className="transport-counter">
      <span className="transport-icon">
        {emoji}
      </span>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
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

  .page {
    width: 100%;
    max-width: 1250px;
    margin: 0 auto;
    padding-bottom: 50px;
    color: ${ui.text};
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-button {
    min-height: 44px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    border: 1px solid rgba(148,163,184,0.20);
    background: rgba(0,0,0,0.35);
    color: ${ui.text};
    font-size: 13px;
    font-weight: 950;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  .hero-button:hover {
    transform: translateY(-1px);
    border-color: rgba(203,213,225,0.30);
    background: rgba(0,0,0,0.45);
  }

  /* LOADING */

  .loading-state {
    min-height: 55vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: ${ui.text};
  }

  .loading-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 14px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    border: 1px solid ${ui.border};
    background: ${ui.glass};
    font-size: 29px;
  }

  .loading-state strong {
    font-size: 15px;
  }

  .loading-state span {
    margin-top: 5px;
    color: ${ui.muted};
    font-size: 12px;
  }

  /* ACCESS */

  .access-card {
    max-width: 650px;
    margin: 30px auto;
    padding: 28px;
    border-radius: 26px;
    border: 1px solid ${ui.border};
    background: ${ui.glass};
    color: ${ui.text};
  }

  .access-icon {
    width: 55px;
    height: 55px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: rgba(255,255,255,0.05);
    border: 1px solid ${ui.border};
    font-size: 25px;
  }

  .access-card h1 {
    margin: 14px 0 0;
    font-size: 25px;
  }

  .access-card p {
    color: ${ui.muted};
    line-height: 1.6;
  }

  .back-button {
    color: ${ui.text};
    font-weight: 900;
    text-decoration: none;
  }

  /* SOURCE */

  .source-bar {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(137,194,170,0.16);
    background: rgba(137,194,170,0.055);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .source-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .source-dot {
    width: 9px;
    height: 9px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #86efac;
    box-shadow: 0 0 0 5px rgba(134,239,172,0.08);
  }

  .source-left strong,
  .source-left span {
    display: block;
  }

  .source-left strong {
    font-size: 12px;
  }

  .source-left span {
    margin-top: 2px;
    color: ${ui.muted};
    font-size: 10px;
  }

  .source-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .schoolyear-warning {
    padding: 7px 10px;
    border-radius: 10px;
    border: 1px solid rgba(251,191,36,0.16);
    background: rgba(251,191,36,0.06);
    color: #fde68a;
    font-size: 10px;
    font-weight: 800;
  }

  .error-card {
    margin-top: 12px;
    padding: 13px;
    border-radius: 15px;
    border: 1px solid rgba(248,113,113,0.20);
    background: rgba(248,113,113,0.07);
    color: #fecaca;
    font-size: 12px;
  }

  /* YEARS */

  .year-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 16px;
    align-items: start;
  }

  .year-card {
    min-width: 0;
    padding: 20px;
    overflow: hidden;
    border-radius: 25px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(
        500px 220px at 100% 0%,
        rgba(75,142,141,0.09),
        transparent 72%
      ),
      ${ui.glass};
    box-shadow: 0 16px 42px rgba(0,0,0,0.16);
  }

  .year-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .year-label {
    color: rgba(137,194,170,0.88);
    font-size: 10px;
    font-weight: 1000;
    letter-spacing: 1.3px;
  }

  .year-header h2 {
    margin: 3px 0 0;
    font-size: 26px;
    line-height: 1.1;
  }

  .percentage {
    width: 55px;
    height: 55px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 17px;
    border: 1px solid rgba(137,194,170,0.18);
    background: rgba(137,194,170,0.07);
    font-size: 14px;
    font-weight: 1000;
  }

  /* STATS */

  .stats-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 8px;
  }

  .stat-card {
    min-width: 0;
    padding: 12px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.075);
    background: rgba(255,255,255,0.035);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .stat-top strong {
    font-size: 23px;
    line-height: 1;
  }

  .stat-icon {
    color: rgba(234,240,255,0.56);
    font-size: 12px;
    font-weight: 1000;
  }

  .stat-label {
    display: block;
    margin-top: 6px;
    color: ${ui.muted};
    font-size: 10px;
  }

  .stat-card.success .stat-top strong,
  .stat-card.success .stat-icon {
    color: #86efac;
  }

  .stat-card.warning .stat-top strong,
  .stat-card.warning .stat-icon {
    color: #fcd34d;
  }

  /* PROGRESS */

  .progress-track {
    height: 7px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,0.055);
  }

  .progress-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      #4B8E8D,
      #89C2AA
    );
    transition: width 300ms ease;
  }

  /* TRANSPORT */

  .transport-title {
    margin-top: 18px;
    color: ${ui.muted};
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .transport-grid {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 8px;
  }

  .transport-counter {
    min-width: 0;
    padding: 11px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.065);
    background: rgba(255,255,255,0.03);
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .transport-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    display: grid;
    place-items: center;
    font-size: 17px;
  }

  .transport-counter strong,
  .transport-counter span {
    display: block;
  }

  .transport-counter strong {
    font-size: 16px;
  }

  .transport-counter div > span {
    margin-top: 1px;
    color: ${ui.muted};
    font-size: 9px;
  }

  /* MISSING */

  .missing-card {
    margin-top: 15px;
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(251,191,36,0.17);
    background: rgba(251,191,36,0.05);
  }

  .missing-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .missing-header > div {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .missing-header strong {
    color: #fde68a;
    font-size: 12px;
  }

  .missing-badge {
    min-width: 28px;
    height: 28px;
    padding: 0 7px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    background: rgba(251,191,36,0.09);
    color: #fde68a;
    font-size: 11px;
    font-weight: 950;
  }

  .student-list {
    margin-top: 8px;
    max-height: 300px;
    overflow-y: auto;
  }

  .student-row {
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.055);
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .student-row:last-child {
    border-bottom: 0;
  }

  .student-avatar {
    width: 31px;
    height: 31px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-size: 11px;
    font-weight: 1000;
  }

  .student-main {
    min-width: 0;
    flex: 1;
  }

  .student-main strong,
  .student-main span {
    display: block;
  }

  .student-main strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  }

  .student-main span {
    margin-top: 2px;
    color: ${ui.muted};
    font-size: 9px;
  }

  .profile-badge,
  .linked-badge {
    flex: 0 0 auto;
    padding: 5px 7px;
    border-radius: 8px;
    font-size: 8px;
    font-weight: 800;
  }

  .profile-badge {
    background: rgba(255,255,255,0.04);
    color: ${ui.muted};
  }

  .linked-badge {
    border: 1px solid rgba(137,194,170,0.15);
    background: rgba(137,194,170,0.07);
    color: #a7d9c3;
  }

  .reminder-info {
    margin-top: 9px;
    padding: 9px;
    border-radius: 11px;
    background: rgba(0,0,0,0.11);
    color: rgba(253,230,138,0.78);
    font-size: 9px;
    line-height: 1.5;
  }

  /* COMPLETE */

  .complete-card {
    margin-top: 15px;
    padding: 13px;
    border-radius: 15px;
    border: 1px solid rgba(34,197,94,0.18);
    background: rgba(34,197,94,0.065);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .complete-icon {
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(34,197,94,0.09);
    color: #86efac;
    font-weight: 1000;
  }

  .complete-card strong,
  .complete-card span {
    display: block;
  }

  .complete-card strong {
    color: #86efac;
    font-size: 11px;
  }

  .complete-card div > span {
    margin-top: 2px;
    color: rgba(134,239,172,0.65);
    font-size: 9px;
  }

  /* NO STUDENTS */

  .no-students {
    margin-top: 15px;
    padding: 13px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
  }

  .no-students strong,
  .no-students span {
    display: block;
  }

  .no-students strong {
    font-size: 11px;
  }

  .no-students span {
    margin-top: 3px;
    color: ${ui.muted};
    font-size: 9px;
  }

  /* FILLED */

  .filled-details {
    margin-top: 13px;
    border-top: 1px solid rgba(255,255,255,0.065);
    padding-top: 12px;
  }

  .filled-details summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: ${ui.muted};
    font-size: 10px;
    font-weight: 900;
  }

  .filled-details summary::-webkit-details-marker {
    display: none;
  }

  .summary-count {
    min-width: 25px;
    height: 25px;
    padding: 0 6px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: rgba(137,194,170,0.07);
    color: #a7d9c3;
  }

  .filled-list {
    margin-top: 10px;
  }

  .filled-row {
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.055);
  }

  .filled-row:last-child {
    border-bottom: 0;
  }

  .filled-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .filled-student {
    min-width: 0;
  }

  .filled-student strong,
  .filled-student span {
    display: block;
  }

  .filled-student strong {
    font-size: 11px;
  }

  .filled-student span {
    margin-top: 2px;
    color: ${ui.muted};
    font-size: 9px;
  }

  .filled-choices {
    margin-top: 7px;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 6px;
  }

  .choice-pill {
    padding: 8px;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .choice-pill > span {
    font-size: 17px;
  }

  .choice-pill small,
  .choice-pill strong {
    display: block;
  }

  .choice-pill small {
    color: ${ui.muted};
    font-size: 7px;
    font-weight: 900;
  }

  .choice-pill strong {
    margin-top: 1px;
    font-size: 9px;
  }

  .updated {
    display: block;
    margin-top: 6px;
    color: rgba(234,240,255,0.40);
    font-size: 8px;
  }

  /* RESPONSIVE */

  @media(max-width: 900px) {
    .year-grid {
      grid-template-columns: 1fr;
    }
  }

  @media(max-width: 640px) {
    .source-bar {
      align-items: flex-start;
      flex-direction: column;
    }

    .source-badges {
      width: 100%;
      justify-content: flex-start;
    }

    .schoolyear-warning {
      width: 100%;
    }

    .year-card {
      padding: 16px;
      border-radius: 21px;
    }

    .year-header h2 {
      font-size: 23px;
    }

    .stats-grid {
      gap: 6px;
    }

    .stat-card {
      padding: 10px 8px;
    }

    .stat-top strong {
      font-size: 20px;
    }

    .transport-grid {
      grid-template-columns: 1fr 1fr;
    }

    .profile-badge,
    .linked-badge {
      display: none;
    }
  }
`;