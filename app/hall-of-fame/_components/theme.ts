import type { ThemeName, ThemeVars } from "./types";

export const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
};

export function themeVars(theme: ThemeName): ThemeVars {
  if (theme === "blue") {
    return {
      header: "rgba(18, 86, 135, 0.92)",
      headerEdge: "rgba(255,255,255,0.16)",
      panel: "rgba(14, 70, 115, 0.35)",
      panelEdge: "rgba(130, 200, 255, 0.18)",
      block: "rgba(12, 54, 86, 0.55)",
      blockEdge: "rgba(255,255,255,0.14)",
      titlePill: "rgba(0,0,0,0.25)",
      subPill: "rgba(0,0,0,0.22)",
    };
  }

  if (theme === "green") {
    return {
      header: "rgba(10, 112, 88, 0.92)",
      headerEdge: "rgba(255,255,255,0.16)",
      panel: "rgba(9, 97, 75, 0.35)",
      panelEdge: "rgba(120, 255, 210, 0.18)",
      block: "rgba(8, 74, 58, 0.55)",
      blockEdge: "rgba(255,255,255,0.14)",
      titlePill: "rgba(0,0,0,0.25)",
      subPill: "rgba(0,0,0,0.22)",
    };
  }

  return {
    header: "rgba(14, 120, 62, 0.92)",
    headerEdge: "rgba(255,255,255,0.16)",
    panel: "rgba(11, 98, 52, 0.35)",
    panelEdge: "rgba(160, 255, 190, 0.16)",
    block: "rgba(9, 72, 40, 0.58)",
    blockEdge: "rgba(255,255,255,0.14)",
    titlePill: "rgba(0,0,0,0.25)",
    subPill: "rgba(0,0,0,0.22)",
  };
}