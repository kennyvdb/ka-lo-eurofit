"use client";

import AppShell from "@/components/AppShell";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GradeBoard from "./GradeBoard";
import ResponsiveThreeCol from "./ResponsiveThreeCol";
import { ui } from "./theme";
import { formatRecord, getSuggestedSchooljaar, normalizeGender } from "./utils";
import type { Discipline, Entry } from "./types";

const supabase = createClient();

type Profiel = {
  id: string;
  volledige_naam: string | null;
};

type DbDiscipline = {
  id: string;
  slug: string;
  naam: string;
  eenheid: string | null;
  hoger_is_beter: boolean;
  actief: boolean;
};

type GradeMapping = {
  discipline_id: string;
  graad: number;
};

type HofRow = {
  discipline_id: string;
  graad: number;
  geslacht: string | null;
  schooljaar: string;
  volledige_naam: string | null;
  klas_naam: string | null;
  score_nummer: number | null;
  score_tekst: string | null;
  eenheid: string | null;
};

function emptyGenderSet() {
  return { allTime: [] as Entry[], schoolYear: [] as Entry[] };
}

export default function HallOfFamePage() {
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [dbDisciplines, setDbDisciplines] = useState<DbDiscipline[]>([]);
  const [gradeMappings, setGradeMappings] = useState<GradeMapping[]>([]);
  const [hofRows, setHofRows] = useState<HofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const schooljaar = getSuggestedSchooljaar();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const userId = sessionData.session?.user?.id;
        if (userId) {
          const { data: profielData, error: profielError } = await supabase
            .from("profielen")
            .select("id, volledige_naam")
            .eq("id", userId)
            .maybeSingle();

          if (profielError) throw profielError;
          setProfiel((profielData as Profiel | null) ?? null);
        }

        const { data: disciplineData, error: disciplineError } = await supabase
          .from("sportfolio_disciplines")
          .select("id, slug, naam, eenheid, hoger_is_beter, actief")
          .eq("actief", true)
          .order("naam");

        if (disciplineError) throw disciplineError;
        const active = (disciplineData ?? []) as DbDiscipline[];
        setDbDisciplines(active);

        const { data: mappingData, error: mappingError } = await supabase
          .from("sportfolio_discipline_graden")
          .select("discipline_id, graad");

        if (mappingError) throw mappingError;
        setGradeMappings((mappingData ?? []) as GradeMapping[]);

        const { data: recordData, error: recordError } = await supabase.rpc(
          "sportfolio_hall_of_fame",
          { p_vanaf_schooljaar: "2026-2027" }
        );

        if (recordError) throw recordError;
        setHofRows((recordData ?? []) as HofRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon Hall of Fame niet laden.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const disciplinesPerGraad = useMemo(() => {
    const mappedIds = new Set(gradeMappings.map((m) => m.discipline_id));

    const build = (graad: number): Discipline[] =>
      dbDisciplines
        .filter((d) => {
          // Zolang een discipline nog geen graadkoppeling heeft, tonen we hem in alle graden.
          // Zodra er koppelingen bestaan voor die discipline, gelden alleen die gekoppelde graden.
          if (!mappedIds.has(d.id)) return true;
          return gradeMappings.some((m) => m.discipline_id === d.id && m.graad === graad);
        })
        .map((d) => {
          const rows = hofRows.filter(
            (row) => row.discipline_id === d.id && Number(row.graad) === graad
          );

          const makeEntries = (
            gender: "jongen" | "meisje",
            currentYearOnly: boolean
          ): Entry[] => {
            const candidates = rows.filter((row) => {
              if (normalizeGender(row.geslacht) !== gender) return false;
              if (currentYearOnly && row.schooljaar !== schooljaar) return false;
              return row.score_nummer !== null || Boolean(row.score_tekst?.trim());
            });

            const sorted = [...candidates].sort((a, b) => {
              const av = a.score_nummer;
              const bv = b.score_nummer;
              if (av == null && bv == null) return 0;
              if (av == null) return 1;
              if (bv == null) return -1;
              return d.hoger_is_beter ? bv - av : av - bv;
            });

            const best = sorted[0];
            if (!best) return [];

            return [
              {
                name: best.volledige_naam ?? "Onbekende leerling",
                record: formatRecord(best.score_nummer, best.score_tekst, d.eenheid),
                extra: currentYearOnly
                  ? best.klas_naam ?? undefined
                  : [best.schooljaar, best.klas_naam].filter(Boolean).join(" • ") || undefined,
              },
            ];
          };

          return {
            key: d.slug,
            title: d.naam.toUpperCase(),
            boys: {
              ...emptyGenderSet(),
              allTime: makeEntries("jongen", false),
              schoolYear: makeEntries("jongen", true),
            },
            girls: {
              ...emptyGenderSet(),
              allTime: makeEntries("meisje", false),
              schoolYear: makeEntries("meisje", true),
            },
          };
        });

    return {
      graad1: build(1),
      graad2: build(2),
      graad3: build(3),
    };
  }, [dbDisciplines, gradeMappings, hofRows, schooljaar]);

  return (
    <AppShell
      title="LO App"
      subtitle="Hall of Fame"
      userName={profiel?.volledige_naam ?? null}
    >
      <main style={{ marginTop: 12 }}>
        <section style={{ width: "100%" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(190px, 25vw, 320px)",
              borderRadius: 22,
              overflow: "hidden",
              border: `1px solid ${ui.border}`,
              background: ui.panel,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <Image
              src="/Hall%20Of%20Fame%20(transparent).png"
              alt="Hall of Fame"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12.5,
              color: ui.muted,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>🏆 Bevestigde Sportfolio-records • jongens/meisjes • per graad</span>
            <span>
              Schooljaar: <b style={{ color: ui.text }}>{schooljaar}</b>
            </span>
          </div>
        </section>

        {error ? (
          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(248,113,113,0.25)",
              background: "rgba(248,113,113,0.10)",
              borderRadius: 14,
              padding: 14,
              color: "rgba(254,226,226,0.95)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <section style={{ marginTop: 14 }}>
          {loading ? (
            <div style={{ color: ui.muted, padding: 16 }}>Hall of Fame laden...</div>
          ) : (
            <ResponsiveThreeCol>
              <GradeBoard
                gradeTitle="1e GRAAD"
                theme="blue"
                schooljaar={schooljaar}
                disciplines={disciplinesPerGraad.graad1}
              />
              <GradeBoard
                gradeTitle="2e GRAAD"
                theme="green"
                schooljaar={schooljaar}
                disciplines={disciplinesPerGraad.graad2}
              />
              <GradeBoard
                gradeTitle="3e GRAAD"
                theme="greenDark"
                schooljaar={schooljaar}
                disciplines={disciplinesPerGraad.graad3}
              />
            </ResponsiveThreeCol>
          )}
        </section>
      </main>
    </AppShell>
  );
}
