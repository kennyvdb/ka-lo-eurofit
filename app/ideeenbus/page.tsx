"use client";

import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Rol =
  | "leerling"
  | "leerkracht"
  | "lo_leerkracht"
  | "admin"
  | string;

type Profiel = {
  id: string;
  rol: Rol | null;
  volledige_naam: string | null;
};

type IdeeStatus =
  | "nieuw"
  | "in_behandeling"
  | "goedgekeurd"
  | "ingepland"
  | "uitgevoerd"
  | "afgewezen";

type Idee = {
  id: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;

  titel: string;
  omschrijving: string;
  categorie: string | null;

  status: IdeeStatus | string | null;
  is_public: boolean;
  teacher_note: string | null;

  deleted_at: string | null;
  deleted_by: string | null;
};

type Vote = {
  idee_id: string;
  user_id: string;
};

type StaffTab = "overzicht" | "behandelen" | "geschiedenis";

/* =========================================================
   CONSTANTS
========================================================= */

const CATEGORIES = [
  {
    value: "sport_spel",
    emoji: "🏀",
    label: "Sport of spel",
  },
  {
    value: "challenge",
    emoji: "🏆",
    label: "Challenge",
  },
  {
    value: "activiteit",
    emoji: "🎉",
    label: "Activiteit",
  },
  {
    value: "materiaal",
    emoji: "🧰",
    label: "Materiaal",
  },
  {
    value: "sportomgeving",
    emoji: "🏫",
    label: "Sportomgeving",
  },
  {
    value: "anders",
    emoji: "💡",
    label: "Iets anders",
  },
];

const STATUS_ORDER: IdeeStatus[] = [
  "nieuw",
  "in_behandeling",
  "goedgekeurd",
  "ingepland",
  "uitgevoerd",
  "afgewezen",
];

/* =========================================================
   HELPERS
========================================================= */

function isLoStaff(profiel: Profiel | null) {
  const rol = profiel?.rol?.toLowerCase()?.trim();

  return rol === "lo_leerkracht" || rol === "admin";
}

function isStudent(profiel: Profiel | null) {
  return profiel?.rol?.toLowerCase()?.trim() === "leerling";
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("nl-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function categoryInfo(category: string | null) {
  const value = category ?? "anders";

  const modern = CATEGORIES.find((item) => item.value === value);

  if (modern) {
    return modern;
  }

  // ondersteuning voor categorieën uit de oude Ideeënbus
  switch (value) {
    case "algemeen":
      return {
        value,
        emoji: "💡",
        label: "Algemeen",
      };

    case "spel":
      return {
        value,
        emoji: "🏀",
        label: "Sport of spel",
      };

    case "training":
      return {
        value,
        emoji: "🏃",
        label: "Training",
      };

    case "toernooi":
      return {
        value,
        emoji: "🏆",
        label: "Tornooi / event",
      };

    case "ruimte":
      return {
        value,
        emoji: "🏫",
        label: "Sportomgeving",
      };

    default:
      return {
        value,
        emoji: "💡",
        label: value,
      };
  }
}

function statusInfo(status: string | null) {
  switch (status) {
    case "nieuw":
      return {
        label: "Nieuw",
        emoji: "🔵",
        className:
          "border-blue-400/20 bg-blue-400/10 text-blue-100",
      };

    case "in_behandeling":
      return {
        label: "Wordt bekeken",
        emoji: "🟡",
        className:
          "border-amber-400/20 bg-amber-400/10 text-amber-100",
      };

    case "goedgekeurd":
      return {
        label: "Goedgekeurd",
        emoji: "🟢",
        className:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
      };

    case "ingepland":
      return {
        label: "Ingepland",
        emoji: "📅",
        className:
          "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
      };

    case "uitgevoerd":
      return {
        label: "Uitgevoerd",
        emoji: "✅",
        className:
          "border-[#89C2AA]/30 bg-[#89C2AA]/10 text-[#bde6d5]",
      };

    case "afgewezen":
      return {
        label: "Niet weerhouden",
        emoji: "🔴",
        className:
          "border-rose-400/20 bg-rose-400/10 text-rose-100",
      };

    default:
      return {
        label: "Onbekend",
        emoji: "⚪",
        className:
          "border-white/10 bg-white/5 text-white/70",
      };
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function IdeeenbusPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);

  const [ideeen, setIdeeen] = useState<Idee[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  const [authorNames, setAuthorNames] = useState<
    Record<string, string>
  >({});

  /* -------------------------
     FORM
  ------------------------- */

  const [titel, setTitel] = useState("");
  const [omschrijving, setOmschrijving] = useState("");
  const [categorie, setCategorie] = useState("sport_spel");
  const [submitting, setSubmitting] = useState(false);

  /* -------------------------
     STAFF
  ------------------------- */

  const [staffTab, setStaffTab] =
    useState<StaffTab>("overzicht");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [voteBusyId, setVoteBusyId] =
    useState<string | null>(null);

  const staff = useMemo(() => isLoStaff(profiel), [profiel]);
  const student = useMemo(() => isStudent(profiel), [profiel]);

  /* =========================================================
     DATA
  ========================================================= */

  const fetchProfiel = useCallback(
    async (userId: string): Promise<Profiel | null> => {
      const { data, error } = await supabase
        .from("profielen")
        .select("id, rol, volledige_naam")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data as Profiel | null) ?? null;
    },
    []
  );

  const fetchIdeeen = useCallback(async () => {
    const { data, error } = await supabase
      .from("ideeen")
      .select(`
        id,
        created_at,
        updated_at,
        user_id,
        titel,
        omschrijving,
        categorie,
        status,
        is_public,
        teacher_note,
        deleted_at,
        deleted_by
      `)
      .is("deleted_at", null)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data as Idee[]) ?? [];
  }, []);

  const fetchVotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("idee_votes")
      .select("idee_id, user_id");

    if (error) {
      throw new Error(error.message);
    }

    return (data as Vote[]) ?? [];
  }, []);

  const fetchAuthorNames = useCallback(
    async (rows: Idee[], canManage: boolean) => {
      if (!canManage || rows.length === 0) {
        setAuthorNames({});
        return;
      }

      const ids = Array.from(
        new Set(rows.map((idee) => idee.user_id))
      );

      if (ids.length === 0) {
        setAuthorNames({});
        return;
      }

      /*
       * Als je RLS op profielen enkel het eigen profiel laat lezen,
       * kan deze query leeg terugkomen.
       *
       * De Ideeënbus blijft dan gewoon werken en toont "Leerling".
       */
      const { data, error } = await supabase
        .from("profielen")
        .select("id, volledige_naam")
        .in("id", ids);

      if (error) {
        console.warn(
          "Kon namen van indieners niet ophalen:",
          error.message
        );
        setAuthorNames({});
        return;
      }

      const map: Record<string, string> = {};

      for (const row of data ?? []) {
        map[row.id] =
          row.volledige_naam?.trim() || "Leerling";
      }

      setAuthorNames(map);
    },
    []
  );

  const refreshAll = useCallback(
    async (
      userId: string,
      currentProfile?: Profiel | null,
      background = false
    ) => {
      if (background) {
        setRefreshing(true);
      }

      try {
        const profile =
          currentProfile ??
          (await fetchProfiel(userId));

        if (!currentProfile) {
          setProfiel(profile);
        }

        const [ideaRows, voteRows] = await Promise.all([
          fetchIdeeen(),
          fetchVotes(),
        ]);

        setIdeeen(ideaRows);
        setVotes(voteRows);

        await fetchAuthorNames(
          ideaRows,
          isLoStaff(profile)
        );
      } finally {
        if (background) {
          setRefreshing(false);
        }
      }
    },
    [
      fetchAuthorNames,
      fetchIdeeen,
      fetchProfiel,
      fetchVotes,
    ]
  );

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        const userId = data.session?.user?.id ?? null;

        if (!userId) {
          window.location.replace("/login");
          return;
        }

        setUid(userId);

        const profile = await fetchProfiel(userId);

        setProfiel(profile);

        await refreshAll(userId, profile);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ??
            "Er ging iets mis bij het laden van de Ideeënbus."
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [fetchProfiel, refreshAll]);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const publicIdeeen = useMemo(() => {
    return ideeen.filter(
      (idee) =>
        idee.is_public &&
        idee.status !== "afgewezen"
    );
  }, [ideeen]);

  const myIdeeen = useMemo(() => {
    if (!uid) return [];

    return ideeen.filter(
      (idee) => idee.user_id === uid
    );
  }, [ideeen, uid]);

  const pendingIdeeen = useMemo(() => {
    return ideeen.filter(
      (idee) =>
        idee.status === "nieuw" ||
        idee.status === "in_behandeling"
    );
  }, [ideeen]);

  const historyIdeeen = useMemo(() => {
    return ideeen.filter(
      (idee) =>
        idee.status === "goedgekeurd" ||
        idee.status === "ingepland" ||
        idee.status === "uitgevoerd" ||
        idee.status === "afgewezen"
    );
  }, [ideeen]);

  const voteCountMap = useMemo(() => {
    const map: Record<string, number> = {};

    for (const vote of votes) {
      map[vote.idee_id] =
        (map[vote.idee_id] ?? 0) + 1;
    }

    return map;
  }, [votes]);

  const myVotes = useMemo(() => {
    if (!uid) return new Set<string>();

    return new Set(
      votes
        .filter((vote) => vote.user_id === uid)
        .map((vote) => vote.idee_id)
    );
  }, [votes, uid]);

  const stats = useMemo(() => {
    return {
      totaal: ideeen.length,
      teBehandelen: pendingIdeeen.length,
      goedgekeurd: ideeen.filter(
        (idee) => idee.status === "goedgekeurd"
      ).length,
      ingepland: ideeen.filter(
        (idee) => idee.status === "ingepland"
      ).length,
      uitgevoerd: ideeen.filter(
        (idee) => idee.status === "uitgevoerd"
      ).length,
    };
  }, [ideeen, pendingIdeeen]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submitIdea = async () => {
    if (!uid) return;

    const cleanTitle = titel.trim();
    const cleanDescription = omschrijving.trim();

    if (!cleanTitle) {
      setError("Geef je idee eerst een titel.");
      return;
    }

    if (!cleanDescription) {
      setError(
        "Vertel kort wat je idee precies inhoudt."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("ideeen")
        .insert({
          user_id: uid,
          titel: cleanTitle,
          omschrijving: cleanDescription,
          categorie,
          status: "nieuw",
          is_public: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      setTitel("");
      setOmschrijving("");
      setCategorie("sport_spel");

      await refreshAll(uid, profiel, true);
    } catch (e: any) {
      console.error(e);

      setError(
        e?.message ??
          "Je idee kon niet worden verstuurd."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     VOTING
  ========================================================= */

  const toggleVote = async (ideeId: string) => {
    if (!uid || !student) return;

    setVoteBusyId(ideeId);
    setError(null);

    try {
      const hasVote = myVotes.has(ideeId);

      if (hasVote) {
        const { error } = await supabase
          .from("idee_votes")
          .delete()
          .eq("idee_id", ideeId)
          .eq("user_id", uid);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase
          .from("idee_votes")
          .insert({
            idee_id: ideeId,
            user_id: uid,
          });

        if (error) {
          throw new Error(error.message);
        }
      }

      const rows = await fetchVotes();
      setVotes(rows);
    } catch (e: any) {
      console.error(e);

      setError(
        e?.message ??
          "Je stem kon niet worden verwerkt."
      );
    } finally {
      setVoteBusyId(null);
    }
  };

  /* =========================================================
     STAFF ACTIONS
  ========================================================= */

  const updateIdea = async (
    ideeId: string,
    patch: Partial<
      Pick<
        Idee,
        | "status"
        | "is_public"
        | "teacher_note"
        | "deleted_at"
        | "deleted_by"
      >
    >
  ) => {
    if (!uid || !staff) return;

    setBusyId(ideeId);
    setError(null);

    try {
      const { error } = await supabase
        .from("ideeen")
        .update(patch)
        .eq("id", ideeId);

      if (error) {
        throw new Error(error.message);
      }

      await refreshAll(uid, profiel, true);
    } catch (e: any) {
      console.error(e);

      setError(
        e?.message ??
          "Het idee kon niet worden aangepast."
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteIdea = async (idee: Idee) => {
    if (!uid || !staff) return;

    const confirmed = window.confirm(
      `Wil je "${idee.titel}" verwijderen?\n\nHet idee verdwijnt uit de Ideeënbus, maar blijft technisch herstelbaar in de database.`
    );

    if (!confirmed) return;

    await updateIdea(idee.id, {
      deleted_at: new Date().toISOString(),
      deleted_by: uid,
      is_public: false,
    });
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="text-sm font-bold text-white/80">
          Ideeënbus laden…
        </div>
      </main>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell
      title="Ideeënbus"
      subtitle="Jouw ideeën voor sport op school"
      userName={profiel?.volledige_naam ?? undefined}
    >
      <div className="mx-auto w-full max-w-6xl pb-12">
        {/* ===================================================
            HERO
        =================================================== */}

        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#255971]/45 via-[#4B8E8D]/20 to-[#89C2AA]/15 p-5 shadow-2xl shadow-black/10 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#89C2AA]/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#89C2AA]">
              <span>💡</span>
              <span>Jouw stem telt</span>
            </div>

            <h1 className="max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl">
              Heb jij een goed idee voor LO?
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-[15px]">
              Een nieuwe sport, een leuke challenge,
              ander materiaal of een activiteit op
              school? Deel je idee met de leerkrachten
              LO.
            </p>

            <div className="mt-5 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              <span className="mt-0.5">🔒</span>

              <p className="text-xs leading-5 text-white/65">
                Je idee is eerst alleen zichtbaar voor
                jou en de leerkrachten LO. Na
                goedkeuring kan het gedeeld worden met
                andere leerlingen.
              </p>
            </div>

            {staff && (
              <div className="mt-5 flex flex-wrap gap-2">
                <MiniStat
                  value={stats.totaal}
                  label="ideeën"
                />

                <MiniStat
                  value={stats.teBehandelen}
                  label="te behandelen"
                  highlight={
                    stats.teBehandelen > 0
                  }
                />

                <MiniStat
                  value={stats.ingepland}
                  label="ingepland"
                />

                <MiniStat
                  value={stats.uitgevoerd}
                  label="uitgevoerd"
                />
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            <div>
              <strong>Oeps.</strong> {error}
            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 font-black text-white/60 transition hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            NEW IDEA FORM
        =================================================== */}

        <section className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#89C2AA]/20 bg-[#89C2AA]/10 text-xl">
              ✨
            </div>

            <div>
              <h2 className="text-lg font-black text-white">
                Deel jouw idee
              </h2>

              <p className="mt-1 text-sm leading-5 text-white/60">
                Vertel ons wat volgens jou nog leuker
                of beter kan.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs font-black uppercase tracking-[0.12em] text-white/55">
              Waarover gaat je idee?
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((item) => {
                const active =
                  categorie === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setCategorie(item.value)
                    }
                    className={[
                      "flex min-h-[58px] items-center gap-3 rounded-2xl border px-3 text-left transition",
                      active
                        ? "border-[#89C2AA]/50 bg-[#89C2AA]/15 text-white shadow-lg shadow-[#89C2AA]/5"
                        : "border-white/10 bg-black/10 text-white/70 hover:border-white/20 hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <span className="text-xl">
                      {item.emoji}
                    </span>

                    <span className="text-xs font-black sm:text-sm">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label
                htmlFor="idee-titel"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-white/55"
              >
                Titel
              </label>

              <input
                id="idee-titel"
                value={titel}
                onChange={(e) =>
                  setTitel(e.target.value)
                }
                maxLength={100}
                placeholder="Bijvoorbeeld: pingpongtornooi tijdens de middag"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#89C2AA]/50 focus:bg-black/25"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="idee-omschrijving"
                  className="text-xs font-black uppercase tracking-[0.12em] text-white/55"
                >
                  Vertel iets meer
                </label>

                <span className="text-[11px] text-white/35">
                  {omschrijving.length}/800
                </span>
              </div>

              <textarea
                id="idee-omschrijving"
                value={omschrijving}
                onChange={(e) =>
                  setOmschrijving(e.target.value)
                }
                maxLength={800}
                rows={5}
                placeholder="Wat is je idee en waarom zou dit leuk of nuttig zijn?"
                className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#89C2AA]/50 focus:bg-black/25"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-white/40">
                De leerkrachten LO bekijken je voorstel.
                Je kunt de status nadien volgen bij
                &quot;Mijn ideeën&quot;.
              </p>

              <button
                type="button"
                onClick={submitIdea}
                disabled={submitting}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[#89C2AA] px-5 text-sm font-black text-[#15333e] shadow-lg shadow-black/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Versturen…"
                  : "💡 Idee versturen"}
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            STAFF AREA
        =================================================== */}

        {staff ? (
          <section className="mt-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-[#89C2AA]">
                  Beheer
                </div>

                <h2 className="mt-1 text-xl font-black text-white">
                  Ideeën beheren
                </h2>
              </div>

              {refreshing && (
                <div className="text-xs font-bold text-white/40">
                  Bijwerken…
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/15 p-1.5">
              <StaffTabButton
                active={staffTab === "overzicht"}
                onClick={() =>
                  setStaffTab("overzicht")
                }
              >
                Overzicht
              </StaffTabButton>

              <StaffTabButton
                active={staffTab === "behandelen"}
                onClick={() =>
                  setStaffTab("behandelen")
                }
                count={stats.teBehandelen}
              >
                Te behandelen
              </StaffTabButton>

              <StaffTabButton
                active={staffTab === "geschiedenis"}
                onClick={() =>
                  setStaffTab("geschiedenis")
                }
              >
                Geschiedenis
              </StaffTabButton>
            </div>

            {staffTab === "overzicht" && (
              <StaffOverview
                stats={stats}
                publicIdeeen={publicIdeeen}
                voteCountMap={voteCountMap}
              />
            )}

            {staffTab === "behandelen" && (
              <div className="mt-5 grid gap-3">
                {pendingIdeeen.length === 0 ? (
                  <EmptyState
                    emoji="🎉"
                    title="Alles is behandeld"
                    text="Er staan momenteel geen nieuwe ideeën te wachten."
                  />
                ) : (
                  pendingIdeeen.map((idee) => (
                    <StaffIdeaCard
                      key={idee.id}
                      idee={idee}
                      authorName={
                        authorNames[
                          idee.user_id
                        ] ?? "Leerling"
                      }
                      votes={
                        voteCountMap[idee.id] ?? 0
                      }
                      busy={
                        busyId === idee.id
                      }
                      onUpdate={(patch) =>
                        updateIdea(
                          idee.id,
                          patch
                        )
                      }
                      onDelete={() =>
                        deleteIdea(idee)
                      }
                    />
                  ))
                )}
              </div>
            )}

            {staffTab === "geschiedenis" && (
              <div className="mt-5 grid gap-3">
                {historyIdeeen.length === 0 ? (
                  <EmptyState
                    emoji="📚"
                    title="Nog geen geschiedenis"
                    text="Behandelde ideeën verschijnen hier."
                  />
                ) : (
                  historyIdeeen.map((idee) => (
                    <StaffIdeaCard
                      key={idee.id}
                      idee={idee}
                      authorName={
                        authorNames[
                          idee.user_id
                        ] ?? "Leerling"
                      }
                      votes={
                        voteCountMap[idee.id] ?? 0
                      }
                      busy={
                        busyId === idee.id
                      }
                      onUpdate={(patch) =>
                        updateIdea(
                          idee.id,
                          patch
                        )
                      }
                      onDelete={() =>
                        deleteIdea(idee)
                      }
                    />
                  ))
                )}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* =================================================
                MY IDEAS
            ================================================= */}

            <section className="mt-7">
              <SectionHeading
                eyebrow="Opvolging"
                title="Mijn ideeën"
                subtitle="Volg hier wat er met jouw voorstellen gebeurt."
              />

              <div className="mt-4 grid gap-3">
                {myIdeeen.length === 0 ? (
                  <EmptyState
                    emoji="💭"
                    title="Nog geen ideeën"
                    text="Je hebt nog geen idee ingestuurd."
                  />
                ) : (
                  myIdeeen.map((idee) => (
                    <StudentOwnIdeaCard
                      key={idee.id}
                      idee={idee}
                      votes={
                        voteCountMap[idee.id] ?? 0
                      }
                    />
                  ))
                )}
              </div>
            </section>

            {/* =================================================
                PUBLIC IDEAS
            ================================================= */}

            <section className="mt-8">
              <SectionHeading
                eyebrow="Samen maken we LO beter"
                title="Ideeën van leerlingen"
                subtitle="Bekijk goedgekeurde voorstellen en laat weten welke ideeën jij ook leuk vindt."
              />

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {publicIdeeen.length === 0 ? (
                  <div className="md:col-span-2">
                    <EmptyState
                      emoji="🌱"
                      title="Nog geen publieke ideeën"
                      text="Zodra een voorstel is goedgekeurd, verschijnt het hier."
                    />
                  </div>
                ) : (
                  publicIdeeen.map((idee) => (
                    <PublicIdeaCard
                      key={idee.id}
                      idee={idee}
                      votes={
                        voteCountMap[idee.id] ?? 0
                      }
                      hasVote={myVotes.has(
                        idee.id
                      )}
                      canVote={student}
                      busy={
                        voteBusyId === idee.id
                      }
                      onVote={() =>
                        toggleVote(idee.id)
                      }
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.16em] text-[#89C2AA]">
        {eyebrow}
      </div>

      <h2 className="mt-1 text-xl font-black text-white">
        {title}
      </h2>

      <p className="mt-1 max-w-2xl text-sm leading-5 text-white/55">
        {subtitle}
      </p>
    </div>
  );
}

function MiniStat({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-3 py-2",
        highlight
          ? "border-amber-400/25 bg-amber-400/10"
          : "border-white/10 bg-black/15",
      ].join(" ")}
    >
      <div className="text-sm font-black text-white">
        {value}
      </div>

      <div className="text-[11px] font-bold text-white/45">
        {label}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const info = statusInfo(status);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black",
        info.className,
      ].join(" ")}
    >
      <span>{info.emoji}</span>
      {info.label}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category: string | null;
}) {
  const info = categoryInfo(category);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-white/60">
      <span>{info.emoji}</span>
      {info.label}
    </span>
  );
}

function EmptyState({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
      <div className="text-3xl">{emoji}</div>

      <div className="mt-3 text-sm font-black text-white">
        {title}
      </div>

      <div className="mx-auto mt-1 max-w-md text-xs leading-5 text-white/45">
        {text}
      </div>
    </div>
  );
}

/* =========================================================
   STUDENT CARDS
========================================================= */

function StudentOwnIdeaCard({
  idee,
  votes,
}: {
  idee: Idee;
  votes: number;
}) {
  const status = statusInfo(idee.status);

  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge
              category={idee.categorie}
            />

            {idee.is_public && (
              <span className="rounded-full border border-[#89C2AA]/20 bg-[#89C2AA]/10 px-2.5 py-1 text-[11px] font-black text-[#bde6d5]">
                Publiek
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-black text-white">
            {idee.titel}
          </h3>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">
            {idee.omschrijving}
          </p>
        </div>

        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={idee.status} />

          <span className="text-[11px] text-white/35">
            {formatDate(idee.created_at)}
          </span>
        </div>
      </div>

      {idee.teacher_note && (
        <div className="mt-4 rounded-2xl border border-[#89C2AA]/20 bg-[#89C2AA]/10 p-3">
          <div className="text-[11px] font-black uppercase tracking-[0.1em] text-[#bde6d5]">
            Bericht van de leerkracht
          </div>

          <p className="mt-1.5 text-sm leading-5 text-white/75">
            {idee.teacher_note}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
        <span className="text-xs text-white/40">
          {status.emoji} {status.label}
        </span>

        {idee.is_public && (
          <span className="text-xs font-bold text-white/45">
            👍 {votes}{" "}
            {votes === 1
              ? "leerling"
              : "leerlingen"}
          </span>
        )}
      </div>
    </article>
  );
}

function PublicIdeaCard({
  idee,
  votes,
  hasVote,
  canVote,
  busy,
  onVote,
}: {
  idee: Idee;
  votes: number;
  hasVote: boolean;
  canVote: boolean;
  busy: boolean;
  onVote: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-[24px] border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/15 hover:bg-white/[0.065] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CategoryBadge
          category={idee.categorie}
        />

        <StatusBadge status={idee.status} />
      </div>

      <h3 className="mt-4 text-base font-black text-white">
        {idee.titel}
      </h3>

      <p className="mt-2 flex-1 whitespace-pre-wrap text-sm leading-6 text-white/60">
        {idee.omschrijving}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <span className="text-[11px] text-white/35">
          {formatDate(idee.created_at)}
        </span>

        {canVote ? (
          <button
            type="button"
            disabled={busy}
            onClick={onVote}
            className={[
              "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition disabled:opacity-50",
              hasVote
                ? "border-[#89C2AA]/40 bg-[#89C2AA]/15 text-[#bde6d5]"
                : "border-white/10 bg-black/15 text-white/65 hover:border-[#89C2AA]/30 hover:text-white",
            ].join(" ")}
          >
            <span>👍</span>

            <span>
              {hasVote
                ? "Dit wil ik ook"
                : "Dit wil ik ook"}
            </span>

            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">
              {votes}
            </span>
          </button>
        ) : (
          <span className="text-xs font-bold text-white/45">
            👍 {votes}
          </span>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   STAFF COMPONENTS
========================================================= */

function StaffTabButton({
  children,
  active,
  count,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative min-h-11 rounded-xl px-2 text-xs font-black transition sm:text-sm",
        active
          ? "bg-white/10 text-white shadow-lg shadow-black/10"
          : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
      ].join(" ")}
    >
      {children}

      {!!count && count > 0 && (
        <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
          {count}
        </span>
      )}
    </button>
  );
}

function StaffOverview({
  stats,
  publicIdeeen,
  voteCountMap,
}: {
  stats: {
    totaal: number;
    teBehandelen: number;
    goedgekeurd: number;
    ingepland: number;
    uitgevoerd: number;
  };
  publicIdeeen: Idee[];
  voteCountMap: Record<string, number>;
}) {
  const popular = [...publicIdeeen]
    .sort(
      (a, b) =>
        (voteCountMap[b.id] ?? 0) -
        (voteCountMap[a.id] ?? 0)
    )
    .slice(0, 5);

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <OverviewStat
          emoji="💡"
          value={stats.totaal}
          label="Totaal"
        />

        <OverviewStat
          emoji="🟡"
          value={stats.teBehandelen}
          label="Te behandelen"
        />

        <OverviewStat
          emoji="🟢"
          value={stats.goedgekeurd}
          label="Goedgekeurd"
        />

        <OverviewStat
          emoji="📅"
          value={stats.ingepland}
          label="Ingepland"
        />

        <OverviewStat
          emoji="✅"
          value={stats.uitgevoerd}
          label="Uitgevoerd"
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="text-xs font-black uppercase tracking-[0.12em] text-white/45">
          Populaire ideeën
        </div>

        <h3 className="mt-1 text-base font-black text-white">
          Meeste stemmen
        </h3>

        {popular.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">
            Er zijn nog geen publieke ideeën met
            stemmen.
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {popular.map((idee, index) => (
              <div
                key={idee.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/10 p-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xs font-black text-white/60">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-white">
                    {idee.titel}
                  </div>

                  <div className="mt-0.5 text-xs text-white/40">
                    {
                      categoryInfo(
                        idee.categorie
                      ).label
                    }
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-[#89C2AA]/20 bg-[#89C2AA]/10 px-3 py-2 text-xs font-black text-[#bde6d5]">
                  👍 {voteCountMap[idee.id] ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewStat({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
      <div className="text-xl">{emoji}</div>

      <div className="mt-3 text-2xl font-black text-white">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold text-white/40">
        {label}
      </div>
    </div>
  );
}

function StaffIdeaCard({
  idee,
  authorName,
  votes,
  busy,
  onUpdate,
  onDelete,
}: {
  idee: Idee;
  authorName: string;
  votes: number;
  busy: boolean;
  onUpdate: (
    patch: Partial<
      Pick<
        Idee,
        "status" | "is_public" | "teacher_note"
      >
    >
  ) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [note, setNote] = useState(
    idee.teacher_note ?? ""
  );

  useEffect(() => {
    setNote(idee.teacher_note ?? "");
  }, [idee.teacher_note]);

  const saveNote = () => {
    void onUpdate({
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : null,
    });
  };

  const markInProgress = () => {
    void onUpdate({
      status: "in_behandeling",
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : idee.teacher_note,
    });
  };

  const approve = () => {
    void onUpdate({
      status: "goedgekeurd",
      is_public: true,
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : idee.teacher_note,
    });
  };

  const reject = () => {
    void onUpdate({
      status: "afgewezen",
      is_public: false,
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : idee.teacher_note,
    });
  };

  const schedule = () => {
    void onUpdate({
      status: "ingepland",
      is_public: true,
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : idee.teacher_note,
    });
  };

  const complete = () => {
    void onUpdate({
      status: "uitgevoerd",
      is_public: true,
      teacher_note:
        note.trim().length > 0
          ? note.trim()
          : idee.teacher_note,
    });
  };

  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={idee.status} />

            <CategoryBadge
              category={idee.categorie}
            />

            {idee.is_public && (
              <span className="rounded-full border border-[#89C2AA]/20 bg-[#89C2AA]/10 px-2.5 py-1 text-[11px] font-black text-[#bde6d5]">
                Publiek
              </span>
            )}
          </div>

          <h3 className="mt-3 text-base font-black text-white">
            {idee.titel}
          </h3>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">
            {idee.omschrijving}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
            <span>
              👤{" "}
              <strong className="font-bold text-white/55">
                {authorName}
              </strong>
            </span>

            <span>
              🕒 {formatDate(idee.created_at)}
            </span>

            {idee.is_public && (
              <span>👍 {votes}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3 text-xs font-black text-rose-200 transition hover:bg-rose-400/15 disabled:opacity-50"
        >
          🗑 Verwijderen
        </button>
      </div>

      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <label className="text-[11px] font-black uppercase tracking-[0.1em] text-white/45">
          Bericht voor de leerling
        </label>

        <textarea
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
          rows={3}
          placeholder="Bijvoorbeeld: Goed idee! We bekijken wanneer we dit kunnen organiseren."
          className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-white/25 focus:border-[#89C2AA]/40"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              busy ||
              note.trim() ===
                (idee.teacher_note ?? "").trim()
            }
            onClick={saveNote}
            className="min-h-10 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-black text-white/65 transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Notitie opslaan
          </button>

          {idee.status === "nieuw" && (
            <button
              type="button"
              disabled={busy}
              onClick={markInProgress}
              className="min-h-10 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 text-xs font-black text-amber-100 transition hover:bg-amber-400/15 disabled:opacity-50"
            >
              🟡 In behandeling
            </button>
          )}

          {(idee.status === "nieuw" ||
            idee.status ===
              "in_behandeling") && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={approve}
                className="min-h-10 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-black text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-50"
              >
                ✓ Goedkeuren
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={reject}
                className="min-h-10 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 text-xs font-black text-rose-100 transition hover:bg-rose-400/15 disabled:opacity-50"
              >
                Niet weerhouden
              </button>
            </>
          )}

          {idee.status === "goedgekeurd" && (
            <button
              type="button"
              disabled={busy}
              onClick={schedule}
              className="min-h-10 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:opacity-50"
            >
              📅 Inplannen
            </button>
          )}

          {idee.status === "ingepland" && (
            <button
              type="button"
              disabled={busy}
              onClick={complete}
              className="min-h-10 rounded-xl border border-[#89C2AA]/25 bg-[#89C2AA]/10 px-3 text-xs font-black text-[#bde6d5] transition hover:bg-[#89C2AA]/15 disabled:opacity-50"
            >
              ✅ Markeer uitgevoerd
            </button>
          )}

          {busy && (
            <span className="inline-flex min-h-10 items-center px-2 text-xs font-bold text-white/40">
              Opslaan…
            </span>
          )}
        </div>
      </div>
    </article>
  );
}