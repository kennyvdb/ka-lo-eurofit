"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;

  volledige_naam: string | null;
  geslacht: string | null;
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
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  successBg: "rgba(34,197,94,0.15)",
  successBorder: "rgba(34,197,94,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
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
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function joinName(firstName: string, lastName: string) {
  return `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim() || null;
}

export default function ProfielPage() {
  const [loading, setLoading] = useState(true);
  const [savingFixed, setSavingFixed] = useState(false);
  const [savingYear, setSavingYear] = useState(false);

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [message, setMessage] = useState("");

  // losse velden voor voornaam/naam (opslaan naar volledige_naam)
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
      setMessage("Vul eerst je klas in.");
      setSavingYear(false);
      return;
    }

    // Enkel klas + schooljaar bevestiging updaten
    const payload = {
      id: userId,
      klas_naam: profile.klas_naam.trim(),
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
        schooljaar: currentSchoolYear,
        schooljaar_bevestigd_op: payload.schooljaar_bevestigd_op,
      }));
      setMessage(`Schooljaar ${currentSchoolYear} bevestigd ✅`);
    }

    setSavingYear(false);
  }

  return (
    <AppShell title="KA LO App" subtitle="GO!Atheneum Avelgem" userName={profile.volledige_naam ?? null}>
      <div style={{ maxWidth: 760 }}>
        <div style={styles.header}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 950, margin: 0, color: ui.text }}>Profiel</h1>
            <div style={{ color: ui.muted, marginTop: 6 }}>
              {roleLabel} • {email && <>ingelogd als <b>{email}</b></>}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 12, color: ui.muted }}>Bezig met laden…</div>
        ) : (
          <>
            {!!message && (
              <div
                style={{
                  ...styles.message,
                  background:
                    message.includes("mislukt") || message.includes("Fout") || message.includes("Vul eerst")
                      ? ui.errorBg
                      : ui.successBg,
                  border:
                    message.includes("mislukt") || message.includes("Fout") || message.includes("Vul eerst")
                      ? `1px solid ${ui.errorBorder}`
                      : `1px solid ${ui.successBorder}`,
                }}
              >
                {message}
              </div>
            )}

            {/* Schooljaar status */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Schooljaar</div>
              <div style={{ color: ui.muted }}>
                Huidig schooljaar: <b style={{ color: ui.text }}>{currentSchoolYear}</b>
              </div>
              <div style={{ marginTop: 6 }}>
                Status:{" "}
                {schoolYearIsCurrent ? (
                  <b style={{ color: "#22c55e" }}>OK (bevestigd)</b>
                ) : (
                  <b style={{ color: "#ff5570" }}>Opnieuw bevestigen vereist</b>
                )}
              </div>
            </div>

            {/* Vaste gegevens */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Vaste gegevens</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

              <Field label="Geslacht">
                <select
                  value={profile.geslacht ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, geslacht: e.target.value || null }))}
                  style={styles.input}
                >
                  <option value="">Kies…</option>
                  <option value="M">M</option>
                  <option value="V">V</option>
                  <option value="X">X</option>
                </select>
              </Field>

              <Field label="Geboortedatum">
                <input
                  type="date"
                  value={profile.geboortedatum ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, geboortedatum: e.target.value || null }))}
                  style={styles.input}
                />
              </Field>

              <button
                type="button"
                onClick={saveFixedProfile}
                disabled={savingFixed}
                style={{ ...styles.primaryBtn, opacity: savingFixed ? 0.7 : 1 }}
              >
                {savingFixed ? "Opslaan…" : "Opslaan vaste gegevens"}
              </button>
            </div>

            {/* Schooljaar gegevens (enkel klas aanpasbaar) */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Gegevens voor dit schooljaar</div>

              {!schoolYearIsCurrent && (
                <div style={styles.warning}>
                  Bevestig opnieuw voor <b>{currentSchoolYear}</b>. (Je kan enkel je klas aanpassen.)
                </div>
              )}

              {/* Read-only tonen */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <ReadOnlyField label="Graad" value={profile.graad ? `${profile.graad}e graad` : "—"} />
                <ReadOnlyField label="Leerjaar" value={profile.leerjaar ?? "—"} />
                <ReadOnlyField label="Finaliteit" value={profile.finaliteit ?? "—"} />
                <ReadOnlyField label="Schooljaar (opgeslagen)" value={profile.schooljaar ?? "—"} />
              </div>

              <Field label="Klas">
                <input
                  placeholder="bv. 3A SPORT"
                  value={profile.klas_naam ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, klas_naam: e.target.value || null }))}
                  style={styles.input}
                />
              </Field>

              <button
                type="button"
                onClick={confirmSchoolYearAndSaveClassOnly}
                disabled={savingYear}
                style={{ ...styles.primaryBtn, opacity: savingYear ? 0.7 : 1 }}
              >
                {savingYear ? "Bevestigen…" : `Bevestig schooljaar ${currentSchoolYear}`}
              </button>

              <div style={{ marginTop: 10, color: ui.muted2, fontSize: 13 }}>
                Laatste bevestiging:{" "}
                <b style={{ color: ui.text }}>
                  {profile.schooljaar_bevestigd_op ? profile.schooljaar_bevestigd_op : "—"}
                </b>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <label style={{ fontWeight: 900, color: ui.text }}>{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <label style={{ fontWeight: 900, color: ui.text }}>{label}</label>
      <div style={styles.readOnlyBox}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  message: {
    padding: 12,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
    marginTop: 12,
  },
  cardTitle: { fontWeight: 950, marginBottom: 10, color: ui.text },
  input: {
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.2)",
    color: ui.text,
  },
  readOnlyBox: {
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.12)",
    color: ui.text,
    opacity: 0.9,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: `linear-gradient(135deg, rgba(109,91,255,0.4), rgba(34,211,238,0.25))`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    width: "fit-content",
  },
  warning: {
    padding: 12,
    borderRadius: 16,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    marginBottom: 12,
    color: ui.text,
  },
};
