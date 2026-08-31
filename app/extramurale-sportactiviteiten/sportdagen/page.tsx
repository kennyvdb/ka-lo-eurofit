"use client";

import AppShell from "@/components/AppShell";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================================================
   CONSTANTEN
========================================================= */

const SCHOOLJAAR = "2026-2027";

/*
  Sportdag = 15 september 2026.
  Reminder start automatisch 7 dagen eerder:
  8 september 2026.
*/
const SPORTDAG_DATUM_ISO = "2026-09-15";

/* =========================================================
   TYPES
========================================================= */

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  leerjaar: number | string | null;
};

type Sportdag = {
  jaar: string;
  leerjaren: number[];
  datum: string;
  titel: string;
  locatie: string;
  emoji: string;

  vertrek: string[];
  terug: string[];
  kledij: string[];
  eten: string[];
  veiligheid: string[];

  vervoerKeuze?: boolean;

  activiteiten?: string;

  extra?: {
    titel: string;
    beschrijving?: string;
    vertrek?: string[];
    terug?: string[];
    kledij?: string[];
    eten?: string[];
  };
};

/* =========================================================
   UI
========================================================= */

const ui = {
  text: "rgba(234,240,255,0.94)",
  muted: "rgba(234,240,255,0.70)",
  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",
  glass: "rgba(6,12,20,0.48)",
};

/* =========================================================
   SPORTDAGEN
========================================================= */

const sportdagen: Sportdag[] = [
  {
    jaar: "1e jaar",
    leerjaren: [1],
    datum: "Dinsdag 15 september 2026",
    titel: "Waterpark",
    locatie: "Jabbeke",
    emoji: "🌊",

    vertrek: [
      "Verzamelen om 8.40 uur op de overdekte speelplaats.",
      "Vertrek om 8.50 uur aan de Ganzenhofstraat, achterkant van de school.",
    ],

    terug: [
      "Einde om 16.00 uur aan de Ganzenhofstraat, achterkant van de school.",
    ],

    kledij: [
      "Sportieve kledij en sportschoenen.",
      "Zwemgerief en handdoek.",
      "Reservekledij en reserveschoenen.",
      "Zonnecrème.",
      "Kledij aangepast aan de weersomstandigheden.",
    ],

    eten: [
      "Breng zelf een lunchpakket mee.",
      "Neem voldoende water mee voor de hele dag.",
    ],

    veiligheid: [
      "Volg de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
      "Gooi afval in de voorziene vuilniszakken.",
    ],
  },

  {
    jaar: "2e jaar",
    leerjaren: [2],
    datum: "Dinsdag 15 september 2026",
    titel: "Tsjaka",
    locatie: "Ronse",
    emoji: "🧗",

    vertrek: [
      "Verzamelen om 8.05 uur op de overdekte speelplaats.",
    ],

    terug: [
      "Einde om 16.00 uur op school.",
    ],

    kledij: [
      "Sportieve kledij en sportschoenen.",
      "Reservekledij en reserveschoenen.",
      "Voorzie ook regenkledij.",
    ],

    eten: [
      "Breng je lunchpakket mee.",
      "Neem voldoende water mee voor de hele dag.",
    ],

    veiligheid: [
      "Volg stipt de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
    ],
  },

  {
    jaar: "3e jaar",
    leerjaren: [3],
    datum: "Dinsdag 15 september 2026",
    titel: "Adventure De Gavers",
    locatie: "Harelbeke",
    emoji: "🚴",
    vervoerKeuze: true,

    vertrek: [
      "Met de fiets: om 8.15 uur aan de fietsenstalling.",
      "Eigen vervoer: om 8.30 uur aan parking Eikenstraat van Provinciedomein De Gavers, ter hoogte van Koutermolen.",
    ],

    terug: [
      "Met de fiets terug op school rond 16.45 uur.",
      "Eigen vervoer: vanaf 15.45 uur opgehaald worden of op eigen verantwoordelijkheid naar huis.",
    ],

    kledij: [
      "Sportieve kledij en sportschoenen.",
      "Kledij aangepast aan de weersomstandigheden.",
      "Reservekledij en reserveschoenen.",
      "Zorg dat je fiets technisch in orde is.",
      "Breng zeker een fietsslot mee.",
    ],

    eten: [
      "Breng je eigen lunchpakket mee.",
      "Neem voldoende water mee voor de hele dag.",
    ],

    veiligheid: [
      "Een fietshelm wordt sterk aangeraden.",
      "Volg stipt de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
    ],
  },

  {
    jaar: "4e jaar",
    leerjaren: [4],
    datum: "Dinsdag 15 september 2026",
    titel: "Zee- en strandsporten",
    locatie: "De Panne",
    emoji: "🏄",

    activiteiten:
      "Expeditie Robinson • Raften • Golfsurfen • …",

    vertrek: [
      "Verzamelen om 8.05 uur.",
      "Op de Parking van de Toekomst, ter hoogte van de fietsenstalling.",
    ],

    terug: [
      "Vermoedelijke aankomst op school om 17.30 uur.",
    ],

    kledij: [
      "Sportieve kledij en sportschoenen.",
      "Kledij aangepast aan de weersomstandigheden.",
      "Reservekledij en reserveschoenen.",
      "Zwemkledij en handdoek.",
      "Zonnecrème afhankelijk van het weer.",
    ],

    eten: [
      "Breng je lunchpakket mee.",
      "Neem voldoende water mee voor de hele dag.",
    ],

    veiligheid: [
      "Niemand verlaat de groep.",
      "Wie om medische redenen niet in het water mag, meldt dit vooraf en bezorgt een doktersattest.",
    ],
  },

  {
    jaar: "5e jaar",
    leerjaren: [5],
    datum: "Dinsdag 15 september 2026",
    titel: "Sport & Teambuilding",
    locatie: "Oudenaarde",
    emoji: "🎯",
    vervoerKeuze: true,

    activiteiten:
      "Padel • Teambuilding • Kickboks • Bumball • Arrow Tag",

    vertrek: [
      "Met de fiets: om 8.15 uur op de parking van Spikkerelle.",
      "Eigen vervoer: om 8.30 uur aan De Recrean in Oudenaarde.",
    ],

    terug: [
      "Met de fiets terug aan Spikkerelle rond 16.30 uur.",
      "Eigen vervoer: vanaf 15.30 uur opgehaald worden of op eigen verantwoordelijkheid naar huis.",
    ],

    kledij: [
      "Sportieve kledij en sportschoenen.",
      "Kledij aangepast aan de weersomstandigheden.",
      "Zorg dat je fiets technisch in orde is.",
      "Breng zeker een fietsslot mee.",
    ],

    eten: [
      "Breng je lunchpakket mee.",
      "Neem voldoende water mee.",
      "Ter plaatse kan eventueel iets gekocht worden.",
    ],

    veiligheid: [
      "Een fietshelm wordt sterk aangeraden.",
      "Volg de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
    ],
  },

  {
    jaar: "6e & 7e jaar",
    leerjaren: [6, 7],
    datum: "Dinsdag 15 september 2026",
    titel: "Waterski & Adventure Donk",
    locatie: "Oudenaarde",
    emoji: "🏄‍♂️",
    vervoerKeuze: true,

    vertrek: [
      "Met de fiets: verzamelen om 8.15 uur op de parking aan kerk/grasveld, Daniël Vermandereplein.",
      "Eigen vervoer: om 8.30 uur aan de parking van Den Donk, Donkstraat in Oudenaarde.",
    ],

    terug: [
      "Met de fiets: vermoedelijke aankomst om 16.30 uur aan Spikkerelle.",
      "Eigen vervoer: vanaf 15.30 uur opgehaald worden of op eigen verantwoordelijkheid naar huis.",
    ],

    kledij: [
      "Sportieve kledij en schoenen die nat en vuil mogen worden.",
      "Zwemkledij en handdoek.",
      "Reservekledij.",
      "Kledij aangepast aan de weersomstandigheden.",
      "Zorg dat je fiets technisch in orde is.",
      "Breng zeker een fietsslot mee.",
    ],

    eten: [
      "Breng je lunchpakket en voldoende water mee.",
    ],

    veiligheid: [
      "Volg de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
    ],

    extra: {
      titel: "Koersrit + golfinitiatie",

      beschrijving:
        "Koersrit van ongeveer 75 km in de voormiddag en golfinitiatie in de namiddag bij Golf Oudenaarde.",

      vertrek: [
        "Verzamelen om 8.55 uur aan de fietsenstalling.",
      ],

      terug: [
        "Terug op school rond 16.15 uur.",
      ],

      kledij: [
        "Een fietshelm is verplicht.",
        "Enkel voor leerlingen die de afstand aankunnen.",
        "De afstand wordt uitsluitend met een koersfiets afgelegd.",
        "Na het fietsen is er mogelijkheid om te douchen.",
        "Breng zeker een fietsslot mee.",
      ],

      eten: [
        "Lunch wordt voorzien in het Centrum Ronde van Vlaanderen.",
      ],
    },
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getLeerjaar(
  value: number | string | null | undefined
) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(
    String(value),
    10
  );

  return Number.isNaN(parsed)
    ? null
    : parsed;
}

/*
  De waarschuwing verschijnt exact 7 dagen voor de sportdag.

  Sportdag:
  15/09/2026

  Reminder vanaf:
  08/09/2026
*/
function isReminderPeriode() {
  const nu = new Date();

  const sportdag = new Date(
    `${SPORTDAG_DATUM_ISO}T00:00:00`
  );

  const reminderStart =
    new Date(sportdag);

  reminderStart.setDate(
    reminderStart.getDate() - 7
  );

  const eindeSportdag =
    new Date(sportdag);

  eindeSportdag.setHours(
    23,
    59,
    59,
    999
  );

  return (
    nu >= reminderStart &&
    nu <= eindeSportdag
  );
}

/* =========================================================
   PAGINA
========================================================= */

export default function SportdagenPage() {
  const [profiel, setProfiel] =
    useState<Profiel | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadProfile() {
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
          data,
          error,
        } = await supabase
          .from("profielen")
          .select(
            "id, volledige_naam, rol, leerjaar"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(
            "Profiel laden mislukt:",
            error
          );

          return;
        }

        setProfiel(data);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const leerjaar =
    getLeerjaar(
      profiel?.leerjaar
    );

  const isLeerling =
    profiel?.rol === "leerling";

  const magAllesZien =
    profiel?.rol === "leerkracht" ||
    profiel?.rol === "lo_leerkracht" ||
    profiel?.rol === "admin";

  const zichtbareSportdagen =
    useMemo(() => {
      if (!profiel) {
        return [];
      }

      if (magAllesZien) {
        return sportdagen;
      }

      if (
        isLeerling &&
        leerjaar
      ) {
        return sportdagen.filter(
          (sportdag) =>
            sportdag.leerjaren.includes(
              leerjaar
            )
        );
      }

      return [];
    }, [
      profiel,
      magAllesZien,
      isLeerling,
      leerjaar,
    ]);

  if (loading) {
    return (
      <AppShell
        title="KA LO App"
        subtitle="GO! Atheneum Avelgem"
        userName={null}
      >
        <style>{css}</style>

        <div className="page-loading">
          Sportdagen laden...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={
        profiel?.volledige_naam ??
        null
      }
    >
      <style>{css}</style>

      <main className="sportdagen-page">
        {/* HERO */}

        <section className="hero">
          <div className="hero-icon">
            🏆
          </div>

          <div className="hero-copy">
            <div className="eyebrow">
              SCHOOLJAAR 2026–2027
            </div>

            <h1>
              Sportdagen
            </h1>

            <p>
              {isLeerling
                ? "Hier vind je alle praktische informatie voor jouw sportdag."
                : "Hier vind je het volledige overzicht van alle sportdagen."}
            </p>
          </div>
        </section>

        {/* GEEN LEERJAAR */}

        {isLeerling &&
          !leerjaar && (
            <div className="notice error">
              We konden je leerjaar
              niet bepalen. Controleer
              je profiel of neem
              contact op met een
              leerkracht.
            </div>
          )}

        {/* SPORTDAGEN */}

        <div className="sportdagen-list">
          {zichtbareSportdagen.map(
            (sportdag) => (
              <SportdagCard
                key={sportdag.jaar}
                sportdag={
                  sportdag
                }
                profiel={
                  profiel
                }
                isLeerling={
                  isLeerling
                }
                leerjaar={
                  leerjaar
                }
              />
            )
          )}
        </div>

        {/* AFWEZIGHEID */}

        <section className="absence-card">
          <div className="absence-icon">
            ℹ️
          </div>

          <div>
            <h2>
              Afwezig op de sportdag?
            </h2>

            <p>
              Wie afwezig is op de
              sportdag dient een
              doktersattest in.
              Gekwetste leerlingen
              nemen vooraf contact op
              met de verantwoordelijke
              LO-leerkracht.
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

/* =========================================================
   SPORTDAG CARD
========================================================= */

function SportdagCard({
  sportdag,
  profiel,
  isLeerling,
  leerjaar,
}: {
  sportdag: Sportdag;
  profiel: Profiel | null;
  isLeerling: boolean;
  leerjaar: number | null;
}) {
  return (
    <article className="sportdag-card">
      <div className="card-head">
        <div>
          <span className="sportdag-label">
            SPORTDAG
          </span>

          <h2>
            {sportdag.jaar}
          </h2>
        </div>

        <div className="sportdag-emoji">
          {sportdag.emoji}
        </div>
      </div>

      <div className="main-info">
        <h3>
          {sportdag.titel}
        </h3>

        <div className="location">
          📍 {sportdag.locatie}
        </div>

        <div className="date">
          📅 {sportdag.datum}
        </div>

        {sportdag.activiteiten && (
          <div className="activity-strip">
            ⚡{" "}
            {sportdag.activiteiten}
          </div>
        )}
      </div>

      <div className="info-grid">
        <InfoBlock
          icon="🕐"
          title="Vertrek"
          items={
            sportdag.vertrek
          }
        />

        <InfoBlock
          icon="🏁"
          title="Terug"
          items={
            sportdag.terug
          }
        />

        <InfoBlock
          icon="👕"
          title="Wat meenemen?"
          items={
            sportdag.kledij
          }
        />

        <InfoBlock
          icon="🥪"
          title="Eten & drinken"
          items={
            sportdag.eten
          }
        />
      </div>

      <div className="safety-card">
        <div className="block-title">
          🛡️
          <strong>
            Veiligheid
          </strong>
        </div>

        <ul>
          {sportdag.veiligheid.map(
            (item) => (
              <li key={item}>
                {item}
              </li>
            )
          )}
        </ul>
      </div>

      {/* EXTRA 6e/7e JAAR */}

      {sportdag.extra && (
        <div className="extra-card">
          <span className="extra-label">
            EXTRA KEUZE
          </span>

          <h3>
            🚴{" "}
            {sportdag.extra.titel}
          </h3>

          {sportdag.extra
            .beschrijving && (
            <p className="extra-description">
              {
                sportdag.extra
                  .beschrijving
              }
            </p>
          )}

          <div className="info-grid extra-grid">
            {sportdag.extra
              .vertrek && (
              <InfoBlock
                icon="🕐"
                title="Vertrek"
                items={
                  sportdag.extra
                    .vertrek
                }
              />
            )}

            {sportdag.extra
              .terug && (
              <InfoBlock
                icon="🏁"
                title="Terug"
                items={
                  sportdag.extra
                    .terug
                }
              />
            )}

            {sportdag.extra
              .kledij && (
              <InfoBlock
                icon="🚴‍♂️"
                title="Belangrijk"
                items={
                  sportdag.extra
                    .kledij
                }
              />
            )}

            {sportdag.extra
              .eten && (
              <InfoBlock
                icon="🥪"
                title="Lunch"
                items={
                  sportdag.extra
                    .eten
                }
              />
            )}
          </div>

          <div className="golf-card">
            <strong>
              ⛳ Dresscode
              golfinitiatie
            </strong>

            <p>
              Voor de golfinitiatie
              wordt nette en
              verzorgde golfkledij
              verwacht.
              Joggingbroeken,
              slippers, sandalen en
              strandkledij zijn niet
              toegestaan.
            </p>
          </div>
        </div>
      )}

      {/* VERVOERSKEUZE ALLEEN LEERLING */}

      {isLeerling &&
        profiel &&
        leerjaar &&
        sportdag.vervoerKeuze && (
          <VervoersKeuze
            leerlingId={
              profiel.id
            }
            leerjaar={
              leerjaar
            }
          />
        )}
    </article>
  );
}

/* =========================================================
   INFO BLOCK
========================================================= */

function InfoBlock({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="info-block">
      <div className="block-title">
        <span>
          {icon}
        </span>

        <strong>
          {title}
        </strong>
      </div>

      <ul>
        {items.map(
          (item) => (
            <li key={item}>
              {item}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

/* =========================================================
   VERVOERSKEUZE
========================================================= */

function VervoersKeuze({
  leerlingId,
  leerjaar,
}: {
  leerlingId: string;
  leerjaar: number;
}) {
  const [heen, setHeen] =
    useState("");

  const [terug, setTerug] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const reminderActief =
    isReminderPeriode();

  useEffect(() => {
    async function loadChoice() {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from(
          "sportdag_vervoer"
        )
        .select("heen, terug")
        .eq(
          "leerling_id",
          leerlingId
        )
        .eq(
          "schooljaar",
          SCHOOLJAAR
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Vervoerskeuze laden mislukt:",
          error
        );
      }

      if (data) {
        setHeen(
          data.heen
        );

        setTerug(
          data.terug
        );

        setSaved(true);
      }

      setLoading(false);
    }

    loadChoice();
  }, [leerlingId]);

  async function saveChoice() {
    if (
      !heen ||
      !terug
    ) {
      setErrorMessage(
        "Kies zowel je heenreis als je terugreis."
      );

      return;
    }

    setSaving(true);
    setSaved(false);
    setErrorMessage("");

    const {
      error,
    } = await supabase
      .from(
        "sportdag_vervoer"
      )
      .upsert(
        {
          leerling_id:
            leerlingId,

          schooljaar:
            SCHOOLJAAR,

          leerjaar,

          heen,

          terug,
        },
        {
          onConflict:
            "leerling_id,schooljaar",
        }
      );

    setSaving(false);

    if (error) {
      console.error(
        "Opslaan mislukt:",
        error
      );

      setErrorMessage(
        "Je keuze kon niet worden opgeslagen. Probeer opnieuw."
      );

      return;
    }

    setSaved(true);
  }

  if (loading) {
    return (
      <div className="transport-card">
        Vervoerskeuze
        laden...
      </div>
    );
  }

  return (
    <div className="transport-card">
      {/* AUTOMATISCHE REMINDER VANAF 08/09/2026 */}

      {reminderActief &&
        !saved && (
          <div className="transport-reminder">
            <div className="reminder-icon">
              ⚠️
            </div>

            <div>
              <strong>
                Je vervoerskeuze
                is nog niet
                ingevuld
              </strong>

              <p>
                De sportdag is
                binnen één week.
                Geef hieronder aan
                hoe je naar de
                sportdag gaat en
                hoe je terugkeert.
              </p>
            </div>
          </div>
        )}

      <div className="transport-head">
        <div className="transport-icon">
          🚲
        </div>

        <div>
          <span className="required-label">
            VERPLICHT IN TE
            VULLEN
          </span>

          <h3>
            Vervoerskeuze
          </h3>

          <p>
            Geef aan hoe je naar
            de sportdag gaat en
            hoe je terugkeert.
          </p>
        </div>
      </div>

      {/* HEEN */}

      <div className="transport-section">
        <strong>
          Heenreis
        </strong>

        <TransportOption
          selected={
            heen === "fiets"
          }
          emoji="🚲"
          title="Met de fiets"
          subtitle="Ik vertrek samen met de fietsgroep."
          onClick={() => {
            setHeen("fiets");
            setSaved(false);
          }}
        />

        <TransportOption
          selected={
            heen ===
            "eigen_vervoer"
          }
          emoji="🚗"
          title="Eigen vervoer"
          subtitle="Ik ga rechtstreeks naar de locatie."
          onClick={() => {
            setHeen(
              "eigen_vervoer"
            );

            setSaved(false);
          }}
        />
      </div>

      {/* TERUG */}

      <div className="transport-section">
        <strong>
          Terugreis
        </strong>

        <TransportOption
          selected={
            terug === "fiets"
          }
          emoji="🚲"
          title="Met de fiets terug"
          subtitle="Ik keer samen met de fietsgroep terug."
          onClick={() => {
            setTerug("fiets");
            setSaved(false);
          }}
        />

        <TransportOption
          selected={
            terug ===
            "eigen_vervoer"
          }
          emoji="🚗"
          title="Opgehaald / zelfstandig naar huis"
          subtitle="Ik keer niet met de fietsgroep terug."
          onClick={() => {
            setTerug(
              "eigen_vervoer"
            );

            setSaved(false);
          }}
        />
      </div>

      {errorMessage && (
        <div className="transport-error">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        className="save-button"
        disabled={
          !heen ||
          !terug ||
          saving
        }
        onClick={
          saveChoice
        }
      >
        {saving
          ? "Opslaan..."
          : saved
          ? "Keuze wijzigen"
          : "Keuze opslaan"}
      </button>

      {saved && (
        <div className="transport-success">
          <span>
            ✓
          </span>

          <div>
            <strong>
              Je vervoerskeuze
              is opgeslagen.
            </strong>

            <small>
              Je kunt je keuze
              hierboven nog
              aanpassen.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   VERVOERSOPTIE
========================================================= */

function TransportOption({
  selected,
  emoji,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`transport-option ${
        selected
          ? "selected"
          : ""
      }`}
      onClick={onClick}
    >
      <span className="radio">
        {selected
          ? "●"
          : "○"}
      </span>

      <span className="option-emoji">
        {emoji}
      </span>

      <span className="option-copy">
        <strong>
          {title}
        </strong>

        <small>
          {subtitle}
        </small>
      </span>
    </button>
  );
}

/* =========================================================
   CSS
========================================================= */

const css = `
  * {
    box-sizing: border-box;
  }

  .page-loading {
    min-height: 55vh;
    display: grid;
    place-items: center;
    color: ${ui.muted};
    font-weight: 850;
  }

  .sportdagen-page {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 18px 60px;
    color: ${ui.text};
  }

  .sportdagen-list {
    display: grid;
    gap: 20px;
  }

  /* HERO */

  .hero {
    margin-bottom: 20px;
    padding: 30px;
    border-radius: 28px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(
        500px 220px at 100% 0%,
        rgba(137,194,170,0.16),
        transparent 70%
      ),
      linear-gradient(
        135deg,
        rgba(37,89,113,0.48),
        rgba(75,142,141,0.26)
      );
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 20px 55px rgba(0,0,0,0.20);
  }

  .hero-icon {
    width: 78px;
    height: 78px;
    flex: 0 0 auto;
    border-radius: 23px;
    display: grid;
    place-items: center;
    font-size: 37px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.06);
  }

  .eyebrow {
    margin-bottom: 5px;
    color: rgba(183,231,209,0.88);
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 1.3px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(32px,5vw,48px);
    font-weight: 1000;
    letter-spacing: -1px;
  }

  .hero p {
    margin: 8px 0 0;
    color: ${ui.muted};
    line-height: 1.55;
  }

  /* NOTICES */

  .notice {
    margin-bottom: 18px;
    padding: 15px;
    border-radius: 16px;
  }

  .notice.error {
    border: 1px solid rgba(248,113,113,0.25);
    background: rgba(248,113,113,0.08);
    color: #fecaca;
  }

  /* SPORTDAG */

  .sportdag-card {
    overflow: hidden;
    border-radius: 27px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(
        700px 260px at 100% 0%,
        rgba(75,142,141,0.10),
        transparent 70%
      ),
      ${ui.glass};
    box-shadow: 0 18px 50px rgba(0,0,0,0.20);
  }

  .card-head {
    padding: 22px 24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sportdag-label,
  .extra-label,
  .required-label {
    font-size: 10px;
    font-weight: 1000;
    letter-spacing: 1.4px;
  }

  .sportdag-label {
    color: ${ui.muted};
  }

  .card-head h2 {
    margin: 2px 0 0;
    font-size: 25px;
    font-weight: 1000;
  }

  .sportdag-emoji {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 27px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.05);
  }

  .main-info {
    padding: 16px 24px 20px;
  }

  .main-info h3 {
    margin: 0;
    font-size: 27px;
    font-weight: 1000;
  }

  .location {
    margin-top: 7px;
    color: ${ui.muted};
    font-weight: 800;
  }

  .date {
    width: fit-content;
    margin-top: 13px;
    padding: 9px 13px;
    border-radius: 999px;
    background: rgba(137,194,170,0.08);
    border: 1px solid rgba(137,194,170,0.17);
    font-size: 12px;
    font-weight: 900;
  }

  .activity-strip {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 15px;
    border: 1px solid rgba(75,142,141,0.18);
    background: rgba(75,142,141,0.07);
    color: rgba(220,244,240,0.90);
    font-size: 12px;
    font-weight: 800;
  }

  /* INFO */

  .info-grid {
    padding: 0 24px 24px;
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 10px;
  }

  .info-block {
    padding: 15px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.035);
  }

  .block-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .info-block ul,
  .safety-card ul {
    margin: 0;
    padding-left: 17px;
  }

  .info-block li,
  .safety-card li {
    margin: 5px 0;
    color: ${ui.muted};
    font-size: 12px;
    line-height: 1.5;
  }

  .safety-card {
    margin: 0 24px 24px;
    padding: 15px;
    border-radius: 18px;
    border: 1px solid rgba(137,194,170,0.15);
    background: rgba(137,194,170,0.05);
  }

  /* EXTRA */

  .extra-card {
    margin: 0 24px 24px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(75,142,141,0.23);
    background: rgba(75,142,141,0.07);
  }

  .extra-label {
    color: rgba(137,194,170,0.92);
  }

  .extra-card h3 {
    margin: 5px 0;
    font-size: 19px;
  }

  .extra-description {
    margin: 7px 0 17px;
    color: ${ui.muted};
    line-height: 1.5;
    font-size: 13px;
  }

  .extra-grid {
    padding: 0;
  }

  .golf-card {
    margin-top: 12px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.10);
  }

  .golf-card p {
    margin: 6px 0 0;
    color: ${ui.muted};
    font-size: 12px;
    line-height: 1.55;
  }

  /* TRANSPORT */

  .transport-card {
    margin: 0 24px 24px;
    padding: 20px;
    border-radius: 22px;
    border: 1px solid rgba(137,194,170,0.25);
    background:
      linear-gradient(
        135deg,
        rgba(37,89,113,0.20),
        rgba(75,142,141,0.11)
      );
  }

  /* REMINDER */

  .transport-reminder {
    margin-bottom: 20px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(251,191,36,0.32);
    background:
      linear-gradient(
        135deg,
        rgba(251,191,36,0.13),
        rgba(245,158,11,0.06)
      );
    display: flex;
    align-items: flex-start;
    gap: 12px;
    box-shadow:
      0 8px 26px rgba(0,0,0,0.12);
  }

  .reminder-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 13px;
    display: grid;
    place-items: center;
    background: rgba(251,191,36,0.10);
    border: 1px solid rgba(251,191,36,0.18);
    font-size: 20px;
  }

  .transport-reminder strong {
    display: block;
    color: #fde68a;
    font-size: 14px;
    font-weight: 1000;
  }

  .transport-reminder p {
    margin: 5px 0 0;
    color: rgba(253,230,138,0.80);
    font-size: 12px;
    line-height: 1.55;
  }

  .transport-head {
    display: flex;
    align-items: flex-start;
    gap: 13px;
  }

  .transport-icon {
    width: 48px;
    height: 48px;
    flex: 0 0 auto;
    border-radius: 15px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    font-size: 23px;
  }

  .required-label {
    color: #fcd34d;
  }

  .transport-head h3 {
    margin: 3px 0 0;
    font-size: 20px;
  }

  .transport-head p {
    margin: 5px 0 0;
    color: ${ui.muted};
    font-size: 12px;
    line-height: 1.5;
  }

  .transport-section {
    margin-top: 20px;
  }

  .transport-section > strong {
    display: block;
    margin-bottom: 9px;
    font-size: 13px;
  }

  .transport-option {
    width: 100%;
    margin-top: 7px;
    padding: 13px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.035);
    color: ${ui.text};
    text-align: left;
    display: flex;
    align-items: center;
    gap: 11px;
    cursor: pointer;
    transition:
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease;
  }

  .transport-option:hover {
    background: rgba(255,255,255,0.06);
  }

  .transport-option.selected {
    border-color: rgba(137,194,170,0.46);
    background: rgba(137,194,170,0.11);
  }

  .radio {
    width: 19px;
    font-size: 17px;
    color: #9bd7bc;
  }

  .option-emoji {
    font-size: 21px;
  }

  .option-copy {
    min-width: 0;
  }

  .option-copy strong,
  .option-copy small {
    display: block;
  }

  .option-copy strong {
    font-size: 13px;
  }

  .option-copy small {
    margin-top: 3px;
    color: ${ui.muted};
    line-height: 1.4;
  }

  .save-button {
    width: 100%;
    min-height: 48px;
    margin-top: 20px;
    border: 1px solid rgba(137,194,170,0.35);
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        rgba(37,89,113,0.82),
        rgba(75,142,141,0.62)
      );
    color: white;
    font-weight: 950;
    cursor: pointer;
  }

  .save-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .transport-success {
    margin-top: 11px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(34,197,94,0.10);
    border: 1px solid rgba(34,197,94,0.20);
    color: #86efac;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .transport-success strong,
  .transport-success small {
    display: block;
  }

  .transport-success strong {
    font-size: 12px;
  }

  .transport-success small {
    margin-top: 2px;
    color: rgba(134,239,172,0.75);
    font-size: 10px;
  }

  .transport-error {
    margin-top: 12px;
    color: #fca5a5;
    font-size: 12px;
    font-weight: 800;
  }

  /* AFWEZIG */

  .absence-card {
    margin-top: 20px;
    padding: 20px;
    border-radius: 22px;
    border: 1px solid rgba(255,193,102,0.18);
    background: rgba(255,193,102,0.055);
    display: flex;
    gap: 14px;
  }

  .absence-icon {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 14px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,193,102,0.18);
    background: rgba(255,193,102,0.07);
  }

  .absence-card h2 {
    margin: 0;
    font-size: 17px;
  }

  .absence-card p {
    margin: 6px 0 0;
    color: ${ui.muted};
    font-size: 13px;
    line-height: 1.55;
  }

  /* MOBILE */

  @media (max-width: 700px) {
    .sportdagen-page {
      padding: 14px 12px 45px;
    }

    .hero {
      padding: 21px 18px;
      border-radius: 23px;
      align-items: flex-start;
    }

    .hero-icon {
      width: 55px;
      height: 55px;
      border-radius: 17px;
      font-size: 27px;
    }

    .hero h1 {
      font-size: 31px;
    }

    .info-grid {
      grid-template-columns: 1fr;
      padding-left: 17px;
      padding-right: 17px;
    }

    .card-head,
    .main-info {
      padding-left: 17px;
      padding-right: 17px;
    }

    .safety-card,
    .transport-card,
    .extra-card {
      margin-left: 17px;
      margin-right: 17px;
    }
  }
`;