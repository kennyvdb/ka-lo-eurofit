"use client";

import React, { ReactNode } from "react";

export type BaseHeroProps = {
  label: string;
  title: ReactNode;
  description: ReactNode;
  imageSrc: string;
  imageAlt: string;
  quoteTitle?: string;
  quote?: string;
  quoteAuthor?: string;
  imageClassName?: string;
  actions?: ReactNode;
};

export default function BaseHero({
  label,
  title,
  description,
  imageSrc,
  imageAlt,
  quoteTitle,
  quote,
  quoteAuthor,
  imageClassName,
  actions,
}: BaseHeroProps) {
  return (
    <section className="group relative overflow-hidden rounded-[26px] border border-slate-400/20 bg-[radial-gradient(900px_520px_at_0%_0%,rgba(75,142,141,0.20)_0%,rgba(0,0,0,0)_60%),radial-gradient(900px_520px_at_100%_0%,rgba(137,194,170,0.14)_0%,rgba(0,0,0,0)_60%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.04))] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.20)] transition duration-300 hover:border-slate-300/25 hover:shadow-[0_18px_48px_rgba(0,0,0,0.26)]">
      <div className="absolute -left-[120px] -top-[140px] h-[260px] w-[260px] rounded-full bg-[#4B8E8D]/18 blur-3xl transition duration-500 group-hover:scale-110 group-hover:opacity-90" />
      <div className="absolute -right-[160px] -top-[170px] h-[320px] w-[320px] rounded-full bg-[#89C2AA]/12 blur-3xl transition duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(500px_220px_at_18%_14%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-[26px] opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />

      <div className="relative z-10 grid items-stretch gap-4 md:grid-cols-[1fr_440px]">
        <div className="max-w-[640px]">
          <div className="text-xs font-black tracking-[1.2px] text-[rgba(234,240,255,0.72)]">
            {label}
          </div>

          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-[26px] font-black leading-[1.05] text-[rgba(234,240,255,0.92)] sm:text-[30px]">
            {title}
          </h1>

          <div className="mt-3 max-w-[520px] text-[13.5px] text-[rgba(234,240,255,0.72)]">
            {description}
          </div>

          {actions ? <div className="mt-4 flex flex-wrap gap-2.5">{actions}</div> : null}

          {quote ? (
            <div className="relative mt-4 max-w-[520px] overflow-hidden rounded-[20px] border border-slate-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.36),rgba(0,0,0,0.28))] p-4 backdrop-blur-sm shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
              <div className="pointer-events-none absolute inset-0 opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#89C2AA]/10 blur-2xl" />

              {quoteTitle ? (
                <div className="relative text-xs font-black text-[rgba(234,240,255,0.72)]">
                  {quoteTitle}
                </div>
              ) : null}

              <div className="relative mt-2 text-base font-black leading-5 text-[rgba(234,240,255,0.92)]">
                “{quote}”
              </div>

              {quoteAuthor ? (
                <div className="relative mt-2 text-[12.5px] text-[rgba(234,240,255,0.72)]">
                  — {quoteAuthor}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex h-full items-stretch justify-end">
          <div className="group/image relative h-full w-full overflow-hidden rounded-[22px] border border-slate-400/20 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.14))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="pointer-events-none absolute inset-0 rounded-[22px] opacity-100 [background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0))]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.08),transparent_70%)] opacity-60" />

            <img
              src={imageSrc}
              alt={imageAlt}
              className={`relative z-10 h-full w-full object-contain object-center opacity-95 will-change-transform ${imageClassName ?? ""}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}