"use client";

export default function ProfileRequiredGate({
  missing,
  currentSchoolYear,
}: {
  missing: string[];
  currentSchoolYear: string;
}) {
  const niceNames: Record<string, string> = {
    geslacht: "Geslacht",
    geboortedatum: "Geboortedatum",
    graad: "Graad",
    leerjaar: "Leerjaar",
    finaliteit: "Finaliteit",
    klas: "Klas",
    klas_naam: "Klas",
    schooljaar: `Schooljaar bevestigen (${currentSchoolYear})`,
    profiel_niet_gevonden: "Profiel bestaat nog niet",
    not_logged_in: "Niet ingelogd",
  };

  const ui = {
    text: "rgba(234,240,255,0.92)",
    muted: "rgba(234,240,255,0.72)",
    muted2: "rgba(234,240,255,0.55)",
    panel: "rgba(255,255,255,0.06)",
    panel2: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.12)",
    border2: "rgba(255,255,255,0.18)",
    brand: "#6D5BFF",
    brand2: "#22D3EE",
    warnBg: "rgba(255,193,102,0.10)",
    warnBorder: "rgba(255,193,102,0.26)",
  };

  return (
    <div
      style={{
        maxWidth: 760,
        padding: 16,
        borderRadius: 20,
        border: `1px solid ${ui.border}`,
        background: ui.panel,
        color: ui.text,
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(135deg, rgba(255,193,102,0.22), rgba(109,91,255,0.20))`,
            border: `1px solid ${ui.border2}`,
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
          }}
        >
          !
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 950, margin: 0 }}>Eerst je profiel invullen</h2>
          <div style={{ color: ui.muted, marginTop: 4 }}>
            Voor het schooljaar <b style={{ color: ui.text }}>{currentSchoolYear}</b> moet je profiel volledig zijn.
          </div>
        </div>
      </div>

      {/* Info box */}
      <div
        style={{
          padding: 12,
          borderRadius: 16,
          background: ui.warnBg,
          border: `1px solid ${ui.warnBorder}`,
          color: ui.text,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Nog aan te vullen</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: ui.text }}>
          {missing.map((m) => (
            <li key={m} style={{ marginBottom: 4 }}>
              <span style={{ color: ui.text, fontWeight: 800 }}>{niceNames[m] ?? m}</span>
              <span style={{ color: ui.muted2 }}> — vereist</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => (window.location.href = "/dashboard/profiel")}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: `1px solid ${ui.border2}`,
            background: `linear-gradient(135deg, rgba(109,91,255,0.32), rgba(34,211,238,0.18))`,
            color: ui.text,
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Ga naar Profiel →
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 14px",
            borderRadius: 14,
            border: `1px solid ${ui.border2}`,
            background: ui.panel2,
            color: ui.text,
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Opnieuw controleren
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: ui.muted2 }}>
        Tip: Na het bevestigen van je schooljaar kan je meteen terugkeren naar Eurofittest/Challenges.
      </div>
    </div>
  );
}
