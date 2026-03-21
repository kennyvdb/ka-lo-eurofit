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

type PingpongReservatie = {
  id: string;
  user_id: string;
  datum: string; // yyyy-mm-dd
  slot_key: string;
  tafel: number;
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

const TABLES = [1, 2];

const SLOTS: Slot[] = [
  {
    key: "08:05-08:20",
    label: "08:05 – 08:20",
    start: "08:05",
    end: "08:20",
    duurMin: 15,
    groep: "Ochtendpauze",
  },
  {
    key: "08:20-08:35",
    label: "08:20 – 08:35",
    start: "08:20",
    end: "08:35",
    duurMin: 15,
    groep: "Ochtendpauze",
  },
  {
    key: "08:35-08:50",
    label: "08:35 – 08:50",
    start: "08:35",
    end: "08:50",
    duurMin: 15,
    groep: "Ochtendpauze",
  },
  {
    key: "10:35-10:50",
    label: "10:35 – 10:50",
    start: "10:35",
    end: "10:50",
    duurMin: 15,
    groep: "Voormiddagpauze",
  },
  {
    key: "13:00-13:10",
    label: "13:00 – 13:10",
    start: "13:00",
    end: "13:10",
    duurMin: 10,
    groep: "Middagpauze",
  },
  {
    key: "13:10-13:20",
    label: "13:10 – 13:20",
    start: "13:10",
    end: "13:20",
    duurMin: 10,
    groep: "Middagpauze",
  },
  {
    key: "15:00-15:10",
    label: "15:00 – 15:10",
    start: "15:00",
    end: "15:10",
    duurMin: 10,
    groep: "Namiddagpauze",
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

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 zondag, 1 maandag
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeekSunday(date: Date) {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
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

export default function PingpongtafelsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toLocalDateInputValue(new Date())
  );
  const [dayReservations, setDayReservations] = useState<PingpongReservatie[]>([]);
  const [myWeekReservations, setMyWeekReservations] = useState<PingpongReservatie[]>([]);
  const [myUpcomingReservations, setMyUpcomingReservations] = useState<PingpongReservatie[]>([]);

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

    if (error) {
      throw new Error(error.message);
    }

    return (data as Profiel) ?? null;
  }, []);

  const loadReservations = useCallback(
    async (userId: string, dateStr: string) => {
      const dayDate = parseLocalDate(dateStr);
      const weekStart = toLocalDateInputValue(startOfWeekMonday(dayDate));
      const weekEnd = toLocalDateInputValue(endOfWeekSunday(dayDate));
      const upcomingEnd = maxDate;

      const [
        { data: dayData, error: dayError },
        { data: weekData, error: weekError },
        { data: upcomingData, error: upcomingError },
      ] = await Promise.all([
        supabase
          .from("pingpong_reservaties")
          .select("id, user_id, datum, slot_key, tafel, reserveerder_naam, created_at")
          .eq("datum", dateStr)
          .order("slot_key", { ascending: true })
          .order("tafel", { ascending: true }),

        supabase
          .from("pingpong_reservaties")
          .select("id, user_id, datum, slot_key, tafel, reserveerder_naam, created_at")
          .eq("user_id", userId)
          .gte("datum", weekStart)
          .lte("datum", weekEnd)
          .order("datum", { ascending: true }),

        supabase
          .from("pingpong_reservaties")
          .select("id, user_id, datum, slot_key, tafel, reserveerder_naam, created_at")
          .eq("user_id", userId)
          .gte("datum", minDate)
          .lte("datum", upcomingEnd)
          .order("datum", { ascending: true })
          .order("slot_key", { ascending: true }),
      ]);

      if (dayError) throw new Error(dayError.message);
      if (weekError) throw new Error(weekError.message);
      if (upcomingError) throw new Error(upcomingError.message);

      setDayReservations((dayData as PingpongReservatie[]) ?? []);
      setMyWeekReservations((weekData as PingpongReservatie[]) ?? []);
      setMyUpcomingReservations((upcomingData as PingpongReservatie[]) ?? []);
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
        setError(e?.message ?? "Er liep iets mis bij het laden van de reservaties.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fetchProfile, loadReservations]);

  useEffect(() => {
    if (!uid) return;
    if (!selectedDate) return;

    const run = async () => {
      try {
        setError(null);
        await loadReservations(uid, selectedDate);
      } catch (e: any) {
        setError(e?.message ?? "Kon reservaties niet ophalen.");
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
  const weekCount = myWeekReservations.length;
  const canStillBookThisWeek = weekCount < 2;
  const bookingWindowOk = isWithinBookingWindow(selectedDate);

  const reservationsMap = useMemo(() => {
    const map = new Map<string, PingpongReservatie>();
    for (const r of dayReservations) {
      map.set(`${r.slot_key}__${r.tafel}`, r);
    }
    return map;
  }, [dayReservations]);

  const upcomingByDate = useMemo(() => {
    const grouped = new Map<string, PingpongReservatie[]>();

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

  const handleBook = async (slot: Slot, tafel: number) => {
    if (!uid) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!isWithinBookingWindow(selectedDate)) {
        throw new Error("Je kan alleen reserveren vanaf vandaag tot maximaal 1 week op voorhand.");
      }

      const selectedDay = parseLocalDate(selectedDate);
      const weekStart = toLocalDateInputValue(startOfWeekMonday(selectedDay));
      const weekEnd = toLocalDateInputValue(endOfWeekSunday(selectedDay));

      const { data: freshWeekData, error: freshWeekError } = await supabase
        .from("pingpong_reservaties")
        .select("id")
        .eq("user_id", uid)
        .gte("datum", weekStart)
        .lte("datum", weekEnd);

      if (freshWeekError) throw new Error(freshWeekError.message);

      const currentWeekCount = freshWeekData?.length ?? 0;
      if (currentWeekCount >= 2) {
        throw new Error("Je hebt het maximum van 2 reservaties voor deze week al bereikt.");
      }

      const profileName = profiel?.volledige_naam ?? null;

      const { error: insertError } = await supabase.from("pingpong_reservaties").insert({
        user_id: uid,
        datum: selectedDate,
        slot_key: slot.key,
        tafel,
        reserveerder_naam: profileName,
      });

      if (insertError) {
        if ((insertError as any).code === "23505") {
          throw new Error("Dit tijdslot op deze tafel is net door iemand anders gereserveerd.");
        }
        throw new Error(insertError.message);
      }

      await loadReservations(uid, selectedDate);
      setSuccess(`Reservatie bevestigd: tafel ${tafel} op ${formatDateHuman(selectedDate)} om ${slot.label}.`);
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
        .from("pingpong_reservaties")
        .delete()
        .eq("id", reservationId)
        .eq("user_id", uid);

      if (error) throw new Error(error.message);

      await loadReservations(uid, selectedDate);
      setSuccess("Je reservatie werd geannuleerd.");
    } catch (e: any) {
      setError(e?.message ?? "Annuleren mislukt.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div style={{ color: ui.text }}>Pingpongreservaties laden…</div>
      </main>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="Pingpongtafels"
      userName={profiel?.volledige_naam ?? null}
    >
      <BaseHero
        label="PINGPONGTAFELS"
        title={
          <>
            Reserveer je tafel,
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              {" "}
              {greetingName}
            </span>
            🏓
          </>
        }
        description={
          <>
            {shownRoleLabel}
            {profiel?.klas_naam ? (
              <span className="opacity-85"> • {profiel.klas_naam}</span>
            ) : null}
            <span className="opacity-85"> •</span> Kies een datum, een tijdslot en één van de 2 tafels.
          </>
        }
        imageSrc="/reservaties/reservaties-pinpong.png"
        imageAlt="Pingpong illustratie"
        quoteTitle="Fair play"
        quote="Reserveer correct, speel sportief en geef iedereen een kans."
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
            <div style={styles.cardTitle}>Jouw weekteller</div>
            <div style={styles.bigCounter}>
              {weekCount}
              <span style={styles.bigCounterSuffix}>/2</span>
            </div>
            <div style={styles.cardText}>
              {canStillBookThisWeek
                ? "Je kan deze week nog reserveren."
                : "Je hebt het maximum van 2 reservaties deze week bereikt."}
            </div>
          </div>

          <div style={styles.rulesCard}>
            <div style={styles.cardTitle}>Reservatieregels</div>
            <ul style={styles.rulesList}>
              <li>Er zijn 2 pingpongtafels beschikbaar.</li>
              <li>Reservaties zijn enkel mogelijk op vaste tijdsblokken.</li>
              <li>Je kan maximaal 1 week op voorhand boeken.</li>
              <li>Je kan maximaal 2 keer per week reserveren.</li>
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

        <div style={styles.contentGrid}>
          <div style={styles.mainCard}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionEyebrow}>Beschikbaarheid</div>
                <div style={styles.sectionTitle}>{formatDateHuman(selectedDate)}</div>
              </div>
              <div style={styles.sectionSubtitle}>Klik op een vrije tafel om te reserveren.</div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {groupedSlots.map(([groupName, slots]) => (
                <div key={groupName} style={styles.slotGroup}>
                  <div style={styles.groupHeader}>{groupName}</div>

                  <div style={styles.tableHeaderRow}>
                    <div />
                    <div style={styles.tableColTitle}>Tafel 1</div>
                    <div style={styles.tableColTitle}>Tafel 2</div>
                  </div>

                  {slots.map((slot) => (
                    <div key={slot.key} style={styles.slotRow}>
                      <div style={styles.timeCell}>
                        <div style={styles.timeLabel}>{slot.label}</div>
                        <div style={styles.timeMeta}>{slot.duurMin} min</div>
                      </div>

                      {TABLES.map((tafel) => {
                        const reservation = reservationsMap.get(`${slot.key}__${tafel}`);
                        const isMine = reservation?.user_id === uid;
                        const isBooked = !!reservation;
                        const disabled =
                          saving ||
                          !bookingWindowOk ||
                          (!isMine && !canStillBookThisWeek) ||
                          isBooked;

                        return (
                          <div
                            key={`${slot.key}-${tafel}`}
                            style={{
                              ...styles.slotCell,
                              ...(isMine
                                ? styles.slotCellMine
                                : isBooked
                                ? styles.slotCellBooked
                                : styles.slotCellFree),
                            }}
                          >
                            {!reservation ? (
                              <>
                                <div style={styles.cellStatusFree}>Vrij</div>
                                <button
                                  onClick={() => handleBook(slot, tafel)}
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
                                <div style={styles.cellSubText}>Tafel {tafel}</div>
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
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sectionEyebrow}>Jouw reservaties</div>
            <div style={styles.sectionTitle}>Komende boekingen</div>

            {upcomingByDate.length === 0 ? (
              <div style={styles.emptyState}>
                Je hebt momenteel geen komende pingpongreservaties.
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
                              <div style={styles.reservationMeta}>Tafel {r.tafel}</div>
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
  bigCounter: {
    marginTop: 12,
    fontSize: 44,
    lineHeight: 1,
    fontWeight: 1000,
    color: ui.text,
    display: "flex",
    alignItems: "flex-end",
    gap: 4,
  },
  bigCounterSuffix: {
    fontSize: 22,
    color: ui.muted,
    paddingBottom: 4,
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
  tableHeaderRow: {
    display: "grid",
    gridTemplateColumns: "160px repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  tableColTitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 900,
    color: ui.faint,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  slotRow: {
    display: "grid",
    gridTemplateColumns: "160px repeat(2, minmax(0, 1fr))",
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