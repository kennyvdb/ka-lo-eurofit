import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { POST as assessHomework } from "../ai-beoordeling/route";
export async function POST(request: NextRequest) {
  try {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) return NextResponse.json({ error: "Supabase-serverconfiguratie ontbreekt." }, { status: 500 });
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from("profielen").select("rol").eq("id", userData.user.id).single();
    if (profileError || !["lo_leerkracht", "admin"].includes(String(profile?.rol ?? "").toLowerCase())) return NextResponse.json({ error: "Geen LO-leerkrachtrechten." }, { status: 403 });
    const body = await request.json();
    const submissionId = body?.submissionId;
    if (typeof submissionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(submissionId)) return NextResponse.json({ error: "Ongeldige inzending." }, { status: 400 });
    const { data: submission, error: loadError } = await admin.from("eurofit_huiswerk_submissions").select("id, grade, payload").eq("id", submissionId).single();
    if (loadError || !submission) return NextResponse.json({ error: "Inzending niet gevonden." }, { status: 404 });
    const payload = submission.payload;
    if (payload?.status !== "definitief" || payload?.aiAssessment?.status === "completed" || !payload?.form || !["2e", "3e"].includes(submission.grade)) return NextResponse.json({ error: "Deze inzending komt niet in aanmerking voor een herkansing." }, { status: 409 });
    const aiRequest = new NextRequest(new URL("/api/huiswerk/ai-beoordeling", request.url), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ grade: submission.grade, form: payload.form }) });
    const aiResponse = await assessHomework(aiRequest);
    const assessment = await aiResponse.json();
    if (!aiResponse.ok) return NextResponse.json({ error: assessment?.error || "AI-beoordeling mislukt." }, { status: 502 });
    const aiAssessment = { ...assessment, status: "completed" };
    // Optimistische controle: schrijf alleen wanneer de oorspronkelijke payload niet veranderd is.
    const { data: saved, error: saveError } = await admin.from("eurofit_huiswerk_submissions").update({ payload: { ...payload, aiAssessment } }).eq("id", submissionId).eq("payload", payload).select("id");
    if (saveError) throw saveError;
    if (!saved?.length) return NextResponse.json({ error: "De huistaak is intussen gewijzigd. Vernieuw het overzicht." }, { status: 409 });
    return NextResponse.json({ aiAssessment });
  } catch (error: unknown) {
    console.error("Handmatige AI-herkansing mislukt", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI-herkansing mislukt." }, { status: 500 });
  }
}
