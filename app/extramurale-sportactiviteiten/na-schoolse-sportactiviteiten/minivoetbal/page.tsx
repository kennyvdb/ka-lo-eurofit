
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Categorie = "miniemen" | "cadetten" | "scholieren";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  rol: string | null;
};

type Antwoord = {
  gebruiker_id: string;
  interesse: boolean;
  competitievoetbal: boolean;
  beschikbaar_bevestigd: boolean;
  club: string | null;
  ploeg: string | null;
  categorie: Categorie;
  opmerking: string | null;
  bijgewerkt_op: string;
};

type Formulier = {
  interesse: boolean | null;
  competitievoetbal: boolean | null;
  beschikbaar_bevestigd: boolean;
  club: string;
  ploeg: string;
  categorie: Categorie | "";
  opmerking: string;
};

const DEADLINE = new Date("2026-11-21T00:00:00+01:00");

const CATEGORIEEN: {
  id: Categorie;
  naam: string;
  geboortejaren: string;
  start: string;
  url: string;
}[] = [
  {
    id: "miniemen",
    naam: "Miniemen",
    geboortejaren: "2013–2014",
    start: "13 januari 2027",
    url: "https://www.moev.be/event/moev-cup-minivoetbal-miniemen-jongens-diverse-locaties-west-vlaanderen-13-01-2027-19-05-2027-1677/register",
  },
  {
    id: "cadetten",
    naam: "Cadetten",
    geboortejaren: "2011–2012",
    start: "3 februari 2027",
    url: "https://www.moev.be/event/moev-cup-minivoetbal-cadetten-jongens-diverse-locaties-west-vlaanderen-03-02-2027-19-05-2027-1679/register",
  },
  {
    id: "scholieren",
    naam: "Scholieren",
    geboortejaren: "2008–2010",
    start: "6 januari 2027",
    url: "https://www.moev.be/event/moev-cup-minivoetbal-scholieren-jongens-diverse-locaties-west-vlaanderen-06-01-2027-19-05-2027-1659/register",
  },
];

const LEEG_FORMULIER: Formulier = {
  interesse: null,
  competitievoetbal: null,
  beschikbaar_bevestigd: false,
  club: "",
  ploeg: "",
  categorie: "",
  opmerking: "",
};

const panel =
  "rounded-[24px] border border-white/[0.08] " +
  "bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] " +
  "p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-7";

const inputStyle =
  "w-full rounded-2xl border border-white/10 " +
  "bg-slate-950/80 px-4 py-3 text-sm text-white " +
  "outline-none placeholder:text-slate-500 " +
  "focus:border-cyan-400/60";

function Keuze({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={`rounded-2xl border px-5 py-3 text-sm font-bold transition ${
        actief
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function MinivoetbalPage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [formulier, setFormulier] =
    useState<Formulier>({ ...LEEG_FORMULIER });
  const [antwoorden, setAntwoorden] = useState<Antwoord[]>([]);
  const [namen, setNamen] =
    useState<Record<string, Profiel>>({});
  const [laden, setLaden] = useState(true);
  const [bewaren, setBewaren] = useState(false);
  const [fout, setFout] = useState("");
  const [succes, setSucces] = useState("");
  const [heeftAntwoord, setHeeftAntwoord] = useState(false);
  const [nu, setNu] = useState(() => Date.now());

  const gesloten = nu >= DEADLINE.getTime();

  const isLeerling = profiel?.rol === "leerling";
  const isStaff =
    profiel?.rol === "lo_leerkracht" ||
    profiel?.rol === "admin";

  const laadGegevens = useCallback(async () => {
    setLaden(true);
    setFout("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!auth.user) {
        throw new Error(
          "Meld je aan met je schoolaccount."
        );
      }

      const { data: p, error: profielError } =
        await supabase
          .from("profielen")
          .select("id, volledige_naam, klas_naam, rol")
          .eq("id", auth.user.id)
          .single();

      if (profielError) throw profielError;

      const mijnProfiel = p as Profiel;
      setProfiel(mijnProfiel);

      const staff =
        mijnProfiel.rol === "lo_leerkracht" ||
        mijnProfiel.rol === "admin";

      if (staff) {
        const { data, error } = await supabase
          .from("minivoetbal_peiling")
          .select("*")
          .order("bijgewerkt_op", {
            ascending: false,
          });

        if (error) throw error;

        const lijst = (data ?? []) as Antwoord[];
        setAntwoorden(lijst);

        if (lijst.length > 0) {
          const ids = lijst.map(
            (a) => a.gebruiker_id
          );

          const { data: personen, error: e } =
            await supabase
              .from("profielen")
              .select(
                "id, volledige_naam, klas_naam, rol"
              )
              .in("id", ids);

          if (e) throw e;

          const mapping: Record<string, Profiel> = {};

          for (const persoon of
            (personen ?? []) as Profiel[]) {
            mapping[persoon.id] = persoon;
          }

          setNamen(mapping);
        } else {
          setNamen({});
        }
      }

      if (mijnProfiel.rol === "leerling") {
        const { data, error } = await supabase
          .from("minivoetbal_peiling")
          .select("*")
          .eq("gebruiker_id", auth.user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const a = data as Antwoord;

          setHeeftAntwoord(true);
          setFormulier({
            interesse: a.interesse,
            competitievoetbal: a.competitievoetbal,
            beschikbaar_bevestigd:
              a.beschikbaar_bevestigd,
            club: a.club ?? "",
            ploeg: a.ploeg ?? "",
            categorie: a.categorie,
            opmerking: a.opmerking ?? "",
          });
        }
      }
    } catch (e) {
      setFout(
        e instanceof Error
          ? e.message
          : "Gegevens konden niet worden geladen."
      );
    } finally {
      setLaden(false);
    }
  }, []);

  useEffect(() => {
    void laadGegevens();
  }, [laadGegevens]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNu(Date.now()),
      30000
    );

    return () => window.clearInterval(timer);
  }, []);

  async function slaOp() {
    if (!profiel || !isLeerling || gesloten) return;

    setFout("");
    setSucces("");

    if (formulier.interesse === null) {
      setFout("Geef aan of je interesse hebt.");
      return;
    }

    if (
      formulier.interesse &&
      !formulier.categorie
    ) {
      setFout("Selecteer je categorie.");
      return;
    }

    if (
      formulier.interesse &&
      !formulier.beschikbaar_bevestigd
    ) {
      setFout(
        "Je moet eerst bevestigen dat je op de eerste speeldatum beschikbaar bent."
      );
      return;
    }

    if (
      formulier.interesse &&
      formulier.competitievoetbal === null
    ) {
      setFout(
        "Geef aan of je momenteel competitievoetbal speelt."
      );
      return;
    }

    if (
      formulier.interesse &&
      formulier.competitievoetbal &&
      (!formulier.club.trim() ||
        !formulier.ploeg.trim())
    ) {
      setFout(
        "Vul je voetbalclub en ploeg of reeks in."
      );
      return;
    }

    const categorie =
      formulier.categorie || "miniemen";

    setBewaren(true);

    try {
      const interesse =
        formulier.interesse === true;
      const competitievoetbal =
        interesse &&
        formulier.competitievoetbal === true;

      const { error } = await supabase
        .from("minivoetbal_peiling")
        .upsert(
          {
            gebruiker_id: profiel.id,
            interesse,
            competitievoetbal,
            beschikbaar_bevestigd:
              interesse &&
              formulier.beschikbaar_bevestigd,
            categorie,
            club: competitievoetbal
              ? formulier.club.trim()
              : null,
            ploeg: competitievoetbal
              ? formulier.ploeg.trim()
              : null,
            opmerking: interesse
              ? formulier.opmerking.trim() || null
              : null,
            bijgewerkt_op:
              new Date().toISOString(),
          },
          { onConflict: "gebruiker_id" }
        );

      if (error) throw error;

      setHeeftAntwoord(true);
      setSucces(
        "Je antwoord is succesvol opgeslagen! " +
        "Dit is nog geen definitieve inschrijving."
      );
    } catch (e) {
      setFout(
        e instanceof Error
          ? e.message
          : "Het opslaan is mislukt."
      );
    } finally {
      setBewaren(false);
    }
  }

  const geïnteresseerden = antwoorden.filter(
    (a) => a.interesse
  );

  const getSpelers = (categorie: Categorie) =>
    geïnteresseerden
      .filter((a) => a.categorie === categorie)
      .sort((a, b) =>
        (
          namen[a.gebruiker_id]
            ?.volledige_naam ?? ""
        ).localeCompare(
          namen[b.gebruiker_id]
            ?.volledige_naam ?? "",
          "nl"
        )
      );

  return (
    <AppShell
      title="LO App"
      subtitle="MOEV Cup Minivoetbal"
      userName={
        profiel?.volledige_naam ?? null
      }
    >
      <BaseHero
        label="EXTRAMURALE ACTIVITEITEN"
        title={
          <>
            MOEV Cup{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Minivoetbal 2027
            </span>{" "}
            ⚽
          </>
        }
        description={
          <>
            Speel jij competitievoetbal?
            Vertegenwoordig onze school op de
            MOEV Cup Minivoetbal 2027.
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="MOEV Cup Minivoetbal"
        quoteTitle="Eén ploeg, één doel"
        quote="Competitie, inzet en teamspirit."
        actions={
          <Link
            href="/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/35 px-4 text-sm font-bold text-white"
          >
            ← Terug naar activiteiten
          </Link>
        }
      />

      <div className="mt-6 space-y-5">
        {/* INTRODUCTIE */}
        <section className={panel}>
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest ${
              gesloten
                ? "border-slate-400/25 bg-slate-400/10 text-slate-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            }`}
          >
            {gesloten
              ? "Peiling afgesloten"
              : "Interessepeiling · Geen definitieve inschrijving"}
          </div>

          <h2 className="mt-4 text-2xl font-black text-white">
            Wil jij onze school vertegenwoordigen?
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            We onderzoeken of we met onze school
            kunnen deelnemen aan de MOEV Cup
            Minivoetbal 2027. Het tornooi wordt
            op een hoog competitief niveau gespeeld.
            We zoeken daarom leerlingen die actief
            competitievoetbal spelen.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-5">
            <h3 className="font-black text-amber-200">
              ⚠️ ZEER BELANGRIJK
            </h3>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-200">
              Vul de peiling enkel positief in
              als je zeker weet dat je op de
              eerste speeldatum van jouw categorie
              beschikbaar bent. Overleg indien nodig
              eerst met je ouders en voetbalclub.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Er kan maximaal één ploeg worden
              ingeschreven. Het LO-team beslist
              op basis van het aantal geïnteresseerden,
              het competitieniveau en de beschikbare
              spelers of we deelnemen en wie
              geselecteerd wordt.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
            <p className="font-black text-cyan-200">
              📅 Uiterste invuldatum:
              vrijdag 20 november 2026
            </p>
            <p className="mt-1 text-xs text-slate-400">
              De peiling sluit om 23.59 uur
              Belgische tijd.
            </p>
          </div>
        </section>

        {/* OPVALLENDE KNOP NAAR DE PEILING */}
        {!laden && isLeerling && !gesloten && (
          <a
            href="#minivoetbal-peiling"
            className="group flex w-full items-center justify-center gap-3 rounded-[22px] border border-emerald-300/40 bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 px-5 py-5 text-center text-base font-black uppercase tracking-wide text-slate-950 shadow-[0_16px_42px_rgba(16,185,129,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 sm:text-xl"
          >
            <span aria-hidden="true">⚽</span>
            <span>Ik heb interesse – vul de peiling in</span>
            <span aria-hidden="true" className="transition group-hover:translate-y-1">↓</span>
          </a>
        )}

        {/* CATEGORIEEN EN DATUMS */}
        <section className={panel}>
          <h2 className="text-xl font-black text-white">
            📅 Eerste speeldatum per categorie
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Hieronder vind je de eerste speeldatum
            voor elke categorie. Bij kwalificatie
            kunnen er later nog wedstrijden volgen.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {CATEGORIEEN.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <h3 className="text-lg font-black text-white">
                  {c.naam}
                </h3>

                <p className="mt-1 text-xs font-bold text-cyan-300">
                  Geboren in {c.geboortejaren}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">
                      Eerste speeldatum
                    </div>
                    <div className="font-bold text-white">
                      {c.start}
                    </div>
                  </div>

                </div>

                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex text-sm font-black text-cyan-300 hover:text-cyan-200"
                >
                  Bekijk activiteit bij MOEV ↗
                </a>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Geboortejaren zijn afgeleid van het
            MOEV-reglement 2024–2025 en moeten
            nog voor 2026–2027 bevestigd worden.
          </p>
        </section>

        {laden ? (
          <section className={panel}>
            <p className="text-sm text-slate-300">
              Gegevens laden...
            </p>
          </section>
        ) : isLeerling ? (
          /* LEERLINGENPEILING */
          <section id="minivoetbal-peiling" className={`${panel} scroll-mt-24`}>
            <div className="mb-6">
              <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                Voor leerlingen
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">
                Jouw interesse doorgeven
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Je antwoord wordt automatisch
                aan je schoolprofiel gekoppeld.
              </p>
            </div>

            {gesloten ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-bold text-white">
                  🔒 De peiling is afgesloten.
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  De uiterste invuldatum was
                  20 november 2026.
                  {heeftAntwoord
                    ? " Je eerdere antwoord blijft bewaard."
                    : ""}
                </p>
                {heeftAntwoord && (
                  <div className="mt-3 text-sm text-slate-300">
                    Jouw antwoord:{" "}
                    <strong>
                      {formulier.interesse
                        ? "Geïnteresseerd"
                        : "Geen interesse"}
                    </strong>
                    {formulier.interesse &&
                      formulier.categorie && (
                        <span>
                          {" · "}
                          {CATEGORIEEN.find(
                            (c) =>
                              c.id === formulier.categorie
                          )?.naam}
                        </span>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void slaOp();
                }}
                className="space-y-7"
              >
                {heeftAntwoord && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">
                    ✓ Je hebt al geantwoord.
                    Je kunt je antwoord nog aanpassen.
                  </div>
                )}

                <div>
                  <label className="mb-3 block text-sm font-bold text-white">
                    1. Heb je interesse om deel te nemen?
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      aria-pressed={formulier.interesse === true}
                      onClick={() =>
                        setFormulier((v) => ({
                          ...v,
                          interesse: true,
                        }))
                      }
                      className={`w-full rounded-2xl border px-5 py-4 text-base font-black transition sm:w-auto ${
                        formulier.interesse === true
                          ? "border-emerald-200 bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.22)]"
                          : "border-emerald-400/50 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25"
                      }`}
                    >
                      ✅ Ja, ik heb interesse
                    </button>

                    <Keuze
                      actief={
                        formulier.interesse === false
                      }
                      onClick={() =>
                        setFormulier((v) => ({
                          ...v,
                          interesse: false,
                          beschikbaar_bevestigd: false,
                        }))
                      }
                    >
                      Neen
                    </Keuze>
                  </div>
                </div>

                {formulier.interesse === true && (
                  <>
                    <div>
                      <label
                        htmlFor="categorie"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        2. Tot welke categorie behoor je?
                      </label>

                      <select
                        id="categorie"
                        required
                        value={formulier.categorie}
                        onChange={(e) =>
                          setFormulier((v) => ({
                            ...v,
                            categorie:
                              e.target.value as
                                | Categorie
                                | "",
                            beschikbaar_bevestigd: false,
                          }))
                        }
                        className={inputStyle}
                      >
                        <option value="">
                          Selecteer je geboortejaar-categorie
                        </option>

                        {CATEGORIEEN.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            {c.naam} (°{c.geboortejaren})
                          </option>
                        ))}
                      </select>
                    </div>

                    {formulier.categorie && (
                      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-5">
                        <h3 className="font-black text-amber-200">
                          ⚠️ Bevestig je beschikbaarheid
                        </h3>

                        <p className="mt-3 text-sm leading-7 text-slate-200">
                          De eerste speeldatum van jouw
                          categorie is{" "}
                          <strong>
                            {CATEGORIEEN.find(
                              (c) =>
                                c.id === formulier.categorie
                            )?.start}
                          </strong>.
                          Bij kwalificatie kunnen later
                          nog wedstrijden volgen.
                        </p>

                        <label className="mt-4 flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            required
                            checked={
                              formulier.beschikbaar_bevestigd
                            }
                            onChange={(e) =>
                              setFormulier((v) => ({
                                ...v,
                                beschikbaar_bevestigd:
                                  e.target.checked,
                              }))
                            }
                            className="mt-1 h-5 w-5 shrink-0 accent-cyan-400"
                          />

                          <span className="text-sm font-bold leading-6 text-white">
                            Ik bevestig dat ik op de
                            eerste speeldatum van mijn
                            categorie beschikbaar ben
                            en dit voldoende heb nagegaan.
                          </span>
                        </label>
                      </div>
                    )}

                    <div>
                      <label className="mb-3 block text-sm font-bold text-white">
                        3. Speel je momenteel
                        competitievoetbal bij een club?
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <Keuze
                          actief={
                            formulier.competitievoetbal === true
                          }
                          onClick={() =>
                            setFormulier((v) => ({
                              ...v,
                              competitievoetbal: true,
                            }))
                          }
                        >
                          Ja
                        </Keuze>

                        <Keuze
                          actief={
                            formulier.competitievoetbal === false
                          }
                          onClick={() =>
                            setFormulier((v) => ({
                              ...v,
                              competitievoetbal: false,
                              club: "",
                              ploeg: "",
                            }))
                          }
                        >
                          Neen
                        </Keuze>
                      </div>
                    </div>

                    {formulier.competitievoetbal ===
                      true && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="club"
                            className="mb-2 block text-sm font-bold text-white"
                          >
                            4. Voetbalclub
                          </label>

                          <input
                            id="club"
                            required
                            maxLength={120}
                            value={formulier.club}
                            onChange={(e) =>
                              setFormulier((v) => ({
                                ...v,
                                club: e.target.value,
                              }))
                            }
                            placeholder="Naam van je club"
                            className={inputStyle}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="ploeg"
                            className="mb-2 block text-sm font-bold text-white"
                          >
                            5. Ploeg / niveau
                          </label>

                          <input
                            id="ploeg"
                            required
                            maxLength={120}
                            value={formulier.ploeg}
                            onChange={(e) =>
                              setFormulier((v) => ({
                                ...v,
                                ploeg: e.target.value,
                              }))
                            }
                            placeholder="Bijv. U17 provinciaal"
                            className={inputStyle}
                          />
                        </div>
                      </div>
                    )}

                    {formulier.competitievoetbal ===
                      false && (
                      <p className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-200">
                        Dit tornooi is bedoeld voor
                        leerlingen met competitie-ervaring.
                        Het LO-team houdt rekening met
                        het spelersniveau bij de selectie.
                      </p>
                    )}

                    <div>
                      <label
                        htmlFor="opmerking"
                        className="mb-2 block text-sm font-bold text-white"
                      >
                        Extra informatie (optioneel)
                      </label>

                      <textarea
                        id="opmerking"
                        rows={3}
                        maxLength={500}
                        value={formulier.opmerking}
                        onChange={(e) =>
                          setFormulier((v) => ({
                            ...v,
                            opmerking: e.target.value,
                          }))
                        }
                        placeholder="Bijv. positie of andere relevante info"
                        className={inputStyle}
                      />
                    </div>
                  </>
                )}

                {fout && (
                  <p
                    role="alert"
                    className="text-sm font-bold text-red-300"
                  >
                    {fout}
                  </p>
                )}

                {succes && (
                  <p
                    role="status"
                    className="text-sm font-bold text-emerald-300"
                  >
                    ✓ {succes}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    bewaren ||
                    formulier.interesse === null
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-4 text-sm font-black text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {bewaren
                    ? "Antwoord bewaren..."
                    : "Mijn antwoord bewaren"}
                </button>
              </form>
            )}
          </section>
        ) : isStaff ? (
          /* OVERZICHT VOOR LO-LEERKRACHTEN */
          <section className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                  LO-leerkrachten
                </div>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Overzicht geïnteresseerde spelers
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void laadGegevens()}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                ↻ Vernieuwen
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              Hieronder staan de leerlingen die
              positief op de peiling geantwoord
              hebben. Ze worden automatisch
              ingedeeld volgens de categorie
              die ze geselecteerd hebben.
            </p>

            {/* STATISTIEKEN */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
                <div className="text-xs font-bold text-cyan-300">
                  Totaal geïnteresseerd
                </div>
                <div className="mt-2 text-3xl font-black text-white">
                  {geïnteresseerden.length}
                </div>
              </div>

              {CATEGORIEEN.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="text-xs font-bold text-slate-400">
                    {c.naam}
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">
                    {getSpelers(c.id).length}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              {antwoorden.length} antwoorden ontvangen ·{" "}
              {
                geïnteresseerden.filter(
                  (a) => a.competitievoetbal
                ).length
              }{" "}
              geïnteresseerde competitiespelers
            </div>

            {/* APARTE SPELERSLIJST PER CATEGORIE */}
            <div className="mt-8 space-y-7">
              {CATEGORIEEN.map((categorie) => {
                const spelers =
                  getSpelers(categorie.id);

                const competitieAantal =
                  spelers.filter(
                    (s) => s.competitievoetbal
                  ).length;

                return (
                  <div
                    key={categorie.id}
                    className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] p-4 sm:p-5">
                      <div>
                        <h3 className="text-lg font-black text-white">
                          ⚽ {categorie.naam}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Geboren in{" "}
                          {categorie.geboortejaren}
                          {" · Eerste speeldatum: "}
                          {categorie.start}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-cyan-300">
                          {spelers.length}
                        </div>
                        <div className="text-xs text-slate-400">
                          geïnteresseerden
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-white/[0.06] px-4 py-3 text-xs text-slate-400 sm:px-5">
                      {competitieAantal} van{" "}
                      {spelers.length} spelers
                      spelen competitievoetbal.
                    </div>

                    {spelers.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Nog geen geïnteresseerde
                        spelers voor deze categorie.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[740px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wide text-slate-400">
                              <th className="px-4 py-3">
                                Leerling
                              </th>
                              <th className="px-4 py-3">
                                Klas
                              </th>
                              <th className="px-4 py-3">
                                Competitie
                              </th>
                              <th className="px-4 py-3">
                                Club
                              </th>
                              <th className="px-4 py-3">
                                Ploeg / niveau
                              </th>
                              <th className="px-4 py-3">
                                Beschikbaar
                              </th>
                              <th className="px-4 py-3">
                                Opmerking
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {spelers.map((s) => (
                              <tr
                                key={s.gebruiker_id}
                                className="border-b border-white/[0.06] last:border-0"
                              >
                                <td className="px-4 py-4 font-bold text-white">
                                  {namen[s.gebruiker_id]
                                    ?.volledige_naam ??
                                    "Onbekende leerling"}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  {namen[s.gebruiker_id]
                                    ?.klas_naam ?? "—"}
                                </td>

                                <td className="px-4 py-4">
                                  {s.competitievoetbal ? (
                                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-300">
                                      Ja
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300">
                                      Neen
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  {s.club || "—"}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  {s.ploeg || "—"}
                                </td>

                                <td className="px-4 py-4">
                                  {s.beschikbaar_bevestigd ? (
                                    <span className="text-xs font-bold text-emerald-300">
                                      ✓ Bevestigd
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-300">
                                      Niet bevestigd
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-400">
                                  {s.opmerking || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
              <p className="text-sm font-bold text-cyan-200">
                ℹ️ Selectie door het LO-team
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                De spelerslijsten zijn nog geen
                officiële inschrijvingen.
                Controleer de geboortejaren,
                beschikbaarheid en het
                competitieniveau. Per wedstrijd
                mogen volgens het geraadpleegde
                MOEV-minivoetbalreglement
                maximaal 10 spelers op het
                wedstrijdblad staan.
              </p>
            </div>
          </section>
        ) : (
          <section className={panel}>
            <p className="text-sm text-slate-300">
              De interessepeiling is bedoeld
              voor leerlingen. Meld je aan
              met je leerlingenaccount.
            </p>
          </section>
        )}

        {fout &&
          (gesloten || !isLeerling) &&
          !laden && (
            <p
              role="alert"
              className="text-sm font-bold text-red-300"
            >
              {fout}
            </p>
          )}
      </div>
    </AppShell>
  );
}
