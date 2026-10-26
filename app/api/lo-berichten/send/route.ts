import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  allowedRoles,
  teacherRoles,
  validInternalLink,
  type Audience,
} from "@/lib/lo-messaging";

export const runtime = "nodejs";

// De speciale doelgroep wordt in deze API verwerkt, zonder het bestaande
// Audience-type of de databasefunctie te wijzigen.
type VerzendDoelgroep = Audience | "sneeuwstage_2026";
const audiences: VerzendDoelgroep[] = [
  "alle_leerlingen",
  "alle_leerkrachten",
  "iedereen",
  "lo_team",
  "klasgroepen",
  "klassen",
  "personen",
  "sneeuwstage_2026",
];

const SNEEUWSTAGE_2026_ID = "84654025-e4f5-4fd9-aea3-a3d7dd35787f";
const EXTRA_ONTVANGERS = [
  "fe806ca7-3d8b-4d71-9842-cd7b0744ad1f", // Glenn Labie
  "db4ff4a1-9770-474d-ae09-aa53d8ec3a83", // Joni Vandewalle
] as const;
const VERWACHT_AANTAL_DEELNEMERS = 51;

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get("content-length") || 0) > 20000) {
      return NextResponse.json({ error: "Aanvraag te groot" }, { status: 413 });
    }

    const jar = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !secret) {
      return NextResponse.json({ error: "Serverconfiguratie ontbreekt" }, { status: 500 });
    }

    const client = createServerClient(url, anon, {
      cookies: { getAll: () => jar.getAll(), setAll: () => {} },
    });
    const authorization = req.headers.get("authorization") ?? "";
    const token = /^Bearer ([^\s]+)$/.exec(authorization)?.[1];
    const {
      data: { user },
      error: authError,
    } = token ? await client.auth.getUser(token) : await client.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
    }

    const admin = createAdmin(url, secret, {
      auth: { persistSession: false },
    });
    const { data: sender, error: senderError } = await admin
      .from("profielen")
      .select("rol")
      .eq("id", user.id)
      .single();
    if (senderError || !allowedRoles.includes(String(sender?.rol))) {
      return NextResponse.json({ error: "Geen verzendrechten" }, { status: 403 });
    }

    const body = await req.json();
    const aanvraagId =
      typeof body.aanvraag_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.aanvraag_id)
        ? body.aanvraag_id
        : null;
    const onderwerp = typeof body.onderwerp === "string" ? body.onderwerp.trim() : "";
    const inhoud = typeof body.inhoud === "string" ? body.inhoud.trim() : "";
    const doelgroep = body.doelgroep as VerzendDoelgroep;
    const link = typeof body.link === "string" ? body.link.trim() : "";
    const selection: string[] = Array.isArray(body.selectie)
      ? Array.from(
          new Set<string>(
            (body.selectie as unknown[]).filter(
              (v): v is string => typeof v === "string" && v.length > 0,
            ),
          ),
        ).slice(0, 100)
      : [];

    if (
      !aanvraagId ||
      !audiences.includes(doelgroep) ||
      !onderwerp ||
      onderwerp.length > 120 ||
      !inhoud ||
      inhoud.length > 2000 ||
      !validInternalLink(link) ||
      /[\r\n\x00-\x1f]/.test(link)
    ) {
      return NextResponse.json({ error: "Ongeldig bericht" }, { status: 400 });
    }
    if (["klasgroepen", "klassen", "personen"].includes(doelgroep) && !selection.length) {
      return NextResponse.json({ error: "Geen ontvangers geselecteerd" }, { status: 400 });
    }
    if (
      ["alle_leerlingen", "alle_leerkrachten", "iedereen"].includes(doelgroep) &&
      body.bevestigSchoolbreed !== true
    ) {
      return NextResponse.json({ error: "Bevestig schoolbrede verzending" }, { status: 400 });
    }

    const { data: profiles, error: profileError } = await admin
      .from("profielen")
      .select("id, email, rol, klas_naam")
      .limit(10000);
    if (profileError) throw profileError;
    if ((profiles ?? []).length === 10000) {
      return NextResponse.json({ error: "Te veel profielen; paginering nodig" }, { status: 409 });
    }

    const ids = new Set<string>();
    if (doelgroep === "alle_leerlingen" || doelgroep === "iedereen") {
      for (const p of profiles ?? []) if (p.rol === "leerling") ids.add(p.id);
    }
    if (doelgroep === "alle_leerkrachten" || doelgroep === "iedereen") {
      for (const p of profiles ?? []) if (teacherRoles.includes(p.rol)) ids.add(p.id);
    }
    if (doelgroep === "lo_team") {
      for (const p of profiles ?? []) if (allowedRoles.includes(p.rol)) ids.add(p.id);
    }
    if (doelgroep === "klassen") {
      for (const p of profiles ?? []) {
        if (p.rol === "leerling" && selection.includes(p.klas_naam)) ids.add(p.id);
      }
    }
    if (doelgroep === "personen") {
      for (const p of profiles ?? []) {
        if (selection.includes(p.id) && (p.rol === "leerling" || teacherRoles.includes(p.rol))) {
          ids.add(p.id);
        }
      }
    }
    if (doelgroep === "klasgroepen") {
      const { data: groups, error: ge } = await admin
        .from("lo_klasgroepen")
        .select("id")
        .in("id", selection)
        .eq("leerkracht_id", user.id);
      if (ge) throw ge;
      if ((groups ?? []).length !== selection.length) {
        return NextResponse.json(
          { error: "Alleen eigen LO-klasgroepen zijn toegestaan" },
          { status: 403 },
        );
      }
      const { data: members, error: me } = await admin
        .from("lo_klasgroep_leden_view")
        .select("leerling_email, klasgroep_id")
        .in("klasgroep_id", selection)
        .limit(10000);
      if (me) throw me;
      if ((members ?? []).length === 10000) {
        return NextResponse.json({ error: "Te veel groepsleden" }, { status: 409 });
      }
      const emails = new Set(
        (members ?? []).map((m) => String(m.leerling_email ?? "").toLowerCase()),
      );
      for (const p of profiles ?? []) {
        if (p.rol === "leerling" && emails.has(String(p.email ?? "").toLowerCase())) {
          ids.add(p.id);
        }
      }
    }

    if (doelgroep === "sneeuwstage_2026") {
      const { data: deelnemers, error: deelnemersError } = await admin
        .from("sneeuwstage_deelnemers")
        .select("leerling_id")
        .eq("sneeuwstage_id", SNEEUWSTAGE_2026_ID)
        .eq("actief", true)
        .limit(1000);
      if (deelnemersError) throw deelnemersError;
      if ((deelnemers ?? []).length === 1000) {
        return NextResponse.json({ error: "Te veel sneeuwstagedeelnemers" }, { status: 409 });
      }

      const leerlingIds = new Set(
        (deelnemers ?? [])
          .map((d) => d.leerling_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      );
      // Voorkomt onbedoelde verzending als de deelnemerslijst onvolledig is.
      // Bij een latere wijziging van het aantal deelnemers moet deze controle
      // bewust worden bijgewerkt of vervangen door een bevestigingsstap.
      if (leerlingIds.size !== VERWACHT_AANTAL_DEELNEMERS) {
        return NextResponse.json(
          { error: `Sneeuwstage telt momenteel ${leerlingIds.size} actieve leerlingen; verwacht ${VERWACHT_AANTAL_DEELNEMERS}. Verzending gestopt.` },
          { status: 409 },
        );
      }

      const profielPerId = new Map((profiles ?? []).map((p) => [p.id, p]));
      for (const leerlingId of leerlingIds) {
        const profiel = profielPerId.get(leerlingId);
        if (!profiel || profiel.rol !== "leerling") {
          return NextResponse.json(
            { error: "Een sneeuwstagedeelnemer heeft geen geldig leerlingprofiel. Verzending gestopt." },
            { status: 409 },
          );
        }
        ids.add(leerlingId);
      }
      for (const leerkrachtId of EXTRA_ONTVANGERS) {
        const profiel = profielPerId.get(leerkrachtId);
        if (!profiel || !teacherRoles.includes(profiel.rol)) {
          return NextResponse.json(
            { error: "Glenn Labie of Joni Vandewalle heeft geen geldig leerkrachtprofiel. Verzending gestopt." },
            { status: 409 },
          );
        }
        ids.add(leerkrachtId);
      }
      if (ids.size !== VERWACHT_AANTAL_DEELNEMERS + EXTRA_ONTVANGERS.length) {
        return NextResponse.json(
          { error: "Het aantal unieke ontvangers is onverwacht. Verzending gestopt." },
          { status: 409 },
        );
      }
    }

    if (!ids.size) {
      return NextResponse.json({ error: "Geen ontvangers gevonden" }, { status: 400 });
    }
    const recipients = [...ids];
    const effectieveDoelgroep: Audience =
      doelgroep === "sneeuwstage_2026" ? "personen" : doelgroep;
    const { data: messageId, error: insertError } = await admin.rpc(
      "lo_bericht_verzend_atomair",
      {
        p_afzender: user.id,
        p_onderwerp: onderwerp,
        p_inhoud: inhoud,
        p_doelgroep: effectieveDoelgroep,
        p_link: link || null,
        p_ontvangers: recipients,
        p_aanvraag_id: aanvraagId,
      },
    );
    if (insertError || !messageId) {
      throw insertError ?? new Error("Geen bericht-ID ontvangen");
    }
    return NextResponse.json({
      ok: true,
      bericht_id: messageId,
      ontvangers: recipients.length,
      push_status: "wachtrij",
    });
  } catch (e: unknown) {
    console.error("LO bericht verzenden:", e);
    return NextResponse.json({ error: "Verzenden mislukt" }, { status: 500 });
  }
}
