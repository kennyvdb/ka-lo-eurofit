"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type React from "react";

type Profile = {
  id: string;
  volledige_naam: string | null;
  role: "student" | "teacher" | null;
};
const emptyProfile: Profile = { id: "", volledige_naam: null, role: null };

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
    warnBg: "rgba(255,193,102,0.10)",
    warnBorder: "rgba(255,193,102,0.28)",
  },
};

export default function RunningWorkout3Page() {
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

  const strings = useMemo(
    () => ({
      kicker: "Running • Workout 3",
      title: "Run Workout 3",
      subtitle: (
        <>
          OPM stijl: run vanuit huis, keer om op helft tijd/afstand •{" "}
          {email ? (
            <>
              ingelogd als <b>{email}</b>
            </>
          ) : null}
        </>
      ),
      backHref: "/workouts/running",
      backLabel: "Terug",
    }),
    [email]
  );

  const ui = theme.ui;
  const colors = theme.colors;

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO!Atheneum Avelgem"
      userName={profile.volledige_naam ?? null}
    >
      <div style={{ maxWidth: 980 }}>
        {/* HERO */}
        <div style={styles.hero(ui)}>
          <div style={styles.heroGlow()} aria-hidden="true" />
          <div style={styles.header()}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kicker(ui)}>
                <span style={styles.kickerDot(colors)} />
                {strings.kicker}
              </div>

              <h1 style={styles.h1(ui)}>{strings.title}</h1>
              <div style={styles.sub(ui)}>{strings.subtitle}</div>
            </div>

            <a href={strings.backHref} style={styles.backLink(ui, false)}>
              <span style={{ opacity: 0.9 }}>←</span> {strings.backLabel}
            </a>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div style={styles.loadingCard(ui)}>
            <div style={styles.spinner(colors)} aria-hidden="true" />
            <div style={{ color: ui.muted, fontWeight: 850 }}>Bezig met laden…</div>
            <div style={{ color: ui.muted2, fontSize: 12.5 }}>
              Even geduld, we halen je profiel op.
            </div>
          </div>
        ) : (
          <>
            {/* QUOTE */}
            <div style={styles.card(ui)}>
              <div
                aria-hidden="true"
                style={{
                  ...styles.cardAccent(),
                  background: `radial-gradient(900px 260px at 12% 0%, ${colors.mint}33 0%, rgba(0,0,0,0) 60%)`,
                }}
              />
              <div aria-hidden="true" style={styles.cardShine()} />

              <div style={styles.cardHead()}>
                <div style={styles.pill(ui)}>QUOTE</div>
                <div style={styles.smallHint(ui)}>Mindset</div>
              </div>

              <div style={styles.quote(ui)}>
                “Life is really simple, but we insist on making it complicated.”
              </div>
            </div>

            {/* WORKOUT */}
            <div style={styles.card(ui)}>
              <div
                aria-hidden="true"
                style={{
                  ...styles.cardAccent(),
                  background: `radial-gradient(900px 260px at 12% 0%, ${colors.blue}2B 0%, rgba(0,0,0,0) 60%)`,
                }}
              />
              <div aria-hidden="true" style={styles.cardShine()} />

              {/* A */}
              <div style={styles.section(ui)}>
                <div style={styles.sectionTitleRow()}>
                  <div style={styles.sectionDot(colors)} aria-hidden="true" />
                  <div style={styles.sectionTitle(ui)}>A. W-UP</div>
                </div>
                <ul style={styles.ul(ui)}>
                  <li style={styles.li}>5 min walk</li>
                  <li style={styles.li}>
                    Choose your own warmup for the WOD (leg swings, air squats, lunges,
                    burpees, mobility)
                  </li>
                </ul>
              </div>

              {/* B */}
              <div style={styles.section(ui)}>
                <div style={styles.sectionTitleRow()}>
                  <div style={styles.sectionDot(colors)} aria-hidden="true" />
                  <div style={styles.sectionTitle(ui)}>B. ENDURANCE WORKOUT (OPM)</div>
                </div>

                <div style={styles.steps()}>
                  {[
                    "OPM: start je run altijd van thuis. Aan de helft van tijd/afstand keer je terug huiswaarts om de volgende oefening uit te voeren.",
                    "SET 1 (24 min work) — 4 rounds (±5' actief/ronde): 600m run OR 3min run @6/10 + AMRAP 1' max box jumps + AMRAP 1' max burpee no jump. Rest 1' tussen rounds (totaal 6' per ronde).",
                    "SET 2 (17'30 work): 300m run OR 1min30 @8/10 + AMRAP 1' max burpee box jumps (combo). Rest 1' tussen rounds (totaal ±3'30 per ronde).",
                    "SET 3 (30' work) — 6 rounds (±3' actief/ronde): 5 burpee tuck jump + 20 air squats (high intensity). Rest 30''. + 400m run @ high intensity (meer dan set 2) OR 2min run. Rest 2' tussen rounds (5min per ronde).",
                  ].map((txt, i) => (
                    <div key={i} style={styles.step(ui)}>
                      <div style={styles.stepNum(ui)}>{String(i + 1).padStart(2, "0")}</div>
                      <div style={styles.stepTxt(ui)}>{txt}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* C */}
              <div style={styles.section(ui)}>
                <div style={styles.sectionTitleRow()}>
                  <div style={styles.sectionDot(colors)} aria-hidden="true" />
                  <div style={styles.sectionTitle(ui)}>C. COOL DOWN</div>
                </div>
                <ul style={styles.ul(ui)}>
                  <li style={styles.li}>5 min walk</li>
                  <li style={styles.li}>10'–20' mobility/stretch work</li>
                </ul>
              </div>
            </div>

            {/* WARNING */}
            <div style={styles.warning(ui)}>
              <div style={styles.noteHead()}>
                <div style={styles.warnIcon()} aria-hidden="true">
                  !
                </div>
                <div style={styles.noteTitle(ui)}>Let op</div>
              </div>
              <div style={styles.noteBody(ui)}>
                Intensiteit kan hoog zijn. Warm goed op en pas tempo/afstanden aan je niveau aan.
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  hero: (ui: typeof theme.ui): React.CSSProperties => ({
    position: "relative",
    borderRadius: 22,
    overflow: "hidden",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.04) 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
    backdropFilter: "blur(14px) saturate(160%)",
  }),
  heroGlow: (): React.CSSProperties => ({
    position: "absolute",
    inset: -70,
    background:
      "radial-gradient(closest-side, rgba(137,194,170,0.26), rgba(37,89,113,0.00) 70%)",
    filter: "blur(14px)",
    pointerEvents: "none",
  }),
  header: (): React.CSSProperties => ({
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  }),
  kicker: (ui: typeof theme.ui): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: ui.muted,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  }),
  kickerDot: (colors: typeof theme.colors): React.CSSProperties => ({
    width: 9,
    height: 9,
    borderRadius: 99,
    background: `linear-gradient(135deg, ${colors.mint}, ${colors.teal})`,
    boxShadow: "0 0 0 3px rgba(137,194,170,0.16)",
  }),
  h1: (ui: typeof theme.ui): React.CSSProperties => ({
    fontSize: 26,
    fontWeight: 950,
    margin: "6px 0 0 0",
    color: ui.text,
    lineHeight: 1.15,
  }),
  sub: (ui: typeof theme.ui): React.CSSProperties => ({
    color: ui.muted,
    marginTop: 8,
    fontSize: 13.5,
    overflowWrap: "anywhere",
  }),
  backLink: (ui: typeof theme.ui, reduceMotion: boolean): React.CSSProperties => ({
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.52))",
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: "0 18px 46px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px) saturate(160%)",
    transition: reduceMotion ? "none" : "transform 160ms ease, box-shadow 160ms ease",
    willChange: "transform",
  }),

  loadingCard: (ui: typeof theme.ui): React.CSSProperties => ({
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    border: "1px solid rgba(255,255,255,0.16)",
    display: "grid",
    gap: 6,
    alignItems: "center",
    justifyItems: "start",
    backdropFilter: "blur(12px) saturate(160%)",
  }),
  spinner: (colors: typeof theme.colors): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 99,
    border: "2px solid rgba(255,255,255,0.22)",
    borderTopColor: colors.mint,
    animation: "spin 0.9s linear infinite",
  }),

  card: (ui: typeof theme.ui): React.CSSProperties => ({
    position: "relative",
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 55%, rgba(0,0,0,0.10) 100%)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.42)",
    backdropFilter: "blur(14px) saturate(170%)",
    display: "grid",
    gap: 12,
  }),
  cardAccent: (): React.CSSProperties => ({
    position: "absolute",
    inset: -2,
    pointerEvents: "none",
  }),
  cardShine: (): React.CSSProperties => ({
    position: "absolute",
    inset: -40,
    pointerEvents: "none",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 28%, rgba(255,255,255,0.00) 60%)",
    filter: "blur(10px)",
    opacity: 0.35,
  }),
  cardHead: (): React.CSSProperties => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  }),
  pill: (ui: typeof theme.ui): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12,
    color: ui.text,
    background: "rgba(0,0,0,0.34)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px) saturate(160%)",
  }),
  smallHint: (ui: typeof theme.ui): React.CSSProperties => ({
    color: ui.muted2,
    fontSize: 12.5,
    fontWeight: 850,
  }),
  quote: (ui: typeof theme.ui): React.CSSProperties => ({
    position: "relative",
    color: ui.text,
    lineHeight: 1.6,
    fontSize: 14.5,
  }),

  section: (ui: typeof theme.ui): React.CSSProperties => ({
    position: "relative",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.16)",
  }),
  sectionTitleRow: (): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  }),
  sectionDot: (colors: typeof theme.colors): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: 99,
    background: `linear-gradient(135deg, ${colors.mint}, ${colors.teal})`,
    boxShadow: "0 0 0 3px rgba(137,194,170,0.14)",
    flexShrink: 0,
  }),
  sectionTitle: (ui: typeof theme.ui): React.CSSProperties => ({
    fontWeight: 950,
    color: ui.text,
    lineHeight: 1.2,
  }),
  ul: (ui: typeof theme.ui): React.CSSProperties => ({
    margin: 0,
    paddingLeft: 18,
    color: ui.muted,
    lineHeight: 1.7,
  }),
  li: { marginBottom: 6 },

  steps: (): React.CSSProperties => ({
    display: "grid",
    gap: 8,
  }),
  step: (ui: typeof theme.ui): React.CSSProperties => ({
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    gap: 10,
    alignItems: "start",
    padding: 10,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.12)",
  }),
  stepNum: (ui: typeof theme.ui): React.CSSProperties => ({
    height: 32,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    color: ui.text,
    background: "rgba(0,0,0,0.36)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px) saturate(160%)",
  }),
  stepTxt: (ui: typeof theme.ui): React.CSSProperties => ({
    color: ui.muted,
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  }),

  warning: (ui: typeof theme.ui): React.CSSProperties => ({
    position: "relative",
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    background: theme.ui.warnBg,
    border: `1px solid ${theme.ui.warnBorder}`,
    boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
    backdropFilter: "blur(12px) saturate(160%)",
    color: ui.text,
  }),
  noteHead: (): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  }),
  warnIcon: (): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.14)",
  }),
  noteTitle: (ui: typeof theme.ui): React.CSSProperties => ({
    fontWeight: 950,
    color: ui.text,
  }),
  noteBody: (ui: typeof theme.ui): React.CSSProperties => ({
    color: ui.text,
    opacity: 0.95,
    lineHeight: 1.55,
  }),
};