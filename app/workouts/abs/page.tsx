"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};

type AbsWorkoutItem = {
  id: string;
  title: string;
  desc: string;
  src: string;
};

const emptyProfile: Profile = {
  id: "",
  volledige_naam: null,
  role: null,
};

const items: AbsWorkoutItem[] = Array.from({ length: 15 }, (_, index) => {
  const number = index + 1;

  return {
    id: `ab-${number}`,
    title: `Ab workout ${number}`,
    desc: "Open afbeelding",
    src: `/abs/Ab workout ${number}.png`,
  };
});

export default function AbsWorkoutsPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData?.user) {
        window.location.href = "/login";
        return;
      }

      const userId = authData.user.id;
      setEmail(authData.user.email ?? "");

      const { data } = await supabase
        .from("profielen")
        .select("id, volledige_naam, role")
        .eq("id", userId)
        .maybeSingle<Profile>();

      setProfile(data ?? { ...emptyProfile, id: userId });
    };

    load();
  }, []);

  return (
    <AppShell
      title="LO App"
      subtitle="Abs"
      userName={profile.volledige_naam ?? null}
    >
      <div className="mx-auto max-w-[1100px]">
        <section className="relative overflow-hidden rounded-[22px] border border-slate-400/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.04)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-[8px]">
          <div className="pointer-events-none absolute inset-[-70px] bg-[radial-gradient(closest-side,rgba(137,194,170,0.20),rgba(37,89,113,0)_70%)] blur-[10px]" />

          <div className="relative flex flex-wrap items-center justify-between gap-3 p-[18px]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2px] text-[rgba(234,240,255,0.72)]">
                <span className="h-[9px] w-[9px] rounded-full bg-[linear-gradient(135deg,#89c2aa,#4B8E8D)] shadow-[0_0_0_3px_rgba(137,194,170,0.16)]" />
                Workouts • Abs
              </div>

              <h1 className="mt-1 text-[26px] font-black leading-[1.15] text-[rgba(234,240,255,0.92)]">
                Ab Workouts
              </h1>

              <div className="mt-2 text-[13.5px] text-[rgba(234,240,255,0.72)]">
                Kies een workout
                {email ? (
                  <>
                    {" "}
                    • ingelogd als <b>{email}</b>
                  </>
                ) : null}
              </div>
            </div>

            <Link
              href="/workouts"
              className="inline-flex h-[46px] items-center gap-2 whitespace-nowrap rounded-2xl border border-slate-400/15 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(0,0,0,0.52))] px-4 font-black text-[rgba(234,240,255,0.92)] no-underline shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-[8px]"
            >
              <span className="opacity-90">←</span> Terug
            </Link>
          </div>
        </section>

        <section className="mt-3 rounded-[22px] border border-slate-400/10 bg-white/6 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.30)]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => (
              <a
                key={item.id}
                href={item.src}
                target="_blank"
                rel="noreferrer"
                style={{ contentVisibility: "auto", containIntrinsicSize: "320px" }}
                className="group relative overflow-hidden rounded-[20px] border border-slate-400/10 bg-white/7 p-3 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/15 hover:bg-white/9 hover:shadow-[0_12px_28px_rgba(0,0,0,0.30)]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#4B8E8D]/10 blur-lg transition-transform duration-200 group-hover:translate-x-2 group-hover:-translate-y-1" />

                <div className="relative z-10 overflow-hidden rounded-[16px] border border-slate-400/10 bg-black/20">
                  <Image
                    src={item.src}
                    alt={item.title}
                    width={800}
                    height={1040}
                    quality={70}
                    className="h-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                    loading={index < 2 ? "eager" : "lazy"}
                    priority={index < 2}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                </div>

                <div className="relative z-10 mt-3">
                  <div className="text-[15px] font-black tracking-[0.2px] text-[rgba(234,240,255,0.92)]">
                    {item.title}
                  </div>

                  <div className="mt-1 text-[12.5px] leading-5 text-[rgba(234,240,255,0.72)]">
                    {item.desc}
                  </div>

                  <div className="mt-3 text-[12.5px] font-black text-[rgba(234,240,255,0.92)]">
                    Openen →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}