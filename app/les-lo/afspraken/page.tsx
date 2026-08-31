"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import AppShell from "@/components/AppShell";
import BaseHero from "@/components/heroes/BaseHero";
import { ui } from "../_ui";

export default function AfsprakenLOPage() {
  return (
    <AppShell
      title="LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={null}
    >
      {/* =========================================================
          HERO
      ========================================================= */}
      <BaseHero
        label="LES LO"
        title={
          <>
            Afspraken LO <span className="opacity-85">📌</span>
          </>
        }
        description={
          <>
            Alles wat je moet weten voor een{" "}
            <strong className="text-white">veilige</strong>,{" "}
            <strong className="text-white">aangename</strong> en{" "}
            <strong className="text-white">vlotte LO-les</strong>.
          </>
        }
        imageSrc="/lo/LO.png"
        imageAlt="Afspraken lichamelijke opvoeding"
        quoteTitle="Duidelijke afspraken"
        quote="Goede afspraken zorgen voor meer sportplezier."
        quoteAuthor="LO team"
        actions={
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            >
              🏠 Terug naar dashboard
            </Link>

            <Link
              href="/les-lo"
              className="inline-flex h-11 items-center rounded-2xl border border-slate-400/20 bg-black/35 px-4 font-black text-[rgba(234,240,255,0.92)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/30 hover:bg-black/45 hover:shadow-[0_12px_24px_rgba(0,0,0,0.22)]"
            >
              🏃 Terug naar Les LO
            </Link>
          </div>
        }
      />

      {/* =========================================================
          BELANGRIJKSTE AFSPRAKEN
      ========================================================= */}
      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">IN ÉÉN OOGOPSLAG</div>
            <h2>De belangrijkste afspraken</h2>
          </div>

          <p>
            Deze afspraken zorgen ervoor dat iedereen veilig en met plezier
            kan deelnemen aan de les.
          </p>
        </div>

        <div className="key-grid">
          <KeyRule
            icon="👕"
            title="Sportkledij"
            text="Draag steeds de afgesproken sportkledij en degelijke sportschoenen."
            accent="blue"
          />

          <KeyRule
            icon="📵"
            title="Gsm"
            text="Je gsm blijft tijdens de LO-les opgeborgen, tenzij de leerkracht toestemming geeft."
            accent="red"
          />

          <KeyRule
            icon="🩺"
            title="Niet deelnemen"
            text="Kun je niet deelnemen? Verwittig je leerkracht en bezorg indien nodig een doktersattest."
            accent="orange"
          />

          <KeyRule
            icon="💧"
            title="Drinken"
            text="Water in een herbruikbare fles is toegelaten. Andere dranken niet."
            accent="cyan"
          />

          <KeyRule
            icon="🤝"
            title="Respect"
            text="We hebben respect voor elkaar, de leerkracht, het materiaal en de accommodatie."
            accent="green"
          />
        </div>
      </section>

      {/* =========================================================
          INTRO
      ========================================================= */}
      <section className="section">
        <SectionCard
          eyebrow="WAAROM LO?"
          title="Bewegen is meer dan alleen sporten"
          icon="💛"
        >
          <p className="intro-text">
            Tijdens de lessen lichamelijke opvoeding staat bewegen centraal.
            We werken uiteraard aan je fysieke mogelijkheden, maar minstens
            even belangrijk zijn je gezondheid, zelfvertrouwen, samenwerking
            en plezier in bewegen.
          </p>

          <div className="vision-grid">
            <MiniFeature
              icon="🏃"
              title="Motoriek"
              text="Je leert bewegen en ontwikkelt nieuwe vaardigheden."
            />

            <MiniFeature
              icon="❤️"
              title="Gezondheid"
              text="Je leert hoe beweging bijdraagt aan een gezonde levensstijl."
            />

            <MiniFeature
              icon="🌱"
              title="Zelfvertrouwen"
              text="Je leert je eigen vooruitgang waarderen."
            />

            <MiniFeature
              icon="🤝"
              title="Samenwerken"
              text="Je leert rekening houden met anderen en samen doelen bereiken."
            />
          </div>
        </SectionCard>
      </section>

      {/* =========================================================
          VOOR DE LES
      ========================================================= */}
      <section id="voor-de-les" className="section scroll-section">
        <SectionCard
          number="01"
          eyebrow="VOOR DE LES"
          title="Goed voorbereid starten"
          icon="🎒"
        >
          <div className="content-grid two">
            <InfoBlock icon="🩺" title="Niet kunnen deelnemen" important>
              <p>
                Kun je door een blessure of medische reden niet deelnemen aan
                de les? Meld dit vóór de sportles aan je leerkracht.
              </p>

              <ul>
                <li>
                  Bij een blessure of langere ongeschiktheid is een
                  doktersattest nodig.
                </li>
                <li>
                  Een briefje van de ouders kan enkel in uitzonderlijke
                  omstandigheden en geldt maximaal voor één dag.
                </li>
                <li>
                  Ook wanneer je niet actief kunt deelnemen, blijf je aanwezig
                  tijdens de les.
                </li>
                <li>
                  Je helpt waar mogelijk mee met bijvoorbeeld materiaal,
                  organisatie of observatie.
                </li>
                <li>
                  Bij langdurige afwezigheid of gemiste evaluaties kan een
                  vervangtaak worden voorzien.
                </li>
              </ul>
            </InfoBlock>

            <InfoBlock icon="👕" title="Sportkledij">
              <p>Tijdens de sportlessen draag je:</p>

              <ul>
                <li>het T-shirt van de school;</li>
                <li>een blauwe of zwarte sportshort;</li>
                <li>degelijk sportschoeisel;</li>
                <li>sportschoenen zonder zwarte afgevende zool.</li>
              </ul>

              <Callout>
                Zorg dat al je sportkledij genaamtekend is.
              </Callout>

              <div style={shirtShopStyle}>
                <div style={shirtShopHeaderStyle}>
                  <div style={shirtShopIconStyle}>🛒</div>

                  <div>
                    <div style={shirtShopLabelStyle}>LO-T-SHIRT</div>
                    <div style={shirtShopTitleStyle}>
                      Nieuw LO-T-shirt nodig?
                    </div>
                  </div>
                </div>

                <p style={shirtShopTextStyle}>
                  Een nieuw LO-T-shirt kan je aankopen via de webshop van de
                  school. Na de aankoop toon je het aankoopbewijs aan je
                  LO-leerkracht. De leerkracht bezorgt je vervolgens jouw
                  nieuwe T-shirt.
                </p>

                <a
                  href="https://go-atheneumavelgem.be/webshop/#!/products/t-shirt-lo"
                  target="_blank"
                  rel="noreferrer"
                  style={shirtShopButtonStyle}
                >
                  <span>🛒</span>
                  <span>Bestel een nieuw LO-T-shirt</span>
                  <span style={{ opacity: 0.65 }}>↗</span>
                </a>
              </div>
            </InfoBlock>
          </div>

          <div className="content-grid two">
            <InfoBlock icon="💍" title="Persoonlijke afspraken">
              <ul>
                <li>Sieraden en piercings worden uitgedaan.</li>
                <li>Lang haar wordt samengebonden.</li>
                <li>
                  Waardevolle voorwerpen laat je niet onbeheerd achter in de
                  kleedkamer.
                </li>
                <li>
                  Medische problemen die invloed kunnen hebben op je deelname
                  meld je aan je LO-leerkracht.
                </li>
              </ul>
            </InfoBlock>

            <InfoBlock icon="🚌" title="Verplaatsing met de bus">
              <ul>
                <li>Op de bus wordt niet gegeten of gedronken.</li>
                <li>Je houdt je rugzak bij je.</li>
                <li>Je draagt steeds je veiligheidsgordel.</li>
                <li>
                  Volg de aanwijzingen van je leerkracht bij het in- en
                  uitstappen.
                </li>
              </ul>
            </InfoBlock>
          </div>

          <InfoBlock icon="⏱️" title="Na-uur">
            <p>
              Bij een na-uur zorgen we ervoor dat we tijdig terug op school
              zijn. In uitzonderlijke omstandigheden kun je, mits toestemming
              van je ouders en de directie, vanaf de sporthal vertrekken om
              een lijnbus te nemen.
            </p>

            <Callout>
              Je verlaat hiervoor de LO-les nooit vroegtijdig.
            </Callout>
          </InfoBlock>
        </SectionCard>
      </section>

      {/* =========================================================
          TIJDENS DE LES
      ========================================================= */}
      <section id="tijdens-de-les" className="section scroll-section">
        <SectionCard
          number="02"
          eyebrow="TIJDENS DE LES"
          title="Inzet, veiligheid en samenwerken"
          icon="🏃"
        >
          <div className="content-grid two">
            <InfoBlock icon="🚪" title="Kleedkamer">
              <ul>
                <li>Het blijft rustig tijdens het omkleden.</li>
                <li>Je blijft in je eigen kleedruimte.</li>
                <li>
                  Na het omkleden kom je onmiddellijk naar de sportzaal.
                </li>
                <li>
                  Vuile schoenen worden uitgedaan bij het binnenkomen van het
                  gebouw.
                </li>
                <li>Na het belsignaal komt iedereen mee naar binnen.</li>
              </ul>
            </InfoBlock>

            <InfoBlock icon="🔥" title="Actieve deelname" important>
              <p>
                LO is een praktijkvak. We verwachten daarom dat je actief
                deelneemt en je naar eigen kunnen inzet.
              </p>

              <Callout>
                Inzet en vooruitgang zijn belangrijker dan vergelijken met
                anderen.
              </Callout>

              <p>
                Niet iedereen heeft dezelfde sportieve mogelijkheden. Kijk
                daarom vooral naar je eigen ontwikkeling, motivatie en
                vooruitgang.
              </p>
            </InfoBlock>
          </div>

          <div className="content-grid three">
            <InfoBlock icon="📵" title="Gsm">
              <p>
                Gsm&apos;s worden tijdens de LO-les niet gebruikt, behalve
                wanneer de leerkracht hiervoor uitdrukkelijk toestemming
                geeft.
              </p>
            </InfoBlock>

            <InfoBlock icon="💧" title="Water">
              <p>
                Water in een herbruikbare drinkfles is toegelaten. Je vult
                deze vóór of na de les bij.
              </p>
            </InfoBlock>

            <InfoBlock icon="📚" title="Smartschool">
              <p>
                Bekijk regelmatig je planner en berichten op Smartschool voor
                speciale benodigdheden of wijzigingen.
              </p>
            </InfoBlock>
          </div>

          <InfoBlock icon="🛡️" title="Ongevallen">
            <p>
              Je bent via de school verzekerd tegen ongevallen. Bij een
              ongeval volg je de instructies van je leerkracht en neem je
              indien nodig contact op met het leerlingensecretariaat voor de
              verzekeringsdocumenten.
            </p>
          </InfoBlock>
        </SectionCard>
      </section>

      {/* =========================================================
          RESPECT
      ========================================================= */}
      <section id="respect" className="section scroll-section">
        <SectionCard
          number="03"
          eyebrow="SAMEN SPORTEN"
          title="Respect vormt de basis"
          icon="🤝"
        >
          <div className="respect-intro">
            <div className="respect-icon">💛</div>

            <div>
              <h3>Iedereen moet zich goed voelen tijdens de LO-les.</h3>

              <p>
                Daarom verwachten we respect voor elkaar, voor de leerkrachten
                en voor de omgeving waarin we sporten.
              </p>
            </div>
          </div>

          <div className="content-grid three">
            <RespectCard
              icon="👥"
              title="Voor elkaar"
              text="We sluiten niemand uit, maken eerlijk groepen en behandelen elkaar correct."
            />

            <RespectCard
              icon="🏅"
              title="Fair play"
              text="We spelen sportief, aanvaarden beslissingen en kunnen omgaan met winnen én verliezen."
            />

            <RespectCard
              icon="🏀"
              title="Voor materiaal"
              text="We gebruiken sportmateriaal waarvoor het bedoeld is en ruimen het samen correct op."
            />
          </div>

          <Callout>
            Iedereen helpt bij het klaarzetten en opruimen van materiaal. Zorg
            er ook voor dat nooduitgangen steeds vrij blijven.
          </Callout>
        </SectionCard>
      </section>

      {/* =========================================================
          EVALUATIE
      ========================================================= */}
      <section id="evaluatie" className="section scroll-section">
        <SectionCard
          number="04"
          eyebrow="EVALUATIE"
          title="Wat beoordelen we?"
          icon="✅"
        >
          <p className="intro-text">
            Tijdens LO kijken we niet alleen naar wat je kunt, maar ook naar
            hoe je leert, samenwerkt en deelneemt.
          </p>

          <div className="evaluation-grid">
            <EvaluationCard
              icon="🎯"
              number="01"
              title="Bekwaamheid"
              subtitle="Bewegingsgebonden doelstellingen"
            >
              Hierbij kijken we naar je motorische vaardigheden en naar de
              mate waarin je de doelen van een bepaalde sport of activiteit
              beheerst.
            </EvaluationCard>

            <EvaluationCard
              icon="🤝"
              number="02"
              title="Bereidheid"
              subtitle="Persoonsgebonden doelstellingen"
            >
              Hierbij kijken we naar je inzet, houding, samenwerking,
              zelfstandigheid, fair play en de manier waarop je met feedback
              omgaat.
            </EvaluationCard>
          </div>

          <div className="rubric-box">
            <div className="rubric-icon">📊</div>

            <div>
              <h3>Evalueren met rubrics</h3>

              <p>
                We gebruiken rubrics om duidelijk te maken welke criteria
                belangrijk zijn en welke stappen je kunt zetten om verder te
                groeien.
              </p>

              <p>
                De rubrics en evaluatiecriteria vind je terug via de
                LO-onderdelen in de app en waar nodig op Smartschool.
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      {/* =========================================================
          EXTRA
      ========================================================= */}
      <section className="section">
        <SectionCard
          eyebrow="EXTRA"
          title="Ook buiten de gewone LO-les"
          icon="✨"
        >
          <div className="content-grid two">
            <InfoBlock icon="🏓" title="Uitleendienst">
              <p>
                Tijdens de middagpauze kun je sportmateriaal ontlenen via de
                uitleendienst.
              </p>

              <p>
                Het materiaal wordt steeds correct gebruikt en na afloop
                teruggebracht naar de afgesproken plaats.
              </p>
            </InfoBlock>

            <InfoBlock icon="🏋️" title="Fitnessruimte">
              <p>
                De fitnessruimte wordt enkel gebruikt volgens de afspraken en
                onder de voorwaarden die door de LO-leerkrachten worden
                meegedeeld.
              </p>
            </InfoBlock>
          </div>
        </SectionCard>
      </section>

      {/* =========================================================
          SPORT BUITEN SCHOOL
      ========================================================= */}
      <section
        id="sport-buiten-school"
        className="section scroll-section"
      >
        <SectionCard
          number="05"
          eyebrow="MEER BEWEGEN"
          title="Buitenschoolse & naschoolse sport"
          icon="🏆"
        >
          <p className="intro-text">
            Ook buiten de gewone lessen zijn er mogelijkheden om samen te
            sporten, deel te nemen aan tornooien of nieuwe sporten te
            ontdekken.
          </p>

          <div className="activity-grid">
            <ActivityCard
              icon="🏃"
              title="Helpers veldloop"
              text="Leerlingen kunnen helpen bij de veldloop van de lagere school."
            />

            <ActivityCard
              icon="🌲"
              title="Survival Trophy"
              text="Sportieve activiteit voor leerlingen van de derde graad. Concrete informatie volgt via de LO-leerkrachten."
            />

            <ActivityCard
              icon="🏸"
              title="MOEV"
              text="Via MOEV nemen we deel aan verschillende sportactiviteiten en competities."
              href="https://www.moev.be/activiteiten/filters:west-vlaanderen,secundair-onderwijs"
              linkText="Bekijk MOEV"
            />

            <ActivityCard
              icon="⚽"
              title="Tornooien"
              text="Onder andere dodgeball, voetbal en badminton op woensdagnamiddag."
            />
          </div>

          {/* SKIREIS */}
          <div className="featured-activity ski">
            <div className="featured-top">
              <div className="featured-icon">⛷️</div>

              <div>
                <div className="featured-label">SKIREIS</div>
                <h3>Ahrntal</h3>
              </div>
            </div>

            <div className="trip-grid">
              <TripDetail
                label="Wanneer?"
                value="Vrijdagavond 18/12 → donderdagvoormiddag 24/12"
              />

              <TripDetail label="Bestemming" value="Ahrntal" />

              <TripDetail label="Prijs" value="€ 771 per leerling" />

              <TripDetail label="Plaatsen" value="45 leerlingen" />

              <TripDetail
                label="Voorschot"
                value="€ 100 tegen woensdag 16/9"
              />
            </div>
          </div>

          {/* SNS */}
          <div className="featured-activity sns">
            <div className="featured-top">
              <div className="featured-icon">🎟️</div>

              <div>
                <div className="featured-label">SPORT NA SCHOOL</div>
                <h3>SNS-pas</h3>
              </div>
            </div>

            <p>
              De SNS-pas is een sportpas voor leerlingen van het secundair
              onderwijs waarmee je aansluitend op de schooluren aan
              verschillende sportactiviteiten kunt deelnemen.
            </p>

            <p>
              Met een SNS-pas kun je sporten waar, wanneer, hoeveel en met wie
              je wilt.
            </p>

            <div className="sns-price-grid">
              <div className="price-card">
                <span>30 weken</span>
                <strong>€ 55</strong>
              </div>

              <div className="price-card">
                <span>15 weken</span>
                <strong>€ 35</strong>
              </div>
            </div>

            <div className="sns-note">
              <span>📅</span>
              <p>
                Vanaf <strong>21 september 2026</strong>. De SNS-pas is niet
                geldig tijdens weekends, wettelijke feestdagen en
                schoolvakanties.
              </p>
            </div>

            <a
              href="https://sportnaschool.be/"
              target="_blank"
              rel="noreferrer"
              className="external-button"
            >
              Bekijk Sport Na School
              <span>↗</span>
            </a>
          </div>
        </SectionCard>
      </section>

      {/* =========================================================
          AFSLUITER
      ========================================================= */}
      <section className="section final-section">
        <div className="final-card">
          <div className="final-emoji">💛</div>

          <div className="final-content">
            <div className="eyebrow">TOT SLOT</div>

            <h2>Samen maken we er een sterk schooljaar van.</h2>

            <p>
              Heb je een vraag, voorstel of wens? Spreek gerust één van de
              LO-leerkrachten aan.
            </p>

            <p className="final-highlight">
              Als we ons allemaal aan deze afspraken houden, zorgen we samen
              voor veilige, actieve en aangename LO-lessen.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          STYLES
      ========================================================= */}
      <style jsx>{`
        .section {
          margin-top: 18px;
        }

        .scroll-section {
          scroll-margin-top: 90px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 14px;
        }

        .section-heading h2 {
          margin: 3px 0 0;
          color: ${ui.text};
          font-size: clamp(20px, 2.5vw, 28px);
          line-height: 1.1;
          letter-spacing: -0.04em;
        }

        .section-heading > p {
          max-width: 500px;
          margin: 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 13.5px;
          line-height: 1.55;
        }

        .eyebrow {
          color: rgba(255, 255, 255, 0.44);
          font-size: 10.5px;
          font-weight: 950;
          letter-spacing: 0.13em;
        }

        .key-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .vision-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .content-grid {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }

        .content-grid.two,
        .content-grid.three {
          grid-template-columns: 1fr;
        }

        .evaluation-grid {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .activity-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 18px;
        }

        .respect-intro {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid rgba(250, 204, 21, 0.15);
          border-radius: 20px;
          background: rgba(250, 204, 21, 0.055);
        }

        .respect-icon {
          display: grid;
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          place-items: center;
          border-radius: 17px;
          background: rgba(250, 204, 21, 0.11);
          font-size: 25px;
        }

        .respect-intro h3 {
          margin: 0;
          color: ${ui.text};
          font-size: 16px;
        }

        .respect-intro p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, 0.62);
          font-size: 13.5px;
          line-height: 1.6;
        }

        .intro-text {
          max-width: 850px;
          margin: 0;
          color: rgba(255, 255, 255, 0.73);
          font-size: 14px;
          line-height: 1.75;
        }

        .rubric-box {
          display: flex;
          gap: 15px;
          margin-top: 12px;
          padding: 18px;
          border: 1px solid rgba(96, 165, 250, 0.16);
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.055);
        }

        .rubric-icon {
          display: grid;
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          place-items: center;
          border-radius: 15px;
          background: rgba(59, 130, 246, 0.1);
          font-size: 21px;
        }

        .rubric-box h3 {
          margin: 2px 0 6px;
          color: ${ui.text};
          font-size: 15px;
        }

        .rubric-box p {
          margin: 4px 0 0;
          color: rgba(255, 255, 255, 0.64);
          font-size: 13.5px;
          line-height: 1.65;
        }

        .featured-activity {
          margin-top: 14px;
          padding: 20px;
          overflow: hidden;
          border: 1px solid ${ui.border};
          border-radius: 24px;
        }

        .featured-activity.ski {
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(96, 165, 250, 0.16),
              transparent 35%
            ),
            rgba(255, 255, 255, 0.025);
        }

        .featured-activity.sns {
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(34, 197, 94, 0.14),
              transparent 35%
            ),
            rgba(255, 255, 255, 0.025);
        }

        .featured-top {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 17px;
        }

        .featured-icon {
          display: grid;
          width: 51px;
          height: 51px;
          place-items: center;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.065);
          font-size: 24px;
        }

        .featured-label {
          color: rgba(255, 255, 255, 0.42);
          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: 0.14em;
        }

        .featured-top h3 {
          margin: 2px 0 0;
          color: ${ui.text};
          font-size: 20px;
          letter-spacing: -0.03em;
        }

        .featured-activity > p {
          max-width: 820px;
          margin: 7px 0 0;
          color: rgba(255, 255, 255, 0.66);
          font-size: 13.5px;
          line-height: 1.65;
        }

        .trip-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .sns-price-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 430px;
          margin-top: 18px;
        }

        .price-card {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px;
          border: 1px solid rgba(34, 197, 94, 0.14);
          border-radius: 16px;
          background: rgba(34, 197, 94, 0.06);
        }

        .price-card span {
          color: rgba(255, 255, 255, 0.52);
          font-size: 11px;
          font-weight: 800;
        }

        .price-card strong {
          color: ${ui.text};
          font-size: 22px;
          letter-spacing: -0.04em;
        }

        .sns-note {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          max-width: 760px;
          margin-top: 14px;
          padding: 13px 14px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.04);
        }

        .sns-note p {
          margin: 0;
          color: rgba(255, 255, 255, 0.65);
          font-size: 12.5px;
          line-height: 1.55;
        }

        .external-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 15px;
          padding: 11px 15px;
          border: 1px solid rgba(34, 197, 94, 0.18);
          border-radius: 13px;
          background: rgba(34, 197, 94, 0.09);
          color: #bbf7d0;
          font-size: 12.5px;
          font-weight: 900;
          text-decoration: none;
        }

        .final-section {
          margin-bottom: 20px;
        }

        .final-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: clamp(20px, 4vw, 34px);
          border: 1px solid rgba(250, 204, 21, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(
              circle at 0% 0%,
              rgba(250, 204, 21, 0.12),
              transparent 38%
            ),
            rgba(255, 255, 255, 0.025);
        }

        .final-emoji {
          display: grid;
          flex: 0 0 66px;
          width: 66px;
          height: 66px;
          place-items: center;
          border-radius: 21px;
          background: rgba(250, 204, 21, 0.09);
          font-size: 30px;
        }

        .final-content h2 {
          margin: 5px 0 7px;
          color: ${ui.text};
          font-size: clamp(20px, 3vw, 27px);
          letter-spacing: -0.04em;
        }

        .final-content p {
          margin: 0;
          color: rgba(255, 255, 255, 0.59);
          font-size: 13.5px;
          line-height: 1.6;
        }

        .final-content .final-highlight {
          margin-top: 7px;
          color: rgba(255, 255, 255, 0.82);
          font-weight: 750;
        }

        @media (min-width: 720px) {
          .key-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .content-grid.two {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .content-grid.three {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .evaluation-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .activity-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 900px) {
          .vision-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .section-heading {
            display: block;
          }

          .section-heading > p {
            margin-top: 7px;
          }

          .key-grid {
            grid-template-columns: 1fr;
          }

          .final-card {
            align-items: flex-start;
          }

          .final-emoji {
            width: 51px;
            height: 51px;
            flex-basis: 51px;
            border-radius: 16px;
            font-size: 24px;
          }

          .trip-grid {
            grid-template-columns: 1fr;
          }

          .rubric-box {
            display: block;
          }

          .rubric-icon {
            margin-bottom: 10px;
          }

          .respect-intro {
            align-items: flex-start;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionCard({
  number,
  eyebrow,
  title,
  icon,
  children,
}: {
  number?: string;
  eyebrow: string;
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <div style={sectionCardStyle}>
      <div style={sectionCardHeaderStyle}>
        <div style={sectionIconStyle}>{icon}</div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {number && (
              <span
                style={{
                  color: "rgba(255,255,255,0.28)",
                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: "0.08em",
                }}
              >
                {number}
              </span>
            )}

            <span
              style={{
                color: "rgba(255,255,255,0.42)",
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: "0.13em",
              }}
            >
              {eyebrow}
            </span>
          </div>

          <h2 style={sectionTitleStyle}>{title}</h2>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

function KeyRule({
  icon,
  title,
  text,
  accent,
}: {
  icon: string;
  title: string;
  text: string;
  accent: Accent;
}) {
  const accentColor = accentMap[accent];

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 20,
        border: `1px solid ${accentColor.border}`,
        background: accentColor.background,
        minHeight: 145,
      }}
    >
      <div
        style={{
          display: "grid",
          width: 44,
          height: 44,
          placeItems: "center",
          borderRadius: 14,
          background: accentColor.icon,
          fontSize: 21,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          marginTop: 13,
          color: ui.text,
          fontSize: 14,
          fontWeight: 950,
        }}
      >
        {title}
      </div>

      <p
        style={{
          margin: "5px 0 0",
          color: "rgba(255,255,255,0.60)",
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div style={miniFeatureStyle}>
      <div style={{ fontSize: 20 }}>{icon}</div>

      <div
        style={{
          marginTop: 8,
          color: ui.text,
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        {title}
      </div>

      <p
        style={{
          margin: "4px 0 0",
          color: "rgba(255,255,255,0.55)",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  important = false,
  children,
}: {
  icon: string;
  title: string;
  important?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...infoBlockStyle,
        ...(important
          ? {
              borderColor: "rgba(251,191,36,0.15)",
              background: "rgba(251,191,36,0.035)",
            }
          : {}),
      }}
    >
      <div style={infoTitleStyle}>
        <span style={{ fontSize: 19 }}>{icon}</span>
        <span>{title}</span>
      </div>

      <div style={infoContentStyle}>{children}</div>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div style={calloutStyle}>
      <span style={{ opacity: 0.75 }}>→</span>
      <span>{children}</span>
    </div>
  );
}

function RespectCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div style={respectCardStyle}>
      <div style={{ fontSize: 22 }}>{icon}</div>

      <div
        style={{
          marginTop: 10,
          color: ui.text,
          fontSize: 13.5,
          fontWeight: 950,
        }}
      >
        {title}
      </div>

      <p
        style={{
          margin: "5px 0 0",
          color: "rgba(255,255,255,0.58)",
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function EvaluationCard({
  icon,
  number,
  title,
  subtitle,
  children,
}: {
  icon: string;
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div style={evaluationCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 24 }}>{icon}</div>

        <span
          style={{
            color: "rgba(255,255,255,0.18)",
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          {number}
        </span>
      </div>

      <h3
        style={{
          margin: "13px 0 2px",
          color: ui.text,
          fontSize: 16,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10.5,
          fontWeight: 850,
        }}
      >
        {subtitle}
      </div>

      <p
        style={{
          margin: "10px 0 0",
          color: "rgba(255,255,255,0.63)",
          fontSize: 12.5,
          lineHeight: 1.6,
        }}
      >
        {children}
      </p>
    </div>
  );
}

function ActivityCard({
  icon,
  title,
  text,
  href,
  linkText,
}: {
  icon: string;
  title: string;
  text: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div style={activityCardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={activityIconStyle}>{icon}</div>

        <div
          style={{
            color: ui.text,
            fontSize: 13.5,
            fontWeight: 950,
          }}
        >
          {title}
        </div>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          color: "rgba(255,255,255,0.57)",
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>

      {href && linkText && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={smallExternalLinkStyle}
        >
          {linkText} ↗
        </a>
      )}
    </div>
  );
}

function TripDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={tripDetailStyle}>
      <span
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontWeight: 850,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          marginTop: 3,
          color: ui.text,
          fontSize: 12.5,
          lineHeight: 1.4,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   TYPES
========================================================= */

type Accent = "blue" | "red" | "orange" | "cyan" | "green";

/* =========================================================
   STYLES
========================================================= */

const sectionCardStyle: CSSProperties = {
  padding: "clamp(18px, 3vw, 28px)",
  borderRadius: 28,
  border: `1px solid ${ui.border}`,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
  boxShadow: "0 18px 60px rgba(0,0,0,0.14)",
};

const sectionCardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 13,
};

const sectionIconStyle: CSSProperties = {
  display: "grid",
  width: 51,
  height: 51,
  flex: "0 0 51px",
  placeItems: "center",
  borderRadius: 17,
  border: `1px solid ${ui.border}`,
  background: "rgba(255,255,255,0.045)",
  fontSize: 23,
};

const sectionTitleStyle: CSSProperties = {
  margin: "3px 0 0",
  color: ui.text,
  fontSize: "clamp(19px, 3vw, 25px)",
  lineHeight: 1.15,
  letterSpacing: "-0.035em",
};

const miniFeatureStyle: CSSProperties = {
  minHeight: 125,
  padding: 14,
  borderRadius: 18,
  border: `1px solid ${ui.border}`,
  background: "rgba(255,255,255,0.025)",
};

const infoBlockStyle: CSSProperties = {
  padding: 17,
  borderRadius: 20,
  border: `1px solid ${ui.border}`,
  background: "rgba(0,0,0,0.16)",
};

const infoTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  color: ui.text,
  fontSize: 14,
  fontWeight: 950,
};

const infoContentStyle: CSSProperties = {
  marginTop: 10,
  color: "rgba(255,255,255,0.65)",
  fontSize: 13,
  lineHeight: 1.65,
};

const calloutStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 11,
  padding: "10px 12px",
  borderRadius: 13,
  background: "rgba(255,255,255,0.045)",
  color: "rgba(255,255,255,0.78)",
  fontSize: 12.5,
  fontWeight: 750,
  lineHeight: 1.5,
};

const shirtShopStyle: CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 17,
  border: "1px solid rgba(59,130,246,0.16)",
  background:
    "linear-gradient(135deg, rgba(59,130,246,0.07), rgba(59,130,246,0.025))",
};

const shirtShopHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const shirtShopIconStyle: CSSProperties = {
  display: "grid",
  width: 39,
  height: 39,
  flex: "0 0 39px",
  placeItems: "center",
  borderRadius: 12,
  background: "rgba(59,130,246,0.11)",
  fontSize: 18,
};

const shirtShopLabelStyle: CSSProperties = {
  color: "rgba(147,197,253,0.72)",
  fontSize: 9,
  fontWeight: 950,
  letterSpacing: "0.12em",
};

const shirtShopTitleStyle: CSSProperties = {
  marginTop: 1,
  color: ui.text,
  fontSize: 13.5,
  fontWeight: 950,
};

const shirtShopTextStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "rgba(255,255,255,0.66)",
  fontSize: 12.5,
  lineHeight: 1.6,
};

const shirtShopButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 12,
  padding: "10px 13px",
  borderRadius: 12,
  border: "1px solid rgba(59,130,246,0.2)",
  background: "rgba(59,130,246,0.1)",
  color: "#bfdbfe",
  fontSize: 12,
  fontWeight: 900,
  textDecoration: "none",
};

const respectCardStyle: CSSProperties = {
  padding: 17,
  borderRadius: 19,
  border: `1px solid ${ui.border}`,
  background: "rgba(255,255,255,0.025)",
};

const evaluationCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 20,
  border: `1px solid ${ui.border}`,
  background: "rgba(255,255,255,0.025)",
};

const activityCardStyle: CSSProperties = {
  padding: 17,
  borderRadius: 19,
  border: `1px solid ${ui.border}`,
  background: "rgba(255,255,255,0.025)",
};

const activityIconStyle: CSSProperties = {
  display: "grid",
  width: 39,
  height: 39,
  placeItems: "center",
  borderRadius: 12,
  background: "rgba(255,255,255,0.055)",
  fontSize: 18,
};

const smallExternalLinkStyle: CSSProperties = {
  display: "inline-block",
  marginTop: 9,
  color: "#93c5fd",
  fontSize: 11.5,
  fontWeight: 850,
  textDecoration: "none",
};

const tripDetailStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(0,0,0,0.14)",
};

const accentMap: Record<
  Accent,
  {
    border: string;
    background: string;
    icon: string;
  }
> = {
  blue: {
    border: "rgba(59,130,246,0.16)",
    background: "rgba(59,130,246,0.045)",
    icon: "rgba(59,130,246,0.11)",
  },
  red: {
    border: "rgba(248,113,113,0.16)",
    background: "rgba(248,113,113,0.045)",
    icon: "rgba(248,113,113,0.11)",
  },
  orange: {
    border: "rgba(251,146,60,0.16)",
    background: "rgba(251,146,60,0.045)",
    icon: "rgba(251,146,60,0.11)",
  },
  cyan: {
    border: "rgba(34,211,238,0.16)",
    background: "rgba(34,211,238,0.045)",
    icon: "rgba(34,211,238,0.11)",
  },
  green: {
    border: "rgba(34,197,94,0.16)",
    background: "rgba(34,197,94,0.045)",
    icon: "rgba(34,197,94,0.11)",
  },
};