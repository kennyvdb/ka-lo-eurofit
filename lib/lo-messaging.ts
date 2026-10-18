export type Audience = "alle_leerlingen" | "alle_leerkrachten" | "iedereen" | "lo_team" | "klasgroepen" | "klassen" | "personen";
export const allowedRoles = ["lo_leerkracht", "leerkracht_lo", "admin"];
export const teacherRoles = ["leerkracht", "lo_leerkracht", "leerkracht_lo", "admin"];
export function validInternalLink(link: string) {
 if (!link) return true;
 if (!link.startsWith("/") || link.startsWith("//") || link.includes("\\") || /[\x00-\x1f\x7f]/.test(link)) return false;
 try { const decoded = decodeURIComponent(link); return decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("\\") && !/[\x00-\x1f\x7f]/.test(decoded); } catch { return false; }
}
