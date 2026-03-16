"use client";

import Link from "next/link";
import React from "react";

type DashboardTileProps = {
  href: string;
  icon: string;
  title: string;
  desc: string;
};

export function DashboardTile({ href, icon, title, desc }: DashboardTileProps) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[20px] border border-slate-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.045))] p-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:border-slate-300/28 hover:shadow-[0_18px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(75,142,141,0.10)] active:-translate-y-0.5"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(75,142,141,0.14)] blur-[14px] transition duration-300 group-hover:translate-x-2 group-hover:-translate-y-1.5 group-hover:scale-110" />
      <div className="absolute left-[-20%] top-[-10%] h-32 w-32 rounded-full bg-[rgba(137,194,170,0.08)] blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-[20px] border border-transparent opacity-0 transition duration-200 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(37,89,113,0.42),rgba(75,142,141,0.42),rgba(137,194,170,0.30))_border-box] [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_padding-box,linear-gradient(#000_0_0)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[20px] opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-[-40%_-30%] opacity-0 transition group-hover:opacity-100 group-hover:animate-[sweep_900ms_ease_forwards] [background:linear-gradient(120deg,rgba(255,255,255,0)_35%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0)_65%)]" />

      <div className="relative z-10 grid gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.38),rgba(0,0,0,0.30))] text-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          {icon}
        </div>
        <div className="text-[15px] font-black tracking-[0.01em] text-white">{title}</div>
      </div>

      <div className="relative z-10">
        <div className="text-xs leading-5 text-white/70">{desc}</div>
        <div className="mt-2.5 text-xs font-black text-white/90 transition duration-200 group-hover:translate-x-0.5">
          Openen →
        </div>
      </div>

      <style jsx>{`
        @keyframes sweep {
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