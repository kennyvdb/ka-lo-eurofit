"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const EVENT_ID = "survival-trophy-2026";

type TabType = "ingeschreven" | "uitgeschreven";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

type Config = {
  id: string;
  schooljaar: string;
  max_plaatsen: number;
  inschrijvingen_open: boolean;
  tweede_graad_open: boolean;
  updated_at: string;
};

type Inschrijving = {
  id: string;
  event_id: string;
  schooljaar: string;
  leerling_id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  leerjaar: number | null;
  status: "ingeschreven" | "uitgeschreven";
  ingeschreven_op: string;
  uitgeschreven_op: string | null;
};

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "green" | "orange" | "red" | "cyan";
}) {
  const toneClasses = {
    default: "border-white/[0.08] bg-white/[0.035]",
    green: "border-emerald-400/20 bg-emerald-400/[0.07]",
    orange: "border-orange-400/20 bg-orange-400/[0.07]",
    red: "border-rose-400/20 bg-rose-400/[0.07]",
    cyan: "border-cyan-400/20 bg-cyan-400/[0.07]",
  };

  return (
    <div
      className={`rounded-[22px] border p-4 sm:p-5 ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>

          <div className="mt-2 text-3xl font-black text-white">{value}</div>

          {sub && (
            <div className="mt-1 text-xs font-semibold text-slate-400">
              {sub}
            </div>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdventureTrophyLeerkrachtPage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [inschrijvingen, setInschrijvingen] = useState<Inschrijving[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<TabType>("ingeschreven");

  const [zoekterm, setZoekterm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const role = normalizeRole(profiel?.rol);

  const hasAccess =
    role === "lo_leerkracht" ||
    role === "leerkracht_lo" ||
    role === "admin";

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setProfiel(null);
        return;
      }

      const { data: profielData, error: profielError } = await supabase
        .from("profielen")
        .select("id, volledige_naam, rol")
        .eq("id", user.id)
        .maybeSingle();

      if (profielError) throw profielError;

      const loadedProfiel = (profielData as Profiel | null) ?? null;

      setProfiel(loadedProfiel);

      const loadedRole = normalizeRole(loadedProfiel?.rol);

      const allowed =
        loadedRole === "lo_leerkracht" ||
        loadedRole === "leerkracht_lo" ||
        loadedRole === "admin";

      if (!allowed) return;

      const [configResult, inschrijvingenResult] = await Promise.all([
        supabase
          .from("adventure_trophy_config")
          .select(
            "id, schooljaar, max_plaatsen, inschrijvingen_open, tweede_graad_open, updated_at"
          )
          .eq("id", EVENT_ID)
          .maybeSingle(),

        supabase
          .from("adventure_trophy_inschrijvingen")
          .select(
            "id, event_id, schooljaar, leerling_id, volledige_naam, klas_naam, leerjaar, status, ingeschreven_op, uitgeschreven_op"
          )
          .eq("event_id", EVENT_ID)
          .order("ingeschreven_op", {
            ascending: true,
          }),
      ]);

      if (configResult.error) throw configResult.error;
      if (inschrijvingenResult.error) throw inschrijvingenResult.error;

      setConfig((configResult.data as Config | null) ?? null);

      setInschrijvingen(
        (inschrijvingenResult.data as Inschrijving[] | null) ?? []
      );
    } catch (error) {
      console.error("Adventure Trophy beheer laden mislukt:", error);

      setErrorMessage(
        "De inschrijvingen konden niet geladen worden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actieveInschrijvingen = useMemo(
    () =>
      inschrijvingen.filter(
        (item) => item.status === "ingeschreven"
      ),
    [inschrijvingen]
  );

  const uitgeschrevenInschrijvingen = useMemo(
    () =>
      inschrijvingen
        .filter((item) => item.status === "uitgeschreven")
        .sort((a, b) => {
          const aTime = a.uitgeschreven_op
            ? new Date(a.uitgeschreven_op).getTime()
            : 0;

          const bTime = b.uitgeschreven_op
            ? new Date(b.uitgeschreven_op).getTime()
            : 0;

          return bTime - aTime;
        }),
    [inschrijvingen]
  );

  const maxPlaatsen = config?.max_plaatsen ?? 20;
  const aantalActief = actieveInschrijvingen.length;
  const aantalUitgeschreven = uitgeschrevenInschrijvingen.length;
  const vrijePlaatsen = Math.max(0, maxPlaatsen - aantalActief);

  const progressPercentage =
    maxPlaatsen > 0
      ? Math.min(100, Math.round((aantalActief / maxPlaatsen) * 100))
      : 0;

  const verdeling = useMemo(() => {
    return [3, 4, 5, 6, 7].map((leerjaar) => ({
      leerjaar,
      aantal: actieveInschrijvingen.filter(
        (item) => Number(item.leerjaar) === leerjaar
      ).length,
    }));
  }, [actieveInschrijvingen]);

  const huidigeLijst =
    activeTab === "ingeschreven"
      ? actieveInschrijvingen
      : uitgeschrevenInschrijvingen;

  const gefilterdeLijst = useMemo(() => {
    const q = zoekterm.trim().toLowerCase();

    if (!q) return huidigeLijst;

    return huidigeLijst.filter((item) => {
      return [
        item.volledige_naam,
        item.klas_naam,
        item.leerjaar?.toString(),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        );
    });
  }, [huidigeLijst, zoekterm]);

  async function updateConfig(
    updates: Partial<
      Pick<
        Config,
        "inschrijvingen_open" | "tweede_graad_open"
      >
    >
  ) {
    if (!config || savingConfig) return;

    setSavingConfig(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("adventure_trophy_config")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", EVENT_ID);

      if (error) throw error;

      setConfig((current) =>
        current
          ? {
              ...current,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : current
      );

      if ("inschrijvingen_open" in updates) {
        setSuccessMessage(
          updates.inschrijvingen_open
            ? "De inschrijvingen zijn geopend."
            : "De inschrijvingen zijn gesloten."
        );
      }

      if ("tweede_graad_open" in updates) {
        setSuccessMessage(
          updates.tweede_graad_open
            ? "De inschrijving is nu ook geopend voor de 2e graad."
            : "De inschrijving voor de 2e graad is opnieuw gesloten."
        );
      }
    } catch (error) {
      console.error("Configuratie aanpassen mislukt:", error);

      setErrorMessage(
        "De instelling kon niet aangepast worden."
      );
    } finally {
      setSavingConfig(false);
    }
  }

  async function leerlingUitschrijven(item: Inschrijving) {
    const confirmed = window.confirm(
      `Ben je zeker dat je ${item.volledige_naam ?? "deze leerling"} wilt uitschrijven?\n\nDe leerling verdwijnt uit de actieve lijst, maar blijft zichtbaar in de uitschrijfhistoriek.`
    );

    if (!confirmed) return;

    setActionId(item.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "lo_adventure_trophy_uitschrijven",
        {
          p_event_id: EVENT_ID,
          p_leerling_id: item.leerling_id,
        }
      );

      if (error) throw error;

      setSuccessMessage(
        `${item.volledige_naam ?? "De leerling"} werd uitgeschreven.`
      );

      await loadData();
    } catch (error) {
      console.error("Leerling uitschrijven mislukt:", error);

      setErrorMessage(
        "De leerling kon niet uitgeschreven worden."
      );
    } finally {
      setActionId(null);
    }
  }

  async function definitiefVerwijderen(item: Inschrijving) {
    const confirmed = window.confirm(
      `Ben je zeker dat je de registratie van ${
        item.volledige_naam ?? "deze leerling"
      } DEFINITIEF wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt. Ook de inschrijfhistoriek wordt verwijderd.`
    );

    if (!confirmed) return;

    setActionId(item.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "lo_delete_adventure_trophy_inschrijving",
        {
          p_inschrijving_id: item.id,
        }
      );

      if (error) throw error;

      setInschrijvingen((current) =>
        current.filter((row) => row.id !== item.id)
      );

      setSuccessMessage(
        `De registratie van ${
          item.volledige_naam ?? "de leerling"
        } werd definitief verwijderd.`
      );
    } catch (error) {
      console.error("Definitief verwijderen mislukt:", error);

      setErrorMessage(
        "De registratie kon niet definitief verwijderd worden."
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <AppShell
        title="LO App"
        subtitle="Survival Trophy"
        userName={null}
      >
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="text-center">
            <div className="text-4xl">🔥</div>

            <div className="mt-4 font-black text-slate-300">
              Inschrijvingen laden...
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!hasAccess) {
    return (
      <AppShell
        title="LO App"
        subtitle="Survival Trophy"
        userName={profiel?.volledige_naam ?? null}
      >
        <div className="mx-auto mt-8 max-w-2xl rounded-[28px] border border-rose-400/20 bg-rose-400/[0.07] p-6 sm:p-8">
          <div className="text-3xl">🔒</div>

          <h1 className="mt-4 text-2xl font-black text-white">
            Geen toegang
          </h1>

          <p className="mt-3 font-semibold leading-6 text-slate-300">
            Deze pagina is alleen toegankelijk voor LO-leerkrachten.
          </p>

          <Link
            href="/dashboard"
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl border border-white/[0.10] bg-white/[0.05] px-4 text-sm font-black text-white"
          >
            ← Terug
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Survival Trophy"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="LO-BEHEER • NA-SCHOOLSE SPORTACTIVITEIT"
        title={
          <>
            Survival Trophy <span className="opacity-85">🔥</span>
          </>
        }
        description={
          <>
            Beheer de inschrijvingen, beschikbare plaatsen en
            uitschrijfhistoriek.
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="Survival Trophy beheer"
        quoteTitle="7 oktober 2026"
        quote="20 plaatsen voor onze leerlingen."
        quoteAuthor="Blaarmeersen • Gent"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/leerkrachten-lo/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition hover:bg-black/45"
            >
              ← Terug
            </Link>

            <Link
              href="/extramurale-sportactiviteiten/na-schoolse-sportactiviteiten/adventure-trophy"
              className="inline-flex h-11 items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 font-black text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Bekijk leerlingenpagina →
            </Link>
          </div>
        }
      />

      <main className="mx-auto mt-5 w-full max-w-[1200px] space-y-5 pb-16">
        {/* MELDINGEN */}
        {errorMessage && (
          <div className="rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm font-bold text-rose-200">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm font-bold text-emerald-200">
            ✓ {successMessage}
          </div>
        )}

        {/* STATS */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="🔥"
            label="Ingeschreven"
            value={aantalActief}
            sub={`van maximaal ${maxPlaatsen}`}
            tone="cyan"
          />

          <StatCard
            icon="✅"
            label="Plaatsen vrij"
            value={vrijePlaatsen}
            sub={
              vrijePlaatsen === 0
                ? "De activiteit is volzet"
                : "Nog beschikbaar"
            }
            tone={vrijePlaatsen === 0 ? "red" : "green"}
          />

          <StatCard
            icon="↩️"
            label="Uitgeschreven"
            value={aantalUitgeschreven}
            sub="Bewaard in historiek"
            tone="orange"
          />

          <StatCard
            icon={config?.inschrijvingen_open ? "🟢" : "🔴"}
            label="Inschrijvingen"
            value={config?.inschrijvingen_open ? "OPEN" : "DICHT"}
            sub={
              config?.tweede_graad_open
                ? "2e + 3e graad"
                : "Enkel 3e graad"
            }
            tone={
              config?.inschrijvingen_open ? "green" : "red"
            }
          />
        </section>

        {/* CAPACITEIT */}
        <section className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                Capaciteit
              </div>

              <h2 className="mt-1 text-xl font-black text-white">
                {aantalActief} van de {maxPlaatsen} plaatsen ingenomen
              </h2>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-black text-white">
              {vrijePlaatsen} vrij
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={`h-full rounded-full transition-all ${
                vrijePlaatsen === 0
                  ? "bg-rose-400"
                  : progressPercentage >= 75
                  ? "bg-orange-400"
                  : "bg-emerald-400"
              }`}
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </section>

        {/* INSTELLINGEN */}
        <section className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Instellingen
            </div>

            <h2 className="mt-1 text-xl font-black text-white">
              Inschrijvingen beheren
            </h2>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {/* OPEN / DICHT */}
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-black text-white">
                    Inschrijvingen leerlingen
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                    Hiermee kun je alle nieuwe inschrijvingen onmiddellijk
                    openen of sluiten.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingConfig}
                  onClick={() =>
                    updateConfig({
                      inschrijvingen_open:
                        !config?.inschrijvingen_open,
                    })
                  }
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    config?.inschrijvingen_open
                      ? "bg-emerald-500"
                      : "bg-slate-700"
                  } disabled:opacity-50`}
                  aria-label="Inschrijvingen openen of sluiten"
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                      config?.inschrijvingen_open
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                  config?.inschrijvingen_open
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-rose-400/10 text-rose-300"
                }`}
              >
                {config?.inschrijvingen_open
                  ? "Inschrijvingen open"
                  : "Inschrijvingen gesloten"}
              </div>
            </div>

            {/* 2E GRAAD */}
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-black text-white">
                    2e graad toelaten
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                    Standaard kunnen alleen leerlingen uit het 5e, 6e en 7e
                    jaar inschrijven. Zet dit open om ook het 3e en 4e jaar toe
                    te laten.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingConfig}
                  onClick={() =>
                    updateConfig({
                      tweede_graad_open:
                        !config?.tweede_graad_open,
                    })
                  }
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    config?.tweede_graad_open
                      ? "bg-violet-500"
                      : "bg-slate-700"
                  } disabled:opacity-50`}
                  aria-label="Tweede graad toelaten"
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                      config?.tweede_graad_open
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                  config?.tweede_graad_open
                    ? "bg-violet-400/10 text-violet-300"
                    : "bg-white/[0.06] text-slate-400"
                }`}
              >
                {config?.tweede_graad_open
                  ? "2e graad kan inschrijven"
                  : "Enkel 3e graad"}
              </div>
            </div>
          </div>
        </section>

        {/* VERDELING */}
        <section className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))] p-5 sm:p-7">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Verdeling actieve deelnemers
          </div>

          <h2 className="mt-1 text-xl font-black text-white">
            Per leerjaar
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {verdeling.map((item) => (
              <div
                key={item.leerjaar}
                className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-4 text-center"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  {item.leerjaar}e jaar
                </div>

                <div className="mt-2 text-3xl font-black text-white">
                  {item.aantal}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIJST */}
        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,13,25,0.98))]">
          <div className="border-b border-white/[0.07] p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Deelnemersbeheer
                </div>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Survival Trophy
                </h2>
              </div>

              <div className="w-full lg:max-w-sm">
                <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Zoeken
                </label>

                <input
                  type="search"
                  value={zoekterm}
                  onChange={(event) =>
                    setZoekterm(event.target.value)
                  }
                  placeholder="Naam of klas..."
                  className="mt-2 h-11 w-full rounded-2xl border border-white/[0.10] bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30"
                />
              </div>
            </div>

            {/* TABS */}
            <div className="mt-6 flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() =>
                  setActiveTab("ingeschreven")
                }
                className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
                  activeTab === "ingeschreven"
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                }`}
              >
                ✓ Ingeschreven ({aantalActief})
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("uitgeschreven")
                }
                className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
                  activeTab === "uitgeschreven"
                    ? "border-orange-400/25 bg-orange-400/10 text-orange-200"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                }`}
              >
                ↩ Uitgeschreven ({aantalUitgeschreven})
              </button>
            </div>
          </div>

          {/* GEEN RESULTATEN */}
          {gefilterdeLijst.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-3xl">
                {activeTab === "ingeschreven"
                  ? "🏁"
                  : "↩️"}
              </div>

              <div className="mt-3 font-black text-white">
                {zoekterm
                  ? "Geen leerlingen gevonden"
                  : activeTab === "ingeschreven"
                  ? "Nog geen inschrijvingen"
                  : "Nog niemand uitgeschreven"}
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {zoekterm
                  ? "Pas je zoekopdracht aan."
                  : activeTab === "ingeschreven"
                  ? "Nieuwe inschrijvingen verschijnen hier automatisch."
                  : "Uitgeschreven leerlingen blijven hier als historiek zichtbaar."}
              </p>
            </div>
          )}

          {/* DESKTOP TABEL */}
          {gefilterdeLijst.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02] text-left">
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Leerling
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Klas
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Leerjaar
                    </th>

                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Ingeschreven
                    </th>

                    {activeTab === "uitgeschreven" && (
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Uitgeschreven
                      </th>
                    )}

                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Acties
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {gefilterdeLijst.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/[0.055] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-black text-slate-400">
                          {index + 1}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-white">
                          {item.volledige_naam ??
                            "Onbekende leerling"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-black text-slate-300">
                          {item.klas_naam ?? "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-300">
                        {item.leerjaar
                          ? `${item.leerjaar}e jaar`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                        {formatDateTime(
                          item.ingeschreven_op
                        )}
                      </td>

                      {activeTab === "uitgeschreven" && (
                        <td className="px-5 py-4 text-xs font-semibold text-orange-300">
                          {formatDateTime(
                            item.uitgeschreven_op
                          )}
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status ===
                            "ingeschreven" && (
                            <button
                              type="button"
                              disabled={
                                actionId === item.id
                              }
                              onClick={() =>
                                leerlingUitschrijven(item)
                              }
                              className="rounded-xl border border-orange-400/20 bg-orange-400/[0.07] px-3 py-2 text-xs font-black text-orange-200 transition hover:bg-orange-400/12 disabled:opacity-40"
                            >
                              Uitschrijven
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={
                              actionId === item.id
                            }
                            onClick={() =>
                              definitiefVerwijderen(item)
                            }
                            className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-400/12 disabled:opacity-40"
                          >
                            Definitief verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MOBIEL */}
          {gefilterdeLijst.length > 0 && (
            <div className="space-y-3 p-4 md:hidden">
              {gefilterdeLijst.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-black text-slate-400">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-black text-white">
                        {item.volledige_naam ??
                          "Onbekende leerling"}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[10px] font-black text-slate-300">
                          {item.klas_naam ?? "Geen klas"}
                        </span>

                        {item.leerjaar && (
                          <span className="rounded-lg bg-cyan-400/[0.07] px-2.5 py-1 text-[10px] font-black text-cyan-300">
                            {item.leerjaar}e jaar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-xs font-semibold text-slate-400">
                    <div>
                      Ingeschreven:{" "}
                      <span className="text-slate-200">
                        {formatDateTime(
                          item.ingeschreven_op
                        )}
                      </span>
                    </div>

                    {item.status ===
                      "uitgeschreven" && (
                      <div>
                        Uitgeschreven:{" "}
                        <span className="text-orange-300">
                          {formatDateTime(
                            item.uitgeschreven_op
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {item.status === "ingeschreven" && (
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() =>
                          leerlingUitschrijven(item)
                        }
                        className="min-h-11 rounded-2xl border border-orange-400/20 bg-orange-400/[0.07] px-4 text-sm font-black text-orange-200 disabled:opacity-40"
                      >
                        Uitschrijven
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionId === item.id}
                      onClick={() =>
                        definitiefVerwijderen(item)
                      }
                      className="min-h-11 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] px-4 text-sm font-black text-rose-200 disabled:opacity-40"
                    >
                      Definitief verwijderen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* UITLEG HISTORIEK */}
        <section className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex gap-3">
            <div className="text-xl">ℹ️</div>

            <div>
              <div className="font-black text-white">
                Verschil tussen uitschrijven en verwijderen
              </div>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                Bij <strong className="text-orange-200">uitschrijven</strong>{" "}
                komt de plaats opnieuw vrij, maar blijft de leerling in de
                historiek staan. Bij{" "}
                <strong className="text-rose-200">
                  definitief verwijderen
                </strong>{" "}
                wordt de volledige registratie inclusief de historiek
                verwijderd.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}