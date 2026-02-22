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

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
};

const navItems = [
  { href: "/eurofittest", label: "Eurofittest", icon: "🧪" },
  { href: "/functional-fitheidstest", label: "Functional", icon: "🏋️" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/sportfolio", label: "Sportfolio", icon: "📸" },
  { href: "/hall-of-fame", label: "Hall of Fame", icon: "🏆" },
  { href: "/les-lo", label: "Les LO", icon: "🏃‍♂️" },
  { href: "/links", label: "Links", icon: "🔗" },
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
    icon,
    first,
  }: {
    href: string;
    label: string;
    icon?: string;
    first?: boolean;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={[
          "appNavLink",
          first ? "appNavFirst" : "",
          active ? "appNavActive" : "appNavIdle",
        ].join(" ")}
      >
        <span className="appNavLeft">
          <span className={["appNavIcon", active ? "appNavIconActive" : ""].join(" ")}>
            {icon ?? "→"}
          </span>
          <span className="appNavLabel">{label}</span>
        </span>
        <span className="appNavArrow">→</span>
        <span className="appNavEdge" aria-hidden="true" />
      </Link>
    );
  };

  return (
    <div className="min-h-dvh bg-neutral-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          {/* Hamburger + dropdown */}
          <div ref={menuRef} className="relative">
            <button type="button" aria-label="Menu" onClick={() => setOpen((v) => !v)} className="menuBtn">
              <div className="grid gap-1.5 relative z-10">
                <span className="block h-0.5 w-5 bg-white/90" />
                <span className="block h-0.5 w-5 bg-white/90" />
                <span className="block h-0.5 w-5 bg-white/90" />
              </div>

              <span className="menuGlow" aria-hidden="true">
                <span className="glowBlob glowA" />
                <span className="glowBlob glowB" />
              </span>
            </button>

            {open && (
              <div className="menuDrop">
                <div className="menuBrand">
                  <span className="brandGlow brandGlow1" />
                  <span className="brandGlow brandGlow2" />

                  <div className="flex items-center gap-3 relative z-10">
                    {/* dropdown logo blijft in cirkel */}
                    <div className="logoGlow">
                      <img
                        src="/logo-atheneum-transparant.png"
                        alt="Logo Atheneum"
                        className="h-8 w-8 object-contain"
                      />
                      <span className="sweep" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-extrabold leading-tight">{title}</div>
                      <div className="text-xs text-white/70">{subtitle}</div>
                    </div>
                  </div>

                  <div className="userCard">
                    <div className="min-w-0">
                      <div className="text-xs text-white/55">Aangemeld als</div>
                      <div className="truncate text-sm font-semibold text-white">{userName ?? "—"}</div>
                    </div>

                    <div className="avatarSm">
                      {initials}
                      <span className="ring" aria-hidden="true" />
                      <span className="sweep" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <nav className="grid">
                  <NavLink href="/dashboard" label="Beginscherm" icon="🏠" first />
                  {navItems.map((it) => (
                    <NavLink key={it.href} href={it.href} label={it.label} icon={it.icon} />
                  ))}
                  <NavLink href="/dashboard/profiel" label="Profiel" icon="👤" />
                </nav>

                <div className="menuTip">Tip: voeg later “Leerkracht” items toe op basis van role.</div>
              </div>
            )}
          </div>

          {/* Center title + 2 logos (✅ GEEN cirkels meer) */}
          <div className="flex items-center gap-4">
            <div className="topLogoFree">
              <img
                src="/logo-atheneum-transparant.png"
                alt="Logo Atheneum"
                className="topLogoImg"
              />
              <span className="sweep" aria-hidden="true" />
            </div>

            <div className="grid text-center leading-tight">
              <div className="text-sm font-extrabold tracking-tight">{title}</div>
              <div className="text-xs text-white/70">{subtitle}</div>
            </div>

            <div className="topLogoFree">
              <img
                src="/logo-atheneum-transparant.png"
                alt="Logo Atheneum"
                className="topLogoImg"
              />
              <span className="sweep" aria-hidden="true" />
            </div>
          </div>

          {/* Top-right avatar */}
          <Link href="/dashboard/profiel" aria-label="Profiel" title={userName ?? "Profiel"} className="avatarTop">
            {initials}
            <span className="ring" aria-hidden="true" />
            <span className="sweep" aria-hidden="true" />
          </Link>
        </div>

        {/* ✅ gewone <style> (NIET styled-jsx) */}
        <style>{`
          :root{
            --uiText: ${ui.text};
            --uiMuted: ${ui.muted};
            --uiPanel: ${ui.panel};
            --uiPanel2: ${ui.panel2};
            --uiBorder: ${ui.border};
            --uiBorder2: ${ui.border2};
            --bBlue: ${brand.blue};
            --bTeal: ${brand.teal};
            --bMint: ${brand.mint};
          }

          @keyframes sweepX {
            0% { transform: translateX(-60%) rotate(10deg); }
            100% { transform: translateX(60%) rotate(10deg); }
          }

          /* menu button */
          .menuBtn{
            height:44px;width:44px;border-radius:18px;
            border:1px solid var(--uiBorder2);
            background:var(--uiPanel);
            display:grid;place-items:center;
            position:relative;overflow:hidden;
            transition:transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
            box-shadow:0 10px 26px rgba(0,0,0,0.25);
          }
          .menuBtn:active{ transform:scale(0.98); }
          .menuGlow{ position:absolute; inset:0; pointer-events:none; opacity:0.95; }
          .glowBlob{ position:absolute; border-radius:999px; filter:blur(22px); }
          .glowA{ left:-40px; top:-40px; width:110px; height:110px; background:rgba(75,142,141,0.22); }
          .glowB{ right:-46px; top:-46px; width:130px; height:130px; background:rgba(137,194,170,0.16); filter:blur(24px); }

          /* dropdown */
          .menuDrop{
            position:absolute; left:0; top:56px; width:320px;
            overflow:hidden; border-radius:20px;
            border:1px solid var(--uiBorder);
            background:rgba(10,10,10,0.92);
            box-shadow:0 28px 70px rgba(0,0,0,0.55);
          }

          .menuBrand{
            position:relative; overflow:hidden;
            padding:16px;
            border-bottom:1px solid rgba(255,255,255,0.10);
          }
          .brandGlow{
            pointer-events:none; position:absolute; border-radius:999px;
          }
          .brandGlow1{
            left:-120px; top:-120px; width:300px; height:300px;
            filter:blur(34px); background:rgba(75,142,141,0.18);
          }
          .brandGlow2{
            right:-160px; top:-150px; width:360px; height:360px;
            filter:blur(38px); background:rgba(137,194,170,0.14);
          }

          /* dropdown logo */
          .logoGlow{
            height:44px; width:44px;
            position:relative; overflow:hidden;
            display:grid; place-items:center;
            border-radius:999px;
            border:1px solid var(--uiBorder2);
            background:var(--uiPanel);
            box-shadow:
              0 12px 30px rgba(0,0,0,0.35),
              0 0 0 1px rgba(75,142,141,0.18),
              0 0 18px rgba(75,142,141,0.25);
          }

          /* ✅ TOPBAR LOGOS zonder cirkel */
          .topLogoFree{
            position:relative;
            display:grid;
            place-items:center;
            overflow:hidden;
            padding:4px 6px;
            border-radius:14px; /* zacht hoekje, geen cirkel */
          }
          .topLogoImg{
            height:44px;
            width:auto;
            object-fit:contain;
            display:block;
            filter: drop-shadow(0 12px 26px rgba(0,0,0,0.42))
                    drop-shadow(0 0 18px rgba(75,142,141,0.22));
            opacity:0.98;
          }

          /* sweep overlay (werkt op logoGlow, topLogoFree, avatars) */
          .sweep{
            position:absolute;
            inset:-40% -60%;
            background:linear-gradient(
              110deg,
              rgba(255,255,255,0) 35%,
              rgba(255,255,255,0.12) 50%,
              rgba(255,255,255,0) 65%
            );
            transform: translateX(-60%) rotate(10deg);
            animation: sweepX 2.8s linear infinite;
            pointer-events:none;
            mix-blend-mode: screen;
            opacity:0.9;
          }

          /* user card */
          .userCard{
            margin-top:12px;
            display:flex; align-items:center; justify-content:space-between; gap:12px;
            padding:12px;
            border-radius:18px;
            border:1px solid rgba(255,255,255,0.10);
            background:rgba(255,255,255,0.05);
            position:relative;
            z-index:10;
          }

          /* avatars */
          .avatarTop, .avatarSm{
            position:relative; overflow:hidden;
            display:grid; place-items:center;
            border-radius:999px;
            font-weight:950;
            letter-spacing:0.4px;
            color:var(--uiText);
            border:1px solid var(--uiBorder2);
            background:
              radial-gradient(120% 120% at 20% 20%,
                rgba(137,194,170,0.30) 0%,
                rgba(75,142,141,0.16) 45%,
                rgba(0,0,0,0.50) 78%),
              rgba(0,0,0,0.58);
            box-shadow:
              0 12px 28px rgba(0,0,0,0.42),
              0 0 0 1px rgba(75,142,141,0.16),
              0 0 20px rgba(75,142,141,0.22);
            text-decoration:none;
            transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
          }
          .avatarTop{ height:44px; width:44px; font-size:13px; }
          .avatarSm{ height:36px; width:36px; font-size:13px; }

          .avatarTop:hover{
            transform:translateY(-1px);
            box-shadow:
              0 16px 34px rgba(0,0,0,0.48),
              0 0 0 1px rgba(75,142,141,0.18),
              0 0 26px rgba(137,194,170,0.20);
          }

          .ring{
            position:absolute; inset:0;
            border-radius:999px;
            padding:1px;
            background: linear-gradient(135deg,
              rgba(37,89,113,0.70),
              rgba(75,142,141,0.60),
              rgba(137,194,170,0.48)
            );
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity:0.95;
            pointer-events:none;
          }

          /* nav links */
          .appNavLink{
            display:flex; align-items:center; justify-content:space-between; gap:12px;
            padding:12px 16px;
            font-size:14px;
            font-weight:900;
            position:relative;
            overflow:hidden;
            text-decoration:none;
            transition: transform 160ms ease, background 160ms ease, color 160ms ease;
          }
          .appNavFirst{ border-top:none; }
          .appNavLink:not(.appNavFirst){
            border-top:1px solid rgba(255,255,255,0.10);
          }

          .appNavIdle{ color: rgba(234,240,255,0.72); background:transparent; }
          .appNavIdle:hover{ color:var(--uiText); background: rgba(255,255,255,0.06); }
          .appNavActive{ color:var(--uiText); background: rgba(255,255,255,0.10); }

          .appNavLeft{ display:flex; align-items:center; gap:12px; min-width:0; }
          .appNavLabel{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .appNavArrow{ color: rgba(234,240,255,0.45); }

          .appNavIcon{
            height:32px; width:32px;
            border-radius:14px;
            display:grid; place-items:center;
            border:1px solid rgba(255,255,255,0.10);
            background: rgba(255,255,255,0.05);
          }
          .appNavIconActive{
            border-color: rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.10);
          }

          .appNavEdge{
            pointer-events:none;
            position:absolute; inset:0;
            opacity:0;
            transition: opacity 160ms ease;
            background: linear-gradient(135deg,
              rgba(37,89,113,0.20),
              rgba(75,142,141,0.18),
              rgba(137,194,170,0.16)
            );
          }
          .appNavLink:hover .appNavEdge{ opacity:1; }

          /* menu tip */
          .menuTip{
            border-top:1px solid rgba(255,255,255,0.10);
            padding:12px;
            font-size:12px;
            color: rgba(234,240,255,0.55);
          }
        `}</style>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div
          className="rounded-3xl border border-white/10 bg-white/5 p-4"
          style={{
            background: ui.panel,
            border: `1px solid ${ui.border}`,
            color: ui.text,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}