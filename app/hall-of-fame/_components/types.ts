export type Entry = { name: string; record: string; extra?: string };

export type GenderSet = {
  allTime: Entry[];
  schoolYear: Entry[];
};

export type Discipline = {
  key: string;
  title: string;
  boys: GenderSet;
  girls: GenderSet;
  isTriatlon?: boolean;
};

export type ThemeName = "blue" | "green" | "greenDark";

export type ThemeVars = {
  header: string;
  headerEdge: string;
  panel: string;
  panelEdge: string;
  block: string;
  blockEdge: string;
  titlePill: string;
  subPill: string;
};