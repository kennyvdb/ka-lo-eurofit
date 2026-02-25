"use client";

import AppShell from "@/components/AppShell";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};
const emptyProfile: Profile = { id: "", volledige_naam: null, role: null };

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  border: "rgba(255,255,255,0.12)",
  glass: "rgba(6, 12, 20, 0.42)",
};

function titleFromSlug(slug: string) {
  return slug.replace(/-+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HomeWorkoutVideoPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabase
        .from("profielen")
        .select("id, volledige_naam, role")
        .eq("id", authData.user.id)
        .maybeSingle<Profile>();

      setProfile(data ?? { ...emptyProfile, id: authData.user.id });
      setLoading(false);
    };

    load();
  }, []);

  const src = useMemo(() => (slug ? `/videos/home/${slug}.mp4` : ""), [slug]);
  const title = useMemo(() => (slug ? titleFromSlug(slug) : "Oefening"), [slug]);

  return (
    <AppShell title="KA LO App" subtitle="Workouts • Home" userName={profile.volledige_naam ?? null}>
      <div style={{ maxWidth: 1100 }}>
        <div
          style={{
            padding: 16,
            borderRadius: 22,
            border: "1px solid " + ui.border,
            background: ui.glass,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: ui.muted }}>VIDEO</div>
              <h1 style={{ margin: "6px 0 0 0", fontSize: 22, fontWeight: 980, color: ui.text }}>{title}</h1>
            </div>

            <a
              href="/workouts/home"
              style={{
                height: 44,
                padding: "0 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "linear-gradient(135deg, rgba(37,89,113,0.55), rgba(75,142,141,0.35))",
                color: ui.text,
                fontWeight: 950,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              ← Terug
            </a>
          </div>

          {loading ? (
            <div style={{ marginTop: 12, color: ui.muted }}>Bezig met laden…</div>
          ) : !slug ? (
            <div style={{ marginTop: 12, color: ui.muted }}>Geen slug gevonden.</div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <video
                key={src}
                controls
                playsInline
                style={{
                  width: "100%",
                  borderRadius: 18,
                  border: "1px solid " + ui.border,
                  background: "rgba(0,0,0,0.35)",
                }}
                src={src}
              />
              <div style={{ marginTop: 10, color: ui.muted, fontSize: 12.5 }}>
                Pad: <code>{src}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}