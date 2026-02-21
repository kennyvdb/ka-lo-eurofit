"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        const msg = String(error.message ?? "").toLowerCase();
        if (msg.includes("invalid refresh token") || msg.includes("refresh token not found")) {
          await supabase.auth.signOut({ scope: "local" });
          window.location.replace("/login");
          return;
        }
        window.location.replace("/login");
        return;
      }

      const uid = data.session?.user?.id ?? null;
      window.location.replace(uid ? "/dashboard" : "/login");
    };

    run();
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gray-100 grid place-items-center">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">Even laden…</div>
              <div className="text-sm text-gray-600">Je sessie wordt gecontroleerd</div>
            </div>
          </div>

          <div className="mt-5 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-10 w-full rounded-xl bg-gray-100" />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Tip: voeg deze site toe aan je beginscherm voor een app-gevoel.
        </p>
      </div>
    </main>
  );
}
