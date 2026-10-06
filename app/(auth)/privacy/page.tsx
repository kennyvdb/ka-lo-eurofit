import Link from "next/link";



export default function PrivacyPage() {

  return (

    <main className="min-h-dvh bg-neutral-950 px-5 py-8 text-white sm:px-6">

      <div className="mx-auto w-full max-w-3xl">

        <Link

          href="/login"

          className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"

        >

          <span aria-hidden="true">←</span>

          Terug naar inloggen

        </Link>



        <header className="mt-8">

          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">

            LOOP

          </div>



          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">

            Privacyverklaring

          </h1>



          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">

            Informatie over de verwerking van persoonsgegevens binnen LOOP,

            het digitale platform voor lichamelijke opvoeding van GO! Atheneum

            Avelgem.

          </p>

        </header>



        <div className="mt-8 space-y-5">

          <Section title="Wat is LOOP?">

            <p>

              LOOP staat voor Lichamelijke Opvoeding Online Platform en is een

              digitaal platform dat wordt gebruikt ter ondersteuning van de

              lessen en activiteiten lichamelijke opvoeding binnen GO! Atheneum

              Avelgem.

            </p>



            <p>

              Het platform ondersteunt onder andere de opvolging van

              leeractiviteiten, testresultaten, opdrachten, evaluaties,

              Sportfolio en activiteiten binnen lichamelijke opvoeding.

            </p>

          </Section>



          <Section title="Wie is verantwoordelijk voor de verwerking?">

            <p>

              LOOP wordt gebruikt binnen GO! Atheneum Avelgem. De verwerking

              van persoonsgegevens gebeurt binnen de onderwijsopdracht en het

              privacybeleid van GO! Onderwijs van de Vlaamse Gemeenschap.

            </p>



            <p>

              Voor vragen over de verwerking van persoonsgegevens binnen de

              school kan contact worden opgenomen via:

            </p>



            <ContactBlock>

              <strong>GO! Atheneum Avelgem</strong>

              <br />

              Oudenaardsesteenweg 20

              <br />

              8580 Avelgem

              <br />

              E-mail:{" "}

              <a

                href="mailto:kenny.vandeborre@go-atheneumavelgem.be"

                className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"

              >

                kenny.vandeborre@go-atheneumavelgem.be

              </a>

            </ContactBlock>

          </Section>



          <Section title="Welke persoonsgegevens verwerkt LOOP?">

            <p>

              Afhankelijk van de functies die worden gebruikt, kan LOOP onder

              andere de volgende persoonsgegevens verwerken:

            </p>



            <ul className="list-disc space-y-2 pl-5">

              <li>naam en school-e-mailadres;</li>

              <li>klas, leerjaar, graad, finaliteit en LO-groep;</li>

              <li>gebruikersrol en technische accountidentificatie;</li>



              <li>

                geboortedatum of leeftijd wanneer dit nodig is voor een

                specifieke functie of normering;

              </li>



              <li>

                geslacht wanneer dit nodig is voor de toepassing van sport- of

                fitheidsnormen;

              </li>



              <li>resultaten van LO-, conditie- en fitheidstesten;</li>

              <li>MAS-, Eurofit- en andere sportresultaten;</li>

              <li>Sportfolioresultaten en evaluaties;</li>

              <li>opdrachten, reflecties en antwoorden;</li>

              <li>deelname aan challenges en sportactiviteiten;</li>

              <li>reservaties en inschrijvingen voor activiteiten;</li>



              <li>

                technische gegevens die noodzakelijk zijn voor de veilige en

                correcte werking van het platform.

              </li>

            </ul>

          </Section>



          <Section title="Waar komen de gegevens vandaan?">

            <p>

              Een deel van de gegevens wordt rechtstreeks door leerlingen of

              medewerkers in LOOP ingevoerd.

            </p>



            <p>

              Andere gegevens kunnen afkomstig zijn uit de administratieve

              systemen van de school, waaronder gegevens die vanuit Smartschool

              worden gesynchroniseerd, zoals naam, schoolaccount, klas en

              groepsinformatie.

            </p>



            <p>

              Resultaten en andere gegevens die binnen LOOP worden aangemaakt,

              kunnen vervolgens binnen het platform worden gebruikt voor

              opvolging en evaluatie binnen lichamelijke opvoeding.

            </p>

          </Section>



          <Section title="Waarom verwerken we deze gegevens?">

            <p>

              De persoonsgegevens worden verwerkt om de onderwijsactiviteiten

              binnen lichamelijke opvoeding te organiseren en te ondersteunen.

            </p>



            <p>

              Dit omvat onder andere het identificeren van leerlingen, beheren

              van klassen en LO-groepen, registreren en opvolgen van

              testresultaten, aanbieden en evalueren van opdrachten, bijhouden

              van het Sportfolio en organiseren van sportactiviteiten en

              reservaties.

            </p>

          </Section>



          <Section title="Op welke rechtsgrond gebeurt dit?">

            <p>

              GO! Atheneum Avelgem verwerkt persoonsgegevens in het kader van

              zijn onderwijsopdracht. Voor verwerkingen die noodzakelijk zijn

              voor deze onderwijsopdracht kan de verwerking onder andere

              gebaseerd zijn op de vervulling van taken van algemeen belang en

              op wettelijke of decretale verplichtingen die op de school van

              toepassing zijn.

            </p>



            <p>

              Wanneer voor een specifieke verwerking een andere rechtsgrond

              vereist is, wordt de toepasselijke rechtsgrond gebruikt. Wanneer

              een verwerking op toestemming gebaseerd is, kan die toestemming

              worden ingetrokken overeenkomstig de toepasselijke regels.

            </p>

          </Section>



          <Section title="Sportfolio en klassementen">
          <p>
            Binnen het Sportfolio kunnen voor bepaalde sportonderdelen
            klassementen worden weergegeven. Daarbij kunnen de behaalde score en
            plaats van een leerling zichtbaar zijn voor andere leerlingen binnen
            het toepasselijke klassement.
          </p>

          <p>
            De naam van een leerling wordt alleen aan andere leerlingen getoond
            wanneer de leerling hiervoor uitdrukkelijk toestemming heeft gegeven
            in LOOP. Zonder toestemming blijven de prestatie en plaats zichtbaar,
            maar wordt de naam weergegeven als &quot;Anoniem&quot;.
          </p>

          <p>
            Het geven of weigeren van toestemming heeft geen invloed op punten,
            evaluaties of deelname aan de lessen lichamelijke opvoeding. De
            leerling kan deze keuze op elk moment wijzigen via het profiel in
            LOOP.
          </p>

          <p>
            LO-leerkrachten en bevoegde beheerders kunnen de identiteit van
            leerlingen blijven raadplegen wanneer dit noodzakelijk is voor de
            onderwijsopdracht, evaluatie en opvolging.
          </p>
        </Section>

        <Section title="Wie heeft toegang tot de gegevens?">

            <p>

              Toegang tot LOOP gebeurt via een toegelaten schoolaccount. Binnen

              het platform worden rollen en toegangsrechten gebruikt om te

              bepalen welke informatie een leerling, leerkracht, LO-leerkracht

              of beheerder kan raadplegen of wijzigen.

            </p>



            <p>

              Gebruikers krijgen alleen toegang tot persoonsgegevens voor zover

              dit noodzakelijk is voor hun rol en de werking van het platform.

              Leerlingen krijgen geen algemene beheertoegang tot de

              persoonsgegevens van andere gebruikers.

            </p>

          </Section>



          <Section title="Externe dienstverleners">

            <p>

              Voor de technische werking van LOOP wordt gebruikgemaakt van

              externe dienstverleners.

            </p>



            <ul className="list-disc space-y-2 pl-5">

              <li>

                <strong>Supabase</strong> wordt gebruikt voor onder andere

                authenticatie, databankfunctionaliteit en gegevensopslag.

              </li>



              <li>

                <strong>Vercel</strong> wordt gebruikt voor de hosting en

                beschikbaarheid van de webapplicatie.

              </li>



              <li>

                <strong>Google</strong> wordt gebruikt voor authenticatie met

                het schoolaccount.

              </li>



              <li>

                <strong>OpenAI</strong> wordt gebruikt als ondersteunende

                AI-dienstverlener voor de beoordeling van bepaalde

                LO-opdrachten. Hiervoor worden alleen de inhoudelijke gegevens

                uit het huiswerkformulier doorgestuurd die noodzakelijk zijn

                voor de AI-beoordeling.

              </li>

            </ul>



            <p>

              Wanneer externe partijen in opdracht van de school

              persoonsgegevens verwerken, moeten daarvoor de toepasselijke

              afspraken inzake gegevensbescherming worden nageleefd.

            </p>

          </Section>



          <Section title="Gebruik van artificiële intelligentie">

            <p>

              Bij bepaalde huiswerkopdrachten binnen LOOP wordt artificiële

              intelligentie gebruikt als aanvullende ondersteuning bij de

              beoordeling. Hiervoor wordt de API van OpenAI gebruikt.

            </p>



            <p>

              Voor deze AI-beoordeling worden alleen de inhoudelijke gegevens

              uit het huiswerkformulier doorgestuurd die nodig zijn om de

              opdracht te beoordelen. Afhankelijk van de opdracht kan dit

              bijvoorbeeld gaan om trainingsgegevens, MAS, hartslag, praattest,

              RPE, energie-inname, energieverbruik, macronutriënten en

              persoonlijke reflecties.

            </p>



            <p>

              Naam, e-mailadres, klas, gebruikers-ID, geslacht en

              lichaamsgewicht worden niet afzonderlijk aan OpenAI meegestuurd

              voor deze beoordeling.

            </p>



            <p>

              De AI-beoordeling is een aanvullende ondersteuning voor de

              LO-leerkracht. Ze vervangt niet de verantwoordelijkheid van de

              leerkracht voor de uiteindelijke beoordeling en opvolging van de

              leerling.

            </p>



            <p>

              Gegevens die via de OpenAI API worden verwerkt, worden standaard

              niet gebruikt om de modellen van OpenAI te trainen.

            </p>

          </Section>



          <Section title="Lokale opslag op het toestel">

            <p>

              LOOP gebruikt voor bepaalde functies ook lokale browseropslag.

              Dit kan bijvoorbeeld nodig zijn voor tijdelijke conceptgegevens,

              persoonlijke checklists, voorlopige testresultaten en offline

              functionaliteit.

            </p>



            <p>

              Hiervoor kunnen technieken zoals cookies, localStorage, IndexedDB

              en browsercache worden gebruikt. Meer informatie hierover staat

              in het{" "}

              <Link

                href="/cookies"

                className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"

              >

                cookiebeleid

              </Link>

              .

            </p>

          </Section>



          <Section title="Beveiliging">

            <p>

              Er worden technische en organisatorische maatregelen toegepast

              om persoonsgegevens te beschermen tegen ongeoorloofde toegang,

              verlies, wijziging of misbruik.

            </p>



            <p>

              LOOP maakt onder andere gebruik van authenticatie, rolgebaseerde

              toegangscontrole en beveiligingsregels op databaseniveau.

            </p>

          </Section>



          <Section title="Hoe lang worden gegevens bewaard?">

            <p>

              Persoonsgegevens worden niet langer bewaard dan noodzakelijk voor

              het doel waarvoor ze worden verwerkt en overeenkomstig de

              toepasselijke onderwijs-, privacy- en archiveringsregels.

            </p>



            <p>

              De concrete bewaartermijn kan verschillen naargelang het soort

              gegeven en het doel van de verwerking. Wanneer gegevens niet

              langer noodzakelijk zijn en er geen wettelijke of

              organisatorische reden bestaat om ze te bewaren, worden ze

              verwijderd of geanonimiseerd waar dit passend is.

            </p>

          </Section>



          <Section title="Welke rechten heb je?">

            <p>

              Betrokkenen kunnen, binnen de voorwaarden van de AVG, onder andere

              vragen om:

            </p>



            <ul className="list-disc space-y-2 pl-5">

              <li>inzage in hun persoonsgegevens;</li>

              <li>verbetering van onjuiste gegevens;</li>



              <li>

                wissing van gegevens wanneer daarvoor aan de voorwaarden is

                voldaan;

              </li>



              <li>beperking van een verwerking;</li>



              <li>

                bezwaar tegen een verwerking wanneer de AVG dit recht voorziet;

              </li>



              <li>

                overdraagbaarheid van gegevens wanneer dit recht van toepassing

                is;

              </li>



              <li>

                intrekking van toestemming wanneer een verwerking op

                toestemming gebaseerd is.

              </li>

            </ul>



            <p>

              Niet elk recht is in iedere situatie onbeperkt van toepassing. De

              school kan bijvoorbeeld verplicht zijn bepaalde leerlinggegevens

              gedurende een bepaalde periode te bewaren.

            </p>

          </Section>



          <Section title="Privacyvragen en Data Protection Officer">

            <p>

              Voor vragen of verzoeken over persoonsgegevens kan contact worden

              opgenomen met de school via:

            </p>



            <ContactBlock>

              <a

                href="mailto:kenny.vandeborre@go-atheneumavelgem.be"

                className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"

              >

                kenny.vandeborre@go-atheneumavelgem.be

              </a>

            </ContactBlock>



            <p>

              De Data Protection Officer van GO! Scholengroep Vlaamse Ardennen

              kan worden gecontacteerd via:

            </p>



            <ContactBlock>

              <strong>Data Protection Officer</strong>

              <br />

              GO! Scholengroep Vlaamse Ardennen

              <br />

              E-mail:{" "}

              <a

                href="mailto:privacy@sgr21.be"

                className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"

              >

                privacy@sgr21.be

              </a>

            </ContactBlock>

          </Section>



          <Section title="Klacht indienen">

            <p>

              Wie van mening is dat persoonsgegevens niet correct worden

              verwerkt, kan eerst contact opnemen met de school of de Data

              Protection Officer.

            </p>



            <p>

              Daarnaast kan een klacht worden ingediend bij de bevoegde

              toezichthoudende autoriteit voor gegevensbescherming.

            </p>

          </Section>



          <Section title="Wijzigingen">

            <p>

              LOOP wordt verder ontwikkeld. Wanneer functies of verwerkingen

              wijzigen, kan deze privacyverklaring worden aangepast. De meest

              recente versie wordt via LOOP beschikbaar gesteld.

            </p>

          </Section>



          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">

            <p>

              Laatst bijgewerkt:{" "}

              <strong className="text-white/75">6 oktober 2026</strong>

            </p>

          </div>

        </div>



        <footer className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">

          <div className="flex flex-wrap items-center justify-center gap-3">

            <span>Privacy</span>



            <span aria-hidden="true">·</span>



            <Link

              href="/cookies"

              className="transition hover:text-white/70"

            >

              Cookies

            </Link>



            <span aria-hidden="true">·</span>



            <span>GO! Atheneum Avelgem</span>

          </div>

        </footer>

      </div>

    </main>

  );

}



function Section({

  title,

  children,

}: {

  title: string;

  children: React.ReactNode;

}) {

  return (

    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">

      <h2 className="text-lg font-bold tracking-tight text-white">

        {title}

      </h2>



      <div className="mt-3 space-y-3 text-sm leading-6 text-white/65 sm:text-[15px]">

        {children}

      </div>

    </section>

  );

}



function ContactBlock({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/70">

      {children}

    </div>

  );

}