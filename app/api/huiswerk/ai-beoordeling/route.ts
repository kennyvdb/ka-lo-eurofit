import { NextRequest, NextResponse } from "next/server";

type GradeMode = "2e" | "3e";
type RubricLevel = "-" | "+/-" | "+" | "++";

const LEVELS: RubricLevel[] = ["-", "+/-", "+", "++"];

type FormData = Record<string, unknown>;

/*
 * Maak expliciet een minimale versie van het formulier voor OpenAI.
 *
 * BELANGRIJK:
 * - Dit verandert niets aan het originele formulier.
 * - Dit verandert niets aan wat in Supabase wordt opgeslagen.
 * - Dit verandert niets aan de gewone rubric.
 * - Dit verandert niets aan de UI voor leerling of leerkracht.
 *
 * Alleen de gegevens die naar OpenAI worden gestuurd, worden beperkt.
 */
function formForAi(grade: GradeMode, form: FormData): FormData {
  if (grade === "2e") {
    return {
      mas: form.mas,
      trainingType: form.trainingType,
      trainingGoal: form.trainingGoal,
      expectedRpe: form.expectedRpe,
      expectedTalk: form.expectedTalk,
      warmupMin: form.warmupMin,
      coreText: form.coreText,
      cooldownMin: form.cooldownMin,

      hrRest: form.hrRest,
      hrPeak: form.hrPeak,
      hrRec1: form.hrRec1,

      talk: form.talk,
      talkExplain: form.talkExplain,

      rpe: form.rpe,
      reflection: form.reflection,
    };
  }

  return {
    kcalIntake: form.kcalIntake,
    proteinG: form.proteinG,
    carbsG: form.carbsG,
    fatG: form.fatG,

    kcalTotalBurn: form.kcalTotalBurn,

    balanceExplain: form.balanceExplain,
    longTermExplain: form.longTermExplain,
    macroExplain: form.macroExplain,
    reflection: form.reflection,
  };
}

function assessmentPrompt(
  grade: GradeMode,
  form: Record<string, unknown>,
) {
  const criteria =
    grade === "2e"
      ? [
          "Planning en doelgerichtheid: past trainingsvorm en trainingsdoel logisch bij elkaar?",
          "Gebruik van MAS en intensiteit: is de kern concreet en persoonlijk gekoppeld aan MAS, tempo, duur en/of herstel?",
          "Meten en interpreteren: zijn hartslag, praattest en RPE logisch en worden ze inhoudelijk begrepen?",
          "Reflectie: vergelijkt de leerling verwachting en uitvoering en gebruikt die relevante trainingsgegevens om een persoonlijke conclusie te trekken?",
        ]
      : [
          "Energiebalans: begrijpt en interpreteert de leerling de relatie tussen eigen energie-inname en geschat energieverbruik correct?",
          "Lange termijn: legt de leerling correct en genuanceerd uit wat een aanhoudend energieoverschot, energietekort of evenwicht kan betekenen?",
          "Macronutriënten: toont de leerling inzicht in eiwitten, koolhydraten en vetten in functie van het gekozen doel?",
          "Persoonlijke reflectie: trekt de leerling een persoonlijke, logische conclusie en formuleert die op basis van de eigen geregistreerde gegevens?",
        ];

  return `Je bent een tweede, onafhankelijke beoordelaar voor een huiswerkopdracht lichamelijke opvoeding in het secundair onderwijs.

Beoordeel uitsluitend de inhoud die de leerling heeft ingediend. Je krijgt de bestaande automatische rubric bewust NIET te zien. Laat je dus niet leiden door een andere score.

Gebruik uitsluitend deze niveaus:
- = onvoldoende
+/- = basis aanwezig maar nog onvolledig of oppervlakkig
+ = goed, correct en voldoende onderbouwd
++ = zeer goed, sterk persoonlijk, logisch en goed onderbouwd

Belangrijke beoordelingsregels:
- Beloon geen lange tekst op zichzelf. Kijk naar begrip, logica, toepassing op eigen gegevens en kwaliteit van reflectie.
- Straf een leerling niet voor een lage sportprestatie, lage MAS of een bepaalde energie-inname. Beoordeel het huiswerk en het inzicht, niet het lichaam of prestatieniveau.
- Verzín geen ontbrekende informatie.
- Wees terughoudend met ++: dit vereist duidelijk inzicht en een sterke persoonlijke toepassing.
- Geef korte, concrete feedback in het Nederlands, geschreven voor de LO-leerkracht.

Graad: ${grade}
Criteria:
${criteria.map((x, i) => `${i + 1}. ${x}`).join("\n")}

Ingediend formulier:
${JSON.stringify(form, null, 2)}`;
}

async function verifySupabaseUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return false;

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : "";

    if (!token || !(await verifySupabaseUser(token))) {
      return NextResponse.json(
        { error: "Niet aangemeld." },
        { status: 401 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY ontbreekt op de server." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const grade = body?.grade as GradeMode;
    const form = body?.form;

    if (
      !(["2e", "3e"] as GradeMode[]).includes(grade) ||
      !form ||
      typeof form !== "object" ||
      Array.isArray(form)
    ) {
      return NextResponse.json(
        { error: "Ongeldige huiswerkgegevens." },
        { status: 400 },
      );
    }

    /*
     * Privacy/dataminimalisatie:
     * gebruik vanaf hier NIET rechtstreeks het volledige formulier.
     */
    const aiForm = formForAi(
      grade,
      form as Record<string, unknown>,
    );

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:
            process.env.OPENAI_HOMEWORK_MODEL ||
            "gpt-6-luna",

          store: false,

          input: assessmentPrompt(grade, aiForm),

          text: {
            format: {
              type: "json_schema",
              name: "homework_assessment",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  level: {
                    type: "string",
                    enum: LEVELS,
                  },

                  summary: {
                    type: "string",
                  },

                  criteria: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: {
                          type: "string",
                        },
                        level: {
                          type: "string",
                          enum: LEVELS,
                        },
                        feedback: {
                          type: "string",
                        },
                      },
                      required: [
                        "name",
                        "level",
                        "feedback",
                      ],
                    },
                  },
                },
                required: [
                  "level",
                  "summary",
                  "criteria",
                ],
              },
            },
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      const message =
        result?.error?.message ||
        "OpenAI-beoordeling mislukt.";

      return NextResponse.json(
        { error: message },
        { status: 502 },
      );
    }

    const outputText = result?.output
      ?.flatMap((item: any) => item?.content ?? [])
      ?.find(
        (part: any) => part?.type === "output_text",
      )?.text;

    if (!outputText) {
      return NextResponse.json(
        { error: "Geen AI-beoordeling ontvangen." },
        { status: 502 },
      );
    }

    const assessment = JSON.parse(outputText);

    return NextResponse.json(assessment);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "AI-beoordeling kon niet worden uitgevoerd.",
      },
      { status: 500 },
    );
  }
}