"use client";

import Link from "next/link";
import React from "react";

type BaseTileProps = {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export function BaseTile({ href, icon, title, desc }: BaseTileProps) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[22px] border border-slate-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.04))] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-slate-300/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.10)] active:-translate-y-0.5"
    >
      {/* ambient glow */}
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[rgba(75,142,141,0.15)] blur-[18px] transition duration-300 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:scale-110" />

      <div className="absolute left-[-25%] top-[-10%] h-36 w-36 rounded-full bg-[rgba(137,194,170,0.10)] blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />

      {/* gradient hover border */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-transparent opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.45),rgba(75,142,141,0.45),rgba(137,194,170,0.30))_border-box] [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]" />

      {/* light overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />

      {/* shine animation */}
      <div className="pointer-events-none absolute inset-[-40%_-30%] opacity-0 transition group-hover:opacity-100 group-hover:animate-[tileSweep_900ms_ease_forwards] [background:linear-gradient(120deg,rgba(255,255,255,0)_35%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_65%)]" />

      {/* content */}
      <div className="relative z-10 grid gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.38),rgba(0,0,0,0.30))] text-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 group-hover:border-teal-200/25 group-hover:scale-[1.05]">
          {icon}
        </div>

        <div className="text-[15px] font-black tracking-[0.01em] text-white">
          {title}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-xs leading-5 text-white/70">{desc}</div>

        <div className="mt-3 inline-flex items-center text-xs font-black text-white/90 transition duration-200 group-hover:translate-x-0.5">
          Openen
          <span className="ml-1 transition duration-200 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes tileSweep {
          0% {
            transform: translateX(-55%) rotate(10deg);
          }
          100% {
            transform: translateX(55%) rotate(10deg);
          }
        }
      `}</style>
    </Link>
  );
}