"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ bij openen: check session (en vang refresh token fout af)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Vul e-mail en wachtwoord in.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setSubmitting(false);
      setError(error.message);
      return;
    }

    if (data.session?.user?.id) {
      window.location.replace("/dashboard");
      return;
    }

    setSubmitting(false);
    setError("Login gelukt, maar geen sessie gevonden. Probeer opnieuw.");
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
    <main className="min-h-dvh grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Inloggen</h1>
            <p className="mt-1 text-sm text-white/60">Log in om verder te gaan</p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-sm text-rose-200">
              <span className="font-semibold text-rose-100">Oeps:</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                           placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="naam@school.be"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Wachtwoord</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-base text-white
                           placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-300
                         text-neutral-950 font-semibold active:scale-[0.98] transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Bezig..." : "Inloggen"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/70">
          Nog geen account?{" "}
          <Link href="/register" className="font-semibold text-cyan-200 underline underline-offset-4">
            Registreer
          </Link>
        </p>
      </div>
    </main>
  );
}
