// lib/auth/roles.ts

export type AppRole =
  | "leerling"
  | "leerkracht"
  | "leerkracht_lo"
  | "administratief_personeel";

export const SCHOOL_DOMAIN = "go-atheneumavelgem.be";

/* --------------------------------------------------
   EMAIL HELPERS
-------------------------------------------------- */

export function normalizeEmail(
  email: string | null | undefined
): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function isSchoolEmail(
  email: string | null | undefined
): boolean {
  const normalized = normalizeEmail(email);

  return normalized.endsWith(`@${SCHOOL_DOMAIN}`);
}

export function isAllowedEmail(
  email: string | null | undefined
): boolean {
  return isSchoolEmail(email);
}

/* --------------------------------------------------
   ROLE HELPERS
-------------------------------------------------- */

export function isLeerling(
  role: AppRole | null | undefined
): boolean {
  return role === "leerling";
}

export function isLeerkracht(
  role: AppRole | null | undefined
): boolean {
  return (
    role === "leerkracht" ||
    role === "leerkracht_lo"
  );
}

export function isLeerkrachtLo(
  role: AppRole | null | undefined
): boolean {
  return role === "leerkracht_lo";
}

export function isAdministratiefPersoneel(
  role: AppRole | null | undefined
): boolean {
  return role === "administratief_personeel";
}

export function requiresClassInfo(
  role: AppRole | null | undefined
): boolean {
  return role === "leerling";
}

/* --------------------------------------------------
   LABELS
-------------------------------------------------- */

export function getRoleLabel(
  role: AppRole | null | undefined
): string {
  switch (role) {
    case "leerling":
      return "Leerling";

    case "leerkracht":
      return "Leerkracht";

    case "leerkracht_lo":
      return "Leerkracht LO";

    case "administratief_personeel":
      return "Administratief personeel";

    default:
      return "Onbekend";
  }
}

/* --------------------------------------------------
   DATABASE → APP ROLE
-------------------------------------------------- */

export function mapDbRolToAppRole(
  dbRol: string | null | undefined
): AppRole | null {
  const normalized = String(dbRol ?? "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "leerling":
    case "student":
      return "leerling";

    case "leerkracht":
    case "teacher":
      return "leerkracht";

    case "leerkracht lo":
    case "lo-leerkracht":
    case "lo leerkracht":
      return "leerkracht_lo";

    case "administratief personeel":
    case "admin":
    case "administrator":
      return "administratief_personeel";

    default:
      return null;
  }
}