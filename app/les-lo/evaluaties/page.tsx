"use client";

import AppShell from "@/components/AppShell";
import { DocRow, PageHero, Panel, SquareTile, ui } from "../_ui";

export default function EvaluatiesPage() {
  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <PageHero
        kicker="LES LO"
        title={
          <>
            Evaluaties <span style={{ opacity: 0.85 }}>✅</span>
          </>
        }
        subtitle={
          <>
            Rubrics (SAM-schalen), criteria en feedback. Zo weet je altijd waarop je beoordeeld wordt.
          </>
        }
        right={
          <>
            <div style={{ fontWeight: 950, color: ui.text, fontSize: 13 }}>Snel naar</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <a href="#criteria" style={quickLink}>
                Criteria ↘
              </a>
              <a href="#rubrics" style={quickLink}>
                Rubrics ↘
              </a>
              <a href="#downloads" style={quickLink}>
                Downloads ↘
              </a>
            </div>
          </>
        }
      />

      <section style={{ marginTop: 14 }}>
        <div className="grid">
          <SquareTile href="/les-lo/kijkwijzers" icon="👀" title="Kijkwijzers" desc="Waarop letten" />
          <SquareTile href="/les-lo/rollen" icon="🎭" title="Rollenkaarten" desc="Scheidsrechter, coach…" />
          <SquareTile href="/les-lo/jaarplanning" icon="🗓️" title="Jaarplanning" desc="Kies je leerkracht" />
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

      <section id="criteria" style={{ marginTop: 14 }}>
        <Panel kicker="Evaluatie" title="2 grote criteria">
          <ol style={ol}>
            <li>
              <b style={{ color: ui.text }}>Bekwaamheid</b> (bewegingsgebonden doelstellingen): motorische vaardigheden
              (bv. handenstand, Cooper-test…).
            </li>
            <li>
              <b style={{ color: ui.text }}>Bereidheid</b> (persoonsgebonden doelstellingen): attitudes (materiaal in
              orde, luisterbereidheid, helpen, fairplay…).
            </li>
          </ol>
        </Panel>
      </section>

      <section id="rubrics" style={{ marginTop: 14 }}>
        <Panel kicker="Rubrics" title="SAM-schalen">
          <p style={p}>
            Rubrics geven inzicht in criteria en niveaus. Ze tonen de leerlijn en maken duidelijk wat een volgende stap is.
          </p>
          <div style={note}>
            Bij elk thema: Smartschool → Lichamelijke Opvoeding → Documenten → Evaluatie.
          </div>
        </Panel>
      </section>

      <section id="downloads" style={{ marginTop: 14 }}>
        <Panel kicker="Documenten" title="Downloads (voorbeeld)">
          <div style={{ display: "grid", gap: 10 }}>
            <DocRow title="Rubric — Template" meta="PDF/Doc" href="/docs/evaluaties/rubric.pdf" />
            <DocRow title="SAM-schaal — uitleg" meta="PDF" href="/docs/evaluaties/sam-uitleg.pdf" />
            <DocRow title="Evaluatieformulier — attitudes" meta="PDF" href="/docs/evaluaties/attitudes.pdf" />
          </div>
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

const p: React.CSSProperties = { margin: 0, color: ui.text, lineHeight: 1.6 };

const ol: React.CSSProperties = { margin: 0, paddingLeft: 18, color: ui.text, lineHeight: 1.6 };

const note: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${ui.border}`,
  color: ui.muted,
  fontSize: 12.5,
};