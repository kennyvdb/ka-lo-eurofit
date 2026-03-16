"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { KLASSEN, getKlasMeta } from "@/shared/klassen/klassen";

type Profile = {
  id: string;
  volledige_naam: string | null;
  geslacht: "M" | "V" | null;
  geboortedatum: string | null;
  graad: string | null;
  leerjaar: string | null;
  finaliteit: string | null;
  klas_naam: string | null;
  schooljaar: string | null;
  schooljaar_bevestigd_op: string | null;
  role: "student" | "teacher" | null;
};

const emptyProfile: Profile = {
  id: "",
  volledige_naam: null,
  geslacht: null,
  geboortedatum: null,
  graad: null,
  leerjaar: null,
  finaliteit: null,
  klas_naam: null,
  schooljaar: null,
  schooljaar_bevestigd_op: null,
  role: null,
};

const ui = {
  text: "#EEF4FF",
  muted: "rgba(238,244,255,0.72)",
  muted2: "rgba(238,244,255,0.54)",
  panel: "rgba(255,255,255,0.06)",
  panelStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.16)",
  inputBg: "rgba(7,13,27,0.45)",
  inputBgSoft: "rgba(7,13,27,0.30)",
  shadow: "0 10px 30px rgba(0,0,0,0.20)",
  success: "#22c55e",
  successBg: "rgba(34,197,94,0.14)",
  successBorder: "rgba(34,197,94,0.26)",
  error: "#ff6b81",
  errorBg: "rgba(255,107,129,0.14)",
  errorBorder: "rgba(255,107,129,0.26)",
  warn: "#f7c66b",
  warnBg: "rgba(247,198,107,0.12)",
  warnBorder: "rgba(247,198,107,0.28)",
  brandA: "#7c6cff",
  brandB: "#22d3ee",
};

function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 9) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function splitName(full: string | null) {
  const s = (full ?? "").trim().replace(/\s+/g, " ");
  if (!s) return { firstName: "", lastName: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function joinName(firstName: string, lastName: string) {
  return `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim() || null;
}

function getMessageTone(message: string) {
  const isError =
    message.includes("mislukt") ||
    message.includes("Fout") ||
    message.includes("Kies eerst") ||
    message.includes("Ongeldige");

  if (isError) {
    return {
      bg: ui.errorBg,
      border: ui.errorBorder,
      color: ui.text,
    };
  }

  return {
    bg: ui.successBg,
    border: ui.successBorder,
    color: ui.text,
  };
}

export default function ProfielPage() {
  const [loading, setLoading] = useState(true);
  const [savingFixed, setSavingFixed] = useState(false);
  const [savingYear, setSavingYear] = useState(false);

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const currentSchoolYear = useMemo(() => getCurrentSchoolYearBelgium(), []);
  const schoolYearIsCurrent = profile.schooljaar === currentSchoolYear;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage("");

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.location.href = "/login";
        return;
      }

      const userId = authData.user.id;
      setEmail(authData.user.email ?? "");

      const { data, error } = await supabase
        .from("profielen")
        .select(
          "id, volledige_naam, geslacht, geboortedatum, graad, leerjaar, finaliteit, klas_naam, schooljaar, schooljaar_bevestigd_op, role"
        )
        .eq("id", userId)
        .maybeSingle<Profile>();

      if (error) {
        setMessage(`Fout bij laden: ${error.message}`);
        const fallback = { ...emptyProfile, id: userId };
        setProfile(fallback);
        const n = splitName(fallback.volledige_naam);
        setFirstName(n.firstName);
        setLastName(n.lastName);
        setLoading(false);
        return;
      }

      const p = data ?? { ...emptyProfile, id: userId };
      setProfile(p);

      const n = splitName(p.volledige_naam);
      setFirstName(n.firstName);
      setLastName(n.lastName);

      setLoading(false);
    };

    load();
  }, []);

  const roleLabel =
    profile.role === "teacher"
      ? "Leerkracht"
      : profile.role === "student"
      ? "Leerling"
      : "Leerling";

  async function saveFixedProfile() {
    setSavingFixed(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      window.location.href = "/login";
      return;
    }

    const userId = authData.user.id;

    const payload = {
      id: userId,
      volledige_naam: joinName(firstName, lastName),
      geslacht: profile.geslacht || null,
      geboortedatum: profile.geboortedatum || null,
    };

    const { error } = await supabase.from("profielen").upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(`Opslaan mislukt: ${error.message}`);
    } else {
      setProfile((p) => ({ ...p, volledige_naam: payload.volledige_naam }));
      setMessage("Vaste gegevens opgeslagen ✅");
    }

    setSavingFixed(false);
  }

  async function confirmSchoolYearAndSaveClassOnly() {
    setSavingYear(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      window.location.href = "/login";
      return;
    }

    const userId = authData.user.id;

    if (!profile.klas_naam || !profile.klas_naam.trim()) {
      setMessage("Kies eerst je klas.");
      setSavingYear(false);
      return;
    }

    const meta = getKlasMeta(profile.klas_naam.trim());

    if (!meta) {
      setMessage("Ongeldige klas geselecteerd.");
      setSavingYear(false);
      return;
    }

    const payload = {
      id: userId,
      klas_naam: meta.klas,
      graad: String(meta.graad),
      leerjaar: String(meta.leerjaar),
      finaliteit: meta.finaliteit,
      schooljaar: currentSchoolYear,
      schooljaar_bevestigd_op: todayISO(),
    };

    const { error } = await supabase.from("profielen").upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(`Bevestigen mislukt: ${error.message}`);
    } else {
      setProfile((p) => ({
        ...p,
        klas_naam: payload.klas_naam,
        graad: payload.graad,
        leerjaar: payload.leerjaar,
        finaliteit: payload.finaliteit,
        schooljaar: currentSchoolYear,
        schooljaar_bevestigd_op: payload.schooljaar_bevestigd_op,
      }));
      setMessage(`Schooljaar ${currentSchoolYear} bevestigd ✅`);
    }

    setSavingYear(false);
  }

  const messageTone = message ? getMessageTone(message) : null;

  return (
    <AppShell
      title="KA LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={profile.volledige_naam ?? null}
    >
      <div style={styles.page}>
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div>
              <div style={styles.eyebrow}>Account</div>
              <h1 style={styles.pageTitle}>Profiel</h1>
              <p style={styles.pageSubtitle}>
                Beheer je persoonlijke gegevens en bevestig je klas voor het huidige schooljaar.
              </p>
            </div>

            <div style={styles.heroMeta}>
              <div style={styles.userPill}>
                <span style={styles.userPillLabel}>{roleLabel}</span>
              </div>
              {!!email && <div style={styles.userMail}>{email}</div>}
            </div>
          </div>
        </section>

        {loading ? (
          <div style={styles.loadingCard}>Bezig met laden…</div>
        ) : (
          <>
            {!!message && messageTone && (
              <div
                style={{
                  ...styles.alert,
                  background: messageTone.bg,
                  border: `1px solid ${messageTone.border}`,
                  color: messageTone.color,
                }}
              >
                {message}
              </div>
            )}

            <section style={styles.card}>
              <SectionHeader
                title="Schooljaar"
                subtitle="Controleer of je gegevens bevestigd zijn voor het actieve schooljaar."
              />

              <div style={styles.infoRow}>
                <InfoTile label="Huidig schooljaar" value={currentSchoolYear} />
                <div style={styles.infoTile}>
                  <div style={styles.infoLabel}>Status</div>
                  <div style={{ marginTop: 8 }}>
                    {schoolYearIsCurrent ? (
                      <StatusBadge tone="success">Bevestigd</StatusBadge>
                    ) : (
                      <StatusBadge tone="error">Opnieuw bevestigen vereist</StatusBadge>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <SectionHeader
                title="Vaste gegevens"
                subtitle="Deze gegevens wijzigen niet per schooljaar."
              />

              <div style={styles.grid2}>
                <Field label="Voornaam">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={styles.input}
                    placeholder="Voornaam"
                  />
                </Field>

                <Field label="Naam">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={styles.input}
                    placeholder="Naam"
                  />
                </Field>
              </div>

              <div style={styles.grid2}>
                <Field label="Geslacht">
                  <select
                    value={profile.geslacht ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        geslacht: (e.target.value || null) as "M" | "V" | null,
                      }))
                    }
                    style={styles.input}
                  >
                    <option value="">Kies…</option>
                    <option value="M">M</option>
                    <option value="V">V</option>
                  </select>
                </Field>

                <Field label="Geboortedatum">
                  <input
                    type="date"
                    value={profile.geboortedatum ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        geboortedatum: e.target.value || null,
                      }))
                    }
                    style={styles.input}
                  />
                </Field>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={saveFixedProfile}
                  disabled={savingFixed}
                  style={{
                    ...styles.primaryBtn,
                    opacity: savingFixed ? 0.72 : 1,
                    cursor: savingFixed ? "not-allowed" : "pointer",
                  }}
                >
                  {savingFixed ? "Opslaan…" : "Opslaan vaste gegevens"}
                </button>
              </div>
            </section>

            <section style={styles.card}>
              <SectionHeader
                title="Gegevens voor dit schooljaar"
                subtitle="Hier bevestig je je klas voor het actieve schooljaar."
              />

              {!schoolYearIsCurrent && (
                <div style={styles.warning}>
                  Bevestig opnieuw voor <b>{currentSchoolYear}</b>. Je kan hier enkel je klas aanpassen.
                </div>
              )}

              <div style={styles.grid2}>
                <ReadOnlyField label="Graad" value={profile.graad ? `${profile.graad}e graad` : "—"} />
                <ReadOnlyField label="Leerjaar" value={profile.leerjaar ?? "—"} />
                <ReadOnlyField label="Finaliteit" value={profile.finaliteit ?? "—"} />
                <ReadOnlyField label="Schooljaar (opgeslagen)" value={profile.schooljaar ?? "—"} />
              </div>

              <Field label="Klas">
                <select
                  value={profile.klas_naam ?? ""}
                  onChange={(e) => {
                    const newKlas = e.target.value;
                    const meta = getKlasMeta(newKlas);

                    setProfile((p) => ({
                      ...p,
                      klas_naam: newKlas || null,
                      graad: meta ? String(meta.graad) : p.graad,
                      leerjaar: meta ? String(meta.leerjaar) : p.leerjaar,
                      finaliteit: meta ? meta.finaliteit : p.finaliteit,
                    }));
                  }}
                  style={styles.input}
                >
                  <option value="">Kies je klas…</option>

                  <optgroup label="1e graad">
                    {KLASSEN.filter((k) => k.graad === 1).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="2e graad">
                    {KLASSEN.filter((k) => k.graad === 2).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="3e graad">
                    {KLASSEN.filter((k) => k.graad === 3).map((k) => (
                      <option key={k.klas} value={k.klas}>
                        {k.klas}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </Field>

              <div style={styles.actionsBetween}>
                <button
                  type="button"
                  onClick={confirmSchoolYearAndSaveClassOnly}
                  disabled={savingYear}
                  style={{
                    ...styles.primaryBtn,
                    opacity: savingYear ? 0.72 : 1,
                    cursor: savingYear ? "not-allowed" : "pointer",
                  }}
                >
                  {savingYear ? "Bevestigen…" : `Bevestig schooljaar ${currentSchoolYear}`}
                </button>

                <div style={styles.footnote}>
                  Laatste bevestiging:{" "}
                  <b style={{ color: ui.text }}>
                    {profile.schooljaar_bevestigd_op ? profile.schooljaar_bevestigd_op : "—"}
                  </b>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
}) {
  const badgeStyles =
    tone === "success"
      ? {
          background: ui.successBg,
          border: `1px solid ${ui.successBorder}`,
          color: ui.success,
        }
      : {
          background: ui.errorBg,
          border: `1px solid ${ui.errorBorder}`,
          color: ui.error,
        };

  return <span style={{ ...styles.badge, ...badgeStyles }}>{children}</span>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoTile}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.readOnlyBox}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
    paddingBottom: 32,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: 24,
    background: `
      radial-gradient(circle at top right, rgba(34,211,238,0.18), transparent 30%),
      radial-gradient(circle at top left, rgba(124,108,255,0.22), transparent 35%),
      rgba(255,255,255,0.06)
    `,
    border: `1px solid ${ui.border}`,
    boxShadow: ui.shadow,
    marginBottom: 16,
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: 800,
    color: ui.muted2,
    marginBottom: 8,
  },
  pageTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 950,
    color: ui.text,
  },
  pageSubtitle: {
    margin: "10px 0 0",
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 560,
    color: ui.muted,
  },
  heroMeta: {
    display: "grid",
    gap: 10,
    minWidth: 220,
  },
  userPill: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: `1px solid ${ui.border2}`,
  },
  userPillLabel: {
    color: ui.text,
    fontWeight: 800,
    fontSize: 14,
  },
  userMail: {
    color: ui.muted,
    fontSize: 14,
    wordBreak: "break-word",
  },

  loadingCard: {
    padding: 18,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    color: ui.muted,
  },

  alert: {
    padding: "14px 16px",
    borderRadius: 18,
    marginBottom: 16,
    fontWeight: 600,
  },

  card: {
    padding: 20,
    borderRadius: 24,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    boxShadow: ui.shadow,
    marginTop: 16,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: ui.text,
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.6,
    color: ui.muted,
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  infoTile: {
    padding: 16,
    borderRadius: 18,
    background: ui.panelStrong,
    border: `1px solid ${ui.border}`,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: ui.muted2,
  },
  infoValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 900,
    color: ui.text,
    lineHeight: 1.2,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  field: {
    display: "grid",
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontWeight: 800,
    fontSize: 14,
    color: ui.text,
  },

  input: {
    width: "100%",
    minHeight: 46,
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: ui.inputBg,
    color: ui.text,
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },

  readOnlyBox: {
    minHeight: 46,
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: ui.inputBgSoft,
    color: ui.text,
    fontSize: 14,
    boxSizing: "border-box",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  actionsBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 6,
  },

  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: `linear-gradient(135deg, ${ui.brandA}, ${ui.brandB})`,
    color: "#fff",
    fontWeight: 900,
    fontSize: 14,
    boxShadow: "0 10px 24px rgba(34,211,238,0.14)",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
  },

  warning: {
    padding: 14,
    borderRadius: 18,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    color: ui.text,
    marginBottom: 16,
    lineHeight: 1.5,
  },

  footnote: {
    color: ui.muted2,
    fontSize: 13,
  },
};