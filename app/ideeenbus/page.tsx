"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useMemo, useState } from "react";

type ProfielRole = {
  role: string | null;
  rol: string | null;
  volledige_naam: string | null;
};

type Idee = {
  id: string;
  created_at: string;
  user_id: string;

  titel: string;
  omschrijving: string;
  categorie: string | null;

  status: string | null;
  is_public: boolean;
  teacher_note: string | null;
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("nl-BE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function normalizeRole(p: ProfielRole | null) {
  const raw = (p?.role ?? p?.rol ?? "").toLowerCase().trim();
  return raw;
}
function isTeacherRole(p: ProfielRole | null) {
  const r = normalizeRole(p);
  return r === "teacher" || r === "leerkracht";
}

export default function IdeeenbusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<ProfielRole | null>(null);

  // lijsten
  const [publicIdeeen, setPublicIdeeen] = useState<Idee[]>([]);
  const [myIdeeen, setMyIdeeen] = useState<Idee[]>([]);
  const [pendingIdeeen, setPendingIdeeen] = useState<Idee[]>([]);

  // form (leerling)
  const [titel, setTitel] = useState("");
  const [omschrijving, setOmschrijving] = useState("");
  const [categorie, setCategorie] = useState("algemeen");
  const [submitting, setSubmitting] = useState(false);

  // teacher updates
  const [busyId, setBusyId] = useState<string | null>(null);
  const teacher = useMemo(() => isTeacherRole(profiel), [profiel]);

  const fetchProfiel = async (userId: string) => {
    const { data, error } = await supabase
      .from("profielen")
      .select("role, rol, volledige_naam")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as ProfielRole) ?? null;
  };

  const fetchPublic = async () => {
    const { data, error } = await supabase
      .from("ideeen")
      .select("id, created_at, user_id, titel, omschrijving, categorie, status, is_public, teacher_note")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    setPublicIdeeen(((data as Idee[]) ?? []).filter((i) => i.is_public));
  };

  const fetchMine = async (userId: string) => {
    const { data, error } = await supabase
      .from("ideeen")
      .select("id, created_at, user_id, titel, omschrijving, categorie, status, is_public, teacher_note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    setMyIdeeen((data as Idee[]) ?? []);
  };

  const fetchPending = async () => {
    // enkel relevant voor leerkracht; RLS blokkeert anders
    const { data, error } = await supabase
      .from("ideeen")
      .select("id, created_at, user_id, titel, omschrijving, categorie, status, is_public, teacher_note")
      .eq("is_public", false)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    setPendingIdeeen((data as Idee[]) ?? []);
  };

  const refreshAll = async (userId: string, isTeacher: boolean) => {
    await Promise.all([fetchPublic(), fetchMine(userId)]);
    if (isTeacher) await fetchPending();
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        window.location.replace("/login");
        return;
      }

      setUid(userId);

      try {
        const p = await fetchProfiel(userId);
        setProfiel(p);

        const isTeach = isTeacherRole(p);
        await refreshAll(userId, isTeach);
      } catch (e: any) {
        setError(e?.message ?? "Onbekende fout");
      }

      setLoading(false);
    };

    run();
  }, []);

  const submitIdea = async () => {
    if (!uid) return;
    setError(null);

    const t = titel.trim();
    const o = omschrijving.trim();
    if (!t || !o) {
      setError("Vul een titel en omschrijving in.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ideeen").insert({
        user_id: uid,
        titel: t,
        omschrijving: o,
        categorie,
        status: "nieuw",
        is_public: false, // ✅ Optie C: eerst privé
      });

      if (error) throw new Error(error.message);

      setTitel("");
      setOmschrijving("");
      setCategorie("algemeen");

      // Leerling ziet het meteen in "Mijn ideeën"
      await refreshAll(uid, teacher);
    } catch (e: any) {
      setError(e?.message ?? "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  };

  const teacherUpdate = async (
    ideeId: string,
    patch: Partial<Pick<Idee, "is_public" | "status" | "teacher_note">>
  ) => {
    if (!uid) return;
    setError(null);
    setBusyId(ideeId);

    try {
      const { error } = await supabase.from("ideeen").update(patch).eq("id", ideeId);
      if (error) throw new Error(error.message);

      await refreshAll(uid, true);
    } catch (e: any) {
      setError(e?.message ?? "Onbekende fout");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Ideeënbus laden…</div>
      </main>
    );
  }

  const naam = profiel?.volledige_naam?.split(" ")?.[0] ?? "Daar";

  return (
    <AppShell title="Ideeënbus" subtitle="Ideeën voor sport op school" userName={profiel?.volledige_naam ?? undefined}>
      {/* header */}
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: ui.muted }}>
            Dag <b style={{ color: ui.text }}>{naam}</b> 👋
            <span style={{ color: ui.muted }}> •</span>{" "}
            {teacher ? <b style={{ color: ui.text }}>Leerkrachtmodus</b> : <span>Leerling</span>}
          </div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: ui.muted }}>
            Optie C: je idee is <b style={{ color: ui.text }}>eerst privé</b>. Pas na goedkeuring wordt het zichtbaar voor
            iedereen.
          </div>
        </div>

        <button
          onClick={() => window.location.replace("/dashboard")}
          style={styles.blackBtn}
          title="Terug naar dashboard"
        >
          Terug
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <b>Oeps:</b> {error}
        </div>
      )}

      {/* Form */}
      <section style={styles.card}>
        <div style={styles.cardTitle}>💡 Plaats een idee</div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="Titel (bv. 'Tornooi tijdens de middag')"
            style={styles.input}
          />
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={styles.input}>
            <option value="algemeen">Algemeen</option>
            <option value="materiaal">Materiaal</option>
            <option value="spel">Spel / sport</option>
            <option value="training">Training</option>
            <option value="toernooi">Tornooi / event</option>
            <option value="ruimte">Speelplaats / ruimte</option>
          </select>
          <textarea
            value={omschrijving}
            onChange={(e) => setOmschrijving(e.target.value)}
            placeholder="Leg kort uit wat je bedoelt + waarom het leuk/nuttig is."
            rows={5}
            style={{ ...styles.input, height: "auto", padding: "10px 12px", resize: "vertical" }}
          />
          <button onClick={submitIdea} disabled={submitting} style={{ ...styles.blackBtn, width: "fit-content" }}>
            {submitting ? "Versturen..." : "Verstuur idee"}
          </button>
        </div>
      </section>

      {/* Publieke ideeën */}
      <section style={{ marginTop: 18 }}>
        <div style={styles.sectionTitle}>✅ Goedgekeurde ideeën (publiek)</div>

        <div style={{ display: "grid", gap: 12 }}>
          {publicIdeeen.length === 0 ? (
            <div style={{ color: ui.muted }}>Nog geen goedgekeurde ideeën.</div>
          ) : (
            publicIdeeen.map((i) => <IdeeCard key={i.id} idee={i} showTeacherNote={false} />)
          )}
        </div>
      </section>

      {/* Mijn ideeën */}
      <section style={{ marginTop: 18 }}>
        <div style={styles.sectionTitle}>🧾 Mijn ideeën</div>

        <div style={{ display: "grid", gap: 12 }}>
          {myIdeeen.length === 0 ? (
            <div style={{ color: ui.muted }}>Je hebt nog geen ideeën ingestuurd.</div>
          ) : (
            myIdeeen.map((i) => <IdeeCard key={i.id} idee={i} showTeacherNote={true} />)
          )}
        </div>
      </section>

      {/* Moderatie (leerkracht) */}
      {teacher && (
        <section style={{ marginTop: 18 }}>
          <div style={styles.sectionTitle}>🧑‍🏫 Moderatie (privé ideeën)</div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: ui.muted }}>
            Deze ideeën zijn nog niet publiek. Kies: goedkeuren (publiek), inplannen, of afwijzen.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {pendingIdeeen.length === 0 ? (
              <div style={{ color: ui.muted }}>Geen ideeën in afwachting.</div>
            ) : (
              pendingIdeeen.map((i) => (
                <TeacherModerationCard
                  key={i.id}
                  idee={i}
                  busy={busyId === i.id}
                  onApprove={(note) =>
                    teacherUpdate(i.id, { is_public: true, status: "haalbaar", teacher_note: note ?? i.teacher_note })
                  }
                  onSchedule={(note) => teacherUpdate(i.id, { status: "ingepland", teacher_note: note })}
                  onReject={(note) => teacherUpdate(i.id, { status: "afgewezen", teacher_note: note })}
                />
              ))
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}

/* -----------------------
   Cards
----------------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${ui.border}`,
        color: ui.text,
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {children}
    </span>
  );
}

function statusLabel(s: string | null) {
  const x = (s ?? "").toLowerCase();
  if (!x) return "—";
  if (x === "nieuw") return "Nieuw";
  if (x === "bekeken") return "Bekeken";
  if (x === "haalbaar") return "Haalbaar";
  if (x === "ingepland") return "Ingepland";
  if (x === "afgewezen") return "Afgewezen";
  return s!;
}

function IdeeCard({ idee, showTeacherNote }: { idee: Idee; showTeacherNote: boolean }) {
  return (
    <div style={styles.ideaCard}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950, color: ui.text, fontSize: 15 }}>{idee.titel}</div>
          <div style={{ marginTop: 6, color: ui.muted, lineHeight: 1.25 }}>{idee.omschrijving}</div>
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <Badge>{statusLabel(idee.status)}</Badge>
          <div style={{ fontSize: 12, color: ui.muted }}>{fmtDate(idee.created_at)}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge>#{idee.categorie ?? "algemeen"}</Badge>
        {idee.is_public ? <Badge>Publiek</Badge> : <Badge>Privé</Badge>}
      </div>

      {showTeacherNote && idee.teacher_note ? (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 14, background: ui.warnBg, border: `1px solid ${ui.warnBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: ui.text, opacity: 0.95 }}>Notitie leerkracht</div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: ui.text, opacity: 0.9 }}>{idee.teacher_note}</div>
        </div>
      ) : null}
    </div>
  );
}

function TeacherModerationCard({
  idee,
  busy,
  onApprove,
  onSchedule,
  onReject,
}: {
  idee: Idee;
  busy: boolean;
  onApprove: (note?: string) => void;
  onSchedule: (note?: string) => void;
  onReject: (note?: string) => void;
}) {
  const [note, setNote] = useState(idee.teacher_note ?? "");

  return (
    <div style={{ ...styles.ideaCard, borderColor: ui.border2 }}>
      <div style={{ fontWeight: 950, color: ui.text, fontSize: 15 }}>{idee.titel}</div>
      <div style={{ marginTop: 6, color: ui.muted, lineHeight: 1.25 }}>{idee.omschrijving}</div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge>#{idee.categorie ?? "algemeen"}</Badge>
        <Badge>{fmtDate(idee.created_at)}</Badge>
        <Badge>Status: {statusLabel(idee.status)}</Badge>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notitie (optioneel) voor leerling"
          rows={3}
          style={{ ...styles.input, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled={busy}
            onClick={() => onApprove(note.trim() ? note.trim() : undefined)}
            style={styles.blackBtn}
            title="Zet publiek + status haalbaar"
          >
            {busy ? "..." : "Goedkeuren (publiek)"}
          </button>

          <button
            disabled={busy}
            onClick={() => onSchedule(note.trim() ? note.trim() : undefined)}
            style={{ ...styles.blackBtn, background: "rgba(0,0,0,0.45)" }}
            title="Zet status ingepland (blijft privé tenzij je ook goedkeurt)"
          >
            {busy ? "..." : "Inplannen"}
          </button>

          <button
            disabled={busy}
            onClick={() => onReject(note.trim() ? note.trim() : undefined)}
            style={{ ...styles.blackBtn, background: "rgba(40,0,0,0.55)", borderColor: ui.errorBorder }}
            title="Zet status afgewezen (blijft privé)"
          >
            {busy ? "..." : "Afwijzen"}
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: ui.muted }}>
          Tip: als je “Inplannen” kiest en je wil dat leerlingen het ook zien, klik daarna op “Goedkeuren (publiek)”.
        </div>
      </div>
    </div>
  );
}

/* -----------------------
   Styles
----------------------- */

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  cardTitle: { fontSize: 13, fontWeight: 950, color: ui.text },
  sectionTitle: { marginBottom: 10, fontSize: 13, fontWeight: 950, color: ui.text },
  ideaCard: {
    padding: 14,
    borderRadius: 18,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  input: {
    height: 46,
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
    color: ui.text,
    padding: "0 12px",
    outline: "none",
  },
  blackBtn: {
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.72)",
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    background: ui.errorBg,
    border: `1px solid ${ui.errorBorder}`,
    color: ui.text,
    fontSize: 14,
  },
};