"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import React from "react";
import { PageHero, SquareTile, ui } from "./_ui";

export default function LesLOHubPage() {
  // 👉 Later kan dit uit Supabase profiel komen
  const userName: string | null = null;

  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={userName}>
      <PageHero
        kicker="LES LO"
        title={
          <>
            Les LO hub <span style={{ opacity: 0.85 }}>🏃‍♂️</span>
          </>
        }
        subtitle={
          <>
            Alles voor de les: <b style={{ color: ui.text }}>kijkwijzers</b>,{" "}
            <b style={{ color: ui.text }}>rollen</b>, <b style={{ color: ui.text }}>jaarplanning</b>,{" "}
            <b style={{ color: ui.text }}>evaluaties</b> en <b style={{ color: ui.text }}>afspraken</b>.
          </>
        }
        right={
          <>
            <div style={{ fontWeight: 950, color: ui.text, fontSize: 13 }}>Snelkoppelingen</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <MiniLink href="/les-lo/kijkwijzers" label="Kijkwijzers →" />
              <MiniLink href="/les-lo/rollen" label="Rollenkaarten →" />
              <MiniLink href="/les-lo/jaarplanning" label="Jaarplanning →" />
              <MiniLink href="/les-lo/evaluaties" label="Evaluaties →" />
              <MiniLink href="/les-lo/afspraken" label="Afspraken LO →" />
            </div>
          </>
        }
      />

      {/* HUB tiles */}
      <section style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text }}>Les LO</div>

        <div className="hub-grid">
          <SquareTile href="/les-lo/kijkwijzers" icon="👀" title="Kijkwijzers" desc="Waarop letten tijdens de les" />
          <SquareTile href="/les-lo/rollen" icon="🎭" title="Rollenkaarten" desc="Scheidsrechter, coach, timekeeper…" />
          <SquareTile href="/les-lo/jaarplanning" icon="🗓️" title="Jaarplanning" desc="Kies je leerkracht & planning" />
          <SquareTile href="/les-lo/evaluaties" icon="✅" title="Evaluaties" desc="Rubrics (SAM) & feedback" />

          <SquareTile href="/les-lo/afspraken" icon="📌" title="Afspraken LO" desc="Regels, veiligheid & afspraken" />
          <SquareTile href="/links" icon="🔗" title="Links" desc="Handige bronnen" />
          <SquareTile href="/dashboard" icon="🏠" title="Dashboard" desc="Terug naar start" />
          <SquareTile href="/ideeenbus" icon="💡" title="Ideeënbus" desc="Geef ideeën / feedback" />
        </div>

        <style jsx>{`
          .hub-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media (min-width: 900px) {
            .hub-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>
    </AppShell>
  );
}

function MiniLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={miniLink}>
      <span>{label}</span>
      <span style={{ opacity: 0.9 }}>↗</span>
    </Link>
  );
}

const miniLink: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 14,
  border: `1px solid ${ui.border}`,
  background: "rgba(0,0,0,0.35)",
  color: ui.text,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
};