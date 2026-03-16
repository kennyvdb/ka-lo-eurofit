"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type Profiel = {
  id: string;
  volledige_naam: string | null;
  role: string | null;
  rol: string | null;
  klas_naam: string | null;
};

type Uitdaging = {
  id: string;
  titel: string;
  beschrijving: string | null;
  startdatum: string;
  einddatum: string;
  schooljaar: string | null;
  actief: boolean | null;
};

type ActiviteitRegistratie = {
  id: string;
  uitdaging_id: string | null;
  leerling_id: string | null;
  leerling_naam: string | null;
  klas_naam: string | null;
  activiteit_type: string | null;
  afstand_km: number | null;
  activiteit_datum: string | null;
  bewijs_type: string | null;
  strava_url: string | null;
  strava_activity_id: string | null;
  status: string | null;
  nagekeken_door: string | null;
  opmerking: string | null;
  aangemaakt_op: string | null;
};

type KlasRanking = {
  klas_naam: string;
  totaal_km: number;
};

type LeerlingRanking = {
  leerling_id: string;
  leerling_naam: string;
  klas_naam: string;
  totaal_km: number;
};

const brand = {
  blue: "#255971",
  teal: "#4B8E8D",
  mint: "#89C2AA",
};

const ui = {
  text: "rgba(234,240,255,0.92)",
  muted: "rgba(234,240,255,0.72)",
  muted2: "rgba(234,240,255,0.55)",
  panel: "rgba(255,255,255,0.06)",
  panel2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  border2: "rgba(255,255,255,0.18)",
  successBg: "rgba(34,197,94,0.15)",
  successBorder: "rgba(34,197,94,0.28)",
  errorBg: "rgba(255,85,112,0.15)",
  errorBorder: "rgba(255,85,112,0.28)",
  warnBg: "rgba(255,193,102,0.10)",
  warnBorder: "rgba(255,193,102,0.28)",
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function isTeacher(role?: string | null, rol?: string | null) {
  const raw = (role ?? rol ?? "").toLowerCase();
  return raw === "teacher" || raw === "leerkracht";
}

function isValidStravaUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const u = new URL(value);
    return (
      u.hostname.includes("strava.com") &&
      (u.pathname.includes("/activities/") || u.pathname.includes("/athletes/"))
    );
  } catch {
    return false;
  }
}

function extractStravaActivityId(url: string) {
  const match = url.match(/activities\/(\d+)/);
  return match?.[1] ?? null;
}

function getCurrentSchoolYearBelgium(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 9) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

export default function RunWalkChallengePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [uitdaging, setUitdaging] = useState<Uitdaging | null>(null);
  const [registraties, setRegistraties] = useState<ActiviteitRegistratie[]>([]);
  const [message, setMessage] = useState<string>("");

  const [activiteitType, setActiviteitType] = useState<"run" | "walk">("run");
  const [afstandKm, setAfstandKm] = useState("");
  const [activiteitDatum, setActiviteitDatum] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [stravaUrl, setStravaUrl] = useState("");
  const [opmerking, setOpmerking] = useState("");

  const schooljaar = useMemo(() => getCurrentSchoolYearBelgium(), []);
  const teacherMode = isTeacher(profiel?.role, profiel?.rol);

  async function ensureChallengeExists(): Promise<Uitdaging | null> {
    const { data: existing, error: existingError } = await supabase
      .from("uitdagingen")
      .select("id, titel, beschrijving, startdatum, einddatum, schooljaar, actief")
      .eq("titel", "Run & Walk Challenge")
      .eq("schooljaar", schooljaar)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return existing as Uitdaging;

    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 45);

    const payload = {
      titel: "Run & Walk Challenge",
      beschrijving:
        "Loop of wandel kilometers, bewijs je activiteit met Strava en help je klas naar de overwinning.",
      startdatum: start.toISOString().slice(0, 10),
      einddatum: end.toISOString().slice(0, 10),
      schooljaar,
      actief: true,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("uitdagingen")
      .insert(payload)
      .select("id, titel, beschrijving, startdatum, einddatum, schooljaar, actief")
      .single();

    if (insertError) throw insertError;
    return inserted as Uitdaging;
  }

  async function fetchProfiel(userId: string) {
    const { data, error } = await supabase
      .from("profielen")
      .select("id, volledige_naam, role, rol, klas_naam")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as Profiel | null) ?? null;
  }

  async function fetchRegistraties(uitdagingId: string) {
    const { data, error } = await supabase
      .from("activiteit_registraties")
      .select(
        "id, uitdaging_id, leerling_id, leerling_naam, klas_naam, activiteit_type, afstand_km, activiteit_datum, bewijs_type, strava_url, strava_activity_id, status, nagekeken_door, opmerking, aangemaakt_op"
      )
      .eq("uitdaging_id", uitdagingId)
      .order("aangemaakt_op", { ascending: false });

    if (error) throw error;
    return (data as ActiviteitRegistratie[]) ?? [];
  }

  async function loadAll() {
    setRefreshing(true);
    setMessage("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const userId = sessionData.session?.user?.id;
      if (!userId) {
        window.location.replace("/login");
        return;
      }

      const p = await fetchProfiel(userId);
      setProfiel(p);

      const u = await ensureChallengeExists();
      setUitdaging(u);

      if (u?.id) {
        const rows = await fetchRegistraties(u.id);
        setRegistraties(rows);
      } else {
        setRegistraties([]);
      }
    } catch (err: any) {
      setMessage(`Fout bij laden: ${err.message ?? "Onbekende fout"}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRegistreren() {
    if (!profiel?.id) return;

    setMessage("");

    if (!profiel.klas_naam?.trim()) {
      setMessage("Je profiel heeft nog geen klas. Vul eerst je klas in op je profielpagina.");
      return;
    }

    if (!uitdaging?.id) {
      setMessage("Er is nog geen actieve challenge gevonden.");
      return;
    }

    const km = Number(String(afstandKm).replace(",", "."));
    if (!km || km <= 0) {
      setMessage("Geef een geldige afstand in kilometers in.");
      return;
    }

    if (km > 250) {
      setMessage("De afstand lijkt te groot voor één registratie. Controleer je invoer.");
      return;
    }

    if (!activiteitDatum) {
      setMessage("Kies een datum voor je activiteit.");
      return;
    }

    if (!stravaUrl.trim()) {
      setMessage("Voeg een Strava-link toe als bewijs.");
      return;
    }

    if (!isValidStravaUrl(stravaUrl)) {
      setMessage("Geef een geldige Strava-link in.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        uitdaging_id: uitdaging.id,
        leerling_id: profiel.id,
        leerling_naam: profiel.volledige_naam ?? "Onbekende leerling",
        klas_naam: profiel.klas_naam,
        activiteit_type: activiteitType,
        afstand_km: km,
        activiteit_datum: activiteitDatum,
        bewijs_type: "strava",
        strava_url: stravaUrl.trim(),
        strava_activity_id: extractStravaActivityId(stravaUrl.trim()),
        status: "ingediend",
        opmerking: opmerking.trim() || null,
      };

      const { error } = await supabase.from("activiteit_registraties").insert(payload);

      if (error) throw error;

      setAfstandKm("");
      setStravaUrl("");
      setOpmerking("");
      setActiviteitType("run");
      setActiviteitDatum(new Date().toISOString().slice(0, 10));
      setMessage("Activiteit succesvol ingediend ✅");
      await loadAll();
    } catch (err: any) {
      setMessage(`Opslaan mislukt: ${err.message ?? "Onbekende fout"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(id: string, status: "goedgekeurd" | "afgekeurd") {
    if (!teacherMode || !profiel?.id) return;

    setMessage("");

    try {
      const { error } = await supabase
        .from("activiteit_registraties")
        .update({
          status,
          nagekeken_door: profiel.id,
        })
        .eq("id", id);

      if (error) throw error;

      setMessage(`Registratie ${status} ✅`);
      await loadAll();
    } catch (err: any) {
      setMessage(`Wijzigen mislukt: ${err.message ?? "Onbekende fout"}`);
    }
  }

  const goedgekeurdeRegistraties = useMemo(() => {
    return registraties.filter((r) => r.status === "goedgekeurd");
  }, [registraties]);

  const klasRanking = useMemo<KlasRanking[]>(() => {
    const map = new Map<string, number>();

    for (const r of goedgekeurdeRegistraties) {
      const klas = r.klas_naam?.trim() || "Onbekende klas";
      const km = Number(r.afstand_km ?? 0);
      map.set(klas, (map.get(klas) ?? 0) + km);
    }

    return Array.from(map.entries())
      .map(([klas_naam, totaal_km]) => ({
        klas_naam,
        totaal_km: Number(totaal_km.toFixed(2)),
      }))
      .sort((a, b) => b.totaal_km - a.totaal_km);
  }, [goedgekeurdeRegistraties]);

  const top10Leerlingen = useMemo<LeerlingRanking[]>(() => {
    const map = new Map<string, LeerlingRanking>();

    for (const r of goedgekeurdeRegistraties) {
      const leerlingId = r.leerling_id ?? "unknown";
      const leerlingNaam = r.leerling_naam?.trim() || "Onbekende leerling";
      const klasNaam = r.klas_naam?.trim() || "Onbekende klas";
      const km = Number(r.afstand_km ?? 0);

      const existing = map.get(leerlingId);
      if (existing) {
        existing.totaal_km += km;
      } else {
        map.set(leerlingId, {
          leerling_id: leerlingId,
          leerling_naam: leerlingNaam,
          klas_naam: klasNaam,
          totaal_km: km,
        });
      }
    }

    return Array.from(map.values())
      .map((x) => ({ ...x, totaal_km: Number(x.totaal_km.toFixed(2)) }))
      .sort((a, b) => b.totaal_km - a.totaal_km)
      .slice(0, 10);
  }, [goedgekeurdeRegistraties]);

  const mijnRegistraties = useMemo(() => {
    if (!profiel?.id) return [];
    return registraties.filter((r) => r.leerling_id === profiel.id);
  }, [registraties, profiel?.id]);

  const totaalKm = useMemo(() => {
    return Number(
      goedgekeurdeRegistraties
        .reduce((sum, r) => sum + Number(r.afstand_km ?? 0), 0)
        .toFixed(2)
    );
  }, [goedgekeurdeRegistraties]);

  const totaalDeelnames = useMemo(() => {
    return goedgekeurdeRegistraties.length;
  }, [goedgekeurdeRegistraties]);

  const mijnTotaalKm = useMemo(() => {
    return Number(
      mijnRegistraties
        .filter((r) => r.status === "goedgekeurd")
        .reduce((sum, r) => sum + Number(r.afstand_km ?? 0), 0)
        .toFixed(2)
    );
  }, [mijnRegistraties]);

  const userName = profiel?.volledige_naam ?? null;
  const challengeIsActive = !!uitdaging?.actief;

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center px-6">
        <div style={{ color: ui.text }}>Challenge laden…</div>
      </main>
    );
  }

  return (
    <AppShell
      title="LO App"
      subtitle="GO! Atheneum Avelgem"
      userName={userName}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <section style={hero.wrap}>
          <div style={hero.bgGlow1} />
          <div style={hero.bgGlow2} />

          <div style={hero.inner}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={hero.kicker}>RUN & WALK CHALLENGE</div>

              <h1 style={hero.title}>
                Beweeg voor jezelf.
                <br />
                <span style={hero.accent}>Scoor voor je klas.</span>
              </h1>

              <div style={hero.sub}>
                Registreer je loop- en wandelactiviteiten, bewijs ze met Strava
                en help jouw klas naar de top van het klassement.
              </div>

              <div style={hero.actions}>
                <a
                  href="https://www.strava.com/register"
                  target="_blank"
                  rel="noreferrer"
                  style={hero.primary}
                >
                  Registreer op Strava →
                </a>

                <a
                  href="https://www.strava.com/clubs/GO-Avelgem"
                  target="_blank"
                  rel="noreferrer"
                  style={hero.secondary}
                >
                  Word lid van club →
                </a>
              </div>

              <div style={hero.note}>
                Eerst een Strava-account maken, daarna lid worden van jullie club
                <b style={{ color: ui.text }}> GO!Avelgem beweegt</b>. Plak daarna
                de link van je Strava-activiteit als bewijs.
              </div>
            </div>
          </div>
        </section>

        {!!message && (
          <div
            style={{
              ...styles.message,
              background:
                message.includes("mislukt") || message.includes("Fout")
                  ? ui.errorBg
                  : message.includes("✅")
                  ? ui.successBg
                  : ui.warnBg,
              border:
                message.includes("mislukt") || message.includes("Fout")
                  ? `1px solid ${ui.errorBorder}`
                  : message.includes("✅")
                  ? `1px solid ${ui.successBorder}`
                  : `1px solid ${ui.warnBorder}`,
            }}
          >
            {message}
          </div>
        )}

        <div className="statsGrid">
          <StatCard label="Totale km" value={`${totaalKm}`} sub="Goedgekeurde afstand" />
          <StatCard label="Registraties" value={`${totaalDeelnames}`} sub="Goedgekeurde activiteiten" />
          <StatCard label="Mijn km" value={`${mijnTotaalKm}`} sub="Jouw goedgekeurde afstand" />
          <StatCard
            label="Status"
            value={challengeIsActive ? "Actief" : "Inactief"}
            sub={
              uitdaging
                ? `${formatDate(uitdaging.startdatum)} → ${formatDate(uitdaging.einddatum)}`
                : "Geen challenge"
            }
          />
        </div>

        <div className="mainGrid">
          <div style={{ display: "grid", gap: 14 }}>
            <GlassCard
              title="Activiteit registreren"
              subtitle="Voeg je wandeling of run toe met Strava-bewijs."
            >
              <div className="formGridTwo">
                <Field label="Type activiteit">
                  <select
                    value={activiteitType}
                    onChange={(e) => setActiviteitType(e.target.value as "run" | "walk")}
                    style={styles.input}
                  >
                    <option value="run">Run</option>
                    <option value="walk">Walk</option>
                  </select>
                </Field>

                <Field label="Afstand (km)">
                  <input
                    value={afstandKm}
                    onChange={(e) => setAfstandKm(e.target.value)}
                    style={styles.input}
                    inputMode="decimal"
                    placeholder="bv. 5.2"
                  />
                </Field>
              </div>

              <div className="formGridTwo">
                <Field label="Datum activiteit">
                  <input
                    type="date"
                    value={activiteitDatum}
                    onChange={(e) => setActiviteitDatum(e.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Jouw klas">
                  <div style={styles.readOnlyBox}>{profiel?.klas_naam ?? "Geen klas ingevuld"}</div>
                </Field>
              </div>

              <Field label="Strava-link">
                <input
                  value={stravaUrl}
                  onChange={(e) => setStravaUrl(e.target.value)}
                  style={styles.input}
                  placeholder="https://www.strava.com/activities/..."
                />
              </Field>

              <Field label="Opmerking (optioneel)">
                <textarea
                  value={opmerking}
                  onChange={(e) => setOpmerking(e.target.value)}
                  style={{ ...styles.input, minHeight: 110, resize: "vertical" }}
                  placeholder="Extra info voor de leerkracht"
                />
              </Field>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleRegistreren}
                  disabled={saving}
                  style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Opslaan…" : "Activiteit indienen"}
                </button>

                <a
                  href="https://www.strava.com/clubs/GO-Avelgem"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryBtn}
                >
                  Open clubpagina
                </a>
              </div>
            </GlassCard>

            <GlassCard
              title="Mijn registraties"
              subtitle="Jouw eigen inzendingen en hun status."
            >
              {mijnRegistraties.length === 0 ? (
                <EmptyState text="Je hebt nog geen activiteiten geregistreerd." />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {mijnRegistraties.map((item) => (
                    <div key={item.id} style={styles.rowCard}>
                      <div style={styles.rowTop}>
                        <div>
                          <div style={styles.rowTitle}>
                            {(item.activiteit_type ?? "activiteit").toUpperCase()} •{" "}
                            {item.afstand_km ?? 0} km
                          </div>
                          <div style={styles.rowMeta}>
                            {formatDate(item.activiteit_datum)} • {item.klas_naam ?? "—"}
                          </div>
                        </div>

                        <StatusBadge status={item.status ?? "ingediend"} />
                      </div>

                      <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {item.strava_url ? (
                          <a
                            href={item.strava_url}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.inlineLink}
                          >
                            Bekijk Strava →
                          </a>
                        ) : null}

                        {item.opmerking ? (
                          <div style={{ color: ui.muted2, fontSize: 13 }}>
                            Opmerking: {item.opmerking}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {teacherMode && (
              <GlassCard
                title="Leerkracht controle"
                subtitle="Bekijk en keur registraties goed of af."
                right={
                  <button
                    type="button"
                    onClick={loadAll}
                    disabled={refreshing}
                    style={{ ...styles.secondaryBtn, opacity: refreshing ? 0.7 : 1 }}
                  >
                    {refreshing ? "Vernieuwen…" : "Vernieuwen"}
                  </button>
                }
              >
                {registraties.length === 0 ? (
                  <EmptyState text="Nog geen registraties beschikbaar." />
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {registraties.map((item) => (
                      <div key={item.id} style={styles.rowCard}>
                        <div style={styles.rowTop}>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.rowTitle}>
                              {item.leerling_naam ?? "Onbekende leerling"}
                            </div>
                            <div style={styles.rowMeta}>
                              {item.klas_naam ?? "—"} • {(item.activiteit_type ?? "activiteit").toUpperCase()} •{" "}
                              {item.afstand_km ?? 0} km • {formatDate(item.activiteit_datum)}
                            </div>
                          </div>

                          <StatusBadge status={item.status ?? "ingediend"} />
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {item.strava_url ? (
                            <a
                              href={item.strava_url}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.inlineLink}
                            >
                              Open Strava →
                            </a>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(item.id, "goedgekeurd")}
                            style={styles.successBtn}
                          >
                            Goedkeuren
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(item.id, "afgekeurd")}
                            style={styles.rejectBtn}
                          >
                            Afkeuren
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <GlassCard
              title="Klassement per klas"
              subtitle="Som van alle goedgekeurde kilometers."
            >
              {klasRanking.length === 0 ? (
                <EmptyState text="Nog geen goedgekeurde kilometers." />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {klasRanking.map((item, index) => (
                    <RankingCard
                      key={item.klas_naam}
                      rank={index + 1}
                      title={item.klas_naam}
                      value={`${item.totaal_km} km`}
                      highlight={index === 0}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard
              title="Top 10 leerlingen"
              subtitle="De sterkste individuele prestaties."
            >
              {top10Leerlingen.length === 0 ? (
                <EmptyState text="Nog geen top 10 beschikbaar." />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {top10Leerlingen.map((item, index) => (
                    <RankingCard
                      key={`${item.leerling_id}-${index}`}
                      rank={index + 1}
                      title={item.leerling_naam}
                      value={`${item.totaal_km} km`}
                      subtitle={item.klas_naam}
                      highlight={index < 3}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard
              title="Challenge info"
              subtitle="Praktische afspraken voor leerlingen."
            >
              <div style={{ display: "grid", gap: 10, color: ui.muted }}>
                <InfoLine label="Challenge" value={uitdaging?.titel ?? "Run & Walk Challenge"} />
                <InfoLine label="Periode" value={`${formatDate(uitdaging?.startdatum)} → ${formatDate(uitdaging?.einddatum)}`} />
                <InfoLine label="Schooljaar" value={uitdaging?.schooljaar ?? schooljaar} />
                <InfoLine label="Bewijs" value="Strava-link per activiteit" />
              </div>

              <div style={styles.tipBox}>
                Enkel <b style={{ color: ui.text }}>goedgekeurde</b> activiteiten tellen mee
                in het klas- en leerlingenklassement.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  href="https://www.strava.com/register"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryBtn}
                >
                  Maak Strava-account
                </a>

                <a
                  href="https://www.strava.com/clubs/GO-Avelgem"
                  target="_blank"
                  rel="noreferrer"
                  style={styles.secondaryBtn}
                >
                  Naar GO!Avelgem club
                </a>
              </div>
            </GlassCard>

            <GlassCard
              title="Terug naar challenges"
              subtitle="Ga terug naar het challenge-overzicht."
            >
              <Link href="/challenges" style={styles.secondaryBtn}>
                Open challenges →
              </Link>
            </GlassCard>
          </div>
        </div>

        <style jsx>{`
          .statsGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .mainGrid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 14px;
            align-items: start;
          }

          .formGridTwo {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          @media (max-width: 960px) {
            .mainGrid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .statsGrid,
            .formGridTwo {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}

function GlassCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          {subtitle ? <div style={styles.cardSubtitle}>{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontWeight: 900, color: ui.text }}>{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const palette =
    normalized === "goedgekeurd"
      ? { bg: ui.successBg, border: ui.successBorder, text: "#86efac", label: "Goedgekeurd" }
      : normalized === "afgekeurd"
      ? { bg: ui.errorBg, border: ui.errorBorder, text: "#fda4af", label: "Afgekeurd" }
      : { bg: ui.warnBg, border: ui.warnBorder, text: "#fcd34d", label: "Ingediend" };

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 950,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        whiteSpace: "nowrap",
      }}
    >
      {palette.label}
    </div>
  );
}

function RankingCard({
  rank,
  title,
  value,
  subtitle,
  highlight = false,
}: {
  rank: number;
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.rankCard,
        background: highlight
          ? "linear-gradient(135deg, rgba(37,89,113,0.20), rgba(75,142,141,0.18), rgba(137,194,170,0.12))"
          : ui.panel2,
      }}
    >
      <div style={styles.rankLeft}>
        <div style={styles.rankBadge}>#{rank}</div>
        <div>
          <div style={styles.rankTitle}>{title}</div>
          {subtitle ? <div style={styles.rankSubtitle}>{subtitle}</div> : null}
        </div>
      </div>

      <div style={styles.rankValue}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={styles.emptyState}>
      {text}
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: ui.muted2 }}>{label}</span>
      <span style={{ color: ui.text, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const hero: Record<string, React.CSSProperties> = {
  wrap: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 26,
    border: `1px solid ${ui.border}`,
    background:
      "radial-gradient(900px 520px at 0% 0%, rgba(75,142,141,0.22) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 520px at 100% 0%, rgba(137,194,170,0.18) 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.06)",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    maxWidth: 760,
  },
  bgGlow1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    left: -120,
    top: -140,
    background: "rgba(75,142,141,0.20)",
    filter: "blur(24px)",
  },
  bgGlow2: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    right: -160,
    top: -170,
    background: "rgba(137,194,170,0.16)",
    filter: "blur(26px)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 1.2,
    color: ui.muted,
  },
  title: {
    margin: "8px 0 0 0",
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 980,
    color: ui.text,
  },
  accent: {
    background: `linear-gradient(90deg, ${brand.blue}, ${brand.teal}, ${brand.mint})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sub: {
    marginTop: 12,
    fontSize: 14,
    color: ui.muted,
    maxWidth: 620,
    lineHeight: 1.6,
  },
  actions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.55)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 14px",
    borderRadius: 16,
    textDecoration: "none",
    color: ui.text,
    fontWeight: 950,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
  note: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.32)",
    color: ui.muted,
    maxWidth: 680,
    lineHeight: 1.55,
  },
};

const styles: Record<string, React.CSSProperties> = {
  message: {
    padding: 12,
    borderRadius: 16,
  },
  card: {
    padding: 16,
    borderRadius: 22,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    fontWeight: 950,
    color: ui.text,
    fontSize: 16,
  },
  cardSubtitle: {
    marginTop: 4,
    color: ui.muted,
    fontSize: 13,
  },
  statCard: {
    padding: 14,
    borderRadius: 20,
    background: ui.panel,
    border: `1px solid ${ui.border}`,
  },
  statLabel: {
    color: ui.muted,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 8,
    color: ui.text,
    fontSize: 24,
    fontWeight: 980,
    lineHeight: 1,
  },
  statSub: {
    marginTop: 8,
    color: ui.muted2,
    fontSize: 12,
  },
  input: {
    padding: 11,
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.22)",
    color: ui.text,
    width: "100%",
  },
  readOnlyBox: {
    padding: 11,
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: "rgba(0,0,0,0.12)",
    color: ui.text,
    opacity: 0.95,
  },
  primaryBtn: {
    padding: "11px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border2}`,
    background: `linear-gradient(135deg, rgba(109,91,255,0.4), rgba(34,211,238,0.25))`,
    color: ui.text,
    fontWeight: 950,
    cursor: "pointer",
    width: "fit-content",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.30)",
    color: ui.text,
    fontWeight: 950,
    textDecoration: "none",
    cursor: "pointer",
    width: "fit-content",
  },
  successBtn: {
    padding: "9px 12px",
    borderRadius: 12,
    border: `1px solid ${ui.successBorder}`,
    background: ui.successBg,
    color: "#86efac",
    fontWeight: 900,
    cursor: "pointer",
  },
  rejectBtn: {
    padding: "9px 12px",
    borderRadius: 12,
    border: `1px solid ${ui.errorBorder}`,
    background: ui.errorBg,
    color: "#fda4af",
    fontWeight: 900,
    cursor: "pointer",
  },
  rowCard: {
    padding: 12,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: "rgba(255,255,255,0.04)",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rowTitle: {
    color: ui.text,
    fontWeight: 950,
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 4,
    color: ui.muted,
    fontSize: 12.5,
    lineHeight: 1.5,
  },
  inlineLink: {
    color: ui.text,
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
  },
  rankCard: {
    padding: 12,
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rankLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  rankBadge: {
    height: 38,
    minWidth: 38,
    padding: "0 10px",
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    color: ui.text,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.35)",
  },
  rankTitle: {
    color: ui.text,
    fontWeight: 950,
    fontSize: 14,
  },
  rankSubtitle: {
    marginTop: 3,
    color: ui.muted,
    fontSize: 12.5,
  },
  rankValue: {
    color: ui.text,
    fontWeight: 980,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  emptyState: {
    padding: 14,
    borderRadius: 16,
    border: `1px dashed ${ui.border2}`,
    color: ui.muted,
    background: "rgba(255,255,255,0.03)",
  },
  tipBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    background: ui.warnBg,
    border: `1px solid ${ui.warnBorder}`,
    color: ui.muted,
    lineHeight: 1.55,
  },
};