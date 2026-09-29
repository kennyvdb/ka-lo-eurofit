"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type Tab =
  | "info"
  | "checklist"
  | "annulering"
  | "kamers"
  | "groepen"
  | "faq";

type ChecklistItem = {
  id: string;
  label: string;
  note?: string;
  important?: boolean;
};

type ChecklistGroup = {
  title: string;
  icon: string;
  items: ChecklistItem[];
};

/* =========================================================
   UI
========================================================= */

const ui = {
  text: "rgba(234,240,255,0.94)",
  muted: "rgba(234,240,255,0.70)",
  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

/* =========================================================
   TABS
========================================================= */

const tabs: {
  id: Tab;
  icon: string;
  label: string;
}[] = [
  { id: "info", icon: "🏔️", label: "Info" },
  { id: "checklist", icon: "🎒", label: "Checklist" },
  { id: "annulering", icon: "🛡️", label: "Annulering" },
  { id: "kamers", icon: "🛏️", label: "Kamers" },
  { id: "groepen", icon: "⛷️", label: "Groepen" },
  { id: "faq", icon: "❓", label: "FAQ" },
];

/* =========================================================
   CHECKLIST
========================================================= */

const checklistGroups: ChecklistGroup[] = [
  {
    title: "Documenten & geld",
    icon: "🪪",
    items: [
      {
        id: "identiteitskaart",
        label: "Identiteitskaart",
        important: true,
      },
      {
        id: "eurocross",
        label: "Eurocross-kaart",
        note: "Je ontvangt deze op de bus bij vertrek.",
      },
      {
        id: "portefeuille",
        label: "Portefeuille",
      },
      {
        id: "zakgeld",
        label: "Zakgeld",
      },
      {
        id: "bankkaart",
        label: "Bankkaart",
        note: "Indien je er één gebruikt.",
      },
    ],
  },

  {
    title: "Handbagage voor de bus",
    icon: "🎒",
    items: [
      {
        id: "skisokken-handbagage",
        label: "1 paar skisokken",
        note: "Zeker in je handbagage steken bij vertrek.",
        important: true,
      },
      {
        id: "wagenziekte",
        label: "Middel tegen wagenziekte",
        note: "Enkel indien je hier last van hebt.",
      },
      {
        id: "drinkfles",
        label: "Drinkfles",
      },
      {
        id: "snack-bus",
        label: "Kleine snack voor onderweg",
      },
      {
        id: "gsm-handbagage",
        label: "Gsm",
      },
      {
        id: "oordopjes",
        label: "Oortjes / hoofdtelefoon",
      },
      {
        id: "powerbank",
        label: "Powerbank",
        note: "Optioneel.",
      },
    ],
  },

  {
    title: "Ski- of snowboardkledij",
    icon: "⛷️",
    items: [
      {
        id: "skivest",
        label: "Skivest",
        note: "Gebruik deze ook als gewone jas. Dat bespaart plaats in je valies.",
        important: true,
      },
      {
        id: "skibroek",
        label: "Skibroek(en)",
      },
      {
        id: "skihandschoenen",
        label: "Skihandschoenen",
        important: true,
      },
      {
        id: "skisokken",
        label: "Voldoende skisokken",
      },
      {
        id: "skibril",
        label: "Skibril",
      },
      {
        id: "thermisch-boven",
        label: "Thermisch onderhemd / thermische baselayer",
      },
      {
        id: "thermisch-onder",
        label: "Thermische broek",
      },
      {
        id: "fleece",
        label: "Fleece of warme tussenlaag",
      },
      {
        id: "buff",
        label: "Buff / nekwarmer",
        note: "Of een sjaal.",
      },
      {
        id: "muts",
        label: "Muts",
      },
      {
        id: "zonnebril",
        label: "Zonnebril",
      },
    ],
  },

  {
    title: "Bescherming tegen zon & koude",
    icon: "☀️",
    items: [
      {
        id: "zonnecreme",
        label: "Zonnecrème",
        important: true,
      },
      {
        id: "lippenbalsem",
        label: "Lippenbalsem",
      },
      {
        id: "aftersun",
        label: "Aftersun of verzorgende crème",
      },
    ],
  },

  {
    title: "Gewone kledij",
    icon: "👕",
    items: [
      {
        id: "tshirts",
        label: "T-shirts",
      },
      {
        id: "truien",
        label: "Truien",
      },
      {
        id: "broeken",
        label: "Broeken",
      },
      {
        id: "ondergoed",
        label: "Voldoende ondergoed",
      },
      {
        id: "sokken",
        label: "Gewone sokken",
      },
      {
        id: "pyjama",
        label: "Pyjama",
      },
      {
        id: "schoenen",
        label: "Comfortabele schoenen",
      },
      {
        id: "pantoffels",
        label: "Pantoffels / slippers",
        note: "Optioneel voor in het verblijf.",
      },
    ],
  },

  {
    title: "Toilet & verzorging",
    icon: "🧴",
    items: [
      {
        id: "handdoeken",
        label: "Handdoeken",
        note: "Beddengoed is voorzien door het pension.",
        important: true,
      },
      {
        id: "toiletgerief",
        label: "Toiletgerief",
      },
      {
        id: "tandenborstel",
        label: "Tandenborstel & tandpasta",
      },
      {
        id: "deo",
        label: "Deodorant",
      },
      {
        id: "douchegel",
        label: "Douchegel / shampoo",
      },
      {
        id: "haarborstel",
        label: "Kam / haarborstel",
      },
      {
        id: "maandverband",
        label: "Eventuele maandverbanden / tampons",
      },
      {
        id: "zakdoeken",
        label: "Zakdoeken",
      },
    ],
  },

  {
    title: "Medicatie",
    icon: "💊",
    items: [
      {
        id: "persoonlijke-medicatie",
        label: "Persoonlijke medicatie",
        note: "Neem enkel medicatie mee die je zelf nodig hebt.",
      },
    ],
  },

  {
    title: "Elektronica",
    icon: "🔌",
    items: [
      {
        id: "gsm-lader",
        label: "Gsm-lader",
        important: true,
      },
      {
        id: "smartwatch-lader",
        label: "Lader smartwatch",
        note: "Indien nodig.",
      },
      {
        id: "powerbank-extra",
        label: "Powerbank + laadkabel",
        note: "Optioneel.",
      },
    ],
  },

  {
    title: "Vrije tijd",
    icon: "🎲",
    items: [
      {
        id: "gezelschapsspel",
        label: "1 gezelschapsspel per 4 vrienden",
        note: "Spreek onderling af wie een spel meeneemt.",
      },
      {
        id: "boek",
        label: "Boek / tijdschrift",
        note: "Optioneel.",
      },
    ],
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function SneeuwstagePage() {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const [checked, setChecked] = useState<Record<string, boolean>>(
    {}
  );

  const [checklistLoaded, setChecklistLoaded] = useState(false);

  /* =======================================================
     CHECKLIST LADEN
  ======================================================= */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "sneeuwstage-2026-checklist"
      );

      if (saved) {
        setChecked(JSON.parse(saved));
      }
    } catch (error) {
      console.error(
        "Checklist kon niet geladen worden:",
        error
      );
    } finally {
      setChecklistLoaded(true);
    }
  }, []);

  /* =======================================================
     CHECKLIST OPSLAAN
  ======================================================= */

  useEffect(() => {
    if (!checklistLoaded) return;

    try {
      window.localStorage.setItem(
        "sneeuwstage-2026-checklist",
        JSON.stringify(checked)
      );
    } catch (error) {
      console.error(
        "Checklist kon niet opgeslagen worden:",
        error
      );
    }
  }, [checked, checklistLoaded]);

  /* =======================================================
     CHECKLIST STATISTIEKEN
  ======================================================= */

  const allItems = useMemo(
    () => checklistGroups.flatMap((group) => group.items),
    []
  );

  const checkedCount = allItems.filter(
    (item) => checked[item.id]
  ).length;

  const totalCount = allItems.length;

  const percentage =
    totalCount > 0
      ? Math.round((checkedCount / totalCount) * 100)
      : 0;

  function toggleItem(id: string) {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function resetChecklist() {
    const ok = window.confirm(
      "Wil je alle vinkjes van de checklist verwijderen?"
    );

    if (!ok) return;

    setChecked({});
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Sneeuwstage"
    >
      {/* ===================================================
          HERO
      =================================================== */}

      <BaseHero
        label="EXTRAMURALE ACTIVITEIT"
        title={
          <>
            Sneeuwstage{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              2026
            </span>
          </>
        }
        description="Alle praktische informatie voor onze sneeuwstage naar Ahrntal in Oostenrijk."
        imageSrc="/lo/LO.png"
        imageAlt="Sneeuwstage"
        quoteTitle="Ahrntal • Oostenrijk"
        quote="Samen sporten, leren en genieten van de bergen."
        quoteAuthor="LO team"
        actions={
          <Link
            href="/extramurale-sportactiviteiten"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45"
          >
            ← Terug
          </Link>
        }
      />

      {/* ===================================================
          NAVIGATIE
          GSM: 2 kolommen
          TABLET: 3 kolommen
          DESKTOP: 6 kolommen
      =================================================== */}

      <div className="mt-5">
        <div className="mb-2 text-[12px] font-black uppercase tracking-[0.12em] text-white/45">
          Sneeuwstage
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={[
                  "relative flex min-h-[76px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
                  active
                    ? "border-[#89C2AA]/60 bg-[#4B8E8D]/20 shadow-[0_8px_24px_rgba(0,0,0,0.20)]"
                    : "border-white/10 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl transition",
                    active
                      ? "bg-[#89C2AA]/20"
                      : "bg-black/20",
                  ].join(" ")}
                >
                  {tab.icon}
                </span>

                <span className="min-w-0">
                  <span
                    className={[
                      "block text-[13px] font-black leading-tight",
                      active
                        ? "text-white"
                        : "text-white/75",
                    ].join(" ")}
                  >
                    {tab.label}
                  </span>

                  {active && (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[#89C2AA]">
                      Geopend
                    </span>
                  )}
                </span>

                {active && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#89C2AA] shadow-[0_0_10px_rgba(137,194,170,0.75)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================
          ALGEMENE INFO
      =================================================== */}

      {activeTab === "info" && (
        <section className="mt-4">
          <SectionTitle
            title="Algemene informatie"
            description="De belangrijkste informatie over de sneeuwstage."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon="📅"
              label="Vertrek"
              value="18 december 2026"
            />

            <InfoCard
              icon="🏠"
              label="Terug"
              value="24 december 2026"
            />

            <InfoCard
              icon="📍"
              label="Bestemming"
              value="Ahrntal, Oostenrijk"
            />

            <InfoCard
              icon="💶"
              label="Prijs"
              value="€ 775"
            />

            <InfoCard
              icon="⛷️"
              label="Activiteit"
              value="Ski of snowboard"
            />

            <InfoCard
              icon="🚌"
              label="Vervoer"
              value="Autocar"
            />
          </div>

          <div style={styles.panel} className="mt-4">
            <div className="text-lg font-black text-white">
              🏔️ Sneeuwstage
            </div>

            <p className="mt-2 mb-0 text-sm leading-6 text-white/70">
              Op deze pagina vind je alle praktische
              informatie voor de sneeuwstage. Controleer voor
              vertrek zeker de checklist en lees ook de
              informatie over annulering en verzekering.
            </p>
          </div>

          <div
            style={styles.notice}
            className="mt-3"
          >
            <div className="font-black text-white">
              ℹ️ Meer praktische informatie volgt
            </div>

            <div className="mt-1 text-sm leading-6 text-white/70">
              Exact vertrekuur, vertrekplaats en eventuele
              laatste afspraken worden later meegedeeld.
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          CHECKLIST
      =================================================== */}

      {activeTab === "checklist" && (
        <section className="mt-4">
          <SectionTitle
            title="Checklist"
            description="Vink af wat je al hebt klaargelegd. Je voortgang wordt automatisch op dit toestel bewaard."
          />

          <div style={styles.panel}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black text-white">
                  🎒 Mijn bagage
                </div>

                <div className="mt-1 text-xs text-white/60">
                  {checkedCount} van {totalCount} afgevinkt
                </div>
              </div>

              <div className="text-2xl font-black text-white">
                {percentage}%
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-white/70 transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-3 rounded-3xl border border-amber-300/20 bg-amber-300/[0.08] p-4">
            <div className="font-black text-white">
              ⚠️ Vergeet je handbagage niet
            </div>

            <p className="mt-1 mb-0 text-sm leading-6 text-white/70">
              Steek bij vertrek minstens{" "}
              <strong className="text-white">
                één paar skisokken
              </strong>{" "}
              in je handbagage.
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {checklistGroups.map((group) => (
              <div
                key={group.title}
                style={styles.panel}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">
                    {group.icon}
                  </span>

                  <h3 className="m-0 text-base font-black text-white">
                    {group.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    const done = !!checked[item.id];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          toggleItem(item.id)
                        }
                        className={[
                          "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition",
                          done
                            ? "border-emerald-300/20 bg-emerald-300/[0.08]"
                            : "border-white/10 bg-black/10 hover:bg-white/[0.05]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-sm font-black",
                            done
                              ? "border-emerald-300/30 bg-emerald-300/20 text-emerald-100"
                              : "border-white/20 bg-black/20 text-transparent",
                          ].join(" ")}
                        >
                          ✓
                        </span>

                        <span className="min-w-0">
                          <span
                            className={[
                              "block text-sm font-bold",
                              done
                                ? "text-white/55 line-through"
                                : "text-white",
                            ].join(" ")}
                          >
                            {item.label}

                            {item.important && !done && (
                              <span className="ml-2 text-[10px] font-black uppercase tracking-wide text-amber-200">
                                belangrijk
                              </span>
                            )}
                          </span>

                          {item.note && (
                            <span className="mt-1 block text-xs leading-5 text-white/55">
                              {item.note}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={resetChecklist}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs font-black text-white/60 transition hover:bg-black/40 hover:text-white"
            >
              Checklist opnieuw instellen
            </button>
          </div>
        </section>
      )}

      {/* ===================================================
          ANNULERING
      =================================================== */}

      {activeTab === "annulering" && (
        <section className="mt-4">
          <SectionTitle
            title="Annulering & verzekering"
            description="De belangrijkste JOSK-annuleringsvoorwaarden voor de sneeuwstage."
          />

          <div className="grid gap-3 md:grid-cols-3">
            <PenaltyCard
              period="Tot en met 29 dagen voor vertrek"
              cost="€ 250 p.p."
            />

            <PenaltyCard
              period="Van 28 t.e.m. 8 dagen voor vertrek"
              cost="50%"
              sub="van de totale reissom p.p."
            />

            <PenaltyCard
              period="Vanaf 7 dagen voor vertrek"
              cost="100%"
              sub="van de totale reissom p.p."
            />
          </div>

          <div
            style={styles.panel}
            className="mt-4"
          >
            <div className="text-lg font-black text-white">
              🛡️ PROTECTIONS annuleringsverzekering
            </div>

            <p className="mt-2 text-sm leading-6 text-white/70">
              JOSK adviseert om bij boeking een
              annuleringsverzekering PROTECTIONS af te
              sluiten. Deze verzekering voor schoolreizen
              kost <strong className="text-white">€25 p.p.</strong>
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <SmallStat
                label="Poliskost"
                value="€25"
              />

              <SmallStat
                label="Eigen risico"
                value="€50"
              />

              <SmallStat
                label="Totale kost*"
                value="€75"
              />
            </div>

            <p className="mt-3 mb-0 text-xs leading-5 text-white/50">
              * Volgens de JOSK-voorwaarden bij een geldige
              reden en na voorlegging van de nodige geldige
              bewijsstukken.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-red-300/20 bg-red-300/[0.07] p-4">
            <div className="font-black text-white">
              ⚠️ Annuleren moet schriftelijk
            </div>

            <p className="mt-2 mb-0 text-sm leading-6 text-white/70">
              Volgens de JOSK-voorwaarden moet een annulering
              onmiddellijk en schriftelijk aan JOSK worden
              meegedeeld. Telefonische of mondelinge
              annuleringen worden niet aanvaard.
            </p>
          </div>

          <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="font-black text-white">
              🚫 No-show
            </div>

            <p className="mt-2 mb-0 text-sm leading-6 text-white/70">
              Niet komen opdagen zonder schriftelijke
              verwittiging resulteert volgens JOSK
              automatisch in het verlies van 100% van de
              reissom.
            </p>
          </div>

          <div className="mt-4 text-xs leading-5 text-white/45">
            Dit is een vereenvoudigd overzicht. De officiële
            JOSK-reis- en annuleringsvoorwaarden blijven
            bepalend.
          </div>
        </section>
      )}

      {/* ===================================================
          KAMERS
      =================================================== */}

      {activeTab === "kamers" && (
        <ComingSoon
          icon="🛏️"
          title="Kamerverdeling"
          description="De kamerverdeling wordt later door het LO-team gepubliceerd."
        />
      )}

      {/* ===================================================
          GROEPEN
      =================================================== */}

      {activeTab === "groepen" && (
        <ComingSoon
          icon="⛷️"
          title="Ski- & snowboardgroepen"
          description="De groepsverdeling wordt later door het LO-team gepubliceerd."
        />
      )}

      {/* ===================================================
          FAQ
      =================================================== */}

      {activeTab === "faq" && (
        <section className="mt-4">
          <SectionTitle
            title="Veelgestelde vragen"
            description="Praktische antwoorden voor de sneeuwstage."
          />

          <div className="space-y-3">
            <Faq
              question="Moet ik zelf handdoeken meenemen?"
              answer="Ja. Neem zelf handdoeken mee. Het beddengoed wordt door het pension voorzien."
            />

            <Faq
              question="Waar krijg ik mijn Eurocross-kaart?"
              answer="Je ontvangt de Eurocross-kaart op de bus bij vertrek."
            />

            <Faq
              question="Wat moet zeker in mijn handbagage?"
              answer="Voorzie bij vertrek minstens één paar skisokken in je handbagage."
            />

            <Faq
              question="Wat als ik last heb van wagenziekte?"
              answer="Wie last heeft van wagenziekte voorziet zelf een geschikt middel tegen wagenziekte."
            />

            <Faq
              question="Moet ik een extra gewone jas meenemen?"
              answer="De school raadt aan om je skivest ook als gewone jas te gebruiken. Zo bespaar je plaats in je valies."
            />

            <Faq
              question="Moet iedereen een gezelschapsspel meenemen?"
              answer="Nee. Voorzie ongeveer één gezelschapsspel per vier vrienden en spreek onderling af wie welk spel meeneemt."
            />

            <Faq
              question="Wanneer wordt de kamerverdeling bekendgemaakt?"
              answer="De kamerverdeling wordt later door het LO-team op deze pagina gepubliceerd."
            />

            <Faq
              question="Wanneer wordt mijn ski- of snowboardgroep bekendgemaakt?"
              answer="De groepsverdeling wordt later door het LO-team op deze pagina gepubliceerd."
            />
          </div>
        </section>
      )}
    </AppShell>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="m-0 text-lg font-black text-white">
        {title}
      </h2>

      {description && (
        <p className="mt-1 mb-0 text-sm leading-6 text-white/60">
          {description}
        </p>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div style={styles.panel}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-white/45">
            {label}
          </div>

          <div className="mt-1 font-black text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function PenaltyCard({
  period,
  cost,
  sub,
}: {
  period: string;
  cost: string;
  sub?: string;
}) {
  return (
    <div style={styles.panel}>
      <div className="text-xs font-bold leading-5 text-white/55">
        {period}
      </div>

      <div className="mt-3 text-3xl font-black text-white">
        {cost}
      </div>

      {sub && (
        <div className="mt-1 text-xs text-white/50">
          {sub}
        </div>
      )}
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="text-xs text-white/50">
        {label}
      </div>

      <div className="mt-1 text-lg font-black text-white">
        {value}
      </div>
    </div>
  );
}

function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mt-4">
      <div
        style={styles.panel}
        className="py-10 text-center"
      >
        <div className="text-5xl">
          {icon}
        </div>

        <div className="mt-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-100">
          🚧 Binnenkort
        </div>

        <h2 className="mt-4 mb-0 text-xl font-black text-white">
          {title}
        </h2>

        <p className="mx-auto mt-2 mb-0 max-w-lg text-sm leading-6 text-white/60">
          {description}
        </p>
      </div>
    </section>
  );
}

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details
      style={styles.panel}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-white">
        <span>{question}</span>

        <span className="text-lg text-white/45 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <p className="mt-3 mb-0 border-t border-white/10 pt-3 text-sm leading-6 text-white/65">
        {answer}
      </p>
    </details>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
    backdropFilter: "blur(10px)",
  },

  notice: {
    padding: 16,
    borderRadius: 22,
    background: "rgba(79,142,141,0.10)",
    border: "1px solid rgba(137,194,170,0.20)",
  },
};
