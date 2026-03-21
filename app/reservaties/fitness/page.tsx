"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  datum: string; // yyyy-mm-dd
  slot_key: string;
  reserveerder_naam: string | null;
  created_at?: string | null;
};

type Slot = {
  key: string;
  label: string;
  start: string;
  end: string;
  duurMin: number;
  groep: string;
};

const SLOTS: Slot[] = [
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
  panel: "rgba(255,255,255,0.06)",
  panelStrong: "rgba(255,255,255,0.08)",
  border: "rgba(148,163,184,0.18)",
  borderStrong: "rgba(148,163,184,0.28)",
  accent: "#89C2AA",
  accentSoft: "rgba(137,194,170,0.16)",
  okBg: "rgba(55,178,125,0.14)",
  okBorder: "rgba(55,178,125,0.26)",
  warnBg: "rgba(255,184,77,0.14)",
  warnBorder: "rgba(255,184,77,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  bookedBg: "rgba(255,255,255,0.05)",
  mineBg: "rgba(75,142,141,0.20)",
  blockedBg: "rgba(255,255,255,0.03)",
};

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

  const maxDate = addDays(today, 7);
  maxDate.setHours(23, 59, 59, 999);

  const selected = parseLocalDate(dateStr);
  selected.setHours(12, 0, 0, 0);

  return selected >= today && selected <= maxDate;
}

function isThirdGrade(klasNaam?: string | null) {
  if (!klasNaam) return false;

  const value = klasNaam.toLowerCase().trim();

  // Flexibel genoeg voor benamingen zoals:
  // "5A", "6WEWI", "7BSO", "3e graad", ...
  if (value.includes("3e graad") || value.includes("derde graad")) return true;
  if (/^5/.test(value)) return true;
  if (/^6/.test(value)) return true;
  if (/^7/.test(value)) return true;
  if (/\b5[[:alpha:]]*/i.test(value)) return true;
  if (/\b6[[:alpha:]]*/i.test(value)) return true;
  if (/\b7[[:alpha:]]*/i.test(value)) return true;

  return false;
}

export default function FitnessPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalDateInputValue(new Date())
  );

  const [dayReservations, setDayReservations] = useState<FitnessReservatie[]>([]);
  const [myUpcomingReservations, setMyUpcomingReservations] = useState<FitnessReservatie[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDate = useMemo(() => toLocalDateInputValue(today), [today]);
  const maxDate = useMemo(() => toLocalDateInputValue(addDays(today, 7)), [today]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, role, rol, klas_naam")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return (data as Profiel) ?? null;
  }, []);

  const loadReservations = useCallback(
    async (userId: string, dateStr: string) => {
      const upcomingEnd = maxDate;

      const [
        { data: dayData, error: dayError },
        { data: upcomingData, error: upcomingError },
      ] = await Promise.all([
        supabase
          .from("fitness_reservaties")
          .select("id, user_id, datum, slot_key, reserveerder_naam, created_at")
          .eq("datum", dateStr)
          .order("slot_key", { ascending: true }),

        supabase
          .from("fitness_reservaties")
          .select("id, user_id, datum, slot_key, reserveerder_naam, created_at")
          .eq("user_id", userId)
          .gte("datum", minDate)
          .lte("datum", upcomingEnd)
          .order("datum", { ascending: true })
          .order("slot_key", { ascending: true }),
      ]);

      if (dayError) throw new Error(dayError.message);
      if (upcomingError) throw new Error(upcomingError.message);

      setDayReservations((dayData as FitnessReservatie[]) ?? []);
      setMyUpcomingReservations((upcomingData as FitnessReservatie[]) ?? []);
    },
    [maxDate, minDate]
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);

        const user = data.session?.user ?? null;
        if (!user?.id) {
          window.location.replace("/login");
          return;
        }

        setUid(user.id);

        const p = await fetchProfile(user.id);
        setProfiel(p);

        const todayStr = toLocalDateInputValue(new Date());
        setSelectedDate(todayStr);

        await loadReservations(user.id, todayStr);
      } catch (e: any) {
        setError(e?.message ?? "Er liep iets mis bij het laden van de fitnessreservaties.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fetchProfile, loadReservations]);

  useEffect(() => {
    if (!uid || !selectedDate) return;

    const run = async () => {
      try {
        setError(null);
        await loadReservations(uid, selectedDate);
      } catch (e: any) {
        setError(e?.message ?? "Kon fitnessreservaties niet ophalen.");
      }
    };

    run();
  }, [uid, selectedDate, loadReservations]);

  const shownRoleRaw = (profiel?.role ?? profiel?.rol ?? "").toLowerCase();
  const shownRoleLabel =
    shownRoleRaw === "teacher" || shownRoleRaw === "leerkracht"
      ? "Leerkracht"
      : "Leerling";

  const greetingName = profiel?.volledige_naam?.split(" ")?.[0] ?? "Welkom";
  const bookingWindowOk = isWithinBookingWindow(selectedDate);
  const thirdGradeOk = isThirdGrade(profiel?.klas_naam);

  const reservationsMap = useMemo(() => {
    const map = new Map<string, FitnessReservatie>();
    for (const r of dayReservations) {
      map.set(r.slot_key, r);
    }
    return map;
  }, [dayReservations]);

  const upcomingByDate = useMemo(() => {
    const grouped = new Map<string, FitnessReservatie[]>();

    for (const r of myUpcomingReservations) {
      const arr = grouped.get(r.datum) ?? [];
      arr.push(r);
      grouped.set(r.datum, arr);
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [myUpcomingReservations]);

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const slot of SLOTS) {
      const arr = groups.get(slot.groep) ?? [];
      arr.push(slot);
      groups.set(slot.groep, arr);
    }
    return Array.from(groups.entries());
  }, []);

  const handleBook = async (slot: Slot) => {
    if (!uid) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!thirdGradeOk) {
        throw new Error("Alleen leerlingen van de 3e graad mogen de fitnessruimte reserveren.");
      }

      if (!isWithinBookingWindow(selectedDate)) {
        throw new Error("Je kan alleen reserveren vanaf vandaag tot maximaal 1 week op voorhand.");
      }

      const existingReservation = reservationsMap.get(slot.key);
      if (existingReservation) {
        throw new Error("Dit tijdslot is net door iemand anders gereserveerd.");
      }

      const profileName = profiel?.volledige_naam ?? null;

      const { error: insertError } = await supabase.from("fitness_reservaties").insert({
        user_id: uid,
        datum: selectedDate,
        slot_key: slot.key,
        reserveerder_naam: profileName,
      });

      if (insertError) {
        if ((insertError as any).code === "23505") {
          throw new Error("Dit tijdslot is net door iemand anders gereserveerd.");
        }
        throw new Error(insertError.message);
      }

      await loadReservations(uid, selectedDate);
      setSuccess(`Reservatie bevestigd: ${formatDateHuman(selectedDate)} om ${slot.label}.`);
    } catch (e: any) {
      setError(e?.message ?? "Reservatie mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!uid) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from("fitness_reservaties")
        .delete()
        .eq("id", reservationId)
        .eq("user_id", uid);

      if (error) throw new Error(error.message);

      await loadReservations(uid, selectedDate);
      setSuccess("Je fitnessreservatie werd geannuleerd.");
    } catch (e: any) {
      setError(e?.message ?? "Annuleren mislukt.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div style={{ color: ui.text }}>Fitnessreservaties laden…</div>
      </main>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Fitness"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="FITNESS"
        title={
          <>
            Reserveer je fitnessmoment,
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {" "}
              {greetingName}
            </span>
            🏋️
          </>
        }
        description={
          <>
            {shownRoleLabel}
            {profiel?.klas_naam ? (
              <span className="opacity-85"> • {profiel.klas_naam}</span>
            ) : null}
            <span className="opacity-85"> •</span> Kies een datum en een vrij fitnessslot.
          </>
        }
        imageSrc="/reservaties/reservaties-fitness.png"
        imageAlt="Fitness illustratie"
        quoteTitle="Fitnessregels"
        quote="Zweet mag blijven, rommel niet..."
        quoteAuthor="LO Team"
        imageClassName="scale-105 md:scale-[1.08] transition-transform duration-500"
        actions={
          <>
            <Link
              href="/reservaties"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45"
            >
              Terug naar reservaties
            </Link>
          </>
        }
      />

      <section style={{ marginTop: 14 }}>
        <div style={styles.topGrid}>
          <div style={styles.controlCard}>
            <div style={styles.cardTitle}>Kies een datum</div>
            <div style={styles.cardText}>
              Je kan reserveren vanaf <b>vandaag</b> tot en met <b>7 dagen vooruit</b>.
            </div>

            <div style={{ marginTop: 14 }}>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  setSuccess(null);
                  setSelectedDate(e.target.value);
                }}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.metaRow}>
              <span style={styles.metaChip}>Vandaag: {formatDateHuman(minDate)}</span>
              <span style={styles.metaChip}>Max.: {formatDateHuman(maxDate)}</span>
            </div>
          </div>

          <div style={styles.counterCard}>
            <div style={styles.cardTitle}>Toegang fitness</div>
            <div style={styles.bigStatus}>{thirdGradeOk ? "Ja" : "Nee"}</div>
            <div style={styles.cardText}>
              {thirdGradeOk
                ? "Jij zit in de 3e graad en mag reserveren."
                : "Alleen leerlingen van de 3e graad mogen reserveren."}
            </div>
          </div>

          <div style={styles.rulesCard}>
            <div style={styles.cardTitle}>Reservatieregels</div>
            <ul style={styles.rulesList}>
              <li>Reservaties zijn enkel mogelijk op vaste tijdsblokken.</li>
              <li>Je kan maximaal 1 week op voorhand boeken.</li>
              <li>Alleen leerlingen van de 3e graad mogen reserveren.</li>
              <li>Per tijdslot is er maar 1 reservatie mogelijk.</li>
            </ul>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <b>Oeps:</b> {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <b>Gelukt:</b> {success}
          </div>
        )}

        {!bookingWindowOk && (
          <div style={styles.warningBox}>
            Kies een datum tussen <b>{formatDateHuman(minDate)}</b> en{" "}
            <b>{formatDateHuman(maxDate)}</b>.
          </div>
        )}

        {!thirdGradeOk && (
          <div style={styles.warningBox}>
            Jij kan niet reserveren omdat deze pagina enkel voor leerlingen van de <b>3e graad</b> is.
          </div>
        )}

        <div style={styles.contentGrid}>
          <div style={styles.mainCard}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionEyebrow}>Beschikbaarheid</div>
                <div style={styles.sectionTitle}>{formatDateHuman(selectedDate)}</div>
              </div>
              <div style={styles.sectionSubtitle}>Klik op een vrij tijdslot om te reserveren.</div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {groupedSlots.map(([groupName, slots]) => (
                <div key={groupName} style={styles.slotGroup}>
                  <div style={styles.groupHeader}>{groupName}</div>

                  {slots.map((slot) => {
                    const reservation = reservationsMap.get(slot.key);
                    const isMine = reservation?.user_id === uid;
                    const isBooked = !!reservation;

                    const disabled =
                      saving || !bookingWindowOk || !thirdGradeOk || isBooked;

                    return (
                      <div key={slot.key} style={styles.slotRowSingle}>
                        <div style={styles.timeCell}>
                          <div style={styles.timeLabel}>{slot.label}</div>
                          <div style={styles.timeMeta}>{slot.duurMin} min</div>
                        </div>

                        <div
                          style={{
                            ...styles.slotCell,
                            ...(isMine
                              ? styles.slotCellMine
                              : isBooked
                              ? styles.slotCellBooked
                              : !thirdGradeOk
                              ? styles.slotCellBlocked
                              : styles.slotCellFree),
                          }}
                        >
                          {!reservation ? (
                            <>
                              <div style={styles.cellStatusFree}>Vrij</div>
                              <div style={styles.cellSubText}>Fitnessruimte beschikbaar</div>
                              <button
                                onClick={() => handleBook(slot)}
                                disabled={disabled}
                                style={{
                                  ...styles.primaryButton,
                                  opacity: disabled ? 0.6 : 1,
                                  cursor: disabled ? "not-allowed" : "pointer",
                                }}
                              >
                                Reserveer
                              </button>
                            </>
                          ) : isMine ? (
                            <>
                              <div style={styles.cellStatusMine}>Jouw reservatie</div>
                              <div style={styles.cellSubText}>Fitnessruimte gereserveerd</div>
                              <button
                                onClick={() => handleCancel(reservation.id)}
                                disabled={saving}
                                style={{
                                  ...styles.secondaryDangerButton,
                                  opacity: saving ? 0.6 : 1,
                                  cursor: saving ? "not-allowed" : "pointer",
                                }}
                              >
                                Annuleer
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={styles.cellStatusBooked}>Bezet</div>
                              <div style={styles.cellSubText}>
                                Gereserveerd door {reservation.reserveerder_naam ?? "leerling"}
                              </div>
                              <button disabled style={styles.disabledButton}>
                                Niet beschikbaar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sectionEyebrow}>Jouw reservaties</div>
            <div style={styles.sectionTitle}>Komende boekingen</div>

            {upcomingByDate.length === 0 ? (
              <div style={styles.emptyState}>
                Je hebt momenteel geen komende fitnessreservaties.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {upcomingByDate.map(([date, reservations]) => (
                  <div key={date} style={styles.reservationGroup}>
                    <div style={styles.reservationGroupTitle}>{formatDateHuman(date)}</div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {reservations
                        .sort((a, b) => a.slot_key.localeCompare(b.slot_key))
                        .map((r) => (
                          <div key={r.id} style={styles.reservationItem}>
                            <div>
                              <div style={styles.reservationTime}>{r.slot_key}</div>
                              <div style={styles.reservationMeta}>Fitnessruimte</div>
                            </div>

                            <button
                              onClick={() => handleCancel(r.id)}
                              disabled={saving}
                              style={{
                                ...styles.smallGhostDangerButton,
                                opacity: saving ? 0.6 : 1,
                                cursor: saving ? "not-allowed" : "pointer",
                              }}
                            >
                              Annuleer
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  controlCard: {
    padding: 18,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },
  counterCard: {
    padding: 18,
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(75,142,141,0.20), rgba(255,255,255,0.05))",
    border: `1px solid ${ui.borderStrong}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },
  rulesCard: {
    padding: 18,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: ui.text,
  },
  cardText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.5,
    color: ui.muted,
  },
  bigStatus: {
    marginTop: 12,
    fontSize: 44,
    lineHeight: 1,
    fontWeight: 1000,
    color: ui.text,
  },
  rulesList: {
    marginTop: 10,
    paddingLeft: 18,
    color: ui.muted,
    fontSize: 13,
    lineHeight: 1.65,
  },
  dateInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.borderStrong}`,
    background: "rgba(0,0,0,0.32)",
    color: ui.text,
    outline: "none",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    color: ui.muted,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.04)",
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  successBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background: ui.okBg,
    border: `1px solid ${ui.okBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    color: ui.text,
    fontSize: 14,
  },
  contentGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.9fr)",
    gap: 14,
    alignItems: "start",
  },
  mainCard: {
    padding: 18,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },
  sidebarCard: {
    padding: 18,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    position: "sticky",
    top: 12,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "end",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  sectionEyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 900,
    color: ui.faint,
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: 1000,
    color: ui.text,
  },
  sectionSubtitle: {
    color: ui.muted,
    fontSize: 13,
  },
  slotGroup: {
    padding: 14,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.03)",
  },
  groupHeader: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 900,
    color: ui.text,
  },
  slotRowSingle: {
    display: "grid",
    gridTemplateColumns: "220px minmax(0, 1fr)",
    gap: 10,
    alignItems: "stretch",
    marginTop: 10,
  },
  timeCell: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(0,0,0,0.22)",
    border: `1px solid ${ui.border}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: ui.text,
  },
  timeMeta: {
    marginTop: 4,
    fontSize: 12,
    color: ui.faint,
  },
  slotCell: {
    minHeight: 118,
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 10,
  },
  slotCellFree: {
    background: "rgba(55,178,125,0.10)",
  },
  slotCellBooked: {
    background: ui.bookedBg,
  },
  slotCellMine: {
    background: ui.mineBg,
  },
  slotCellBlocked: {
    background: ui.blockedBg,
  },
  cellStatusFree: {
    color: "#baf5d7",
    fontWeight: 900,
    fontSize: 14,
  },
  cellStatusBooked: {
    color: ui.text,
    fontWeight: 900,
    fontSize: 14,
  },
  cellStatusMine: {
    color: "#c6f7e4",
    fontWeight: 900,
    fontSize: 14,
  },
  cellSubText: {
    color: ui.muted,
    fontSize: 12,
    lineHeight: 1.45,
  },
  primaryButton: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(137,194,170,0.30)",
    background: "linear-gradient(180deg, rgba(75,142,141,0.85), rgba(37,89,113,0.92))",
    color: "white",
    fontWeight: 900,
    fontSize: 13,
  },
  secondaryDangerButton: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,85,112,0.28)",
    background: "rgba(255,85,112,0.12)",
    color: ui.text,
    fontWeight: 900,
    fontSize: 13,
  },
  disabledButton: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.04)",
    color: ui.faint,
    fontWeight: 800,
    fontSize: 13,
    cursor: "not-allowed",
  },
  emptyState: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    border: `1px dashed ${ui.borderStrong}`,
    color: ui.muted,
    fontSize: 13,
    lineHeight: 1.5,
    background: "rgba(255,255,255,0.03)",
  },
  reservationGroup: {
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.03)",
  },
  reservationGroupTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: ui.text,
    marginBottom: 8,
  },
  reservationItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(0,0,0,0.22)",
    border: `1px solid ${ui.border}`,
  },
  reservationTime: {
    fontSize: 13,
    fontWeight: 900,
    color: ui.text,
  },
  reservationMeta: {
    marginTop: 4,
    fontSize: 12,
    color: ui.faint,
  },
  smallGhostDangerButton: {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,85,112,0.28)",
    background: "rgba(255,85,112,0.10)",
    color: ui.text,
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
};