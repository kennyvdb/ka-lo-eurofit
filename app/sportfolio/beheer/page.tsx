"use client";

import AppShell from "@/components/AppShell";
import KlasgroepSelector from "@/components/klasgroepen/KlasgroepSelector";
import type { KlasgroepLid } from "@/types/klasgroepen";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

type RawRow = Record<string, any>;

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  schooljaar: string | null;
};

type Discipline = {
  id: string;
  naam: string;
  categorie: string | null;
  eenheid: string | null;
};

type Openstelling = {
  id: string;
  discipline_id: string;
  klas_naam: string | null;
  klasgroep_id: string | null;
  schooljaar: string;
  open_voor_leerlingen: boolean | null;
};

type DoelType = "klas" | "klasgroep";

function getValue(row: RawRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function isEchteKlas(klas: string) {
  return /^[0-9]/.test(klas.trim());
}

function getKlasNaam(row: RawRow) {
  return String(
    getValue(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"])
  ).trim();
}

function readableSupabaseError(error: any, context: string) {
  const parts = [
    context,
    error?.message,
    error?.details,
    error?.hint,
    error?.code ? `code: ${error.code}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

export default function SportfolioBeheerPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [openstellingen, setOpenstellingen] = useState<Openstelling[]>([]);

  const [selectedKlasNaam, setSelectedKlasNaam] = useState("");
  const [selectedKlasgroepId, setSelectedKlasgroepId] = useState<string | null>(null);
  const [selectedKlasgroepLeden, setSelectedKlasgroepLeden] = useState<KlasgroepLid[]>([]);
  const [doelType, setDoelType] = useState<DoelType>("klas");
  const [selectedSchooljaar, setSelectedSchooljaar] = useState("");

  const klassen = useMemo(() => {
    const set = new Set<string>();

    leerlingenRows.forEach((row) => {
      const klas = getKlasNaam(row);
      if (klas && isEchteKlas(klas)) set.add(klas);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leerlingenRows]);

  async function loadOpenstellingen(args: {
    type: DoelType;
    klasNaam?: string;
    klasgroepId?: string | null;
    schooljaar: string;
  }) {
    if (!args.schooljaar) return;
    if (args.type === "klas" && !args.klasNaam) return;
    if (args.type === "klasgroep" && !args.klasgroepId) return;

    let query = supabase
      .from("sportfolio_openstellingen")
      .select("id, discipline_id, klas_naam, klasgroep_id, schooljaar, open_voor_leerlingen")
      .eq("schooljaar", args.schooljaar);

    query = args.type === "klas"
      ? query.eq("klas_naam", args.klasNaam!).is("klasgroep_id", null)
      : query.eq("klasgroep_id", args.klasgroepId!).is("klas_naam", null);

    const { data, error } = await query;

    if (error) {
      console.error("loadOpenstellingen error:", error);
      throw new Error(readableSupabaseError(error, "Kon openstellingen niet laden."));
    }

    setOpenstellingen((data ?? []) as Openstelling[]);
  }

  async function loadKlassenViaEurofitView(schooljaar: string) {
    const { data, error } = await supabase
      .from("eurofit_class_students_view")
      .select("*");

    if (error) {
      console.error("loadKlassenViaEurofitView error:", error);
      throw new Error(readableSupabaseError(error, "Kon klassen niet laden uit eurofit_class_students_view."));
    }

    const rows = data ?? [];
    setLeerlingenRows(rows);

    const set = new Set<string>();
    rows
      .filter((row) => String(getValue(row, ["schooljaar", "school_year"])) === schooljaar)
      .forEach((row) => {
      const klas = getKlasNaam(row);
      if (klas && isEchteKlas(klas)) set.add(klas);
    });

    const klasList = Array.from(set).sort((a, b) => a.localeCompare(b));
    const firstKlasNaam = klasList[0] ?? "";

    setSelectedKlasNaam(firstKlasNaam);

    if (firstKlasNaam) {
      await loadOpenstellingen({ type: "klas", klasNaam: firstKlasNaam, schooljaar });
    } else {
      setOpenstellingen([]);
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;

        if (!uid) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        const { data: profielData, error: profielError } = await supabase
          .from("profielen")
          .select("id, volledige_naam, rol, schooljaar")
          .eq("id", uid)
          .single();

        if (profielError) {
          console.error("profielError:", profielError);
          throw new Error(readableSupabaseError(profielError, "Kon profiel niet laden."));
        }

        if (!["lo_leerkracht", "admin"].includes(String(profielData?.rol))) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        setAllowed(true);

        const profielValue = profielData as Profiel;
        setProfiel(profielValue);

        const schooljaar = profielValue.schooljaar ?? "2025-2026";
        setSelectedSchooljaar(schooljaar);

        const { data: disciplinesData, error: disciplinesError } = await supabase
          .from("sportfolio_disciplines")
          .select("id, naam, categorie, eenheid")
          .eq("actief", true)
          .order("naam", { ascending: true });

        if (disciplinesError) {
          console.error("disciplinesError:", disciplinesError);
          throw new Error(readableSupabaseError(disciplinesError, "Kon disciplines niet laden."));
        }

        setDisciplines((disciplinesData ?? []) as Discipline[]);

        await loadKlassenViaEurofitView(schooljaar);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon Sportfolio beheer niet laden.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  async function handleKlasChange(klasNaam: string) {
    setSelectedKlasNaam(klasNaam);
    setError(null);

    try {
      await loadOpenstellingen({ type: "klas", klasNaam, schooljaar: selectedSchooljaar });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon openstellingen niet laden.");
    }
  }

  async function handleSchooljaarLoad() {
    setError(null);

    try {
      await loadKlassenViaEurofitView(selectedSchooljaar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klassen niet laden.");
    }
  }

  async function handleKlasgroepChange(id: string | null, leden: KlasgroepLid[]) {
    setSelectedKlasgroepId(id);
    setSelectedKlasgroepLeden(leden);
    setError(null);

    if (!id) {
      setOpenstellingen([]);
      return;
    }

    try {
      await loadOpenstellingen({
        type: "klasgroep",
        klasgroepId: id,
        schooljaar: selectedSchooljaar,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon openstellingen niet laden.");
    }
  }

  async function toggleDiscipline(disciplineId: string, nextValue: boolean) {
    const doelGekozen = doelType === "klas" ? Boolean(selectedKlasNaam) : Boolean(selectedKlasgroepId);
    if (!profiel || !doelGekozen || !selectedSchooljaar) return;

    try {
      setSavingId(disciplineId);
      setError(null);

      const existing = openstellingen.find((row) => row.discipline_id === disciplineId);

      if (existing) {
        const { error } = await supabase
          .from("sportfolio_openstellingen")
          .update({
            open_voor_leerlingen: nextValue,
            geopend_door: profiel.id,
            geopend_op: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.error("sportfolio_openstellingen update error:", error);
          throw new Error(readableSupabaseError(error, "Update openstelling mislukt."));
        }
      } else {
        const insertPayload = {
          discipline_id: disciplineId,
          klas_naam: doelType === "klas" ? selectedKlasNaam : null,
          klasgroep_id: doelType === "klasgroep" ? selectedKlasgroepId : null,
          schooljaar: selectedSchooljaar,
          open_voor_leerlingen: nextValue,
          geopend_door: profiel.id,
          geopend_op: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("sportfolio_openstellingen")
          .insert(insertPayload);

        if (error) {
          console.error("sportfolio_openstellingen insert error:", error, insertPayload);
          throw new Error(readableSupabaseError(error, "Insert openstelling mislukt."));
        }
      }

      await loadOpenstellingen({
        type: doelType,
        klasNaam: selectedKlasNaam,
        klasgroepId: selectedKlasgroepId,
        schooljaar: selectedSchooljaar,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon discipline niet aanpassen.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Sportfolio beheer">
        <p className="text-white/80">Laden...</p>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Geen toegang">
        <section className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <h2 className="m-0 text-xl font-black text-white">Geen toegang</h2>
          <p className="mt-2 text-sm text-white/65">
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
          </p>
          <Link href="/sportfolio" className="mt-4 inline-flex font-black text-white">
            Terug naar Sportfolio →
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Sportfolio beheer" userName={profiel?.volledige_naam}>
      <section className="rounded-[26px] border border-white/10 bg-white/5 p-5">
        <Link
          href="/sportfolio"
          className="inline-flex h-10 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/80 transition hover:bg-white/10"
        >
          ← Terug naar Sportfolio
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
              LO Leerkrachtbeheer
            </div>
            <h1 className="mt-2 text-[28px] font-black text-white sm:text-[34px]">
              Disciplines openzetten
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Kies een officiële klas of een persoonlijke klasgroep en zet disciplines open of dicht.
            </p>
          </div>

          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
            rol: {profiel?.rol}
          </span>
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-black text-white">Filters</div>
        <div className="mt-1 text-xs text-white/60">
          Kies of je voor een volledige officiële klas of voor één van je eigen klasgroepen werkt.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
              Schooljaar
            </label>
            <input
              value={selectedSchooljaar}
              onChange={(e) => setSelectedSchooljaar(e.target.value)}
              placeholder="2025-2026"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
              Doelgroep
            </label>
            <select
              value={doelType}
              onChange={(e) => {
                const next = e.target.value as DoelType;
                setDoelType(next);
                setOpenstellingen([]);
                if (next === "klas" && selectedKlasNaam) {
                  void loadOpenstellingen({ type: "klas", klasNaam: selectedKlasNaam, schooljaar: selectedSchooljaar });
                }
              }}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
            >
              <option value="klas" className="bg-neutral-900">Officiële klas</option>
              <option value="klasgroep" className="bg-neutral-900">Mijn klasgroep</option>
            </select>
          </div>

          {doelType === "klas" ? <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/60">
              Klas
            </label>
            <select
              value={selectedKlasNaam}
              onChange={(e) => handleKlasChange(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none"
            >
              {klassen.length === 0 ? (
                <option value="" className="bg-neutral-900">
                  Geen klassen gevonden
                </option>
              ) : (
                klassen.map((klas) => (
                  <option key={klas} value={klas} className="bg-neutral-900">
                    {klas}
                  </option>
                ))
              )}
            </select>
          </div> : (
            <KlasgroepSelector
              schooljaar={selectedSchooljaar}
              value={selectedKlasgroepId}
              onChange={handleKlasgroepChange}
              includeAllOption={false}
            />
          )}

          <div className="flex items-end">
            <button
              onClick={handleSchooljaarLoad}
              className="h-12 rounded-2xl border border-white/15 bg-black/40 px-5 text-sm font-black text-white transition hover:bg-black/55"
            >
              Laden
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-white">Disciplines</div>
            <div className="text-xs text-white/60">
              {doelType === "klas" && selectedKlasNaam
                ? `Openstellingen voor ${selectedKlasNaam} • ${selectedSchooljaar}`
                : doelType === "klasgroep" && selectedKlasgroepId
                ? `Openstellingen voor je klasgroep • ${selectedKlasgroepLeden.length} leerlingen • ${selectedSchooljaar}`
                : "Kies eerst een doelgroep."}
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
            {disciplines.length} items
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {disciplines.map((discipline) => {
            const openstelling = openstellingen.find(
              (row) => row.discipline_id === discipline.id
            );

            const isOpen = Boolean(openstelling?.open_voor_leerlingen);

            return (
              <div
                key={discipline.id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-white">{discipline.naam}</div>
                    <div className="mt-1 text-xs text-white/55">
                      {discipline.categorie ?? "Algemeen"}
                      {discipline.eenheid ? ` • ${discipline.eenheid}` : ""}
                    </div>
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1.5 text-xs font-black",
                      isOpen
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-white/60",
                    ].join(" ")}
                  >
                    {isOpen ? "Open" : "Gesloten"}
                  </span>
                </div>

                <button
                  onClick={() => toggleDiscipline(discipline.id, !isOpen)}
                  disabled={savingId === discipline.id || (doelType === "klas" ? !selectedKlasNaam : !selectedKlasgroepId)}
                  className={[
                    "mt-4 h-11 w-full rounded-2xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen
                      ? "border-red-400/20 bg-red-400/10 text-red-100 hover:bg-red-400/15"
                      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
                  ].join(" ")}
                >
                  {savingId === discipline.id
                    ? "Opslaan..."
                    : isOpen
                    ? "Discipline sluiten"
                    : "Discipline openzetten"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
