"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { BaseTile } from "@/components/tiles/BaseTile";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function EvaluatiesLeerlingenPage() {
  const [loading, setLoading] = useState(true);
  const [toonHockey, setToonHockey] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        setLoading(false);
        return;
      }

      const { data: profiel, error: profielError } = await supabase
        .from("profielen")
        .select("rol")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profielError) {
        setError("Je evaluaties konden niet worden opgehaald.");
        setLoading(false);
        return;
      }

      const rol = String(profiel?.rol ?? "").toLowerCase();

      if (["lo_leerkracht", "leerkracht_lo", "admin"].includes(rol)) {
        setToonHockey(true);
        setLoading(false);
        return;
      }

      if (rol !== "leerling") {
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "hockey_mijn_resultaten"
      );

      if (!active) return;

      if (rpcError) {
        setError("Je evaluaties konden niet worden opgehaald.");
      } else {
        setToonHockey(Array.isArray(data) && data.length > 0);
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="KA LO App" subtitle="Mijn evaluaties">
      <BaseHero
        label="LES LO · MIJN EVALUATIES"
        title={
          <>
            Mijn{" "}
            <span className="bg-gradient-to-r from-[#255971] via-[#4B8E8D] to-[#89C2AA] bg-clip-text text-transparent">
              evaluaties
            </span>
          </>
        }
        description="Bekijk je eigen beoordelingen tijdens de lessen lichamelijke opvoeding. Ontdek je sterke punten en waar je nog kunt groeien."
        imageSrc="/functional/functionalfitness.png"
        imageAlt="Evaluaties lichamelijke opvoeding"
        quoteTitle="Elke stap telt"
        quote="Leren. Oefenen. Groeien."
        actions={
          <Link
            href="/les-lo"
            className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-black/40 px-5 font-bold text-white transition hover:bg-white/10"
          >
            ← Terug naar Les LO
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        {loading ? (
          <p className="text-white/70">Evaluaties worden geladen…</p>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100"
          >
            {error}
          </div>
        ) : toonHockey ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <BaseTile
              href="/les-lo/evaluaties/hockey"
              icon="🏑"
              title="Hockey"
              desc="Bekijk je techniek, wedstrijdvaardigheden en samenwerking."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            Je hebt momenteel nog geen beschikbare evaluaties.
          </div>
        )}
      </main>
    </AppShell>
  );
}