"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
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

type Leerling = {
  id: string;
  naam: string;
  familyName: string;
  klas: string;
  loGroep: string;
  email: string;
  username: string;
  geslacht: string;
  schooljaar: string;
};

type Klasgroep = {
  id: string;
  naam: string;
  schooljaar: string;
  leerkracht_id: string;
  omschrijving: string | null;
  filters: Record<string, any> | null;
  aangemaakt_op?: string | null;
  bijgewerkt_op?: string | null;
};

type KlasgroepLeerling = {
  koppeling_id: string;
  klasgroep_id: string;
  klasgroep_naam: string;
  schooljaar: string;
  leerkracht_id: string;
  positie: number;
  leerling_email: string;
  profiel_id: string | null;
  volledige_naam: string;
  given_name: string;
  family_name: string;
  username: string;
  klas_naam: string;
  lo_groepen: string;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  panel: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045))",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

function getValue(row: RawRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return "";
}

function isEchteKlas(klas: string) {
  return /^[0-9]/.test(klas.trim());
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizeGeslacht(value: unknown) {
  const v = normalizeLower(value);
  if (["m", "man", "jongen", "boy"].includes(v)) return "jongen";
  if (["v", "vrouw", "meisje", "girl"].includes(v)) return "meisje";
  return v;
}

function getFamilyNameFromFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

function sortName(leerling: Pick<Leerling, "naam" | "familyName">) {
  return (leerling.familyName || getFamilyNameFromFullName(leerling.naam)).toLowerCase();
}

function familyFirstName(leerling: Pick<Leerling, "naam" | "familyName">) {
  const name = normalizeText(leerling.naam);
  const familyName = normalizeText(leerling.familyName) || getFamilyNameFromFullName(name);
  if (!name) return familyName;
  if (!familyName) return name;

  const escaped = familyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutFamilyName = name.replace(new RegExp(`\\s*${escaped}\\s*$`, "i"), "").trim();
  return withoutFamilyName ? `${familyName} ${withoutFamilyName}` : familyName;
}

function normaliseerLeerling(row: RawRow): Leerling {
  const email = normalizeText(getValue(row, ["email"])).toLowerCase();
  const username = normalizeText(getValue(row, ["username"]));
  const possibleUserId = normalizeText(
    getValue(row, ["profiel_id", "id", "user_id", "auth_user_id", "leerling_id", "profile_id"])
  );
  const naam = normalizeText(getValue(row, ["volledige_naam", "naam", "full_name", "name"]));
  const familyName = normalizeText(
    getValue(row, ["family_name", "familienaam", "achternaam", "last_name", "surname"])
  ) || getFamilyNameFromFullName(naam);

  return {
    id: possibleUserId || email || username,
    naam,
    familyName,
    klas: normalizeText(getValue(row, ["klas_naam", "class_name", "klas", "profiel_klas_naam"])),
    loGroep: normalizeText(getValue(row, ["lo_groepen", "lo_groep", "loGroep"])) || "Onbekend",
    email,
    username,
    geslacht: normalizeGeslacht(getValue(row, ["geslacht", "gender", "sex"])),
    schooljaar: normalizeText(getValue(row, ["schooljaar", "school_year"])),
  };
}

function leerlingKey(l: Leerling) {
  return l.id || `${l.naam}__${l.klas}`;
}

function readableSupabaseError(error: any, context: string) {
  return [context, error?.message, error?.details, error?.hint, error?.code ? `code: ${error.code}` : null]
    .filter(Boolean)
    .join(" | ");
}

function csvList(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

function klasMatchesZoek(klas: string, zoek: string) {
  const parts = csvList(zoek.toLowerCase());
  if (parts.length === 0) return true;
  const lower = klas.toLowerCase();
  return parts.some((part) => lower.includes(part));
}

function getActueelSchooljaar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Smartschool schakelt naar het nieuwe schooljaar vanaf september.
  const startYear = month >= 9 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
}

function leerlingPastBinnenFilters(args: {
  leerling: Leerling;
  leerjaarFilter: string;
  klasFilter: string;
  loGroepFilter: string;
  geslachtFilter: string;
  zoekterm: string;
}) {
  const { leerling, leerjaarFilter, klasFilter, loGroepFilter, geslachtFilter, zoekterm } = args;

  if (!isEchteKlas(leerling.klas)) return false;
  if (leerjaarFilter !== "Alle" && !leerling.klas.trim().startsWith(leerjaarFilter)) return false;
  if (!klasMatchesZoek(leerling.klas, klasFilter)) return false;

  if (loGroepFilter !== "Alle") {
    const groepen = leerling.loGroep.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
    if (!groepen.includes(loGroepFilter.toUpperCase())) return false;
  }

  if (geslachtFilter !== "Alle") {
    if (leerling.geslacht && leerling.geslacht !== geslachtFilter) return false;

    if (!leerling.geslacht) {
      if (geslachtFilter === "jongen" && !leerling.loGroep.toUpperCase().includes("LOJON")) return false;
      if (geslachtFilter === "meisje" && !leerling.loGroep.toUpperCase().includes("LOMEI")) return false;
    }
  }

  if (zoekterm.trim()) {
    const haystack = `${leerling.naam} ${leerling.klas} ${leerling.email} ${leerling.username}`.toLowerCase();
    if (!haystack.includes(zoekterm.toLowerCase().trim())) return false;
  }

  return true;
}

export default function LeerkrachtenLOKlasgroepenPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [leerlingenRows, setLeerlingenRows] = useState<RawRow[]>([]);
  const [klasgroepen, setKlasgroepen] = useState<Klasgroep[]>([]);
  const [klasgroepLeerlingen, setKlasgroepLeerlingen] = useState<KlasgroepLeerling[]>([]);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groepNaam, setGroepNaam] = useState("");
  const [omschrijving, setOmschrijving] = useState("");
  const [schooljaar, setSchooljaar] = useState(() => getActueelSchooljaar());

  const [leerjaarFilter, setLeerjaarFilter] = useState("Alle");
  const [klasFilter, setKlasFilter] = useState("");
  const [loGroepFilter, setLoGroepFilter] = useState("Alle");
  const [geslachtFilter, setGeslachtFilter] = useState("Alle");
  const [zoekterm, setZoekterm] = useState("");

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [klasbeeldOpen, setKlasbeeldOpen] = useState(false);
  const [activeKlasbeeldKlas, setActiveKlasbeeldKlas] = useState<string>("");
  const [leerlingOrder, setLeerlingOrder] = useState<string[]>([]);

  useEffect(() => {
    injectResponsiveCSS();
  }, []);

  async function loadKlasgroepen(leerkrachtId: string, selectedSchooljaar: string) {
    const { data, error } = await supabase
      .from("lo_klasgroepen")
      .select("id, naam, schooljaar, leerkracht_id, omschrijving, filters, aangemaakt_op, bijgewerkt_op")
      .eq("leerkracht_id", leerkrachtId)
      .eq("schooljaar", selectedSchooljaar)
      .order("naam", { ascending: true });

    if (error) throw new Error(readableSupabaseError(error, "Kon klasgroepen niet laden."));
    setKlasgroepen((data ?? []) as Klasgroep[]);
  }

  async function loadGroepLeerlingen(klasgroepId: string) {
    const { data, error } = await supabase
      .from("lo_klasgroep_leden_view")
      .select("*")
      .eq("klasgroep_id", klasgroepId)
      .order("klas_naam", { ascending: true })
      .order("positie", { ascending: true });

    if (error) throw new Error(readableSupabaseError(error, "Kon leerlingen van klasgroep niet laden."));
    setKlasgroepLeerlingen((data ?? []) as KlasgroepLeerling[]);
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

        if (profielError) throw new Error(readableSupabaseError(profielError, "Kon profiel niet laden."));

        if (!["lo_leerkracht", "admin"].includes(String(profielData?.rol))) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        setAllowed(true);

        const profielValue = profielData as Profiel;
        setProfiel(profielValue);

        const actueelSchooljaar = getActueelSchooljaar();

        const leerlingenRes = await supabase.from("eurofit_class_students_view").select("*");

        if (leerlingenRes.error) {
          throw new Error(readableSupabaseError(leerlingenRes.error, "Kon leerlingen/klassen niet laden."));
        }

        const rows = leerlingenRes.data ?? [];
        setLeerlingenRows(rows);

        // Kies bij het openen het schooljaar dat daadwerkelijk in de
        // actuele Smartschool-data aanwezig is. Zo kan een oude/foutieve
        // waarde in profielen.schooljaar de keuzelijsten niet leegmaken.
        const beschikbareSchooljaren = Array.from(
          new Set(
            rows
              .map((r: RawRow) => normalizeText(getValue(r, ["schooljaar", "school_year"])))
              .filter(Boolean)
          )
        ).sort().reverse();

        const initieelSchooljaar = beschikbareSchooljaren.includes(actueelSchooljaar)
          ? actueelSchooljaar
          : beschikbareSchooljaren[0] ?? actueelSchooljaar;

        setSchooljaar(initieelSchooljaar);
        await loadKlasgroepen(profielValue.id, initieelSchooljaar);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kon pagina niet laden.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const leerlingen = useMemo(() => {
    const map = new Map<string, Leerling>();

    leerlingenRows
      .map(normaliseerLeerling)
      .filter(
        (l) =>
          l.id &&
          l.naam &&
          isEchteKlas(l.klas) &&
          l.schooljaar === schooljaar
      )
      .forEach((l) => {
        map.set(leerlingKey(l), l);
      });

    return Array.from(map.values()).sort((a, b) => {
      const klasCompare = a.klas.localeCompare(b.klas, "nl-BE", { numeric: true });
      if (klasCompare !== 0) return klasCompare;
      return sortName(a).localeCompare(sortName(b), "nl-BE") || a.naam.localeCompare(b.naam, "nl-BE");
    });
  }, [leerlingenRows, schooljaar]);

  const schooljaren = useMemo(() => {
    const set = new Set<string>();

    const actueelSchooljaar = getActueelSchooljaar();
    const currentStartYear = Number(actueelSchooljaar.split("-")[0]);

    set.add(`${currentStartYear - 2}-${currentStartYear - 1}`);
    set.add(`${currentStartYear - 1}-${currentStartYear}`);
    set.add(`${currentStartYear}-${currentStartYear + 1}`);
    set.add(`${currentStartYear + 1}-${currentStartYear + 2}`);

    leerlingenRows.forEach((r) => {
      const value = normalizeText(getValue(r, ["schooljaar", "school_year"]));
      if (value) set.add(value);
    });

    if (schooljaar) set.add(schooljaar);

    return Array.from(set).sort().reverse();
  }, [leerlingenRows, schooljaar]);

  const leerjaren = useMemo(() => {
    const set = new Set<string>();
    leerlingen.forEach((l) => {
      const match = l.klas.trim().match(/^([0-9]+)/);
      if (match?.[1]) set.add(match[1]);
    });
    return ["Alle", ...Array.from(set).sort((a, b) => Number(a) - Number(b))];
  }, [leerlingen]);

  const loGroepen = useMemo(() => {
    const set = new Set<string>();
    leerlingen.forEach((l) => {
      l.loGroep.split(",").map((x) => x.trim()).filter(Boolean).forEach((g) => set.add(g));
    });
    return ["Alle", ...Array.from(set).sort()];
  }, [leerlingen]);

  const gefilterdeLeerlingen = useMemo(() => {
    return leerlingen.filter((leerling) =>
      leerlingPastBinnenFilters({ leerling, leerjaarFilter, klasFilter, loGroepFilter, geslachtFilter, zoekterm })
    );
  }, [leerlingen, leerjaarFilter, klasFilter, loGroepFilter, geslachtFilter, zoekterm]);

  const geselecteerdeLeerlingen = useMemo(() => {
    return leerlingen.filter((l) => selectedKeys.has(leerlingKey(l)));
  }, [leerlingen, selectedKeys]);

  useEffect(() => {
    setLeerlingOrder((prev) => {
      const keys = geselecteerdeLeerlingen.map(leerlingKey);
      const keySet = new Set(keys);
      const kept = prev.filter((key) => keySet.has(key));
      const missing = geselecteerdeLeerlingen
        .filter((l) => !kept.includes(leerlingKey(l)))
        .sort((a, b) => sortName(a).localeCompare(sortName(b), "nl-BE") || a.naam.localeCompare(b.naam, "nl-BE"))
        .map(leerlingKey);
      const next = [...kept, ...missing];
      return next.join("|") === prev.join("|") ? prev : next;
    });
  }, [geselecteerdeLeerlingen]);

  const geordendeGeselecteerdeLeerlingen = useMemo(() => {
    const orderMap = new Map<string, number>(leerlingOrder.map((key, index) => [key, index]));
    return [...geselecteerdeLeerlingen].sort((a, b) => {
      const ak = leerlingKey(a);
      const bk = leerlingKey(b);
      const ai = orderMap.has(ak) ? orderMap.get(ak)! : Number.MAX_SAFE_INTEGER;
      const bi = orderMap.has(bk) ? orderMap.get(bk)! : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return sortName(a).localeCompare(sortName(b), "nl-BE") || a.naam.localeCompare(b.naam, "nl-BE");
    });
  }, [geselecteerdeLeerlingen, leerlingOrder]);

  const klasbeeldKlassen = useMemo(() => {
    return Array.from(new Set<string>(geordendeGeselecteerdeLeerlingen.map((l) => l.klas))).sort((a, b) =>
      a.localeCompare(b, "nl-BE", { numeric: true })
    );
  }, [geordendeGeselecteerdeLeerlingen]);

  const actieveKlasbeeldLeerlingen = useMemo(() => {
    return geordendeGeselecteerdeLeerlingen;
  }, [geordendeGeselecteerdeLeerlingen]);

  const klasbeeldGroepen = useMemo(() => {
    const map = new Map<string, Leerling[]>();

    actieveKlasbeeldLeerlingen.forEach((leerling) => {
      const klas = leerling.klas || "Onbekend";
      if (!map.has(klas)) map.set(klas, []);
      map.get(klas)!.push(leerling);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, "nl-BE", { numeric: true }))
      .map(([klas, leerlingen]) => ({ klas, leerlingen }));
  }, [actieveKlasbeeldLeerlingen]);

  const klassenSamenvatting = useMemo(() => {
    const map = new Map<string, number>();
    geselecteerdeLeerlingen.forEach((l) => map.set(l.klas, (map.get(l.klas) ?? 0) + 1));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "nl-BE", { numeric: true }));
  }, [geselecteerdeLeerlingen]);

  const previewNaam = useMemo(() => {
    if (groepNaam.trim()) return groepNaam.trim();

    const leerjaar = leerjaarFilter !== "Alle" ? leerjaarFilter : "";
    const klas = klasFilter.trim() || "klasgroep";
    const suffix =
      loGroepFilter === "LOJON" || geslachtFilter === "jongen"
        ? "jongens"
        : loGroepFilter === "LOMEI" || geslachtFilter === "meisje"
        ? "meisjes"
        : "groep";

    return `${leerjaar}${klas.toUpperCase().replace(/\s+/g, "")} (${suffix})`;
  }, [groepNaam, leerjaarFilter, klasFilter, loGroepFilter, geslachtFilter]);

  function toggleLeerling(leerling: Leerling) {
    const key = leerlingKey(leerling);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selecteerGefilterden() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      gefilterdeLeerlingen.forEach((l) => next.add(leerlingKey(l)));
      return next;
    });
  }

  function deselecteerGefilterden() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      gefilterdeLeerlingen.forEach((l) => next.delete(leerlingKey(l)));
      return next;
    });
  }

  function resetForm() {
    setActiveGroupId(null);
    setGroepNaam("");
    setOmschrijving("");
    setLeerjaarFilter("Alle");
    setKlasFilter("");
    setLoGroepFilter("Alle");
    setGeslachtFilter("Alle");
    setZoekterm("");
    setSelectedKeys(new Set());
    setKlasgroepLeerlingen([]);
    setKlasbeeldOpen(false);
    setActiveKlasbeeldKlas("");
    setLeerlingOrder([]);
  }

  async function handleSchooljaarChange(nextSchooljaar: string) {
    setSchooljaar(nextSchooljaar);
    setActiveGroupId(null);
    setKlasgroepLeerlingen([]);
    setSelectedKeys(new Set());
    setKlasbeeldOpen(false);
    setActiveKlasbeeldKlas("");
    setLeerlingOrder([]);

    if (!profiel) return;

    try {
      await loadKlasgroepen(profiel.id, nextSchooljaar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klasgroepen niet laden.");
    }
  }

  async function openBestaandeGroep(group: Klasgroep) {
    setError(null);
    setLoadingGroupId(group.id);
    setActiveGroupId(group.id);
    setGroepNaam(group.naam);
    setOmschrijving(group.omschrijving ?? "");
    setSchooljaar(group.schooljaar);

    const filters = group.filters ?? {};
    setLeerjaarFilter(filters.leerjaarFilter ?? "Alle");
    setKlasFilter(filters.klasFilter ?? "");
    setLoGroepFilter(filters.loGroepFilter ?? "Alle");
    setGeslachtFilter(filters.geslachtFilter ?? "Alle");
    setZoekterm("");
    setKlasbeeldOpen(true);
    setLeerlingOrder([]);
    setActiveKlasbeeldKlas(filters.activeKlasbeeldKlas ?? "");

    try {
      await loadGroepLeerlingen(group.id);

      const { data, error } = await supabase
        .from("lo_klasgroep_leden_view")
        .select("profiel_id, leerling_email, volledige_naam, klas_naam, positie")
        .eq("klasgroep_id", group.id)
        .order("positie", { ascending: true });

      if (error) throw new Error(readableSupabaseError(error, "Kon klasgroepselectie niet laden."));

      const keys = new Set<string>();
      (data ?? []).forEach((row: any) => {
        const match = leerlingen.find(
          (l) =>
            (!!row.profiel_id && l.id === row.profiel_id) ||
            l.email === String(row.leerling_email ?? "").toLowerCase()
        );

        if (match) keys.add(leerlingKey(match));
      });

      setSelectedKeys(keys);
      setLeerlingOrder(
        (data ?? [])
          .map((row: any) => {
            const match = leerlingen.find(
              (l) =>
                (!!row.profiel_id && l.id === row.profiel_id) ||
                l.email === String(row.leerling_email ?? "").toLowerCase()
            );
            return match ? leerlingKey(match) : null;
          })
          .filter((key: string | null): key is string => Boolean(key))
      );

      const klassen = Array.from(new Set<string>((data ?? []).map((row: any) => String(row.klas_naam ?? "").trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "nl-BE", { numeric: true })
      );
      if (!filters.activeKlasbeeldKlas && klassen[0]) setActiveKlasbeeldKlas(klassen[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klasgroep openen.");
    } finally {
      setLoadingGroupId(null);
    }
  }

  async function saveKlasgroep() {
    if (!profiel) return;

    const naam = previewNaam.trim();
    if (!naam) {
      setError("Geef een naam voor de klasgroep.");
      return;
    }

    if (geselecteerdeLeerlingen.length === 0) {
      setError("Selecteer minstens één leerling voor deze klasgroep.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const filters = {
        leerjaarFilter,
        klasFilter,
        loGroepFilter,
        geslachtFilter,
        klasbeeldOpen: true,
      };
      let klasgroepId = activeGroupId;

      if (klasgroepId) {
        const { error: updateError } = await supabase
          .from("lo_klasgroepen")
          .update({
            naam,
            schooljaar,
            omschrijving: omschrijving.trim() || null,
            filters,
            bijgewerkt_op: new Date().toISOString(),
          })
          .eq("id", klasgroepId)
          .eq("leerkracht_id", profiel.id);

        if (updateError) throw new Error(readableSupabaseError(updateError, "Kon klasgroep niet bijwerken."));
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("lo_klasgroepen")
          .insert({
            naam,
            schooljaar,
            leerkracht_id: profiel.id,
            omschrijving: omschrijving.trim() || null,
            filters,
          })
          .select("id")
          .single();

        if (insertError) throw new Error(readableSupabaseError(insertError, "Kon klasgroep niet maken."));
        klasgroepId = insertData?.id;
        setActiveGroupId(klasgroepId ?? null);
      }

      if (!klasgroepId) throw new Error("Klasgroep kon niet opgeslagen worden.");

      const { error: deleteError } = await supabase
        .from("lo_klasgroep_leerlingen")
        .delete()
        .eq("klasgroep_id", klasgroepId);

      if (deleteError) throw new Error(readableSupabaseError(deleteError, "Kon oude leerlingen niet verwijderen."));

      const payload = geselecteerdeLeerlingen.map((l) => ({
        klasgroep_id: klasgroepId,
        leerling_email: l.email.trim().toLowerCase(),
        positie: leerlingOrder.indexOf(leerlingKey(l)) >= 0
          ? leerlingOrder.indexOf(leerlingKey(l))
          : geselecteerdeLeerlingen.indexOf(l),
      }));

      const { error: membersError } = await supabase.from("lo_klasgroep_leerlingen").insert(payload);

      if (membersError) throw new Error(readableSupabaseError(membersError, "Kon leerlingen niet koppelen."));

      await loadKlasgroepen(profiel.id, schooljaar);
      await loadGroepLeerlingen(klasgroepId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klasgroep niet opslaan.");
    } finally {
      setSaving(false);
    }
  }

  function moveLeerlingInKlas(leerling: Leerling, direction: -1 | 1) {
    const key = leerlingKey(leerling);
    setLeerlingOrder((prev) => {
      const fullOrder = prev.length ? [...prev] : geordendeGeselecteerdeLeerlingen.map(leerlingKey);
      const sameClassKeys = geordendeGeselecteerdeLeerlingen
        .filter((l) => l.klas === leerling.klas)
        .map(leerlingKey)
        .filter((classKey) => fullOrder.includes(classKey));

      const classIndex = sameClassKeys.indexOf(key);
      const nextClassIndex = classIndex + direction;
      if (classIndex < 0 || nextClassIndex < 0 || nextClassIndex >= sameClassKeys.length) return prev;

      const otherKey = sameClassKeys[nextClassIndex];
      const currentIndex = fullOrder.indexOf(key);
      const nextIndex = fullOrder.indexOf(otherKey);
      if (currentIndex < 0 || nextIndex < 0) return prev;

      [fullOrder[currentIndex], fullOrder[nextIndex]] = [fullOrder[nextIndex], fullOrder[currentIndex]];
      return fullOrder;
    });
  }

  async function bevestigKlasbeeldVolgorde() {
    if (!profiel || !activeGroupId) return;

    setSaving(true);
    setError(null);

    try {
      const activeGroup = klasgroepen.find((g) => g.id === activeGroupId);
      const filters = {
        ...(activeGroup?.filters ?? {}),
        leerjaarFilter,
        klasFilter,
        loGroepFilter,
        geslachtFilter,
        klasbeeldOpen: true,
      };

      const positiePayload = geordendeGeselecteerdeLeerlingen.map((leerling, positie) => ({
        klasgroep_id: activeGroupId,
        leerling_email: leerling.email.trim().toLowerCase(),
        positie,
      }));

      const { error: positieError } = await supabase
        .from("lo_klasgroep_leerlingen")
        .upsert(positiePayload, { onConflict: "klasgroep_id,leerling_email" });

      if (positieError) throw new Error(readableSupabaseError(positieError, "Kon leerlingvolgorde bewaren."));

      const { error: updateError } = await supabase
        .from("lo_klasgroepen")
        .update({ filters, bijgewerkt_op: new Date().toISOString() })
        .eq("id", activeGroupId)
        .eq("leerkracht_id", profiel.id);

      if (updateError) throw new Error(readableSupabaseError(updateError, "Kon volgorde niet bewaren."));
      await loadKlasgroepen(profiel.id, schooljaar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon volgorde niet bewaren.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteKlasgroep(group: Klasgroep) {
    if (!profiel) return;

    const ok = window.confirm(
      `Ben je zeker dat je klasgroep "${group.naam}" wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`
    );
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      const { error: groupError } = await supabase
        .from("lo_klasgroepen")
        .delete()
        .eq("id", group.id)
        .eq("leerkracht_id", profiel.id);

      if (groupError) throw new Error(readableSupabaseError(groupError, "Kon klasgroep niet verwijderen."));

      resetForm();
      await loadKlasgroepen(profiel.id, schooljaar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon klasgroep niet verwijderen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="LO App" subtitle="Klasgroepen">
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
          <Link href="/dashboard" style={{ color: ui.text, fontWeight: 900 }}>
            Terug naar dashboard →
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="LO App" subtitle="Klasgroepen" userName={profiel?.volledige_naam}>
      <BaseHero
        label="LO-leerkracht"
        title={
          <>
            Mijn{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              klasgroepen
            </span>
          </>
        }
        description="Maak vaste LO-klasgroepen voor een volledig schooljaar. Gebruik filters zoals leerjaar, klasrichting, LOJON/LOMEI en geslacht."
        imageSrc="/eurofit/eurofittest.png"
        imageAlt="LO klasgroepen"
        quoteTitle="Voorbeeld"
        quote="6DF (jongens) = alle DF-leerlingen uit het 6e jaar die in LOJON zitten."
        quoteAuthor="LO App"
        actions={
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-300/25 bg-[linear-gradient(180deg,rgba(12,18,24,0.72),rgba(0,0,0,0.58))] px-4 font-black text-[rgba(234,240,255,0.92)]"
          >
            Terug naar dashboard →
          </Link>
        }
      />

      {error ? (
        <div style={styles.error}>
          <b>Oeps:</b> {error}
        </div>
      ) : null}

      <section className="klasgroepen-layout" style={styles.layout}>
        <aside style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.h2}>Mijn klasgroepen</h2>
              <p style={styles.muted}>{schooljaar}</p>
            </div>

            <button onClick={resetForm} style={styles.smallButton}>
              Nieuw
            </button>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {klasgroepen.length === 0 ? (
              <div style={styles.emptyBox}>Nog geen klasgroepen voor dit schooljaar.</div>
            ) : (
              klasgroepen.map((group) => (
                <div
                  key={group.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 8,
                    alignItems: "stretch",
                  }}
                >
                  <button
                    onClick={() => openBestaandeGroep(group)}
                    style={{
                      ...styles.groupButton,
                      borderColor: activeGroupId === group.id ? "rgba(137,194,170,0.65)" : ui.border,
                    }}
                  >
                    <span>
                      <b>{group.naam}</b>
                    </span>
                    <span>{loadingGroupId === group.id ? "..." : "→"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteKlasgroep(group)}
                    disabled={saving}
                    style={{
                      ...styles.dangerButton,
                      minWidth: 44,
                      padding: "9px 11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={`Klasgroep ${group.naam} verwijderen`}
                    aria-label={`Klasgroep ${group.naam} verwijderen`}
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section style={styles.panel}>
          {activeGroupId && klasbeeldOpen ? (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.h2}>{previewNaam}</h2>
                  <p style={styles.muted}>Volledige klasgroep · {actieveKlasbeeldLeerlingen.length} leerlingen</p>
                </div>

                <div style={styles.actionRow}>
                  <button onClick={() => setKlasbeeldOpen(false)} style={styles.closeButton}>
                    Bewerken
                  </button>
                  <button onClick={bevestigKlasbeeldVolgorde} disabled={saving} style={styles.primaryButton}>
                    {saving ? "Bevestigen..." : "Bevestigen"}
                  </button>
                </div>
              </div>


              <div style={styles.klasbeeldScroll}>
                <div style={styles.klasbeeldTable}>
                  <div style={styles.klasbeeldClassRow}>
                    {klasbeeldGroepen.map((groep) => (
                      <div key={groep.klas} style={styles.klasbeeldClassBlock}>
                        <div style={styles.klasbeeldClassHeader}>{groep.klas}</div>
                        <div style={styles.klasbeeldNamesRow}>
                          {groep.leerlingen.map((leerling, index) => (
                            <div key={leerlingKey(leerling)} style={styles.klasbeeldCell}>
                              <div style={styles.orderButtons}>
                                <button
                                  onClick={() => moveLeerlingInKlas(leerling, -1)}
                                  disabled={index === 0 || saving}
                                  style={styles.orderButton}
                                  aria-label={`${leerling.naam} naar links`}
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => moveLeerlingInKlas(leerling, 1)}
                                  disabled={index === groep.leerlingen.length - 1 || saving}
                                  style={styles.orderButton}
                                  aria-label={`${leerling.naam} naar rechts`}
                                >
                                  →
                                </button>
                              </div>
                              <div title={familyFirstName(leerling)} style={styles.verticalName}>
                                {familyFirstName(leerling)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {actieveKlasbeeldLeerlingen.length === 0 ? (
                      <div style={styles.emptyBox}>Geen leerlingen in deze klasgroep.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={styles.sectionHeader}>
                <div>
                  <h2 style={styles.h2}>{activeGroupId ? "Klasgroep aanpassen" : "Nieuwe klasgroep maken"}</h2>
                  <p style={styles.muted}>
                    {geselecteerdeLeerlingen.length} geselecteerd van {gefilterdeLeerlingen.length} zichtbaar
                  </p>
                </div>

              </div>

              <div className="filter-grid" style={styles.filterGrid}>
                <div>
                  <label style={styles.label}>Schooljaar</label>
                  <select value={schooljaar} onChange={(e) => handleSchooljaarChange(e.target.value)} style={styles.input}>
                    {schooljaren.map((jaar) => (
                      <option key={jaar} value={jaar}>
                        {jaar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Naam klasgroep</label>
                  <input value={groepNaam} onChange={(e) => setGroepNaam(e.target.value)} placeholder={previewNaam} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>Leerjaar</label>
                  <select value={leerjaarFilter} onChange={(e) => setLeerjaarFilter(e.target.value)} style={styles.input}>
                    {leerjaren.map((jaar) => (
                      <option key={jaar} value={jaar}>
                        {jaar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Klas bevat</label>
                  <input value={klasFilter} onChange={(e) => setKlasFilter(e.target.value)} placeholder="bv. DF of BIOTECH" style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>LO-groep</label>
                  <select value={loGroepFilter} onChange={(e) => setLoGroepFilter(e.target.value)} style={styles.input}>
                    {loGroepen.map((groep) => (
                      <option key={groep} value={groep}>
                        {groep}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div style={styles.previewBox}>
                <div>
                  <div style={styles.previewTitle}>{previewNaam}</div>
                  <div style={styles.muted}>
                    {klassenSamenvatting.length === 0
                      ? "Nog geen leerlingen geselecteerd."
                      : klassenSamenvatting.map(([klas, count]) => `${klas}: ${count}`).join(" · ")}
                  </div>
                </div>

                <div style={styles.actionRow}>
                  <button onClick={selecteerGefilterden} style={styles.greenButton}>
                    Zichtbaren selecteren
                  </button>
                  <button onClick={deselecteerGefilterden} style={styles.closeButton}>
                    Zichtbaren wissen
                  </button>
                  {activeGroupId ? (
                    <button onClick={() => setKlasbeeldOpen(true)} style={styles.closeButton}>
                      Terug
                    </button>
                  ) : null}
                  <button onClick={saveKlasgroep} disabled={saving} style={styles.primaryButton}>
                    {saving ? "Opslaan..." : activeGroupId ? "Klasgroep bijwerken" : "Klasgroep opslaan"}
                  </button>
                </div>
              </div>

              <div className="student-grid" style={styles.studentGrid}>
                {gefilterdeLeerlingen.map((leerling) => {
                  const key = leerlingKey(leerling);
                  const checked = selectedKeys.has(key);

                  return (
                    <button
                      key={key}
                      onClick={() => toggleLeerling(leerling)}
                      style={{
                        ...styles.studentButton,
                        borderColor: checked ? "rgba(137,194,170,0.65)" : ui.border,
                        background: checked ? "rgba(137,194,170,0.12)" : "rgba(255,255,255,0.045)",
                      }}
                    >
                      <span>
                        <b>{leerling.naam}</b>
                        <small>
                          {leerling.klas} · {leerling.loGroep}
                          {leerling.geslacht ? ` · ${leerling.geslacht}` : ""}
                        </small>
                      </span>
                      <span>{checked ? "✓" : "+"}</span>
                    </button>
                  );
                })}

                {gefilterdeLeerlingen.length === 0 ? <div style={styles.emptyBox}>Geen leerlingen gevonden met deze filters.</div> : null}
              </div>
            </>
          )}
        </section>
      </section>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    gap: 14,
    alignItems: "start",
  },
  panel: {
    padding: 18,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  h2: {
    margin: 0,
    color: ui.text,
    fontSize: 20,
    fontWeight: 950,
  },
  muted: {
    margin: "4px 0 0",
    color: ui.muted,
    fontSize: 13,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  filterGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
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
  groupButton: {
    width: "100%",
    textAlign: "left",
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.045)",
    color: ui.text,
    borderRadius: 16,
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    cursor: "pointer",
  },
  studentGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  studentButton: {
    width: "100%",
    textAlign: "left",
    border: `1px solid ${ui.border}`,
    color: ui.text,
    borderRadius: 16,
    padding: "12px",
    fontWeight: 850,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  previewBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  previewTitle: {
    color: ui.text,
    fontWeight: 950,
    fontSize: 18,
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    border: "1px solid rgba(137,194,170,0.38)",
    background: "rgba(137,194,170,0.18)",
    color: ui.text,
    borderRadius: 16,
    padding: "10px 14px",
    fontWeight: 950,
    cursor: "pointer",
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
  closeButton: {
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    borderRadius: 16,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  smallButton: {
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    borderRadius: 14,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid rgba(255,85,112,0.32)",
    background: "rgba(255,85,112,0.14)",
    color: ui.text,
    borderRadius: 14,
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  classSwitchRow: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  classSwitchButton: {
    border: `1px solid ${ui.border}`,
    color: ui.text,
    borderRadius: 14,
    padding: "9px 14px",
    fontWeight: 950,
    cursor: "pointer",
  },
  sidebarClassBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTop: `1px solid ${ui.border}`,
  },
  sidebarClassTitle: {
    color: ui.muted,
    fontSize: 12,
    fontWeight: 950,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sidebarClassGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },
  klasbeeldScroll: {
    marginTop: 16,
    overflowX: "auto",
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.30)",
  },
  klasbeeldTable: {
    minWidth: "max-content",
  },
  klasbeeldHeader: {
    height: 56,
    minWidth: "100%",
    padding: "0 22px",
    display: "flex",
    alignItems: "center",
    borderBottom: "10px solid rgba(255,255,255,0.10)",
    color: ui.text,
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: 0.2,
    background: "rgba(0,0,0,0.38)",
  },
  klasbeeldClassRow: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "stretch",
    background: "rgba(0,0,0,0.22)",
  },
  klasbeeldClassBlock: {
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid rgba(255,255,255,0.20)`,
  },
  klasbeeldClassHeader: {
    height: 30,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.10)",
    color: ui.text,
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
    letterSpacing: 0.2,
  },
  klasbeeldNamesRow: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "flex-start",
  },
  klasbeeldCell: {
    width: 42,
    minWidth: 42,
    borderRight: `1px solid ${ui.border}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "6px 2px 10px",
  },
  verticalName: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    color: ui.text,
    fontSize: 15,
    fontWeight: 650,
    whiteSpace: "nowrap",
    lineHeight: 1,
    overflow: "visible",
    textOverflow: "clip",
  },
  orderButtons: {
    display: "flex",
    gap: 2,
    marginBottom: 6,
  },
  orderButton: {
    width: 18,
    height: 22,
    borderRadius: 8,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.28)",
    color: ui.text,
    fontSize: 12,
    fontWeight: 950,
    cursor: "pointer",
  },
  emptyBox: {
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
    color: ui.muted,
    fontSize: 13,
  },
  error: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
  },
};

function injectResponsiveCSS() {
  if (typeof window === "undefined") return;

  const id = "leerkrachten-lo-klasgroepen-responsive-css";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    .groupButton small,
    .studentButton small {
      display: block;
      margin-top: 4px;
      color: rgba(234,240,255,0.62);
      font-size: 12px;
      font-weight: 700;
    }

    @media (max-width: 980px) {
      .klasgroepen-layout {
        grid-template-columns: 1fr !important;
      }

      .filter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    button:disabled {
      opacity: 0.45;
      cursor: not-allowed !important;
    }

    @media (max-width: 640px) {
      .filter-grid,
      .student-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  document.head.appendChild(style);
}
