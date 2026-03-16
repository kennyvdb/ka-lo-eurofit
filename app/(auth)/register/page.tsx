"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KLASSEN, Finaliteit, getKlasMeta } from "@/shared/klassen/klassen";

type Geslacht = "M" | "V";
type Role = "student" | "teacher";

export default function RegisterPage() {
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [voornaam, setVoornaam] = useState("");
  const [naam, setNaam] = useState("");
  const [role, setRole] = useState<Role>("student");

  const [geslacht, setGeslacht] = useState<Geslacht>("M");
  const [geboortedatum, setGeboortedatum] = useState<string>("");

  const [graad, setGraad] = useState<number>(1);
  const [leerjaar, setLeerjaar] = useState<number>(1);
  const [finaliteit, setFinaliteit] = useState<Finaliteit>("A-stroom");

  const [klasNaam, setKlasNaam] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        const msg = String(error.message ?? "").toLowerCase();
        if (msg.includes("invalid refresh token") || msg.includes("refresh token not found")) {
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

    run();
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

    if (!email || !password) return setError("Vul e-mail en wachtwoord in.");
    if (!voornaam.trim() || !naam.trim()) return setError("Vul je voornaam en naam in.");
    if (!geboortedatum) return setError("Vul je geboortedatum in.");

    if (role === "student") {
      if (!klasNaam) return setError("Kies je klas.");
      if (!getKlasMeta(klasNaam)) return setError("Onbekende klas geselecteerd.");
    }

    setSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setSubmitting(false);
      setError(signUpError.message);
      return;
    }

    let uid = signUpData.user?.id ?? null;

    if (!uid) {
      const { data: sessData } = await supabase.auth.getSession();
      uid = sessData.session?.user?.id ?? null;
    }

    if (!uid) {
      setSubmitting(false);
      setError("Registratie gelukt, maar ik vind geen user id. Probeer opnieuw in te loggen.");
      return;
    }

    const meta = klasNaam ? getKlasMeta(klasNaam) : undefined;
    const volledigeNaam = `${voornaam.trim()} ${naam.trim()}`.trim();
    const rolNL = role === "teacher" ? "leerkracht" : "leerling";

    const payload: any = {
      id: uid,
      volledige_naam: volledigeNaam,
      geslacht,
      geboortedatum,
      role,
      rol: rolNL,
    };

    if (role === "student" && meta) {
      payload.graad = meta.graad;
      payload.leerjaar = meta.leerjaar;
      payload.finaliteit = meta.finaliteit;
      payload.klas_naam = meta.klas;
    } else {
      payload.graad = null;
      payload.leerjaar = null;
      payload.finaliteit = null;
      payload.klas_naam = null;
      payload.klas_id = null;
    }

    const { error: profError } = await supabase.from("profielen").upsert(payload, { onConflict: "id" });

    if (profError) {
      setSubmitting(false);
      setError(profError.message);
      return;
    }

    window.location.replace("/dashboard");
  };

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 grid place-items-center">
              <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">Even laden…</div>
              <div className="text-sm text-white/60">Sessie controleren</div>
            </div>
          </div>
          <div className="mt-5 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Registreren</h1>
            <p className="mt-1 text-sm text-white/60">Maak je account aan</p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-sm text-rose-200">
              <span className="font-semibold text-rose-100">Oeps:</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="naam@school.be"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                           placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Wachtwoord</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                           placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="my-2 h-px bg-white/10" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Voornaam</label>
                <input
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Naam</label>
                <input
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Rol</label>
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
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
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
                <label className="mb-1 block text-xs font-medium text-white/60">Geslacht</label>
                <select
                  value={geslacht}
                  onChange={(e) => setGeslacht(e.target.value as Geslacht)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="M">M</option>
                  <option value="V">V</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Geboortedatum</label>
                <input
                  type="date"
                  value={geboortedatum}
                  max={today}
                  onChange={(e) => setGeboortedatum(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Klas</label>
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
                <label className="mb-1 block text-xs font-medium text-white/60">Graad</label>
                <input
                  value={`${graad}e graad`}
                  disabled
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Leerjaar</label>
                <input
                  value={String(leerjaar)}
                  disabled
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Finaliteit</label>
              <input
                value={finaliteit}
                disabled
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white/70"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-300
                         text-neutral-950 font-semibold active:scale-[0.98] transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Bezig..." : "Account maken"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/70">
          Al een account?{" "}
          <Link href="/login" className="font-semibold text-cyan-200 underline underline-offset-4">
            Inloggen
          </Link>
        </p>
      </div>
    </main>
  );
}