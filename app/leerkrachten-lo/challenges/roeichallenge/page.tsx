"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type RawRow = Record<string, any>;

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
};

type Leerling = {
  id: string;
  naam: string;
  familyName: string;
  klas: string;
  schooljaar: string;
};

type Score = {
  id: string;
  schooljaar: string;

  roeier_1_id: string;
  roeier_1_naam: string;
  roeier_1_klas: string | null;

  roeier_2_id: string;
  roeier_2_naam: string;
  roeier_2_klas: string | null;

  roeier_3_id: string;
  roeier_3_naam: string;
  roeier_3_klas: string | null;

  afstand_meter: number;

  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.70)",
  border: "rgba(255,255,255,0.12)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function getValue(row: RawRow, keys: string[]) {
  for (const key of keys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }

  return "";
}

function normaliseerLeerling(row: RawRow): Leerling {
  const naam = normalizeText(
    getValue(row, [
      "volledige_naam",
      "naam",
      "full_name",
      "name",
    ])
  );

  const familyName = normalizeText(
    getValue(row, [
      "family_name",
      "familienaam",
      "achternaam",
      "last_name",
      "surname",
    ])
  );

  const username = normalizeText(
    getValue(row, ["username"])
  );

  const email = normalizeText(
    getValue(row, ["email"])
  );

  const id = username || email;

  return {
    id,
    naam,
    familyName,
    klas: normalizeText(
      getValue(row, [
        "klas_naam",
        "class_name",
        "klas",
        "profiel_klas_naam",
      ])
    ),
    schooljaar: normalizeText(
      getValue(row, ["schooljaar", "school_year"])
    ),
  };
}

function sorteerLeerlingen(a: Leerling, b: Leerling) {
  const klasCompare = a.klas.localeCompare(
    b.klas,
    "nl-BE",
    { numeric: true }
  );

  if (klasCompare !== 0) {
    return klasCompare;
  }

  const familyCompare = a.familyName.localeCompare(
    b.familyName,
    "nl-BE"
  );

  if (familyCompare !== 0) {
    return familyCompare;
  }

  return a.naam.localeCompare(b.naam, "nl-BE");
}

function formatMeter(value: number) {
  return new Intl.NumberFormat("nl-BE").format(value);
}

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function isAllowedRole(rol: string) {
  return (
    rol === "lo_leerkracht" ||
    rol === "leerkracht_lo" ||
    rol === "admin"
  );
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

function Medal({ position }: { position: number }) {
  if (position === 1) {
    return <span style={{ fontSize: 24 }}>🥇</span>;
  }

  if (position === 2) {
    return <span style={{ fontSize: 24 }}>🥈</span>;
  }

  if (position === 3) {
    return <span style={{ fontSize: 24 }}>🥉</span>;
  }

  return (
    <span
      style={{
        color: ui.muted,
        fontWeight: 950,
        fontSize: 16,
      }}
    >
      {position}
    </span>
  );
}

export default function RoeichallengeBeheerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allowed, setAllowed] = useState(false);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  const [schooljaar, setSchooljaar] = useState("");

  const [roeier1Id, setRoeier1Id] = useState("");
  const [roeier2Id, setRoeier2Id] = useState("");
  const [roeier3Id, setRoeier3Id] = useState("");

  const [zoek1, setZoek1] = useState("");
  const [zoek2, setZoek2] = useState("");
  const [zoek3, setZoek3] = useState("");

  const [afstand, setAfstand] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadScores(selectedSchooljaar: string) {
    if (!selectedSchooljaar) {
      setScores([]);
      return;
    }

    const { data, error } = await supabase
      .from("roeichallenge_scores")
      .select("*")
      .eq("schooljaar", selectedSchooljaar)
      .order("afstand_meter", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(
        readableSupabaseError(
          error,
          "Kon het klassement niet laden."
        )
      );
    }

    setScores((data ?? []) as Score[]);
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: sessionData } =
          await supabase.auth.getSession();

        const uid = sessionData.session?.user?.id;

        if (!uid) {
          setAllowed(false);
          return;
        }

        const { data: profielData, error: profielError } =
          await supabase
            .from("profielen")
            .select("id, volledige_naam, rol")
            .eq("id", uid)
            .single();

        if (profielError) {
          throw new Error(
            readableSupabaseError(
              profielError,
              "Kon profiel niet laden."
            )
          );
        }

        const rol = normalizeRole(profielData?.rol);

        setProfiel(profielData as Profiel);

        if (!isAllowedRole(rol)) {
          setAllowed(false);
          return;
        }

        setAllowed(true);

        const { data: leerlingenData, error: leerlingenError } =
          await supabase
            .from("eurofit_class_students_view")
            .select("*");

        if (leerlingenError) {
          throw new Error(
            readableSupabaseError(
              leerlingenError,
              "Kon leerlingen niet laden."
            )
          );
        }

        const rows = leerlingenData ?? [];

        setLeerlingenRows(rows);

        const gevondenSchooljaren = Array.from(
          new Set(
            rows
              .map((row: RawRow) =>
                normalizeText(
                  getValue(row, [
                    "schooljaar",
                    "school_year",
                  ])
                )
              )
              .filter(Boolean)
          )
        ).sort().reverse();

        const gekozenSchooljaar =
          gevondenSchooljaren[0] ?? "";

        setSchooljaar(gekozenSchooljaar);

        if (gekozenSchooljaar) {
          await loadScores(gekozenSchooljaar);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Kon de pagina niet laden."
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const schooljaren = useMemo(() => {
    return Array.from(
      new Set(
        leerlingenRows
          .map((row) =>
            normalizeText(
              getValue(row, [
                "schooljaar",
                "school_year",
              ])
            )
          )
          .filter(Boolean)
      )
    ).sort().reverse();
  }, [leerlingenRows]);

  const leerlingen = useMemo(() => {
    const map = new Map<string, Leerling>();

    leerlingenRows
      .map(normaliseerLeerling)
      .filter((leerling) => {
        if (!leerling.id) return false;
        if (!leerling.naam) return false;
        if (!leerling.klas) return false;

        if (leerling.schooljaar !== schooljaar) {
          return false;
        }

        const eersteTeken = leerling.klas
          .trim()
          .charAt(0);

        if (
          eersteTeken !== "1" &&
          eersteTeken !== "2"
        ) {
          return false;
        }

        return true;
      })
      .forEach((leerling) => {
        map.set(leerling.id, leerling);
      });

    return Array.from(map.values()).sort(
      sorteerLeerlingen
    );
  }, [leerlingenRows, schooljaar]);

  const roeier1 = useMemo(
    () =>
      leerlingen.find(
        (leerling) => leerling.id === roeier1Id
      ) ?? null,
    [leerlingen, roeier1Id]
  );

  const roeier2 = useMemo(
    () =>
      leerlingen.find(
        (leerling) => leerling.id === roeier2Id
      ) ?? null,
    [leerlingen, roeier2Id]
  );

  const roeier3 = useMemo(
    () =>
      leerlingen.find(
        (leerling) => leerling.id === roeier3Id
      ) ?? null,
    [leerlingen, roeier3Id]
  );

  function zoekLeerlingen(
    zoekterm: string,
    geselecteerdeId: string,
    andereIds: string[]
  ) {
    const zoek = zoekterm.trim().toLowerCase();

    return leerlingen
      .filter((leerling) => {
        if (
          andereIds.includes(leerling.id) &&
          leerling.id !== geselecteerdeId
        ) {
          return false;
        }

        if (!zoek) {
          return true;
        }

        const haystack =
          `${leerling.naam} ${leerling.familyName} ${leerling.klas}`.toLowerCase();

        return haystack.includes(zoek);
      })
      .slice(0, 40);
  }

  const resultaten1 = useMemo(
    () =>
      zoekLeerlingen(zoek1, roeier1Id, [
        roeier2Id,
        roeier3Id,
      ]),
    [
      zoek1,
      roeier1Id,
      roeier2Id,
      roeier3Id,
      leerlingen,
    ]
  );

  const resultaten2 = useMemo(
    () =>
      zoekLeerlingen(zoek2, roeier2Id, [
        roeier1Id,
        roeier3Id,
      ]),
    [
      zoek2,
      roeier1Id,
      roeier2Id,
      roeier3Id,
      leerlingen,
    ]
  );

  const resultaten3 = useMemo(
    () =>
      zoekLeerlingen(zoek3, roeier3Id, [
        roeier1Id,
        roeier2Id,
      ]),
    [
      zoek3,
      roeier1Id,
      roeier2Id,
      roeier3Id,
      leerlingen,
    ]
  );

  function resetForm() {
    setRoeier1Id("");
    setRoeier2Id("");
    setRoeier3Id("");

    setZoek1("");
    setZoek2("");
    setZoek3("");

    setAfstand("");
    setEditingId(null);

    setError(null);
    setSuccess(null);
  }

  async function handleSchooljaarChange(
    value: string
  ) {
    setSchooljaar(value);

    setRoeier1Id("");
    setRoeier2Id("");
    setRoeier3Id("");

    setZoek1("");
    setZoek2("");
    setZoek3("");

    setAfstand("");
    setEditingId(null);

    setError(null);
    setSuccess(null);

    try {
      await loadScores(value);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kon klassement niet laden."
      );
    }
  }

  async function saveScore() {
    setError(null);
    setSuccess(null);

    if (!profiel) {
      return;
    }

    if (!roeier1 || !roeier2 || !roeier3) {
      setError("Selecteer drie roeiers.");
      return;
    }

    if (
      roeier1.id === roeier2.id ||
      roeier1.id === roeier3.id ||
      roeier2.id === roeier3.id
    ) {
      setError(
        "Elke leerling mag maar één keer geselecteerd worden."
      );
      return;
    }

    const afstandNummer = Number(afstand);

    if (
      !Number.isInteger(afstandNummer) ||
      afstandNummer <= 0
    ) {
      setError(
        "Geef een geldige afstand in meter."
      );
      return;
    }

    if (!schooljaar) {
      setError(
        "Er is geen schooljaar geselecteerd."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        schooljaar,

        roeier_1_id: roeier1.id,
        roeier_1_naam: roeier1.naam,
        roeier_1_klas: roeier1.klas || null,

        roeier_2_id: roeier2.id,
        roeier_2_naam: roeier2.naam,
        roeier_2_klas: roeier2.klas || null,

        roeier_3_id: roeier3.id,
        roeier_3_naam: roeier3.naam,
        roeier_3_klas: roeier3.klas || null,

        afstand_meter: afstandNummer,
      };

      if (editingId) {
        const { error } = await supabase
          .from("roeichallenge_scores")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw new Error(
            readableSupabaseError(
              error,
              "Kon de score niet aanpassen."
            )
          );
        }

        setSuccess("Score aangepast.");
      } else {
        const { error } = await supabase
          .from("roeichallenge_scores")
          .insert({
            ...payload,
            created_by: profiel.id,
          });

        if (error) {
          throw new Error(
            readableSupabaseError(
              error,
              "Kon de score niet opslaan."
            )
          );
        }

        setSuccess("Score toegevoegd.");
      }

      setRoeier1Id("");
      setRoeier2Id("");
      setRoeier3Id("");

      setZoek1("");
      setZoek2("");
      setZoek3("");

      setAfstand("");
      setEditingId(null);

      await loadScores(schooljaar);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kon score niet opslaan."
      );
    } finally {
      setSaving(false);
    }
  }

  function editScore(score: Score) {
    setEditingId(score.id);

    setRoeier1Id(score.roeier_1_id);
    setRoeier2Id(score.roeier_2_id);
    setRoeier3Id(score.roeier_3_id);

    setZoek1("");
    setZoek2("");
    setZoek3("");

    setAfstand(String(score.afstand_meter));

    setError(null);
    setSuccess(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteScore(score: Score) {
    const namen = [
      score.roeier_1_naam,
      score.roeier_2_naam,
      score.roeier_3_naam,
    ].join(", ");

    const ok = window.confirm(
      `Ben je zeker dat je de score van ${namen} wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`
    );

    if (!ok) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from("roeichallenge_scores")
        .delete()
        .eq("id", score.id);

      if (error) {
        throw new Error(
          readableSupabaseError(
            error,
            "Kon de score niet verwijderen."
          )
        );
      }

      if (editingId === score.id) {
        setRoeier1Id("");
        setRoeier2Id("");
        setRoeier3Id("");

        setZoek1("");
        setZoek2("");
        setZoek3("");

        setAfstand("");
        setEditingId(null);
      }

      await loadScores(schooljaar);

      setSuccess("Score verwijderd.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kon score niet verwijderen."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Row Cup">
        <section style={styles.panel}>
          <p
            style={{
              margin: 0,
              color: ui.text,
            }}
          >
            Row Cup laden...
          </p>
        </section>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell
        title="LO App"
        subtitle="Geen toegang"
        userName={profiel?.volledige_naam ?? null}
      >
        <section style={styles.panel}>
          <h2 style={styles.h2}>
            Geen toegang
          </h2>

          <p style={styles.muted}>
            Deze pagina is alleen toegankelijk voor
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

  return (
    <AppShell
      title="LO App"
      subtitle="Row Cup"
      userName={profiel?.volledige_naam ?? null}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <BaseHero
          label="ROW CUP 2026"
          title={
            <>
              Score{" "}
              <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
                beheer
              </span>
            </>
          }
          description="Selecteer drie roeiers, registreer hun gezamenlijke afstand na 6 minuten en volg onmiddellijk het klassement."
          imageSrc="/challenges/roeichallenge.png"
          imageAlt="Row Cup 2026"
          quoteTitle="3 roeiers · 6 minuten"
          quote="Zoveel mogelijk meters. Elke meter telt."
          quoteAuthor="Row Cup 2026"
          actions={
            <Link
              href="/leerkrachten-lo/challenges"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition hover:-translate-y-0.5 hover:bg-black/45"
            >
              ← Terug naar challenges
            </Link>
          }
        />

        {error ? (
          <div style={styles.errorBox}>
            <b>Oeps:</b> {error}
          </div>
        ) : null}

        {success ? (
          <div style={styles.successBox}>
            <b>✓</b> {success}
          </div>
        ) : null}

        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.h2}>
                {editingId
                  ? "Score aanpassen"
                  : "Nieuwe score invoeren"}
              </h2>

              <p style={styles.muted}>
                Kies drie verschillende leerlingen uit de
                eerste graad. Ze mogen uit verschillende
                klassen komen.
              </p>
            </div>

            <div>
              <label style={styles.label}>
                Schooljaar
              </label>

              <select
                value={schooljaar}
                onChange={(e) =>
                  handleSchooljaarChange(
                    e.target.value
                  )
                }
                style={styles.schooljaarSelect}
              >
                {schooljaren.map((jaar) => (
                  <option
                    key={jaar}
                    value={jaar}
                  >
                    {jaar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.infoBar}>
            <span>👥</span>

            <span>
              <b>{leerlingen.length}</b>{" "}
              leerlingen beschikbaar in de eerste
              graad voor schooljaar{" "}
              <b>{schooljaar || "—"}</b>.
            </span>
          </div>

          <div
            className="roeiers-grid"
            style={styles.roeiersGrid}
          >
            <LeerlingSelector
              nummer={1}
              zoek={zoek1}
              setZoek={setZoek1}
              geselecteerd={roeier1}
              setGeselecteerd={setRoeier1Id}
              resultaten={resultaten1}
            />

            <LeerlingSelector
              nummer={2}
              zoek={zoek2}
              setZoek={setZoek2}
              geselecteerd={roeier2}
              setGeselecteerd={setRoeier2Id}
              resultaten={resultaten2}
            />

            <LeerlingSelector
              nummer={3}
              zoek={zoek3}
              setZoek={setZoek3}
              geselecteerd={roeier3}
              setGeselecteerd={setRoeier3Id}
              resultaten={resultaten3}
            />
          </div>

          <div style={styles.scoreBox}>
            <div
              style={{
                flex: "1 1 240px",
              }}
            >
              <label style={styles.label}>
                Afstand na 6 minuten
              </label>

              <div style={styles.meterInputWrap}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={afstand}
                  onChange={(e) =>
                    setAfstand(e.target.value)
                  }
                  placeholder="bv. 2438"
                  style={styles.meterInput}
                />

                <span style={styles.meterSuffix}>
                  meter
                </span>
              </div>
            </div>

            <div style={styles.actionRow}>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  style={styles.secondaryButton}
                >
                  Annuleren
                </button>
              ) : null}

              <button
                type="button"
                onClick={saveScore}
                disabled={saving}
                style={styles.primaryButton}
              >
                {saving
                  ? "Opslaan..."
                  : editingId
                  ? "Wijzigingen opslaan"
                  : "Score opslaan"}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.h2}>
                Klassement
              </h2>

              <p style={styles.muted}>
                {scores.length}{" "}
                {scores.length === 1
                  ? "team"
                  : "teams"}{" "}
                · {schooljaar}
              </p>
            </div>

            <div style={styles.livePill}>
              <span style={styles.liveDot} />
              LIVE
            </div>
          </div>

          {scores.length === 0 ? (
            <div style={styles.emptyBox}>
              Nog geen scores ingevoerd voor{" "}
              {schooljaar || "dit schooljaar"}.
            </div>
          ) : (
            <div
              style={styles.rankingList}
            >
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className="ranking-row"
                  style={{
                    ...styles.rankingRow,
                    ...(index < 3
                      ? styles.topRankingRow
                      : {}),
                  }}
                >
                  <div style={styles.position}>
                    <Medal
                      position={index + 1}
                    />
                  </div>

                  <div
                    style={styles.teamMembers}
                  >
                    <RoeierNaam
                      naam={
                        score.roeier_1_naam
                      }
                      klas={
                        score.roeier_1_klas
                      }
                    />

                    <RoeierNaam
                      naam={
                        score.roeier_2_naam
                      }
                      klas={
                        score.roeier_2_klas
                      }
                    />

                    <RoeierNaam
                      naam={
                        score.roeier_3_naam
                      }
                      klas={
                        score.roeier_3_klas
                      }
                    />
                  </div>

                  <div style={styles.distance}>
                    {formatMeter(
                      score.afstand_meter
                    )}
                    <span> m</span>
                  </div>

                  <div style={styles.rowActions}>
                    <button
                      type="button"
                      onClick={() =>
                        editScore(score)
                      }
                      disabled={saving}
                      style={styles.editButton}
                    >
                      Bewerken
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteScore(score)
                      }
                      disabled={saving}
                      style={styles.deleteButton}
                      title="Score verwijderen"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .roeiers-grid {
            grid-template-columns: 1fr !important;
          }

          .ranking-row {
            grid-template-columns:
              50px minmax(0, 1fr) auto !important;
          }

          .ranking-row > :last-child {
            grid-column: 2 / -1;
          }
        }

        @media (max-width: 640px) {
          .ranking-row {
            grid-template-columns:
              42px minmax(0, 1fr) !important;
          }

          .ranking-row > :nth-child(3) {
            grid-column: 2;
            justify-self: start !important;
            margin-top: 8px;
          }

          .ranking-row > :last-child {
            grid-column: 2;
          }
        }
      `}</style>
    </AppShell>
  );
}

function LeerlingSelector({
  nummer,
  zoek,
  setZoek,
  geselecteerd,
  setGeselecteerd,
  resultaten,
}: {
  nummer: number;
  zoek: string;
  setZoek: (value: string) => void;
  geselecteerd: Leerling | null;
  setGeselecteerd: (id: string) => void;
  resultaten: Leerling[];
}) {
  const [open, setOpen] = useState(false);

  function selecteer(leerling: Leerling) {
    setGeselecteerd(leerling.id);
    setZoek("");
    setOpen(false);
  }

  function wis() {
    setGeselecteerd("");
    setZoek("");
    setOpen(false);
  }

  return (
    <div style={styles.selectorCard}>
      <div style={styles.selectorTitle}>
        <span style={styles.numberCircle}>
          {nummer}
        </span>
        Roeier {nummer}
      </div>

      {geselecteerd ? (
        <div style={styles.selectedStudent}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.studentName}>
              {geselecteerd.naam}
            </div>

            <div style={styles.studentClass}>
              {geselecteerd.klas}
            </div>
          </div>

          <button
            type="button"
            onClick={wis}
            style={styles.clearButton}
            title="Andere leerling kiezen"
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            value={zoek}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setZoek(e.target.value);
              setOpen(true);
            }}
            placeholder="Zoek op naam of klas..."
            style={styles.searchInput}
          />

          {open ? (
            <div style={styles.searchResults}>
              {resultaten.length === 0 ? (
                <div style={styles.noResult}>
                  Geen leerling gevonden.
                </div>
              ) : (
                resultaten.map((leerling) => (
                  <button
                    type="button"
                    key={leerling.id}
                    onClick={() =>
                      selecteer(leerling)
                    }
                    style={styles.studentResult}
                  >
                    <span
                      style={{
                        display: "grid",
                        gap: 2,
                      }}
                    >
                      <b>
                        {leerling.naam}
                      </b>

                      <small
                        style={{
                          color: ui.muted,
                        }}
                      >
                        {leerling.klas}
                      </small>
                    </span>

                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 950,
                      }}
                    >
                      +
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RoeierNaam({
  naam,
  klas,
}: {
  naam: string;
  klas: string | null;
}) {
  return (
    <div style={styles.rider}>
      <span style={styles.riderName}>
        {naam}
      </span>

      {klas ? (
        <span style={styles.classBadge}>
          {klas}
        </span>
      ) : null}
    </div>
  );
}

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

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap",
  },

  h2: {
    margin: 0,
    color: ui.text,
    fontSize: 20,
    fontWeight: 950,
  },

  muted: {
    margin: "5px 0 0",
    color: ui.muted,
    fontSize: 13,
  },

  label: {
    display: "block",
    marginBottom: 7,
    color: ui.muted,
    fontSize: 12,
    fontWeight: 950,
  },

  schooljaarSelect: {
    height: 42,
    minWidth: 140,
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.38)",
    color: ui.text,
    padding: "0 12px",
    fontWeight: 900,
    outline: "none",
  },

  infoBar: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 12px",
    borderRadius: 15,
    border:
      "1px solid rgba(137,194,170,0.20)",
    background:
      "rgba(137,194,170,0.08)",
    color: ui.muted,
    fontSize: 12,
  },

  roeiersGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },

  selectorCard: {
    minWidth: 0,
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.20)",
  },

  selectorTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    color: ui.text,
    fontSize: 14,
    fontWeight: 950,
  },

  numberCircle: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background:
      "rgba(137,194,170,0.16)",
    border:
      "1px solid rgba(137,194,170,0.28)",
    fontSize: 12,
  },

  searchInput: {
    width: "100%",
    height: 46,
    borderRadius: 15,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.34)",
    color: ui.text,
    padding: "0 13px",
    fontWeight: 800,
    outline: "none",
  },

  searchResults: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    zIndex: 30,
    maxHeight: 320,
    overflowY: "auto",
    padding: 6,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(12,18,24,0.98)",
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.45)",
  },

  studentResult: {
    width: "100%",
    padding: "10px 11px",
    border: 0,
    borderBottom:
      `1px solid ${ui.border}`,
    background: "transparent",
    color: ui.text,
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },

  noResult: {
    padding: 12,
    color: ui.muted,
    fontSize: 13,
  },

  selectedStudent: {
    minHeight: 60,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    border:
      "1px solid rgba(137,194,170,0.30)",
    background:
      "rgba(137,194,170,0.10)",
  },

  studentName: {
    color: ui.text,
    fontWeight: 950,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  studentClass: {
    marginTop: 4,
    color: ui.muted,
    fontSize: 12,
    fontWeight: 800,
  },

  clearButton: {
    width: 32,
    height: 32,
    flex: "0 0 32px",
    borderRadius: 999,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.30)",
    color: ui.text,
    cursor: "pointer",
    fontSize: 20,
  },

  scoreBox: {
    marginTop: 16,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.18)",
  },

  meterInputWrap: {
    display: "flex",
    maxWidth: 320,
  },

  meterInput: {
    width: "100%",
    height: 50,
    borderRadius:
      "16px 0 0 16px",
    border:
      `1px solid ${ui.border}`,
    borderRight: 0,
    background:
      "rgba(0,0,0,0.38)",
    color: ui.text,
    padding: "0 14px",
    fontSize: 18,
    fontWeight: 950,
    outline: "none",
  },

  meterSuffix: {
    height: 50,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    borderRadius:
      "0 16px 16px 0",
    border:
      `1px solid ${ui.border}`,
    background:
      "rgba(255,255,255,0.07)",
    color: ui.muted,
    fontWeight: 900,
  },

  actionRow: {
    display: "flex",
    gap: 9,
    flexWrap: "wrap",
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: 15,
    border:
      "1px solid rgba(137,194,170,0.40)",
    background:
      "rgba(137,194,170,0.18)",
    color: ui.text,
    padding: "0 17px",
    fontWeight: 950,
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: 46,
    borderRadius: 15,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.28)",
    color: ui.text,
    padding: "0 17px",
    fontWeight: 900,
    cursor: "pointer",
  },

  errorBox: {
    padding: 13,
    borderRadius: 18,
    border:
      "1px solid rgba(255,85,112,0.30)",
    background:
      "rgba(255,85,112,0.13)",
    color: ui.text,
  },

  successBox: {
    padding: 13,
    borderRadius: 18,
    border:
      "1px solid rgba(80,220,140,0.30)",
    background:
      "rgba(80,220,140,0.12)",
    color: ui.text,
  },

  livePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 34,
    padding: "0 11px",
    borderRadius: 999,
    border:
      "1px solid rgba(80,220,140,0.25)",
    background:
      "rgba(80,220,140,0.10)",
    color: ui.text,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 0.7,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "#50dc8c",
  },

  rankingList: {
    marginTop: 16,
    display: "grid",
    gap: 8,
  },

  rankingRow: {
    display: "grid",
    gridTemplateColumns:
      "56px minmax(0,1fr) 150px auto",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.20)",
  },

  topRankingRow: {
    borderColor:
      "rgba(137,194,170,0.22)",
    background:
      "linear-gradient(90deg, rgba(137,194,170,0.09), rgba(0,0,0,0.20))",
  },

  position: {
    display: "flex",
    justifyContent: "center",
  },

  teamMembers: {
    display: "grid",
    gap: 5,
    minWidth: 0,
  },

  rider: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },

  riderName: {
    color: ui.text,
    fontSize: 13,
    fontWeight: 850,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  classBadge: {
    display: "inline-flex",
    flexShrink: 0,
    padding: "2px 7px",
    borderRadius: 999,
    border:
      `1px solid ${ui.border}`,
    background:
      "rgba(255,255,255,0.05)",
    color: ui.muted,
    fontSize: 10,
    fontWeight: 900,
  },

  distance: {
    justifySelf: "end",
    color: ui.text,
    fontSize: 22,
    fontWeight: 980,
    whiteSpace: "nowrap",
  },

  rowActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 7,
  },

  editButton: {
    minHeight: 38,
    borderRadius: 13,
    border:
      `1px solid ${ui.border}`,
    background:
      "rgba(255,255,255,0.06)",
    color: ui.text,
    padding: "0 11px",
    fontWeight: 900,
    cursor: "pointer",
  },

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    border:
      "1px solid rgba(255,85,112,0.28)",
    background:
      "rgba(255,85,112,0.12)",
    color: ui.text,
    cursor: "pointer",
  },

  emptyBox: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    border:
      `1px solid ${ui.border}`,
    background:
      "rgba(0,0,0,0.18)",
    color: ui.muted,
    fontSize: 13,
  },
};