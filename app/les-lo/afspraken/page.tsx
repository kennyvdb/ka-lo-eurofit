"use client";

import AppShell from "@/components/AppShell";
import { PageHero, Panel, SquareTile, ui } from "../_ui";

export default function AfsprakenLOPage() {
  return (
    <AppShell title="LO App" subtitle="GO! Atheneum Avelgem" userName={null}>
      <PageHero
        kicker="LES LO"
        title={
          <>
            Afspraken lessen LO <span style={{ opacity: 0.85 }}>📌</span>
          </>
        }
        subtitle={
          <>
            Afspraken in verband met de les lichamelijke opvoeding. Lees dit goed door en hou je eraan voor een vlot schooljaar.
          </>
        }
        right={
          <>
            <div style={{ fontWeight: 950, color: ui.text, fontSize: 13 }}>Inhoud</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <a href="#visie" style={quickLink}>Visie ↘</a>
              <a href="#1" style={quickLink}>1. Ongeschiktheid ↘</a>
              <a href="#2" style={quickLink}>2. Algemene afspraken ↘</a>
              <a href="#3" style={quickLink}>3. Sportkledij ↘</a>
              <a href="#4" style={quickLink}>4. Gedrag ↘</a>
              <a href="#5" style={quickLink}>5. Extra ↘</a>
              <a href="#respect" style={quickLink}>Respect ↘</a>
              <a href="#buitenschools" style={quickLink}>Buitenschools ↘</a>
            </div>
          </>
        }
      />

      <section style={{ marginTop: 14 }}>
        <div className="grid">
          <SquareTile href="/les-lo/kijkwijzers" icon="👀" title="Kijkwijzers" desc="Waarop letten tijdens de les" />
          <SquareTile href="/les-lo/rollen" icon="🎭" title="Rollenkaarten" desc="Scheidsrechter, coach…" />
          <SquareTile href="/les-lo/jaarplanning" icon="🗓️" title="Jaarplanning" desc="Kies je leerkracht" />
          <SquareTile href="/les-lo/evaluaties" icon="✅" title="Evaluaties" desc="Rubrics & feedback" />
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

      {/* VISIE */}
      <section id="visie" style={{ marginTop: 14 }}>
        <Panel kicker="Afspraken" title="Afspraken in verband met de les lichamelijke opvoeding">
          <p style={p}>
            In dit vak staat de bewegende mens centraal. De term ‘Lichamelijke Opvoeding’ wordt daarom zeer ruim geïnterpreteerd als ‘bewegingsopvoeding’.
            Natuurlijk wordt er gewerkt aan de ontwikkeling van je fysieke mogelijkheden, maar je goed voelen in je vel is ook heel belangrijk.
            Door middel van allerlei bewegingsactiviteiten zal ik u proberen te helpen bij het ontwikkelen van:
          </p>

          <ul style={ul}>
            <li>je motoriek</li>
            <li>een gezonde en fitte levensstijl</li>
            <li>een positief zelfbeeld</li>
            <li>een goed sociaal gevoel</li>
          </ul>
        </Panel>
      </section>

      {/* 1 */}
      <section id="1" style={{ marginTop: 14 }}>
        <Panel kicker="1" title="Ongeschiktheid om mee te doen">
          <p style={p}>
            Als je niet kunt meedoen aan een les LO moet je een doktersattest hebben. Vóór de sportles toon je dat aan de leraar.
            Als je dus gekwetst bent, ga je zo vlug mogelijk op consultatie bij een arts (en niet bv. bij een kinesist van je sportclub).
            In zeer uitzonderlijke gevallen wordt een briefje van je ouders aanvaard; dat geldt dan slechts voor één dag.
          </p>
          <p style={p}>
            Ook als je niet actief aan de les kunt deelnemen, ben je daar toch aanwezig! Je stelt je dan niet passief op, maar helpt spontaan mee waar nodig.
            Indien je een langere periode inactief bent, of evaluatiemomenten mist, dan krijg je een vervangtaak.
          </p>
        </Panel>
      </section>

      {/* 2 */}
      <section id="2" style={{ marginTop: 14 }}>
        <Panel kicker="2" title="Algemene afspraken">
          <ul style={ul}>
            <li>Alle sportkledij wordt genaamtekend.</li>
            <li>Sieraden en piercings doen we uit om veiligheidsredenen.</li>
            <li>
              De school / de leraar is niet verantwoordelijk voor vergeten of verloren kledij, uurwerken, juwelen, gsm’s… Draag er dus zorg voor!
              Laat nooit waardevolle voorwerpen achter in de kleedruimte in de sporthal. Op school wordt de kleedkamer steeds afgesloten.
            </li>
            <li>
              Gsm’s laten we dan ook op school in de boekentas. Merken we dat dit niet lukt, dan verzamelen we de gsm’s in dozen.
              Zien we een GSM, dan ben je hem een hele dag kwijt. Ophalen kan je doen aan het secretariaat om 16u.
            </li>
            <li>Lang haar doe je in een staart.</li>
            <li>Ook in de zomerperiode draag je je T-shirt zoals het hoort.</li>
            <li>
              Je bent op school verzekerd tegen ongevallen. Als je een ongeval hebt, neem je contact op met het leerlingensecretariaat
              en neem je verzekeringspapieren mee.
            </li>
            <li>
              Indien er medische problemen zijn, die je deelname aan de les of bepaalde disciplines kunnen hinderen, heb ik graag dat je me dit
              bij het begin van het schooljaar persoonlijk meldt.
            </li>
            <li>Na het belsignaal komt iedereen mee naar binnen, ook al heb je niets meer nodig uit de kleedkamer.</li>
          </ul>

          <div style={subPanel}>
            <div style={subTitle}>Bus</div>
            <ul style={ul}>
              <li>niet eten of drinken</li>
              <li>rugzak in de hand</li>
              <li>
                niet op het gras lopen. Vaak liggen er drolletjes op het gras en dan neem je deze mee op de bus.
              </li>
              <li>op de bus draag je uw gordel!</li>
            </ul>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Na-uur</div>
            <p style={p}>
              Bij een na-uur zijn we tijdig terug op school. In uitzonderlijke gevallen kan je mits toestemming van ouders en directie,
              vanaf de sporthal vertrekken om de lijnbus te nemen. Hiervoor verlaat je de les echter niet vroegtijdig!
            </p>
          </div>
        </Panel>
      </section>

      {/* 3 */}
      <section id="3" style={{ marginTop: 14 }}>
        <Panel kicker="3" title="Verplichte sportkledij">
          <p style={p}>Wat draag je tijdens de sportlessen?</p>
          <ul style={ul}>
            <li>T-shirt: van school</li>
            <li>Broek: blauwe of zwarte short</li>
            <li>
              Sportschoenen: Je moet minstens over één paar degelijke sportschoenen beschikken. Geen zwarte zolen en geen sneakers!
              Tenzij anders vermeld heb je deze steeds bij!
            </li>
          </ul>
        </Panel>
      </section>

      {/* 4 */}
      <section id="4" style={{ marginTop: 14 }}>
        <Panel kicker="4" title="Gedrag tijdens de praktijklessen">
          <div style={subPanel}>
            <div style={subTitle}>Tijdens het omkleden</div>
            <ul style={ul}>
              <li>Het is rustig tijdens het omkleden.</li>
              <li>Je blijft in je eigen kleedruimte.</li>
              <li>TEMPO!!! Na het omkleden kom je onmiddellijk naar de zaal.</li>
              <li>Vuile schoenen (bvb na gebruik voetbalvelden) doen we uit bij het binnenkomen van het gebouw.</li>
            </ul>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Tijdens de les</div>
            <ul style={ul}>
              <li>
                Je vergeet niet dat de sportactiviteit een les is die aanzet tot fysieke inspanningen!!
                Onder het motto ‘deelnemen is belangrijker dan winnen’, vind ik inzet véél belangrijker dan je sportieve capaciteiten.
                Bekijk zoveel mogelijk je eigen vooruitgang en motivatie, i.p.v. te vergelijken met anderen.
              </li>
              <li>Gsm’s zijn niet toegelaten! Tenzij de leerkracht je toestemming geeft.</li>
              <li>
                Water in een herbruikbare fles is toegelaten in de sporthal. Deze kan aangevuld worden in de gang (voor of na de les).
                Andere dranken mogen niet.
              </li>
            </ul>
          </div>
        </Panel>
      </section>

      {/* 5 */}
      <section id="5" style={{ marginTop: 14 }}>
        <Panel kicker="5" title="Extra">
          <div style={subPanel}>
            <div style={subTitle}>Agenda/Planner</div>
            <p style={p}>Via Smartschool. Hou deze in de gaten i.v.m. speciale benodigdheden.</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Uitleendienst</div>
            <p style={p}>
              Over de middag kan je sportmateriaal uitlenen bij onze uitleendienst (grijze kast bij de meisjes kleedkamer).
              Je krijgt sportmateriaal in ruil voor een paspoort / leerlingenkaart. Dit paspoort geef je af aan de toezichter van de WC’s
              in de B-gang en krijg je op het einde van de speeltijd terug.
            </p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Gebruik fitnessruimte</div>
            <p style={p}>—</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Sportdag 16/09</div>
            <p style={p}>—</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Evaluatie</div>
            <p style={p}>
              Bij onze evaluatie onderscheiden wij twee grote criteria:
              <br />
              1. De bekwaamheid van de leerling (bewegingsgebonden doelstellingen): Hieronder valt wat wij traditioneel plaatsen onder het
              evalueren van motorische vaardigheden. Deze evaluatie gebeurt meestal onder de vorm van een productieve test.
              <br />
              2. De bereidheid van de leerling (persoonsgebonden doelstellingen): Hier gaat het niet zozeer om wat de leerling effectief motorisch kan,
              maar om de mate waarin deze bereid is een aantal attitudes na te leven.
            </p>
            <p style={p}>
              Voor beide evaluaties maken we gebruik van ‘rubrics’ (SAM-schalen). Rubrics geven de leerlingen inzicht in welke (evaluatie-)criteria
              van belang zijn in hun leer- en ontwikkelproces. Ze maken de leerlijn zichtbaar en concreet door positieve beschrijvingen van de verschillende
              niveaus per criterium.
            </p>
            <p style={p}>
              Bij elk thema vind je de uitgeschreven ‘rubrics’ terug op Smartschool binnen het vak Lichamelijke Opvoeding → Documenten → Evaluatie.
            </p>
          </div>
        </Panel>
      </section>

      {/* RESPECT */}
      <section id="respect" style={{ marginTop: 14 }}>
        <Panel kicker="Kern" title="Respect">
          <p style={p}>
            Het allerbelangrijkste teken van respect is jullie actieve deelname aan de les. In de LO-les is er veel interactie.
            Respect t.o.v. elkaar is dan ook zeer belangrijk: bij het maken van groepen, bij de helpersrol, fairplay tijdens wedstrijdvormen…
          </p>
          <p style={p}>
            Elke leerling heeft ook respect voor het materiaal! Je trapt bijvoorbeeld niet tegen een bal als het geen voetbal is,
            we gooien niet met matten, het materiaal wordt netjes teruggeplaatst... Iedereen draagt zijn steentje bij!
          </p>
          <p style={p}>
            Zet ook steeds het materiaal terug op de juiste plaats en let erop dat er geen banken of ander materiaal vóór de nooduitgangen worden geplaatst.
          </p>
        </Panel>
      </section>

      {/* BUITENSCHOOLS */}
      <section id="buitenschools" style={{ marginTop: 14 }}>
        <Panel kicker="Sport" title="Buitenschoolse, naschoolse sport">
          <div style={subPanel}>
            <div style={subTitle}>Helpers veldloop lagere school</div>
            <p style={p}>Janne, Charlize, Cheyenne, Lente, Bo, Mirthe, Ode, Nessa</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Survival Trophy (Blaarmeersen Gent)</div>
            <p style={p}>08/10/23 (W-VL) → lln derde graad</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>MOEV</div>
            <p style={p}>
              Sporten op aanvraag. Zie bvb.{" "}
              <a
                href="https://www.moev.be/activiteiten/filters:west-vlaanderen,secundair-onderwijs"
                style={link}
                target="_blank"
                rel="noreferrer"
              >
                moev.be ↗
              </a>
            </p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Tornooi op woensdagnamiddag</div>
            <p style={p}>dodge / voetbal / badminton: interesse?</p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>De SNS-pas</div>
            <p style={p}>
              <a href="https://sportnaschool.be/" style={link} target="_blank" rel="noreferrer">
                sportnaschool.be ↗
              </a>
            </p>
            <p style={p}>
              De SNS-pas is een sportpas voor lln van het secundair onderwijs waarmee je gedurende een bepaalde periode aansluitend aan de schooluren
              kan deelnemen aan verschillende sportactiviteiten. Voor slechts €55 (30 weken) of €35 (15 weken) heb je er een op zak of in je smartphone via de app.
            </p>
            <ul style={ul}>
              <li>Periode 1: 22 september 2025 tot en met 25 januari 2026.</li>
              <li>Periode 2: januari 2026 tot eind mei 2025.</li>
              <li>Niet geldig tijdens weekends, wettelijke feestdagen en schoolvakanties.</li>
            </ul>
            <p style={p}>
              Wie in aanmerking komt voor een sociaal tarief, kan contact opnemen met{" "}
              <a href="mailto:wim.vandezande@sportnaschool.be" style={link}>
                wim.vandezande@sportnaschool.be
              </a>{" "}
              om een gratis SNS-pas te bekomen (via het nummer van je UITpas). De SNS-pas is strikt persoonlijk!
            </p>
          </div>

          <div style={subPanel}>
            <div style={subTitle}>Tot slot</div>
            <p style={p}>
              Indien jullie zelf voorstellen hebben of bepaalde vragen/wensen hebben, aarzel niet en spreek één van de LO-leerkrachten aan!
            </p>
            <p style={p}>
              Als we met ons allen aan deze afspraken houden, komen we zeker tot een vlotte samenwerking en wordt het een prettig schooljaar!
            </p>
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

const p: React.CSSProperties = { margin: 0, color: ui.text, lineHeight: 1.65 };

const ul: React.CSSProperties = {
  margin: "10px 0 0 0",
  paddingLeft: 18,
  color: ui.text,
  lineHeight: 1.65,
};

const subPanel: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${ui.border}`,
  background: "rgba(0,0,0,0.26)",
};

const subTitle: React.CSSProperties = {
  fontWeight: 980,
  color: ui.text,
  marginBottom: 8,
  fontSize: 13.5,
};

const link: React.CSSProperties = {
  color: ui.text,
  fontWeight: 900,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};