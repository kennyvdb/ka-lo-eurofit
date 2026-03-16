"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import WorkoutsCardsTemplate, { CardItem } from "@/components/workouts/WorkoutsCardsTemplate";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};

const emptyProfile: Profile = { id: "", volledige_naam: null, role: null };

const theme = {
  colors: { blue: "#255971", teal: "#4B8E8D", mint: "#89C2AA" },
  ui: {
    text: "rgba(234,240,255,0.92)",
    muted: "rgba(234,240,255,0.72)",
    muted2: "rgba(234,240,255,0.55)",
    panel: "rgba(255,255,255,0.06)",
    panel2: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.12)",
    border2: "rgba(255,255,255,0.18)",
    shadow: "0 18px 55px rgba(0,0,0,0.38)",
  },
};

export default function FitnessWorkoutsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");

  const items: CardItem[] = useMemo(() => {
    return [
      {
        id: "fitness-school",
        kind: "link",
        title: "Fitness @ School",
        desc: "Invulbaar schema (Week 1–3)",
        href: "/workouts/fitness/school",
      },
      {
        id: "fitness-gym",
        kind: "link",
        title: "Fitness @ Gym",
        desc: "Invulbaar schema (Week 1–4)",
        href: "/workouts/fitness/gym",
      },
    ];
  }, []);

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

  return (
    <AppShell title="LO App" subtitle="Fitness" userName={profile.volledige_naam ?? null}>
      <WorkoutsCardsTemplate
        theme={theme}
        items={items}
        loading={loading}
        strings={{
          kicker: "Workouts • Fitness",
          title: "Fitness Workouts",
          backHref: "/workouts",
          subtitle: (
            <>
              Kies je schema{" "}
              {email ? (
                <>
                  • ingelogd als <b style={{ color: theme.ui.text }}>{email}</b>
                </>
              ) : null}
            </>
          ),
        }}
      />
    </AppShell>
  );
}