// app/(auth)/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeEmail } from "@/lib/auth/roles";
import { getKlasMeta } from "@/shared/klassen/klassen";

const supabase = createClient();

type SmartschoolRaw = {
  sex?: string | null;
  role?: string | null;
  birthDate?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  username?: string | null;
  sourcedId?: string | null;
  metadata?: {
    "smsc.classInfo"?: string | null;
    "smsc.classYear"?: string | null;
    "smsc.classLevel"?: string | null;
    "smsc.internalNumber"?: string | null;
  };
};

type ClassStudent = {
  class_name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  email?: string | null;
  username?: string | null;
  role?: string | null;
  primary_class?: boolean | null;
};

type TeacherLoginEmail = {
  school_email: string;
  smartschool_username: string;
};

type SmartschoolUser = {
  sourced_id?: string | null;
  sourcedId?: string | null;
  username?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  birth_date?: string | null;
  raw?: SmartschoolRaw | null;
};

function currentSchoolYear() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function startsWithNumber(value: string | null | undefined) {
  return /^[1-6]/.test(String(value ?? "").trim());
}

function cleanClassName(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function mapSex(value: string | null | undefined): "M" | "V" | null {
  const sex = String(value ?? "").trim().toLowerCase();
  if (sex === "male") return "M";
  if (sex === "female") return "V";
  return null;
}

function getLoGroep(classRows: ClassStudent[] | null | undefined) {
  const match = classRows?.find((row) => {
    const name = cleanClassName(row.class_name).toUpperCase();
    return name === "LOJON" || name === "LOMEI";
  });

  return match ? cleanClassName(match.class_name).toUpperCase() : null;
}

function fullName(user: SmartschoolUser | null, student: ClassStudent | null) {
  const smartFull = String(user?.full_name ?? "").trim();
  if (smartFull) return smartFull;

  const first =
    user?.given_name ?? user?.raw?.givenName ?? student?.given_name ?? "";

  const last =
    user?.family_name ?? user?.raw?.familyName ?? student?.family_name ?? "";

  return [first, last].filter(Boolean).join(" ").trim();
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function keepExisting<T>(existingValue: T | null | undefined, newValue: T | null | undefined) {
  return hasValue(existingValue) ? existingValue : newValue ?? null;
}

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishLogin = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (!code) {
          throw new Error("Geen login-code gevonden.");
        }

        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw new Error(exchangeError.message);
        }

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message);
        }

        if (!authUser) {
          throw new Error("Geen gebruiker gevonden.");
        }

        const email = normalizeEmail(authUser.email);

        if (!email) {
          throw new Error("Geen e-mailadres gevonden.");
        }

        const { data: existingProfile, error: existingProfileError } =
          await supabase
            .from("profielen")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

        if (existingProfileError) {
          throw new Error(existingProfileError.message);
        }

        const { data: classRows, error: classError } = await supabase
          .from("class_students")
          .select("*")
          .eq("email", email);

        if (classError) {
          throw new Error(classError.message);
        }

        const selectedClass: ClassStudent | null =
          classRows?.find(
            (row) =>
              row.primary_class === true &&
              startsWithNumber(row.class_name) &&
              !!getKlasMeta(cleanClassName(row.class_name))
          ) ??
          classRows?.find(
            (row) =>
              startsWithNumber(row.class_name) &&
              !!getKlasMeta(cleanClassName(row.class_name))
          ) ??
          classRows?.find((row) => startsWithNumber(row.class_name)) ??
          null;

        const klasNaam = selectedClass?.class_name
          ? cleanClassName(selectedClass.class_name)
          : null;

        const loGroep = getLoGroep(classRows);
        const klasMeta = klasNaam ? getKlasMeta(klasNaam) : undefined;

        let smartschoolUser: SmartschoolUser | null = null;

        const { data: userByEmail, error: userByEmailError } = await supabase
          .from("smartschool_users")
          .select("*")
          .eq("email", email)
          .limit(1);

        if (userByEmailError) {
          throw new Error(userByEmailError.message);
        }

        smartschoolUser = userByEmail?.[0] ?? null;

        if (!smartschoolUser && selectedClass?.username) {
          const { data: userByUsername, error: userByUsernameError } =
            await supabase
              .from("smartschool_users")
              .select("*")
              .eq("username", selectedClass.username)
              .limit(1);

          if (userByUsernameError) {
            throw new Error(userByUsernameError.message);
          }

          smartschoolUser = userByUsername?.[0] ?? null;
        }

        if (!smartschoolUser) {
          const { data: teacherLinks, error: teacherLinkError } = await supabase
            .from("teacher_login_emails")
            .select("school_email, smartschool_username")
            .eq("school_email", email)
            .limit(1);

          if (teacherLinkError) {
            throw new Error(teacherLinkError.message);
          }

          const teacherLink = (teacherLinks?.[0] ?? null) as
            | TeacherLoginEmail
            | null;

          if (teacherLink?.smartschool_username) {
            const { data: teacherUsers, error: teacherUserError } =
              await supabase
                .from("smartschool_users")
                .select("*")
                .eq("username", teacherLink.smartschool_username)
                .limit(1);

            if (teacherUserError) {
              throw new Error(teacherUserError.message);
            }

            smartschoolUser = teacherUsers?.[0] ?? null;
          }
        }

        if (!smartschoolUser && !selectedClass) {
          await supabase.auth.signOut({ scope: "local" });
          throw new Error("Je account staat niet in Smartschool.");
        }

        const rawRole = String(
          smartschoolUser?.role ??
            smartschoolUser?.raw?.role ??
            selectedClass?.role ??
            "student"
        )
          .trim()
          .toLowerCase();

        const isStudent = rawRole === "student" || rawRole === "leerling";
        const defaultRole = isStudent ? "student" : "teacher";
        const defaultRol = isStudent ? "leerling" : "leerkracht";

        const smartschoolName =
          fullName(smartschoolUser, selectedClass) ||
          String(authUser.user_metadata?.full_name ?? "").trim() ||
          email;

        const smartschoolGeslacht = mapSex(smartschoolUser?.raw?.sex);

        const smartschoolGeboortedatum =
          smartschoolUser?.birth_date ??
          smartschoolUser?.raw?.birthDate ??
          null;

        const profielPayload = {
          id: authUser.id,
          email,

          volledige_naam: keepExisting(
            existingProfile?.volledige_naam,
            smartschoolName
          ),

          // Belangrijk:
          // Bestaande rollen mogen nooit overschreven worden bij login.
          // Rollen worden later enkel via admin/beheer aangepast.
          role: keepExisting(existingProfile?.role, defaultRole),
          rol: keepExisting(existingProfile?.rol, defaultRol),
          rol_bevestigd: existingProfile?.rol_bevestigd ?? true,

          username: keepExisting(
            existingProfile?.username,
            smartschoolUser?.username ??
              smartschoolUser?.raw?.username ??
              selectedClass?.username ??
              null
          ),

          smartschool_sourced_id: keepExisting(
            existingProfile?.smartschool_sourced_id,
            smartschoolUser?.sourced_id ??
              smartschoolUser?.sourcedId ??
              smartschoolUser?.raw?.sourcedId ??
              null
          ),

          given_name: keepExisting(
            existingProfile?.given_name,
            smartschoolUser?.given_name ??
              smartschoolUser?.raw?.givenName ??
              selectedClass?.given_name ??
              null
          ),

          family_name: keepExisting(
            existingProfile?.family_name,
            smartschoolUser?.family_name ??
              smartschoolUser?.raw?.familyName ??
              selectedClass?.family_name ??
              null
          ),

          full_name: keepExisting(
            existingProfile?.full_name,
            fullName(smartschoolUser, selectedClass)
          ),

          // Belangrijk:
          // Bestaande persoonlijke profielvelden niet leegmaken bij Google-login.
          geslacht: keepExisting(existingProfile?.geslacht, smartschoolGeslacht),

          geboortedatum: keepExisting(
            existingProfile?.geboortedatum,
            smartschoolGeboortedatum
          ),

          birth_date: keepExisting(
            existingProfile?.birth_date,
            smartschoolGeboortedatum
          ),

          klas_naam: keepExisting(
            existingProfile?.klas_naam,
            isStudent ? klasNaam : null
          ),

          lo_groep: keepExisting(
            existingProfile?.lo_groep,
            isStudent ? loGroep : null
          ),

          class_info: keepExisting(
            existingProfile?.class_info,
            smartschoolUser?.raw?.metadata?.["smsc.classInfo"] ?? klasNaam
          ),

          class_year: keepExisting(
            existingProfile?.class_year,
            smartschoolUser?.raw?.metadata?.["smsc.classYear"] ?? null
          ),

          class_level: keepExisting(
            existingProfile?.class_level,
            smartschoolUser?.raw?.metadata?.["smsc.classLevel"] ?? null
          ),

          internal_number: keepExisting(
            existingProfile?.internal_number,
            smartschoolUser?.raw?.metadata?.["smsc.internalNumber"] ?? null
          ),

          graad: keepExisting(
            existingProfile?.graad,
            isStudent ? klasMeta?.graad ?? null : null
          ),

          leerjaar: keepExisting(
            existingProfile?.leerjaar,
            isStudent ? klasMeta?.leerjaar ?? null : null
          ),

          finaliteit: keepExisting(
            existingProfile?.finaliteit,
            isStudent ? klasMeta?.finaliteit ?? null : null
          ),

          schooljaar: keepExisting(existingProfile?.schooljaar, currentSchoolYear()),

          schooljaar_bevestigd_op: keepExisting(
            existingProfile?.schooljaar_bevestigd_op,
            new Date().toISOString().slice(0, 10)
          ),

          updated_at: new Date().toISOString(),
        };

        const { error: profielError } = await supabase
          .from("profielen")
          .upsert(profielPayload, { onConflict: "id" });

        if (profielError) {
          throw new Error(profielError.message);
        }

        if (!cancelled) {
          // Wacht kort tot Supabase de sessie volledig heeft opgeslagen.
          // Dit voorkomt een redirect-loop tussen /login en /dashboard.
          await supabase.auth.getSession();

          window.setTimeout(() => {
            window.location.href = "/dashboard";
          }, 300);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Er ging iets mis bij het inloggen."
          );
        }
      }
    };

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center px-6 bg-neutral-950">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        {!error ? "Smartschool-profiel wordt geladen…" : error}
      </div>
    </main>
  );
}
