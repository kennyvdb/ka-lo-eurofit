"use client";

import AppShell from "@/components/AppShell";
import { DocRow, PageHero, Panel, SquareTile, ui } from "../_ui";

export default function RollenPage() {
  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <PageHero
        kicker="LES LO"
        title={
          <>
            Rollenkaarten <span style={{ opacity: 0.85 }}>🎭</span>
          </>
        }
        subtitle={
          <>
            Verdeel rollen tijdens spel- en wedstrijdvormen. Elke rol heeft duidelijke taken.
          </>
        }
        right={
          <>
            <div style={{ fontWeight: 950, color: ui.text, fontSize: 13 }}>Snel naar</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <a href="#rollen" style={quickLink}>
                Rollen ↘
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

      <section id="rollen" style={{ marginTop: 14 }}>
        <Panel kicker="Rollen" title="Overzicht (voorbeeld)">
          <div style={{ display: "grid", gap: 10 }}>
            <RoleCard title="Scheidsrechter" bullets={["Legt regels uit", "Start/stop", "Fairplay bewaken", "Beslissingen kort en duidelijk"]} />
            <RoleCard title="Coach" bullets={["Geeft 1 actiepunt per time-out", "Stimuleert team", "Let op afspraken/rotaties"]} />
            <RoleCard title="Timekeeper" bullets={["Houdt tijd bij", "Meldt wissels/time-outs", "Communiceert rustig"]} />
            <RoleCard title="Materiaalmeester" bullets={["Zet materiaal klaar", "Controleert veiligheid", "Ruimt correct op"]} />
          </div>

          <div style={note}>
            Tip: maak per rol een PDF kaartje en link die onderaan bij Downloads.
          </div>
        </Panel>
      </section>

      <section id="downloads" style={{ marginTop: 14 }}>
        <Panel kicker="Rollenkaarten" title="Downloads">
          <div style={{ display: "grid", gap: 10 }}>
            <DocRow title="Rollenkaartenset (alles)" meta="PDF" href="/docs/rollen/rollenkaartenset.pdf" />
            <DocRow title="Scheidsrechter" meta="PDF" href="/docs/rollen/scheidsrechter.pdf" />
            <DocRow title="Coach" meta="PDF" href="/docs/rollen/coach.pdf" />
            <DocRow title="Timekeeper" meta="PDF" href="/docs/rollen/timekeeper.pdf" />
            <DocRow title="Materiaalmeester" meta="PDF" href="/docs/rollen/materiaalmeester.pdf" />
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}

function RoleCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 980, color: ui.text }}>{title}</div>
      <ul style={ul}>
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
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

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${ui.border}`,
  background: "rgba(0,0,0,0.28)",
};

const ul: React.CSSProperties = {
  margin: "10px 0 0 0",
  paddingLeft: 18,
  color: ui.text,
  lineHeight: 1.55,
};

const note: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: `1px solid ${ui.border}`,
  color: ui.muted,
  fontSize: 12.5,
};