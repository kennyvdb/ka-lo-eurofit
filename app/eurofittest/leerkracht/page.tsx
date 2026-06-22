"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

const supabase = createClient();

type RawRow = Record<string, any>;

type Leerling = {
  id: string;
  naam: string;
  klas: string;
  loGroep: string;
};

type NormRow = {
  test_type: string;
  geslacht: string;
  leeftijd: number;
  p5: number;
  p20: number;
  p50: number;
  p80: number;
  p95: number;
};

const LOWER_IS_BETTER = new Set([
  "flamingo",
  "plate_tapping",
  "agility_shuttle_run_10x5",
]);

const TEST_LABELS: Record<string, string> = {
  flamingo: "Flamingo balans",
  plate_tapping: "Plate tapping",
  sit_and_reach: "Sit & reach",
  standing_broad_jump: "Verspringen uit stand",
  handgrip: "Handknijpkracht",
  sit_ups: "Sit-ups",
  bent_arm_hang: "Bent-arm hang",
  agility_shuttle_run_10x5: "10×5 shuttle run",
  shuttle_run_20m: "20m shuttle run",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.74)",
  border: "rgba(255,255,255,0.12)",
  panel:
    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
};

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

function leerlingKey(naam: string, klas: string) {
  return `${naam.trim()}__${klas.trim()}`;
}

function normaliseerLeerling(row: RawRow): Leerling {
  const email = String(getValue(row, ["email"])).trim();
  const username = String(getValue(row, ["username"])).trim();

  return {
    id: username || email,
    naam: String(getValue(row, ["volledige_naam"])).trim(),
    klas: String(getValue(row, ["klas_naam"])).trim(),
    loGroep: String(getValue(row, ["lo_groepen"])).trim() || "Onbekend",
  };
}

function normalizeGeslacht(value: unknown) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["m", "man", "jongen", "boy"].includes(v)) return "jongen";
  if (["v", "vrouw", "meisje", "girl"].includes(v)) return "meisje";
  return null;
}

function berekenLeeftijd(geboortedatumISO: string, testDatumISO: string) {
  const birth = new Date(geboortedatumISO);
  const test = new Date(testDatumISO);

  let leeftijd = test.getFullYear() - birth.getFullYear();
  const m = test.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && test.getDate() < birth.getDate())) leeftijd--;

  if (leeftijd > 17) leeftijd = 17;
  if (leeftijd < 9) leeftijd = 9;

  return leeftijd;
}

function beoordeelWaarde(waarde: number, norm: NormRow) {
  const lowerBetter = LOWER_IS_BETTER.has(norm.test_type);

  const COLORS = {
    zeerZwak: "#7a0000",
    zwak: "#ff8c00",
    gemZwak: "#ffc966",
    gemGoed: "#a6f3a6",
    goed: "#2e8b57",
    zeerGoed: "#0f5a2f",
  };

  if (!lowerBetter) {
    if (waarde <= norm.p5) return { label: "Zeer zwak", kleur: COLORS.zeerZwak };
    if (waarde < norm.p20) return { label: "Zwak", kleur: COLORS.zwak };
    if (waarde < norm.p50) return { label: "Gemiddeld zwak", kleur: COLORS.gemZwak };
    if (waarde < norm.p80) return { label: "Gemiddeld goed", kleur: COLORS.gemGoed };
    if (waarde < norm.p95) return { label: "Goed", kleur: COLORS.goed };
    return { label: "Zeer goed", kleur: COLORS.zeerGoed };
  }

  if (waarde <= norm.p95) return { label: "Zeer goed", kleur: COLORS.zeerGoed };
  if (waarde <= norm.p80) return { label: "Goed", kleur: COLORS.goed };
  if (waarde <= norm.p50) return { label: "Gemiddeld goed", kleur: COLORS.gemGoed };
  if (waarde <= norm.p20) return { label: "Gemiddeld zwak", kleur: COLORS.gemZwak };
  if (waarde <= norm.p5) return { label: "Zwak", kleur: COLORS.zwak };
  return { label: "Zeer zwak", kleur: COLORS.zeerZwak };
}

export default function EurofitLeerkrachtPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [resultatenRows, setResultatenRows] = useState<RawRow[]>([]);
  const [normen, setNormen] = useState<NormRow[]>([]);
  const [profielen, setProfielen] = useState<RawRow[]>([]);

  const [schooljaar, setSchooljaar] = useState("Alle");
  const [klasFilter, setKlasFilter] = useState("Alle");
  const [loGroepFilter, setLoGroepFilter] = useState("Alle");
  const [zoekterm, setZoekterm] = useState("");

  const [openKlas, setOpenKlas] = useState<string | null>(null);
  const [openType, setOpenType] = useState<"ingevuld" | "ontbreekt" | null>(null);
  const [selectedLeerling, setSelectedLeerling] = useState<Leerling | null>(null);

  useEffect(() => {
    injectResponsiveCSS();
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;

      if (!uid) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profiel } = await supabase
        .from("profielen")
        .select("rol")
        .eq("id", uid)
        .single();

      if (!["lo_leerkracht", "admin"].includes(String(profiel?.rol))) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      const [leerlingenRes, resultatenRes, normenRes, profielenRes] =
        await Promise.all([
          supabase.from("eurofit_class_students_view").select("*"),
          supabase.from("eurofit_admin_view").select("*"),
          supabase
            .from("eurofit_normen")
            .select("test_type, geslacht, leeftijd, p5, p20, p50, p80, p95"),
          supabase.from("profielen").select("id, geslacht, geboortedatum"),
        ]);

      if (leerlingenRes.error) setError(leerlingenRes.error.message);
      if (resultatenRes.error) setError(resultatenRes.error.message);
      if (normenRes.error) setError(normenRes.error.message);
      if (profielenRes.error) setError(profielenRes.error.message);

      setLeerlingenRows(leerlingenRes.data ?? []);
      setResultatenRows(resultatenRes.data ?? []);
      setNormen((normenRes.data ?? []) as NormRow[]);
      setProfielen(profielenRes.data ?? []);

      setLoading(false);
    };

    run();
  }, []);

  const leerlingen = useMemo(() => {
    return leerlingenRows
      .map(normaliseerLeerling)
      .filter((l) => l.id && l.naam && isEchteKlas(l.klas));
  }, [leerlingenRows]);

  const schooljaren = useMemo(() => {
    const set = new Set<string>();
    resultatenRows.forEach((r) => {
      if (r.schooljaar) set.add(String(r.schooljaar));
    });
    return ["Alle", ...Array.from(set).sort().reverse()];
  }, [resultatenRows]);

  const klassen = useMemo(() => {
    const set = new Set<string>();
    leerlingen.forEach((l) => {
      if (isEchteKlas(l.klas)) set.add(l.klas);
    });
    return ["Alle", ...Array.from(set).sort()];
  }, [leerlingen]);

  const ingevuldKeys = useMemo(() => {
    const set = new Set<string>();

    resultatenRows.forEach((r) => {
      const naam = String(r.volledige_naam ?? "").trim();
      const klas = String(r.profiel_klas_naam ?? r.klas_naam ?? "").trim();
      const rowSchooljaar = r.schooljaar ? String(r.schooljaar) : "";

      if (
        naam &&
        klas &&
        (schooljaar === "Alle" || rowSchooljaar === schooljaar)
      ) {
        set.add(leerlingKey(naam, klas));
      }
    });

    return set;
  }, [resultatenRows, schooljaar]);

  const gefilterdeLeerlingen = useMemo(() => {
    return leerlingen.filter((l) => {
      if (klasFilter !== "Alle" && l.klas !== klasFilter) return false;
      if (loGroepFilter !== "Alle" && l.loGroep !== loGroepFilter) return false;
      if (zoekterm && !l.naam.toLowerCase().includes(zoekterm.toLowerCase())) return false;
      return true;
    });
  }, [leerlingen, klasFilter, loGroepFilter, zoekterm]);

  const klassenOverzicht = useMemo(() => {
    const map = new Map<string, Leerling[]>();

    gefilterdeLeerlingen.forEach((leerling) => {
      if (!map.has(leerling.klas)) map.set(leerling.klas, []);
      map.get(leerling.klas)!.push(leerling);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [gefilterdeLeerlingen]);

  const geselecteerdeResultaten = useMemo(() => {
    if (!selectedLeerling) return [];

    return resultatenRows
      .filter((r) => {
        const naam = String(r.volledige_naam ?? "").trim();
        const klas = String(r.profiel_klas_naam ?? r.klas_naam ?? "").trim();
        const rowSchooljaar = r.schooljaar ? String(r.schooljaar) : "";

        return (
          leerlingKey(naam, klas) ===
            leerlingKey(selectedLeerling.naam, selectedLeerling.klas) &&
          (schooljaar === "Alle" || rowSchooljaar === schooljaar)
        );
      })
      .sort((a, b) => String(a.test_type ?? "").localeCompare(String(b.test_type ?? "")));
  }, [resultatenRows, selectedLeerling, schooljaar]);

  const totaalLeerlingen = gefilterdeLeerlingen.length;
  const totaalKlassen = klassenOverzicht.length;
  const totaalIngevuld = gefilterdeLeerlingen.filter((l) =>
    ingevuldKeys.has(leerlingKey(l.naam, l.klas))
  ).length;
  const totaalOntbreekt = totaalLeerlingen - totaalIngevuld;

  function getEvaluatie(row: RawRow) {
    if (!row.test_type || row.waarde === null || !row.test_datum) return null;

    const profiel = profielen.find((p) => p.id === row.leerling_id);
    if (!profiel?.geboortedatum) return null;

    const geslacht = normalizeGeslacht(profiel.geslacht);
    if (!geslacht) return null;

    const leeftijd = berekenLeeftijd(profiel.geboortedatum, row.test_datum);

    const norm = normen.find(
      (n) =>
        n.test_type === row.test_type &&
        normalizeGeslacht(n.geslacht) === geslacht &&
        Number(n.leeftijd) === leeftijd
    );

    if (!norm) return null;

    return beoordeelWaarde(Number(row.waarde), norm);
  }

  function toggleKlas(klas: string, type: "ingevuld" | "ontbreekt") {
    if (openKlas === klas && openType === type) {
      setOpenKlas(null);
      setOpenType(null);
      return;
    }

    setOpenKlas(klas);
    setOpenType(type);
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Eurofit leerkracht">
        <p style={{ color: ui.text }}>Laden...</p>
      </AppShell>
    );
  }

  if (!allowed) {
    return (
      <AppShell title="LO App" subtitle="Geen toegang">
        <section style={styles.panel}>
          <h2 style={{ margin: 0, color: ui.text }}>Geen toegang</h2>
          <p style={{ color: ui.muted }}>
            Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.
          </p>
          <Link href="/eurofittest" style={{ color: ui.text, fontWeight: 900 }}>
            Terug naar Eurofit →
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Eurofit leerkracht">
      <BaseHero
        label="LO-leerkracht"
        title={
          <>
            Eurofit{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              dashboard
            </span>
          </>
        }
        description="Volg per klas op wie Eurofit heeft ingevuld. Leerlingen en klassen komen uit eurofit_class_students_view."
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="Eurofit dashboard"
        quoteTitle="Overzicht"
        quote="Meet. Volg op. Begeleid."
        quoteAuthor="LO App"
        actions={
          <Link
            href="/eurofittest"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)]"
          >
            Terug naar Eurofit →
          </Link>
        }
      />

      {error ? (
        <div style={styles.error}>
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      <section className="stat-grid" style={styles.statGrid}>
        <StatCard label="Totaal leerlingen" value={totaalLeerlingen} />
        <StatCard label="Totaal klassen" value={totaalKlassen} />
        <StatCard label="Eurofit ingevuld" value={totaalIngevuld} />
        <StatCard label="Eurofit ontbreekt" value={totaalOntbreekt} />
      </section>

      <section className="filter-grid" style={styles.filterGrid}>
        <FilterSelect label="Schooljaar" value={schooljaar} onChange={setSchooljaar} options={schooljaren} />
        <FilterSelect label="Klas" value={klasFilter} onChange={setKlasFilter} options={klassen} />
        <FilterSelect label="LO-groep" value={loGroepFilter} onChange={setLoGroepFilter} options={["Alle", "LOJON", "LOMEI"]} />

        <div>
          <label style={styles.label}>Zoek leerling</label>
          <input value={zoekterm} onChange={(e) => setZoekterm(e.target.value)} placeholder="Naam leerling" style={styles.input} />
        </div>
      </section>

      {selectedLeerling ? (
        <section style={{ ...styles.panel, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, color: ui.text }}>{selectedLeerling.naam}</h2>
              <p style={{ margin: "8px 0 0", color: ui.muted }}>
                {selectedLeerling.klas} · {selectedLeerling.loGroep}
              </p>
            </div>

            <button onClick={() => setSelectedLeerling(null)} style={styles.closeButton}>
              Sluiten
            </button>
          </div>

          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Test</th>
                  <th style={styles.th}>Waarde</th>
                  <th style={styles.th}>Evaluatie</th>
                  <th style={styles.th}>Datum</th>
                  <th style={styles.th}>Schooljaar</th>
                </tr>
              </thead>

              <tbody>
                {geselecteerdeResultaten.map((r) => {
                  const evaluatie = getEvaluatie(r);

                  return (
                    <tr key={r.id}>
                      <td style={styles.td}>
                        {TEST_LABELS[String(r.test_type)] ?? r.test_type ?? "—"}
                      </td>
                      <td style={styles.td}>
                        {r.waarde ?? "—"} {r.eenheid ?? ""}
                      </td>
                      <td style={styles.td}>
                        {evaluatie ? (
                          <span style={{ ...styles.badge, background: evaluatie.kleur }}>
                            {evaluatie.label}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={styles.td}>{r.test_datum ?? "—"}</td>
                      <td style={styles.td}>{r.schooljaar ?? "—"}</td>
                    </tr>
                  );
                })}

                {geselecteerdeResultaten.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={5}>
                      Geen Eurofitresultaten gevonden voor deze leerling.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 16, display: "grid", gap: 14 }}>
        {klassenOverzicht.map(([klas, leerlingenInKlas]) => {
          const ingevuld = leerlingenInKlas.filter((l) =>
            ingevuldKeys.has(leerlingKey(l.naam, l.klas))
          );

          const ontbreekt = leerlingenInKlas.filter(
            (l) => !ingevuldKeys.has(leerlingKey(l.naam, l.klas))
          );

          return (
            <article key={klas} style={styles.panel}>
              <h2 style={{ margin: 0, color: ui.text, fontSize: 22 }}>{klas}</h2>

              <p style={{ marginTop: 6, color: ui.muted }}>
                {leerlingenInKlas.length} leerlingen
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button onClick={() => toggleKlas(klas, "ingevuld")} style={styles.greenButton}>
                  🟢 {ingevuld.length} ingevuld
                </button>

                <button onClick={() => toggleKlas(klas, "ontbreekt")} style={styles.redButton}>
                  🔴 {ontbreekt.length} ontbreken
                </button>
              </div>

              {openKlas === klas && openType ? (
                <div style={styles.openBox}>
                  <h3 style={{ marginTop: 0, color: ui.text }}>
                    {openType === "ingevuld"
                      ? "Leerlingen met Eurofit ingevuld"
                      : "Leerlingen zonder Eurofit"}
                  </h3>

                  <div className="student-grid" style={styles.studentGrid}>
                    {(openType === "ingevuld" ? ingevuld : ontbreekt).map((leerling) => (
                      <button
                        key={leerling.id}
                        style={{
                          ...styles.studentButton,
                          borderColor:
                            selectedLeerling?.id === leerling.id
                              ? "rgba(137,194,170,0.65)"
                              : ui.border,
                        }}
                        onClick={() => setSelectedLeerling(leerling)}
                      >
                        {leerling.naam}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={{ color: ui.muted, fontSize: 12, fontWeight: 950 }}>{label}</div>
      <div style={{ marginTop: 8, color: ui.text, fontSize: 30, fontWeight: 980 }}>{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  statGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  filterGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  statCard: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  label: {
    display: "block",
    marginBottom: 8,
    color: ui.muted,
    fontSize: 12,
    fontWeight: 950,
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    color: ui.text,
    padding: "0 14px",
    outline: "none",
    fontWeight: 850,
  },
  greenButton: {
    border: "1px solid rgba(80,220,140,0.32)",
    background: "rgba(80,220,140,0.14)",
    color: ui.text,
    borderRadius: 16,
    padding: "10px 14px",
    fontWeight: 950,
    cursor: "pointer",
  },
  redButton: {
    border: "1px solid rgba(255,85,112,0.32)",
    background: "rgba(255,85,112,0.14)",
    color: ui.text,
    borderRadius: 16,
    padding: "10px 14px",
    fontWeight: 950,
    cursor: "pointer",
  },
  closeButton: {
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    borderRadius: 14,
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  openBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
  },
  studentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  studentButton: {
    textAlign: "left",
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.05)",
    color: ui.text,
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 850,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: "rgba(255,85,112,0.15)",
    border: "1px solid rgba(255,85,112,0.28)",
    color: ui.text,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 8px",
  },
  th: {
    color: ui.muted,
    fontSize: 12,
    textAlign: "left",
    padding: "8px 10px",
    whiteSpace: "nowrap",
  },
  td: {
    color: ui.text,
    padding: "12px 10px",
    background: "rgba(255,255,255,0.045)",
    borderTop: `1px solid ${ui.border}`,
    borderBottom: `1px solid ${ui.border}`,
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12,
    color: "#fff",
    whiteSpace: "nowrap",
  },
};

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "eurofit-leerkracht-dashboard-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (max-width: 900px) {
      .stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      .filter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .stat-grid,
      .filter-grid,
      .student-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }
  `;

  document.head.appendChild(style);
}