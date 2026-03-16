// shared/klassen/klassen.ts

export type Finaliteit =
  | "A-stroom"
  | "B-stroom"
  | "Arbeidsmarkt"
  | "Doorstroom"
  | "Dubbele finaliteit";

export interface KlasMeta {
  klas: string;
  graad: number;
  leerjaar: number;
  finaliteit: Finaliteit;
}

// ✅ Klassenlijst + metadata
export const KLASSEN: KlasMeta[] = [
  { klas: "1 A A", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 A B", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 A C", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 A D", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 A E", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 A F", graad: 1, leerjaar: 1, finaliteit: "A-stroom" },
  { klas: "1 TOP A", graad: 1, leerjaar: 1, finaliteit: "B-stroom" },
  { klas: "1 TOP B", graad: 1, leerjaar: 1, finaliteit: "B-stroom" },

  { klas: "2 E&O B", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 KLATA A", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 MAWE C", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 MAWE D", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 MT&W A", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 MT&W B", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 STEM C", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 STEM D", graad: 1, leerjaar: 2, finaliteit: "A-stroom" },
  { klas: "2 TOP - M&W", graad: 1, leerjaar: 2, finaliteit: "B-stroom" },
  { klas: "2 TOP - STEM", graad: 1, leerjaar: 2, finaliteit: "B-stroom" },

  { klas: "3 AM HOUT", graad: 2, leerjaar: 3, finaliteit: "Arbeidsmarkt" },
  { klas: "3 AM MECH", graad: 2, leerjaar: 3, finaliteit: "Arbeidsmarkt" },
  { klas: "3 AM ZORG", graad: 2, leerjaar: 3, finaliteit: "Arbeidsmarkt" },
  { klas: "3 DS BIOTECH", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS ECWE", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS HUWE", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS LAT", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS MAWE", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS MOTA", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS NAWE", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DS TEWE", graad: 2, leerjaar: 3, finaliteit: "Doorstroom" },
  { klas: "3 DF B&O", graad: 2, leerjaar: 3, finaliteit: "Dubbele finaliteit" },
  { klas: "3 DF ELTE", graad: 2, leerjaar: 3, finaliteit: "Dubbele finaliteit" },
  { klas: "3 DF M&W", graad: 2, leerjaar: 3, finaliteit: "Dubbele finaliteit" },

  { klas: "4 AM HOUT", graad: 2, leerjaar: 4, finaliteit: "Arbeidsmarkt" },
  { klas: "4 AM MECH", graad: 2, leerjaar: 4, finaliteit: "Arbeidsmarkt" },
  { klas: "4 AM ZORG", graad: 2, leerjaar: 4, finaliteit: "Arbeidsmarkt" },
  { klas: "4 DS BIOTECH", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS ECWE", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS HUWE", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS LAT", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS MAWE", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS MOTA", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS NAWE", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DS TEWE", graad: 2, leerjaar: 4, finaliteit: "Doorstroom" },
  { klas: "4 DF B&O", graad: 2, leerjaar: 4, finaliteit: "Dubbele finaliteit" },
  { klas: "4 DF ELTE", graad: 2, leerjaar: 4, finaliteit: "Dubbele finaliteit" },
  { klas: "4 DF M&W", graad: 2, leerjaar: 4, finaliteit: "Dubbele finaliteit" },

  { klas: "5 AM BBS", graad: 3, leerjaar: 5, finaliteit: "Arbeidsmarkt" },
  { klas: "5 AM MECH", graad: 3, leerjaar: 5, finaliteit: "Arbeidsmarkt" },
  { klas: "5 AM BAZO", graad: 3, leerjaar: 5, finaliteit: "Arbeidsmarkt" },
  { klas: "5 DS BIOTECH", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS ECMT", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS HUWE", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS LAMT", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS LAWI", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS MOTA", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS TEWE", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS WEWE", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DS WEWI", graad: 3, leerjaar: 5, finaliteit: "Doorstroom" },
  { klas: "5 DF COMO", graad: 3, leerjaar: 5, finaliteit: "Dubbele finaliteit" },
  { klas: "5 DF ELTE", graad: 3, leerjaar: 5, finaliteit: "Dubbele finaliteit" },
  { klas: "5 DF GEZO", graad: 3, leerjaar: 5, finaliteit: "Dubbele finaliteit" },
  { klas: "5 DF O&B", graad: 3, leerjaar: 5, finaliteit: "Dubbele finaliteit" },

  { klas: "6 AM BBS", graad: 3, leerjaar: 6, finaliteit: "Arbeidsmarkt" },
  { klas: "6 AM MECH", graad: 3, leerjaar: 6, finaliteit: "Arbeidsmarkt" },
  { klas: "6 AM BAZO", graad: 3, leerjaar: 6, finaliteit: "Arbeidsmarkt" },
  { klas: "6 DS BIOTECH", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS ECMT", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS ECWI", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS HUWE", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS LAMT", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS LAWI", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS MOTA", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS TEWE", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS WEWE", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DS WEWI", graad: 3, leerjaar: 6, finaliteit: "Doorstroom" },
  { klas: "6 DF COMO", graad: 3, leerjaar: 6, finaliteit: "Dubbele finaliteit" },
  { klas: "6 DF ELTE", graad: 3, leerjaar: 6, finaliteit: "Dubbele finaliteit" },
  { klas: "6 DF GEZO", graad: 3, leerjaar: 6, finaliteit: "Dubbele finaliteit" },
  { klas: "6 DF O&B", graad: 3, leerjaar: 6, finaliteit: "Dubbele finaliteit" },
];


// 🔎 Helper: metadata van een klas ophalen
export function getKlasMeta(klasNaam: string): KlasMeta | undefined {
  return KLASSEN.find((k) => k.klas === klasNaam);
}