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
  email?: string;
  username?: string;
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

type Klasgroep = {
  id: string;
  naam: string;
  schooljaar: string;
  leerkracht_id: string;
  omschrijving: string | null;
};

type KlasgroepLeerling = {
  id?: string;
  klasgroep_id: string;
  leerling_id: string | null;
  leerling_naam: string | null;
  klas_naam: string | null;
  email: string | null;
  username: string | null;
  lo_groepen: string | null;
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
  const email = String(getValue(row, ["email"])).trim().toLowerCase();
  const username = String(getValue(row, ["username"])).trim();
  const possibleUserId = String(
    getValue(row, ["id", "user_id", "auth_user_id", "leerling_id", "profiel_id", "profile_id"])
  ).trim();

  return {
    id: possibleUserId || email || username,
    naam: String(getValue(row, ["volledige_naam"])).trim(),
    klas: String(getValue(row, ["klas_naam"])).trim(),
    loGroep: String(getValue(row, ["lo_groepen"])).trim() || "Onbekend",
    email,
    username,
  };
}

function klasgroepLeerlingKey(row: KlasgroepLeerling) {
  return leerlingKey(String(row.leerling_naam ?? ""), String(row.klas_naam ?? ""));
}

function leerlingHoortBijKlasgroep(leerling: Leerling, members: KlasgroepLeerling[]) {
  const leerlingIds = [leerling.id, leerling.email, leerling.username]
    .map((x) => String(x ?? "").trim().toLowerCase())
    .filter(Boolean);

  const naamKlasKey = leerlingKey(leerling.naam, leerling.klas);

  return members.some((member) => {
    const memberIds = [member.leerling_id, member.email, member.username]
      .map((x) => String(x ?? "").trim().toLowerCase())
      .filter(Boolean);

    if (memberIds.some((id) => leerlingIds.includes(id))) return true;
    return klasgroepLeerlingKey(member) === naamKlasKey;
  });
}

function getPayloadObject(row: RawRow) {
  if (!row?.payload) return {};
  if (typeof row.payload === "object") return row.payload;
  if (typeof row.payload === "string") {
    try {
      return JSON.parse(row.payload);
    } catch {
      return {};
    }
  }
  return {};
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

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

export default function EurofitLeerkrachtPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [resultatenRows, setResultatenRows] = useState<RawRow[]>([]);
  const [normen, setNormen] = useState<NormRow[]>([]);
  const [profielen, setProfielen] = useState<RawRow[]>([]);
  const [huiswerkRows, setHuiswerkRows] = useState<RawRow[]>([]);
  const [klasgroepen, setKlasgroepen] = useState<Klasgroep[]>([]);
  const [klasgroepLeerlingen, setKlasgroepLeerlingen] = useState<KlasgroepLeerling[]>([]);

  const [schooljaar, setSchooljaar] = useState("Alle");
  const [klasFilter, setKlasFilter] = useState("Alle");
  const [klasgroepFilter, setKlasgroepFilter] = useState("Alle");
  const [loGroepFilter, setLoGroepFilter] = useState("Alle");
  const [zoekterm, setZoekterm] = useState("");

  const [openKlas, setOpenKlas] = useState<string | null>(null);
  const [openType, setOpenType] = useState<"ingevuld" | "ontbreekt" | "huiswerkIngevuld" | "huiswerkOntbreekt" | null>(null);
  const [selectedLeerling, setSelectedLeerling] = useState<Leerling | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<"resultaten" | "huiswerk">("resultaten");

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

      const [leerlingenRes, resultatenRes, huiswerkRes, normenRes, profielenRes, klasgroepenRes] =
        await Promise.all([
          supabase.from("eurofit_class_students_view").select("*"),
          supabase.from("eurofit_admin_view").select("*"),
          supabase.from("eurofit_huiswerk_submissions").select("user_id, schooljaar, klas_naam, grade, date, created_at, payload"),
          supabase
            .from("eurofit_normen")
            .select("test_type, geslacht, leeftijd, p5, p20, p50, p80, p95"),
          supabase.from("profielen").select("*"),
          supabase
            .from("lo_klasgroepen")
            .select("id, naam, schooljaar, leerkracht_id, omschrijving")
            .eq("leerkracht_id", uid)
            .order("schooljaar", { ascending: false })
            .order("naam", { ascending: true }),
        ]);

      if (leerlingenRes.error) setError(leerlingenRes.error.message);
      if (resultatenRes.error) setError(resultatenRes.error.message);
      if (huiswerkRes.error) setError(huiswerkRes.error.message);
      if (normenRes.error) setError(normenRes.error.message);
      if (profielenRes.error) setError(profielenRes.error.message);
      if (klasgroepenRes.error) setError(klasgroepenRes.error.message);

      const groups = (klasgroepenRes.data ?? []) as Klasgroep[];
      const groupIds = groups.map((g) => g.id);
      let members: KlasgroepLeerling[] = [];

      if (groupIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from("lo_klasgroep_leerlingen")
          .select("id, klasgroep_id, leerling_id, leerling_naam, klas_naam, email, username, lo_groepen")
          .in("klasgroep_id", groupIds)
          .order("aangemaakt_op", { ascending: true });

        if (membersError) setError(membersError.message);
        members = (membersData ?? []) as KlasgroepLeerling[];
      }

      setLeerlingenRows(leerlingenRes.data ?? []);
      setResultatenRows(resultatenRes.data ?? []);
      setHuiswerkRows(huiswerkRes.data ?? []);
      setNormen((normenRes.data ?? []) as NormRow[]);
      setProfielen(profielenRes.data ?? []);
      setKlasgroepen(groups);
      setKlasgroepLeerlingen(members);

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

    klasgroepen.forEach((g) => {
      if (g.schooljaar) set.add(String(g.schooljaar));
    });

    return ["Alle", ...Array.from(set).sort().reverse()];
  }, [resultatenRows, klasgroepen]);

  const beschikbareKlasgroepen = useMemo(() => {
    return klasgroepen.filter((group) => {
      if (schooljaar !== "Alle" && group.schooljaar !== schooljaar) return false;
      return true;
    });
  }, [klasgroepen, schooljaar]);

  const klasgroepOptions = useMemo(() => {
    return [
      { value: "Alle", label: "Alle klasgroepen" },
      ...beschikbareKlasgroepen.map((group) => ({
        value: group.id,
        label: `${group.naam} (${group.schooljaar})`,
      })),
    ];
  }, [beschikbareKlasgroepen]);

  const geselecteerdeKlasgroepMembers = useMemo(() => {
    if (klasgroepFilter === "Alle") return [];
    return klasgroepLeerlingen.filter((row) => row.klasgroep_id === klasgroepFilter);
  }, [klasgroepLeerlingen, klasgroepFilter]);

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

      if (naam && klas && (schooljaar === "Alle" || rowSchooljaar === schooljaar)) {
        set.add(leerlingKey(naam, klas));
      }
    });

    return set;
  }, [resultatenRows, schooljaar]);

  const huiswerkKeys = useMemo(() => {
    const set = new Set<string>();

    huiswerkRows.forEach((r) => {
      const rowSchooljaar = r.schooljaar ? String(r.schooljaar) : "";
      if (schooljaar !== "Alle" && rowSchooljaar !== schooljaar) return;

      const userId = String(r.user_id ?? "").trim();
      if (userId) set.add(userId);
    });

    return set;
  }, [huiswerkRows, schooljaar]);

  const gefilterdeLeerlingen = useMemo(() => {
    return leerlingen.filter((l) => {
      if (klasFilter !== "Alle" && l.klas !== klasFilter) return false;

      if (klasgroepFilter !== "Alle") {
        if (!leerlingHoortBijKlasgroep(l, geselecteerdeKlasgroepMembers)) return false;
      }

      if (loGroepFilter !== "Alle") {
        const groepen = l.loGroep.split(",").map((x) => x.trim()).filter(Boolean);
        if (!groepen.includes(loGroepFilter)) return false;
      }

      if (zoekterm && !l.naam.toLowerCase().includes(zoekterm.toLowerCase())) return false;
      return true;
    });
  }, [leerlingen, klasFilter, klasgroepFilter, geselecteerdeKlasgroepMembers, loGroepFilter, zoekterm]);

  const klassenOverzicht = useMemo(() => {
    const map = new Map<string, Leerling[]>();

    gefilterdeLeerlingen.forEach((leerling) => {
      if (!map.has(leerling.klas)) map.set(leerling.klas, []);
      map.get(leerling.klas)!.push(leerling);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [gefilterdeLeerlingen]);

  const totaalLeerlingen = gefilterdeLeerlingen.length;
  const totaalKlassen = klassenOverzicht.length;
  const totaalIngevuld = gefilterdeLeerlingen.filter((l) => ingevuldKeys.has(leerlingKey(l.naam, l.klas))).length;
  const totaalOntbreekt = totaalLeerlingen - totaalIngevuld;
  const totaalHuiswerkIngevuld = gefilterdeLeerlingen.filter((l) => huiswerkKeys.has(l.id)).length;
  const totaalHuiswerkOntbreekt = totaalLeerlingen - totaalHuiswerkIngevuld;

  useEffect(() => {
    if (klasgroepFilter !== "Alle" && !beschikbareKlasgroepen.some((group) => group.id === klasgroepFilter)) {
      setKlasgroepFilter("Alle");
    }
  }, [beschikbareKlasgroepen, klasgroepFilter]);

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

  function toggleKlas(klas: string, type: "ingevuld" | "ontbreekt" | "huiswerkIngevuld" | "huiswerkOntbreekt") {
    if (openKlas === klas && openType === type) {
      setOpenKlas(null);
      setOpenType(null);
      return;
    }

    setOpenKlas(klas);
    setOpenType(type);
  }

  function leerlingenVoorOpenType(
    type: "ingevuld" | "ontbreekt" | "huiswerkIngevuld" | "huiswerkOntbreekt" | null,
    ingevuld: Leerling[],
    ontbreekt: Leerling[],
    huiswerkIngevuld: Leerling[],
    huiswerkOntbreekt: Leerling[]
  ) {
    if (type === "ingevuld") return ingevuld;
    if (type === "ontbreekt") return ontbreekt;
    if (type === "huiswerkIngevuld") return huiswerkIngevuld;
    return huiswerkOntbreekt;
  }

  function openTypeTitel(type: typeof openType) {
    if (type === "ingevuld") return "Leerlingen met Eurofit ingevuld";
    if (type === "ontbreekt") return "Leerlingen zonder Eurofit";
    if (type === "huiswerkIngevuld") return "Leerlingen met huiswerk ingevuld";
    return "Leerlingen zonder huiswerk";
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
          <p style={{ color: ui.muted }}>Deze pagina is alleen toegankelijk voor LO-leerkrachten en admins.</p>
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
        description="Volg per klas, LO-groep of eigen klasgroep op wie Eurofit en het huiswerk heeft ingevuld."
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
        <StatCard label="Huiswerk ingevuld" value={totaalHuiswerkIngevuld} />
        <StatCard label="Huiswerk ontbreekt" value={totaalHuiswerkOntbreekt} />
      </section>

      <section className="filter-grid" style={styles.filterGrid}>
        <FilterSelect label="Schooljaar" value={schooljaar} onChange={setSchooljaar} options={schooljaren} />
        <FilterSelect label="Klas" value={klasFilter} onChange={setKlasFilter} options={klassen} />
        <FilterSelect label="Mijn klasgroep" value={klasgroepFilter} onChange={setKlasgroepFilter} options={klasgroepOptions} />
        <FilterSelect label="LO-groep" value={loGroepFilter} onChange={setLoGroepFilter} options={["Alle", "LOJON", "LOMEI"]} />

        <div>
          <label style={styles.label}>Zoek leerling</label>
          <input value={zoekterm} onChange={(e) => setZoekterm(e.target.value)} placeholder="Naam leerling" style={styles.input} />
        </div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gap: 14 }}>
        {klassenOverzicht.map(([klas, leerlingenInKlas]) => {
          const ingevuld = leerlingenInKlas.filter((l) => ingevuldKeys.has(leerlingKey(l.naam, l.klas)));
          const ontbreekt = leerlingenInKlas.filter((l) => !ingevuldKeys.has(leerlingKey(l.naam, l.klas)));
          const huiswerkIngevuld = leerlingenInKlas.filter((l) => huiswerkKeys.has(l.id));
          const huiswerkOntbreekt = leerlingenInKlas.filter((l) => !huiswerkKeys.has(l.id));

          return (
            <article key={klas} style={styles.panel}>
              <h2 style={{ margin: 0, color: ui.text, fontSize: 22 }}>{klas}</h2>
              <p style={{ marginTop: 6, color: ui.muted }}>{leerlingenInKlas.length} leerlingen</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button onClick={() => toggleKlas(klas, "ingevuld")} style={styles.greenButton}>🟢 {ingevuld.length} ingevuld</button>
                <button onClick={() => toggleKlas(klas, "ontbreekt")} style={styles.redButton}>🔴 {ontbreekt.length} ontbreken</button>
                <button onClick={() => toggleKlas(klas, "huiswerkIngevuld")} style={styles.purpleButton}>🟣 {huiswerkIngevuld.length} huiswerk ingevuld</button>
                <button onClick={() => toggleKlas(klas, "huiswerkOntbreekt")} style={styles.orangeButton}>🟠 {huiswerkOntbreekt.length} huiswerk ontbreekt</button>
              </div>

              {openKlas === klas && openType ? (
                <div style={styles.openBox}>
                  <h3 style={{ marginTop: 0, color: ui.text }}>{openTypeTitel(openType)}</h3>

                  <div className="student-grid" style={styles.studentGrid}>
                    {leerlingenVoorOpenType(openType, ingevuld, ontbreekt, huiswerkIngevuld, huiswerkOntbreekt).map((leerling) => {
                      const isOpen = selectedLeerling?.id === leerling.id;
                      const leerlingResultaten = resultatenRows
                        .filter((r) => {
                          const naam = String(r.volledige_naam ?? "").trim();
                          const klasNaam = String(r.profiel_klas_naam ?? r.klas_naam ?? "").trim();
                          const rowSchooljaar = r.schooljaar ? String(r.schooljaar) : "";

                          return leerlingKey(naam, klasNaam) === leerlingKey(leerling.naam, leerling.klas) && (schooljaar === "Alle" || rowSchooljaar === schooljaar);
                        })
                        .sort((a, b) => String(a.test_type ?? "").localeCompare(String(b.test_type ?? "")));

                      const leerlingHuiswerk = huiswerkRows
                        .filter((r) => {
                          const rowSchooljaar = r.schooljaar ? String(r.schooljaar) : "";
                          if (schooljaar !== "Alle" && rowSchooljaar !== schooljaar) return false;
                          return String(r.user_id ?? "").trim() === leerling.id;
                        })
                        .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));

                      return (
                        <div key={leerling.id} style={styles.studentAccordion}>
                          <button
                            style={{ ...styles.studentButton, borderColor: isOpen ? "rgba(137,194,170,0.65)" : ui.border }}
                            onClick={() => {
                              if (isOpen) {
                                setSelectedLeerling(null);
                                return;
                              }
                              setSelectedLeerling(leerling);
                              setSelectedDetail(openType === "huiswerkIngevuld" || openType === "huiswerkOntbreekt" ? "huiswerk" : "resultaten");
                            }}
                          >
                            <span>{leerling.naam}</span>
                            <span style={{ opacity: 0.75 }}>{isOpen ? "▲" : "▼"}</span>
                          </button>

                          {isOpen ? (
                            <div style={styles.inlineDetailBox}>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button onClick={() => setSelectedDetail("resultaten")} style={selectedDetail === "resultaten" ? styles.greenButton : styles.closeButton}>📊 Eurofitresultaten</button>
                                <button onClick={() => setSelectedDetail("huiswerk")} style={selectedDetail === "huiswerk" ? styles.purpleButton : styles.closeButton}>📚 Huiswerk</button>
                              </div>

                              {selectedDetail === "resultaten" ? (
                                <ResultsTable rows={leerlingResultaten} getEvaluatie={getEvaluatie} />
                              ) : (
                                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                                  {leerlingHuiswerk.length === 0 ? (
                                    <div style={styles.openBox}>Geen huiswerk gevonden voor deze leerling.</div>
                                  ) : (
                                    leerlingHuiswerk.map((hw) => <HomeworkSubmissionCard key={hw.id ?? hw.created_at} row={hw} />)
                                  )}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
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

function ResultsTable({ rows, getEvaluatie }: { rows: RawRow[]; getEvaluatie: (row: RawRow) => any }) {
  return (
    <div style={{ marginTop: 14, overflowX: "auto" }}>
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
          {rows.map((r) => {
            const evaluatie = getEvaluatie(r);

            return (
              <tr key={r.id}>
                <td style={styles.td}>{TEST_LABELS[String(r.test_type)] ?? r.test_type ?? "—"}</td>
                <td style={styles.td}>{r.waarde ?? "—"} {r.eenheid ?? ""}</td>
                <td style={styles.td}>{evaluatie ? <span style={{ ...styles.badge, background: evaluatie.kleur }}>{evaluatie.label}</span> : "—"}</td>
                <td style={styles.td}>{r.test_datum ?? "—"}</td>
                <td style={styles.td}>{r.schooljaar ?? "—"}</td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan={5}>Geen Eurofitresultaten gevonden voor deze leerling.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function HomeworkSubmissionCard({ row }: { row: RawRow }) {
  const payload = getPayloadObject(row);
  const form = payload.form && typeof payload.form === "object" ? payload.form : {};
  const rubric = payload.rubric ?? payload.rubrics ?? null;
  const grade = String(row.grade ?? payload.grade ?? "—");
  const visibleFields = Object.entries(form).filter(([key]) => !["date"].includes(key));

  return (
    <div style={styles.openBox}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, color: ui.text }}>Huiswerk {grade} graad</h3>
          <p style={{ margin: "6px 0 0", color: ui.muted }}>Datum: {row.date ?? (form as any).date ?? "—"} · Ingediend: {row.created_at ? new Date(row.created_at).toLocaleString("nl-BE") : "—"}</p>
        </div>
        {rubric && !Array.isArray(rubric) && typeof rubric === "object" && "level" in rubric ? <span style={styles.badge}>{String((rubric as any).level)}</span> : null}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {visibleFields.length === 0 ? (
          <div style={{ color: ui.muted }}>Geen formuliergegevens gevonden.</div>
        ) : (
          visibleFields.map(([key, value]) => (
            <div key={key} style={styles.homeworkField}>
              <div style={styles.homeworkLabel}>{key}</div>
              <div style={styles.homeworkValue}>{renderValue(value)}</div>
            </div>
          ))
        )}
      </div>

      {rubric ? (
        <div style={{ marginTop: 12 }}>
          <div style={styles.homeworkLabel}>Automatische rubric</div>
          <pre style={styles.preBox}>{renderValue(rubric)}</pre>
        </div>
      ) : null}
    </div>
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

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] | { value: string; label: string }[] }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { padding: 18, borderRadius: 24, background: ui.panel, border: `1px solid ${ui.border}`, boxShadow: "0 14px 34px rgba(0,0,0,0.18)", backdropFilter: "blur(10px)" },
  statGrid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 },
  filterGrid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, padding: 18, borderRadius: 24, background: ui.panel, border: `1px solid ${ui.border}` },
  statCard: { padding: 16, borderRadius: 22, background: ui.panel, border: `1px solid ${ui.border}` },
  label: { display: "block", marginBottom: 8, color: ui.muted, fontSize: 12, fontWeight: 950 },
  input: { width: "100%", height: 46, borderRadius: 16, border: `1px solid ${ui.border}`, background: "rgba(0,0,0,0.35)", color: ui.text, padding: "0 14px", outline: "none", fontWeight: 850 },
  greenButton: { border: "1px solid rgba(80,220,140,0.32)", background: "rgba(80,220,140,0.14)", color: ui.text, borderRadius: 16, padding: "10px 14px", fontWeight: 950, cursor: "pointer" },
  redButton: { border: "1px solid rgba(255,85,112,0.32)", background: "rgba(255,85,112,0.14)", color: ui.text, borderRadius: 16, padding: "10px 14px", fontWeight: 950, cursor: "pointer" },
  purpleButton: { border: "1px solid rgba(170,120,255,0.32)", background: "rgba(170,120,255,0.14)", color: ui.text, borderRadius: 16, padding: "10px 14px", fontWeight: 950, cursor: "pointer" },
  orangeButton: { border: "1px solid rgba(255,170,70,0.32)", background: "rgba(255,170,70,0.14)", color: ui.text, borderRadius: 16, padding: "10px 14px", fontWeight: 950, cursor: "pointer" },
  closeButton: { border: `1px solid ${ui.border}`, background: "rgba(0,0,0,0.28)", color: ui.text, borderRadius: 14, padding: "9px 12px", fontWeight: 900, cursor: "pointer" },
  openBox: { marginTop: 16, padding: 14, borderRadius: 20, border: `1px solid ${ui.border}`, background: "rgba(0,0,0,0.18)" },
  studentGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  studentButton: { width: "100%", textAlign: "left", border: `1px solid ${ui.border}`, background: "rgba(255,255,255,0.05)", color: ui.text, borderRadius: 14, padding: "10px 12px", fontWeight: 850, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  studentAccordion: { display: "grid", gap: 8 },
  inlineDetailBox: { padding: 14, borderRadius: 18, border: `1px solid ${ui.border}`, background: "rgba(0,0,0,0.22)" },
  error: { marginTop: 12, padding: 12, borderRadius: 18, background: "rgba(255,85,112,0.15)", border: "1px solid rgba(255,85,112,0.28)", color: ui.text },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" },
  th: { color: ui.muted, fontSize: 12, textAlign: "left", padding: "8px 10px", whiteSpace: "nowrap" },
  td: { color: ui.text, padding: "12px 10px", background: "rgba(255,255,255,0.045)", borderTop: `1px solid ${ui.border}`, borderBottom: `1px solid ${ui.border}`, fontSize: 13, whiteSpace: "nowrap" },
  badge: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 999, fontWeight: 950, fontSize: 12, color: "#fff", whiteSpace: "nowrap", background: "rgba(0,0,0,0.35)", border: `1px solid ${ui.border}` },
  homeworkField: { padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.045)", border: `1px solid ${ui.border}` },
  homeworkLabel: { color: ui.muted, fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.5 },
  homeworkValue: { marginTop: 6, color: ui.text, fontSize: 13.5, lineHeight: 1.45, whiteSpace: "pre-wrap" },
  preBox: { marginTop: 8, padding: 12, borderRadius: 16, background: "rgba(0,0,0,0.35)", border: `1px solid ${ui.border}`, color: ui.text, fontSize: 12, lineHeight: 1.45, whiteSpace: "pre-wrap", overflowX: "auto" },
};

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;
  const id = "eurofit-leerkracht-dashboard-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @media (max-width: 1120px) {
      .filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 900px) {
      .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 640px) {
      .stat-grid, .filter-grid, .student-grid { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    }
  `;
  document.head.appendChild(style);
}
