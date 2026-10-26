"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HockeyPage from "@/app/les-lo/evaluaties/hockey/page";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const LO_ROLES = new Set(["lo_leerkracht", "leerkracht_lo", "admin"]);

export default function HockeyLeerkrachtenPage() {
  const [toegang, setToegang] = useState<
    "laden" | "toegelaten" | "geweigerd"
  >("laden");

  useEffect(() => {
    let actief = true;

    async function controleer() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        if (actief) setToegang("geweigerd");
        return;
      }

      const { data, error } = await supabase
        .from("profielen")
        .select("rol")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (actief) {
        setToegang(
          !error &&
            LO_ROLES.has(String(data?.rol ?? "").toLowerCase())
            ? "toegelaten"
            : "geweigerd"
        );
      }
    }

    void controleer();

    return () => {
      actief = false;
    };
  }, []);

  if (toegang === "toegelaten") {
    return <HockeyPage />;
  }

  return (
    <AppShell
      title="KA LO App"
      subtitle="Hockey · leerkrachten"
      userName={null}
    >
      <main className="mx-auto max-w-4xl px-4 py-12 text-white">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-8">
          <h1 className="text-2xl font-black">
            Hockey · leerkrachten LO
          </h1>

          <p className="mt-3 text-white/70">
            {toegang === "laden"
              ? "Toegangsrechten controleren…"
              : "Deze pagina is uitsluitend toegankelijk voor LO-leerkrachten en beheerders."}
          </p>

          {toegang === "geweigerd" && (
            <Link
              href="/les-lo/evaluaties/hockey"
              className="mt-5 inline-block rounded-xl bg-[#4B8E8D] px-5 py-3 font-bold"
            >
              Naar Hockey voor leerlingen →
            </Link>
          )}
        </div>
      </main>
    </AppShell>
  );
}