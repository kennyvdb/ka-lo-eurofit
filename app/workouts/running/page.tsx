"use client";

import AppShell from "@/components/AppShell";
import WorkoutsCardsTemplate, {
  CardItem,
} from "@/components/workouts/WorkoutsCardsTemplate";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};

const emptyProfile: Profile = { id: "", volledige_naam: null, role: null };

type Tile = {
  title: string;
  subtitle: string;
  tag: string;
  href: string;
};

const tiles: Tile[] = [
  {
    title: "Run Workout 1",
    subtitle: "Run + burpees/squats/lunges (3K of 5K) — hoge intensiteit",
    tag: "For time",
    href: "/workouts/running/1",
  },
  {
    title: "Run Workout 2",
    subtitle: "Endurance blokken met EMOM + AMRAP runs + finisher",
    tag: "Endurance",
    href: "/workouts/running/2",
  },
  {
    title: "Run Workout 3",
    subtitle: "OPM stijl: run vanuit huis, keer om op helft tijd/afstand",
    tag: "Intervals",
    href: "/workouts/running/3",
  },
];

// Theme voor de template (zelfde structuur als je template verwacht)
const theme = {
  colors: {
    blue: "#3aa0ff",
    teal: "#41d1c2",
    mint: "#89c2aa",
  },
  ui: {
    text: "rgba(234,240,255,0.92)",
    muted: "rgba(234,240,255,0.72)",
    muted2: "rgba(234,240,255,0.55)",
    panel: "rgba(255,255,255,0.06)",
    panel2: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.12)",
    border2: "rgba(255,255,255,0.18)",
    shadow: "rgba(0,0,0,0.55)",
  },
};

export default function RunningIndexPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

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
      setLoading(false);
    };

    load();
  }, []);

  // Zet je tiles om naar CardItem[] voor de template
  const items: CardItem[] = useMemo(
    () =>
      tiles.map((t) => ({
        id: t.href,
        title: t.title,
        desc: `${t.subtitle} • ${t.tag}`,
        kind: "link",
        href: t.href,
      })),
    []
  );

  const strings = useMemo(
    () => ({
      kicker: "Running",
      title: "Running Workouts",
      subtitle: (
        <>
          Kies één van de 3 workouts •{" "}
          {email ? (
            <>
              ingelogd als <b>{email}</b>
            </>
          ) : null}
        </>
      ),
      backHref: "/workouts",
      backLabel: "Terug",
    }),
    [email]
  );

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO!Atheneum Avelgem"
      userName={profile.volledige_naam ?? null}
    >
      <WorkoutsCardsTemplate
        items={items}
        theme={theme}
        strings={strings}
        loading={loading}
        maxWidth={980}
      />
    </AppShell>
  );
}