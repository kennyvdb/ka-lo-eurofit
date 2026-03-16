"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
};

type Uitdaging = {
  id: string;
  titel: string;
  beschrijving: string | null;
  startdatum: string;
  einddatum: string;
  schooljaar: string | null;
  actief: boolean | null;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  successBg: "rgba(34,197,94,0.15)",
  successBorder: "rgba(34,197,94,0.28)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Nog niet ingesteld";
  try {
    return new Date(dateStr).toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 9) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

export default function RunWalkChallengeInstructiesPage() {
  const [loading, setLoading] = useState(true);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [uitdaging, setUitdaging] = useState<Uitdaging | null>(null);

  const schooljaar = useMemo(() => getCurrentSchoolYearBelgium(), []);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (userId) {
          const { data: profielData } = await supabase
            .from("profielen")
            .select("id, volledige_naam, role, rol, klas_naam")
            .eq("id", userId)
            .maybeSingle();

          if (profielData) {
            setProfiel(profielData as Profiel);
          }
        }

        const { data: challengeData } = await supabase
          .from("uitdagingen")
          .select("id, titel, beschrijving, startdatum, einddatum, schooljaar, actief")
          .eq("titel", "Run & Walk Challenge")
          .eq("schooljaar", schooljaar)
          .maybeSingle();

        if (challengeData) {
          setUitdaging(challengeData as Uitdaging);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [schooljaar]);

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Instructies laden…</div>
      </main>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={profiel?.volledige_naam ?? null}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <section style={hero.wrap}>
          <div style={hero.bgGlow1} />
          <div style={hero.bgGlow2} />

          <div style={hero.inner}>
            <div style={hero.kicker}>RUN & WALK CHALLENGE</div>

            <h1 style={hero.title}>
              Instructies voor de
              <br />
              <span style={hero.accent}>Run & Walk Challenge</span>
            </h1>

            <div style={hero.sub}>
              Alles wat je moet weten om correct deel te nemen, je activiteiten
              in te dienen en punten te scoren voor jouw klas.
            </div>

            <div style={hero.actions}>
              <Link href="/challenges/RunWalkChallenge" style={hero.primary}>
                Naar challenge →
              </Link>

              <a
                href="https://www.strava.com/register"
                target="_blank"
                rel="noreferrer"
                style={hero.secondary}
              >
                Maak Strava-account →
              </a>

              <a
                href="https://www.strava.com/clubs/GO-Avelgem"
                target="_blank"
                rel="noreferrer"
                style={hero.secondary}
              >
                Open club →
              </a>
            </div>
          </div>
        </section>

        <div className="mainGrid">
          <div style={{ display: "grid", gap: 14 }}>
            <GlassCard
              title="Dag sportievelingen!"
              subtitle="Welkom bij de GO! Run & Walk Challenge"
            >
              <div style={styles.longText}>
                <p>
                  De lente hangt in de lucht en meer dan ooit hebben we zin om
                  buiten te komen, te bewegen en samen iets sportiefs neer te
                  zetten.
                </p>
                <p>
                  Daarom dagen we jullie uit met de{" "}
                  <b style={{ color: ui.text }}>GO! Run & Walk Challenge</b>.
                  Trek je sportschoenen aan, ga wandelen of lopen en verzamel
                  zoveel mogelijk kilometers voor jezelf én voor je klas.
                </p>
                <p>
                  Of je nu kiest voor een korte wandeling, een stevige run of
                  meerdere activiteiten tijdens de challengeperiode: elke
                  goedgekeurde kilometer helpt jouw klas vooruit in het
                  klassement.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              title="Wat is de bedoeling?"
              subtitle="Zo werkt de challenge"
            >
              <InstructionList
                items={[
                  "Je loopt of wandelt zoveel mogelijk kilometers tijdens de challengeperiode.",
                  "Alleen wandelen en lopen tellen mee. Fietsen, skeeleren of andere activiteiten tellen niet mee.",
                  "Je registreert elke activiteit in de app met de juiste afstand, datum en een Strava-link als bewijs.",
                  "Na controle door een leerkracht wordt je activiteit goedgekeurd of afgekeurd.",
                  "Enkel goedgekeurde activiteiten tellen mee voor het klassement.",
                ]}
              />
            </GlassCard>

            <GlassCard
              title="Wie neemt het tegen wie op?"
              subtitle="Individueel én per klas"
            >
              <div style={styles.longText}>
                <p>
                  Je neemt deel als onderdeel van je{" "}
                  <b style={{ color: ui.text }}>klas</b>. Elke goedgekeurde
                  activiteit van leerlingen uit jouw klas telt mee voor het{" "}
                  <b style={{ color: ui.text }}>klasklassement</b>.
                </p>
                <p>
                  Daarnaast is er ook een{" "}
                  <b style={{ color: ui.text }}>individuele top 10</b>, waarin
                  de leerlingen met de meeste goedgekeurde kilometers bovenaan
                  komen te staan.
                </p>
                <p>
                  Samen zorgen jullie dus voor een sterke klasscore, terwijl je
                  individueel ook kan strijden voor een mooie plek in de ranking.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              title="Hoe dien je een activiteit correct in?"
              subtitle="Stap voor stap"
            >
              <InstructionList
                items={[
                  "Maak eerst een Strava-account aan als je dat nog niet hebt.",
                  "Word daarna lid van de club GO!Avelgem beweegt op Strava.",
                  "Ga na je wandeling of run naar de Run & Walk Challenge in de app.",
                  "Kies het type activiteit: Run of Walk.",
                  "Vul je afstand in kilometers in.",
                  "Kies de datum waarop je activiteit plaatsvond.",
                  "Plak de link van je Strava-activiteit in het veld Strava-link.",
                  "Voeg eventueel een korte opmerking toe voor de leerkracht.",
                  "Klik op ‘Activiteit indienen’.",
                ]}
              />
            </GlassCard>

            <GlassCard
              title="Belangrijk om te weten"
              subtitle="Deze afspraken gelden voor iedereen"
            >
              <InstructionList
                items={[
                  "Je activiteit moet een geldige Strava-link bevatten.",
                  "De ingegeven afstand moet overeenkomen met je activiteit.",
                  "Per registratie dien je één activiteit in.",
                  "Registraties worden nagekeken door een leerkracht.",
                  "Afgekeurde activiteiten tellen niet mee in het klassement.",
                  "Zorg dat je profiel gekoppeld is aan de juiste klas.",
                ]}
              />
            </GlassCard>

            <GlassCard
              title="Problemen of vragen?"
              subtitle="Wat doe je als iets niet lukt?"
            >
              <div style={styles.longText}>
                <p>
                  Kijk eerst zelf goed na of je alle velden correct hebt ingevuld
                  en of je Strava-link werkt.
                </p>
                <p>
                  Vraag daarna eventueel hulp aan iemand van je klas. Vaak is een
                  klein probleem snel opgelost.
                </p>
                <p>
                  Lukt het nog steeds niet, spreek dan je{" "}
                  <b style={{ color: ui.text }}>leerkracht LO</b> aan of stuur
                  een bericht via Smartschool.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              title="Go for it!"
              subtitle="Motiveer elkaar en haal het beste uit je klas"
            >
              <div style={styles.longText}>
                <p>
                  Daag elkaar uit, spreek samen af om te bewegen en probeer als
                  klas zoveel mogelijk kilometers te verzamelen.
                </p>
                <p>
                  Hoe meer jullie elkaar motiveren, hoe groter de kans dat jullie
                  bovenaan eindigen in het klassement.
                </p>
                <p>
                  <b style={{ color: ui.text }}>
                    Sportieve groeten,
                    <br />
                    Het vakteam LO
                  </b>
                </p>
              </div>
            </GlassCard>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <GlassCard
              title="Challenge overzicht"
              subtitle="Praktische info"
            >
              <div style={{ display: "grid", gap: 10 }}>
                <InfoLine
                  label="Challenge"
                  value={uitdaging?.titel ?? "Run & Walk Challenge"}
                />
                <InfoLine
                  label="Periode"
                  value={`${formatDate(uitdaging?.startdatum)} → ${formatDate(
                    uitdaging?.einddatum
                  )}`}
                />
                <InfoLine
                  label="Schooljaar"
                  value={uitdaging?.schooljaar ?? schooljaar}
                />
                <InfoLine
                  label="Bewijs"
                  value="Strava-link per activiteit"
                />
                <InfoLine
                  label="Activiteiten"
                  value="Run en Walk"
                />
                <InfoLine
                  label="Status"
                  value={uitdaging?.actief ? "Actief" : "Nog niet actief"}
                />
              </div>

              <div style={styles.tipBox}>
                Enkel <b style={{ color: ui.text }}>goedgekeurde</b> registraties
                tellen mee voor het klas- en leerlingenklassement.
              </div>
            </GlassCard>

            <GlassCard
              title="Snel starten"
              subtitle="Open meteen wat je nodig hebt"
            >
              <div style={{ display: "grid", gap: 10 }}>
                <Link href="/challenges/RunWalkChallenge" style={styles.secondaryBtn}>
                  Naar challengepagina →
                </Link>

                <a
                  href="https://www.strava.com/register"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryBtn}
                >
                  Maak een Strava-account →
                </a>

                <a
                  href="https://www.strava.com/clubs/GO-Avelgem"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryBtn}
                >
                  Word lid van GO!Avelgem beweegt →
                </a>
              </div>
            </GlassCard>

            <GlassCard
              title="Jouw klas"
              subtitle="Controleer je profielgegevens"
            >
              <div style={{ display: "grid", gap: 10 }}>
                <InfoLine
                  label="Naam"
                  value={profiel?.volledige_naam ?? "Niet gekend"}
                />
                <InfoLine
                  label="Klas"
                  value={profiel?.klas_naam ?? "Nog niet ingevuld"}
                />
              </div>

              <div style={styles.tipBox}>
                Staat je klas niet juist? Pas dan eerst je profiel aan, zodat je
                kilometers bij de correcte klas terechtkomen.
              </div>
            </GlassCard>

            <GlassCard
              title="Terug"
              subtitle="Ga terug naar de challenge"
            >
              <Link href="/challenges/RunWalkChallenge" style={styles.secondaryBtn}>
                Terug naar Run & Walk Challenge →
              </Link>
            </GlassCard>
          </div>
        </div>

        <style jsx>{`
          .mainGrid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 14px;
            align-items: start;
          }

          @media (max-width: 960px) {
            .mainGrid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}

function GlassCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          {subtitle ? <div style={styles.cardSubtitle}>{subtitle}</div> : null}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: ui.muted2 }}>{label}</span>
      <span style={{ color: ui.text, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function InstructionList({ items }: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} style={styles.listItem}>
          <div style={styles.listBadge}>{index + 1}</div>
          <div style={{ color: ui.muted, lineHeight: 1.65 }}>{item}</div>
        </div>
      ))}
    </div>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 780,
  },
  bgGlow1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    left: -120,
    top: -140,
    background: "rgba(75,142,141,0.20)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(137,194,170,0.16)",
    filter: "blur(26px)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.2,
    color: ui.muted,
  },
  title: {
    margin: "8px 0 0 0",
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 980,
    color: ui.text,
  },
  accent: {
    background: `linear-gradient(90deg, ${brand.blue}, ${brand.teal}, ${brand.mint})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: {
    marginTop: 12,
    fontSize: 14,
    color: ui.muted,
    maxWidth: 660,
    lineHeight: 1.6,
  },
  actions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.55)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    fontWeight: 950,
    color: ui.text,
    fontSize: 16,
  },
  cardSubtitle: {
    marginTop: 4,
    color: ui.muted,
    fontSize: 13,
  },
  longText: {
    display: "grid",
    gap: 12,
    color: ui.muted,
    lineHeight: 1.75,
    fontSize: 14,
  },
  listItem: {
    display: "grid",
    gridTemplateColumns: "38px 1fr",
    gap: 12,
    alignItems: "start",
    padding: 12,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.04)",
  },
  listBadge: {
    height: 38,
    width: 38,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    color: ui.text,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
  tipBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    color: ui.muted,
    lineHeight: 1.55,
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.30)",
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
    cursor: "pointer",
    width: "fit-content",
  },
};