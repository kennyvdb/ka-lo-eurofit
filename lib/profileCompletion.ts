// lib/profileCompletion.ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export type ProfileCompletion = {
  isReady: boolean;
  missing: string[];
  currentSchoolYear: string;
};

const PROFILE_EXEMPT_ROLES = [
  "leerkracht",
  "administratief personeel",
  "lo-leerkracht",
  "lo leerkracht",
  "lo_leerkracht",
  "admin",
];

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

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
    .select("rol, geslacht, geboortedatum, graad, leerjaar, finaliteit, klas_naam, schooljaar")
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
  const rol = normalizeRole(p.rol);
  const isExemptRole = PROFILE_EXEMPT_ROLES.map(normalizeRole).includes(rol);

  if (!p.geslacht) missing.push("geslacht");
  if (!p.geboortedatum) missing.push("geboortedatum");

  if (!isExemptRole) {
    if (!p.graad) missing.push("graad");
    if (!p.leerjaar) missing.push("leerjaar");
    if (!p.finaliteit) missing.push("finaliteit");
    if (!p.klas_naam) missing.push("klas");

    if (p.schooljaar !== currentSchoolYear) missing.push("schooljaar");
  }

  return {
    isReady: missing.length === 0,
    missing,
    currentSchoolYear,
  };
}