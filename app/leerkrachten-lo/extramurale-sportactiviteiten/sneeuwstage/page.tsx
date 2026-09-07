"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

/* ============================================================
   TYPES
============================================================ */

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

type Stage = {
  id: string;
  naam: string;
  schooljaar: string;
  vertrekdatum: string | null;
  terugkomstdatum: string | null;
  bestemming: string | null;
  verblijf: string | null;
  totaalprijs: number | null;
  snowboard_toeslag: number | null;
  keuzes_open: boolean;
};

type DeelnemerRow = {
  id: string;
  leerling_id: string | null;
  email: string | null;
  actief: boolean;
};

type KeuzeRow = {
  id: string;
  leerling_id: string;
  discipline: "ski" | "snowboard";
  ski_ervaring: string | null;
  snowboard_ervaring: string | null;
  eigen_snowboardmateriaal_meenemen: boolean | null;
  bijgewerkt_op: string | null;
};

type LeerlingInfo = {
  email: string;
  naam: string;
  klas: string;
};

type OverzichtRow = {
  email: string;
  naam: string;
  klas: string;
  leerlingId: string | null;
  keuze: KeuzeRow | null;
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeRole(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isLoRole(rol: unknown) {
  const value = normalizeRole(rol);
  return value === "lo_leerkracht" || value === "admin";
}

function readableSupabaseError(error: any, context: string) {
  return [
    context,
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `code: ${error.code}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function ervaringLabel(value: string | null) {
  switch (value) {
    case "0_weken":
      return "0 weken";

    case "1_2_weken":
      return "1–2 weken";

    case "3_4_weken":
      return "3–4 weken";

    case "5_plus_weken":
      return "5+ weken";

    default:
      return "—";
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function SneeuwstageLeerkrachtPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);

  const [deelnemers, setDeelnemers] = useState<DeelnemerRow[]>([]);
  const [keuzes, setKeuzes] = useState<KeuzeRow[]>([]);
  const [leerlingenInfo, setLeerlingenInfo] = useState<
    Map<string, LeerlingInfo>
  >(new Map());

  const [filter, setFilter] = useState<
    "alle" | "ski" | "snowboard" | "ontbrekend"
  >("alle");

  const [zoekterm, setZoekterm] = useState("");
  const [klasFilter, setKlasFilter] = useState("Alle");

  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     LOAD
  ============================================================ */

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      /* --------------------------------------------------------
         USER
      -------------------------------------------------------- */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          readableSupabaseError(
            userError,
            "Kon gebruiker niet laden."
          )
        );
      }

      if (!user) {
        setAllowed(false);
        return;
      }

      /* --------------------------------------------------------
         PROFIEL
      -------------------------------------------------------- */

      const { data: profielData, error: profielError } =
        await supabase
          .from("profielen")
          .select("id, volledige_naam, rol")
          .eq("id", user.id)
          .maybeSingle();

      if (profielError) {
        throw new Error(
          readableSupabaseError(
            profielError,
            "Kon profiel niet laden."
          )
        );
      }

      const profielValue =
        (profielData ?? null) as Profiel | null;

      setProfiel(profielValue);

      if (!profielValue || !isLoRole(profielValue.rol)) {
        setAllowed(false);
        return;
      }

      setAllowed(true);

      /* --------------------------------------------------------
         STAGE
      -------------------------------------------------------- */

      const { data: stageData, error: stageError } =
        await supabase
          .from("sneeuwstages")
          .select(
            `
              id,
              naam,
              schooljaar,
              vertrekdatum,
              terugkomstdatum,
              bestemming,
              verblijf,
              totaalprijs,
              snowboard_toeslag,
              keuzes_open
            `
          )
          .eq("slug", "sneeuwstage-2026")
          .maybeSingle();

      if (stageError) {
        throw new Error(
          readableSupabaseError(
            stageError,
            "Kon sneeuwstage niet laden."
          )
        );
      }

      if (!stageData) {
        throw new Error(
          "De sneeuwstage 2026 werd niet gevonden."
        );
      }

      const stageValue = stageData as Stage;
      setStage(stageValue);

      /* --------------------------------------------------------
         DEELNEMERS
      -------------------------------------------------------- */

      const { data: deelnemerData, error: deelnemerError } =
        await supabase
          .from("sneeuwstage_deelnemers")
          .select("id, leerling_id, email, actief")
          .eq("sneeuwstage_id", stageValue.id)
          .eq("actief", true);

      if (deelnemerError) {
        throw new Error(
          readableSupabaseError(
            deelnemerError,
            "Kon deelnemers niet laden."
          )
        );
      }

      const deelnemersValue =
        (deelnemerData ?? []) as DeelnemerRow[];

      setDeelnemers(deelnemersValue);

      /* --------------------------------------------------------
         KEUZES
      -------------------------------------------------------- */

      const { data: keuzesData, error: keuzesError } =
        await supabase
          .from("sneeuwstage_keuzes")
          .select(
            `
              id,
              leerling_id,
              discipline,
              ski_ervaring,
              snowboard_ervaring,
              eigen_snowboardmateriaal_meenemen,
              bijgewerkt_op
            `
          )
          .eq("sneeuwstage_id", stageValue.id);

      if (keuzesError) {
        throw new Error(
          readableSupabaseError(
            keuzesError,
            "Kon keuzes niet laden."
          )
        );
      }

      setKeuzes((keuzesData ?? []) as KeuzeRow[]);

      /* --------------------------------------------------------
         LEERLINGINFO
      -------------------------------------------------------- */

      const { data: leerlingData, error: leerlingError } =
        await supabase
          .from("eurofit_class_students_view")
          .select("*")
          .eq("schooljaar", stageValue.schooljaar);

      if (leerlingError) {
        throw new Error(
          readableSupabaseError(
            leerlingError,
            "Kon leerlinggegevens niet laden."
          )
        );
      }

      const map = new Map<string, LeerlingInfo>();

      for (const row of leerlingData ?? []) {
        const email = normalizeEmail(row.email);
        const klas = normalizeText(
          row.klas_naam ?? row.class_name ?? row.klas
        );

        if (!email || !/^[0-9]/.test(klas)) continue;

        const naam =
          normalizeText(row.volledige_naam) ||
          [
            normalizeText(row.given_name),
            normalizeText(row.family_name),
          ]
            .filter(Boolean)
            .join(" ");

        if (!map.has(email)) {
          map.set(email, {
            email,
            naam: naam || email,
            klas,
          });
        }
      }

      setLeerlingenInfo(map);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Kon de pagina niet laden."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     OVERZICHT
  ============================================================ */

  const overzicht = useMemo<OverzichtRow[]>(() => {
    const keuzeMap = new Map<string, KeuzeRow>();

    keuzes.forEach((keuze) => {
      keuzeMap.set(keuze.leerling_id, keuze);
    });

    return deelnemers
      .map((deelnemer) => {
        const email = normalizeEmail(deelnemer.email);

        const info = leerlingenInfo.get(email);

        const keuze = deelnemer.leerling_id
          ? keuzeMap.get(deelnemer.leerling_id) ?? null
          : null;

        return {
          email,
          naam: info?.naam ?? email,
          klas: info?.klas ?? "Onbekend",
          leerlingId: deelnemer.leerling_id,
          keuze,
        };
      })
      .sort((a, b) => {
        const klasCompare = a.klas.localeCompare(
          b.klas,
          "nl-BE",
          { numeric: true }
        );

        if (klasCompare !== 0) return klasCompare;

        return a.naam.localeCompare(
          b.naam,
          "nl-BE"
        );
      });
  }, [deelnemers, keuzes, leerlingenInfo]);

  /* ============================================================
     STATISTIEKEN
  ============================================================ */

  const aantalDeelnemers = overzicht.length;

  const aantalIngevuld = overzicht.filter(
    (row) => row.keuze
  ).length;

  const aantalOntbrekend =
    aantalDeelnemers - aantalIngevuld;

  const aantalSki = overzicht.filter(
    (row) => row.keuze?.discipline === "ski"
  ).length;

  const aantalSnowboard = overzicht.filter(
    (row) =>
      row.keuze?.discipline === "snowboard"
  ).length;

  const snowboardHuur = overzicht.filter(
    (row) =>
      row.keuze?.discipline === "snowboard" &&
      row.keuze
        .eigen_snowboardmateriaal_meenemen === false
  ).length;

  /* ============================================================
     SKI GROEPEN
  ============================================================ */

  const skiGroepen = useMemo(() => {
    const result = {
      "0_weken": 0,
      "1_2_weken": 0,
      "3_4_weken": 0,
      "5_plus_weken": 0,
    };

    overzicht.forEach((row) => {
      if (
        row.keuze?.discipline === "ski" &&
        row.keuze.ski_ervaring &&
        row.keuze.ski_ervaring in result
      ) {
        result[
          row.keuze.ski_ervaring as keyof typeof result
        ] += 1;
      }
    });

    return result;
  }, [overzicht]);

  /* ============================================================
     KLASSEN
  ============================================================ */

  const klassen = useMemo(() => {
    return Array.from(
      new Set(
        overzicht
          .map((row) => row.klas)
          .filter((klas) => klas !== "Onbekend")
      )
    ).sort((a, b) =>
      a.localeCompare(b, "nl-BE", {
        numeric: true,
      })
    );
  }, [overzicht]);

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredRows = useMemo(() => {
    const q = zoekterm.trim().toLowerCase();

    return overzicht.filter((row) => {
      if (
        klasFilter !== "Alle" &&
        row.klas !== klasFilter
      ) {
        return false;
      }

      if (
        filter === "ski" &&
        row.keuze?.discipline !== "ski"
      ) {
        return false;
      }

      if (
        filter === "snowboard" &&
        row.keuze?.discipline !== "snowboard"
      ) {
        return false;
      }

      if (
        filter === "ontbrekend" &&
        row.keuze !== null
      ) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        row.naam,
        row.email,
        row.klas,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    overzicht,
    filter,
    zoekterm,
    klasFilter,
  ]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <AppShell
        title="LO App"
        subtitle="Sneeuwstage"
      >
        <style>{css}</style>

        <div className="snow-loading">
          <div className="snow-spinner" />

          <div>
            <strong>Sneeuwstage laden…</strong>

            <p>
              Deelnemers en keuzes worden
              opgehaald.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ============================================================
     ACCESS
  ============================================================ */

  if (!allowed) {
    return (
      <AppShell
        title="LO App"
        subtitle="Geen toegang"
        userName={
          profiel?.volledige_naam ?? null
        }
      >
        <style>{css}</style>

        <section className="snow-panel">
          <h2>Geen toegang</h2>

          <p>
            Deze pagina is alleen toegankelijk
            voor LO-leerkrachten en
            administrators.
          </p>

          <Link
            href="/leerkrachten-lo"
            className="snow-link"
          >
            ← Terug naar leerkrachten LO
          </Link>
        </section>
      </AppShell>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <AppShell
      title="LO App"
      subtitle="Sneeuwstage"
      userName={
        profiel?.volledige_naam ?? null
      }
    >
      <BaseHero
        label="Extramurale sportactiviteiten"
        title={
          <>
            Sneeuwstage{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              2026
            </span>
          </>
        }
        description="Beheer de deelnemers en volg hier de ski- en snowboardkeuzes van de leerlingen op."
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="Sneeuwstage 2026"
        quoteTitle="Ahrntal · Oostenrijk"
        quote="Van 18 tot 24 december 2026 verblijven we in Pension Rotbach en skiën we in Speikboden en Klausberg."
        quoteAuthor="GO! Atheneum Avelgem"
        actions={
          <div className="snow-hero-actions">
            <Link
              href="/leerkrachten-lo/extramurale-sportactiviteiten/sneeuwstage/deelnemers"
              className="snow-hero-button"
            >
              Deelnemers beheren
            </Link>

            <Link
              href="/extramurale-sportactiviteiten/sneeuwstage"
              className="snow-hero-button"
            >
              Leerlingenpagina bekijken
            </Link>
          </div>
        }
      />

      <style>{css}</style>

      {error ? (
        <div className="snow-message snow-error">
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      {/* ====================================================
          REISINFO
      ==================================================== */}

      <section className="snow-info-grid">
        <div className="snow-info-card">
          <span>Vertrek</span>
          <strong>
            {formatDate(stage?.vertrekdatum ?? null)}
          </strong>
        </div>

        <div className="snow-info-card">
          <span>Terug</span>
          <strong>
            {formatDate(stage?.terugkomstdatum ?? null)}
          </strong>
        </div>

        <div className="snow-info-card">
          <span>Bestemming</span>
          <strong>
            {stage?.bestemming ?? "Ahrntal"}
          </strong>
        </div>

        <div className="snow-info-card">
          <span>Verblijf</span>
          <strong>
            {stage?.verblijf ?? "Pension Rotbach"}
          </strong>
        </div>
      </section>

      {/* ====================================================
          HOOFDSTATISTIEKEN
      ==================================================== */}

      <section className="snow-stat-grid">
        <div className="snow-stat-card">
          <span>Deelnemers</span>
          <strong>{aantalDeelnemers}</strong>
          <small>actieve leerlingen</small>
        </div>

        <div className="snow-stat-card">
          <span>Keuze ingevuld</span>
          <strong>{aantalIngevuld}</strong>
          <small>
            van {aantalDeelnemers}
          </small>
        </div>

        <div
          className={`snow-stat-card ${
            aantalOntbrekend > 0
              ? "snow-warning"
              : "snow-good"
          }`}
        >
          <span>Ontbrekend</span>
          <strong>{aantalOntbrekend}</strong>
          <small>
            nog geen keuze
          </small>
        </div>

        <div className="snow-stat-card">
          <span>Ski</span>
          <strong>{aantalSki}</strong>
          <small>leerlingen</small>
        </div>

        <div className="snow-stat-card">
          <span>Snowboard</span>
          <strong>{aantalSnowboard}</strong>
          <small>leerlingen</small>
        </div>

        <div className="snow-stat-card">
          <span>Snowboard huren</span>
          <strong>{snowboardHuur}</strong>
          <small>
            €{stage?.snowboard_toeslag ?? 30} toeslag
          </small>
        </div>
      </section>

      {/* ====================================================
          SKI GROEPEN
      ==================================================== */}

      <section className="snow-panel">
        <div className="snow-section-header">
          <div>
            <h2>Voorlopige skigroepen</h2>

            <p>
              Verdeling volgens opgegeven
              ski-ervaring.
            </p>
          </div>
        </div>

        <div className="snow-level-grid">
          <div className="snow-level">
            <span>Beginner</span>
            <strong>
              {skiGroepen["0_weken"]}
            </strong>
            <small>0 weken</small>
          </div>

          <div className="snow-level">
            <span>Basis</span>
            <strong>
              {skiGroepen["1_2_weken"]}
            </strong>
            <small>1–2 weken</small>
          </div>

          <div className="snow-level">
            <span>Gevorderd</span>
            <strong>
              {skiGroepen["3_4_weken"]}
            </strong>
            <small>3–4 weken</small>
          </div>

          <div className="snow-level">
            <span>Ervaren</span>
            <strong>
              {skiGroepen["5_plus_weken"]}
            </strong>
            <small>5+ weken</small>
          </div>

          <div className="snow-level snowboard-level">
            <span>Snowboard</span>
            <strong>{aantalSnowboard}</strong>
            <small>minimaal 5 weken ervaring</small>
          </div>
        </div>
      </section>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <section className="snow-panel">
        <div className="snow-section-header">
          <div>
            <h2>Keuzes leerlingen</h2>

            <p>
              {filteredRows.length} leerlingen
              zichtbaar.
            </p>
          </div>
        </div>

        <div className="snow-filters">
          <div className="snow-filter-buttons">
            <button
              type="button"
              onClick={() => setFilter("alle")}
              className={
                filter === "alle"
                  ? "snow-filter active"
                  : "snow-filter"
              }
            >
              Alle
              <span>{aantalDeelnemers}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("ski")}
              className={
                filter === "ski"
                  ? "snow-filter active"
                  : "snow-filter"
              }
            >
              Ski
              <span>{aantalSki}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("snowboard")
              }
              className={
                filter === "snowboard"
                  ? "snow-filter active"
                  : "snow-filter"
              }
            >
              Snowboard
              <span>{aantalSnowboard}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("ontbrekend")
              }
              className={
                filter === "ontbrekend"
                  ? "snow-filter active"
                  : "snow-filter"
              }
            >
              Niet ingevuld
              <span>{aantalOntbrekend}</span>
            </button>
          </div>

          <div className="snow-search-grid">
            <input
              value={zoekterm}
              onChange={(e) =>
                setZoekterm(e.target.value)
              }
              placeholder="Zoek leerling…"
              className="snow-input"
            />

            <select
              value={klasFilter}
              onChange={(e) =>
                setKlasFilter(e.target.value)
              }
              className="snow-input"
            >
              <option value="Alle">
                Alle klassen
              </option>

              {klassen.map((klas) => (
                <option
                  key={klas}
                  value={klas}
                >
                  {klas}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="snow-table-wrap">
          <table className="snow-table">
            <thead>
              <tr>
                <th>Leerling</th>
                <th>Klas</th>
                <th>Keuze</th>
                <th>Ervaring</th>
                <th>Eigen snowboardmateriaal</th>
                <th>Toeslag</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => {
                const keuze = row.keuze;

                const isSnowboard =
                  keuze?.discipline === "snowboard";

                const ervaring = isSnowboard
                  ? ervaringLabel(
                      keuze?.snowboard_ervaring ??
                        null
                    )
                  : ervaringLabel(
                      keuze?.ski_ervaring ?? null
                    );

                const eigenMateriaal =
                  isSnowboard
                    ? keuze
                        ?.eigen_snowboardmateriaal_meenemen ===
                      true
                      ? "Ja"
                      : keuze
                          ?.eigen_snowboardmateriaal_meenemen ===
                        false
                      ? "Nee"
                      : "—"
                    : "n.v.t.";

                const toeslag =
                  isSnowboard &&
                  keuze
                    ?.eigen_snowboardmateriaal_meenemen ===
                    false
                    ? `€${
                        stage?.snowboard_toeslag ??
                        30
                      }`
                    : "—";

                return (
                  <tr key={row.email}>
                    <td>
                      <div className="student-name">
                        {row.naam}
                      </div>

                      <div className="student-email">
                        {row.email}
                      </div>
                    </td>

                    <td>
                      <span className="class-badge">
                        {row.klas}
                      </span>
                    </td>

                    <td>
                      {!keuze ? (
                        <span className="status missing">
                          Niet ingevuld
                        </span>
                      ) : keuze.discipline ===
                        "ski" ? (
                        <span className="status ski">
                          Ski
                        </span>
                      ) : (
                        <span className="status snowboard">
                          Snowboard
                        </span>
                      )}
                    </td>

                    <td>{ervaring}</td>

                    <td>{eigenMateriaal}</td>

                    <td>
                      {toeslag !== "—" ? (
                        <strong className="surcharge">
                          {toeslag}
                        </strong>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 ? (
            <div className="snow-empty">
              Geen leerlingen gevonden met
              deze filters.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

/* ============================================================
   CSS
============================================================ */

const css = `
  .snow-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .snow-hero-button {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(0,0,0,0.30);
    color: rgba(234,240,255,0.94);
    text-decoration: none;
    font-size: 13px;
    font-weight: 900;
  }

  .snow-message {
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 18px;
  }

  .snow-error {
    border: 1px solid rgba(248,113,113,0.28);
    background: rgba(127,29,29,0.20);
    color: #fecaca;
  }

  .snow-info-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 10px;
  }

  .snow-info-card,
  .snow-stat-card {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.11);
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.065),
      rgba(255,255,255,0.035)
    );
  }

  .snow-info-card span,
  .snow-stat-card span {
    display: block;
    color: rgba(234,240,255,0.58);
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .snow-info-card strong {
    display: block;
    margin-top: 6px;
    color: rgba(245,248,255,0.96);
    font-size: 15px;
  }

  .snow-stat-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(6, minmax(0,1fr));
    gap: 10px;
  }

  .snow-stat-card strong {
    display: block;
    margin: 5px 0;
    color: rgba(245,248,255,0.97);
    font-size: 28px;
    line-height: 1;
  }

  .snow-stat-card small {
    color: rgba(234,240,255,0.48);
    font-size: 11px;
  }

  .snow-warning {
    border-color: rgba(251,191,36,0.23);
    background: rgba(251,191,36,0.06);
  }

  .snow-good {
    border-color: rgba(74,222,128,0.20);
  }

  .snow-panel {
    margin-top: 14px;
    padding: 18px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.11);
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.065),
      rgba(255,255,255,0.04)
    );
    color: rgba(234,240,255,0.92);
  }

  .snow-panel h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 950;
  }

  .snow-panel p {
    margin: 5px 0 0;
    color: rgba(234,240,255,0.58);
    font-size: 12px;
  }

  .snow-section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .snow-level-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0,1fr));
    gap: 9px;
  }

  .snow-level {
    padding: 13px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(0,0,0,0.18);
  }

  .snow-level span {
    display: block;
    color: rgba(234,240,255,0.61);
    font-size: 11px;
    font-weight: 850;
  }

  .snow-level strong {
    display: block;
    margin: 4px 0;
    font-size: 23px;
  }

  .snow-level small {
    color: rgba(234,240,255,0.45);
  }

  .snowboard-level {
    border-color: rgba(75,142,141,0.30);
    background: rgba(75,142,141,0.08);
  }

  .snow-filters {
    margin-top: 15px;
  }

  .snow-filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .snow-filter {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border-radius: 13px;
    border: 1px solid rgba(255,255,255,0.11);
    background: rgba(0,0,0,0.22);
    color: rgba(234,240,255,0.72);
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .snow-filter span {
    min-width: 22px;
    padding: 3px 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    font-size: 10px;
  }

  .snow-filter.active {
    border-color: rgba(137,194,170,0.42);
    background: rgba(137,194,170,0.12);
    color: rgba(245,248,255,0.97);
  }

  .snow-search-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: minmax(0,1fr) 250px;
    gap: 10px;
  }

  .snow-input {
    width: 100%;
    height: 44px;
    padding: 0 13px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.11);
    background: rgba(0,0,0,0.27);
    color: rgba(234,240,255,0.94);
    outline: none;
    font-size: 13px;
  }

  .snow-input:focus {
    border-color: rgba(137,194,170,0.50);
  }

  .snow-table-wrap {
    margin-top: 14px;
    overflow-x: auto;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .snow-table {
    width: 100%;
    min-width: 900px;
    border-collapse: collapse;
  }

  .snow-table th {
    padding: 11px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.09);
    background: rgba(0,0,0,0.24);
    color: rgba(234,240,255,0.54);
    font-size: 10px;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .snow-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.055);
    color: rgba(234,240,255,0.82);
    font-size: 12px;
  }

  .snow-table tbody tr:last-child td {
    border-bottom: none;
  }

  .snow-table tbody tr:hover {
    background: rgba(255,255,255,0.025);
  }

  .student-name {
    color: rgba(245,248,255,0.96);
    font-weight: 850;
  }

  .student-email {
    margin-top: 3px;
    color: rgba(234,240,255,0.43);
    font-size: 10px;
  }

  .class-badge,
  .status {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
  }

  .class-badge {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
  }

  .status.ski {
    border: 1px solid rgba(137,194,170,0.25);
    background: rgba(137,194,170,0.09);
    color: #b6ead5;
  }

  .status.snowboard {
    border: 1px solid rgba(75,142,141,0.28);
    background: rgba(75,142,141,0.10);
    color: #b6dfde;
  }

  .status.missing {
    border: 1px solid rgba(251,191,36,0.22);
    background: rgba(251,191,36,0.07);
    color: #fde68a;
  }

  .surcharge {
    color: #fde68a;
  }

  .snow-empty {
    padding: 30px;
    text-align: center;
    color: rgba(234,240,255,0.50);
  }

  .snow-link {
    display: inline-block;
    margin-top: 12px;
    color: rgba(234,240,255,0.92);
    font-weight: 900;
  }

  .snow-loading {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,0.11);
    background: rgba(255,255,255,0.045);
    color: rgba(234,240,255,0.92);
  }

  .snow-loading p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.58);
  }

  .snow-spinner {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 3px solid rgba(255,255,255,0.13);
    border-top-color: #89c2aa;
    animation: snow-spin .75s linear infinite;
  }

  @keyframes snow-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1050px) {
    .snow-stat-grid {
      grid-template-columns: repeat(3, minmax(0,1fr));
    }

    .snow-info-grid {
      grid-template-columns: repeat(2, minmax(0,1fr));
    }

    .snow-level-grid {
      grid-template-columns: repeat(3, minmax(0,1fr));
    }
  }

  @media (max-width: 650px) {
    .snow-stat-grid,
    .snow-info-grid,
    .snow-level-grid,
    .snow-search-grid {
      grid-template-columns: 1fr;
    }

    .snow-hero-actions {
      width: 100%;
    }

    .snow-hero-button {
      flex: 1;
    }
  }
`;