"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

type Sneeuwstage = {
  id: string;
  slug: string;
  naam: string;
  schooljaar: string;
};

type ClassStudentRow = {
  email: string | null;
  given_name: string | null;
  family_name: string | null;
  class_name: string | null;
  schooljaar: string | null;
};

type Leerling = {
  profielId: string | null;
  email: string;
  naam: string;
  familyName: string;
  klas: string;
  schooljaar: string;
};

type DeelnemerRow = {
  id: string;
  sneeuwstage_id: string;
  leerling_id: string | null;
  email: string | null;
  actief: boolean;
};

type GraadFilter = "3e_graad" | "2e_graad" | "alle";

/* =========================================================
   UI
========================================================= */

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  successBg: "rgba(34,197,94,0.12)",
  successBorder: "rgba(34,197,94,0.30)",
};

/* =========================================================
   HELPERS
========================================================= */

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

function isAllowedRole(value: unknown) {
  const role = normalizeRole(value);

  return (
    role === "lo_leerkracht" ||
    role === "leerkracht_lo" ||
    role === "admin"
  );
}

function isEchteKlas(klas: string) {
  return /^[0-9]/.test(klas.trim());
}

function getLeerjaar(klas: string) {
  const match = klas.trim().match(/^([0-9]+)/);

  if (!match) return null;

  return Number(match[1]);
}

function pastBinnenGraad(
  klas: string,
  graad: GraadFilter
) {
  const leerjaar = getLeerjaar(klas);

  if (!leerjaar) return false;

  if (graad === "alle") {
    return true;
  }

  if (graad === "3e_graad") {
    return leerjaar === 5 || leerjaar === 6;
  }

  if (graad === "2e_graad") {
    return leerjaar === 3 || leerjaar === 4;
  }

  return false;
}

function readableSupabaseError(
  error: any,
  fallback: string
) {
  if (!error) return fallback;

  return [
    fallback,
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" | ");
}

/* =========================================================
   PAGE
========================================================= */

export default function SneeuwstageDeelnemersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allowed, setAllowed] = useState(false);

  const [profiel, setProfiel] =
    useState<Profiel | null>(null);

  const [stage, setStage] =
    useState<Sneeuwstage | null>(null);

  const [leerlingen, setLeerlingen] = useState<Leerling[]>([]);

  const [deelnemers, setDeelnemers] =
    useState<DeelnemerRow[]>([]);

  const [
    originalSelectedEmails,
    setOriginalSelectedEmails,
  ] = useState<Set<string>>(new Set());

  const [selectedEmails, setSelectedEmails] =
    useState<Set<string>>(new Set());

  const [graadFilter, setGraadFilter] =
    useState<GraadFilter>("3e_graad");

  const [klasFilter, setKlasFilter] =
    useState("Alle");

  const [zoekterm, setZoekterm] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  /* =======================================================
     DEELNEMERS LADEN
  ======================================================= */

  async function loadDeelnemers(stageId: string) {
    const {
      data,
      error: deelnemersError,
    } = await supabase
      .from("sneeuwstage_deelnemers")
      .select(
        "id, sneeuwstage_id, leerling_id, email, actief"
      )
      .eq("sneeuwstage_id", stageId);

    if (deelnemersError) {
      throw new Error(
        readableSupabaseError(
          deelnemersError,
          "Kon deelnemers niet laden."
        )
      );
    }

    const rows = (data ?? []) as DeelnemerRow[];

    setDeelnemers(rows);

    const actieveEmails = new Set<string>();

    rows.forEach((row) => {
      if (!row.actief) return;

      const email = normalizeEmail(row.email);

      if (email) {
        actieveEmails.add(email);
      }
    });

    setOriginalSelectedEmails(
      new Set(actieveEmails)
    );

    setSelectedEmails(
      new Set(actieveEmails)
    );
  }

  /* =======================================================
     PROFIEL-ID'S OPHALEN
  ======================================================= */

  async function enrichWithProfileIds(
    students: Leerling[]
  ) {
    const emails = students
      .map((student) => student.email)
      .filter(Boolean);

    if (emails.length === 0) {
      return students;
    }

    const { data, error } = await supabase
      .from("profielen")
      .select("id, email")
      .in("email", emails);

    if (error) {
      console.warn(
        "Profiel-ID's konden niet volledig geladen worden:",
        error
      );

      return students;
    }

    const profielMap = new Map<string, string>();

    (data ?? []).forEach((row: any) => {
      const email = normalizeEmail(row.email);

      if (email && row.id) {
        profielMap.set(
          email,
          String(row.id)
        );
      }
    });

    return students.map((student) => ({
      ...student,
      profielId:
        profielMap.get(student.email) ?? null,
    }));
  }

  /* =======================================================
     INIT
  ======================================================= */

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setAllowed(false);
          return;
        }

        /* -----------------------------------------------
           PROFIEL LEERKRACHT
        ----------------------------------------------- */

        const {
          data: profielData,
          error: profielError,
        } = await supabase
          .from("profielen")
          .select(
            "id, volledige_naam, rol"
          )
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

        if (
          !profielData ||
          !isAllowedRole(profielData.rol)
        ) {
          setAllowed(false);
          return;
        }

        const profielValue =
          profielData as Profiel;

        setProfiel(profielValue);
        setAllowed(true);

        /* -----------------------------------------------
           SNEEUWSTAGE
        ----------------------------------------------- */

        const {
          data: stageData,
          error: stageError,
        } = await supabase
          .from("sneeuwstages")
          .select(
            "id, slug, naam, schooljaar"
          )
          .eq(
            "slug",
            "sneeuwstage-2026"
          )
          .single();

        if (stageError) {
          throw new Error(
            readableSupabaseError(
              stageError,
              "Kon sneeuwstage niet laden."
            )
          );
        }

        const stageValue =
          stageData as Sneeuwstage;

        setStage(stageValue);

        /* -----------------------------------------------
           ACTUELE SMARTSCHOOLKLASSEN

           BELANGRIJK:
           We gebruiken class_students,
           niet eurofit_class_students_view.
        ----------------------------------------------- */

        const {
          data: classStudentsData,
          error: classStudentsError,
        } = await supabase.rpc(
          "get_sneeuwstage_class_students",
          {
           p_schooljaar: stageValue.schooljaar,
          }
        );

        if (classStudentsError) {
          throw new Error(
            readableSupabaseError(
              classStudentsError,
              "Kon actuele Smartschoolklassen niet laden."
            )
          );
        }

        const rawStudents =
          (classStudentsData ??
            []) as ClassStudentRow[];

        /* -----------------------------------------------
           ENKEL ECHTE KLASSEN + DEDUPLICEREN
        ----------------------------------------------- */

        const studentMap =
          new Map<string, Leerling>();

        rawStudents.forEach((row) => {
          const email =
            normalizeEmail(row.email);

          const givenName =
            normalizeText(row.given_name);

          const familyName =
            normalizeText(row.family_name);

          const klas =
            normalizeText(row.class_name);

          const schooljaar =
            normalizeText(row.schooljaar);

          if (!email) return;
          if (!klas) return;

          /*
           * LOMEI, LOJON, NCZ, enz. uitsluiten.
           *
           * Alleen klassen die met een cijfer
           * beginnen worden behouden.
           */
          if (!isEchteKlas(klas)) {
            return;
          }

          const naam =
            `${givenName} ${familyName}`.trim();

          if (!naam) return;

          const leerling: Leerling = {
            profielId: null,
            email,
            naam,
            familyName,
            klas,
            schooljaar,
          };

          /*
           * Eén leerling kan meerdere Smartschoolgroepen
           * hebben. We bewaren hem slechts één keer.
           */
          if (!studentMap.has(email)) {
            studentMap.set(
              email,
              leerling
            );
          }
        });

        let normalizedStudents =
          Array.from(
            studentMap.values()
          );

        /*
         * Profiel-ID toevoegen indien de leerling
         * al eens in de app heeft ingelogd.
         */
        normalizedStudents =
          await enrichWithProfileIds(
            normalizedStudents
          );

        normalizedStudents.sort(
          (a, b) => {
            const klasCompare =
              a.klas.localeCompare(
                b.klas,
                "nl-BE",
                {
                  numeric: true,
                }
              );

            if (klasCompare !== 0) {
              return klasCompare;
            }

            const familyCompare =
              a.familyName.localeCompare(
                b.familyName,
                "nl-BE"
              );

            if (familyCompare !== 0) {
              return familyCompare;
            }

            return a.naam.localeCompare(
              b.naam,
              "nl-BE"
            );
          }
        );

        setLeerlingen(
          normalizedStudents
        );

        /* -----------------------------------------------
           DEELNEMERS
        ----------------------------------------------- */

        await loadDeelnemers(
          stageValue.id
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Kon deelnemersbeheer niet laden."
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  /* =======================================================
     LEERLINGEN PER GRAAD
  ======================================================= */

  const leerlingenBinnenGraad =
    useMemo(() => {
      return leerlingen.filter(
        (leerling) =>
          pastBinnenGraad(
            leerling.klas,
            graadFilter
          )
      );
    }, [
      leerlingen,
      graadFilter,
    ]);

  /* =======================================================
     KLASSEN
  ======================================================= */

  const klassen = useMemo(() => {
    const set = new Set<string>();

    leerlingenBinnenGraad.forEach(
      (leerling) => {
        if (leerling.klas) {
          set.add(leerling.klas);
        }
      }
    );

    return Array.from(set).sort(
      (a, b) =>
        a.localeCompare(
          b,
          "nl-BE",
          {
            numeric: true,
          }
        )
    );
  }, [leerlingenBinnenGraad]);

  /* =======================================================
     GRAAD WIJZIGEN
  ======================================================= */

  function handleGraadChange(
    value: GraadFilter
  ) {
    setGraadFilter(value);
    setKlasFilter("Alle");
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const gefilterdeLeerlingen =
    useMemo(() => {
      const zoek =
        zoekterm.trim().toLowerCase();

      return leerlingenBinnenGraad.filter(
        (leerling) => {
          if (
            klasFilter !== "Alle" &&
            leerling.klas !== klasFilter
          ) {
            return false;
          }

          if (zoek) {
            const haystack =
              `${leerling.naam} ${leerling.familyName} ${leerling.email} ${leerling.klas}`.toLowerCase();

            if (
              !haystack.includes(
                zoek
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      leerlingenBinnenGraad,
      klasFilter,
      zoekterm,
    ]);

  /* =======================================================
     GROEPEREN PER KLAS
  ======================================================= */

  const groepen = useMemo(() => {
    const map =
      new Map<string, Leerling[]>();

    gefilterdeLeerlingen.forEach(
      (leerling) => {
        const klas =
          leerling.klas ||
          "Onbekend";

        if (!map.has(klas)) {
          map.set(
            klas,
            []
          );
        }

        map.get(klas)!.push(
          leerling
        );
      }
    );

    return Array.from(
      map.entries()
    )
      .sort(([a], [b]) =>
        a.localeCompare(
          b,
          "nl-BE",
          {
            numeric: true,
          }
        )
      )
      .map(
        ([
          klas,
          leerlingenVanKlas,
        ]) => ({
          klas,
          leerlingen:
            leerlingenVanKlas,
        })
      );
  }, [gefilterdeLeerlingen]);

  /* =======================================================
     COUNTERS
  ======================================================= */

  const selectedCount =
    selectedEmails.size;

  const visibleSelectedCount =
    useMemo(() => {
      return gefilterdeLeerlingen.filter(
        (leerling) =>
          selectedEmails.has(
            leerling.email
          )
      ).length;
    }, [
      gefilterdeLeerlingen,
      selectedEmails,
    ]);

  const unsavedChanges =
    useMemo(() => {
      if (
        originalSelectedEmails.size !==
        selectedEmails.size
      ) {
        return true;
      }

      for (
        const email of selectedEmails
      ) {
        if (
          !originalSelectedEmails.has(
            email
          )
        ) {
          return true;
        }
      }

      return false;
    }, [
      originalSelectedEmails,
      selectedEmails,
    ]);

  /* =======================================================
     SELECTIE
  ======================================================= */

  function toggleLeerling(
    email: string
  ) {
    const normalized =
      normalizeEmail(email);

    if (!normalized) return;

    setSelectedEmails(
      (prev) => {
        const next =
          new Set(prev);

        if (
          next.has(normalized)
        ) {
          next.delete(normalized);
        } else {
          next.add(normalized);
        }

        return next;
      }
    );

    setSuccess(null);
  }

  function selecteerKlas(
    leerlingenVanKlas: Leerling[]
  ) {
    setSelectedEmails(
      (prev) => {
        const next =
          new Set(prev);

        leerlingenVanKlas.forEach(
          (leerling) => {
            next.add(
              leerling.email
            );
          }
        );

        return next;
      }
    );

    setSuccess(null);
  }

  function wisKlas(
    leerlingenVanKlas: Leerling[]
  ) {
    setSelectedEmails(
      (prev) => {
        const next =
          new Set(prev);

        leerlingenVanKlas.forEach(
          (leerling) => {
            next.delete(
              leerling.email
            );
          }
        );

        return next;
      }
    );

    setSuccess(null);
  }

  function selecteerZichtbareLeerlingen() {
    setSelectedEmails(
      (prev) => {
        const next =
          new Set(prev);

        gefilterdeLeerlingen.forEach(
          (leerling) => {
            next.add(
              leerling.email
            );
          }
        );

        return next;
      }
    );

    setSuccess(null);
  }

  function wisZichtbareLeerlingen() {
    setSelectedEmails(
      (prev) => {
        const next =
          new Set(prev);

        gefilterdeLeerlingen.forEach(
          (leerling) => {
            next.delete(
              leerling.email
            );
          }
        );

        return next;
      }
    );

    setSuccess(null);
  }

  function annuleerWijzigingen() {
    setSelectedEmails(
      new Set(
        originalSelectedEmails
      )
    );

    setSuccess(null);
    setError(null);
  }

  /* =======================================================
     OPSLAAN
  ======================================================= */

  async function saveChanges() {
    if (!stage || !profiel) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const bestaandePerEmail =
        new Map<
          string,
          DeelnemerRow
        >();

      deelnemers.forEach(
        (deelnemer) => {
          const email =
            normalizeEmail(
              deelnemer.email
            );

          if (email) {
            bestaandePerEmail.set(
              email,
              deelnemer
            );
          }
        }
      );

      const teActiveren: string[] =
        [];

      const teDeactiveren: string[] =
        [];

      const toeTeVoegen:
        Leerling[] = [];

      /* -----------------------------------------------
         BESTAANDE DEELNEMERS
      ----------------------------------------------- */

      deelnemers.forEach(
        (deelnemer) => {
          const email =
            normalizeEmail(
              deelnemer.email
            );

          if (!email) return;

          const moetActiefZijn =
            selectedEmails.has(
              email
            );

          if (
            moetActiefZijn &&
            !deelnemer.actief
          ) {
            teActiveren.push(
              deelnemer.id
            );
          }

          if (
            !moetActiefZijn &&
            deelnemer.actief
          ) {
            teDeactiveren.push(
              deelnemer.id
            );
          }
        }
      );

      /* -----------------------------------------------
         NIEUWE DEELNEMERS
      ----------------------------------------------- */

      for (
        const email of selectedEmails
      ) {
        if (
          !bestaandePerEmail.has(
            email
          )
        ) {
          const leerling =
            leerlingen.find(
              (item) =>
                item.email ===
                email
            );

          if (leerling) {
            toeTeVoegen.push(
              leerling
            );
          }
        }
      }

      /* -----------------------------------------------
         ACTIVEREN
      ----------------------------------------------- */

      if (
        teActiveren.length > 0
      ) {
        const {
          error:
            activateError,
        } = await supabase
          .from(
            "sneeuwstage_deelnemers"
          )
          .update({
            actief: true,
            bijgewerkt_op:
              new Date().toISOString(),
          })
          .in(
            "id",
            teActiveren
          );

        if (activateError) {
          throw new Error(
            readableSupabaseError(
              activateError,
              "Kon deelnemers niet activeren."
            )
          );
        }
      }

      /* -----------------------------------------------
         DEACTIVEREN
      ----------------------------------------------- */

      if (
        teDeactiveren.length > 0
      ) {
        const {
          error:
            deactivateError,
        } = await supabase
          .from(
            "sneeuwstage_deelnemers"
          )
          .update({
            actief: false,
            bijgewerkt_op:
              new Date().toISOString(),
          })
          .in(
            "id",
            teDeactiveren
          );

        if (
          deactivateError
        ) {
          throw new Error(
            readableSupabaseError(
              deactivateError,
              "Kon deelnemers niet verwijderen."
            )
          );
        }
      }

      /* -----------------------------------------------
         TOEVOEGEN
      ----------------------------------------------- */

      if (
        toeTeVoegen.length > 0
      ) {
        const payload =
          toeTeVoegen.map(
            (leerling) => ({
              sneeuwstage_id:
                stage.id,

              leerling_id:
                leerling.profielId,

              email:
                leerling.email,

              actief: true,

              toegevoegd_door:
                profiel.id,

              toegevoegd_op:
                new Date().toISOString(),

              bijgewerkt_op:
                new Date().toISOString(),
            })
          );

        const {
          error:
            insertError,
        } = await supabase
          .from(
            "sneeuwstage_deelnemers"
          )
          .insert(payload);

        if (insertError) {
          throw new Error(
            readableSupabaseError(
              insertError,
              "Kon nieuwe deelnemers niet toevoegen."
            )
          );
        }
      }

      await loadDeelnemers(
        stage.id
      );

      setSuccess(
        "De deelnemerslijst werd opgeslagen."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "De deelnemerslijst kon niet opgeslagen worden."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <AppShell
        title="LO App"
        subtitle="Sneeuwstage deelnemers"
      >
        <section
          style={styles.panel}
        >
          <p
            style={{
              margin: 0,
              color: ui.text,
            }}
          >
            Deelnemers laden...
          </p>
        </section>
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
      >
        <section
          style={styles.panel}
        >
          <h2 style={styles.h2}>
            Geen toegang
          </h2>

          <p style={styles.muted}>
            Deze pagina is alleen
            toegankelijk voor
            LO-leerkrachten en admins.
          </p>

          <Link
            href="/dashboard"
            style={{
              color: ui.text,
              fontWeight: 900,
            }}
          >
            Terug naar dashboard →
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
      subtitle="Sneeuwstage deelnemers"
      userName={
        profiel?.volledige_naam ??
        null
      }
    >
      {/* HERO */}

      <BaseHero
        label="SNEEUWSTAGE 2026"
        title={
          <>
            Deelnemers{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              beheren
            </span>
          </>
        }
        description="Beheer welke leerlingen toegang krijgen tot de sneeuwstagepagina en hun ski- of snowboardkeuze kunnen invullen."
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="Sneeuwstage"
        quoteTitle="Deelnemers"
        quote="Alleen actief geselecteerde leerlingen krijgen toegang tot de sneeuwstagepagina."
        quoteAuthor="LO Team"
        actions={
          <Link
            href="/leerkrachten-lo/extramurale-sportactiviteiten/sneeuwstage"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45"
          >
            ← Terug naar overzicht
          </Link>
        }
      />

      {/* MELDINGEN */}

      {error ? (
        <div
          style={styles.error}
        >
          <strong>Fout</strong>

          <div
            style={{
              marginTop: 4,
            }}
          >
            {error}
          </div>
        </div>
      ) : null}

      {success ? (
        <div
          style={styles.success}
        >
          <strong>Gelukt</strong>

          <div
            style={{
              marginTop: 4,
            }}
          >
            {success}
          </div>
        </div>
      ) : null}

      {/* STATS */}

      <section
        className="snowstats-grid"
        style={styles.statsGrid}
      >
        <div
          style={styles.statCard}
        >
          <div
            style={styles.statValue}
          >
            {selectedCount}
          </div>

          <div
            style={styles.statLabel}
          >
            geselecteerd
          </div>
        </div>

        <div
          style={styles.statCard}
        >
          <div
            style={styles.statValue}
          >
            {leerlingen.length}
          </div>

          <div
            style={styles.statLabel}
          >
            leerlingen beschikbaar
          </div>
        </div>

        <div
          style={styles.statCard}
        >
          <div
            style={styles.statValue}
          >
            {visibleSelectedCount}
          </div>

          <div
            style={styles.statLabel}
          >
            geselecteerd in huidige filter
          </div>
        </div>

        <div
          style={styles.statCard}
        >
          <div
            style={styles.statValue}
          >
            {unsavedChanges
              ? "Ja"
              : "Nee"}
          </div>

          <div
            style={styles.statLabel}
          >
            niet-opgeslagen wijzigingen
          </div>
        </div>
      </section>

      {/* FILTERS */}

      <section
        style={{
          ...styles.panel,
          marginTop: 16,
        }}
      >
        <h2 style={styles.h2}>
          Leerlingen selecteren
        </h2>

        <p style={styles.muted}>
          Standaard wordt de 3e
          graad getoond. Je kunt ook
          de 2e graad of alle
          leerlingen bekijken.
        </p>

        <div
          style={
            styles.filterBlock
          }
        >
          <div
            style={
              styles.filterLabel
            }
          >
            Graad
          </div>

          <div
            className="graad-buttons"
            style={
              styles.graadButtons
            }
          >
            <button
              type="button"
              onClick={() =>
                handleGraadChange(
                  "3e_graad"
                )
              }
              style={{
                ...styles.filterButton,
                ...(graadFilter ===
                "3e_graad"
                  ? styles.filterButtonActive
                  : {}),
              }}
            >
              3e graad

              <span
                style={
                  styles.buttonSub
                }
              >
                5e + 6e jaar
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleGraadChange(
                  "2e_graad"
                )
              }
              style={{
                ...styles.filterButton,
                ...(graadFilter ===
                "2e_graad"
                  ? styles.filterButtonActive
                  : {}),
              }}
            >
              2e graad

              <span
                style={
                  styles.buttonSub
                }
              >
                3e + 4e jaar
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleGraadChange(
                  "alle"
                )
              }
              style={{
                ...styles.filterButton,
                ...(graadFilter ===
                "alle"
                  ? styles.filterButtonActive
                  : {}),
              }}
            >
              Alle leerlingen

              <span
                style={
                  styles.buttonSub
                }
              >
                volledige school
              </span>
            </button>
          </div>
        </div>

        <div
          className="snow-filters"
          style={
            styles.filtersGrid
          }
        >
          <label
            style={styles.field}
          >
            <span
              style={
                styles.filterLabel
              }
            >
              Zoeken
            </span>

            <input
              value={zoekterm}
              onChange={(event) =>
                setZoekterm(
                  event.target.value
                )
              }
              placeholder="Zoek op naam, klas of e-mail..."
              style={styles.input}
            />
          </label>

          <label
            style={styles.field}
          >
            <span
              style={
                styles.filterLabel
              }
            >
              Klas
            </span>

            <select
              value={klasFilter}
              onChange={(event) =>
                setKlasFilter(
                  event.target.value
                )
              }
              style={styles.input}
            >
              <option value="Alle">
                Alle klassen
              </option>

              {klassen.map(
                (klas) => (
                  <option
                    key={klas}
                    value={klas}
                  >
                    {klas}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div
          style={
            styles.actionsRow
          }
        >
          <button
            type="button"
            onClick={
              selecteerZichtbareLeerlingen
            }
            style={
              styles.secondaryButton
            }
          >
            Alles zichtbaar
            selecteren
          </button>

          <button
            type="button"
            onClick={
              wisZichtbareLeerlingen
            }
            style={
              styles.secondaryButton
            }
          >
            Zichtbare selectie wissen
          </button>
        </div>
      </section>

      {/* KLASSEN */}

      <section
        style={{
          marginTop: 16,
          display: "grid",
          gap: 14,
        }}
      >
        {groepen.length === 0 ? (
          <div
            style={styles.panel}
          >
            <div
              style={styles.empty}
            >
              Geen leerlingen gevonden
              met deze filters.
            </div>
          </div>
        ) : (
          groepen.map(
            ({
              klas,
              leerlingen:
                leerlingenVanKlas,
            }) => {
              const aantalGeselecteerd =
                leerlingenVanKlas.filter(
                  (leerling) =>
                    selectedEmails.has(
                      leerling.email
                    )
                ).length;

              const percentage =
                leerlingenVanKlas.length >
                0
                  ? Math.round(
                      (aantalGeselecteerd /
                        leerlingenVanKlas.length) *
                        100
                    )
                  : 0;

              return (
                <article
                  key={klas}
                  style={
                    styles.panel
                  }
                >
                  <div
                    className="class-header"
                    style={
                      styles.classHeader
                    }
                  >
                    <div>
                      <h3
                        style={
                          styles.classTitle
                        }
                      >
                        {klas}
                      </h3>

                      <div
                        style={
                          styles.muted
                        }
                      >
                        {
                          aantalGeselecteerd
                        }{" "}
                        van{" "}
                        {
                          leerlingenVanKlas.length
                        }{" "}
                        geselecteerd
                      </div>
                    </div>

                    <div
                      style={
                        styles.actionsRow
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          selecteerKlas(
                            leerlingenVanKlas
                          )
                        }
                        style={
                          styles.smallButton
                        }
                      >
                        Hele klas selecteren
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          wisKlas(
                            leerlingenVanKlas
                          )
                        }
                        style={
                          styles.smallButton
                        }
                      >
                        Wis klas
                      </button>
                    </div>
                  </div>

                  <div
                    style={
                      styles.progressTrack
                    }
                  >
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div
                    className="student-grid"
                    style={
                      styles.studentGrid
                    }
                  >
                    {leerlingenVanKlas.map(
                      (leerling) => {
                        const checked =
                          selectedEmails.has(
                            leerling.email
                          );

                        return (
                          <button
                            key={
                              leerling.email
                            }
                            type="button"
                            onClick={() =>
                              toggleLeerling(
                                leerling.email
                              )
                            }
                            style={{
                              ...styles.studentCard,
                              ...(checked
                                ? styles.studentCardSelected
                                : {}),
                            }}
                          >
                            <span
                              style={{
                                ...styles.checkbox,
                                ...(checked
                                  ? styles.checkboxSelected
                                  : {}),
                              }}
                            >
                              {checked
                                ? "✓"
                                : ""}
                            </span>

                            <span
                              style={
                                styles.studentInfo
                              }
                            >
                              <strong
                                style={{
                                  color:
                                    ui.text,
                                }}
                              >
                                {
                                  leerling.naam
                                }
                              </strong>

                              <span
                                style={
                                  styles.studentMeta
                                }
                              >
                                {
                                  leerling.email
                                }
                              </span>
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </article>
              );
            }
          )
        )}
      </section>

      {/* SAVE BAR */}

      <div
        className="snow-savebar"
        style={styles.saveBar}
      >
        <div>
          <strong
            style={{
              color: ui.text,
            }}
          >
            {selectedCount} deelnemers
            geselecteerd
          </strong>

          <div
            style={styles.muted}
          >
            {unsavedChanges
              ? "Er zijn wijzigingen die nog niet opgeslagen zijn."
              : "Alle wijzigingen zijn opgeslagen."}
          </div>
        </div>

        <div
          style={
            styles.actionsRow
          }
        >
          {unsavedChanges ? (
            <button
              type="button"
              onClick={
                annuleerWijzigingen
              }
              disabled={saving}
              style={
                styles.secondaryButton
              }
            >
              Annuleren
            </button>
          ) : null}

          <button
            type="button"
            onClick={saveChanges}
            disabled={
              !unsavedChanges ||
              saving
            }
            style={{
              ...styles.primaryButton,
              opacity:
                !unsavedChanges ||
                saving
                  ? 0.55
                  : 1,
            }}
          >
            {saving
              ? "Opslaan..."
              : "Wijzigingen opslaan"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .snowstats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .student-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .snow-filters {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .snowstats-grid {
            grid-template-columns: 1fr !important;
          }

          .student-grid {
            grid-template-columns: 1fr !important;
          }

          .graad-buttons {
            grid-template-columns: 1fr !important;
          }

          .class-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .snow-savebar {
            align-items: stretch !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </AppShell>
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

  h2: {
    margin: 0,
    color: ui.text,
    fontSize: 20,
    fontWeight: 900,
  },

  muted: {
    margin: "4px 0 0",
    color: ui.muted,
    fontSize: 13,
    lineHeight: 1.55,
  },

  error: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    color: ui.text,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
  },

  success: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    color: ui.text,
    background: ui.successBg,
    border: `1px solid ${ui.successBorder}`,
  },

  statsGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },

  statCard: {
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },

  statValue: {
    color: ui.text,
    fontSize: 25,
    fontWeight: 900,
  },

  statLabel: {
    marginTop: 4,
    color: ui.muted,
    fontSize: 12,
    fontWeight: 700,
  },

  filterBlock: {
    marginTop: 18,
  },

  filterLabel: {
    marginBottom: 7,
    color: ui.muted,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  graadButtons: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  filterButton: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "13px 14px",
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.22)",
    color: ui.text,
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 900,
  },

  filterButtonActive: {
    border:
      "1px solid rgba(137,194,170,0.58)",
    background:
      "linear-gradient(180deg, rgba(75,142,141,0.25), rgba(37,89,113,0.17))",
    boxShadow:
      "0 10px 24px rgba(0,0,0,0.18)",
  },

  buttonSub: {
    color: ui.muted,
    fontSize: 11,
    fontWeight: 600,
  },

  filtersGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 2fr) minmax(220px, 1fr)",
    gap: 12,
  },

  field: {
    display: "grid",
  },

  input: {
    width: "100%",
    minHeight: 44,
    padding: "0 12px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.26)",
    color: ui.text,
    outline: "none",
  },

  actionsRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  secondaryButton: {
    minHeight: 40,
    padding: "0 13px",
    borderRadius: 13,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.25)",
    color: ui.text,
    fontWeight: 800,
    cursor: "pointer",
  },

  smallButton: {
    minHeight: 36,
    padding: "0 11px",
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.24)",
    color: ui.text,
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },

  primaryButton: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 14,
    border:
      "1px solid rgba(137,194,170,0.45)",
    background:
      "linear-gradient(135deg, rgba(37,89,113,0.98), rgba(75,142,141,0.98))",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  classHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 12,
  },

  classTitle: {
    margin: 0,
    color: ui.text,
    fontSize: 19,
    fontWeight: 900,
  },

  progressTrack: {
    height: 7,
    marginTop: 14,
    borderRadius: 999,
    overflow: "hidden",
    background:
      "rgba(255,255,255,0.08)",
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, #255971, #4B8E8D, #89C2AA)",
    transition:
      "width 180ms ease",
  },

  studentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 9,
    marginTop: 14,
  },

  studentCard: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 15,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.20)",
    textAlign: "left",
    cursor: "pointer",
  },

  studentCardSelected: {
    border:
      "1px solid rgba(137,194,170,0.56)",
    background:
      "rgba(75,142,141,0.17)",
  },

  checkbox: {
    flex: "0 0 auto",
    width: 24,
    height: 24,
    display: "grid",
    placeItems: "center",
    borderRadius: 8,
    border:
      "1px solid rgba(255,255,255,0.22)",
    background:
      "rgba(0,0,0,0.22)",
    color: "white",
    fontSize: 14,
    fontWeight: 900,
  },

  checkboxSelected: {
    background:
      "linear-gradient(135deg, #255971, #4B8E8D)",
    border:
      "1px solid rgba(137,194,170,0.70)",
  },

  studentInfo: {
    minWidth: 0,
    display: "grid",
    gap: 3,
  },

  studentMeta: {
    color: ui.muted,
    fontSize: 10,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  empty: {
    color: ui.muted,
    textAlign: "center",
    padding: 20,
  },

  saveBar: {
    position: "sticky",
    bottom: 12,
    zIndex: 20,
    marginTop: 18,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 14,
    borderRadius: 20,
    border:
      "1px solid rgba(137,194,170,0.28)",
    background:
      "linear-gradient(180deg, rgba(10,18,25,0.96), rgba(4,10,16,0.96))",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.40)",
    backdropFilter: "blur(14px)",
  },
};