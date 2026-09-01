"use client";

import AppShell from "@/components/AppShell";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* =========================================================
   CONSTANTEN
========================================================= */

const SCHOOLJAAR = "2026-2027";
const SPORTDAG_DATUM_ISO = "2026-09-15";
const MAX_KOERS_GOLF = 20;

type Activiteit67 = "donk" | "koers_golf";

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

type BestaandeKeuze = {
  heen: string | null;
  terug: string | null;
  activiteit: string | null;
};

/* =========================================================
   UI
========================================================= */

const ui = {
  text: "rgba(234,240,255,0.94)",
  muted: "rgba(234,240,255,0.70)",
  border: "rgba(255,255,255,0.12)",
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
    vertrek: ["Verzamelen om 8.05 uur op de overdekte speelplaats."],
    terug: ["Einde om 16.00 uur op school."],
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
    activiteiten: "Expeditie Robinson • Raften • Golfsurfen • …",
    vertrek: [
      "Verzamelen om 8.05 uur.",
      "Op de Parking van de Toekomst, ter hoogte van de fietsenstalling.",
    ],
    terug: ["Vermoedelijke aankomst op school om 17.30 uur."],
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
    activiteiten: "Padel • Teambuilding • Kickboks • Bumball • Arrow Tag",
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
    eten: ["Breng je lunchpakket en voldoende water mee."],
    veiligheid: [
      "Volg de richtlijnen van de lesgevers.",
      "Niemand verlaat de groep.",
    ],
    extra: {
      titel: "Koersrit + golfinitiatie",
      beschrijving:
        "Koersrit van ongeveer 75 km in de voormiddag en golfinitiatie in de namiddag bij Golf Oudenaarde. Er zijn maximaal 20 plaatsen beschikbaar.",
      vertrek: ["Verzamelen om 8.55 uur aan de fietsenstalling."],
      terug: ["Terug op school rond 16.15 uur."],
      kledij: [
        "Een fietshelm is verplicht.",
        "Enkel voor leerlingen die de afstand aankunnen.",
        "De afstand wordt uitsluitend met een koersfiets afgelegd.",
        "Na het fietsen is er mogelijkheid om te douchen.",
        "Breng zeker een fietsslot mee.",
      ],
      eten: ["Lunch wordt voorzien in het Centrum Ronde van Vlaanderen."],
    },
  },
];

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

function getLeerjaar(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return null;

  const match = String(value).trim().match(/[1-7]/);
  return match ? Number(match[0]) : null;
}

function isReminderPeriode() {
  const nu = new Date();
  const sportdag = new Date(`${SPORTDAG_DATUM_ISO}T00:00:00`);
  const reminderStart = new Date(sportdag);
  reminderStart.setDate(reminderStart.getDate() - 7);

  const eindeSportdag = new Date(sportdag);
  eindeSportdag.setHours(23, 59, 59, 999);

  return nu >= reminderStart && nu <= eindeSportdag;
}

/* =========================================================
   PAGINA
========================================================= */

export default function SportdagenPage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLeerjaar, setPreviewLeerjaar] = useState<number | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("profielen")
          .select("id, volledige_naam, rol, leerjaar")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profiel laden mislukt:", error);
          return;
        }

        setProfiel(data);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const leerjaar = getLeerjaar(profiel?.leerjaar);
  const rol = normalizeRole(profiel?.rol);
  const isLeerling = rol === "leerling";

  const isLeerkracht = rol === "leerkracht";
  const isLoLeerkracht =
    rol === "lo_leerkracht" || rol === "leerkracht_lo";

  const kanPreviewen = isLeerkracht || isLoLeerkracht;
  const previewActief = kanPreviewen && previewLeerjaar !== null;

  const magAllesZien =
    isLeerkracht ||
    isLoLeerkracht ||
    rol === "administratief_personeel" ||
    rol === "admin";

  const effectiefLeerjaar = previewActief ? previewLeerjaar : leerjaar;
  const leerlingWeergave = isLeerling || previewActief;

  const zichtbareSportdagen = useMemo(() => {
    if (!profiel) return [];

    if (previewActief && previewLeerjaar) {
      return sportdagen.filter((sportdag) =>
        sportdag.leerjaren.includes(previewLeerjaar)
      );
    }

    if (magAllesZien) return sportdagen;

    if (isLeerling && leerjaar) {
      return sportdagen.filter((sportdag) =>
        sportdag.leerjaren.includes(leerjaar)
      );
    }

    return [];
  }, [profiel, previewActief, previewLeerjaar, magAllesZien, isLeerling, leerjaar]);

  if (loading) {
    return (
      <AppShell
        title="KA LO App"
        subtitle="GO! Atheneum Avelgem"
        userName={null}
      >
        <style>{css}</style>
        <div className="page-loading">Sportdagen laden...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={profiel?.volledige_naam ?? null}
    >
      <style>{css}</style>

      <main className="sportdagen-page">
        <section className="hero">
          <div className="hero-icon">🏆</div>
          <div className="hero-copy">
            <div className="eyebrow">SCHOOLJAAR 2026–2027</div>
            <h1>Sportdagen</h1>
            <p>
              {leerlingWeergave
                ? previewActief
                  ? `Preview leerlingweergave ${previewLeerjaar}e jaar. Opslaan is uitgeschakeld.`
                  : "Hier vind je alle praktische informatie voor jouw sportdag."
                : "Hier vind je het volledige overzicht van alle sportdagen."}
            </p>
          </div>
        </section>

        {kanPreviewen && (
          <section className="preview-card">
            <div className="preview-copy">
              <div className="preview-icon">👀</div>
              <div>
                <span className="preview-label">LEERLINGWEERGAVE TESTEN</span>
                <h2>Bekijk wat leerlingen zien</h2>
                <p>
                  Kies een leerjaar om de pagina als leerling te bekijken. Je
                  kunt keuzes aanklikken om de werking te testen, maar als
                  leerkracht kun je niets opslaan.
                </p>
              </div>
            </div>

            <div className="preview-buttons">
              <button
                type="button"
                className={`preview-button ${previewLeerjaar === null ? "active" : ""}`}
                onClick={() => setPreviewLeerjaar(null)}
              >
                Alle sportdagen
              </button>

              {[1, 2, 3, 4, 5, 6, 7].map((jaar) => (
                <button
                  key={jaar}
                  type="button"
                  className={`preview-button ${previewLeerjaar === jaar ? "active" : ""}`}
                  onClick={() => setPreviewLeerjaar(jaar)}
                >
                  {jaar}e jaar
                </button>
              ))}
            </div>

            {previewActief && (
              <div className="preview-warning">
                <span>🔒</span>
                <div>
                  <strong>Previewmodus actief</strong>
                  <p>
                    Je bekijkt nu de leerlingweergave van het {previewLeerjaar}e jaar.
                    Opslaan is voor leerkrachten volledig uitgeschakeld.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {isLeerling && !leerjaar && (
          <div className="notice error">
            We konden je leerjaar niet bepalen. Controleer je profiel of neem
            contact op met een leerkracht.
          </div>
        )}

        <div className="sportdagen-list">
          {zichtbareSportdagen.map((sportdag) => (
            <SportdagCard
              key={sportdag.jaar}
              sportdag={sportdag}
              profiel={profiel}
              isLeerling={leerlingWeergave}
              leerjaar={effectiefLeerjaar}
              previewMode={previewActief}
            />
          ))}
        </div>

        <section className="absence-card">
          <div className="absence-icon">ℹ️</div>
          <div>
            <h2>Afwezig op de sportdag?</h2>
            <p>
              Wie afwezig is op de sportdag dient een doktersattest in.
              Gekwetste leerlingen nemen vooraf contact op met de
              verantwoordelijke LO-leerkracht.
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
  previewMode,
}: {
  sportdag: Sportdag;
  profiel: Profiel | null;
  isLeerling: boolean;
  leerjaar: number | null;
  previewMode: boolean;
}) {
  return (
    <article className="sportdag-card">
      <div className="card-head">
        <div>
          <span className="sportdag-label">SPORTDAG</span>
          <h2>{sportdag.jaar}</h2>
        </div>
        <div className="sportdag-emoji">{sportdag.emoji}</div>
      </div>

      <div className="main-info">
        <h3>{sportdag.titel}</h3>
        <div className="location">📍 {sportdag.locatie}</div>
        <div className="date">📅 {sportdag.datum}</div>

        {sportdag.activiteiten && (
          <div className="activity-strip">⚡ {sportdag.activiteiten}</div>
        )}
      </div>

      <div className="info-grid">
        <InfoBlock icon="🕐" title="Vertrek" items={sportdag.vertrek} />
        <InfoBlock icon="🏁" title="Terug" items={sportdag.terug} />
        <InfoBlock icon="👕" title="Wat meenemen?" items={sportdag.kledij} />
        <InfoBlock icon="🥪" title="Eten & drinken" items={sportdag.eten} />
      </div>

      <div className="safety-card">
        <div className="block-title">
          🛡️ <strong>Veiligheid</strong>
        </div>
        <ul>
          {sportdag.veiligheid.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {sportdag.extra && (
        <div className="extra-card">
          <span className="extra-label">EXTRA KEUZE · MAX. 20 LEERLINGEN</span>
          <h3>🚴 {sportdag.extra.titel}</h3>

          {sportdag.extra.beschrijving && (
            <p className="extra-description">
              {sportdag.extra.beschrijving}
            </p>
          )}

          <div className="info-grid extra-grid">
            {sportdag.extra.vertrek && (
              <InfoBlock
                icon="🕐"
                title="Vertrek"
                items={sportdag.extra.vertrek}
              />
            )}
            {sportdag.extra.terug && (
              <InfoBlock
                icon="🏁"
                title="Terug"
                items={sportdag.extra.terug}
              />
            )}
            {sportdag.extra.kledij && (
              <InfoBlock
                icon="🚴‍♂️"
                title="Belangrijk"
                items={sportdag.extra.kledij}
              />
            )}
            {sportdag.extra.eten && (
              <InfoBlock
                icon="🥪"
                title="Lunch"
                items={sportdag.extra.eten}
              />
            )}
          </div>

          <div className="golf-card">
            <strong>⛳ Dresscode golfinitiatie</strong>
            <p>
              Voor de golfinitiatie wordt nette en verzorgde golfkledij
              verwacht. Joggingbroeken, slippers, sandalen en strandkledij zijn
              niet toegestaan.
            </p>
          </div>
        </div>
      )}

      {isLeerling &&
        profiel &&
        leerjaar &&
        sportdag.vervoerKeuze && (
          <SportdagKeuze
            leerlingId={profiel.id}
            leerjaar={leerjaar}
            isZesdeOfZevende={sportdag.leerjaren.includes(6)}
            previewMode={previewMode}
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
        <span>{icon}</span>
        <strong>{title}</strong>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================
   SPORTDAG- EN VERVOERSKEUZE
========================================================= */

function SportdagKeuze({
  leerlingId,
  leerjaar,
  isZesdeOfZevende,
  previewMode,
}: {
  leerlingId: string;
  leerjaar: number;
  isZesdeOfZevende: boolean;
  previewMode: boolean;
}) {
  const [activiteit, setActiviteit] = useState<Activiteit67>("donk");
  const [heen, setHeen] = useState("");
  const [terug, setTerug] = useState("");
  const [koersGolfAantal, setKoersGolfAantal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const reminderActief = isReminderPeriode();
  const kiestKoersGolf = isZesdeOfZevende && activiteit === "koers_golf";
  const koersGolfVolzet =
    isZesdeOfZevende && koersGolfAantal >= MAX_KOERS_GOLF;
  const vrijePlaatsen = Math.max(0, MAX_KOERS_GOLF - koersGolfAantal);

  async function refreshKoersGolfAantal() {
    if (!isZesdeOfZevende) return;

    const { data, error } = await supabase.rpc(
      "get_sportdag_koers_golf_count",
      { p_schooljaar: SCHOOLJAAR }
    );

    if (error) {
      console.error("Aantal koers + golf laden mislukt:", error);
      return;
    }

    const count = Number(data ?? 0);
    setKoersGolfAantal(Number.isFinite(count) ? count : 0);
  }

  useEffect(() => {
    async function loadChoice() {
      setLoading(true);
      setErrorMessage("");

      if (previewMode) {
        setActiviteit("donk");
        setHeen("");
        setTerug("");
        setSaved(false);

        if (isZesdeOfZevende) {
          await refreshKoersGolfAantal();
        }

        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("sportdag_vervoer")
        .select("heen, terug, activiteit")
        .eq("leerling_id", leerlingId)
        .eq("schooljaar", SCHOOLJAAR)
        .maybeSingle<BestaandeKeuze>();

      if (error) {
        console.error("Sportdagkeuze laden mislukt:", error);
      }

      if (data) {
        if (isZesdeOfZevende) {
          const bestaandeActiviteit: Activiteit67 =
            data.activiteit === "koers_golf" ? "koers_golf" : "donk";
          setActiviteit(bestaandeActiviteit);
        }
        setHeen(data.heen ?? "");
        setTerug(data.terug ?? "");
        setSaved(true);
      }

      if (isZesdeOfZevende) {
        await refreshKoersGolfAantal();
      }

      setLoading(false);
    }

    loadChoice();
  }, [leerlingId, isZesdeOfZevende, previewMode]);

  function kiesActiviteit(nieuweActiviteit: Activiteit67) {
    if (
      nieuweActiviteit === "koers_golf" &&
      koersGolfVolzet &&
      activiteit !== "koers_golf"
    ) {
      return;
    }

    setActiviteit(nieuweActiviteit);
    setSaved(false);
    setErrorMessage("");

    if (nieuweActiviteit === "koers_golf") {
      setHeen("");
      setTerug("");
    }
  }

  async function saveChoice() {
    if (previewMode) return;

    if (!isZesdeOfZevende && (!heen || !terug)) {
      setErrorMessage("Kies zowel je heenreis als je terugreis.");
      return;
    }

    if (isZesdeOfZevende && activiteit === "donk" && (!heen || !terug)) {
      setErrorMessage(
        "Voor Waterski & Adventure Den Donk moet je zowel je heenreis als je terugreis kiezen."
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setErrorMessage("");

    const { data, error } = await supabase.rpc("save_sportdag_choice", {
      p_schooljaar: SCHOOLJAAR,
      p_leerjaar: leerjaar,
      p_activiteit: isZesdeOfZevende ? activiteit : null,
      p_heen: kiestKoersGolf ? null : heen,
      p_terug: kiestKoersGolf ? null : terug,
    });

    setSaving(false);

    if (error) {
      console.error("Sportdagkeuze opslaan mislukt:", error);

      const message = String(error.message ?? "");

      if (message.includes("KOERS_GOLF_VOLZET")) {
        setErrorMessage(
          "Koersrit + golfinitiatie is ondertussen volzet. Kies Waterski & Adventure Den Donk."
        );
        setActiviteit("donk");
        await refreshKoersGolfAantal();
        return;
      }

      setErrorMessage(
        "Je keuze kon niet worden opgeslagen. Probeer opnieuw."
      );
      return;
    }

    if (isZesdeOfZevende && activiteit === "koers_golf") {
      setHeen("");
      setTerug("");
    }

    setSaved(true);

    if (isZesdeOfZevende) {
      const returnedCount = Number(
        (data as { koers_golf_count?: number } | null)?.koers_golf_count
      );

      if (Number.isFinite(returnedCount)) {
        setKoersGolfAantal(returnedCount);
      } else {
        await refreshKoersGolfAantal();
      }
    }
  }

  if (loading) {
    return <div className="transport-card">Keuze laden...</div>;
  }

  const saveDisabled =
    previewMode ||
    saving ||
    (!kiestKoersGolf && (!heen || !terug)) ||
    (isZesdeOfZevende &&
      activiteit === "koers_golf" &&
      koersGolfVolzet &&
      !saved);

  return (
    <div className="transport-card">
      {previewMode && (
        <div className="transport-preview-notice">
          <span>👀</span>
          <div>
            <strong>Voorbeeld leerlingweergave</strong>
            <p>Je kunt alles aanklikken om te testen. Er wordt niets opgeslagen.</p>
          </div>
        </div>
      )}

      {reminderActief && !saved && !previewMode && (
        <div className="transport-reminder">
          <div className="reminder-icon">⚠️</div>
          <div>
            <strong>Je sportdagkeuze is nog niet opgeslagen</strong>
            <p>
              De sportdag is binnen één week. Sla hieronder je keuze op.
            </p>
          </div>
        </div>
      )}

      {isZesdeOfZevende && (
        <>
          <div className="transport-head activity-choice-head">
            <div className="transport-icon">🏆</div>
            <div>
              <span className="required-label">VERPLICHT IN TE VULLEN</span>
              <h3>Kies je sportdag</h3>
              <p>
                Waterski & Adventure Den Donk is de standaardkeuze. Je kunt
                ook kiezen voor koersrit + golfinitiatie zolang er plaatsen
                beschikbaar zijn.
              </p>
            </div>
          </div>

          <div className="activity-choice-grid">
            <ActivityOption
              selected={activiteit === "donk"}
              emoji="🏄‍♂️"
              title="Waterski & Adventure Den Donk"
              subtitle="Standaard sportdag. Daarna kies je je vervoer heen en terug."
              badge="STANDAARD"
              onClick={() => kiesActiviteit("donk")}
            />

            <ActivityOption
              selected={activiteit === "koers_golf"}
              emoji="🚴"
              title="Koersrit + golfinitiatie"
              subtitle="±75 km koersrit in de voormiddag en golfinitiatie in de namiddag. Geen vervoerskeuze nodig."
              badge={
                activiteit === "koers_golf"
                  ? "JOUW KEUZE"
                  : koersGolfVolzet
                  ? "VOLZET"
                  : `${vrijePlaatsen} PLAATSEN VRIJ`
              }
              disabled={koersGolfVolzet && activiteit !== "koers_golf"}
              onClick={() => kiesActiviteit("koers_golf")}
            />
          </div>

          <div
            className={`capacity-card ${
              koersGolfVolzet ? "capacity-full" : ""
            }`}
          >
            <div className="capacity-top">
              <strong>🚴 Koersrit + golfinitiatie</strong>
              <span>
                {koersGolfAantal} / {MAX_KOERS_GOLF}
              </span>
            </div>
            <div className="capacity-track">
              <div
                className="capacity-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (koersGolfAantal / MAX_KOERS_GOLF) * 100
                  )}%`,
                }}
              />
            </div>
            <small>
              {koersGolfVolzet
                ? "Deze activiteit is volzet."
                : `Nog ${vrijePlaatsen} van de ${MAX_KOERS_GOLF} plaatsen beschikbaar.`}
            </small>
          </div>

          {kiestKoersGolf && (
            <div className="no-transport-card">
              <span>✓</span>
              <div>
                <strong>Geen vervoerskeuze nodig</strong>
                <p>
                  Voor koersrit + golfinitiatie vertrek je om 8.55 uur aan de
                  fietsenstalling en ben je rond 16.15 uur terug op school.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {!kiestKoersGolf && (
        <>
          <div className="transport-head transport-choice-head">
            <div className="transport-icon">🚲</div>
            <div>
              <span className="required-label">VERPLICHT IN TE VULLEN</span>
              <h3>Vervoerskeuze</h3>
              <p>
                Geef aan hoe je naar de sportdag gaat en hoe je terugkeert.
              </p>
            </div>
          </div>

          <div className="transport-section">
            <strong>Heenreis</strong>

            <TransportOption
              selected={heen === "fiets"}
              emoji="🚲"
              title="Met de fiets"
              subtitle="Ik vertrek samen met de fietsgroep."
              onClick={() => {
                setHeen("fiets");
                setSaved(false);
                setErrorMessage("");
              }}
            />

            <TransportOption
              selected={heen === "eigen_vervoer"}
              emoji="🚗"
              title="Eigen vervoer"
              subtitle="Ik ga rechtstreeks naar de locatie."
              onClick={() => {
                setHeen("eigen_vervoer");
                setSaved(false);
                setErrorMessage("");
              }}
            />
          </div>

          <div className="transport-section">
            <strong>Terugreis</strong>

            <TransportOption
              selected={terug === "fiets"}
              emoji="🚲"
              title="Met de fiets terug"
              subtitle="Ik keer samen met de fietsgroep terug."
              onClick={() => {
                setTerug("fiets");
                setSaved(false);
                setErrorMessage("");
              }}
            />

            <TransportOption
              selected={terug === "eigen_vervoer"}
              emoji="🚗"
              title="Opgehaald / zelfstandig naar huis"
              subtitle="Ik keer niet met de fietsgroep terug."
              onClick={() => {
                setTerug("eigen_vervoer");
                setSaved(false);
                setErrorMessage("");
              }}
            />
          </div>
        </>
      )}

      {errorMessage && <div className="transport-error">{errorMessage}</div>}

      <button
        type="button"
        className="save-button"
        disabled={saveDisabled}
        onClick={saveChoice}
      >
        {previewMode
          ? "Preview — opslaan uitgeschakeld"
          : saving
          ? "Opslaan..."
          : saved
          ? "Keuze wijzigen"
          : "Keuze opslaan"}
      </button>

      {saved && !previewMode && (
        <div className="transport-success">
          <span>✓</span>
          <div>
            <strong>
              {kiestKoersGolf
                ? "Je keuze voor koersrit + golfinitiatie is opgeslagen."
                : isZesdeOfZevende
                ? "Je keuze voor Den Donk en je vervoer zijn opgeslagen."
                : "Je vervoerskeuze is opgeslagen."}
            </strong>
            <small>Je kunt je keuze hierboven nog aanpassen.</small>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   KEUZE-OPTIES
========================================================= */

function ActivityOption({
  selected,
  emoji,
  title,
  subtitle,
  badge,
  disabled = false,
  onClick,
}: {
  selected: boolean;
  emoji: string;
  title: string;
  subtitle: string;
  badge: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`activity-option ${selected ? "selected" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="activity-option-top">
        <span className="activity-option-emoji">{emoji}</span>
        <span className="activity-badge">{badge}</span>
      </div>
      <strong>{title}</strong>
      <small>{subtitle}</small>
      <span className="activity-radio">{selected ? "● Gekozen" : "○ Kiezen"}</span>
    </button>
  );
}

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
      className={`transport-option ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <span className="radio">{selected ? "●" : "○"}</span>
      <span className="option-emoji">{emoji}</span>
      <span className="option-copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </button>
  );
}

/* =========================================================
   CSS
========================================================= */

const css = `
  * { box-sizing: border-box; }

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

  .sportdagen-list { display: grid; gap: 20px; }

  .hero {
    margin-bottom: 20px;
    padding: 30px;
    border-radius: 28px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(500px 220px at 100% 0%, rgba(137,194,170,0.16), transparent 70%),
      linear-gradient(135deg, rgba(37,89,113,0.48), rgba(75,142,141,0.26));
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

  .sportdag-card {
    overflow: hidden;
    border-radius: 27px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(700px 260px at 100% 0%, rgba(75,142,141,0.10), transparent 70%),
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

  .sportdag-label { color: ${ui.muted}; }

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

  .main-info { padding: 16px 24px 20px; }

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

  .extra-card {
    margin: 0 24px 24px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(75,142,141,0.23);
    background: rgba(75,142,141,0.07);
  }

  .extra-label { color: rgba(137,194,170,0.92); }

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

  .extra-grid { padding: 0; }

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

  .transport-card {
    margin: 0 24px 24px;
    padding: 20px;
    border-radius: 22px;
    border: 1px solid rgba(137,194,170,0.25);
    background: linear-gradient(135deg, rgba(37,89,113,0.20), rgba(75,142,141,0.11));
  }

  .transport-reminder {
    margin-bottom: 20px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(251,191,36,0.32);
    background: linear-gradient(135deg, rgba(251,191,36,0.13), rgba(245,158,11,0.06));
    display: flex;
    align-items: flex-start;
    gap: 12px;
    box-shadow: 0 8px 26px rgba(0,0,0,0.12);
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

  .transport-choice-head { margin-top: 22px; }
  .activity-choice-head { margin-bottom: 16px; }

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

  .required-label { color: #fcd34d; }

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

  .activity-choice-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .activity-option {
    min-height: 190px;
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.035);
    color: ${ui.text};
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
  }

  .activity-option:hover:not(:disabled) {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.055);
  }

  .activity-option.selected {
    border-color: rgba(137,194,170,0.55);
    background: rgba(137,194,170,0.12);
    box-shadow: inset 0 0 0 1px rgba(137,194,170,0.08);
  }

  .activity-option.disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  .activity-option-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .activity-option-emoji { font-size: 28px; }

  .activity-badge {
    padding: 6px 8px;
    border-radius: 999px;
    border: 1px solid rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.08);
    color: #b7e7d1;
    font-size: 9px;
    line-height: 1;
    font-weight: 1000;
    letter-spacing: 0.7px;
  }

  .activity-option > strong {
    font-size: 14px;
    line-height: 1.35;
  }

  .activity-option > small {
    margin-top: 7px;
    color: ${ui.muted};
    font-size: 11px;
    line-height: 1.5;
  }

  .activity-radio {
    margin-top: auto;
    padding-top: 16px;
    color: #9bd7bc;
    font-size: 11px;
    font-weight: 950;
  }

  .capacity-card {
    margin-top: 12px;
    padding: 13px 14px;
    border-radius: 16px;
    border: 1px solid rgba(137,194,170,0.16);
    background: rgba(137,194,170,0.05);
  }

  .capacity-card.capacity-full {
    border-color: rgba(248,113,113,0.20);
    background: rgba(248,113,113,0.06);
  }

  .capacity-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
  }

  .capacity-top span {
    color: #b7e7d1;
    font-weight: 1000;
  }

  .capacity-track {
    height: 7px;
    margin-top: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
  }

  .capacity-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(137,194,170,0.74), rgba(75,142,141,0.94));
  }

  .capacity-card small {
    display: block;
    margin-top: 7px;
    color: ${ui.muted};
    font-size: 10px;
  }

  .no-transport-card {
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid rgba(34,197,94,0.20);
    background: rgba(34,197,94,0.08);
    color: #86efac;
  }

  .no-transport-card > span { font-weight: 1000; }

  .no-transport-card strong {
    display: block;
    font-size: 12px;
  }

  .no-transport-card p {
    margin: 4px 0 0;
    color: rgba(134,239,172,0.76);
    font-size: 11px;
    line-height: 1.5;
  }

  .transport-section { margin-top: 20px; }

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
    transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
  }

  .transport-option:hover { background: rgba(255,255,255,0.06); }

  .transport-option.selected {
    border-color: rgba(137,194,170,0.46);
    background: rgba(137,194,170,0.11);
  }

  .radio {
    width: 19px;
    font-size: 17px;
    color: #9bd7bc;
  }

  .option-emoji { font-size: 21px; }
  .option-copy { min-width: 0; }
  .option-copy strong,
  .option-copy small { display: block; }
  .option-copy strong { font-size: 13px; }

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
    background: linear-gradient(135deg, rgba(37,89,113,0.82), rgba(75,142,141,0.62));
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
  .transport-success small { display: block; }
  .transport-success strong { font-size: 12px; }

  .transport-success small {
    margin-top: 2px;
    color: rgba(134,239,172,0.75);
    font-size: 10px;
  }

  .transport-error {
    margin-top: 12px;
    padding: 11px 12px;
    border-radius: 13px;
    border: 1px solid rgba(248,113,113,0.20);
    background: rgba(248,113,113,0.07);
    color: #fca5a5;
    font-size: 12px;
    font-weight: 800;
  }

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

  @media (max-width: 700px) {
    .sportdagen-page { padding: 14px 12px 45px; }

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

    .hero h1 { font-size: 31px; }

    .preview-button { flex: 1 1 calc(25% - 7px); min-width: 78px; }

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

    .activity-choice-grid { grid-template-columns: 1fr; }
  }
`;
