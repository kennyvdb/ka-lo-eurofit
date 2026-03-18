"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KLASSEN, Finaliteit, getKlasMeta } from "@/shared/klassen/klassen";

type Geslacht = "jongen" | "meisje";
type Role = "student" | "teacher";

export default function RegisterPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [voornaam, setVoornaam] = useState("");
  const [naam, setNaam] = useState("");

  const [role, setRole] = useState<Role>("student");
  const [geslacht, setGeslacht] = useState<Geslacht>("jongen");
  const [geboortedatum, setGeboortedatum] = useState("");

  const [klasNaam, setKlasNaam] = useState("");
  const [graad, setGraad] = useState<number>(1);
  const [leerjaar, setLeerjaar] = useState<number>(1);
  const [finaliteit, setFinaliteit] = useState<Finaliteit>("A-stroom");

  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        const msg = String(error.message ?? "").toLowerCase();

        if (
          msg.includes("invalid refresh token") ||
          msg.includes("refresh token not found")
        ) {
          await supabase.auth.signOut({ scope: "local" });
          setLoading(false);
          return;
        }

        setError(error.message);
        setLoading(false);
        return;
      }

      const uid = data.session?.user?.id ?? null;
      if (uid) {
        window.location.replace("/dashboard");
        return;
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const onKlasChange = (newKlas: string) => {
    setKlasNaam(newKlas);

    const meta = getKlasMeta(newKlas);
    if (meta) {
      setGraad(meta.graad);
      setLeerjaar(meta.leerjaar);
      setFinaliteit(meta.finaliteit);
    } else {
      setGraad(1);
      setLeerjaar(1);
      setFinaliteit("A-stroom");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedVoornaam = voornaam.trim();
    const trimmedNaam = naam.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Vul e-mail en wachtwoord in.");
      return;
    }

    if (!trimmedVoornaam || !trimmedNaam) {
      setError("Vul je voornaam en naam in.");
      return;
    }

    if (!geboortedatum) {
      setError("Kies je geboortedatum.");
      return;
    }

    if (role === "student") {
      if (!klasNaam) {
        setError("Kies je klas.");
        return;
      }

      if (!getKlasMeta(klasNaam)) {
        setError("Onbekende klas geselecteerd.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      let uid = signUpData.user?.id ?? null;

      if (!uid) {
        const { data: sessionData } = await supabase.auth.getSession();
        uid = sessionData.session?.user?.id ?? null;
      }

      if (!uid) {
        throw new Error(
          "Registratie gelukt, maar ik vind geen user id. Probeer opnieuw in te loggen."
        );
      }

      const volledigeNaam = `${trimmedVoornaam} ${trimmedNaam}`.trim();
      const rolNL = role === "teacher" ? "leerkracht" : "leerling";
      const meta = role === "student" ? getKlasMeta(klasNaam) : undefined;

      const payload: Record<string, unknown> = {
        id: uid,
        volledige_naam: volledigeNaam,
        geslacht, // 'jongen' of 'meisje'
        geboortedatum, // YYYY-MM-DD
        role, // 'student' of 'teacher'
        rol: rolNL, // 'leerling' of 'leerkracht'
      };

      if (role === "student" && meta) {
        payload.graad = String(meta.graad);
        payload.leerjaar = String(meta.leerjaar);
        payload.finaliteit = meta.finaliteit;
        payload.klas_naam = meta.klas;
        payload.klas_id = null;
      } else {
        payload.graad = null;
        payload.leerjaar = null;
        payload.finaliteit = null;
        payload.klas_naam = null;
        payload.klas_id = null;
      }

      const { error: profError } = await supabase
        .from("profielen")
        .upsert(payload, { onConflict: "id" });

      if (profError) {
        throw new Error(profError.message);
      }

      window.location.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Er is een onbekende fout opgetreden.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                Even laden…
              </div>
              <div className="text-sm text-white/60">Sessie controleren</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-8 bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Registreren
            </h1>
            <p className="mt-1 text-sm text-white/60">Maak je account aan</p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-sm text-rose-200">
              <span className="font-semibold text-rose-100">Oeps:</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                E-mail
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="naam@school.be"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Wachtwoord
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="my-2 h-px bg-white/10" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Voornaam
                </label>
                <input
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Naam
                </label>
                <input
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as Role;
                  setRole(newRole);

                  if (newRole === "teacher") {
                    setKlasNaam("");
                    setGraad(1);
                    setLeerjaar(1);
                    setFinaliteit("A-stroom");
                  }
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="student">Leerling</option>
                <option value="teacher">Leerkracht</option>
              </select>
              <p className="mt-1 text-xs text-white/50">
                Kies “Leerkracht” als je geen klas moet selecteren.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Geslacht
                </label>
                <select
                  value={geslacht}
                  onChange={(e) => setGeslacht(e.target.value as Geslacht)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="jongen">Jongen</option>
                  <option value="meisje">Meisje</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Geboortedatum
                </label>
                <input
                  type="date"
                  value={geboortedatum}
                  max={today}
                  onChange={(e) => setGeboortedatum(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Klas
              </label>
              <select
                value={klasNaam}
                onChange={(e) => onKlasChange(e.target.value)}
                disabled={role !== "student"}
                className={[
                  "h-12 w-full rounded-xl border px-4 text-base transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  role !== "student"
                    ? "border-white/10 bg-white/5 text-white/50"
                    : "border-white/10 bg-white/10 text-white",
                ].join(" ")}
              >
                <option value="">
                  {role === "student" ? "Kies je klas..." : "Niet nodig voor leerkracht"}
                </option>

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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Graad
                </label>
                <input
                  value={`${graad}e graad`}
                  disabled
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">
                  Leerjaar
                </label>
                <input
                  value={String(leerjaar)}
                  disabled
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Finaliteit
              </label>
              <input
                value={finaliteit}
                disabled
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-300 font-semibold text-neutral-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Bezig..." : "Account maken"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/70">
          Al een account?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-200 underline underline-offset-4"
          >
            Inloggen
          </Link>
        </p>
      </div>
    </main>
  );
}