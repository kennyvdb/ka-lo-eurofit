// lib/auth/requireProfile.ts

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  mapDbRolToAppRole,
  type AppRole,
} from "@/lib/auth/roles";

export type RequiredProfile = {
  user: {
    id: string;
    email: string;
  };

  profiel: any;

  appRole: AppRole;
};

export async function requireProfile(): Promise<RequiredProfile> {
  const supabase = await createClient();

  // -----------------------------
  // Auth gebruiker ophalen
  // -----------------------------
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Niet ingelogd
  if (userError || !user?.email) {
    redirect("/login");
  }

  // -----------------------------
  // Profiel ophalen
  // -----------------------------
  const { data: profiel, error: profielError } =
    await supabase
      .from("profielen")
      .select("*")
      .eq("email", user.email.toLowerCase())
      .single();

  // Geen profiel gevonden
  if (profielError || !profiel) {
    redirect("/login");
  }

  // -----------------------------
  // App role bepalen
  // -----------------------------
  const appRole = mapDbRolToAppRole(
    profiel.rol ?? profiel.role
  );

  // Ongeldige rol
  if (!appRole) {
    redirect("/login");
  }

  // -----------------------------
  // Alles OK
  // -----------------------------
  return {
    user: {
      id: user.id,
      email: user.email,
    },

    profiel,

    appRole,
  };
}