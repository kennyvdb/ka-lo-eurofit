"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        await supabase.auth.signOut({ scope: "local" });
        setLoading(false);
        return;
      }

      if (user) {
        const { data: profiel, error: profielError } = await supabase
          .from("profielen")
          .select("id, rol, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profielError || !profiel) {
          await supabase.auth.signOut({ scope: "local" });
          setLoading(false);
          return;
        }

        window.location.replace("/dashboard");
        return;
      }

      setLoading(false);
    };

    run();
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setSubmitting(false);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 bg-neutral-950">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 grid place-items-center">
              <div className="h-5 w-5 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
            </div>

            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                Even laden…
              </div>
              <div className="text-sm text-white/60">
                Sessie controleren
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col bg-neutral-950 px-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Inloggen
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Log in met je Google schoolaccount
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/15 p-3 text-sm text-rose-200">
                <span className="font-semibold text-rose-100">Oeps:</span>{" "}
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-300 text-neutral-950 font-semibold active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Bezig..." : "Inloggen met Google"}
              </button>

              <p className="text-center text-xs text-white/50">
                Gebruik je schoolaccount van GO! Atheneum Avelgem.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="pb-6 text-center">
        <div className="flex items-center justify-center gap-3 text-xs text-white/40">
          <Link
            href="/privacy"
            className="transition hover:text-white/70"
          >
            Privacy
          </Link>

          <span aria-hidden="true">·</span>

          <Link
            href="/cookies"
            className="transition hover:text-white/70"
          >
            Cookies
          </Link>

          <span aria-hidden="true">·</span>

          <span>GO! Atheneum Avelgem</span>
        </div>
      </footer>
    </main>
  );
}