"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Profiel = {
  id: string;
  volledige_naam: string | null;
  rol: string | null;
  role: string | null;
  klas_naam: string | null;
};

type PeriodeType = "week" | "maand" | "schooljaar";

type FitnessReservatie = {
  id: string;
  datum: string;
  slot_key: string;

  reserveerder_id: string;
  reserveerder_naam: string | null;
  reserveerder_klas: string | null;
  reserveerder_rol: string | null;

  created_at: string | null;

  aantal_leerlingen: number;
};

type FitnessStatistiekRij = {
  aanwezigheid_id: string;
  reservatie_id: string;

  datum: string;
  slot_key: string;

  leerling_id: string;
  leerling_naam: string | null;
  leerling_klas: string | null;

  toegevoegd_door: string;
  toegevoegd_door_naam: string | null;

  toegevoegd_op: string;

  is_reservatiehouder: boolean;
};

type FitnessAanwezige = {
  aanwezigheid_id: string;
  leerling_id: string;

  volledige_naam: string | null;
  klas_naam: string | null;

  toegevoegd_door: string;
  toegevoegd_door_naam: string | null;

  toegevoegd_op: string;

  is_reservatiehouder: boolean;
};

type ZoekLeerling = {
  id: string;
  volledige_naam: string | null;
  klas_naam: string | null;
};

type Slot = {
  key: string;
  label: string;
  start: string;
  end: string;
};

/* =========================================================
   CONSTANTEN
========================================================= */

const MAX_AANWEZIGEN = 12;

const SLOTS: Slot[] = [
  {
    key: "08:05-08:55",
    label: "08:05 – 08:55",
    start: "08:05",
    end: "08:55",
  },
  {
    key: "08:55-09:45",
    label: "08:55 – 09:45",
    start: "08:55",
    end: "09:45",
  },
  {
    key: "09:45-10:35",
    label: "09:45 – 10:35",
    start: "09:45",
    end: "10:35",
  },
  {
    key: "10:50-11:40",
    label: "10:50 – 11:40",
    start: "10:50",
    end: "11:40",
  },
  {
    key: "11:40-12:30",
    label: "11:40 – 12:30",
    start: "11:40",
    end: "12:30",
  },
  {
    key: "13:20-14:10",
    label: "13:20 – 14:10",
    start: "13:20",
    end: "14:10",
  },
  {
    key: "14:10-15:00",
    label: "14:10 – 15:00",
    start: "14:10",
    end: "15:00",
  },
  {
    key: "15:10-16:00",
    label: "15:10 – 16:00",
    start: "15:10",
    end: "16:00",
  },
];

const WEEKDAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const ui = {
  text: "rgba(234,240,255,0.94)",
  muted: "rgba(234,240,255,0.72)",
  faint: "rgba(234,240,255,0.52)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, (month || 1) - 1, day || 1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);

  next.setDate(next.getDate() + amount);

  return next;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);

  next.setMonth(next.getMonth() + amount);

  return next;
}

function startOfWeek(date: Date) {
  const result = new Date(date);

  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);

  end.setHours(23, 59, 59, 999);

  return end;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getSchoolYear(date: Date) {
  const year = date.getFullYear();

  if (date.getMonth() >= 8) {
    return {
      label: `${year}-${year + 1}`,
      start: new Date(year, 8, 1),
      end: new Date(year + 1, 7, 31),
    };
  }

  return {
    label: `${year - 1}-${year}`,
    start: new Date(year - 1, 8, 1),
    end: new Date(year, 7, 31),
  };
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parseLocalDate(dateString));
}

function formatLongDate(dateString: string) {
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseLocalDate(dateString));
}

function formatShortRangeDate(date: Date) {
  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("nl-BE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getSlot(slotKey: string) {
  return SLOTS.find((slot) => slot.key === slotKey) ?? null;
}

function getSlotLabel(slotKey: string) {
  return getSlot(slotKey)?.label ?? slotKey;
}

function getReadableError(message: string) {
  if (message.includes("GEEN_TOEGANG")) {
    return "Je hebt geen toegang tot het fitnessbeheer.";
  }

  if (message.includes("NIET_INGELOGD")) {
    return "Je bent niet meer ingelogd.";
  }

  if (message.includes("FITNESS_VOLZET")) {
    return "Deze fitnessgroep telt al 12 leerlingen.";
  }

  if (message.includes("RESERVATIE_NIET_GEVONDEN")) {
    return "Deze reservatie bestaat niet meer.";
  }

  if (message.includes("LEERLING_NIET_GEVONDEN")) {
    return "Deze leerling kon niet gevonden worden.";
  }

  return message;
}

function countMap<T>(
  rows: T[],
  getKey: (row: T) => string | null | undefined
) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const key = getKey(row)?.trim();

    if (!key) continue;

    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

/* =========================================================
   PAGE
========================================================= */

export default function FitnessLeerkrachtPage() {
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [periodeType, setPeriodeType] = useState<PeriodeType>("week");

  const [focusDate, setFocusDate] = useState(() => new Date());

  const [reservaties, setReservaties] = useState<FitnessReservatie[]>([]);
  const [statistiekData, setStatistiekData] = useState<
    FitnessStatistiekRij[]
  >([]);

  const [selectedReservation, setSelectedReservation] =
    useState<FitnessReservatie | null>(null);

  const [aanwezigen, setAanwezigen] = useState<FitnessAanwezige[]>([]);
  const [loadingAanwezigen, setLoadingAanwezigen] = useState(false);

  const [zoekterm, setZoekterm] = useState("");
  const [zoekResultaten, setZoekResultaten] = useState<ZoekLeerling[]>([]);
  const [zoeken, setZoeken] = useState(false);

  const [filterNaam, setFilterNaam] = useState("");
  const [filterKlas, setFilterKlas] = useState("");
  const [filterSlot, setFilterSlot] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* =========================================================
     ROL
  ========================================================= */

  const normalizedRole = normalizeRole(profiel?.rol || profiel?.role);

  const isLoStaff =
    normalizedRole === "lo_leerkracht" ||
    normalizedRole === "leerkracht_lo" ||
    normalizedRole === "admin";

  /* =========================================================
     PERIODE
  ========================================================= */

  const periode = useMemo(() => {
    if (periodeType === "week") {
      const start = startOfWeek(focusDate);
      const end = endOfWeek(focusDate);

      return {
        start,
        end,
        label: `${formatShortRangeDate(start)} — ${formatShortRangeDate(end)}`,
      };
    }

    if (periodeType === "maand") {
      const start = startOfMonth(focusDate);
      const end = endOfMonth(focusDate);

      return {
        start,
        end,
        label: formatMonth(focusDate),
      };
    }

    const schoolYear = getSchoolYear(focusDate);

    return {
      start: schoolYear.start,
      end: schoolYear.end,
      label: `Schooljaar ${schoolYear.label}`,
    };
  }, [periodeType, focusDate]);

  const vanaf = toDateString(periode.start);
  const tot = toDateString(periode.end);

  /* =========================================================
     PROFIEL
  ========================================================= */

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, rol, role, klas_naam")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as Profiel) ?? null;
  }, []);

  /* =========================================================
     DATA LADEN
  ========================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      const [reservatieResult, statistiekResult] = await Promise.all([
        supabase.rpc("fitness_leerkracht_get_reservaties", {
          p_vanaf: vanaf,
          p_tot: tot,
        }),

        supabase.rpc("fitness_leerkracht_get_statistiek_data", {
          p_vanaf: vanaf,
          p_tot: tot,
        }),
      ]);

      if (reservatieResult.error) {
        throw new Error(reservatieResult.error.message);
      }

      if (statistiekResult.error) {
        throw new Error(statistiekResult.error.message);
      }

      setReservaties(
        ((reservatieResult.data ?? []) as FitnessReservatie[]).map((row) => ({
          ...row,
          aantal_leerlingen: Number(row.aantal_leerlingen ?? 0),
        }))
      );

      setStatistiekData(
        (statistiekResult.data ?? []) as FitnessStatistiekRij[]
      );

      setSelectedReservation((current) => {
        if (!current) return null;

        return (
          ((reservatieResult.data ?? []) as FitnessReservatie[]).find(
            (row) => row.id === current.id
          ) ?? null
        );
      });
    } catch (e: any) {
      setError(
        getReadableError(e?.message ?? "Kon de fitnessgegevens niet ophalen.")
      );
    } finally {
      setLoadingData(false);
    }
  }, [vanaf, tot]);

  /* =========================================================
     INIT
  ========================================================= */

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        const user = data.session?.user;

        if (!user?.id) {
          window.location.replace("/login");
          return;
        }

        const profielData = await loadProfile(user.id);

        setProfiel(profielData);

        const rol = normalizeRole(profielData?.rol || profielData?.role);

        const toegestaan =
          rol === "lo_leerkracht" ||
          rol === "leerkracht_lo" ||
          rol === "admin";

        if (!toegestaan) {
          window.location.replace("/dashboard");
          return;
        }
      } catch (e: any) {
        setError(e?.message ?? "Kon je profiel niet laden.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadProfile]);

  useEffect(() => {
    if (!profiel || !isLoStaff) return;

    loadData();
  }, [profiel, isLoStaff, loadData]);

  /* =========================================================
     DEELNEMERS LADEN
  ========================================================= */

  const loadAanwezigen = useCallback(async (reservationId: string) => {
    try {
      setLoadingAanwezigen(true);
      setError(null);

      const { data, error } = await supabase.rpc(
        "fitness_get_aanwezigen",
        {
          p_reservatie_id: reservationId,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setAanwezigen((data ?? []) as FitnessAanwezige[]);
    } catch (e: any) {
      setAanwezigen([]);

      setError(
        getReadableError(e?.message ?? "Kon de deelnemers niet ophalen.")
      );
    } finally {
      setLoadingAanwezigen(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedReservation?.id) {
      setAanwezigen([]);
      setZoekterm("");
      setZoekResultaten([]);
      return;
    }

    loadAanwezigen(selectedReservation.id);
  }, [selectedReservation?.id, loadAanwezigen]);

  /* =========================================================
     LEERLING ZOEKEN
  ========================================================= */

  useEffect(() => {
    if (!selectedReservation?.id) {
      setZoekResultaten([]);
      return;
    }

    const q = zoekterm.trim();

    if (q.length < 2) {
      setZoekResultaten([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setZoeken(true);

        const { data, error } = await supabase.rpc(
          "fitness_zoek_leerlingen",
          {
            p_reservatie_id: selectedReservation.id,
            p_zoekterm: q,
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        setZoekResultaten((data ?? []) as ZoekLeerling[]);
      } catch (e: any) {
        setZoekResultaten([]);

        setError(
          getReadableError(e?.message ?? "Zoeken naar leerlingen mislukt.")
        );
      } finally {
        setZoeken(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [zoekterm, selectedReservation?.id]);

  /* =========================================================
     STATISTIEKEN
  ========================================================= */

  const totalReservaties = reservaties.length;

  const totalAanwezigheden = statistiekData.length;

  const uniekeLeerlingen = useMemo(
    () => new Set(statistiekData.map((row) => row.leerling_id)).size,
    [statistiekData]
  );

  const gebruikteMomenten = useMemo(
    () =>
      new Set(
        reservaties.map((row) => `${row.datum}|${row.slot_key}`)
      ).size,
    [reservaties]
  );

  const gemiddeldAantal =
    totalReservaties > 0
      ? totalAanwezigheden / totalReservaties
      : 0;

  const leerlingRanking = useMemo(
    () => countMap(statistiekData, (row) => row.leerling_naam),
    [statistiekData]
  );

  const klasRanking = useMemo(
    () => countMap(statistiekData, (row) => row.leerling_klas),
    [statistiekData]
  );

  const slotRanking = useMemo(
    () => countMap(statistiekData, (row) => getSlotLabel(row.slot_key)),
    [statistiekData]
  );

  const weekdayRanking = useMemo(
    () =>
      countMap(statistiekData, (row) => {
        const date = parseLocalDate(row.datum);

        return WEEKDAYS[date.getDay()];
      }),
    [statistiekData]
  );

  const druksteLeerling = leerlingRanking[0] ?? null;
  const druksteKlas = klasRanking[0] ?? null;
  const druksteSlot = slotRanking[0] ?? null;
  const druksteDag = weekdayRanking[0] ?? null;

  /* =========================================================
     MAANDSTATISTIEK SCHOOLJAAR
  ========================================================= */

  const monthStats = useMemo(() => {
    if (periodeType !== "schooljaar") return [];

    const schoolYear = getSchoolYear(focusDate);

    const result: {
      key: string;
      label: string;
      aantal: number;
    }[] = [];

    for (let index = 0; index < 12; index++) {
      const monthDate = addMonths(schoolYear.start, index);

      const key = `${monthDate.getFullYear()}-${pad2(
        monthDate.getMonth() + 1
      )}`;

      const aantal = statistiekData.filter((row) =>
        row.datum.startsWith(key)
      ).length;

      result.push({
        key,
        label: new Intl.DateTimeFormat("nl-BE", {
          month: "short",
        }).format(monthDate),
        aantal,
      });
    }

    return result;
  }, [periodeType, focusDate, statistiekData]);

  const maxMonthValue = Math.max(
    1,
    ...monthStats.map((month) => month.aantal)
  );

  /* =========================================================
     FILTERS
  ========================================================= */

  const klassen = useMemo(() => {
    return Array.from(
      new Set(
        reservaties
          .map((row) => row.reserveerder_klas)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b, "nl"));
  }, [reservaties]);

  const filteredReservaties = useMemo(() => {
    const naamFilter = filterNaam.trim().toLowerCase();

    return reservaties.filter((row) => {
      if (
        naamFilter &&
        !String(row.reserveerder_naam ?? "")
          .toLowerCase()
          .includes(naamFilter)
      ) {
        return false;
      }

      if (filterKlas && row.reserveerder_klas !== filterKlas) {
        return false;
      }

      if (filterSlot && row.slot_key !== filterSlot) {
        return false;
      }

      return true;
    });
  }, [reservaties, filterNaam, filterKlas, filterSlot]);

  /* =========================================================
     PERIODE NAVIGATIE
  ========================================================= */

  function movePeriod(direction: -1 | 1) {
    setSelectedReservation(null);
    setError(null);
    setSuccess(null);

    if (periodeType === "week") {
      setFocusDate((current) => addDays(current, direction * 7));
      return;
    }

    if (periodeType === "maand") {
      setFocusDate((current) => addMonths(current, direction));
      return;
    }

    setFocusDate(
      (current) =>
        new Date(
          current.getFullYear() + direction,
          current.getMonth(),
          current.getDate()
        )
    );
  }

  function goToday() {
    setFocusDate(new Date());
    setSelectedReservation(null);
  }

  /* =========================================================
     RESERVATIE SELECTEREN
  ========================================================= */

  function openReservation(reservation: FitnessReservatie) {
    setSelectedReservation(reservation);
    setError(null);
    setSuccess(null);
    setZoekterm("");
    setZoekResultaten([]);

    window.setTimeout(() => {
      document
        .getElementById("fitness-reservatie-detail")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  /* =========================================================
     LEERLING TOEVOEGEN
  ========================================================= */

  async function addStudent(student: ZoekLeerling) {
    if (!selectedReservation) return;

    if (aanwezigen.length >= MAX_AANWEZIGEN) {
      setError("Deze groep telt al 12 leerlingen.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.rpc(
        "fitness_voeg_leerling_toe",
        {
          p_reservatie_id: selectedReservation.id,
          p_leerling_id: student.id,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      await Promise.all([
        loadAanwezigen(selectedReservation.id),
        loadData(),
      ]);

      setZoekterm("");
      setZoekResultaten([]);

      setSuccess(
        `${student.volledige_naam ?? "Leerling"} werd toegevoegd.`
      );
    } catch (e: any) {
      setError(
        getReadableError(e?.message ?? "Leerling toevoegen mislukt.")
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LEERLING VERWIJDEREN
  ========================================================= */

  async function removeStudent(student: FitnessAanwezige) {
    if (!selectedReservation) return;

    const confirmed = window.confirm(
      `Wil je ${student.volledige_naam ?? "deze leerling"} verwijderen uit deze fitnessgroep?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.rpc(
        "fitness_verwijder_leerling",
        {
          p_reservatie_id: selectedReservation.id,
          p_leerling_id: student.leerling_id,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      await Promise.all([
        loadAanwezigen(selectedReservation.id),
        loadData(),
      ]);

      setSuccess(
        `${student.volledige_naam ?? "Leerling"} werd verwijderd.`
      );
    } catch (e: any) {
      setError(
        getReadableError(e?.message ?? "Leerling verwijderen mislukt.")
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     RESERVATIE ANNULEREN
  ========================================================= */

  async function cancelReservation(reservation: FitnessReservatie) {
    const confirmed = window.confirm(
      `Wil je de reservatie van ${
        reservation.reserveerder_naam ?? "deze gebruiker"
      } op ${formatLongDate(reservation.datum)} om ${getSlotLabel(
        reservation.slot_key
      )} verwijderen?\n\nAlle deelnemers van deze reservatie worden eveneens verwijderd.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.rpc("fitness_annuleer", {
        p_reservatie_id: reservation.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (selectedReservation?.id === reservation.id) {
        setSelectedReservation(null);
        setAanwezigen([]);
      }

      await loadData();

      setSuccess("De fitnessreservatie werd verwijderd.");
    } catch (e: any) {
      setError(
        getReadableError(e?.message ?? "Reservatie verwijderen mislukt.")
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div
          style={{
            color: ui.text,
            fontWeight: 900,
          }}
        >
          Fitnessbeheer laden…
        </div>
      </main>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell
      title="LO App"
      subtitle="Fitnessbeheer"
      userName={profiel?.volledige_naam ?? null}
    >
      <style>{css}</style>

      <BaseHero
        label="LO • FITNESS"
        title={
          <>
            Fitnessreservaties
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {" "}
              beheren
            </span>
          </>
        }
        description="Bekijk reservaties, deelnemers en gebruiksstatistieken van de fitnessruimte."
        imageSrc="/reservaties/reservaties-fitness.png"
        imageAlt="Fitnessbeheer"
        quoteTitle="Overzicht"
        quote="Een duidelijk overzicht helpt ons de fitnessruimte correct en veilig te gebruiken."
        quoteAuthor="LO Team"
        actions={
          <div className="hero-actions">
            <Link href="/leerkrachten-lo" className="hero-button">
              ← Leerkrachten LO
            </Link>

            <Link href="/reservaties/fitness" className="hero-button">
              Fitness voor gebruikers
            </Link>
          </div>
        }
      />

      <main className="fitness-admin">
        {/* ===================================================
            MELDING
        =================================================== */}

        {error && (
          <div className="message error">
            <span>!</span>

            <div>
              <strong>Fout</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="message success">
            <span>✓</span>

            <div>
              <strong>Gelukt</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* ===================================================
            PERIODE
        =================================================== */}

        <section className="period-card">
          <div className="period-top">
            <div>
              <span className="eyebrow">PERIODE</span>
              <h2>{periode.label}</h2>
            </div>

            <div className="period-types">
              <button
                type="button"
                className={periodeType === "week" ? "active" : ""}
                onClick={() => {
                  setPeriodeType("week");
                  setFocusDate(new Date());
                }}
              >
                Week
              </button>

              <button
                type="button"
                className={periodeType === "maand" ? "active" : ""}
                onClick={() => {
                  setPeriodeType("maand");
                  setFocusDate(new Date());
                }}
              >
                Maand
              </button>

              <button
                type="button"
                className={periodeType === "schooljaar" ? "active" : ""}
                onClick={() => {
                  setPeriodeType("schooljaar");
                  setFocusDate(new Date());
                }}
              >
                Schooljaar
              </button>
            </div>
          </div>

          <div className="period-navigation">
            <button type="button" onClick={() => movePeriod(-1)}>
              ← Vorige
            </button>

            <button type="button" onClick={goToday}>
              Vandaag
            </button>

            <button type="button" onClick={() => movePeriod(1)}>
              Volgende →
            </button>
          </div>
        </section>

        {/* ===================================================
            KPI
        =================================================== */}

        <section className="kpi-grid">
          <div className="kpi-card">
            <span>RESERVATIES</span>
            <strong>{totalReservaties}</strong>
            <p>Geboekte fitnessmomenten</p>
          </div>

          <div className="kpi-card">
            <span>AANWEZIGHEDEN</span>
            <strong>{totalAanwezigheden}</strong>
            <p>Geregistreerde deelnames</p>
          </div>

          <div className="kpi-card">
            <span>UNIEKE LEERLINGEN</span>
            <strong>{uniekeLeerlingen}</strong>
            <p>Verschillende leerlingen</p>
          </div>

          <div className="kpi-card">
            <span>GEMIDDELD</span>
            <strong>{gemiddeldAantal.toFixed(1)}</strong>
            <p>Leerlingen per reservatie</p>
          </div>
        </section>

        {/* ===================================================
            EXTRA STATISTIEKEN
        =================================================== */}

        <section className="insight-grid">
          <div className="insight-card">
            <span className="insight-icon">👤</span>
            <div>
              <small>Meest actieve leerling</small>
              <strong>{druksteLeerling?.[0] ?? "—"}</strong>
              <p>
                {druksteLeerling
                  ? `${druksteLeerling[1]} deelnames`
                  : "Nog geen gegevens"}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <span className="insight-icon">🎓</span>
            <div>
              <small>Meest actieve klas</small>
              <strong>{druksteKlas?.[0] ?? "—"}</strong>
              <p>
                {druksteKlas
                  ? `${druksteKlas[1]} deelnames`
                  : "Nog geen gegevens"}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <span className="insight-icon">🕐</span>
            <div>
              <small>Drukste uur</small>
              <strong>{druksteSlot?.[0] ?? "—"}</strong>
              <p>
                {druksteSlot
                  ? `${druksteSlot[1]} deelnames`
                  : "Nog geen gegevens"}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <span className="insight-icon">📅</span>
            <div>
              <small>Drukste weekdag</small>
              <strong>{druksteDag?.[0] ?? "—"}</strong>
              <p>
                {druksteDag
                  ? `${druksteDag[1]} deelnames`
                  : "Nog geen gegevens"}
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            SCHOOLJAAR CHART
        =================================================== */}

        {periodeType === "schooljaar" && (
          <section className="chart-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">SCHOOLJAAR</span>
                <h2>Gebruik per maand</h2>
              </div>

              <span className="section-pill">
                {totalAanwezigheden} deelnames
              </span>
            </div>

            <div className="month-chart">
              {monthStats.map((month) => {
                const percentage =
                  month.aantal === 0
                    ? 0
                    : Math.max(
                        5,
                        (month.aantal / maxMonthValue) * 100
                      );

                return (
                  <div key={month.key} className="month-column">
                    <div className="month-number">{month.aantal}</div>

                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span>{month.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================
            TOP 5
        =================================================== */}

        <section className="ranking-grid">
          <div className="ranking-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">LEERLINGEN</span>
                <h2>Meest actief</h2>
              </div>
            </div>

            {leerlingRanking.length === 0 ? (
              <div className="empty">Nog geen gegevens.</div>
            ) : (
              <div className="ranking-list">
                {leerlingRanking.slice(0, 5).map(([naam, aantal], index) => (
                  <div key={naam} className="ranking-row">
                    <span className="rank-number">{index + 1}</span>

                    <strong>{naam}</strong>

                    <span className="rank-value">{aantal}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ranking-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">KLASSEN</span>
                <h2>Meest actief</h2>
              </div>
            </div>

            {klasRanking.length === 0 ? (
              <div className="empty">Nog geen gegevens.</div>
            ) : (
              <div className="ranking-list">
                {klasRanking.slice(0, 5).map(([klas, aantal], index) => (
                  <div key={klas} className="ranking-row">
                    <span className="rank-number">{index + 1}</span>

                    <strong>{klas}</strong>

                    <span className="rank-value">{aantal}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            RESERVATIELIJST
        =================================================== */}

        <section className="reservations-card">
          <div className="section-title">
            <div>
              <span className="eyebrow">RESERVATIES</span>
              <h2>Fitnessmomenten</h2>
            </div>

            <span className="section-pill">
              {filteredReservaties.length} van {reservaties.length}
            </span>
          </div>

          <div className="filters">
            <input
              value={filterNaam}
              onChange={(e) => setFilterNaam(e.target.value)}
              placeholder="Zoek reserveerder…"
            />

            <select
              value={filterKlas}
              onChange={(e) => setFilterKlas(e.target.value)}
            >
              <option value="">Alle klassen</option>

              {klassen.map((klas) => (
                <option key={klas} value={klas}>
                  {klas}
                </option>
              ))}
            </select>

            <select
              value={filterSlot}
              onChange={(e) => setFilterSlot(e.target.value)}
            >
              <option value="">Alle uren</option>

              {SLOTS.map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>

            {(filterNaam || filterKlas || filterSlot) && (
              <button
                type="button"
                className="clear-filter"
                onClick={() => {
                  setFilterNaam("");
                  setFilterKlas("");
                  setFilterSlot("");
                }}
              >
                Wis filters
              </button>
            )}
          </div>

          {loadingData ? (
            <div className="empty">Fitnessgegevens laden…</div>
          ) : filteredReservaties.length === 0 ? (
            <div className="empty">
              Geen fitnessreservaties gevonden voor deze periode.
            </div>
          ) : (
            <div className="reservation-list">
              {filteredReservaties.map((reservation) => (
                <div
                  key={reservation.id}
                  className={`reservation-row ${
                    selectedReservation?.id === reservation.id
                      ? "selected"
                      : ""
                  }`}
                >
                  <div className="reservation-date">
                    <strong>{formatDate(reservation.datum)}</strong>
                    <span>{getSlotLabel(reservation.slot_key)}</span>
                  </div>

                  <div className="reservation-person">
                    <strong>
                      {reservation.reserveerder_naam ?? "Onbekend"}
                    </strong>

                    <span>
                      {reservation.reserveerder_klas ??
                        (reservation.reserveerder_rol === "leerkracht"
                          ? "Leerkracht"
                          : "Geen klas")}
                    </span>
                  </div>

                  <div className="reservation-count">
                    <strong>{reservation.aantal_leerlingen}</strong>
                    <span>leerlingen</span>
                  </div>

                  <div className="reservation-actions">
                    <button
                      type="button"
                      className="manage-button"
                      onClick={() => openReservation(reservation)}
                    >
                      Bekijken
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      disabled={saving}
                      onClick={() => cancelReservation(reservation)}
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===================================================
            DETAIL
        =================================================== */}

        {selectedReservation && (
          <section
            id="fitness-reservatie-detail"
            className="detail-card"
          >
            <div className="detail-header">
              <div>
                <span className="eyebrow">RESERVATIEDETAIL</span>

                <h2>
                  {selectedReservation.reserveerder_naam ?? "Fitnessgroep"}
                </h2>

                <p>
                  {formatLongDate(selectedReservation.datum)}
                  {" • "}
                  {getSlotLabel(selectedReservation.slot_key)}
                </p>
              </div>

              <div className="detail-actions">
                <span
                  className={`capacity ${
                    aanwezigen.length >= MAX_AANWEZIGEN ? "full" : ""
                  }`}
                >
                  <strong>{aanwezigen.length}</strong> / {MAX_AANWEZIGEN}
                </span>

                <button
                  type="button"
                  className="close-detail"
                  onClick={() => setSelectedReservation(null)}
                >
                  Sluiten
                </button>
              </div>
            </div>

            <div className="detail-info">
              <div>
                <span>Reservatiehouder</span>
                <strong>
                  {selectedReservation.reserveerder_naam ?? "Onbekend"}
                </strong>
              </div>

              <div>
                <span>Klas</span>
                <strong>
                  {selectedReservation.reserveerder_klas ?? "—"}
                </strong>
              </div>

              <div>
                <span>Fitnessuur</span>
                <strong>
                  {getSlotLabel(selectedReservation.slot_key)}
                </strong>
              </div>

              <div>
                <span>Aantal leerlingen</span>
                <strong>{aanwezigen.length}</strong>
              </div>
            </div>

            <div className="detail-grid">
              {/* =============================================
                  AANWEZIGEN
              ============================================= */}

              <div className="participants-card">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">DEELNEMERS</span>
                    <h2>Aanwezigen</h2>
                  </div>
                </div>

                {loadingAanwezigen ? (
                  <div className="empty">Deelnemers laden…</div>
                ) : aanwezigen.length === 0 ? (
                  <div className="empty">
                    Er zijn nog geen leerlingen geregistreerd.
                  </div>
                ) : (
                  <div className="participants-list">
                    {aanwezigen.map((student, index) => (
                      <div
                        key={student.aanwezigheid_id}
                        className={`participant-row ${
                          student.is_reservatiehouder ? "owner" : ""
                        }`}
                      >
                        <span className="participant-number">
                          {index + 1}
                        </span>

                        <div className="participant-name">
                          <div>
                            <strong>
                              {student.volledige_naam ?? "Leerling"}
                            </strong>

                            {student.is_reservatiehouder && (
                              <span className="owner-badge">
                                Reservatiehouder
                              </span>
                            )}
                          </div>

                          <span>{student.klas_naam ?? "Geen klas"}</span>

                          <small>
                            Toegevoegd door{" "}
                            <strong>
                              {student.toegevoegd_door_naam ?? "Onbekend"}
                            </strong>
                          </small>
                        </div>

                        {!student.is_reservatiehouder && (
                          <button
                            type="button"
                            className="remove-student"
                            disabled={saving}
                            onClick={() => removeStudent(student)}
                            title="Leerling verwijderen"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* =============================================
                  TOEVOEGEN
              ============================================= */}

              <div className="add-card">
                <span className="eyebrow">CORRECTIE</span>
                <h2>Leerling toevoegen</h2>

                <p>
                  Als LO-leerkracht kan je ook na afloop nog een leerling
                  toevoegen of verwijderen.
                </p>

                {aanwezigen.length >= MAX_AANWEZIGEN ? (
                  <div className="full-message">
                    Deze fitnessgroep is volzet.
                  </div>
                ) : (
                  <>
                    <div className="student-search">
                      <span>⌕</span>

                      <input
                        value={zoekterm}
                        onChange={(e) => {
                          setZoekterm(e.target.value);
                          setError(null);
                        }}
                        disabled={saving}
                        placeholder="Naam leerling…"
                      />
                    </div>

                    {zoeken && (
                      <div className="search-status">Zoeken…</div>
                    )}

                    {!zoeken &&
                      zoekterm.trim().length >= 2 &&
                      zoekResultaten.length === 0 && (
                        <div className="search-status">
                          Geen leerlingen gevonden.
                        </div>
                      )}

                    {zoekResultaten.length > 0 && (
                      <div className="student-results">
                        {zoekResultaten.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            disabled={saving}
                            onClick={() => addStudent(student)}
                          >
                            <div className="student-avatar">
                              {(student.volledige_naam ?? "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {student.volledige_naam ?? "Leerling"}
                              </strong>

                              <span>{student.klas_naam ?? "Geen klas"}</span>
                            </div>

                            <span className="plus">+</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="audit-info">
                  <span>ℹ️</span>

                  <p>
                    Elke correctie blijft gekoppeld aan de persoon die de
                    leerling heeft toegevoegd.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

/* =========================================================
   CSS
========================================================= */

const css = `
  * {
    box-sizing: border-box;
  }

  .fitness-admin {
    width: 100%;
    max-width: 1220px;
    margin: 0 auto;
    padding: 18px 18px 80px;
    color: ${ui.text};
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .hero-button {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 15px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.30);
    color: ${ui.text};
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    transition: 180ms ease;
  }

  .hero-button:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.07);
  }

  .eyebrow {
    display: inline-block;
    color: ${ui.faint};
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.12em;
  }

  .message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 18px;
  }

  .message > span {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    border-radius: 10px;
    font-weight: 950;
  }

  .message strong {
    font-size: 12px;
  }

  .message p {
    margin: 3px 0 0;
    color: ${ui.muted};
    font-size: 11px;
  }

  .message.error {
    border: 1px solid rgba(251,113,133,0.22);
    background: rgba(251,113,133,0.08);
  }

  .message.error > span {
    background: rgba(251,113,133,0.13);
    color: #fda4af;
  }

  .message.success {
    border: 1px solid rgba(74,222,128,0.22);
    background: rgba(74,222,128,0.08);
  }

  .message.success > span {
    background: rgba(74,222,128,0.13);
    color: #86efac;
  }

  .period-card,
  .kpi-card,
  .insight-card,
  .chart-card,
  .ranking-card,
  .reservations-card,
  .detail-card,
  .participants-card,
  .add-card {
    border: 1px solid ${ui.border};
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.035)
      );
    box-shadow: 0 18px 45px rgba(0,0,0,0.14);
    backdrop-filter: blur(14px);
  }

  .period-card {
    padding: 18px;
    border-radius: 24px;
  }

  .period-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .period-top h2 {
    margin: 5px 0 0;
    color: ${ui.text};
    font-size: 22px;
    font-weight: 950;
    text-transform: capitalize;
  }

  .period-types {
    display: flex;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.20);
  }

  .period-types button {
    padding: 9px 13px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: ${ui.muted};
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .period-types button.active {
    background:
      linear-gradient(
        135deg,
        rgba(37,89,113,0.86),
        rgba(75,142,141,0.80)
      );
    color: white;
  }

  .period-navigation {
    display: flex;
    gap: 8px;
    margin-top: 15px;
  }

  .period-navigation button {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 11px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.035);
    color: ${ui.text};
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 12px;
    margin-top: 14px;
  }

  .kpi-card {
    padding: 18px;
    border-radius: 21px;
  }

  .kpi-card > span {
    color: ${ui.faint};
    font-size: 9px;
    font-weight: 950;
    letter-spacing: 0.10em;
  }

  .kpi-card strong {
    display: block;
    margin-top: 8px;
    color: white;
    font-size: 31px;
    line-height: 1;
    font-weight: 950;
  }

  .kpi-card p {
    margin: 7px 0 0;
    color: ${ui.muted};
    font-size: 10px;
  }

  .insight-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0,1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .insight-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border-radius: 19px;
  }

  .insight-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 14px;
    background: rgba(137,194,170,0.09);
    font-size: 19px;
  }

  .insight-card div {
    min-width: 0;
  }

  .insight-card small {
    display: block;
    color: ${ui.faint};
    font-size: 9px;
  }

  .insight-card strong {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: ${ui.text};
    font-size: 12px;
    font-weight: 950;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: capitalize;
  }

  .insight-card p {
    margin: 3px 0 0;
    color: ${ui.muted};
    font-size: 9px;
  }

  .chart-card,
  .ranking-card,
  .reservations-card,
  .detail-card {
    margin-top: 14px;
    padding: 20px;
    border-radius: 24px;
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .section-title h2,
  .detail-card h2,
  .participants-card h2,
  .add-card h2 {
    margin: 5px 0 0;
    color: ${ui.text};
    font-size: 21px;
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .section-pill {
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(137,194,170,0.18);
    background: rgba(137,194,170,0.07);
    color: #d1fae5;
    font-size: 9px;
    font-weight: 900;
  }

  .month-chart {
    display: grid;
    grid-template-columns: repeat(12, minmax(0,1fr));
    gap: 8px;
    height: 220px;
    margin-top: 20px;
  }

  .month-column {
    display: grid;
    grid-template-rows: 22px 1fr 22px;
    gap: 5px;
    min-width: 0;
    text-align: center;
  }

  .month-number {
    color: ${ui.muted};
    font-size: 9px;
    font-weight: 850;
  }

  .bar-track {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: rgba(255,255,255,0.035);
  }

  .bar-fill {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: 10px;
    background:
      linear-gradient(
        180deg,
        rgba(137,194,170,0.90),
        rgba(37,89,113,0.88)
      );
  }

  .month-column > span {
    overflow: hidden;
    color: ${ui.faint};
    font-size: 8px;
    text-overflow: ellipsis;
    text-transform: capitalize;
  }

  .ranking-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .ranking-list {
    display: grid;
    gap: 7px;
    margin-top: 14px;
  }

  .ranking-row {
    display: grid;
    grid-template-columns: 31px minmax(0,1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.16);
  }

  .rank-number {
    display: grid;
    place-items: center;
    width: 29px;
    height: 29px;
    border-radius: 9px;
    background: rgba(137,194,170,0.08);
    color: #d1fae5;
    font-size: 10px;
    font-weight: 950;
  }

  .ranking-row strong {
    overflow: hidden;
    color: ${ui.text};
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rank-value {
    min-width: 30px;
    padding: 5px 7px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    color: ${ui.muted};
    font-size: 9px;
    font-weight: 900;
    text-align: center;
  }

  .filters {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr auto;
    gap: 8px;
    margin-top: 16px;
  }

  .filters input,
  .filters select {
    min-width: 0;
    min-height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid ${ui.borderStrong};
    outline: none;
    background: rgba(0,0,0,0.25);
    color: ${ui.text};
    font-size: 10px;
    color-scheme: dark;
  }

  .clear-filter {
    min-height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid rgba(251,191,36,0.18);
    background: rgba(251,191,36,0.06);
    color: #fde68a;
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
  }

  .reservation-list {
    display: grid;
    gap: 8px;
    margin-top: 15px;
  }

  .reservation-row {
    display: grid;
    grid-template-columns:
      minmax(145px,0.8fr)
      minmax(180px,1.3fr)
      110px
      auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.16);
  }

  .reservation-row.selected {
    border-color: rgba(137,194,170,0.28);
    background: rgba(137,194,170,0.07);
  }

  .reservation-date,
  .reservation-person,
  .reservation-count {
    display: flex;
    flex-direction: column;
  }

  .reservation-date strong,
  .reservation-person strong,
  .reservation-count strong {
    color: ${ui.text};
    font-size: 11px;
    font-weight: 900;
  }

  .reservation-date span,
  .reservation-person span,
  .reservation-count span {
    margin-top: 3px;
    color: ${ui.faint};
    font-size: 9px;
  }

  .reservation-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .manage-button,
  .delete-button,
  .close-detail {
    min-height: 34px;
    padding: 0 10px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
  }

  .manage-button {
    border: 1px solid rgba(137,194,170,0.22);
    background: rgba(137,194,170,0.08);
    color: #d1fae5;
  }

  .delete-button {
    border: 1px solid rgba(251,113,133,0.20);
    background: rgba(251,113,133,0.06);
    color: #fecdd3;
  }

  .empty {
    margin-top: 14px;
    padding: 16px;
    border-radius: 15px;
    border: 1px dashed ${ui.borderStrong};
    background: rgba(255,255,255,0.02);
    color: ${ui.muted};
    font-size: 10px;
  }

  .detail-card {
    scroll-margin-top: 18px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .detail-header p {
    margin: 6px 0 0;
    color: ${ui.muted};
    font-size: 10px;
  }

  .detail-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .capacity {
    padding: 9px 12px;
    border-radius: 13px;
    border: 1px solid rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.07);
    color: ${ui.muted};
    font-size: 10px;
  }

  .capacity strong {
    color: #d1fae5;
    font-size: 17px;
  }

  .capacity.full {
    border-color: rgba(251,191,36,0.24);
    background: rgba(251,191,36,0.07);
  }

  .close-detail {
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.035);
    color: ${ui.muted};
  }

  .detail-info {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 9px;
    margin-top: 16px;
  }

  .detail-info > div {
    padding: 11px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.14);
  }

  .detail-info span {
    display: block;
    color: ${ui.faint};
    font-size: 8px;
  }

  .detail-info strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: ${ui.text};
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0,1.15fr) minmax(300px,0.85fr);
    gap: 12px;
    margin-top: 14px;
  }

  .participants-card,
  .add-card {
    padding: 17px;
    border-radius: 20px;
  }

  .participants-list {
    display: grid;
    gap: 7px;
    margin-top: 14px;
  }

  .participant-row {
    display: grid;
    grid-template-columns: 32px minmax(0,1fr) auto;
    align-items: center;
    gap: 9px;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.16);
  }

  .participant-row.owner {
    border-color: rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.06);
  }

  .participant-number {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: rgba(255,255,255,0.05);
    color: ${ui.muted};
    font-size: 9px;
    font-weight: 900;
  }

  .participant-name {
    min-width: 0;
  }

  .participant-name > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .participant-name strong {
    color: ${ui.text};
    font-size: 10px;
  }

  .participant-name > span {
    display: block;
    margin-top: 3px;
    color: ${ui.muted};
    font-size: 8px;
  }

  .participant-name small {
    display: block;
    margin-top: 4px;
    color: ${ui.faint};
    font-size: 8px;
  }

  .participant-name small strong {
    font-size: inherit;
  }

  .owner-badge {
    padding: 3px 6px;
    border-radius: 999px;
    background: rgba(137,194,170,0.09);
    color: #d1fae5;
    font-size: 7px;
    font-weight: 900;
  }

  .remove-student {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border-radius: 9px;
    border: 1px solid rgba(251,113,133,0.18);
    background: rgba(251,113,133,0.05);
    color: #fda4af;
    font-size: 17px;
    cursor: pointer;
  }

  .add-card > p {
    margin: 8px 0 0;
    color: ${ui.muted};
    font-size: 10px;
    line-height: 1.55;
  }

  .student-search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 0 11px;
    border-radius: 12px;
    border: 1px solid ${ui.borderStrong};
    background: rgba(0,0,0,0.22);
  }

  .student-search input {
    width: 100%;
    min-width: 0;
    padding: 11px 0;
    border: 0;
    outline: none;
    background: transparent;
    color: ${ui.text};
    font-size: 10px;
  }

  .search-status {
    margin-top: 9px;
    color: ${ui.faint};
    font-size: 9px;
  }

  .student-results {
    display: grid;
    gap: 6px;
    margin-top: 9px;
  }

  .student-results button {
    display: grid;
    grid-template-columns: 32px minmax(0,1fr) auto;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 9px;
    border-radius: 13px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.03);
    color: ${ui.text};
    text-align: left;
    cursor: pointer;
  }

  .student-avatar {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border-radius: 10px;
    background:
      linear-gradient(
        135deg,
        rgba(37,89,113,0.75),
        rgba(75,142,141,0.75)
      );
    color: white;
    font-size: 10px;
    font-weight: 950;
  }

  .student-results button > div:nth-child(2) {
    display: flex;
    flex-direction: column;
  }

  .student-results strong {
    color: ${ui.text};
    font-size: 9px;
  }

  .student-results button > div:nth-child(2) span {
    margin-top: 2px;
    color: ${ui.faint};
    font-size: 8px;
  }

  .plus {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border-radius: 9px;
    background: rgba(137,194,170,0.09);
    color: #d1fae5;
    font-size: 16px;
  }

  .audit-info {
    display: flex;
    gap: 8px;
    margin-top: 13px;
    padding: 10px;
    border-radius: 13px;
    background: rgba(96,165,250,0.05);
    border: 1px solid rgba(96,165,250,0.14);
  }

  .audit-info p {
    margin: 0;
    color: ${ui.muted};
    font-size: 8px;
    line-height: 1.5;
  }

  .full-message {
    margin-top: 14px;
    padding: 12px;
    border-radius: 13px;
    border: 1px solid rgba(251,191,36,0.18);
    background: rgba(251,191,36,0.06);
    color: #fde68a;
    font-size: 9px;
    font-weight: 850;
  }

  @media (max-width: 1050px) {
    .kpi-grid,
    .insight-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .reservation-row {
      grid-template-columns: 1fr 1fr;
    }

    .reservation-actions {
      justify-content: flex-start;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .fitness-admin {
      padding-left: 12px;
      padding-right: 12px;
    }

    .period-top {
      align-items: stretch;
      flex-direction: column;
    }

    .period-types {
      width: 100%;
    }

    .period-types button {
      flex: 1;
    }

    .period-navigation {
      display: grid;
      grid-template-columns: repeat(3,1fr);
    }

    .kpi-grid,
    .insight-grid,
    .ranking-grid {
      grid-template-columns: 1fr;
    }

    .filters {
      grid-template-columns: 1fr;
    }

    .reservation-row {
      grid-template-columns: 1fr;
    }

    .reservation-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .detail-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .detail-info {
      grid-template-columns: 1fr 1fr;
    }

    .month-chart {
      overflow-x: auto;
      grid-template-columns: repeat(12,50px);
      padding-bottom: 6px;
    }
  }

  @media (max-width: 480px) {
    .detail-info {
      grid-template-columns: 1fr;
    }

    .kpi-card strong {
      font-size: 27px;
    }
  }
`;