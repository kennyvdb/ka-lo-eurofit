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
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
};

type FitnessReservatie = {
  id: string;
  user_id: string;
  datum: string;
  slot_key: string;
  reserveerder_naam?: string | null;
  created_at?: string | null;
};

type FitnessBeschikbaarheid = {
  id: string;
  datum: string;
  slot_key: string;
  is_mine: boolean;
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
  duurMin: number;
  groep: string;
  vooruur?: boolean;
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
    duurMin: 50,
    groep: "Vooruur",
    vooruur: true,
  },
  {
    key: "08:55-09:45",
    label: "08:55 – 09:45",
    start: "08:55",
    end: "09:45",
    duurMin: 50,
    groep: "Voormiddag",
  },
  {
    key: "09:45-10:35",
    label: "09:45 – 10:35",
    start: "09:45",
    end: "10:35",
    duurMin: 50,
    groep: "Voormiddag",
  },
  {
    key: "10:50-11:40",
    label: "10:50 – 11:40",
    start: "10:50",
    end: "11:40",
    duurMin: 50,
    groep: "Voormiddag",
  },
  {
    key: "11:40-12:30",
    label: "11:40 – 12:30",
    start: "11:40",
    end: "12:30",
    duurMin: 50,
    groep: "Voormiddag",
  },
  {
    key: "13:20-14:10",
    label: "13:20 – 14:10",
    start: "13:20",
    end: "14:10",
    duurMin: 50,
    groep: "Namiddag",
  },
  {
    key: "14:10-15:00",
    label: "14:10 – 15:00",
    start: "14:10",
    end: "15:00",
    duurMin: 50,
    groep: "Namiddag",
  },
  {
    key: "15:10-16:00",
    label: "15:10 – 16:00",
    start: "15:10",
    end: "16:00",
    duurMin: 50,
    groep: "Namiddag",
  },
];

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  faint: "rgba(234,240,255,0.55)",
  border: "rgba(148,163,184,0.18)",
  borderStrong: "rgba(148,163,184,0.28)",
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

function toLocalDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);

  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);

  next.setDate(next.getDate() + days);

  return next;
}

function formatDateHuman(dateStr: string) {
  const d = parseLocalDate(dateStr);

  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(d);
}

function isWithinBookingWindow(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const max = addDays(today, 7);
  max.setHours(23, 59, 59, 999);

  const selected = parseLocalDate(dateStr);
  selected.setHours(12, 0, 0, 0);

  return selected >= today && selected <= max;
}

function isThirdGrade(klasNaam?: string | null) {
  if (!klasNaam) return false;

  const value = klasNaam.trim().toLowerCase();

  if (value.includes("3e graad")) return true;
  if (value.includes("derde graad")) return true;

  return /^[567]/.test(value);
}

function getSlot(slotKey: string) {
  return SLOTS.find((slot) => slot.key === slotKey) ?? null;
}

function isSlotStarted(dateStr: string, slot: Slot) {
  const todayStr = toLocalDateInputValue(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [hours, minutes] = slot.start.split(":").map(Number);

  const start = new Date();
  start.setHours(hours, minutes, 0, 0);

  return new Date() >= start;
}

function isSlotEnded(dateStr: string, slot: Slot) {
  const todayStr = toLocalDateInputValue(new Date());

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [hours, minutes] = slot.end.split(":").map(Number);

  const end = new Date();
  end.setHours(hours, minutes, 0, 0);

  return new Date() >= end;
}

function getReadableRpcError(message: string) {
  if (message.includes("FITNESS_VOLZET")) {
    return "De fitnessgroep is volzet. Er kunnen maximaal 12 leerlingen deelnemen.";
  }

  if (message.includes("GEEN_TOEGANG_TOT_TIJDSTIP")) {
    return "Je hebt geen toegang om dit fitnessmoment te reserveren.";
  }

  if (message.includes("GEEN_TOEGANG")) {
    return "Je hebt geen toestemming om deze reservatie aan te passen.";
  }

  if (message.includes("TIJDSLOT_REEDS_BEZET")) {
    return "Dit tijdslot is net door iemand anders gereserveerd.";
  }

  if (message.includes("TIJDSLOT_REEDS_GESTART")) {
    return "Dit fitnessmoment is al gestart of voorbij.";
  }

  if (message.includes("RESERVATIE_REEDS_GESTART")) {
    return "Deze reservatie is al gestart en kan niet meer geannuleerd worden.";
  }

  if (message.includes("RESERVATIE_NIET_GEVONDEN")) {
    return "Deze reservatie bestaat niet meer.";
  }

  if (message.includes("DATUM_IN_VERLEDEN")) {
    return "Je kan niet reserveren op een datum in het verleden.";
  }

  if (message.includes("DATUM_TE_VER")) {
    return "Je kan maximaal 7 dagen op voorhand reserveren.";
  }

  if (message.includes("ONGELDIG_TIJDSTIP")) {
    return "Dit is geen geldig fitnessmoment.";
  }

  if (message.includes("LEERLING_NIET_GEVONDEN")) {
    return "Deze leerling kon niet gevonden worden.";
  }

  if (message.includes("ALLEEN_LEERLINGEN_TOEGESTAAN")) {
    return "Alleen leerlingen kunnen toegevoegd worden.";
  }

  if (message.includes("RESERVATIE_VERSTREKEN")) {
    return "Dit fitnessmoment is afgelopen. De deelnemerslijst kan niet meer aangepast worden.";
  }

  if (
    message.includes(
      "RESERVATIEHOUDER_KAN_NIET_VERWIJDERD_WORDEN"
    )
  ) {
    return "De leerling die de reservatie maakte kan niet uit zijn eigen groep verwijderd worden.";
  }

  if (message.includes("NIET_INGELOGD")) {
    return "Je bent niet meer ingelogd. Meld je opnieuw aan.";
  }

  return message;
}

/* =========================================================
   PAGE
========================================================= */

export default function FitnessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateInputValue(new Date())
  );

  const [dayReservations, setDayReservations] = useState<
    FitnessBeschikbaarheid[]
  >([]);

  const [myUpcomingReservations, setMyUpcomingReservations] = useState<
    FitnessReservatie[]
  >([]);

  const [activeReservation, setActiveReservation] =
    useState<FitnessReservatie | null>(null);

  const [aanwezigen, setAanwezigen] = useState<FitnessAanwezige[]>([]);
  const [loadingAanwezigen, setLoadingAanwezigen] = useState(false);

  const [zoekterm, setZoekterm] = useState("");
  const [zoekResultaten, setZoekResultaten] = useState<ZoekLeerling[]>([]);
  const [zoeken, setZoeken] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* =========================================================
     DATUMBEREIK
  ========================================================= */

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    return d;
  }, []);

  const minDate = useMemo(
    () => toLocalDateInputValue(today),
    [today]
  );

  const maxDate = useMemo(
    () => toLocalDateInputValue(addDays(today, 7)),
    [today]
  );

  /* =========================================================
     PROFIEL
  ========================================================= */

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select(
        "id, volledige_naam, role, rol, klas_naam"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as Profiel) ?? null;
  }, []);

  /* =========================================================
     ROLLEN
  ========================================================= */

  const normalizedRole = normalizeRole(
    profiel?.rol || profiel?.role
  );

  const isLoStaff =
    normalizedRole === "lo_leerkracht" ||
    normalizedRole === "leerkracht_lo" ||
    normalizedRole === "admin";

  const isTeacher =
    normalizedRole === "leerkracht" ||
    normalizedRole === "teacher" ||
    isLoStaff;

  const isStudent =
    normalizedRole === "leerling" ||
    normalizedRole === "student";

  const thirdGradeOk =
    isThirdGrade(profiel?.klas_naam);

  function canReserveSlot(slot: Slot) {
    if (isTeacher) {
      return true;
    }

    if (!isStudent) {
      return false;
    }

    if (slot.vooruur) {
      return true;
    }

    return thirdGradeOk;
  }

  /* =========================================================
     RESERVATIES LADEN
  ========================================================= */

  const loadReservations = useCallback(
    async (dateStr: string) => {
      const [
        {
          data: dayData,
          error: dayError,
        },
        {
          data: upcomingData,
          error: upcomingError,
        },
      ] = await Promise.all([
        supabase.rpc(
          "fitness_get_beschikbaarheid",
          {
            p_datum: dateStr,
          }
        ),

        supabase.rpc(
          "fitness_get_mijn_reservaties",
          {
            p_vanaf: minDate,
            p_tot: maxDate,
          }
        ),
      ]);

      if (dayError) {
        throw new Error(dayError.message);
      }

      if (upcomingError) {
        throw new Error(upcomingError.message);
      }

      const day =
        (dayData as FitnessBeschikbaarheid[]) ??
        [];

      const upcoming =
        (upcomingData as FitnessReservatie[]) ??
        [];

      setDayReservations(day);

      setMyUpcomingReservations(
        upcoming
      );

      setActiveReservation(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            upcoming.find(
              (item) =>
                item.id === current.id
            ) ?? null
          );
        }
      );
    },
    [minDate, maxDate]
  );

  /* =========================================================
     AANWEZIGEN
  ========================================================= */

  const loadAanwezigen = useCallback(
    async (reservationId: string) => {
      try {
        setLoadingAanwezigen(true);

        const {
          data,
          error,
        } = await supabase.rpc(
          "fitness_get_aanwezigen",
          {
            p_reservatie_id:
              reservationId,
          }
        );

        if (error) {
          throw new Error(
            error.message
          );
        }

        setAanwezigen(
          (data as FitnessAanwezige[]) ??
            []
        );
      } catch (e: any) {
        setAanwezigen([]);

        setError(
          getReadableRpcError(
            e?.message ??
              "Kon de deelnemers niet ophalen."
          )
        );
      } finally {
        setLoadingAanwezigen(false);
      }
    },
    []
  );

  /* =========================================================
     INIT
  ========================================================= */

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          throw new Error(
            error.message
          );
        }

        const user =
          data.session?.user ?? null;

        if (!user?.id) {
          window.location.replace(
            "/login"
          );

          return;
        }

        setUid(user.id);

        const p =
          await fetchProfile(user.id);

        setProfiel(p);

        const todayStr =
          toLocalDateInputValue(
            new Date()
          );

        setSelectedDate(todayStr);

        await loadReservations(
          todayStr
        );
      } catch (e: any) {
        setError(
          e?.message ??
            "Er liep iets mis bij het laden van de fitnessreservaties."
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    fetchProfile,
    loadReservations,
  ]);

  /* =========================================================
     DATUM WIJZIGT
  ========================================================= */

  useEffect(() => {
    if (!uid || !selectedDate) {
      return;
    }

    const run = async () => {
      try {
        setError(null);

        await loadReservations(
          selectedDate
        );
      } catch (e: any) {
        setError(
          getReadableRpcError(
            e?.message ??
              "Kon de fitnessreservaties niet ophalen."
          )
        );
      }
    };

    run();
  }, [
    uid,
    selectedDate,
    loadReservations,
  ]);

  /* =========================================================
     ACTIEVE RESERVATIE
  ========================================================= */

  useEffect(() => {
    if (!activeReservation?.id) {
      setAanwezigen([]);
      setZoekterm("");
      setZoekResultaten([]);

      return;
    }

    loadAanwezigen(
      activeReservation.id
    );
  }, [
    activeReservation?.id,
    loadAanwezigen,
  ]);

  /* =========================================================
     LEERLING ZOEKEN
  ========================================================= */

  useEffect(() => {
    if (!activeReservation?.id) {
      setZoekResultaten([]);

      return;
    }

    const trimmed =
      zoekterm.trim();

    if (trimmed.length < 2) {
      setZoekResultaten([]);

      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          try {
            setZoeken(true);

            const {
              data,
              error,
            } =
              await supabase.rpc(
                "fitness_zoek_leerlingen",
                {
                  p_reservatie_id:
                    activeReservation.id,
                  p_zoekterm:
                    trimmed,
                }
              );

            if (error) {
              throw new Error(
                error.message
              );
            }

            const rows =
              (
                (data as ZoekLeerling[]) ??
                []
              ).filter(
                (student) =>
                  !aanwezigen.some(
                    (aanwezige) =>
                      aanwezige.leerling_id ===
                      student.id
                  )
              );

            setZoekResultaten(
              rows
            );
          } catch (e: any) {
            setZoekResultaten(
              []
            );

            setError(
              getReadableRpcError(
                e?.message ??
                  "Zoeken naar leerlingen mislukt."
              )
            );
          } finally {
            setZoeken(false);
          }
        },
        300
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    zoekterm,
    activeReservation?.id,
    aanwezigen,
  ]);

  /* =========================================================
     BEREKENDE WAARDEN
  ========================================================= */

  const greetingName =
    profiel?.volledige_naam
      ?.split(" ")
      ?.[0] ?? "Welkom";

  const shownRoleLabel =
    isTeacher
      ? "Leerkracht"
      : "Leerling";

  const bookingWindowOk =
    isWithinBookingWindow(
      selectedDate
    );

  const reservationsMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          FitnessBeschikbaarheid
        >();

      for (const reservation of dayReservations) {
        map.set(
          reservation.slot_key,
          reservation
        );
      }

      return map;
    }, [dayReservations]);

  const groupedSlots =
    useMemo(() => {
      const groups =
        new Map<
          string,
          Slot[]
        >();

      for (const slot of SLOTS) {
        const rows =
          groups.get(
            slot.groep
          ) ?? [];

        rows.push(slot);

        groups.set(
          slot.groep,
          rows
        );
      }

      return Array.from(
        groups.entries()
      );
    }, []);

  const upcomingByDate =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          FitnessReservatie[]
        >();

      for (const reservation of myUpcomingReservations) {
        const rows =
          grouped.get(
            reservation.datum
          ) ?? [];

        rows.push(reservation);

        grouped.set(
          reservation.datum,
          rows
        );
      }

      return Array.from(
        grouped.entries()
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );
    }, [
      myUpcomingReservations,
    ]);

  const activeSlot =
    activeReservation
      ? getSlot(
          activeReservation.slot_key
        )
      : null;

  const activeStarted =
    activeReservation &&
    activeSlot
      ? isSlotStarted(
          activeReservation.datum,
          activeSlot
        )
      : false;

  const activeEnded =
    activeReservation &&
    activeSlot
      ? isSlotEnded(
          activeReservation.datum,
          activeSlot
        )
      : false;

  const groupLocked =
    activeEnded &&
    !isLoStaff;

  const groepVol =
    aanwezigen.length >=
    MAX_AANWEZIGEN;

  /* =========================================================
     RESERVEREN
  ========================================================= */

  const handleBook =
    async (slot: Slot) => {
      if (!uid) {
        return;
      }

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (!canReserveSlot(slot)) {
          if (
            isStudent &&
            !slot.vooruur &&
            !thirdGradeOk
          ) {
            throw new Error(
              "Buiten het vooruur kunnen alleen leerlingen van de 3e graad reserveren."
            );
          }

          throw new Error(
            "Je hebt geen toegang om dit fitnessmoment te reserveren."
          );
        }

        if (!bookingWindowOk) {
          throw new Error(
            "Je kan alleen reserveren vanaf vandaag tot maximaal 7 dagen op voorhand."
          );
        }

        if (
          isSlotStarted(
            selectedDate,
            slot
          )
        ) {
          throw new Error(
            "Dit fitnessmoment is al gestart of voorbij."
          );
        }

        if (
          reservationsMap.get(
            slot.key
          )
        ) {
          throw new Error(
            "Dit tijdslot is net door iemand anders gereserveerd."
          );
        }

        const {
          data:
            reservationId,
          error:
            reserveError,
        } =
          await supabase.rpc(
            "fitness_reserveer",
            {
              p_datum:
                selectedDate,
              p_slot_key:
                slot.key,
            }
          );

        if (reserveError) {
          throw new Error(
            reserveError.message
          );
        }

        if (!reservationId) {
          throw new Error(
            "De reservatie werd niet correct aangemaakt."
          );
        }

        await loadReservations(
          selectedDate
        );

        const reservation: FitnessReservatie =
          {
            id: reservationId as string,
            user_id: uid,
            datum:
              selectedDate,
            slot_key:
              slot.key,
          };

        setActiveReservation(
          reservation
        );

        await loadAanwezigen(
          reservation.id
        );

        setSuccess(
          `Reservatie bevestigd: ${formatDateHuman(
            selectedDate
          )} om ${slot.label}.`
        );
      } catch (e: any) {
        setError(
          getReadableRpcError(
            e?.message ??
              "Reservatie mislukt."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     ANNULEREN
  ========================================================= */

  const handleCancel =
    async (
      reservation: FitnessReservatie
    ) => {
      if (!uid) {
        return;
      }

      const slot =
        getSlot(
          reservation.slot_key
        );

      if (
        isStudent &&
        slot &&
        isSlotStarted(
          reservation.datum,
          slot
        )
      ) {
        setError(
          "Een reservatie die al gestart is kan niet meer door een leerling geannuleerd worden."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Wil je deze fitnessreservatie annuleren? Alle geregistreerde deelnemers van deze reservatie worden dan ook verwijderd."
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const {
          error,
        } =
          await supabase.rpc(
            "fitness_annuleer",
            {
              p_reservatie_id:
                reservation.id,
            }
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        if (
          activeReservation?.id ===
          reservation.id
        ) {
          setActiveReservation(
            null
          );

          setAanwezigen(
            []
          );
        }

        await loadReservations(
          selectedDate
        );

        setSuccess(
          "Je fitnessreservatie werd geannuleerd."
        );
      } catch (e: any) {
        setError(
          getReadableRpcError(
            e?.message ??
              "Annuleren mislukt."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     GROEP OPENEN
  ========================================================= */

  const handleManageReservation =
    (
      reservation: FitnessReservatie
    ) => {
      setError(null);
      setSuccess(null);

      setZoekterm("");
      setZoekResultaten([]);

      setActiveReservation(
        reservation
      );

      window.setTimeout(
        () => {
          document
            .getElementById(
              "fitness-groep-beheren"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block: "start",
            });
        },
        50
      );
    };

  /* =========================================================
     LEERLING TOEVOEGEN
  ========================================================= */

  const handleAddStudent =
    async (
      student: ZoekLeerling
    ) => {
      if (!activeReservation) {
        return;
      }

      if (groepVol) {
        setError(
          "De fitnessgroep is volzet. Er kunnen maximaal 12 leerlingen deelnemen."
        );

        return;
      }

      if (groupLocked) {
        setError(
          "Dit fitnessmoment is afgelopen. De deelnemerslijst kan niet meer aangepast worden."
        );

        return;
      }

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const {
          error,
        } =
          await supabase.rpc(
            "fitness_voeg_leerling_toe",
            {
              p_reservatie_id:
                activeReservation.id,

              p_leerling_id:
                student.id,
            }
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        await loadAanwezigen(
          activeReservation.id
        );

        setZoekterm("");
        setZoekResultaten([]);

        setSuccess(
          `${
            student.volledige_naam ??
            "Leerling"
          } werd toegevoegd aan de fitnessgroep.`
        );
      } catch (e: any) {
        setError(
          getReadableRpcError(
            e?.message ??
              "Leerling toevoegen mislukt."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     LEERLING VERWIJDEREN
  ========================================================= */

  const handleRemoveStudent =
    async (
      aanwezige: FitnessAanwezige
    ) => {
      if (!activeReservation) {
        return;
      }

      if (
        aanwezige.is_reservatiehouder
      ) {
        return;
      }

      if (groupLocked) {
        setError(
          "Dit fitnessmoment is afgelopen. De deelnemerslijst kan niet meer aangepast worden."
        );

        return;
      }

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const {
          error,
        } =
          await supabase.rpc(
            "fitness_verwijder_leerling",
            {
              p_reservatie_id:
                activeReservation.id,

              p_leerling_id:
                aanwezige.leerling_id,
            }
          );

        if (error) {
          throw new Error(
            error.message
          );
        }

        await loadAanwezigen(
          activeReservation.id
        );

        setSuccess(
          `${
            aanwezige.volledige_naam ??
            "Leerling"
          } werd uit de fitnessgroep verwijderd.`
        );
      } catch (e: any) {
        setError(
          getReadableRpcError(
            e?.message ??
              "Leerling verwijderen mislukt."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div
          style={{
            color: ui.text,
            fontWeight: 850,
          }}
        >
          Fitnessreservaties laden…
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
      subtitle="Fitness"
      userName={
        profiel?.volledige_naam ??
        null
      }
    >
      <style>{css}</style>

      <BaseHero
        label="FITNESS"
        title={
          <>
            Reserveer je
            fitnessmoment,
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {" "}
              {greetingName}
            </span>{" "}
            🏋️
          </>
        }
        description={
          <>
            {shownRoleLabel}

            {profiel?.klas_naam ? (
              <span className="opacity-85">
                {" "}
                •{" "}
                {
                  profiel.klas_naam
                }
              </span>
            ) : null}

            <span className="opacity-85">
              {" "}
              •{" "}
            </span>

            Reserveer een
            fitnessmoment en
            registreer wie samen
            met jou traint.
          </>
        }
        imageSrc="/reservaties/reservaties-fitness.png"
        imageAlt="Fitness illustratie"
        quoteTitle="Samen trainen"
        quote="Wie reserveert, registreert ook correct wie mee traint."
        quoteAuthor="LO Team"
        imageClassName="scale-105 md:scale-[1.08] transition-transform duration-500"
        actions={
          <Link
            href="/reservaties"
            className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45"
          >
            Terug naar reservaties
          </Link>
        }
      />

      <main className="fitness-page">
        {/* ===================================================
            INFO
        =================================================== */}

        <section className="top-grid">
          <div className="info-card">
            <span className="eyebrow">
              RESERVATIEDATUM
            </span>

            <h2>
              Kies een datum
            </h2>

            <p>
              Je kan reserveren
              vanaf vandaag tot
              maximaal 7 dagen
              vooruit.
            </p>

            <input
              type="date"
              value={
                selectedDate
              }
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                setSelectedDate(
                  e.target.value
                );

                setSuccess(null);
                setError(null);
              }}
            />

            <div className="chips">
              <span>
                Vandaag{" "}
                {formatDateHuman(
                  minDate
                )}
              </span>

              <span>
                Max.{" "}
                {formatDateHuman(
                  maxDate
                )}
              </span>
            </div>
          </div>

          <div className="info-card access-card">
            <span className="eyebrow">
              TOEGANG
            </span>

            <h2>
              Wie kan reserveren?
            </h2>

            <div className="rules-list">
              <div>
                <span className="rule-ok">
                  ✓
                </span>

                <p>
                  <strong>
                    Alle leerlingen
                  </strong>

                  <small>
                    Vooruur
                    08:05 – 08:55
                  </small>
                </p>
              </div>

              <div>
                <span className="rule-ok">
                  ✓
                </span>

                <p>
                  <strong>
                    3e graad
                  </strong>

                  <small>
                    Alle
                    fitnessuren
                  </small>
                </p>
              </div>

              <div>
                <span className="rule-ok">
                  ✓
                </span>

                <p>
                  <strong>
                    Leerkrachten
                  </strong>

                  <small>
                    Alle
                    fitnessuren
                  </small>
                </p>
              </div>
            </div>
          </div>

          <div className="info-card">
            <span className="eyebrow">
              GROEPSRESERVATIE
            </span>

            <h2>
              Max. 12 leerlingen
            </h2>

            <p>
              Een leerling die
              reserveert wordt
              automatisch als
              deelnemer
              geregistreerd. Een
              leerkracht telt zelf
              niet mee bij de 12
              leerlingen.
            </p>

            <div className="capacity-explanation">
              <strong>
                maximaal 12
                leerlingen
              </strong>
            </div>
          </div>
        </section>

        {/* ===================================================
            MELDINGEN
        =================================================== */}

        {error && (
          <div className="message error">
            <span>!</span>

            <div>
              <strong>
                Oeps
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="message success">
            <span>✓</span>

            <div>
              <strong>
                Gelukt
              </strong>

              <p>
                {success}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            RESERVATIES
        =================================================== */}

        <section className="reservation-layout">
          <div className="main-card">
            <div className="section-header">
              <div>
                <span className="eyebrow">
                  BESCHIKBAARHEID
                </span>

                <h2>
                  {formatDateHuman(
                    selectedDate
                  )}
                </h2>
              </div>

              <p>
                Kies een vrij
                tijdslot.
              </p>
            </div>

            <div className="slot-groups">
              {groupedSlots.map(
                ([
                  groupName,
                  slots,
                ]) => (
                  <div
                    key={
                      groupName
                    }
                    className="slot-group"
                  >
                    <div className="slot-group-title">
                      {
                        groupName
                      }
                    </div>

                    {slots.map(
                      (slot) => {
                        const reservation =
                          reservationsMap.get(
                            slot.key
                          );

                        const isMine =
                          reservation?.is_mine ===
                          true;

                        const myReservation =
                          isMine
                            ? myUpcomingReservations.find(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  reservation?.id
                              ) ??
                              null
                            : null;

                        const started =
                          isSlotStarted(
                            selectedDate,
                            slot
                          );

                        const allowed =
                          canReserveSlot(
                            slot
                          );

                        return (
                          <div
                            key={
                              slot.key
                            }
                            className="slot-row"
                          >
                            <div className="slot-time">
                              <strong>
                                {
                                  slot.label
                                }
                              </strong>

                              <span>
                                {
                                  slot.duurMin
                                }{" "}
                                min
                              </span>
                            </div>

                            {!reservation &&
                            started ? (
                              <div className="slot-content past">
                                <div>
                                  <strong>
                                    Voorbij
                                  </strong>

                                  <p>
                                    Dit
                                    moment
                                    kan niet
                                    meer
                                    gereserveerd
                                    worden.
                                  </p>
                                </div>

                                <button
                                  disabled
                                >
                                  Voorbij
                                </button>
                              </div>
                            ) : !reservation &&
                              !allowed ? (
                              <div className="slot-content blocked">
                                <div>
                                  <strong>
                                    Niet
                                    toegankelijk
                                  </strong>

                                  <p>
                                    Buiten
                                    het
                                    vooruur
                                    is dit
                                    voorbehouden
                                    voor
                                    leerlingen
                                    van de
                                    3e graad
                                    en
                                    leerkrachten.
                                  </p>
                                </div>

                                <button
                                  disabled
                                >
                                  Niet
                                  beschikbaar
                                </button>
                              </div>
                            ) : !reservation ? (
                              <div className="slot-content free">
                                <div>
                                  <strong>
                                    Vrij
                                  </strong>

                                  <p>
                                    {slot.vooruur
                                      ? "Vooruur — alle leerlingen en leerkrachten kunnen reserveren."
                                      : "Fitnessruimte beschikbaar."}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    saving ||
                                    !bookingWindowOk
                                  }
                                  onClick={() =>
                                    handleBook(
                                      slot
                                    )
                                  }
                                  className="primary"
                                >
                                  {saving
                                    ? "Even wachten…"
                                    : "Reserveer"}
                                </button>
                              </div>
                            ) : isMine &&
                              myReservation ? (
                              <div className="slot-content mine">
                                <div>
                                  <strong>
                                    Jouw
                                    reservatie
                                  </strong>

                                  <p>
                                    Beheer
                                    wie
                                    samen
                                    met jou
                                    traint.
                                  </p>
                                </div>

                                <div className="slot-actions">
                                  <button
                                    type="button"
                                    className="primary"
                                    onClick={() =>
                                      handleManageReservation(
                                        myReservation
                                      )
                                    }
                                  >
                                    Beheer
                                    groep
                                  </button>

                                  {(!started ||
                                    isTeacher) && (
                                    <button
                                      type="button"
                                      className="danger"
                                      disabled={
                                        saving
                                      }
                                      onClick={() =>
                                        handleCancel(
                                          myReservation
                                        )
                                      }
                                    >
                                      Annuleer
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="slot-content booked">
                                <div>
                                  <strong>
                                    Bezet
                                  </strong>

                                  <p>
                                    Dit
                                    fitnessmoment
                                    is
                                    reeds
                                    gereserveerd.
                                  </p>
                                </div>

                                <button
                                  disabled
                                >
                                  Niet
                                  beschikbaar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* =================================================
              KOMENDE RESERVATIES
          ================================================= */}

          <aside className="side-card">
            <span className="eyebrow">
              JOUW RESERVATIES
            </span>

            <h2>
              Komende boekingen
            </h2>

            {upcomingByDate.length ===
            0 ? (
              <div className="empty">
                Je hebt momenteel
                geen komende
                fitnessreservaties.
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingByDate.map(
                  ([
                    date,
                    reservations,
                  ]) => (
                    <div
                      key={date}
                      className="upcoming-group"
                    >
                      <strong className="upcoming-date">
                        {formatDateHuman(
                          date
                        )}
                      </strong>

                      {reservations.map(
                        (
                          reservation
                        ) => {
                          const slot =
                            getSlot(
                              reservation.slot_key
                            );

                          const started =
                            slot
                              ? isSlotStarted(
                                  reservation.datum,
                                  slot
                                )
                              : false;

                          return (
                            <div
                              key={
                                reservation.id
                              }
                              className="upcoming-item"
                            >
                              <div>
                                <strong>
                                  {slot?.label ??
                                    reservation.slot_key}
                                </strong>

                                <span>
                                  Fitnessruimte
                                </span>
                              </div>

                              <div className="upcoming-actions">
                                <button
                                  type="button"
                                  className="manage-small"
                                  onClick={() =>
                                    handleManageReservation(
                                      reservation
                                    )
                                  }
                                >
                                  Groep
                                </button>

                                {(!started ||
                                  isTeacher) && (
                                  <button
                                    type="button"
                                    className="cancel-small"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      handleCancel(
                                        reservation
                                      )
                                    }
                                  >
                                    Annuleer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </aside>
        </section>

        {/* ===================================================
            GROEPSBEHEER
        =================================================== */}

        {activeReservation && (
          <section
            id="fitness-groep-beheren"
            className="group-section"
          >
            <div className="group-header">
              <div>
                <span className="eyebrow">
                  DEELNEMERS
                </span>

                <h2>
                  Fitnessgroep
                  beheren
                </h2>

                <p>
                  {formatDateHuman(
                    activeReservation.datum
                  )}{" "}
                  •{" "}
                  {activeSlot?.label ??
                    activeReservation.slot_key}
                </p>
              </div>

              <div
                className={`capacity-badge ${
                  groepVol
                    ? "full"
                    : ""
                }`}
              >
                <strong>
                  {
                    aanwezigen.length
                  }
                </strong>

                <span>
                  /{" "}
                  {
                    MAX_AANWEZIGEN
                  }
                </span>
              </div>
            </div>

            {/* ===============================================
                INFO
            =============================================== */}

            <div className="registration-notice">
              <span>ℹ️</span>

              <div>
                <strong>
                  Registreer alleen
                  leerlingen die
                  effectief mee
                  trainen.
                </strong>

                <p>
                  Elke toevoeging
                  wordt geregistreerd.
                  LO-leerkrachten
                  kunnen zien wie
                  iedere leerling
                  heeft toegevoegd.
                </p>
              </div>
            </div>

            {/* ===============================================
                TIJDENS HET UUR
            =============================================== */}

            {activeStarted &&
              !activeEnded && (
                <div className="active-notice">
                  <span>
                    🏋️
                  </span>

                  <div>
                    <strong>
                      Fitnessmoment
                      bezig
                    </strong>

                    <p>
                      Je kan de
                      deelnemerslijst
                      nog aanpassen
                      tot{" "}
                      {
                        activeSlot?.end
                      }
                      .
                    </p>
                  </div>
                </div>
              )}

            {/* ===============================================
                AFGELOPEN
            =============================================== */}

            {groupLocked && (
              <div className="locked-notice">
                <span>🔒</span>

                <div>
                  <strong>
                    De
                    deelnemerslijst
                    is afgesloten.
                  </strong>

                  <p>
                    Het
                    fitnessmoment is
                    afgelopen. Alleen
                    een
                    LO-leerkracht of
                    administrator kan
                    nog correcties
                    uitvoeren.
                  </p>
                </div>
              </div>
            )}

            <div className="group-grid">
              {/* =============================================
                  AANWEZIGEN
              ============================================= */}

              <div className="participants-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">
                      AANWEZIGEN
                    </span>

                    <h3>
                      {
                        aanwezigen.length
                      }{" "}
                      van{" "}
                      {
                        MAX_AANWEZIGEN
                      }
                    </h3>
                  </div>

                  {groepVol && (
                    <span className="full-chip">
                      VOLZET
                    </span>
                  )}
                </div>

                {loadingAanwezigen ? (
                  <div className="empty">
                    Deelnemers
                    laden…
                  </div>
                ) : aanwezigen.length ===
                  0 ? (
                  <div className="empty">
                    Nog geen
                    leerlingen
                    geregistreerd.
                  </div>
                ) : (
                  <div className="participant-list">
                    {aanwezigen.map(
                      (
                        aanwezige,
                        index
                      ) => (
                        <div
                          key={
                            aanwezige.aanwezigheid_id
                          }
                          className={`participant ${
                            aanwezige.is_reservatiehouder
                              ? "owner"
                              : ""
                          }`}
                        >
                          <div className="participant-number">
                            {index +
                              1}
                          </div>

                          <div className="participant-copy">
                            <div className="participant-name-row">
                              <strong>
                                {aanwezige.volledige_naam ??
                                  "Leerling"}
                              </strong>

                              {aanwezige.is_reservatiehouder && (
                                <span className="owner-chip">
                                  Reservatiehouder
                                </span>
                              )}
                            </div>

                            <span>
                              {aanwezige.klas_naam ??
                                "Klas onbekend"}
                            </span>

                            <small>
                              Toegevoegd
                              door{" "}
                              {aanwezige.toegevoegd_door_naam ??
                                "onbekend"}
                            </small>
                          </div>

                          {!aanwezige.is_reservatiehouder &&
                            !groupLocked && (
                              <button
                                type="button"
                                className="remove-button"
                                disabled={
                                  saving
                                }
                                onClick={() =>
                                  handleRemoveStudent(
                                    aanwezige
                                  )
                                }
                                aria-label="Leerling verwijderen"
                              >
                                ×
                              </button>
                            )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* =============================================
                  LEERLING TOEVOEGEN
              ============================================= */}

              <div className="search-card">
                <span className="eyebrow">
                  LEERLING
                  TOEVOEGEN
                </span>

                <h3>
                  Zoek een leerling
                </h3>

                <p>
                  Typ minstens twee
                  letters van de
                  naam. Alleen
                  bestaande
                  leerlingen uit het
                  schoolsysteem
                  kunnen toegevoegd
                  worden.
                </p>

                <div className="search-wrap">
                  <span>⌕</span>

                  <input
                    type="text"
                    value={
                      zoekterm
                    }
                    disabled={
                      groepVol ||
                      groupLocked ||
                      saving
                    }
                    placeholder={
                      groepVol
                        ? "Fitnessgroep volzet"
                        : groupLocked
                          ? "Deelnemerslijst afgesloten"
                          : "Naam leerling…"
                    }
                    onChange={(
                      e
                    ) => {
                      setError(
                        null
                      );

                      setZoekterm(
                        e.target
                          .value
                      );
                    }}
                  />
                </div>

                {zoeken && (
                  <div className="search-hint">
                    Zoeken…
                  </div>
                )}

                {!zoeken &&
                  zoekterm.trim()
                    .length >=
                    2 &&
                  zoekResultaten.length ===
                    0 && (
                    <div className="search-hint">
                      Geen
                      beschikbare
                      leerlingen
                      gevonden.
                    </div>
                  )}

                {zoekResultaten.length >
                  0 && (
                  <div className="search-results">
                    {zoekResultaten.map(
                      (
                        student
                      ) => (
                        <button
                          key={
                            student.id
                          }
                          type="button"
                          disabled={
                            saving ||
                            groepVol ||
                            groupLocked
                          }
                          onClick={() =>
                            handleAddStudent(
                              student
                            )
                          }
                          className="search-result"
                        >
                          <div className="avatar">
                            {(
                              student.volledige_naam ??
                              "?"
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {student.volledige_naam ??
                                "Leerling"}
                            </strong>

                            <span>
                              {student.klas_naam ??
                                "Klas onbekend"}
                            </span>
                          </div>

                          <span className="add-icon">
                            +
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
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

  .fitness-page {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 18px 18px 70px;
    color: ${ui.text};
  }

  .top-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .info-card,
  .main-card,
  .side-card,
  .group-section,
  .participants-card,
  .search-card {
    border: 1px solid ${ui.border};
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.065),
        rgba(255,255,255,0.035)
      );
    box-shadow: 0 14px 35px rgba(0,0,0,0.15);
    backdrop-filter: blur(14px);
  }

  .info-card {
    min-height: 220px;
    padding: 20px;
    border-radius: 24px;
  }

  .info-card h2,
  .main-card h2,
  .side-card h2,
  .group-section h2,
  .participants-card h3,
  .search-card h3 {
    margin: 6px 0 0;
    color: ${ui.text};
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .info-card h2 {
    font-size: 22px;
  }

  .info-card p,
  .search-card p {
    margin: 10px 0 0;
    color: ${ui.muted};
    font-size: 13px;
    line-height: 1.6;
  }

  .eyebrow {
    display: inline-block;
    color: ${ui.faint};
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.11em;
  }

  .info-card input {
    width: 100%;
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid ${ui.borderStrong};
    outline: none;
    background: rgba(0,0,0,0.28);
    color: ${ui.text};
    color-scheme: dark;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }

  .chips span {
    padding: 6px 9px;
    border-radius: 999px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.04);
    color: ${ui.muted};
    font-size: 11px;
    font-weight: 750;
  }

  .access-card {
    background:
      radial-gradient(
        circle at top right,
        rgba(137,194,170,0.16),
        transparent 50%
      ),
      linear-gradient(
        180deg,
        rgba(75,142,141,0.12),
        rgba(255,255,255,0.035)
      );
  }

  .rules-list {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .rules-list > div {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.16);
  }

  .rules-list p {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .rules-list strong {
    color: ${ui.text};
    font-size: 12px;
  }

  .rules-list small {
    margin-top: 2px;
    color: ${ui.faint};
    font-size: 10px;
  }

  .rule-ok {
    display: grid;
    place-items: center;
    width: 29px;
    height: 29px;
    flex: 0 0 29px;
    border-radius: 10px;
    background: rgba(74,222,128,0.12);
    color: #86efac;
    font-weight: 950;
  }

  .capacity-explanation {
    display: flex;
    align-items: center;
    margin-top: 16px;
  }

  .capacity-explanation strong {
    padding: 7px 9px;
    border-radius: 10px;
    background: rgba(137,194,170,0.09);
    border: 1px solid rgba(137,194,170,0.15);
    color: ${ui.text};
    font-size: 12px;
  }

  .message {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-top: 14px;
    padding: 14px 16px;
    border-radius: 18px;
  }

  .message > span {
    display: grid;
    place-items: center;
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    border-radius: 10px;
    font-weight: 950;
  }

  .message strong {
    display: block;
    font-size: 13px;
  }

  .message p {
    margin: 4px 0 0;
    color: ${ui.muted};
    font-size: 12px;
    line-height: 1.5;
  }

  .message.error {
    border: 1px solid rgba(251,113,133,0.25);
    background: rgba(251,113,133,0.09);
  }

  .message.error > span {
    background: rgba(251,113,133,0.14);
    color: #fda4af;
  }

  .message.success {
    border: 1px solid rgba(74,222,128,0.24);
    background: rgba(74,222,128,0.08);
  }

  .message.success > span {
    background: rgba(74,222,128,0.13);
    color: #86efac;
  }

  .reservation-layout {
    display: grid;
    grid-template-columns:
      minmax(0, 1.55fr)
      minmax(300px, 0.75fr);
    gap: 14px;
    margin-top: 16px;
    align-items: start;
  }

  .main-card,
  .side-card {
    padding: 20px;
    border-radius: 24px;
  }

  .side-card {
    position: sticky;
    top: 14px;
  }

  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .section-header h2,
  .side-card h2 {
    font-size: 23px;
  }

  .section-header p {
    margin: 0;
    color: ${ui.muted};
    font-size: 12px;
  }

  .slot-groups {
    display: grid;
    gap: 14px;
  }

  .slot-group {
    padding: 14px;
    border-radius: 20px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.025);
  }

  .slot-group-title {
    margin-bottom: 10px;
    color: ${ui.text};
    font-size: 13px;
    font-weight: 900;
  }

  .slot-row {
    display: grid;
    grid-template-columns: 175px minmax(0, 1fr);
    gap: 10px;
    margin-top: 9px;
  }

  .slot-time {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 105px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.22);
  }

  .slot-time strong {
    color: ${ui.text};
    font-size: 13px;
  }

  .slot-time span {
    margin-top: 4px;
    color: ${ui.faint};
    font-size: 11px;
  }

  .slot-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 105px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid ${ui.border};
  }

  .slot-content strong {
    display: block;
    font-size: 13px;
    font-weight: 950;
  }

  .slot-content p {
    margin: 5px 0 0;
    color: ${ui.muted};
    font-size: 11px;
    line-height: 1.45;
  }

  .slot-content.free {
    background: rgba(74,222,128,0.07);
  }

  .slot-content.free strong {
    color: #bbf7d0;
  }

  .slot-content.mine {
    background: rgba(75,142,141,0.15);
    border-color: rgba(137,194,170,0.22);
  }

  .slot-content.mine strong {
    color: #c6f7e4;
  }

  .slot-content.booked,
  .slot-content.blocked,
  .slot-content.past {
    background: rgba(255,255,255,0.025);
  }

  .slot-content.blocked {
    opacity: 0.75;
  }

  .slot-content.past {
    opacity: 0.6;
  }

  .slot-content button {
    min-width: 125px;
    min-height: 39px;
    padding: 9px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .slot-content button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.03);
    color: ${ui.faint};
  }

  button.primary {
    border: 1px solid rgba(137,194,170,0.28);
    background:
      linear-gradient(
        180deg,
        rgba(75,142,141,0.88),
        rgba(37,89,113,0.94)
      );
    color: white;
  }

  button.danger {
    border: 1px solid rgba(251,113,133,0.25);
    background: rgba(251,113,133,0.08);
    color: #fecdd3;
  }

  .slot-actions {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .empty {
    margin-top: 14px;
    padding: 16px;
    border-radius: 16px;
    border: 1px dashed ${ui.borderStrong};
    background: rgba(255,255,255,0.025);
    color: ${ui.muted};
    font-size: 12px;
    line-height: 1.5;
  }

  .upcoming-list {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }

  .upcoming-group {
    padding: 12px;
    border-radius: 17px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.025);
  }

  .upcoming-date {
    display: block;
    margin-bottom: 8px;
    color: ${ui.text};
    font-size: 12px;
    text-transform: capitalize;
  }

  .upcoming-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px;
    margin-top: 7px;
    border-radius: 13px;
    background: rgba(0,0,0,0.20);
  }

  .upcoming-item > div:first-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .upcoming-item strong {
    color: ${ui.text};
    font-size: 12px;
  }

  .upcoming-item span {
    margin-top: 3px;
    color: ${ui.faint};
    font-size: 10px;
  }

  .upcoming-actions {
    display: flex;
    gap: 5px;
  }

  .manage-small,
  .cancel-small {
    padding: 7px 8px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .manage-small {
    border: 1px solid rgba(137,194,170,0.22);
    background: rgba(137,194,170,0.09);
    color: #d1fae5;
  }

  .cancel-small {
    border: 1px solid rgba(251,113,133,0.20);
    background: rgba(251,113,133,0.07);
    color: #fecdd3;
  }

  .group-section {
    margin-top: 18px;
    padding: 22px;
    border-radius: 26px;
    scroll-margin-top: 20px;
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .group-header h2 {
    font-size: 26px;
  }

  .group-header p {
    margin: 7px 0 0;
    color: ${ui.muted};
    font-size: 12px;
  }

  .capacity-badge {
    display: flex;
    align-items: baseline;
    justify-content: center;
    min-width: 92px;
    padding: 12px 17px;
    border-radius: 18px;
    border: 1px solid rgba(137,194,170,0.22);
    background: rgba(137,194,170,0.09);
  }

  .capacity-badge strong {
    color: #d1fae5;
    font-size: 27px;
  }

  .capacity-badge span {
    margin-left: 4px;
    color: ${ui.muted};
    font-size: 13px;
  }

  .capacity-badge.full {
    border-color: rgba(251,191,36,0.28);
    background: rgba(251,191,36,0.09);
  }

  .registration-notice,
  .active-notice,
  .locked-notice {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    margin-top: 16px;
    border-radius: 18px;
  }

  .registration-notice {
    border: 1px solid rgba(96,165,250,0.20);
    background: rgba(96,165,250,0.07);
  }

  .active-notice {
    border: 1px solid rgba(74,222,128,0.22);
    background: rgba(74,222,128,0.07);
  }

  .locked-notice {
    border: 1px solid rgba(251,191,36,0.22);
    background: rgba(251,191,36,0.07);
  }

  .registration-notice strong,
  .active-notice strong,
  .locked-notice strong {
    color: ${ui.text};
    font-size: 12px;
  }

  .registration-notice p,
  .active-notice p,
  .locked-notice p {
    margin: 4px 0 0;
    color: ${ui.muted};
    font-size: 11px;
    line-height: 1.55;
  }

  .group-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.15fr)
      minmax(320px, 0.85fr);
    gap: 14px;
    margin-top: 16px;
  }

  .participants-card,
  .search-card {
    padding: 18px;
    border-radius: 21px;
  }

  .card-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .participants-card h3,
  .search-card h3 {
    font-size: 19px;
  }

  .full-chip,
  .owner-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-weight: 900;
  }

  .full-chip {
    padding: 6px 9px;
    border: 1px solid rgba(251,191,36,0.22);
    background: rgba(251,191,36,0.09);
    color: #fde68a;
    font-size: 9px;
  }

  .owner-chip {
    padding: 4px 7px;
    border: 1px solid rgba(137,194,170,0.20);
    background: rgba(137,194,170,0.10);
    color: #d1fae5;
    font-size: 8px;
  }

  .participant-list {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .participant {
    display: grid;
    grid-template-columns: 34px minmax(0,1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px;
    border-radius: 15px;
    border: 1px solid ${ui.border};
    background: rgba(0,0,0,0.17);
  }

  .participant.owner {
    border-color: rgba(137,194,170,0.22);
    background: rgba(137,194,170,0.07);
  }

  .participant-number {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.055);
    color: ${ui.muted};
    font-size: 11px;
    font-weight: 900;
  }

  .participant-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .participant-name-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .participant-copy strong {
    color: ${ui.text};
    font-size: 12px;
  }

  .participant-copy > span {
    margin-top: 3px;
    color: ${ui.muted};
    font-size: 10px;
  }

  .participant-copy small {
    margin-top: 5px;
    color: ${ui.faint};
    font-size: 9px;
  }

  .remove-button {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    padding: 0;
    border-radius: 10px;
    border: 1px solid rgba(251,113,133,0.20);
    background: rgba(251,113,133,0.06);
    color: #fda4af;
    font-size: 18px;
    cursor: pointer;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 15px;
    padding: 0 12px;
    border-radius: 14px;
    border: 1px solid ${ui.borderStrong};
    background: rgba(0,0,0,0.23);
  }

  .search-wrap input {
    width: 100%;
    min-width: 0;
    padding: 12px 0;
    border: 0;
    outline: none;
    background: transparent;
    color: ${ui.text};
  }

  .search-wrap input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .search-hint {
    margin-top: 10px;
    color: ${ui.faint};
    font-size: 10px;
  }

  .search-results {
    display: grid;
    gap: 7px;
    margin-top: 11px;
  }

  .search-result {
    display: grid;
    grid-template-columns: 35px minmax(0,1fr) auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid ${ui.border};
    background: rgba(255,255,255,0.035);
    color: ${ui.text};
    text-align: left;
    cursor: pointer;
  }

  .search-result:hover:not(:disabled) {
    background: rgba(137,194,170,0.07);
    border-color: rgba(137,194,170,0.20);
  }

  .search-result:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background:
      linear-gradient(
        135deg,
        rgba(37,89,113,0.72),
        rgba(75,142,141,0.72)
      );
    color: white;
    font-weight: 950;
  }

  .search-result > div:nth-child(2) {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .search-result strong {
    font-size: 11px;
  }

  .search-result span:not(.add-icon) {
    margin-top: 3px;
    color: ${ui.muted};
    font-size: 9px;
  }

  .add-icon {
    display: grid;
    place-items: center;
    width: 29px;
    height: 29px;
    border-radius: 9px;
    background: rgba(137,194,170,0.10);
    color: #d1fae5;
    font-size: 17px;
  }

  @media (max-width: 980px) {
    .top-grid {
      grid-template-columns: 1fr 1fr;
    }

    .top-grid > :last-child {
      grid-column: 1 / -1;
    }

    .reservation-layout,
    .group-grid {
      grid-template-columns: 1fr;
    }

    .side-card {
      position: static;
    }
  }

  @media (max-width: 680px) {
    .fitness-page {
      padding-left: 12px;
      padding-right: 12px;
    }

    .top-grid {
      grid-template-columns: 1fr;
    }

    .top-grid > :last-child {
      grid-column: auto;
    }

    .info-card {
      min-height: auto;
    }

    .slot-row {
      grid-template-columns: 1fr;
    }

    .slot-time {
      min-height: auto;
    }

    .slot-content {
      min-height: auto;
      align-items: stretch;
      flex-direction: column;
    }

    .slot-content button {
      width: 100%;
    }

    .slot-actions {
      display: grid;
      width: 100%;
    }

    .group-section {
      padding: 16px;
    }

    .group-header {
      align-items: flex-start;
    }

    .upcoming-item {
      align-items: flex-start;
      flex-direction: column;
    }

    .upcoming-actions {
      width: 100%;
    }

    .manage-small,
    .cancel-small {
      flex: 1;
    }
  }
`;