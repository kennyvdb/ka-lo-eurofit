export type Audience = "alle_leerlingen" | "alle_leerkrachten" | "iedereen" | "lo_team" | "klasgroepen" | "klassen" | "personen";
export const allowedRoles = ["lo_leerkracht", "leerkracht_lo", "admin"];
export const teacherRoles = ["leerkracht", "lo_leerkracht", "leerkracht_lo", "admin"];
export function validInternalLink(link: string) { return !link || (link.startsWith("/") && !link.startsWith("//") && !link.includes("\\")); }
