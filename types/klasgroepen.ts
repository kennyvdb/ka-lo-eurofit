export type KlasgroepFilters = {
  leerjaarFilter?: string;
  klasFilter?: string;
  loGroepFilter?: string;
  geslachtFilter?: string;
};

export type Klasgroep = {
  id: string;
  naam: string;
  schooljaar: string;
  leerkracht_id: string;
  omschrijving: string | null;
  filters: KlasgroepFilters | null;
  aangemaakt_op: string;
  bijgewerkt_op: string;
};

export type KlasgroepLid = {
  koppeling_id: string;
  klasgroep_id: string;
  klasgroep_naam: string;
  schooljaar: string;
  leerkracht_id: string;
  positie: number;
  leerling_email: string;
  profiel_id: string | null;
  volledige_naam: string;
  given_name: string;
  family_name: string;
  username: string;
  klas_naam: string;
  lo_groepen: string;
  geslacht: "M" | "V" | null;
};

export type KlasgroepOptie = Pick<
  Klasgroep,
  "id" | "naam" | "schooljaar" | "omschrijving"
>;