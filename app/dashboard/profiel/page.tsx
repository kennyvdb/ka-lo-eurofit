"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Profile = {
  id: string;
  volledige_naam: string | null;
  email: string | null;
  geslacht: "M" | "V" | null;
  geboortedatum: string | null;
  graad: number | null;
  leerjaar: number | null;
  finaliteit: string | null;
  klas_naam: string | null;
  lo_groep: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
  role: "student" | "teacher" | null;
  rol: string | null;
  username: string | null;
  given_name: string | null;
  family_name: string | null;
  smartschool_sourced_id: string | null;
};

const emptyProfile: Profile = {
  id: "",
  volledige_naam: null,
  email: null,
  geslacht: null,
  geboortedatum: null,
  graad: null,
  leerjaar: null,
  finaliteit: null,
  klas_naam: null,
  lo_groep: null,
  schooljaar: null,
  schooljaar_bevestigd_op: null,
  role: null,
  rol: null,
  username: null,
  given_name: null,
  family_name: null,
  smartschool_sourced_id: null,
};

function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function geslachtLabel(value: "M" | "V" | null) {
  if (value === "M") return "Mannelijk";
  if (value === "V") return "Vrouwelijk";
  return "—";
}

const birthDateYears = Array.from({ length: 90 }, (_, index) => String(new Date().getFullYear() - 16 - index));
const birthDateMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function splitDate(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function buildDate(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function monthLabel(month: string) {
  const labels: Record<string, string> = {
    "01": "januari",
    "02": "februari",
    "03": "maart",
    "04": "april",
    "05": "mei",
    "06": "juni",
    "07": "juli",
    "08": "augustus",
    "09": "september",
    "10": "oktober",
    "11": "november",
    "12": "december",
  };

  return labels[month] ?? month;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("nl-BE");
}

function roleLabel(profile: Profile) {
  const rol = String(profile.rol ?? "").trim().toLowerCase();
  if (rol === "leerkracht lo") return "Leerkracht LO";
  if (rol === "administratief personeel") return "Administratief personeel";
  if (rol === "leerkracht" || profile.role === "teacher") return "Leerkracht";
  return "Leerling";
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-black text-white">{label}</label>
      <div className="flex min-h-[46px] items-center rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white">
        {value}
      </div>
    </div>
  );
}

// MOBIELE FIX: dag, maand en jaar blijven apart bewaard in deze component.
// Daardoor blijft bv. dag "09" zichtbaar, ook wanneer maand of jaar nog niet gekozen is.
function BirthDateSelects({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const initialDate = splitDate(value);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);

  useEffect(() => {
    if (!value) return;

    const nextDate = splitDate(value);
    setSelectedDay(nextDate.day);
    setSelectedMonth(nextDate.month);
    setSelectedYear(nextDate.year);
  }, [value]);

  const maxDays = daysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays }, (_, index) =>
    String(index + 1).padStart(2, "0")
  );

  function syncBirthDate(nextYear: string, nextMonth: string, nextDay: string) {
    if (!nextYear || !nextMonth || !nextDay) {
      onChange("");
      return;
    }

    const nextMaxDays = daysInMonth(nextYear, nextMonth);
    const safeDay =
      Number(nextDay) > nextMaxDays ? String(nextMaxDays).padStart(2, "0") : nextDay;

    onChange(buildDate(nextYear, nextMonth, safeDay));
  }

  function handleDayChange(nextDay: string) {
    setSelectedDay(nextDay);
    syncBirthDate(selectedYear, selectedMonth, nextDay);
  }

  function handleMonthChange(nextMonth: string) {
    const nextMaxDays = daysInMonth(selectedYear, nextMonth);
    const safeDay =
      selectedDay && Number(selectedDay) > nextMaxDays
        ? String(nextMaxDays).padStart(2, "0")
        : selectedDay;

    setSelectedMonth(nextMonth);
    setSelectedDay(safeDay);
    syncBirthDate(selectedYear, nextMonth, safeDay);
  }

  function handleYearChange(nextYear: string) {
    const nextMaxDays = daysInMonth(nextYear, selectedMonth);
    const safeDay =
      selectedDay && Number(selectedDay) > nextMaxDays
        ? String(nextMaxDays).padStart(2, "0")
        : selectedDay;

    setSelectedYear(nextYear);
    setSelectedDay(safeDay);
    syncBirthDate(nextYear, selectedMonth, safeDay);
  }

  const selectClassName =
    "min-h-[50px] w-full rounded-2xl border border-white/15 bg-black/30 px-3 py-3 text-base text-white outline-none [color-scheme:dark]";

  return (
    <div className="grid gap-2">
      <label className="text-sm font-black text-white">Geboortedatum</label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          aria-label="Dag"
          value={selectedDay}
          onChange={(e) => handleDayChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">Dag</option>
          {days.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          aria-label="Maand"
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">Maand</option>
          {birthDateMonths.map((item) => (
            <option key={item} value={item}>
              {monthLabel(item)}
            </option>
          ))}
        </select>

        <select
          aria-label="Jaar"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">Jaar</option>
          {birthDateYears.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs leading-5 text-white/55">
        Kies dag, maand en jaar. Elke keuze blijft meteen zichtbaar op gsm.
      </p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-white/65">{subtitle}</p>
    </div>
  );
}

export default function ProfielPage() {
  const [loading, setLoading] = useState(true);
  const [savingBirthDate, setSavingBirthDate] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [teacherBirthDate, setTeacherBirthDate] = useState("");
  const [message, setMessage] = useState("");

  const currentSchoolYear = getCurrentSchoolYearBelgium();
  const isStudent =
    profile.role === "student" ||
    String(profile.rol ?? "").trim().toLowerCase() === "leerling";
  const isTeacher = !isStudent;
  const schoolYearIsCurrent = profile.schooljaar === currentSchoolYear;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");

      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        window.location.href = "/login";
        return;
      }

      const userId = authData.user.id;

      const { data, error } = await supabase
        .from("profielen")
        .select(
          "id, volledige_naam, email, geslacht, geboortedatum, graad, leerjaar, finaliteit, klas_naam, lo_groep, schooljaar, schooljaar_bevestigd_op, role, rol, username, given_name, family_name, smartschool_sourced_id"
        )
        .eq("id", userId)
        .maybeSingle<Profile>();

      if (error) {
        setMessage(`Fout bij laden: ${error.message}`);
        setLoading(false);
        return;
      }

      const nextProfile =
        data ?? {
          ...emptyProfile,
          id: userId,
          email: authData.user.email ?? null,
        };

      setProfile(nextProfile);
      setTeacherBirthDate(nextProfile.geboortedatum ?? "");
      setLoading(false);
    };

    load();
  }, []);

  async function saveTeacherBirthDate() {
    setSavingBirthDate(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      window.location.href = "/login";
      return;
    }

    if (!teacherBirthDate) {
      setMessage("Kies eerst je geboortedatum.");
      setSavingBirthDate(false);
      return;
    }

    const { error } = await supabase
      .from("profielen")
      .update({
        geboortedatum: teacherBirthDate,
        birth_date: teacherBirthDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id);

    if (error) {
      setMessage(`Opslaan mislukt: ${error.message}`);
      setSavingBirthDate(false);
      return;
    }

    setProfile((p) => ({
      ...p,
      geboortedatum: teacherBirthDate,
    }));

    setMessage("Geboortedatum opgeslagen ✅");
    setSavingBirthDate(false);
  }

  return (
    <AppShell title="LO App" subtitle="Profiel" userName={profile.volledige_naam ?? null}>
      <BaseHero
        label="ACCOUNT"
        title={<>Profiel</>}
        description={<>Je profielgegevens worden automatisch ingevuld vanuit Smartschool.</>}
        imageSrc="/profiel/profiel.png"
        imageAlt="Profiel overzicht"
        quoteTitle="Profiel"
        quote="Leerlinggegevens komen rechtstreeks uit Smartschool. Leerkrachten kunnen hun geboortedatum zelf aanvullen."
        quoteAuthor="KA LO App"
        imageClassName="max-h-[300px] md:max-h-[340px]"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
            >
              ← Terug naar home
            </Link>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
              {roleLabel(profile)}
            </span>
          </div>
        }
      />

      {loading ? (
        <main className="mt-5 grid min-h-[180px] place-items-center px-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-white/75">
            Bezig met laden…
          </div>
        </main>
      ) : (
        <>
          {!!message && (
            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-white">
              {message}
            </div>
          )}

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <SectionHeader
              title="Vaste gegevens"
              subtitle="Deze gegevens komen uit Smartschool. Alleen leerkrachten kunnen hun geboortedatum aanvullen."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadOnlyField label="Volledige naam" value={display(profile.volledige_naam)} />
              <ReadOnlyField label="E-mail" value={display(profile.email)} />
              <ReadOnlyField label="Voornaam" value={display(profile.given_name)} />
              <ReadOnlyField label="Naam" value={display(profile.family_name)} />
              <ReadOnlyField label="Geslacht" value={geslachtLabel(profile.geslacht)} />

              {isTeacher ? (
                <BirthDateSelects value={teacherBirthDate} onChange={setTeacherBirthDate} />
              ) : (
                <ReadOnlyField label="Geboortedatum" value={formatDate(profile.geboortedatum)} />
              )}

              <ReadOnlyField label="Smartschool gebruikersnaam" value={display(profile.username)} />
              <ReadOnlyField label="Smartschool ID" value={display(profile.smartschool_sourced_id)} />
            </div>

            {isTeacher && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={saveTeacherBirthDate}
                  disabled={savingBirthDate}
                  className="inline-flex h-11 items-center rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-black text-white transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingBirthDate ? "Opslaan…" : "Geboortedatum opslaan"}
                </button>
              </div>
            )}
          </section>

          {isStudent ? (
            <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <SectionHeader
                title="Klasgegevens"
                subtitle="Je klas en LO-groep worden automatisch bepaald via Smartschool."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ReadOnlyField label="Klas" value={display(profile.klas_naam)} />
                <ReadOnlyField label="LO-groep" value={display(profile.lo_groep)} />
                <ReadOnlyField label="Graad" value={profile.graad ? `${profile.graad}e graad` : "—"} />
                <ReadOnlyField label="Leerjaar" value={display(profile.leerjaar)} />
                <ReadOnlyField label="Finaliteit" value={display(profile.finaliteit)} />
                <ReadOnlyField label="Schooljaar" value={display(profile.schooljaar)} />
                <ReadOnlyField
                  label="Status"
                  value={schoolYearIsCurrent ? "Actueel" : "Niet actueel"}
                />
              </div>
            </section>
          ) : (
            <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <SectionHeader
                title="Klasgegevens"
                subtitle="Voor leerkrachten is er geen leerlingklas gekoppeld."
              />

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                Als leerkracht hoef je hier geen klas te bevestigen.
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}