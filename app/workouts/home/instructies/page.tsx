"use client";

import AppShell from "@/components/AppShell";
import React, { useRef, useState } from "react";

const colors = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  glass: "rgba(6, 12, 20, 0.42)",
  glass2: "rgba(6, 12, 20, 0.58)",
};

type FaqItem = { q: string; a: React.ReactNode };

const FAQ: FaqItem[] = [
  {
    q: "Ik haal het aantal reps/tempo niet. Wat nu?",
    a: (
      <>
        Schaal naar een <b>makkelijkere variant</b>, verklein je range of pak <b>lichtere dumbbells</b>. Het doel blijft:{" "}
        <b>goede reps</b> tot (bijna) falen, niet “slopen” met slechte vorm.
      </>
    ),
  },
  {
    q: "Hoe weet ik of ik écht ‘to failure’ ga?",
    a: (
      <>
        Je zit op falen als je nog <b>max 0–1 herhaling</b> zou kunnen doen met dezelfde techniek. Zodra je vorm breekt:
        stop, noteer reps, rust, volgende set.
      </>
    ),
  },
  {
    q: "Wat als ik geen dumbbells heb?",
    a: (
      <>
        Kies de <b>bodyweight varianten</b> (of moeilijkere varianten) en werk met <b>tempo</b> (langzaam omlaag, pauzes)
        om de set zwaar te maken. Je kan ook een <b>rugzak</b> gebruiken.
      </>
    ),
  },
  {
    q: "Ik voel het vooral in mijn schouders/onderrug. Is dat oké?",
    a: (
      <>
        Soms is dat een <b>techniek signaal</b>. Check: romp bracen, ribben “down”, schouders niet optrekken, neutrale rug.
        Zo nodig: <b>makkelijkere variant</b> of minder range.
      </>
    ),
  },
  {
    q: "Hoe lang moet ik rusten?",
    a: (
      <>
        Volg de rust in het schema (bv. <b>2’</b> of <b>30”</b>). Bij de HARDCORE-set mag je micro-pauzes nemen, maar de
        timer loopt door.
      </>
    ),
  },
  {
    q: "Moet ik altijd exact 10–12 reps doen met dumbbells?",
    a: (
      <>
        Dat is een <b>richtlijn</b>. Soms zit je op 8–10 of 12–15 afhankelijk van oefening/dag. Zolang je dichtbij falen
        komt met goede vorm, zit je goed.
      </>
    ),
  },
  {
    q: "Wat noteer ik in het logboek?",
    a: (
      <>
        Noteer per set <b>kg/reps</b> (of alleen reps bij bodyweight). Voorbeeld: <b>12kg x 11</b>. Bij to-failure sets:
        enkel reps is prima (bv. <b>18</b>).
      </>
    ),
  },
  {
    q: "Hoe boek ik progressie over 6 weken?",
    a: (
      <>
        Kies 1 focus per oefening: <b>meer reps</b>, <b>meer gewicht</b>, <b>strakker tempo</b>, <b>minder rust</b> (alleen
        als techniek top is) of <b>moeilijkere variant</b>.
      </>
    ),
  },
  {
    q: "Ik heb spierpijn. Train ik door?",
    a: (
      <>
        Lichte/matige spierpijn is oké. Als het je beweging beperkt of het voelt “scherp/steek”: <b>rust</b>, mobiliteit,
        of doe een lichtere variant/tempo.
      </>
    ),
  },
  {
    q: "Wat als ik een training mis?",
    a: (
      <>
        Geen stress: pak gewoon de volgende training op. Probeer wel de weekstructuur aan te houden en niet alles in te
        halen met dubbele sessies.
      </>
    ),
  },
  {
    q: "Wanneer stop ik een set voor veiligheid?",
    a: (
      <>
        Bij <b>scherpe pijn</b>, duizeligheid, tintelingen, of als je techniek volledig instort. Aanpassen is beter dan
        forceren.
      </>
    ),
  },
];

export default function HomeInstructiesPage() {
  const [openFaq, setOpenFaq] = useState<Set<number>>(() => new Set());
  const faqRefs = useRef<Array<HTMLDivElement | null>>([]);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);

      requestAnimationFrame(() => {
        const el = faqRefs.current[idx];
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      return next;
    });
  };

  return (
    <AppShell title="KA LO App" subtitle="Workouts • Home" userName={null}>
      <style>{css}</style>

      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.kicker}>WORKOUTS • HOME</div>
            <h1 style={{ fontSize: 24, fontWeight: 980, margin: "6px 0 0 0", color: ui.text }}>Instructies</h1>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              Hoe je het schema uitvoert • Rust & tempo • HARDCORE-set • Veiligheid • FAQ
            </div>

            <div style={styles.topBtns}>
              <a href="/workouts/home" style={styles.primaryBtn}>
                ← Terug naar schema
              </a>
              <a href="/workouts" style={styles.backLink}>
                Workouts overzicht
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <Card title="1) Opzet van elke training">
            <ul className="list">
              <li>
                Je krijgt per spiergroep <b>4 oefeningen</b> in <b>aflopende moeilijkheid</b>, met een rusttijd per oefening.
              </li>
              <li>
                Je doet <b>3 sets per oefening</b>. Pas als alle sets klaar zijn, ga je door naar de volgende oefening.
              </li>
              <li>
                Na oefening 4 doe je nog <b>1 extra taak</b>: de <b>HARDCORE-set</b>.
              </li>
              <li>
                Daarna herhaal je hetzelfde principe voor de <b>tweede spiergroep van de dag</b>.
              </li>
              <li>
                Tussen spiergroepen mag je <b>3–5 minuten</b> rusten (max).
              </li>
            </ul>
          </Card>

          <Card title="2) Dumbbells oefeningen (gewicht kiezen)">
            <div className="p">
              Kies een gewicht waarmee je rond <b>10–12 herhalingen</b> (ongeveer) richting <b>spierfalen</b> gaat. Het doel
              is dat de laatste reps écht zwaar worden, maar je vorm nog correct blijft.
            </div>

            <div className="grid2">
              <InfoBox title="Richtlijn" icon="🎯">
                <div className="p">
                  Als je <b>veel meer</b> dan 12 reps haalt: volgende set iets zwaarder. Als je <b>veel minder</b> dan 10 reps
                  haalt: iets lichter of kies een makkelijkere variant.
                </div>
              </InfoBox>
              <InfoBox title="Vorm boven ego" icon="✅">
                <div className="p">
                  Stop zodra je techniek breekt (romp inzakt, schouders omhoog, momentum smijten, halve reps). Kwaliteit =
                  progressie.
                </div>
              </InfoBox>
            </div>
          </Card>

          <Card title="3) Bodyweight oefeningen (to failure)">
            <div className="p">
              Bodyweight (= zonder dumbbells) herhaal je <b>tot je geen correcte rep</b> meer kan uitvoeren. Wanneer dat
              gebeurt: <b>rust volgens het schema</b> en ga verder.
            </div>

            <div className="grid2">
              <InfoBox title="Tempo" icon="⏱️">
                <div className="p">
                  Rustig en gecontroleerd. Denk: <b>2 sec omlaag</b>, <b>kort pauze</b>, <b>krachtig omhoog</b>.
                </div>
              </InfoBox>
              <InfoBox title="Ademhaling" icon="💨">
                <div className="p">
                  <b>In</b> bij zakken / voorbereiden, <b>uit</b> bij duwen/trekken/omhoogkomen. Houd je ribben “down”.
                </div>
              </InfoBox>
            </div>
          </Card>

          <Card title="4) De HARDCORE-set (3 minuten challenge)">
            <div className="p">
              Bij de HARDCORE-set is je taak simpel: binnen <b>3 minuten</b> een <b>doelaantal herhalingen</b> halen. Je mag
              pauzeren wanneer je wil, maar de klok loopt door.
            </div>

            <div className="steps">
              <div className="step">
                <div className="stepNum">1</div>
                <div>
                  <div className="stepTitle">Start timer</div>
                  <div className="stepText">Zodra je start, loopt de 3 minuten onafgebroken.</div>
                </div>
              </div>
              <div className="step">
                <div className="stepNum">2</div>
                <div>
                  <div className="stepTitle">Alleen “goede reps” tellen</div>
                  <div className="stepText">Registreer enkel reps in correcte vorm vóór de timer op nul staat.</div>
                </div>
              </div>
              <div className="step">
                <div className="stepNum">3</div>
                <div>
                  <div className="stepTitle">Micro-pauzes zijn oké</div>
                  <div className="stepText">Korte breaks helpen je output hoog houden zonder vorm te verliezen.</div>
                </div>
              </div>
            </div>

            <div className="note">
              Tip: ga niet te hard in minuut 1. Mik op een strak, herhaalbaar ritme en versnel pas op het einde.
            </div>
          </Card>

          <Card title="5) Video’s + varianten (scaling)">
            <div className="p">
              In de map <b>“video’s”</b> worden alle oefeningen getoond. Oefeningen zijn vaak gescaled met een{" "}
              <b>moeilijke variant (1)</b> en een <b>makkelijkere variant (2)</b>. Kies de variant die haalbaar is en
              waarbij je goede reps kan uitvoeren.
            </div>

            <div className="grid2">
              <InfoBox title="Wanneer schalen?" icon="🧩">
                <div className="p">
                  Als je vorm breekt of je herhalingen té laag zijn, kies een makkelijkere variant. Als je te makkelijk over
                  12 reps gaat, kies een zwaardere variant.
                </div>
              </InfoBox>
              <InfoBox title="Doel = progressie" icon="📈">
                <div className="p">
                  Probeer <b>week na week</b> je score op te krikken: meer reps, beter tempo, meer controle of iets zwaarder.
                </div>
              </InfoBox>
            </div>
          </Card>

          <Card title="6) Veiligheid (kort maar belangrijk)">
            <ul className="list">
              <li>
                <b>Warm-up 5–8 min</b>: schouders/heupen/enkels + 1–2 lichte opwarmsets van je eerste oefening.
              </li>
              <li>
                <b>Stop bij scherpe pijn</b> (anders dan “spierbrand”). Pas variant/ROM aan of sla de oefening over.
              </li>
              <li>
                Houd je <b>romp gespannen</b> en schouders “laag & achter” waar relevant.
              </li>
              <li>
                Drink water, hou grip/stabiliteit veilig (stoel/bench stevig), en train met ruimte rond je.
              </li>
            </ul>
          </Card>

          {/* FAQ Accordion */}
          <div style={styles.sectionCard}>
            <div style={styles.cardTitle}>FAQ (openklappen)</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {FAQ.map((it, idx) => {
                const isOpen = openFaq.has(idx);
                return (
                  <div
                    key={it.q}
                    className="faqAcc"
                    ref={(el) => {
                      faqRefs.current[idx] = el;
                    }}
                  >
                    <button type="button" onClick={() => toggleFaq(idx)} className="faqHead" aria-expanded={isOpen}>
                      <div style={{ minWidth: 0 }}>
                        <div className="faqQ">{it.q}</div>
                        <div className="faqMeta">{isOpen ? "Klik om te sluiten" : "Klik om te openen"}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
                        <span className="pill">{isOpen ? "Sluiten" : "Open"}</span>
                        <span className="chev" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {isOpen && <div className="faqBody">{it.a}</div>}
                  </div>
                );
              })}
            </div>

            <div className="note" style={{ marginTop: 12 }}>
              Tip: als iets pijn doet (scherp/steek) → schaal, pas range aan of stop. “Brand” is oké, pijn is een signaal.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="/workouts/home" style={styles.primaryBtn}>
              ← Terug naar schema
            </a>
            <a href="/workouts/home#top" style={styles.backLink}>
              Naar boven
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/** UI blocks */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function InfoBox({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="ibox">
      <div className="iboxTop">
        <div className="iboxIcon" aria-hidden>
          {icon}
        </div>
        <div className="iboxTitle">{title}</div>
      </div>
      <div className="iboxBody">{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: 16,
    borderRadius: 22,
    border: "1px solid " + ui.border,
    background:
      "radial-gradient(900px 400px at 8% 0%, rgba(137,194,170,0.25), transparent 65%)," +
      "radial-gradient(900px 400px at 70% 20%, rgba(75,142,141,0.22), transparent 60%)," +
      "radial-gradient(900px 400px at 100% 0%, rgba(37,89,113,0.22), transparent 60%)," +
      ui.glass,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },

  topBtns: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" },

  primaryBtn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(137,194,170,0.35)",
    background: "linear-gradient(135deg, rgba(137,194,170,0.35), rgba(75,142,141,0.25))",
    color: ui.text,
    fontWeight: 980,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
  },

  backLink: {
    height: 44,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid " + ui.border2,
    background: "linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35))",
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },

  card: {
    padding: 14,
    borderRadius: 22,
    background:
      "radial-gradient(600px 240px at 0% 0%, rgba(37,89,113,0.16), transparent 60%)," +
      "radial-gradient(600px 240px at 100% 0%, rgba(137,194,170,0.14), transparent 60%)," +
      ui.glass,
    border: "1px solid " + ui.border,
    overflow: "hidden",
  },
  cardTitle: { fontSize: 14, fontWeight: 980, color: ui.text, lineHeight: 1.15 },

  sectionCard: {
    padding: 14,
    borderRadius: 22,
    background:
      "radial-gradient(600px 240px at 0% 0%, rgba(37,89,113,0.16), transparent 60%)," +
      "radial-gradient(600px 240px at 100% 0%, rgba(137,194,170,0.14), transparent 60%)," +
      ui.glass,
    border: "1px solid " + ui.border,
    overflow: "hidden",
  },
};

const css = `
  .p{
    color:${ui.muted};
    font-weight:850;
    font-size:13.5px;
    line-height:1.55;
  }

  .list{
    margin:0;
    padding-left:18px;
    display:grid;
    gap:8px;
    color:${ui.muted};
    font-weight:850;
    font-size:13.5px;
    line-height:1.55;
  }
  .list b{ color:${ui.text}; }

  .grid2{
    margin-top:10px;
    display:grid;
    gap:10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 820px){
    .grid2{ grid-template-columns: 1fr; }
  }

  .ibox{
    border:1px solid rgba(255,255,255,0.12);
    background:${ui.glass2};
    border-radius:18px;
    padding:12px;
  }
  .iboxTop{
    display:flex;
    align-items:center;
    gap:10px;
    margin-bottom:8px;
  }
  .iboxIcon{
    width:34px; height:34px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg, rgba(37,89,113,0.75), rgba(75,142,141,0.55));
    border:1px solid rgba(255,255,255,0.14);
    color:${ui.text};
    flex:0 0 auto;
    font-size:16px;
  }
  .iboxTitle{
    font-weight:980;
    color:${ui.text};
    font-size:13.5px;
  }
  .iboxBody{
    color:${ui.muted};
    font-weight:850;
    font-size:13.5px;
    line-height:1.55;
  }

  .steps{
    margin-top:10px;
    display:grid;
    gap:10px;
  }
  .step{
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.04);
    border-radius:18px;
    padding:12px;
    display:flex;
    gap:12px;
    align-items:flex-start;
  }
  .stepNum{
    width:34px; height:34px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-weight:980;
    color:${ui.text};
    background:linear-gradient(135deg, ${colors.blue}, ${colors.teal});
    border:1px solid rgba(255,255,255,0.14);
    flex:0 0 auto;
  }
  .stepTitle{
    font-weight:980;
    color:${ui.text};
    font-size:13.5px;
    line-height:1.15;
  }
  .stepText{
    margin-top:4px;
    color:${ui.muted};
    font-weight:850;
    font-size:13.5px;
    line-height:1.55;
  }

  .note{
    margin-top:10px;
    border:1px solid rgba(137,194,170,0.25);
    background:linear-gradient(135deg, rgba(137,194,170,0.12), rgba(75,142,141,0.08));
    border-radius:18px;
    padding:12px;
    color:${ui.muted};
    font-weight:900;
    font-size:13.5px;
    line-height:1.55;
  }

  /* FAQ accordion */
  .faqAcc{
    border:1px solid rgba(255,255,255,0.12);
    background:${ui.glass2};
    border-radius:18px;
    padding:12px;
  }
  .faqHead{
    width:100%;
    text-align:left;
    border:none;
    outline:none;
    background:transparent;
    padding:0;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    cursor:pointer;
  }
  .faqQ{
    font-weight:980;
    color:${ui.text};
    font-size:13.5px;
    line-height:1.2;
  }
  .faqMeta{
    margin-top:4px;
    font-size:12px;
    font-weight:850;
    color:${ui.muted};
  }
  .faqBody{
    margin-top:10px;
    color:${ui.muted};
    font-weight:850;
    font-size:13.5px;
    line-height:1.55;
  }
  .faqBody b{ color:${ui.text}; }

  .pill{
    display:inline-flex;
    align-items:center;
    height:28px;
    padding:0 10px;
    border-radius:999px;
    border:1px solid rgba(255,255,255,0.14);
    background:rgba(255,255,255,0.05);
    color:${ui.muted};
    font-weight:950;
    font-size:12px;
  }
  .chev{
    width:28px;
    height:28px;
    border-radius:999px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border:1px solid rgba(255,255,255,0.14);
    background:rgba(0,0,0,0.25);
    color:${ui.text};
    transition:transform 160ms ease;
  }
`;