import {
  AppRole,
  normalizeEmail,
} from "@/lib/auth/roles";

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
};

type ProfielPayload = {
  id: string;
  email: string;
  volledige_naam: string;
  role: "student" | "teacher";
  rol:
    | "leerling"
    | "leerkracht"
    | "leerkracht LO"
    | "administratief personeel";
  rol_bevestigd: boolean;
};

export function getFullNameFromUser(user: SupabaseUserLike): string {
  const meta = user.user_metadata ?? {};

  const fullName =
    String(meta.full_name ?? "").trim() ||
    String(meta.name ?? "").trim() ||
    [meta.given_name, meta.family_name]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (fullName) return fullName;

  const email = normalizeEmail(user.email);

  if (!email) return "Onbekende gebruiker";

  return email.split("@")[0];
}

export function mapAppRoleToLegacyFields(appRole: AppRole): {
  role: "student" | "teacher";
  rol:
    | "leerling"
    | "leerkracht"
    | "leerkracht LO"
    | "administratief personeel";
} {
  switch (appRole) {
    case "leerling":
      return {
        role: "student",
        rol: "leerling",
      };

    case "leerkracht":
      return {
        role: "teacher",
        rol: "leerkracht",
      };

    case "leerkracht_lo":
      return {
        role: "teacher",
        rol: "leerkracht LO",
      };

    case "administratief_personeel":
      return {
        role: "teacher",
        rol: "administratief personeel",
      };

    default:
      return {
        role: "student",
        rol: "leerling",
      };
  }
}

/**
 * Tijdelijk basisprofiel.
 * Wordt later overschreven door Smartschool-sync.
 */
export function buildInitialProfielPayload(
  user: SupabaseUserLike
): ProfielPayload {
  const email = normalizeEmail(user.email);

  return {
    id: user.id,
    email,
    volledige_naam: getFullNameFromUser(user),

    // Tijdelijke defaults
    role: "student",
    rol: "leerling",

    // Smartschool wordt later de waarheid
    rol_bevestigd: true,
  };
}