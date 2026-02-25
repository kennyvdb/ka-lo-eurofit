"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

export type CardItem =
  | {
      id: string;
      title: string;
      desc: string;
      kind: "image";
      src: string;
    }
  | {
      id: string;
      title: string;
      desc: string;
      kind: "link";
      href: string;
    };

type Theme = {
  colors: { blue: string; teal: string; mint: string };
  ui: {
    text: string;
    muted: string;
    muted2: string;
    panel: string;
    panel2: string;
    border: string;
    border2: string;
    shadow: string;
  };
};

type Strings = {
  kicker: string;
  title: string;
  subtitle: React.ReactNode;
  backHref: string;
  backLabel?: string;
};

type Props = {
  items: CardItem[];
  theme: Theme;
  strings: Strings;
  loading?: boolean;
  maxWidth?: number;
  getAccent?: (idx: number) => string;
};

type LegacyMQL = MediaQueryList & {
  addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => void;
  removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => void;
};

function addMqListener(mq: MediaQueryList, fn: () => void) {
  const mql = mq as LegacyMQL;
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", fn);
  else if (typeof mql.addListener === "function") mql.addListener(fn as any);
}

function removeMqListener(mq: MediaQueryList, fn: () => void) {
  const mql = mq as LegacyMQL;
  if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", fn);
  else if (typeof mql.removeListener === "function") mql.removeListener(fn as any);
}

export default function WorkoutsCardsTemplate({
  items,
  theme,
  strings,
  loading = false,
  maxWidth = 1040,
  getAccent,
}: Props) {
  const { colors, ui } = theme;

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [canHover, setCanHover] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Detect hover capability + reduced motion
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      setCanHover(!!mqHover.matches);
      setReduceMotion(!!mqReduce.matches);
    };

    apply();

    addMqListener(mqHover, apply);
    addMqListener(mqReduce, apply);
    return () => {
      removeMqListener(mqHover, apply);
      removeMqListener(mqReduce, apply);
    };
  }, []);

  const accentFn = useMemo(() => {
    return (
      getAccent ??
      ((idx: number) =>
        idx % 3 === 0 ? colors.blue : idx % 3 === 1 ? colors.teal : colors.mint)
    );
  }, [getAccent, colors.blue, colors.teal, colors.mint]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // spinner keyframes 1x
  useEffect(() => {
    const id = "workouts-cards-template-inline-keyframes";
    if (typeof document === "undefined") return;
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }, []);

  const opened = useMemo(() => (openIdx != null ? items[openIdx] : null), [openIdx, items]);
  const openedImage = useMemo(
    () => (opened && opened.kind === "image" ? opened : null),
    [opened]
  );

  const close = useCallback(() => setOpenIdx(null), []);

  const onCardClick = useCallback(
    (idx: number) => {
      const item = items[idx];
      if (item.kind === "image") {
        setOpenIdx(idx);
        return;
      }
      window.location.href = item.href;
    },
    [items]
  );

  const onEnter = useCallback(
    (idx: number) => {
      if (canHover) setHoverIdx(idx);
    },
    [canHover]
  );

  const onLeave = useCallback(() => {
    if (canHover) setHoverIdx(null);
  }, [canHover]);

  return (
    <div style={{ maxWidth }}>
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

          <a href={strings.backHref} style={styles.backLink(ui, reduceMotion)}>
            <span style={{ opacity: 0.9 }}>←</span> {strings.backLabel ?? "Terug"}
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
          {/* GRID */}
          <div style={styles.grid()}>
            {items.map((w, idx) => {
              const isHovered = canHover && hoverIdx === idx;
              const accent = accentFn(idx);

              return (
                <button
                  key={w.id}
                  onClick={() => onCardClick(idx)}
                  onMouseEnter={canHover ? () => onEnter(idx) : undefined}
                  onMouseLeave={canHover ? onLeave : undefined}
                  style={{
                    ...styles.tile(ui, reduceMotion),
                    ...(isHovered ? styles.tileHover(ui) : null),
                  }}
                  type="button"
                >
                  {/* Accent wash */}
                  <div
                    style={{
                      ...styles.tileAccent(),
                      background:
                        "radial-gradient(1200px 380px at 10% 0%, " +
                        accent +
                        "33 0%, rgba(0,0,0,0) 55%)",
                      opacity: isHovered ? 1 : 0.75,
                    }}
                    aria-hidden="true"
                  />

                  {/* Subtle shine */}
                  <div
                    style={{
                      ...styles.tileShine(),
                      opacity: isHovered ? 0.65 : 0.35,
                      transform: isHovered
                        ? "translate3d(0,-2px,0) rotate(1deg)"
                        : "translate3d(0,0,0) rotate(0deg)",
                    }}
                    aria-hidden="true"
                  />

                  <div style={styles.tileTop()}>
                    <div style={styles.badge(ui)} aria-hidden="true">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.tileTitle(ui)}>{w.title}</div>
                      <div style={styles.tileDesc(ui)}>{w.desc}</div>
                    </div>
                  </div>

                  {/* Hover hint (geen knop) */}
                  <div
                    aria-hidden="true"
                    style={{
                      ...styles.hoverHint(ui, reduceMotion),
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered
                        ? "translate3d(0,0,0)"
                        : "translate3d(-6px,0,0)",
                    }}
                  >
                    <span style={{ opacity: 0.9 }}>→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* OVERLAY (alleen voor image items) */}
          {openedImage ? (
            <div style={overlay.backdrop()} onClick={close} role="dialog" aria-modal="true">
              <div style={overlay.topBar(ui)} onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={close} style={overlay.backBtn(ui, reduceMotion)}>
                  ← Terug
                </button>

                <div style={overlay.titleWrap()}>
                  <div style={overlay.title(ui)}>{openedImage.title}</div>
                  <div style={overlay.subtitle(ui)}>
                    Klik buiten de kaart of druk ESC om te sluiten
                  </div>
                </div>

                <div style={{ width: 98 }} />
              </div>

              <div style={overlay.content()} onClick={(e) => e.stopPropagation()}>
                <div style={overlay.imageWrap()}>
                  <div style={overlay.imageGlow()} aria-hidden="true" />
                  <Image
                    src={openedImage.src}
                    alt={openedImage.title}
                    fill
                    priority
                    sizes="100vw"
                    style={{ objectFit: "contain", borderRadius: 18 }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------- STYLES (Modern glass + perf) ---------------- */

const styles = {
  hero: (ui: Theme["ui"]): React.CSSProperties => ({
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
  kicker: (ui: Theme["ui"]): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: ui.muted,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  }),
  kickerDot: (colors: Theme["colors"]): React.CSSProperties => ({
    width: 9,
    height: 9,
    borderRadius: 99,
    background: "linear-gradient(135deg, " + colors.mint + ", " + colors.teal + ")",
    boxShadow: "0 0 0 3px rgba(137,194,170,0.16)",
  }),
  h1: (ui: Theme["ui"]): React.CSSProperties => ({
    fontSize: 26,
    fontWeight: 950,
    margin: "6px 0 0 0",
    color: ui.text,
    lineHeight: 1.15,
  }),
  sub: (ui: Theme["ui"]): React.CSSProperties => ({
    color: ui.muted,
    marginTop: 8,
    fontSize: 13.5,
    overflowWrap: "anywhere",
  }),

  backLink: (ui: Theme["ui"], reduceMotion: boolean): React.CSSProperties => ({
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

  loadingCard: (ui: Theme["ui"]): React.CSSProperties => ({
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
  spinner: (colors: Theme["colors"]): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: 99,
    border: "2px solid rgba(255,255,255,0.22)",
    borderTopColor: colors.mint,
    animation: "spin 0.9s linear infinite",
  }),

  grid: (): React.CSSProperties => ({
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  }),

  tile: (ui: Theme["ui"], reduceMotion: boolean): React.CSSProperties => ({
    position: "relative",
    padding: 16,
    borderRadius: 20,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 55%, rgba(0,0,0,0.10) 100%)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: ui.text,
    display: "grid",
    gap: 8,
    cursor: "pointer",
    textAlign: "left",
    outline: "none",
    overflow: "hidden",
    minWidth: 0,
    transition: reduceMotion
      ? "none"
      : "transform 160ms ease, box-shadow 160ms ease, border 160ms ease",
    willChange: "transform",
    backdropFilter: "blur(14px) saturate(170%)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.42)",
    WebkitTapHighlightColor: "transparent",
  }),

  // ✅ FIX: only change `border` (shorthand) here — no `borderColor`
  tileHover: (_ui: Theme["ui"]): React.CSSProperties => ({
    transform: "translate3d(0,-4px,0)",
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow: "0 28px 86px rgba(0,0,0,0.58)",
  }),

  tileAccent: (): React.CSSProperties => ({
    position: "absolute",
    inset: -2,
    pointerEvents: "none",
  }),
  tileShine: (): React.CSSProperties => ({
    position: "absolute",
    inset: -40,
    pointerEvents: "none",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 28%, rgba(255,255,255,0.00) 60%)",
    filter: "blur(10px)",
    transition: "opacity 180ms ease, transform 180ms ease",
  }),

  tileTop: (): React.CSSProperties => ({
    position: "relative",
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 12,
    alignItems: "center",
    minWidth: 0,
  }),
  badge: (ui: Theme["ui"]): React.CSSProperties => ({
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    background: "rgba(0,0,0,0.38)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.30)",
    backdropFilter: "blur(10px) saturate(160%)",
    color: ui.text,
    flexShrink: 0,
  }),
  tileTitle: (ui: Theme["ui"]): React.CSSProperties => ({
    fontWeight: 950,
    fontSize: 16,
    lineHeight: 1.15,
    textShadow: "0 2px 10px rgba(0,0,0,0.25)",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    color: ui.text,
  }),
  tileDesc: (ui: Theme["ui"]): React.CSSProperties => ({
    color: ui.muted,
    marginTop: 6,
    fontSize: 13,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  }),

  hoverHint: (ui: Theme["ui"], reduceMotion: boolean): React.CSSProperties => ({
    position: "absolute",
    right: 14,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: ui.text,
    boxShadow: "0 16px 36px rgba(0,0,0,0.34)",
    backdropFilter: "blur(10px) saturate(160%)",
    transition: reduceMotion ? "none" : "opacity 160ms ease, transform 160ms ease",
    pointerEvents: "none",
  }),
};

const overlay = {
  backdrop: (): React.CSSProperties => ({
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "linear-gradient(180deg, rgba(0,0,0,0.68), rgba(0,0,0,0.86))",
    backdropFilter: "blur(14px) saturate(140%)",
    display: "grid",
    gridTemplateRows: "auto 1fr",
  }),
  topBar: (ui: Theme["ui"]): React.CSSProperties => ({
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.34)",
    backdropFilter: "blur(12px) saturate(150%)",
  }),
  backBtn: (ui: Theme["ui"], reduceMotion: boolean): React.CSSProperties => ({
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(0,0,0,0.60)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
    minWidth: 98,
    transition: reduceMotion ? "none" : "transform 160ms ease",
    willChange: "transform",
  }),
  titleWrap: (): React.CSSProperties => ({
    minWidth: 0,
    flex: 1,
    display: "grid",
    justifyItems: "center",
    gap: 2,
  }),
  title: (ui: Theme["ui"]): React.CSSProperties => ({
    color: ui.text,
    fontWeight: 950,
    fontSize: 14,
    opacity: 0.98,
    textAlign: "center",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  subtitle: (ui: Theme["ui"]): React.CSSProperties => ({
    color: ui.muted2,
    fontSize: 12.5,
    textAlign: "center",
  }),
  content: (): React.CSSProperties => ({
    padding: 14,
    display: "grid",
    placeItems: "center",
  }),
  imageWrap: (): React.CSSProperties => ({
    position: "relative",
    width: "min(1100px, 96vw)",
    height: "min(720px, 74vh)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
    overflow: "hidden",
    boxShadow: "0 34px 110px rgba(0,0,0,0.70)",
    backdropFilter: "blur(10px) saturate(150%)",
  }),
  imageGlow: (): React.CSSProperties => ({
    position: "absolute",
    inset: -80,
    background:
      "radial-gradient(closest-side, rgba(137,194,170,0.22), rgba(37,89,113,0.00) 70%)",
    filter: "blur(18px)",
    pointerEvents: "none",
  }),
};