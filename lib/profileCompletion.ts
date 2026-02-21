// lib/profileCompletion.ts
import { supabase } from "@/lib/supabaseClient";

export function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export type ProfileCompletion = {
  isReady: boolean;
  missing: string[]; // lijst met ontbrekende velden
  currentSchoolYear: string;
};

export async function checkProfileCompletion(): Promise<ProfileCompletion> {
  const currentSchoolYear = getCurrentSchoolYearBelgium();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return {
      isReady: false,
      missing: ["not_logged_in"],
      currentSchoolYear,
    };
  }

  const userId = authData.user.id;

  const { data: p, error } = await supabase
    .from("profielen")
    .select("geslacht, geboortedatum, graad, leerjaar, finaliteit, klas_naam, schooljaar")
    .eq("id", userId)
    .maybeSingle();

  if (error || !p) {
    return {
      isReady: false,
      missing: ["profiel_niet_gevonden"],
      currentSchoolYear,
    };
  }

  const missing: string[] = [];

  // vaste velden
  if (!p.geslacht) missing.push("geslacht");
  if (!p.geboortedatum) missing.push("geboortedatum");

  // schooljaar velden
  if (!p.graad) missing.push("graad");
  if (!p.leerjaar) missing.push("leerjaar");
  if (!p.finaliteit) missing.push("finaliteit");
  if (!p.klas_naam) missing.push("klas");

  // schooljaar check
  if (p.schooljaar !== currentSchoolYear) missing.push("schooljaar");

  return {
    isReady: missing.length === 0,
    missing,
    currentSchoolYear,
  };
}
