"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  userName?: string | null;
  children: React.ReactNode;
};

const navItems = [
  { href: "/eurofittest", label: "Eurofittest" },
  { href: "/functional-fitheidstest", label: "Functional fitheidstest" },
  { href: "/challenges", label: "Challenges" },
  { href: "/sportfolio", label: "Sportfolio" },
  { href: "/links", label: "Links" },
];

function getInitials(name?: string | null) {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "KA";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + last).toUpperCase();
  return initials || "KA";
}

export default function AppShell({
  title = "LO App",
  subtitle = "GO! Atheneum Avelgem",
  userName,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(() => getInitials(userName), [userName]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const NavLink = ({
    href,
    label,
    first,
  }: {
    href: string;
    label: string;
    first?: boolean;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={[
          "flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold",
          "transition active:scale-[0.99]",
          first ? "" : "border-t border-white/10",
          active ? "bg-indigo-500/15 text-white" : "text-white/75 hover:text-white",
        ].join(" ")}
      >
        <span className="truncate">{label}</span>
        <span className="text-white/45">→</span>
      </Link>
    );
  };

  return (
    <div className="min-h-dvh bg-neutral-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          {/* Hamburger + dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="h-11 w-11 rounded-2xl border border-white/15 bg-white/5 grid place-items-center
                         active:scale-[0.98] transition"
            >
              <div className="grid gap-1.5">
                <span className="block h-0.5 w-5 bg-white/90" />
                <span className="block h-0.5 w-5 bg-white/90" />
                <span className="block h-0.5 w-5 bg-white/90" />
              </div>
            </button>

            {open && (
              <div className="absolute left-0 top-14 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl">
                {/* Branding */}
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="h-11 w-11 rounded-full border border-white/15 bg-white/5 grid place-items-center shadow-[0_0_18px_rgba(109,91,255,0.25)]">
                      <img
                        src="/logo-atheneum-transparant.png"
                        alt="Logo Atheneum"
                        className="h-8 w-8 object-contain drop-shadow-[0_6px_10px_rgba(34,211,238,0.14)]"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-extrabold leading-tight">{title}</div>
                      <div className="text-xs text-white/70">{subtitle}</div>
                    </div>
                  </div>

                  {/* User */}
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/55">Aangemeld als</div>
                      <div className="truncate text-sm font-semibold text-white">
                        {userName ?? "—"}
                      </div>
                    </div>

                    <div className="h-9 w-9 shrink-0 rounded-full border border-white/15 bg-indigo-500/20 grid place-items-center text-sm font-extrabold">
                      {initials}
                    </div>
                  </div>
                </div>

                {/* Navigatie */}
                <nav className="grid">
                  <NavLink href="/dashboard" label="Beginscherm" first />
                  {navItems.map((it) => (
                    <NavLink key={it.href} href={it.href} label={it.label} />
                  ))}
                  <NavLink href="/dashboard/profiel" label="Profiel" />
                </nav>

                <div className="border-t border-white/10 p-3 text-xs text-white/55">
                  Tip: voeg later “Leerkracht” items toe op basis van role.
                </div>
              </div>
            )}
          </div>

          {/* Titel met logo links + rechts */}
          <div className="flex items-center gap-4">
            <img
              src="/logo-atheneum-transparant.png"
              alt="Logo Atheneum"
              className="h-11 w-auto object-contain drop-shadow-[0_0_10px_rgba(109,91,255,0.35)]"
            />

            <div className="grid text-center leading-tight">
              <div className="text-sm font-extrabold tracking-tight">{title}</div>
              <div className="text-xs text-white/70">{subtitle}</div>
            </div>

            <img
              src="/logo-atheneum-transparant.png"
              alt="Logo Atheneum"
              className="h-11 w-auto object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.30)]"
            />
          </div>

          {/* Profiel bubble */}
          <Link
            href="/dashboard/profiel"
            aria-label="Profiel"
            title={userName ?? "Profiel"}
            className="h-11 w-11 rounded-full border border-white/15
                       bg-gradient-to-br from-indigo-500 to-cyan-300
                       grid place-items-center text-[13px] font-extrabold tracking-wide text-neutral-950
                       active:scale-[0.98] transition"
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
