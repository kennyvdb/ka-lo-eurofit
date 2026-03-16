"use client";

import React from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  glass: "rgba(6, 12, 20, 0.42)",
  glass2: "rgba(6, 12, 20, 0.58)",
};

export default function UnderConstructionPage() {
  return (
    <AppShell title="KA LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <style>{css}</style>

      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.badge}>ONDER CONSTRUCTIE</div>

          <div style={styles.iconWrap}>
            <div style={styles.icon}>🚧</div>
          </div>

          <h1 style={styles.title}>Deze pagina is nog in opbouw</h1>

          <p style={styles.text}>
            We werken momenteel aan deze pagina. Kom binnenkort nog eens terug.
          </p>

          <div style={styles.actions}>
            <Link href="/" style={styles.primaryBtn}>
              Naar home
            </Link>

            <button
              type="button"
              onClick={() => window.history.back()}
              style={styles.secondaryBtn}
            >
              Ga terug
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "calc(100vh - 120px)",
    display: "grid",
    placeItems: "center",
    padding: "24px 16px",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 28,
    padding: "32px 24px",
    border: `1px solid ${ui.border}`,
    background: `
      radial-gradient(700px 280px at 0% 0%, rgba(37,89,113,0.22), transparent 60%),
      radial-gradient(700px 280px at 100% 0%, rgba(75,142,141,0.18), transparent 60%),
      radial-gradient(700px 280px at 50% 100%, rgba(137,194,170,0.14), transparent 60%),
      ${ui.glass}
    `,
    boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
    textAlign: "center",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    padding: "0 14px",
    borderRadius: 999,
    border: `1px solid ${ui.border2}`,
    background: "rgba(255,255,255,0.05)",
    color: ui.muted,
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 0.8,
  },

  iconWrap: {
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
  },

  icon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    display: "grid",
    placeItems: "center",
    fontSize: 42,
    border: `1px solid ${ui.border2}`,
    background: "linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35))",
    boxShadow: "0 14px 30px rgba(0,0,0,0.22)",
  },

  title: {
    margin: "22px 0 10px 0",
    color: ui.text,
    fontSize: 32,
    lineHeight: 1.1,
    fontWeight: 980,
  },

  text: {
    margin: "0 auto",
    maxWidth: 520,
    color: ui.muted,
    fontSize: 16,
    lineHeight: 1.6,
  },

  actions: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    height: 46,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "linear-gradient(135deg, rgba(37,89,113,0.72), rgba(75,142,141,0.45))",
    color: ui.text,
    textDecoration: "none",
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
  },

  secondaryBtn: {
    height: 46,
    padding: "0 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.05)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
  },
};

const css = `
  @media (max-width: 640px){
    h1{
      font-size: 26px !important;
    }
  }
`;