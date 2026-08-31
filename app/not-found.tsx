import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-neutral-950 px-6 text-white">
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center">
        <div className="w-full text-center">
          <div className="text-7xl font-black tracking-tight text-white/10">
            404
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Pagina niet gevonden
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
            Deze pagina bestaat niet, werd verplaatst of is niet langer
            beschikbaar.
          </p>

          <Link
            href="/dashboard"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl
                       bg-gradient-to-r from-indigo-500 to-cyan-300 px-6
                       font-semibold text-neutral-950 transition
                       hover:opacity-90 active:scale-[0.98]"
          >
            Terug naar LOOP
          </Link>

          <p className="mt-8 text-xs text-white/35">
            LOOP · GO! Atheneum Avelgem
          </p>
        </div>
      </div>
    </main>
  );
}