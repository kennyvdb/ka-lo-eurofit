"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function KoppelSmartschoolPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Niet ingelogd.");
      }

      const schoolEmail = authData.user.email;

      if (!schoolEmail) {
        throw new Error("Geen schoolmail gevonden.");
      }

      const cleanedUsername = username.trim().toUpperCase();

      if (!cleanedUsername) {
        throw new Error("Vul je Smartschool gebruikersnaam in.");
      }

      const { data: smartschoolUser, error: smartschoolError } =
        await supabase
          .from("smartschool_users")
          .select("*")
          .ilike("username", cleanedUsername)
          .maybeSingle();

      if (smartschoolError) {
        throw new Error(smartschoolError.message);
      }

      if (!smartschoolUser) {
        throw new Error("Smartschool gebruikersnaam niet gevonden.");
      }

      const { error: insertError } = await supabase
        .from("teacher_login_emails")
        .upsert({
          school_email: schoolEmail.toLowerCase(),
          smartschool_username: smartschoolUser.username,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      window.location.replace("/auth/callback");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Er ging iets mis.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-neutral-950 text-white grid place-items-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h1 className="text-2xl font-bold">
          Smartschool koppelen
        </h1>

        <p className="mt-3 text-sm text-white/70">
          Je schoolmail werd niet rechtstreeks gevonden in Smartschool.
          Vul éénmalig je Smartschool gebruikersnaam in.
        </p>

        <div className="mt-5">
          <label className="block text-sm mb-2">
            Smartschool gebruikersnaam
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="bv. VDBOK"
            className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 outline-none"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleLink}
          disabled={loading}
          className="mt-5 w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-300 text-black font-bold disabled:opacity-60"
        >
          {loading ? "Koppelen..." : "Koppelen"}
        </button>
      </div>
    </main>
  );
}