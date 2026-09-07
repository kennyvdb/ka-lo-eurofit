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
  email: string | null;
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
  actief: boolean;
};

type DeelnemerRow = {
  id: string;
  leerling_id: string | null;
  email: string | null;
  actief: boolean;
};

type Discipline = "ski" | "snowboard";

type Ervaring =
  | "0_weken"
  | "1_2_weken"
  | "3_4_weken"
  | "5_plus_weken";

type KeuzeRow = {
  id: string;
  sneeuwstage_id: string;
  leerling_id: string;
  discipline: Discipline;
  ski_ervaring: Ervaring | null;
  snowboard_ervaring: Ervaring | null;
  eigen_snowboardmateriaal_meenemen: boolean | null;
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

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ============================================================
   EXPERIENCE OPTIONS
============================================================ */

const experienceOptions: {
  value: Ervaring;
  label: string;
  description: string;
}[] = [
  {
    value: "0_weken",
    label: "0 weken",
    description: "Ik heb nog nooit geskied.",
  },
  {
    value: "1_2_weken",
    label: "1–2 weken",
    description: "Ik heb al een beperkte ski-ervaring.",
  },
  {
    value: "3_4_weken",
    label: "3–4 weken",
    description: "Ik ski al behoorlijk zelfstandig.",
  },
  {
    value: "5_plus_weken",
    label: "5+ weken",
    description: "Ik heb ruime ski-ervaring.",
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function SneeuwstageLeerlingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [deelnemer, setDeelnemer] = useState<DeelnemerRow | null>(
    null
  );

  const [allowed, setAllowed] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const [discipline, setDiscipline] = useState<Discipline | null>(
    null
  );

  const [skiErvaring, setSkiErvaring] =
    useState<Ervaring | null>(null);

  const [snowboardErvaring, setSnowboardErvaring] =
    useState<Ervaring | null>(null);

  const [
    eigenSnowboardmateriaal,
    setEigenSnowboardmateriaal,
  ] = useState<boolean | null>(null);

  const [existingChoiceId, setExistingChoiceId] = useState<
    string | null
  >(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
            "Kon je account niet laden."
          )
        );
      }

      if (!user) {
        setAllowed(false);
        return;
      }

      const userEmail = normalizeEmail(user.email);

      /* --------------------------------------------------------
         PROFIEL
      -------------------------------------------------------- */

      const { data: profielData, error: profielError } =
        await supabase
          .from("profielen")
          .select("id, volledige_naam, email, rol")
          .eq("id", user.id)
          .maybeSingle();

      if (profielError) {
        throw new Error(
          readableSupabaseError(
            profielError,
            "Kon je profiel niet laden."
          )
        );
      }

      const profielValue =
        (profielData ?? null) as Profiel | null;

      setProfiel(profielValue);

      const teacher = isLoRole(profielValue?.rol);

      setIsTeacher(teacher);

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
              keuzes_open,
              actief
            `
          )
          .eq("slug", "sneeuwstage-2026")
          .maybeSingle();

      if (stageError) {
        throw new Error(
          readableSupabaseError(
            stageError,
            "Kon de sneeuwstage niet laden."
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
         DEELNEMER ACCESS

         We kijken zowel naar profiel-id als naar e-mail.
         Zo werken ook geselecteerde leerlingen die vóór hun
         eerste login nog geen profielrecord hadden.
      -------------------------------------------------------- */

      let deelnemerValue: DeelnemerRow | null = null;

      if (teacher) {
        setAllowed(true);
      } else {
        const { data: deelnemerData, error: deelnemerError } =
          await supabase
            .from("sneeuwstage_deelnemers")
            .select("id, leerling_id, email, actief")
            .eq("sneeuwstage_id", stageValue.id)
            .eq("actief", true)
            .or(
              `leerling_id.eq.${user.id},email.eq.${userEmail}`
            )
            .maybeSingle();

        if (deelnemerError) {
          throw new Error(
            readableSupabaseError(
              deelnemerError,
              "Kon je deelname niet controleren."
            )
          );
        }

        deelnemerValue =
          (deelnemerData ?? null) as DeelnemerRow | null;

        setDeelnemer(deelnemerValue);
        setAllowed(Boolean(deelnemerValue));
      }

      /* --------------------------------------------------------
         KEUZE

         Een leerling kan pas een keuze hebben wanneer er een
         profiel bestaat, want sneeuwstage_keuzes.leerling_id
         verwijst naar profielen.id.
      -------------------------------------------------------- */

      if (profielValue?.id) {
        const { data: keuzeData, error: keuzeError } =
          await supabase
            .from("sneeuwstage_keuzes")
            .select(
              `
                id,
                sneeuwstage_id,
                leerling_id,
                discipline,
                ski_ervaring,
                snowboard_ervaring,
                eigen_snowboardmateriaal_meenemen
              `
            )
            .eq("sneeuwstage_id", stageValue.id)
            .eq("leerling_id", profielValue.id)
            .maybeSingle();

        if (keuzeError) {
          throw new Error(
            readableSupabaseError(
              keuzeError,
              "Kon je huidige keuze niet laden."
            )
          );
        }

        if (keuzeData) {
          const keuze = keuzeData as KeuzeRow;

          setExistingChoiceId(keuze.id);
          setDiscipline(keuze.discipline);
          setSkiErvaring(keuze.ski_ervaring);
          setSnowboardErvaring(keuze.snowboard_ervaring);

          setEigenSnowboardmateriaal(
            keuze.eigen_snowboardmateriaal_meenemen
          );
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "De sneeuwstage kon niet worden geladen."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     VALIDATION
  ============================================================ */

  const formValid = useMemo(() => {
    if (!discipline) return false;

    if (discipline === "ski") {
      return Boolean(skiErvaring);
    }

    if (discipline === "snowboard") {
      return (
        snowboardErvaring === "5_plus_weken" &&
        eigenSnowboardmateriaal !== null
      );
    }

    return false;
  }, [
    discipline,
    skiErvaring,
    snowboardErvaring,
    eigenSnowboardmateriaal,
  ]);

  /* ============================================================
     DISCIPLINE
  ============================================================ */

  function chooseDiscipline(value: Discipline) {
    setDiscipline(value);
    setSuccess(null);
    setError(null);

    if (value === "ski") {
      setSnowboardErvaring(null);
      setEigenSnowboardmateriaal(null);
    }

    if (value === "snowboard") {
      setSkiErvaring(null);

      /*
       * Snowboard is alleen toegestaan vanaf 5 weken ervaring.
       */
      setSnowboardErvaring("5_plus_weken");
    }
  }

  /* ============================================================
     SAVE
  ============================================================ */

  async function saveChoice() {
    if (!stage || !profiel) return;

    setError(null);
    setSuccess(null);

    if (!stage.keuzes_open && !isTeacher) {
      setError(
        "De keuzes voor de sneeuwstage zijn momenteel afgesloten."
      );
      return;
    }

    if (!discipline) {
      setError("Kies eerst ski of snowboard.");
      return;
    }

    if (discipline === "ski" && !skiErvaring) {
      setError("Duid je ski-ervaring aan.");
      return;
    }

    if (discipline === "snowboard") {
      if (snowboardErvaring !== "5_plus_weken") {
        setError(
          "Snowboard is alleen mogelijk vanaf 5 weken ervaring."
        );
        return;
      }

      if (eigenSnowboardmateriaal === null) {
        setError(
          "Geef aan of je eigen snowboardmateriaal meeneemt."
        );
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        sneeuwstage_id: stage.id,
        leerling_id: profiel.id,
        discipline,
        ski_ervaring:
          discipline === "ski" ? skiErvaring : null,
        snowboard_ervaring:
          discipline === "snowboard"
            ? "5_plus_weken"
            : null,
        eigen_snowboardmateriaal_meenemen:
          discipline === "snowboard"
            ? eigenSnowboardmateriaal
            : null,
        bijgewerkt_op: new Date().toISOString(),
      };

      if (existingChoiceId) {
        const { error: updateError } = await supabase
          .from("sneeuwstage_keuzes")
          .update(payload)
          .eq("id", existingChoiceId);

        if (updateError) {
          throw new Error(
            readableSupabaseError(
              updateError,
              "Je keuze kon niet worden aangepast."
            )
          );
        }
      } else {
        const { data: insertData, error: insertError } =
          await supabase
            .from("sneeuwstage_keuzes")
            .insert(payload)
            .select("id")
            .single();

        if (insertError) {
          throw new Error(
            readableSupabaseError(
              insertError,
              "Je keuze kon niet worden opgeslagen."
            )
          );
        }

        setExistingChoiceId(insertData.id);
      }

      setSuccess(
        "Je keuze voor de sneeuwstage werd opgeslagen."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Je keuze kon niet worden opgeslagen."
      );
    } finally {
      setSaving(false);
    }
  }

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
            <p>Je deelname wordt gecontroleerd.</p>
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
        subtitle="Sneeuwstage"
        userName={profiel?.volledige_naam ?? null}
      >
        <style>{css}</style>

        <section className="snow-no-access">
          <div className="snow-no-access-icon">❄</div>

          <h1>Sneeuwstage 2026</h1>

          <p>
            Deze pagina is uitsluitend toegankelijk voor
            leerlingen die deelnemen aan de sneeuwstage.
          </p>

          <Link href="/dashboard" className="snow-button">
            ← Terug naar dashboard
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
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="3e graad"
        title={
          <>
            Sneeuwstage{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              2026
            </span>
          </>
        }
        description="Alle praktische informatie over onze sneeuwstage in Ahrntal en jouw keuze voor ski of snowboard."
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="Sneeuwstage 2026"
        quoteTitle="Ahrntal · Oostenrijk"
        quote="Zes dagen sneeuw, sport en avontuur in Speikboden en Klausberg."
        quoteAuthor="GO! Atheneum Avelgem"
        actions={
          isTeacher ? (
            <Link
              href="/leerkrachten-lo/extramurale-sportactiviteiten/sneeuwstage"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)]"
            >
              ← Leerkrachtenoverzicht
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)]"
            >
              ← Dashboard
            </Link>
          )
        }
      />

      <style>{css}</style>

      {/* ====================================================
          MELDINGEN
      ==================================================== */}

      {error ? (
        <div className="snow-message snow-error">
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      {success ? (
        <div className="snow-message snow-success">
          ✓ {success}
        </div>
      ) : null}

      {/* ====================================================
          TRIP HEADER
      ==================================================== */}

      <section className="snow-trip-grid">
        <div className="snow-trip-card">
          <span>Vertrek</span>
          <strong>
            {formatDate(stage?.vertrekdatum ?? null)}
          </strong>
          <small>vrijdag 18 december 2026</small>
        </div>

        <div className="snow-trip-card">
          <span>Terugkomst</span>
          <strong>
            {formatDate(stage?.terugkomstdatum ?? null)}
          </strong>
          <small>rond de middag</small>
        </div>

        <div className="snow-trip-card">
          <span>Bestemming</span>
          <strong>{stage?.bestemming ?? "Ahrntal"}</strong>
          <small>Oostenrijk</small>
        </div>

        <div className="snow-trip-card">
          <span>Verblijf</span>
          <strong>
            {stage?.verblijf ?? "Pension Rotbach"}
          </strong>
          <small>Ahrntal</small>
        </div>
      </section>

      {/* ====================================================
          PRAKTISCHE INFO
      ==================================================== */}

      <section className="snow-panel">
        <div className="snow-section-heading">
          <div className="snow-section-icon">❄</div>

          <div>
            <h2>Wat is inbegrepen?</h2>
            <p>
              De totaalprijs bedraagt{" "}
              <strong>{money(stage?.totaalprijs)}</strong>.
            </p>
          </div>
        </div>

        <div className="included-grid">
          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Busreis</strong>
              <small>
                Heen- en terugreis + lokale transfers.
              </small>
            </div>
          </div>

          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Volpension</strong>
              <small>
                Verblijf en maaltijden in Pension Rotbach.
              </small>
            </div>
          </div>

          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Skipas</strong>
              <small>
                Voor Speikboden en Klausberg.
              </small>
            </div>
          </div>

          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Skimateriaal</strong>
              <small>
                Huur van standaard skimateriaal inbegrepen.
              </small>
            </div>
          </div>

          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Skilessen</strong>
              <small>
                Dagelijks les door gediplomeerde
                Nederlandstalige monitoren.
              </small>
            </div>
          </div>

          <div className="included-item">
            <span>✓</span>
            <div>
              <strong>Begeleiding</strong>
              <small>
                Volledige begeleiding tijdens de hele
                sneeuwstage.
              </small>
            </div>
          </div>
        </div>

        <div className="price-note">
          <strong>Betaling</strong>
          <p>
            Bij de inschrijving werd een eerste voorschot van{" "}
            <b>€125</b> gevraagd. De totale kostprijs bedraagt{" "}
            <b>{money(stage?.totaalprijs)}</b>.
          </p>
        </div>
      </section>

      {/* ====================================================
          KEUZE TITEL
      ==================================================== */}

      <section className="snow-panel">
        <div className="snow-section-heading">
          <div className="snow-section-icon">⛷</div>

          <div>
            <h2>Jouw keuze</h2>

            <p>
              Kies hieronder voor ski of snowboard en geef je
              ervaring correct door.
            </p>
          </div>
        </div>

        {!stage?.keuzes_open && !isTeacher ? (
          <div className="closed-message">
            De keuzes zijn momenteel afgesloten. Je eerder
            opgeslagen keuze blijft zichtbaar.
          </div>
        ) : null}

        {/* ==================================================
            DISCIPLINE
        ================================================== */}

        <div className="discipline-grid">
          <button
            type="button"
            disabled={!stage?.keuzes_open && !isTeacher}
            onClick={() => chooseDiscipline("ski")}
            className={`discipline-card ${
              discipline === "ski" ? "selected" : ""
            }`}
          >
            <div className="discipline-icon">⛷️</div>

            <div>
              <strong>Ski</strong>

              <span>
                Geschikt voor zowel beginners als ervaren
                skiërs.
              </span>
            </div>

            <div className="select-indicator">
              {discipline === "ski" ? "✓" : ""}
            </div>
          </button>

          <button
            type="button"
            disabled={!stage?.keuzes_open && !isTeacher}
            onClick={() => chooseDiscipline("snowboard")}
            className={`discipline-card ${
              discipline === "snowboard" ? "selected" : ""
            }`}
          >
            <div className="discipline-icon">🏂</div>

            <div>
              <strong>Snowboard</strong>

              <span>
                Enkel voor leerlingen met minstens 5 weken
                snowboardervaring.
              </span>
            </div>

            <div className="select-indicator">
              {discipline === "snowboard" ? "✓" : ""}
            </div>
          </button>
        </div>

        {/* ==================================================
            SKI
        ================================================== */}

        {discipline === "ski" ? (
          <div className="choice-section">
            <div className="choice-heading">
              <h3>Hoeveel ski-ervaring heb je?</h3>
              <p>
                Kies de optie die het best overeenkomt met je
                totale ski-ervaring.
              </p>
            </div>

            <div className="experience-grid">
              {experienceOptions.map((option) => {
                const selected =
                  skiErvaring === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!stage?.keuzes_open && !isTeacher}
                    onClick={() =>
                      setSkiErvaring(option.value)
                    }
                    className={`experience-card ${
                      selected ? "selected" : ""
                    }`}
                  >
                    <span className="experience-check">
                      {selected ? "✓" : ""}
                    </span>

                    <strong>{option.label}</strong>

                    <small>{option.description}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ==================================================
            SNOWBOARD
        ================================================== */}

        {discipline === "snowboard" ? (
          <div className="choice-section">
            <div className="snowboard-warning">
              <strong>
                Snowboard is enkel mogelijk vanaf 5 weken
                ervaring.
              </strong>

              <p>
                Heb je minder snowboardervaring en wil je toch
                graag snowboarden? Neem dan eerst contact op met
                <b> Joni Vandewalle</b>.
              </p>
            </div>

            <div className="snowboard-experience">
              <span>Snowboardervaring</span>
              <strong>5+ weken</strong>
              <small>
                Minimale vereiste voor deelname aan de
                snowboardgroep.
              </small>
            </div>

            <div className="equipment-section">
              <h3>
                Heb je eigen snowboardmateriaal en wens je deze
                mee te nemen?
              </h3>

              <div className="yes-no-grid">
                <button
                  type="button"
                  disabled={!stage?.keuzes_open && !isTeacher}
                  onClick={() =>
                    setEigenSnowboardmateriaal(true)
                  }
                  className={`yes-no ${
                    eigenSnowboardmateriaal === true
                      ? "selected"
                      : ""
                  }`}
                >
                  <span>
                    {eigenSnowboardmateriaal === true
                      ? "✓"
                      : ""}
                  </span>

                  <div>
                    <strong>Ja</strong>
                    <small>
                      Ik neem mijn eigen snowboardmateriaal mee.
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!stage?.keuzes_open && !isTeacher}
                  onClick={() =>
                    setEigenSnowboardmateriaal(false)
                  }
                  className={`yes-no ${
                    eigenSnowboardmateriaal === false
                      ? "selected"
                      : ""
                  }`}
                >
                  <span>
                    {eigenSnowboardmateriaal === false
                      ? "✓"
                      : ""}
                  </span>

                  <div>
                    <strong>Nee</strong>
                    <small>
                      Ik wens snowboardmateriaal te huren.
                    </small>
                  </div>
                </button>
              </div>

              {eigenSnowboardmateriaal === false ? (
                <div className="surcharge-box">
                  <div>
                    <strong>
                      Snowboardmateriaal huren
                    </strong>

                    <p>
                      Omdat snowboardmateriaal niet inbegrepen is
                      in het standaardpakket, wordt hiervoor een
                      toeslag aangerekend.
                    </p>
                  </div>

                  <span>
                    +{money(stage?.snowboard_toeslag ?? 30)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="snowboard-note">
              <strong>Belangrijk</strong>

              <p>
                De snowboardgroep kan alleen doorgaan indien er
                voldoende deelnemers zijn. Indien de groep te
                klein is, kan de snowboardoptie geannuleerd
                worden en sluit je aan bij een skigroep.
              </p>
            </div>
          </div>
        ) : null}

        {/* ==================================================
            SAVE
        ================================================== */}

        {discipline ? (
          <div className="save-section">
            <div>
              <strong>
                {existingChoiceId
                  ? "Je keuze werd eerder opgeslagen."
                  : "Nog niet opgeslagen"}
              </strong>

              <p>
                Je kunt je keuze aanpassen zolang de inschrijving
                openstaat.
              </p>
            </div>

            <button
              type="button"
              disabled={
                saving ||
                !formValid ||
                (!stage?.keuzes_open && !isTeacher)
              }
              onClick={saveChoice}
              className="save-button"
            >
              {saving
                ? "Opslaan…"
                : existingChoiceId
                ? "Keuze aanpassen"
                : "Keuze opslaan"}
            </button>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

/* ============================================================
   CSS
============================================================ */

const css = `
  .snow-message {
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 750;
  }

  .snow-error {
    border: 1px solid rgba(248,113,113,0.28);
    background: rgba(127,29,29,0.20);
    color: #fecaca;
  }

  .snow-success {
    border: 1px solid rgba(74,222,128,0.25);
    background: rgba(20,83,45,0.20);
    color: #bbf7d0;
  }

  .snow-trip-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 10px;
  }

  .snow-trip-card {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.11);
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.035)
      );
  }

  .snow-trip-card span {
    display: block;
    color: rgba(234,240,255,0.52);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .snow-trip-card strong {
    display: block;
    margin-top: 5px;
    color: rgba(245,248,255,0.97);
    font-size: 16px;
  }

  .snow-trip-card small {
    display: block;
    margin-top: 3px;
    color: rgba(234,240,255,0.48);
    font-size: 11px;
  }

  .snow-panel {
    margin-top: 14px;
    padding: 19px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.11);
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.04)
      );
    color: rgba(234,240,255,0.92);
  }

  .snow-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 13px;
  }

  .snow-section-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 1px solid rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.09);
    font-size: 19px;
  }

  .snow-section-heading h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 950;
  }

  .snow-section-heading p {
    margin: 5px 0 0;
    color: rgba(234,240,255,0.57);
    font-size: 13px;
  }

  .included-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 9px;
  }

  .included-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.17);
  }

  .included-item > span {
    width: 23px;
    height: 23px;
    flex: 0 0 23px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: rgba(137,194,170,0.15);
    color: #b7ead5;
    font-size: 11px;
    font-weight: 1000;
  }

  .included-item strong {
    display: block;
    font-size: 13px;
  }

  .included-item small {
    display: block;
    margin-top: 3px;
    color: rgba(234,240,255,0.48);
    font-size: 11px;
    line-height: 1.4;
  }

  .price-note {
    margin-top: 12px;
    padding: 14px 15px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.15);
  }

  .price-note strong {
    font-size: 13px;
  }

  .price-note p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.58);
    font-size: 12px;
    line-height: 1.5;
  }

  .closed-message {
    margin-top: 15px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(251,191,36,0.22);
    background: rgba(251,191,36,0.07);
    color: #fde68a;
    font-size: 12px;
  }

  .discipline-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 10px;
  }

  .discipline-card {
    min-width: 0;
    min-height: 105px;
    position: relative;
    display: grid;
    grid-template-columns: 48px minmax(0,1fr) 28px;
    gap: 12px;
    align-items: center;
    padding: 15px;
    border-radius: 19px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    color: rgba(234,240,255,0.90);
    text-align: left;
    cursor: pointer;
    transition: .16s ease;
  }

  .discipline-card:hover:not(:disabled) {
    border-color: rgba(137,194,170,0.30);
    background: rgba(255,255,255,0.035);
  }

  .discipline-card.selected {
    border-color: rgba(137,194,170,0.55);
    background: rgba(137,194,170,0.10);
  }

  .discipline-card:disabled {
    cursor: not-allowed;
    opacity: .55;
  }

  .discipline-icon {
    font-size: 31px;
  }

  .discipline-card strong {
    display: block;
    font-size: 17px;
  }

  .discipline-card span {
    display: block;
    margin-top: 5px;
    color: rgba(234,240,255,0.52);
    font-size: 11px;
    line-height: 1.4;
  }

  .select-indicator {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.18);
    font-weight: 1000;
  }

  .discipline-card.selected .select-indicator {
    border-color: #89c2aa;
    background: #89c2aa;
    color: #071019;
  }

  .choice-section {
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .choice-heading h3,
  .equipment-section h3 {
    margin: 0;
    color: rgba(245,248,255,0.96);
    font-size: 15px;
    font-weight: 950;
  }

  .choice-heading p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.49);
    font-size: 11px;
  }

  .experience-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 9px;
  }

  .experience-card {
    min-height: 118px;
    position: relative;
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(0,0,0,0.17);
    color: rgba(234,240,255,0.88);
    text-align: left;
    cursor: pointer;
  }

  .experience-card.selected {
    border-color: rgba(137,194,170,0.48);
    background: rgba(137,194,170,0.09);
  }

  .experience-card:disabled {
    cursor: not-allowed;
    opacity: .55;
  }

  .experience-check {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.17);
    font-size: 11px;
    font-weight: 1000;
  }

  .experience-card.selected .experience-check {
    background: #89c2aa;
    color: #071019;
    border-color: #89c2aa;
  }

  .experience-card strong {
    display: block;
    margin-top: 20px;
    font-size: 16px;
  }

  .experience-card small {
    display: block;
    margin-top: 7px;
    color: rgba(234,240,255,0.48);
    font-size: 11px;
    line-height: 1.4;
  }

  .snowboard-warning {
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(251,191,36,0.23);
    background: rgba(251,191,36,0.065);
  }

  .snowboard-warning strong {
    color: #fde68a;
    font-size: 13px;
  }

  .snowboard-warning p {
    margin: 5px 0 0;
    color: rgba(254,240,138,0.76);
    font-size: 11px;
    line-height: 1.5;
  }

  .snowboard-experience {
    margin-top: 12px;
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(137,194,170,0.18);
    background: rgba(137,194,170,0.06);
  }

  .snowboard-experience span {
    display: block;
    color: rgba(234,240,255,0.52);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .snowboard-experience strong {
    display: block;
    margin: 4px 0;
    font-size: 18px;
  }

  .snowboard-experience small {
    color: rgba(234,240,255,0.48);
    font-size: 11px;
  }

  .equipment-section {
    margin-top: 18px;
  }

  .yes-no-grid {
    margin-top: 11px;
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 9px;
  }

  .yes-no {
    min-height: 82px;
    display: grid;
    grid-template-columns: 28px minmax(0,1fr);
    align-items: center;
    gap: 10px;
    padding: 13px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(0,0,0,0.17);
    color: rgba(234,240,255,0.90);
    text-align: left;
    cursor: pointer;
  }

  .yes-no > span {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.18);
    font-weight: 1000;
  }

  .yes-no.selected {
    border-color: rgba(137,194,170,0.48);
    background: rgba(137,194,170,0.09);
  }

  .yes-no.selected > span {
    background: #89c2aa;
    border-color: #89c2aa;
    color: #071019;
  }

  .yes-no strong {
    display: block;
    font-size: 14px;
  }

  .yes-no small {
    display: block;
    margin-top: 4px;
    color: rgba(234,240,255,0.48);
    font-size: 11px;
  }

  .surcharge-box {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 14px;
    border-radius: 17px;
    border: 1px solid rgba(251,191,36,0.22);
    background: rgba(251,191,36,0.065);
  }

  .surcharge-box strong {
    color: #fde68a;
    font-size: 13px;
  }

  .surcharge-box p {
    margin: 4px 0 0;
    color: rgba(254,240,138,0.70);
    font-size: 11px;
  }

  .surcharge-box > span {
    flex: 0 0 auto;
    color: #fde68a;
    font-size: 20px;
    font-weight: 1000;
  }

  .snowboard-note {
    margin-top: 10px;
    padding: 13px 14px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.15);
  }

  .snowboard-note strong {
    font-size: 12px;
  }

  .snowboard-note p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.49);
    font-size: 11px;
    line-height: 1.5;
  }

  .save-section {
    margin-top: 20px;
    padding-top: 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .save-section strong {
    font-size: 13px;
  }

  .save-section p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.48);
    font-size: 11px;
  }

  .save-button,
  .snow-button {
    min-height: 44px;
    padding: 0 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    border: 1px solid rgba(137,194,170,0.38);
    background: rgba(137,194,170,0.17);
    color: rgba(245,248,255,0.97);
    text-decoration: none;
    font-size: 13px;
    font-weight: 950;
    cursor: pointer;
  }

  .save-button:disabled {
    opacity: .4;
    cursor: not-allowed;
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
    color: rgba(234,240,255,0.56);
  }

  .snow-spinner {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
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

  .snow-no-access {
    max-width: 600px;
    margin: 30px auto;
    padding: 30px;
    border-radius: 26px;
    border: 1px solid rgba(255,255,255,0.11);
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.035)
      );
    color: rgba(234,240,255,0.92);
    text-align: center;
  }

  .snow-no-access-icon {
    font-size: 38px;
  }

  .snow-no-access h1 {
    margin: 10px 0 0;
    font-size: 27px;
  }

  .snow-no-access p {
    margin: 10px auto 18px;
    max-width: 450px;
    color: rgba(234,240,255,0.56);
    line-height: 1.5;
  }

  @media (max-width: 950px) {
    .snow-trip-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .included-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .experience-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }
  }

  @media (max-width: 640px) {
    .snow-trip-grid,
    .included-grid,
    .discipline-grid,
    .experience-grid,
    .yes-no-grid {
      grid-template-columns: 1fr;
    }

    .save-section,
    .surcharge-box {
      align-items: stretch;
      flex-direction: column;
    }

    .save-button {
      width: 100%;
    }
  }
`;