"use client";

import Link from "next/link";
import React from "react";

/** ✅ School brand colors (uit je logo) */
export const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

export const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
};

export function lastName(fullName?: string | null) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1] : fullName;
}

export function PageHero({
  kicker,
  title,
  subtitle,
  right,
}: {
  kicker: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section style={hero.wrap}>
      <div style={hero.bgGlow1} />
      <div style={hero.bgGlow2} />

      <div style={hero.inner}>
        <div>
          <div style={hero.kicker}>{kicker}</div>
          <div style={hero.title}>{title}</div>
          <div style={hero.sub}>{subtitle}</div>
        </div>

        {right ? <div style={hero.rightCard}>{right}</div> : null}
      </div>

      <style jsx>{`
        @media (max-width: 820px) {
          .heroInner {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export function SquareTile({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="sq">
      <div className="top">
        <div className="icon">{icon}</div>
        <div className="title">{title}</div>
      </div>

      <div className="desc">{desc}</div>
      <div className="cta">Openen →</div>

      <style jsx>{`
        .sq {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 14px;
          border-radius: 20px;
          background: ${ui.panel};
          border: 1px solid ${ui.border};
          text-decoration: none;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          position: relative;

          transform: translateY(0) scale(1);
          transition: transform 180ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 180ms ease,
            border-color 180ms ease, background 180ms ease;
          will-change: transform;
        }

        .sq:before {
          content: "";
          position: absolute;
          inset: -50px -50px auto auto;
          width: 160px;
          height: 160px;
          border-radius: 999px;
          background: rgba(75, 142, 141, 0.16);
          filter: blur(14px);
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 180ms ease, transform 180ms ease;
          transform: translate3d(0, 0, 0);
        }

        .sq:after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(37, 89, 113, 0.55),
            rgba(75, 142, 141, 0.55),
            rgba(137, 194, 170, 0.45)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 180ms ease;
          pointer-events: none;
        }

        .shine {
          position: absolute;
          inset: -40% -30%;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 65%
          );
          transform: translateX(-40%) rotate(10deg);
          opacity: 0;
          pointer-events: none;
        }

        .sq:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: ${ui.border2};
          background: ${ui.panel2};
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(75, 142, 141, 0.1);
        }

        .sq:hover:before {
          opacity: 1;
          transform: translate3d(10px, -6px, 0);
        }

        .sq:hover:after {
          opacity: 1;
        }

        .sq:hover .shine {
          opacity: 1;
          animation: sweep 900ms ease forwards;
        }

        @keyframes sweep {
          0% {
            transform: translateX(-55%) rotate(10deg);
          }
          100% {
            transform: translateX(55%) rotate(10deg);
          }
        }

        .top {
          display: grid;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 20px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid ${ui.border};
          color: ${ui.text};
        }

        .title {
          font-size: 15px;
          font-weight: 980;
          color: ${ui.text};
          letter-spacing: 0.2px;
          position: relative;
          z-index: 1;
        }

        .desc {
          margin-top: 4px;
          font-size: 12.5px;
          color: ${ui.muted};
          line-height: 1.25;
          position: relative;
          z-index: 1;
        }

        .cta {
          margin-top: 10px;
          font-size: 12.5px;
          font-weight: 950;
          color: ${ui.text};
          opacity: 0.92;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="shine" />
    </Link>
  );
}

export function Panel({
  title,
  kicker,
  children,
  right,
}: {
  title: string;
  kicker?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={panel.wrap}>
      <div style={panel.head}>
        <div>
          {kicker ? <div style={panel.kicker}>{kicker}</div> : null}
          <div style={panel.title}>{title}</div>
        </div>
        {right ? <div style={{ marginLeft: "auto" }}>{right}</div> : null}
      </div>

      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

export function DocRow({
  title,
  meta,
  href,
}: {
  title: string;
  meta: string;
  href: string;
}) {
  return (
    <a href={href} style={docRow.wrap}>
      <div style={{ minWidth: 0 }}>
        <div style={docRow.title}>{title}</div>
        <div style={docRow.meta}>{meta}</div>
      </div>
      <div style={docRow.cta}>Open ↗</div>
    </a>
  );
}

/* styles */
const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 14,
    zIndex: 1,
    alignItems: "stretch",
  },
  bgGlow1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    left: -120,
    top: -140,
    background: "rgba(75,142,141,0.20)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(137,194,170,0.16)",
    filter: "blur(26px)",
  },
  kicker: { fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted },
  title: { marginTop: 8, fontSize: 28, fontWeight: 980, color: ui.text, lineHeight: 1.05 },
  sub: { marginTop: 10, fontSize: 13.5, color: ui.muted, maxWidth: 720 },
  rightCard: {
    borderRadius: 20,
    padding: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.32)",
  },
};

const panel: Record<string, React.CSSProperties> = {
  wrap: { padding: 16, borderRadius: 22, background: ui.panel, border: `1px solid ${ui.border}` },
  head: { display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" },
  kicker: { fontSize: 12, fontWeight: 950, color: ui.muted, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 18, fontWeight: 980, color: ui.text },
};

const docRow: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.30)",
    textDecoration: "none",
  },
  title: { fontSize: 13.5, fontWeight: 950, color: ui.text, lineHeight: 1.2 },
  meta: { marginTop: 4, fontSize: 12, color: ui.muted },
  cta: { fontSize: 12.5, fontWeight: 950, color: ui.text, opacity: 0.9, whiteSpace: "nowrap" },
};