"use client";

import Link from "next/link";
import React from "react";

type ChallengeStatus = "Actief" | "Binnenkort";

type ChallengeCardProps = {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  status: ChallengeStatus;
  clickable?: boolean;
};

function StatusBadge({ status }: { status: ChallengeStatus }) {
  const isActive = status === "Actief";

  return (
    <div
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-black ${
        isActive
          ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.15)] text-[#86efac]"
          : "border-[rgba(255,193,102,0.28)] bg-[rgba(255,193,102,0.10)] text-[#fcd34d]"
      }`}
    >
      {status}
    </div>
  );
}

function CardContent({
  emoji,
  title,
  subtitle,
  description,
  status,
  canOpen,
}: Omit<ChallengeCardProps, "href" | "clickable"> & {
  canOpen: boolean;
}) {
  const active = status === "Actief";

  return (
    <>
      {/* Achtergrondgloed */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(75,142,141,0.16)] blur-[14px] transition duration-200 group-hover:translate-x-2 group-hover:-translate-y-1.5" />

      {/* Hoverrand */}
      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.55),rgba(75,142,141,0.55),rgba(137,194,170,0.45))_border-box] [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]" />

      {/* Bovenste gedeelte */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/12 bg-black/35 text-xl text-white">
            {emoji}
          </div>

          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-white/70">
            {subtitle}
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Inhoud */}
      <div className="relative z-10 mt-6">
        <div className="text-[15px] font-black tracking-[0.01em] text-white">
          {title}
        </div>

        <div className="mt-2 text-xs leading-5 text-white/70">
          {description}
        </div>

        <div className="mt-2.5 text-xs font-black text-white/90">
          {active
            ? "Open challenge →"
            : canOpen
              ? "Bekijk challenge →"
              : "🔒 Binnenkort beschikbaar"}
        </div>
      </div>
    </>
  );
}

export default function ChallengeCard({
  href,
  emoji,
  title,
  subtitle,
  description,
  status,
  clickable = false,
}: ChallengeCardProps) {
  const active = status === "Actief";

  // Een actieve challenge is altijd klikbaar.
  // Een challenge met status "Binnenkort" is alleen klikbaar
  // wanneer clickable={true} werd meegegeven.
  const canOpen = active || clickable;

  const baseClasses =
    "group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.06] p-3.5 transition duration-200";

  if (!canOpen) {
    return (
      <div
        className={`${baseClasses} cursor-not-allowed opacity-70`}
        aria-disabled="true"
      >
        <CardContent
          emoji={emoji}
          title={title}
          subtitle={subtitle}
          description={description}
          status={status}
          canOpen={false}
        />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} cursor-pointer hover:-translate-y-1 hover:scale-[1.01] hover:border-white/18 hover:bg-white/[0.08] hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.10)] active:-translate-y-0.5`}
    >
      <CardContent
        emoji={emoji}
        title={title}
        subtitle={subtitle}
        description={description}
        status={status}
        canOpen={true}
      />
    </Link>
  );
}