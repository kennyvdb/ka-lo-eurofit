"use client";

import AppShell from "@/components/AppShell";
import { DocRow, PageHero, Panel, SquareTile, ui } from "../_ui";

export default function KijkwijzersPage() {
  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <PageHero
        kicker="LES LO"
        title={
          <>
            Kijkwijzers <span style={{ opacity: 0.85 }}>👀</span>
          </>
        }
        subtitle={
          <>
            Gebruik deze kijkwijzers tijdens de les. Je kan ze ook downloaden of afdrukken.
          </>
        }
        right={
          <>
            <div style={{ fontWeight: 950, color: ui.text, fontSize: 13 }}>Snel naar</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <a href="#downloads" style={quickLink}>
                Downloads ↘
              </a>
              <a href="#inles" style={quickLink}>
                In de les ↘
              </a>
            </div>
          </>
        }
      />

      <section style={{ marginTop: 14 }}>
        <div className="grid">
          <SquareTile href="/les-lo/rollen" icon="🎭" title="Rollenkaarten" desc="Scheidsrechter, coach…" />
          <SquareTile href="/les-lo/jaarplanning" icon="🗓️" title="Jaarplanning" desc="Kies je leerkracht" />
          <SquareTile href="/les-lo/evaluaties" icon="✅" title="Evaluaties" desc="Rubrics & feedback" />
          <SquareTile href="/les-lo/afspraken" icon="📌" title="Afspraken LO" desc="Regels & afspraken" />
        </div>

        <style jsx>{`
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media (min-width: 900px) {
            .grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>

      <section id="downloads" style={{ marginTop: 14 }}>
        <Panel kicker="Kijkwijzers" title="Downloads">
          <div style={{ display: "grid", gap: 10 }}>
            <DocRow title="Kijkwijzer — Template" meta="PDF/Doc" href="/docs/kijkwijzers/template.pdf" />
            <DocRow title="Kijkwijzer — Balspelen" meta="PDF" href="/docs/kijkwijzers/balspelen.pdf" />
            <DocRow title="Kijkwijzer — Atletiek" meta="PDF" href="/docs/kijkwijzers/atletiek.pdf" />
            <DocRow title="Kijkwijzer — Turnen" meta="PDF" href="/docs/kijkwijzers/turnen.pdf" />
          </div>

          <div style={note}>
            Vervang deze links door je echte documenten (Smartschool / Supabase Storage / public/docs).
          </div>
        </Panel>
      </section>

      <section id="inles" style={{ marginTop: 14 }}>
        <Panel kicker="Praktisch" title="Zo gebruik je een kijkwijzer">
          <ul style={ul}>
            <li>Lees eerst de criteria (wat is “goed uitgevoerd”?)</li>
            <li>Kijk naar 1–2 punten tegelijk (niet alles tegelijk)</li>
            <li>Gebruik de taal van de kijkwijzer in feedback (“ik zag dat je…”)</li>
            <li>Noteer 1 actiepunt en 1 succespunt</li>
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}

const quickLink: React.CSSProperties = {
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

const note: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${ui.border}`,
  color: ui.muted,
  fontSize: 12.5,
};

const ul: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: ui.text,
  lineHeight: 1.55,
};