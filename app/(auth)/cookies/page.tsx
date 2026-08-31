import Link from "next/link";

export default function CookiesPage() {
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
            Cookiebeleid
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Informatie over het gebruik van cookies en vergelijkbare
            technologieën binnen LOOP.
          </p>
        </header>

        {/* Content */}
        <div className="mt-8 space-y-5">
          <Section title="Welke cookies gebruikt LOOP?">
            <p>
              LOOP gebruikt uitsluitend technisch noodzakelijke en functionele
              technologieën die nodig zijn om het platform correct en veilig te
              laten functioneren.
            </p>

            <p>
              Deze worden onder andere gebruikt voor authenticatie,
              sessiebeheer en om ervoor te zorgen dat een gebruiker veilig
              aangemeld kan blijven tijdens het gebruik van LOOP.
            </p>
          </Section>

          <Section title="Geen reclame- of trackingcookies">
            <p>
              LOOP gebruikt geen cookies voor gepersonaliseerde advertenties of
              marketingdoeleinden.
            </p>

            <p>
              Er zijn momenteel ook geen externe analysetools zoals Google
              Analytics, Meta Pixel of vergelijkbare trackingdiensten
              geïntegreerd in LOOP.
            </p>
          </Section>

          <Section title="Waarom verschijnt er geen cookiebanner?">
            <p>
              De technisch noodzakelijke technologieën zijn vereist om functies
              zoals veilig aanmelden en sessiebeheer mogelijk te maken.
            </p>

            <p>
              Omdat LOOP momenteel geen optionele analyse-, marketing- of
              advertentiecookies gebruikt, wordt er geen toestemming gevraagd
              via een klassieke cookiebanner.
            </p>
          </Section>

          <Section title="Externe diensten">
            <p>
              LOOP maakt voor de technische werking gebruik van externe
              dienstverleners, waaronder Supabase voor onder andere
              authenticatie en gegevensopslag en Vercel voor de hosting van de
              applicatie.
            </p>
          </Section>

          <Section title="Wijzigingen">
            <p>
              Wanneer LOOP in de toekomst technologieën zou gebruiken waarvoor
              toestemming vereist is, wordt dit beleid aangepast en wordt waar
              nodig vooraf toestemming gevraagd.
            </p>
          </Section>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
            <p>
              Laatst bijgewerkt: <strong className="text-white/75">31 augustus 2026</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
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