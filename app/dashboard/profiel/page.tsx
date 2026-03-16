"use client";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { KLASSEN, getKlasMeta } from "@/shared/klassen/klassen";

type Profile = {
  id: string;
  volledige_naam: string | null;
  geslacht: "M" | "V" | null;
  geboortedatum: string | null;
  graad: string | null;
  leerjaar: string | null;
  finaliteit: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
  role: "student" | "teacher" | null;
};

const emptyProfile: Profile = {
  id: "",
  volledige_naam: null,
  geslacht: null,
  geboortedatum: null,
  graad: null,
  leerjaar: null,
  finaliteit: null,
  klas_naam: null,
  schooljaar: null,
  schooljaar_bevestigd_op: null,
  role: null,
};

const ui = {
  text: "#EEF4FF",
  muted: "rgba(238,244,255,0.72)",
  muted2: "rgba(238,244,255,0.54)",
  errorBg: "rgba(255,107,129,0.14)",
  errorBorder: "rgba(255,107,129,0.26)",
  successBg: "rgba(34,197,94,0.14)",
  successBorder: "rgba(34,197,94,0.26)",
  warnBg: "rgba(247,198,107,0.12)",
  warnBorder: "rgba(247,198,107,0.28)",
};

function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 9) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function splitName(full: string | null) {
  const s = (full ?? "").trim().replace(/\s+/g, " ");
  if (!s) return { firstName: "", lastName: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function joinName(firstName: string, lastName: string) {
  return `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim() || null;
}

function getMessageTone(message: string) {
  const isError =
    message.includes("mislukt") ||
    message.includes("Fout") ||
    message.includes("Kies eerst") ||
    message.includes("Ongeldige");

  if (isError) {
    return {
      bg: ui.errorBg,
      border: ui.errorBorder,
      textClass: "text-white",
    };
  }

  return {
    bg: ui.successBg,
    border: ui.successBorder,
    textClass: "text-white",
  };
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
}) {
  const className =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-red-400/20 bg-red-400/10 text-red-200";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold",
        className,
      ].join(" ")}
    >
      {children}
    </span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-black text-white">{label}</label>
      {children}
    </div>
  );
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-black uppercase tracking-[0.08em] text-white/50">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-white">{value}</div>
    </div>
  );
}

export default function ProfielPage() {
  const [loading, setLoading] = useState(true);
  const [savingFixed, setSavingFixed] = useState(false);
  const [savingYear, setSavingYear] = useState(false);

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const currentSchoolYear = useMemo(() => getCurrentSchoolYearBelgium(), []);
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
      setEmail(authData.user.email ?? "");

      const { data, error } = await supabase
        .from("profielen")
        .select(
          "id, volledige_naam, geslacht, geboortedatum, graad, leerjaar, finaliteit, klas_naam, schooljaar, schooljaar_bevestigd_op, role"
        )
        .eq("id", userId)
        .maybeSingle<Profile>();

      if (error) {
        setMessage(`Fout bij laden: ${error.message}`);
        const fallback = { ...emptyProfile, id: userId };
        setProfile(fallback);
        const n = splitName(fallback.volledige_naam);
        setFirstName(n.firstName);
        setLastName(n.lastName);
        setLoading(false);
        return;
      }

      const p = data ?? { ...emptyProfile, id: userId };
      setProfile(p);

      const n = splitName(p.volledige_naam);
      setFirstName(n.firstName);
      setLastName(n.lastName);

      setLoading(false);
    };

    load();
  }, []);

  const roleLabel =
    profile.role === "teacher"
      ? "Leerkracht"
      : profile.role === "student"
      ? "Leerling"
      : "Leerling";

  async function saveFixedProfile() {
    setSavingFixed(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      window.location.href = "/login";
      return;
    }

    const userId = authData.user.id;

    const payload = {
      id: userId,
      volledige_naam: joinName(firstName, lastName),
      geslacht: profile.geslacht || null,
      geboortedatum: profile.geboortedatum || null,
    };

    const { error } = await supabase
      .from("profielen")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(`Opslaan mislukt: ${error.message}`);
    } else {
      setProfile((p) => ({ ...p, volledige_naam: payload.volledige_naam }));
      setMessage("Vaste gegevens opgeslagen ✅");
    }

    setSavingFixed(false);
  }

  async function confirmSchoolYearAndSaveClassOnly() {
    setSavingYear(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      window.location.href = "/login";
      return;
    }

    const userId = authData.user.id;

    if (!profile.klas_naam || !profile.klas_naam.trim()) {
      setMessage("Kies eerst je klas.");
      setSavingYear(false);
      return;
    }

    const meta = getKlasMeta(profile.klas_naam.trim());

    if (!meta) {
      setMessage("Ongeldige klas geselecteerd.");
      setSavingYear(false);
      return;
    }

    const payload = {
      id: userId,
      klas_naam: meta.klas,
      graad: String(meta.graad),
      leerjaar: String(meta.leerjaar),
      finaliteit: meta.finaliteit,
      schooljaar: currentSchoolYear,
      schooljaar_bevestigd_op: todayISO(),
    };

    const { error } = await supabase
      .from("profielen")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(`Bevestigen mislukt: ${error.message}`);
    } else {
      setProfile((p) => ({
        ...p,
        klas_naam: payload.klas_naam,
        graad: payload.graad,
        leerjaar: payload.leerjaar,
        finaliteit: payload.finaliteit,
        schooljaar: currentSchoolYear,
        schooljaar_bevestigd_op: payload.schooljaar_bevestigd_op,
      }));
      setMessage(`Schooljaar ${currentSchoolYear} bevestigd ✅`);
    }

    setSavingYear(false);
  }

  const messageTone = message ? getMessageTone(message) : null;

  return (
    <AppShell
      title="LO App"
      subtitle="Profiel"
      userName={profile.volledige_naam ?? null}
    >
      <BaseHero
        label="ACCOUNT"
        title={<>Profiel</>}
        description={
          <>
            Beheer je persoonlijke gegevens en bevestig je klas voor het huidige
            schooljaar.
          </>
        }
        imageSrc="/profiel/profiel.png"
        imageAlt="Profiel overzicht"
        quoteTitle="Profiel"
        quote="Hou je vaste gegevens up-to-date en bevestig elk schooljaar je klas."
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
              {roleLabel}
            </span>

            {!!email && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75">
                {email}
              </span>
            )}
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
          {!!message && messageTone && (
            <div
              className="mt-4 rounded-[20px] border p-4 text-sm text-white"
              style={{
                background: messageTone.bg,
                borderColor: messageTone.border,
              }}
            >
              {message}
            </div>
          )}

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <SectionHeader
              title="Schooljaar"
              subtitle="Controleer of je gegevens bevestigd zijn voor het actieve schooljaar."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoTile label="Huidig schooljaar" value={currentSchoolYear} />

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-black uppercase tracking-[0.08em] text-white/50">
                  Status
                </div>
                <div className="mt-3">
                  {schoolYearIsCurrent ? (
                    <StatusBadge tone="success">Bevestigd</StatusBadge>
                  ) : (
                    <StatusBadge tone="error">
                      Opnieuw bevestigen vereist
                    </StatusBadge>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <SectionHeader
              title="Vaste gegevens"
              subtitle="Deze gegevens wijzigen niet per schooljaar."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Voornaam">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="min-h-[46px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="Voornaam"
                />
              </Field>

              <Field label="Naam">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="min-h-[46px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="Naam"
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Geslacht">
                <select
                  value={profile.geslacht ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      geslacht: (e.target.value || null) as "M" | "V" | null,
                    }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Kies…</option>
                  <option value="M">M</option>
                  <option value="V">V</option>
                </select>
              </Field>

              <Field label="Geboortedatum">
                <input
                  type="date"
                  value={profile.geboortedatum ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      geboortedatum: e.target.value || null,
                    }))
                  }
                  className="min-h-[46px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-start">
              <button
                type="button"
                onClick={saveFixedProfile}
                disabled={savingFixed}
                className="inline-flex h-11 items-center rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-black text-white transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingFixed ? "Opslaan…" : "Opslaan vaste gegevens"}
              </button>
            </div>
          </section>

          <section className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <SectionHeader
              title="Gegevens voor dit schooljaar"
              subtitle="Hier bevestig je je klas voor het actieve schooljaar."
            />

            {!schoolYearIsCurrent && (
              <div
                className="mb-5 rounded-[20px] border p-4 text-sm leading-6 text-white"
                style={{
                  background: ui.warnBg,
                  borderColor: ui.warnBorder,
                }}
              >
                Bevestig opnieuw voor <b>{currentSchoolYear}</b>. Je kan hier
                enkel je klas aanpassen.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadOnlyField
                label="Graad"
                value={profile.graad ? `${profile.graad}e graad` : "—"}
              />
              <ReadOnlyField
                label="Leerjaar"
                value={profile.leerjaar ?? "—"}
              />
              <ReadOnlyField
                label="Finaliteit"
                value={profile.finaliteit ?? "—"}
              />
              <ReadOnlyField
                label="Schooljaar (opgeslagen)"
                value={profile.schooljaar ?? "—"}
              />
            </div>

            <div className="mt-4">
              <Field label="Klas">
                <select
                  value={profile.klas_naam ?? ""}
                  onChange={(e) => {
                    const newKlas = e.target.value;
                    const meta = getKlasMeta(newKlas);

                    setProfile((p) => ({
                      ...p,
                      klas_naam: newKlas || null,
                      graad: meta ? String(meta.graad) : p.graad,
                      leerjaar: meta ? String(meta.leerjaar) : p.leerjaar,
                      finaliteit: meta ? meta.finaliteit : p.finaliteit,
                    }));
                  }}
                  className="min-h-[46px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Kies je klas…</option>

                  <optgroup label="1e graad">
                    {KLASSEN.filter((k) => k.graad === 1).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="2e graad">
                    {KLASSEN.filter((k) => k.graad === 2).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="3e graad">
                    {KLASSEN.filter((k) => k.graad === 3).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={confirmSchoolYearAndSaveClassOnly}
                disabled={savingYear}
                className="inline-flex h-11 items-center rounded-2xl border border-white/15 bg-black/40 px-4 text-sm font-black text-white transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingYear
                  ? "Bevestigen…"
                  : `Bevestig schooljaar ${currentSchoolYear}`}
              </button>

              <div className="text-sm text-white/55">
                Laatste bevestiging:{" "}
                <b className="text-white">
                  {profile.schooljaar_bevestigd_op
                    ? profile.schooljaar_bevestigd_op
                    : "—"}
                </b>
              </div>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}