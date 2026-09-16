/** Suggestie schooljaar o.b.v. huidige datum */
export function getSuggestedSchooljaar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function normalizeGender(value: unknown): "jongen" | "meisje" | "onbekend" {
  const v = String(value ?? "").trim().toLowerCase();
  if (["m", "man", "jongen", "male"].includes(v)) return "jongen";
  if (["v", "vrouw", "meisje", "female"].includes(v)) return "meisje";
  return "onbekend";
}

export function formatRecord(
  scoreNummer: number | null,
  scoreTekst: string | null,
  eenheid: string | null
) {
  if (scoreNummer !== null && scoreNummer !== undefined) {
    const value = Number.isInteger(scoreNummer)
      ? String(scoreNummer)
      : String(scoreNummer).replace(".", ",");
    return `${value}${eenheid ? ` ${eenheid}` : ""}`;
  }
  return scoreTekst?.trim() || "—";
}
