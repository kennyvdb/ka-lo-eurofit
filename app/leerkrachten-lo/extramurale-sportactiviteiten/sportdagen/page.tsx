"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const SCHOOLJAAR_SPORTDAG = "2026-2027";
const LEERJAREN_MET_VERVOERSKEUZE = [3, 5, 6, 7];
const MAX_KOERS_GOLF = 20;

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
  koppeling: "smartschool_profiel_id" | "niet_gekoppeld";
};

type VervoersKeuze = {
  leerling_id: string;
  leerjaar: number;
  activiteit: "donk" | "koers_golf" | null;
  heen: "fiets" | "eigen_vervoer" | null;
  terug: "fiets" | "eigen_vervoer" | null;
  updated_at: string;
};

type LeerlingMetKeuze = {
  leerling: GekoppeldeLeerling;
  keuze: VervoersKeuze;
};

type CopyRow = {
  naam: string;
  klas: string;
  activiteit?: string;
  heen?: string;
  terug?: string;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  glass: "rgba(6, 12, 20, 0.42)",
};

const SPORTDAG_INFO: Record<
  number,
  { titel: string; locatie: string; emoji: string }
> = {
  3: { titel: "Adventure De Gavers", locatie: "Harelbeke", emoji: "🚴" },
  5: { titel: "Sport & Teambuilding", locatie: "Oudenaarde", emoji: "🎯" },
  6: { titel: "Waterski & Adventure Donk", locatie: "Oudenaarde", emoji: "🏄‍♂️" },
  7: { titel: "Waterski & Adventure Donk", locatie: "Oudenaarde", emoji: "🏄‍♂️" },
};

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
  return String(value ?? "").trim().toLowerCase();
}

function normalizeId(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getLeerjaarUitKlas(klasNaam: string | null) {
  if (!klasNaam) return null;
  const match = klasNaam.trim().match(/^([1-7])/);
  if (!match) return null;
  const leerjaar = Number(match[1]);
  return Number.isNaN(leerjaar) ? null : leerjaar;
}

function getNaam(leerling: SmartschoolLeerling) {
  if (leerling.volledige_naam?.trim()) return leerling.volledige_naam.trim();

  const naam = [leerling.given_name?.trim(), leerling.family_name?.trim()]
    .filter(Boolean)
    .join(" ");

  if (naam) return naam;
  if (leerling.email) return leerling.email;
  return "Onbekende leerling";
}

function formatTransport(value: VervoersKeuze["heen"]) {
  if (value === "fiets") return "Fiets";
  if (value === "eigen_vervoer") return "Rechtstreeks / eigen vervoer";
  return "Niet ingevuld";
}

function sortLeerlingen(items: LeerlingMetKeuze[]) {
  return [...items].sort((a, b) => {
    const klas = String(a.leerling.klas_naam ?? "").localeCompare(
      String(b.leerling.klas_naam ?? ""),
      "nl"
    );
    if (klas !== 0) return klas;
    return getNaam(a.leerling).localeCompare(getNaam(b.leerling), "nl");
  });
}

function sortOntbrekend(items: GekoppeldeLeerling[]) {
  return [...items].sort((a, b) => {
    const klas = String(a.klas_naam ?? "").localeCompare(
      String(b.klas_naam ?? ""),
      "nl"
    );
    if (klas !== 0) return klas;
    return getNaam(a).localeCompare(getNaam(b), "nl");
  });
}

async function copyForExcel(titel: string, rows: CopyRow[]) {
  const headers = ["Naam", "Klas", "Activiteit", "Heen", "Terug"];
  const body = rows.map((row) =>
    [
      row.naam,
      row.klas,
      row.activiteit ?? "",
      row.heen ?? "",
      row.terug ?? "",
    ].join("\t")
  );

  const text = [titel, "", headers.join("\t"), ...body].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    window.alert(
      `${rows.length} leerling${rows.length === 1 ? "" : "en"} gekopieerd.\n\nPlak de lijst rechtstreeks in Excel.`
    );
  } catch (error) {
    console.error("Kopiëren mislukt:", error);
    window.alert("Kopiëren naar het klembord is mislukt.");
  }
}

export default function SportdagenBeheerPage() {
  const [loading, setLoading] = useState(true);
  const [profiel, setProfiel] = useState<MijnProfiel | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [leerlingen, setLeerlingen] = useState<GekoppeldeLeerling[]>([]);
  const [vervoersKeuzes, setVervoersKeuzes] = useState<VervoersKeuze[]>([]);
  const [smartschoolSchooljaar, setSmartschoolSchooljaar] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Gebruiker laden mislukt:", userError);
        setErrorMessage("De ingelogde gebruiker kon niet worden geladen.");
        return;
      }

      if (!user) {
        setErrorMessage("Je bent niet aangemeld.");
        return;
      }

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

      const magBeheren = isAllowedRole(normalizeRole(mijnProfiel?.rol));
      setAllowed(magBeheren);
      if (!magBeheren) return;

      const { data: smartschoolData, error: smartschoolError } = await supabase
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
        console.error("Smartschool leerlingen laden mislukt:", smartschoolError);
        setErrorMessage("De leerlingen konden niet uit Smartschool worden geladen.");
        return;
      }

      const alleRijen = (smartschoolData ?? []) as SmartschoolLeerling[];
      const beschikbareSchooljaren = Array.from(
        new Set(
          alleRijen
            .map((row) => row.schooljaar)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => b.localeCompare(a));

      const gekozenSchooljaar = beschikbareSchooljaren.includes(SCHOOLJAAR_SPORTDAG)
        ? SCHOOLJAAR_SPORTDAG
        : beschikbareSchooljaren[0] ?? null;

      setSmartschoolSchooljaar(gekozenSchooljaar);

      let actieveRijen = gekozenSchooljaar
        ? alleRijen.filter((row) => row.schooljaar === gekozenSchooljaar)
        : alleRijen;

      const uniekeLeerlingen = new Map<string, SmartschoolLeerling>();

      for (const leerling of actieveRijen) {
        const emailKey = normalizeEmail(leerling.email);
        const key = emailKey || leerling.username?.trim().toLowerCase() || "";
        if (!key) continue;

        const bestaande = uniekeLeerlingen.get(key);
        if (!bestaande || (!bestaande.profiel_id && leerling.profiel_id)) {
          uniekeLeerlingen.set(key, leerling);
        }
      }

      actieveRijen = Array.from(uniekeLeerlingen.values());

      const gekoppeldeLeerlingen: GekoppeldeLeerling[] = actieveRijen.map(
        (leerling) => {
          const profielId = normalizeId(leerling.profiel_id);
          return {
            ...leerling,
            gekoppeld_profiel_id: profielId || null,
            koppeling: profielId ? "smartschool_profiel_id" : "niet_gekoppeld",
          };
        }
      );

      setLeerlingen(gekoppeldeLeerlingen);

      const { data: vervoerData, error: vervoerError } = await supabase
        .from("sportdag_vervoer")
        .select("leerling_id, leerjaar, activiteit, heen, terug, updated_at")
        .eq("schooljaar", SCHOOLJAAR_SPORTDAG)
        .range(0, 4999);

      if (vervoerError) {
        console.error("Vervoerskeuzes laden mislukt:", vervoerError);
        setErrorMessage("De vervoerskeuzes konden niet worden geladen.");
        return;
      }

      setVervoersKeuzes((vervoerData ?? []) as VervoersKeuze[]);
    } catch (error) {
      console.error("Sportdagenoverzicht laden mislukt:", error);
      setErrorMessage("Er ging iets mis tijdens het laden van het sportdagenoverzicht.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const leerlingenPerLeerjaar = useMemo(() => {
    const result: Record<number, GekoppeldeLeerling[]> = {
      3: [],
      5: [],
      6: [],
      7: [],
    };

    for (const leerling of leerlingen) {
      const leerjaar = getLeerjaarUitKlas(leerling.klas_naam);
      if (!leerjaar || !LEERJAREN_MET_VERVOERSKEUZE.includes(leerjaar)) continue;
      result[leerjaar].push(leerling);
    }

    for (const leerjaar of LEERJAREN_MET_VERVOERSKEUZE) {
      result[leerjaar] = sortOntbrekend(result[leerjaar]);
    }

    return result;
  }, [leerlingen]);

  const vervoerPerLeerling = useMemo(() => {
    const result = new Map<string, VervoersKeuze>();
    for (const keuze of vervoersKeuzes) {
      const leerlingId = normalizeId(keuze.leerling_id);
      if (leerlingId) result.set(leerlingId, keuze);
    }
    return result;
  }, [vervoersKeuzes]);

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Sportdagen" userName={profiel?.volledige_naam ?? null}>
        <style>{css}</style>
        <div className="loading-state">
          <div className="loading-icon">🏆</div>
          <strong>Sportdagen laden...</strong>
          <span>Smartschoolgegevens en vervoerskeuzes worden opgehaald.</span>
        </div>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Geen toegang" userName={profiel?.volledige_naam ?? null}>
        <style>{css}</style>
        <section className="access-card">
          <div className="access-icon">🔒</div>
          <h1>Geen toegang</h1>
          <p>Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.</p>
          <Link href="/dashboard" className="back-button">
            ← Terug naar dashboard
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Sportdagen" userName={profiel?.volledige_naam ?? null}>
      <style>{css}</style>

      <main className="page">
        <BaseHero
          label="EXTRAMURALE SPORTACTIVITEITEN"
          title={
            <>
              Beheer <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">sportdagen</span>
            </>
          }
          description="Bekijk per sportdag meteen wie met de fiets vertrekt, wie rechtstreeks gaat en wie zijn keuze nog niet heeft ingevuld."
          imageSrc="/lo/LO.png"
          imageAlt="Sportdagen"
          quoteTitle="Sportdagen"
          quote="Alle vervoerskeuzes in één werkoverzicht."
          quoteAuthor="LO team"
          actions={
            <div className="hero-actions">
              <Link href="/leerkrachten-lo/extramurale-sportactiviteiten" className="hero-button">
                ← Terug
              </Link>
              <button type="button" className="hero-button" onClick={loadData}>
                ↻ Vernieuwen
              </button>
            </div>
          }
        />

        <section className="source-bar">
          <div className="source-left">
            <span className="source-dot" />
            <div>
              <strong>Leerlingen uit Smartschool</strong>
              <span>
                {leerlingen.length} leerlingen geladen
                {smartschoolSchooljaar ? ` • schooljaar ${smartschoolSchooljaar}` : ""}
              </span>
            </div>
          </div>

          {smartschoolSchooljaar && smartschoolSchooljaar !== SCHOOLJAAR_SPORTDAG && (
            <div className="schoolyear-warning">
              ⚠️ Smartschool bevat momenteel nog {smartschoolSchooljaar}
            </div>
          )}
        </section>

        {errorMessage && <section className="error-card">⚠️ {errorMessage}</section>}

        <section className="teacher-overview">
          {LEERJAREN_MET_VERVOERSKEUZE.map((leerjaar) => {
            const leerlingenVanLeerjaar = leerlingenPerLeerjaar[leerjaar] ?? [];
            const leerlingenMetKeuze: LeerlingMetKeuze[] = [];
            const ontbrekendeLeerlingen: GekoppeldeLeerling[] = [];

            for (const leerling of leerlingenVanLeerjaar) {
              const profielId = normalizeId(leerling.gekoppeld_profiel_id);
              if (!profielId) {
                ontbrekendeLeerlingen.push(leerling);
                continue;
              }

              const keuze = vervoerPerLeerling.get(profielId);
              if (!keuze || Number(keuze.leerjaar) !== Number(leerjaar)) {
                ontbrekendeLeerlingen.push(leerling);
                continue;
              }

              leerlingenMetKeuze.push({ leerling, keuze });
            }

            const koersGolf = sortLeerlingen(
              leerlingenMetKeuze.filter(
                ({ keuze }) => leerjaar >= 6 && keuze.activiteit === "koers_golf"
              )
            );

            const gewoneActiviteit = sortLeerlingen(
              leerlingenMetKeuze.filter(
                ({ keuze }) => !(leerjaar >= 6 && keuze.activiteit === "koers_golf")
              )
            );

            const fietsHeen = gewoneActiviteit.filter(({ keuze }) => keuze.heen === "fiets");
            const rechtstreeksHeen = gewoneActiviteit.filter(
              ({ keuze }) => keuze.heen === "eigen_vervoer"
            );
            const fietsTerug = gewoneActiviteit.filter(({ keuze }) => keuze.terug === "fiets");
            const eigenTerug = gewoneActiviteit.filter(
              ({ keuze }) => keuze.terug === "eigen_vervoer"
            );

            const totaal = leerlingenVanLeerjaar.length;
            const ingevuld = leerlingenMetKeuze.length;
            const percentage = totaal > 0 ? Math.round((ingevuld / totaal) * 100) : 0;
            const info = SPORTDAG_INFO[leerjaar];

            const volledigeExcelLijst: CopyRow[] = sortLeerlingen(leerlingenMetKeuze).map(
              ({ leerling, keuze }) => ({
                naam: getNaam(leerling),
                klas: leerling.klas_naam ?? "",
                activiteit:
                  leerjaar >= 6
                    ? keuze.activiteit === "koers_golf"
                      ? "Koers + golf"
                      : "Den Donk"
                    : info?.titel ?? "",
                heen:
                  keuze.activiteit === "koers_golf"
                    ? "Niet van toepassing"
                    : formatTransport(keuze.heen),
                terug:
                  keuze.activiteit === "koers_golf"
                    ? "Niet van toepassing"
                    : formatTransport(keuze.terug),
              })
            );

            return (
              <article key={leerjaar} className="teacher-sportday">
                <div className="teacher-sportday-header">
                  <div className="sportday-heading-row">
                    <span className="sportday-emoji">{info?.emoji ?? "🏆"}</span>
                    <div className="sportday-heading">
                      <span className="year-label">SPORTDAG</span>
                      <h2>{leerjaar}e jaar</h2>
                      <span className="sportday-subtitle">
                        {info?.titel} • {info?.locatie}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="excel-main-button"
                    onClick={() =>
                      copyForExcel(
                        `Sportdag ${leerjaar}e jaar - ${info?.titel ?? ""}`,
                        volledigeExcelLijst
                      )
                    }
                    disabled={volledigeExcelLijst.length === 0}
                  >
                    📋 Volledig overzicht voor Excel
                  </button>
                </div>

                <div className="overview-stats">
                  <OverviewStat value={totaal} label="Leerlingen" icon="👥" />
                  <OverviewStat value={ingevuld} label="Ingevuld" icon="✓" variant="green" />
                  <OverviewStat
                    value={ontbrekendeLeerlingen.length}
                    label="Ontbrekend"
                    icon="!"
                    variant={ontbrekendeLeerlingen.length > 0 ? "yellow" : "green"}
                  />
                  <OverviewStat value={`${percentage}%`} label="In orde" icon="📊" />
                </div>

                <div className="overview-progress">
                  <div style={{ width: `${percentage}%` }} />
                </div>

                {leerjaar >= 6 && (
                  <section className="activity-overview">
                    <div className="overview-section-title">
                      <div>
                        <span className="section-kicker">ACTIVITEITSKEUZE</span>
                        <h3>6e/7e jaar</h3>
                      </div>
                    </div>

                    <div className="activity-overview-grid">
                      <div className="activity-summary">
                        <span className="activity-big-icon">🏄‍♂️</span>
                        <div>
                          <strong>{gewoneActiviteit.length}</strong>
                          <span>Den Donk</span>
                        </div>
                      </div>

                      <div className="activity-summary">
                        <span className="activity-big-icon">🚴</span>
                        <div>
                          <strong>{koersGolf.length}</strong>
                          <span>Koers + golf</span>
                          <small>{Math.max(0, MAX_KOERS_GOLF - koersGolf.length)} van 20 plaatsen vrij</small>
                        </div>
                      </div>
                    </div>

                    {koersGolf.length > 0 && (
                      <div className="single-list-wrap">
                        <TransportList
                          icon="🚴"
                          title="Koers + golf"
                          subtitle="Geen aparte vervoerskeuze nodig."
                          items={koersGolf}
                          onCopy={() =>
                            copyForExcel(
                              `${leerjaar}e jaar - Koers + golf`,
                              koersGolf.map(({ leerling }) => ({
                                naam: getNaam(leerling),
                                klas: leerling.klas_naam ?? "",
                                activiteit: "Koers + golf",
                                heen: "Niet van toepassing",
                                terug: "Niet van toepassing",
                              }))
                            )
                          }
                        />
                      </div>
                    )}
                  </section>
                )}

                <section className="transport-section">
                  <div className="overview-section-title">
                    <div>
                      <span className="section-kicker">HEENREIS</span>
                      <h3>Naar de activiteit</h3>
                      <p>Dit is het overzicht dat je bij vertrek het snelst nodig hebt.</p>
                    </div>
                    <div className="section-total">{gewoneActiviteit.length} leerlingen</div>
                  </div>

                  <div className="transport-lists-grid">
                    <TransportList
                      icon="🚲"
                      title="Met de fiets"
                      subtitle="Vertrekt samen met de fietsgroep."
                      items={fietsHeen}
                      onCopy={() =>
                        copyForExcel(
                          `${leerjaar}e jaar - Fiets heen`,
                          fietsHeen.map(({ leerling, keuze }) => ({
                            naam: getNaam(leerling),
                            klas: leerling.klas_naam ?? "",
                            activiteit: leerjaar >= 6 ? "Den Donk" : info?.titel ?? "",
                            heen: formatTransport(keuze.heen),
                            terug: formatTransport(keuze.terug),
                          }))
                        )
                      }
                    />

                    <TransportList
                      icon="📍"
                      title="Rechtstreeks"
                      subtitle="Gaat op eigen vervoer rechtstreeks naar de activiteit."
                      items={rechtstreeksHeen}
                      onCopy={() =>
                        copyForExcel(
                          `${leerjaar}e jaar - Rechtstreeks heen`,
                          rechtstreeksHeen.map(({ leerling, keuze }) => ({
                            naam: getNaam(leerling),
                            klas: leerling.klas_naam ?? "",
                            activiteit: leerjaar >= 6 ? "Den Donk" : info?.titel ?? "",
                            heen: formatTransport(keuze.heen),
                            terug: formatTransport(keuze.terug),
                          }))
                        )
                      }
                    />
                  </div>
                </section>

                <details className="return-details">
                  <summary>
                    <div className="summary-left">
                      <span className="return-icon">🏁</span>
                      <div>
                        <strong>Terugreis bekijken</strong>
                        <span>{fietsTerug.length} fiets • {eigenTerug.length} eigen vervoer</span>
                      </div>
                    </div>
                    <span className="details-arrow">↓</span>
                  </summary>

                  <div className="return-content">
                    <div className="transport-lists-grid">
                      <TransportList
                        icon="🚲"
                        title="Met de fiets terug"
                        subtitle="Keert samen met de fietsgroep terug."
                        items={fietsTerug}
                        onCopy={() =>
                          copyForExcel(
                            `${leerjaar}e jaar - Fiets terug`,
                            fietsTerug.map(({ leerling, keuze }) => ({
                              naam: getNaam(leerling),
                              klas: leerling.klas_naam ?? "",
                              activiteit: leerjaar >= 6 ? "Den Donk" : info?.titel ?? "",
                              heen: formatTransport(keuze.heen),
                              terug: formatTransport(keuze.terug),
                            }))
                          )
                        }
                      />

                      <TransportList
                        icon="🚗"
                        title="Eigen vervoer terug"
                        subtitle="Wordt opgehaald of gaat zelfstandig naar huis."
                        items={eigenTerug}
                        onCopy={() =>
                          copyForExcel(
                            `${leerjaar}e jaar - Eigen vervoer terug`,
                            eigenTerug.map(({ leerling, keuze }) => ({
                              naam: getNaam(leerling),
                              klas: leerling.klas_naam ?? "",
                              activiteit: leerjaar >= 6 ? "Den Donk" : info?.titel ?? "",
                              heen: formatTransport(keuze.heen),
                              terug: formatTransport(keuze.terug),
                            }))
                          )
                        }
                      />
                    </div>
                  </div>
                </details>

                {ontbrekendeLeerlingen.length > 0 ? (
                  <details className="missing-details" open>
                    <summary>
                      <div className="summary-left">
                        <span className="missing-warning">!</span>
                        <div>
                          <strong>Nog niet ingevuld</strong>
                          <span>{ontbrekendeLeerlingen.length} leerlingen</span>
                        </div>
                      </div>
                      <span className="details-arrow">↓</span>
                    </summary>

                    <div className="missing-content">
                      <div className="missing-actions">
                        <p>Deze leerlingen hebben nog geen geldige keuze opgeslagen.</p>
                        <button
                          type="button"
                          className="copy-small-button warning"
                          onClick={() =>
                            copyForExcel(
                              `${leerjaar}e jaar - Nog niet ingevuld`,
                              sortOntbrekend(ontbrekendeLeerlingen).map((leerling) => ({
                                naam: getNaam(leerling),
                                klas: leerling.klas_naam ?? "",
                              }))
                            )
                          }
                        >
                          📋 Kopieer lijst
                        </button>
                      </div>

                      <div className="missing-student-grid">
                        {sortOntbrekend(ontbrekendeLeerlingen).map((leerling) => (
                          <div
                            key={leerling.email ?? leerling.username ?? getNaam(leerling)}
                            className="missing-student"
                          >
                            <span className="student-avatar">
                              {getNaam(leerling).charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <strong>{getNaam(leerling)}</strong>
                              <span>{leerling.klas_naam ?? "Geen klas"}</span>
                            </div>
                            {!leerling.gekoppeld_profiel_id && <small>Nog niet ingelogd</small>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ) : totaal > 0 ? (
                  <div className="all-complete">
                    <span>✓</span>
                    <div>
                      <strong>Iedereen heeft zijn keuze bevestigd</strong>
                      <small>Alle {totaal} leerlingen zijn in orde.</small>
                    </div>
                  </div>
                ) : (
                  <div className="no-students">Geen leerlingen gevonden voor het {leerjaar}e jaar.</div>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
}

function OverviewStat({
  value,
  label,
  icon,
  variant = "default",
}: {
  value: number | string;
  label: string;
  icon: string;
  variant?: "default" | "green" | "yellow";
}) {
  return (
    <div className={`overview-stat ${variant}`}>
      <div className="overview-stat-top">
        <span>{icon}</span>
        <strong>{value}</strong>
      </div>
      <small>{label}</small>
    </div>
  );
}

function TransportList({
  icon,
  title,
  subtitle,
  items,
  onCopy,
}: {
  icon: string;
  title: string;
  subtitle: string;
  items: LeerlingMetKeuze[];
  onCopy: () => void;
}) {
  return (
    <div className="transport-list-card">
      <div className="transport-list-header">
        <div className="transport-list-heading">
          <span className="transport-list-icon">{icon}</span>
          <div>
            <h4>{title}</h4>
            <p>{subtitle}</p>
          </div>
        </div>
        <span className="transport-list-count">{items.length}</span>
      </div>

      <button
        type="button"
        className="copy-small-button"
        onClick={onCopy}
        disabled={items.length === 0}
      >
        📋 Kopieer voor Excel
      </button>

      {items.length === 0 ? (
        <div className="empty-transport-list">Geen leerlingen</div>
      ) : (
        <div className="transport-students">
          <div className="transport-table-header">
            <span>Naam</span>
            <span>Klas</span>
          </div>

          {items.map(({ leerling }) => (
            <div
              key={
                leerling.gekoppeld_profiel_id ??
                leerling.email ??
                leerling.username ??
                getNaam(leerling)
              }
              className="transport-student-row"
            >
              <span>{getNaam(leerling)}</span>
              <strong>{leerling.klas_naam ?? "—"}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const css = `
  * { box-sizing: border-box; }

  .page {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding-bottom: 55px;
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
  }

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

  .loading-state span {
    margin-top: 5px;
    color: ${ui.muted};
    font-size: 12px;
  }

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

  .back-button {
    color: ${ui.text};
    font-weight: 900;
    text-decoration: none;
  }

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
  .source-left span { display: block; }

  .source-left strong { font-size: 12px; }

  .source-left span {
    margin-top: 2px;
    color: ${ui.muted};
    font-size: 10px;
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

  .teacher-overview {
    margin-top: 18px;
    display: grid;
    gap: 22px;
  }

  .teacher-sportday {
    overflow: hidden;
    padding: 22px;
    border-radius: 26px;
    border: 1px solid ${ui.border};
    background:
      radial-gradient(700px 260px at 100% 0%, rgba(75,142,141,0.10), transparent 70%),
      ${ui.glass};
    box-shadow: 0 18px 50px rgba(0,0,0,0.17);
  }

  .teacher-sportday-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .sportday-heading-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sportday-emoji {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.04);
    font-size: 23px;
  }

  .year-label {
    color: rgba(137,194,170,0.88);
    font-size: 9px;
    font-weight: 1000;
    letter-spacing: 1.3px;
  }

  .sportday-heading h2 {
    margin: 3px 0 4px;
    font-size: 28px;
    line-height: 1.05;
  }

  .sportday-subtitle {
    display: block;
    color: rgba(234,240,255,0.64);
    font-size: 11px;
  }

  .excel-main-button {
    min-height: 44px;
    padding: 0 15px;
    border: 1px solid rgba(137,194,170,0.25);
    border-radius: 14px;
    background: rgba(137,194,170,0.09);
    color: ${ui.text};
    font-size: 10px;
    font-weight: 950;
    cursor: pointer;
  }

  .excel-main-button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .overview-stats {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 8px;
  }

  .overview-stat {
    padding: 12px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.035);
  }

  .overview-stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .overview-stat-top strong { font-size: 22px; }
  .overview-stat-top span { color: rgba(234,240,255,0.55); }

  .overview-stat small {
    display: block;
    margin-top: 5px;
    color: ${ui.muted};
    font-size: 9px;
  }

  .overview-stat.green strong,
  .overview-stat.green .overview-stat-top span { color: #86efac; }

  .overview-stat.yellow strong,
  .overview-stat.yellow .overview-stat-top span { color: #fcd34d; }

  .overview-progress {
    height: 7px;
    margin-top: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
  }

  .overview-progress div {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #4B8E8D, #89C2AA);
  }

  .transport-section,
  .activity-overview { margin-top: 22px; }

  .overview-section-title {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .section-kicker {
    color: rgba(137,194,170,0.85);
    font-size: 8px;
    font-weight: 1000;
    letter-spacing: 1.2px;
  }

  .overview-section-title h3 {
    margin: 3px 0 0;
    font-size: 17px;
  }

  .overview-section-title p {
    margin: 4px 0 0;
    color: rgba(234,240,255,0.58);
    font-size: 9px;
  }

  .section-total {
    color: rgba(234,240,255,0.56);
    font-size: 9px;
  }

  .activity-overview-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 8px;
  }

  .activity-summary {
    padding: 13px;
    display: flex;
    align-items: center;
    gap: 11px;
    border-radius: 16px;
    border: 1px solid rgba(137,194,170,0.13);
    background: rgba(137,194,170,0.045);
  }

  .activity-big-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    font-size: 20px;
  }

  .activity-summary strong,
  .activity-summary span,
  .activity-summary small { display: block; }

  .activity-summary strong { font-size: 20px; }
  .activity-summary span { font-size: 10px; font-weight: 900; }
  .activity-summary small { margin-top: 2px; color: ${ui.muted}; font-size: 8px; }

  .single-list-wrap {
    max-width: 600px;
    margin-top: 10px;
  }

  .transport-lists-grid {
    margin-top: 11px;
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 12px;
  }

  .transport-list-card {
    min-width: 0;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.075);
    background: rgba(0,0,0,0.13);
  }

  .transport-list-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .transport-list-heading {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .transport-list-icon {
    width: 37px;
    height: 37px;
    flex: 0 0 auto;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.045);
    font-size: 18px;
  }

  .transport-list-heading h4 { margin: 0; font-size: 12px; }

  .transport-list-heading p {
    margin: 2px 0 0;
    color: rgba(234,240,255,0.52);
    font-size: 8px;
    line-height: 1.4;
  }

  .transport-list-count {
    min-width: 32px;
    height: 32px;
    padding: 0 7px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    background: rgba(137,194,170,0.08);
    color: #a7d9c3;
    font-size: 12px;
    font-weight: 1000;
  }

  .copy-small-button {
    width: 100%;
    min-height: 34px;
    margin-top: 10px;
    border-radius: 10px;
    border: 1px solid rgba(137,194,170,0.16);
    background: rgba(137,194,170,0.06);
    color: rgba(234,240,255,0.82);
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
  }

  .copy-small-button:disabled { opacity: 0.35; cursor: default; }

  .copy-small-button.warning {
    width: auto;
    min-width: 135px;
    margin: 0;
    border-color: rgba(251,191,36,0.18);
    background: rgba(251,191,36,0.06);
    color: #fde68a;
  }

  .transport-students { margin-top: 9px; }

  .transport-table-header,
  .transport-student-row {
    display: grid;
    grid-template-columns: minmax(0,1fr) 110px;
    gap: 8px;
  }

  .transport-table-header {
    padding: 5px 7px;
    color: rgba(234,240,255,0.38);
    font-size: 7px;
    font-weight: 1000;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }

  .transport-student-row {
    padding: 8px 7px;
    border-top: 1px solid rgba(255,255,255,0.05);
    font-size: 10px;
  }

  .transport-student-row > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .transport-student-row strong {
    color: rgba(234,240,255,0.59);
    font-size: 9px;
  }

  .empty-transport-list,
  .no-students {
    margin-top: 9px;
    padding: 15px;
    border-radius: 11px;
    background: rgba(255,255,255,0.02);
    color: rgba(234,240,255,0.38);
    text-align: center;
    font-size: 9px;
  }

  .return-details,
  .missing-details {
    margin-top: 16px;
    border-radius: 17px;
    border: 1px solid rgba(255,255,255,0.075);
    background: rgba(255,255,255,0.025);
    overflow: hidden;
  }

  .return-details summary,
  .missing-details summary {
    list-style: none;
    padding: 13px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  .return-details summary::-webkit-details-marker,
  .missing-details summary::-webkit-details-marker { display: none; }

  .summary-left {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .summary-left strong,
  .summary-left span { display: block; }

  .summary-left strong { font-size: 11px; }

  .summary-left div > span {
    margin-top: 2px;
    color: rgba(234,240,255,0.5);
    font-size: 8px;
  }

  .return-icon,
  .missing-warning {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(255,255,255,0.045);
  }

  .missing-warning {
    background: rgba(251,191,36,0.08);
    color: #fcd34d;
    font-weight: 1000;
  }

  .details-arrow { transition: transform 170ms ease; }
  .return-details[open] .details-arrow,
  .missing-details[open] .details-arrow { transform: rotate(180deg); }

  .return-content,
  .missing-content { padding: 0 14px 14px; }

  .missing-details {
    border-color: rgba(251,191,36,0.15);
    background: rgba(251,191,36,0.035);
  }

  .missing-details summary strong { color: #fde68a; }

  .missing-actions {
    margin-bottom: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(251,191,36,0.10);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .missing-actions p {
    margin: 0;
    color: rgba(253,230,138,0.65);
    font-size: 9px;
  }

  .missing-student-grid {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 6px;
  }

  .missing-student {
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 11px;
    background: rgba(0,0,0,0.10);
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

  .missing-student > div { min-width: 0; flex: 1; }
  .missing-student strong,
  .missing-student div span { display: block; }
  .missing-student strong { font-size: 9px; }
  .missing-student div span { color: ${ui.muted}; font-size: 8px; }
  .missing-student small { color: rgba(253,230,138,0.55); font-size: 7px; }

  .all-complete {
    margin-top: 16px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(34,197,94,0.16);
    background: rgba(34,197,94,0.055);
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .all-complete > span {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(34,197,94,0.09);
    color: #86efac;
    font-weight: 1000;
  }

  .all-complete strong,
  .all-complete small { display: block; }
  .all-complete strong { color: #86efac; font-size: 10px; }
  .all-complete small { color: rgba(134,239,172,0.58); font-size: 8px; }

  @media(max-width: 800px) {
    .teacher-sportday-header { flex-direction: column; }
    .excel-main-button { width: 100%; }
    .overview-stats { grid-template-columns: repeat(2,1fr); }
    .transport-lists-grid { grid-template-columns: 1fr; }
    .missing-student-grid { grid-template-columns: 1fr; }
  }

  @media(max-width: 640px) {
    .source-bar { align-items: flex-start; flex-direction: column; }
    .schoolyear-warning { width: 100%; }
    .teacher-sportday { padding: 16px; border-radius: 21px; }
    .sportday-heading h2 { font-size: 24px; }
    .activity-overview-grid { grid-template-columns: 1fr; }
    .missing-actions { align-items: stretch; flex-direction: column; }
    .copy-small-button.warning { width: 100%; }
  }

  @media(max-width: 480px) {
    .transport-table-header,
    .transport-student-row { grid-template-columns: minmax(0,1fr) 80px; }
  }
`;
