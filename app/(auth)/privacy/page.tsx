import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-neutral-950 px-5 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Terug */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Terug naar inloggen
        </Link>

        {/* Header */}
        <header className="mt-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
            LOOP
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacyverklaring
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            LOOP gaat zorgvuldig om met persoonsgegevens van leerlingen en
            medewerkers van GO! Atheneum Avelgem.
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <Section title="Wat is LOOP?">
            <p>
              LOOP staat voor Lichamelijke Opvoeding Online Platform en is een
              digitaal platform dat wordt gebruikt binnen de lessen
              lichamelijke opvoeding van GO! Atheneum Avelgem.
            </p>
          </Section>

          <Section title="Welke gegevens verwerken we?">
            <p>
              Afhankelijk van het gebruik van LOOP kunnen onder andere de
              volgende gegevens worden verwerkt:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>naam en school-e-mailadres;</li>
              <li>klas, leerjaar, graad, finaliteit en LO-groep;</li>
              <li>geboortedatum of leeftijd wanneer dit functioneel nodig is;</li>
              <li>geslacht wanneer dit nodig is voor toepasselijke sportnormen;</li>
              <li>gebruikersrol en technische accountidentificatie;</li>
              <li>resultaten van LO- en fitheidstesten;</li>
              <li>opdrachten, reflecties, plannen en evaluaties;</li>
              <li>Sportfolioresultaten;</li>
              <li>challenge- en sportscores;</li>
              <li>reservaties binnen LOOP.</li>
            </ul>
          </Section>

          <Section title="Waarvoor gebruiken we deze gegevens?">
            <p>
              De gegevens worden gebruikt om LOOP te laten functioneren en om
              onderwijsactiviteiten binnen lichamelijke opvoeding te
              ondersteunen.
            </p>

            <p>
              Dit omvat onder andere het tonen en opvolgen van resultaten,
              opdrachten en evaluaties, het beheren van deelname aan
              activiteiten en het beschikbaar maken van relevante informatie
              aan de juiste leerling of bevoegde medewerker.
            </p>
          </Section>

          <Section title="Wie heeft toegang?">
            <p>
              Toegang tot LOOP gebeurt via een toegelaten Google-schoolaccount.
              Binnen het platform worden toegangsrechten gebruikt om te bepalen
              welke informatie een leerling, leerkracht, LO-leerkracht of
              beheerder kan raadplegen.
            </p>

            <p>
              Leerlingen krijgen geen algemene beheertoegang tot de
              persoonsgegevens van andere gebruikers.
            </p>
          </Section>

          <Section title="Externe dienstverleners">
            <p>
              Voor de technische werking van LOOP wordt gebruikgemaakt van
              externe dienstverleners. Supabase wordt onder andere gebruikt
              voor authenticatie en gegevensopslag. Vercel wordt gebruikt voor
              de hosting en beschikbaarheid van de webapplicatie.
            </p>

            <p>
              Google wordt gebruikt voor de authenticatie via het
              schoolaccount.
            </p>
          </Section>

          <Section title="Beveiliging">
            <p>
              Er worden technische en organisatorische maatregelen toegepast
              om persoonsgegevens te beschermen tegen ongeoorloofde toegang,
              verlies of misbruik.
            </p>

            <p>
              LOOP maakt onder andere gebruik van authenticatie,
              rolgebaseerde toegang en beveiligingsregels op databaseniveau.
            </p>
          </Section>

          <Section title="Bewaartermijn">
            <p>
              Persoonsgegevens worden niet langer bewaard dan noodzakelijk voor
              het doel waarvoor ze worden verwerkt.
            </p>

            <p className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-amber-100/80">
              De definitieve bewaartermijnen worden vóór de officiële
              ingebruikname afgestemd met de directie en/of de
              gegevensbeschermingsverantwoordelijke van de school.
            </p>
          </Section>

          <Section title="Rechten en vragen">
            <p>
              Leerlingen, ouders en medewerkers kunnen vragen stellen over de
              verwerking van persoonsgegevens en over de uitoefening van hun
              privacyrechten via de daarvoor voorziene kanalen van de school.
            </p>

            <p>
              De definitieve contactgegevens van de verantwoordelijke en/of
              functionaris voor gegevensbescherming worden vóór de officiële
              ingebruikname aan deze privacyverklaring toegevoegd.
            </p>
          </Section>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
            <p>
              Laatst bijgewerkt:{" "}
              <strong className="text-white/75">31 augustus 2026</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
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