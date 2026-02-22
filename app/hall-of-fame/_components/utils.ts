import type { Discipline, Entry } from "./types";

/** Suggestie schooljaar o.b.v. huidige datum */
export function getSuggestedSchooljaar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/** Zet triatlon in het midden (ongeveer). */
export function withTriatlonInMiddle(list: Discipline[]) {
  const triIndex = list.findIndex((d) => d.isTriatlon);
  if (triIndex === -1) return list;

  const tri = list[triIndex];
  const rest = list.filter((_, i) => i !== triIndex);

  const mid = Math.floor(rest.length / 2);
  return [...rest.slice(0, mid), tri, ...rest.slice(mid)];
}

/** Helper: maakt snel placeholder discipline aan */
export function mkDiscipline(key: string, title: string, isTriatlon = false): Discipline {
  const placeholder3 = (): Entry[] => [
    { name: "Naam leerling", record: "—" },
    { name: "Naam leerling", record: "—" },
    { name: "Naam leerling", record: "—" },
  ];

  return {
    key,
    title,
    isTriatlon,
    boys: {
      allTime: placeholder3(),
      schoolYear: placeholder3(),
    },
    girls: {
      allTime: placeholder3(),
      schoolYear: placeholder3(),
    },
  };
}