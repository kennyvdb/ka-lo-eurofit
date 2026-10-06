import Link from "next/link";

export default function CookiesPage() {
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
            Cookies en lokale opslag
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Informatie over het gebruik van cookies en lokale
            opslagtechnologieën binnen LOOP.
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <Section title="Welke technologieën gebruikt LOOP?">
            <p>
              LOOP gebruikt cookies en lokale browseropslag die nodig zijn om
              het platform correct, veilig en gebruiksvriendelijk te laten
              functioneren.
            </p>

            <p>
              Daarbij kan gebruik worden gemaakt van cookies, localStorage,
              IndexedDB en de browsercache. Deze technieken hebben elk een
              specifieke functionele toepassing binnen de app.
            </p>
          </Section>

          <Section title="Authenticatie en sessiebeheer">
            <p>
              LOOP gebruikt Supabase voor authenticatie en gegevensopslag.
              Tijdens het aanmelden worden noodzakelijke authenticatiecookies
              gebruikt om de gebruiker veilig aangemeld te houden en de
              gebruikerssessie te beheren.
            </p>

            <p>
              De authenticatiesessie kan technisch over meerdere cookies worden
              verdeeld. Deze cookies zijn noodzakelijk voor functies waarvoor
              een aangemelde gebruiker vereist is.
            </p>
          </Section>

          <Section title="Lokale opslag op het toestel">
            <p>
              Sommige onderdelen van LOOP bewaren tijdelijk functionele
              informatie in de browser. Dit voorkomt bijvoorbeeld dat
              ingevoerde gegevens onmiddellijk verloren gaan wanneer een
              gebruiker een pagina verlaat.
            </p>

            <p>
              Zo kan lokale opslag onder andere worden gebruikt voor tijdelijke
              conceptgegevens, persoonlijke checklists en andere instellingen
              of voortgang die nodig zijn voor een goede werking van de app.
            </p>

            <p>
              Deze informatie blijft op het gebruikte toestel bewaard totdat
              de app ze verwijdert, de gebruiker of browser ze wist, of de
              browseropslag wordt verwijderd.
            </p>
          </Section>

          <Section title="Offline functies">
            <p>
              Bepaalde onderdelen van LOOP zijn ontworpen om ook bij een
              tijdelijke internetonderbreking bruikbaar te blijven.
            </p>

            <p>
              Hiervoor kan IndexedDB worden gebruikt om bijvoorbeeld
              voorlopige testgegevens en eerder geladen functionele gegevens
              lokaal te bewaren. De browsercache kan daarnaast bestanden zoals
              audio- en timinggegevens lokaal opslaan die nodig zijn voor een
              offline test.
            </p>

            <p>
              Zodra voorlopige resultaten definitief worden bevestigd, kunnen
              deze naar de centrale databank van LOOP worden verzonden.
            </p>
          </Section>

          <Section title="Geen reclame- of trackingcookies">
            <p>
              LOOP gebruikt momenteel geen cookies of vergelijkbare
              technologieën voor gepersonaliseerde advertenties of
              marketingdoeleinden.
            </p>

            <p>
              Er zijn momenteel ook geen externe analysetools zoals Google
              Analytics, Google Tag Manager, Meta Pixel of vergelijkbare
              trackingdiensten geïntegreerd in LOOP.
            </p>
          </Section>

          <Section title="Waarom verschijnt er geen cookiebanner?">
            <p>
              De cookies en lokale opslagtechnologieën die LOOP momenteel
              gebruikt, dienen voor de technische en functionele werking van de
              applicatie, zoals veilig aanmelden, sessiebeheer, het tijdelijk
              bewaren van invoer en offline functionaliteit.
            </p>

            <p>
              Omdat LOOP momenteel geen optionele analyse-, marketing- of
              advertentietechnologieën gebruikt waarvoor voorafgaande
              toestemming nodig is, wordt er geen klassieke cookiebanner
              getoond.
            </p>
          </Section>

          <Section title="Externe dienstverleners">
            <p>
              Voor de technische werking van LOOP wordt onder andere gebruik
              gemaakt van Supabase voor authenticatie en gegevensopslag en
              Vercel voor het hosten en beschikbaar stellen van de applicatie.
            </p>

            <p>
              Meer informatie over de verwerking van persoonsgegevens en de
              betrokken dienstverleners wordt opgenomen in de
              privacyverklaring van LOOP.
            </p>
          </Section>

          <Section title="Cookies en lokale gegevens verwijderen">
            <p>
              Gebruikers kunnen cookies en lokaal opgeslagen gegevens via de
              instellingen van hun browser verwijderen. Het verwijderen van
              noodzakelijke authenticatiegegevens kan ertoe leiden dat de
              gebruiker opnieuw moet aanmelden.
            </p>

            <p>
              Het verwijderen van lokale browseropslag kan daarnaast
              niet-bevestigde conceptgegevens, offline opgeslagen gegevens of
              persoonlijke voortgang verwijderen.
            </p>
          </Section>

          <Section title="Wijzigingen aan dit beleid">
            <p>
              LOOP kan verder worden ontwikkeld. Wanneer in de toekomst
              technologieën worden toegevoegd waarvoor voorafgaande
              toestemming vereist is, wordt dit beleid aangepast en wordt waar
              nodig toestemming gevraagd voordat deze technologieën worden
              geactiveerd.
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
            <Link
              href="/privacy"
              className="transition hover:text-white/70"
            >
              Privacy
            </Link>

            <span aria-hidden="true">·</span>

            <span>Cookies</span>

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