// Supabase Edge Function: analyze-meal
// Photo: Google Gemini API directly (bypasses OpenRouter vision block)
// Text: OpenRouter MiMo (cheap, fast)
//
// Deploy:
//   supabase functions deploy analyze-meal
// Secrets needed:
//   OPENROUTER_API_KEY  — for text analysis (MiMo)
//   GOOGLE_AI_API_KEY   — for photo analysis (Gemini)

// deno-lint-ignore-file no-explicit-any

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MODEL_TEXT = "xiaomi/mimo-v2.5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AnalyzedItem = {
  name: string;
  name_zh: string;
  portion_label: string;
  protein_g: number;
  calories_kcal: number;
  fat_g: number;
  sugar_g: number;
  confidence: number;
};

function buildPrompt(mode: "image" | "text"): string {
  const base = `You are a sports nutritionist for young hockey players in Hong Kong.

Return ONLY a JSON array (no markdown, no explanation). Each element:
{
  "name": "English food name",
  "name_zh": "Traditional Chinese name (Cantonese style)",
  "portion_label": "portion estimate (e.g. 1 bowl, 1 palm, 2 pieces)",
  "protein_g": estimated protein in grams (number),
  "calories_kcal": estimated calories in kilocalories (number),
  "fat_g": estimated fat in grams (number),
  "sugar_g": estimated sugar in grams (number),
  "confidence": 0.0-1.0 how confident you are
}

Rules:
- Be realistic with portions (HK teen meal sizes)
- Round protein to nearest 0.5g; round calories to nearest 10 kcal; round fat and sugar to nearest 0.5g
- Include ALL food items mentioned or visible
- For HK-style dishes, use common Cantonese names
- If something is unclear, use lower confidence
- If the input is not food or makes no sense, return: [{"name":"Unclear","name_zh":"无法辨认","portion_label":"N/A","protein_g":0,"calories_kcal":0,"fat_g":0,"sugar_g":0,"confidence":0}]`;

  if (mode === "image") {
    return `Analyze this meal photo and identify each food item with estimated protein, calories, fat, and sugar.\n\n${base}`;
  }
  return `The user typed what they ate. Break it down into individual food items with estimated protein, calories, fat, and sugar.\n\n${base}`;
}

// Call Google Gemini API directly for photo analysis
async function analyzeWithGemini(imageBase64: string, apiKey: string): Promise<any> {
  const prompt = buildPrompt("image");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini error:", res.status, errText);
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  return text;
}

// Call OpenRouter for text analysis (MiMo)
async function analyzeWithOpenRouter(textDescription: string, apiKey: string): Promise<any> {
  const prompt = buildPrompt("text");

  const content: any[] = [{
    type: "text",
    text: `${prompt}\n\nUser said: "${textDescription}"`,
  }];

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_TEXT,
      messages: [{ role: "user", content }],
      max_tokens: 4000,
      temperature: 0.2,
      reasoning: { exclude: true },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenRouter error:", res.status, errText);
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "[]";
}

function parseItems(raw: string): AnalyzedItem[] {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    const items = JSON.parse(cleaned);
    return Array.isArray(items) ? items : [];
  } catch {
    console.error("Parse failed:", raw);
    return [];
  }
}

function totals(items: AnalyzedItem[]) {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    total_protein_g: round1(items.reduce((s, i) => s + (i.protein_g || 0), 0)),
    total_calories_kcal: Math.round(items.reduce((s, i) => s + (i.calories_kcal || 0), 0)),
    total_fat_g: round1(items.reduce((s, i) => s + (i.fat_g || 0), 0)),
    total_sugar_g: round1(items.reduce((s, i) => s + (i.sugar_g || 0), 0)),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");

    const body = await req.json();
    const imageBase64: string | undefined = body?.image;
    const textDescription: string | undefined = body?.text;

    if (!imageBase64 && !textDescription) {
      return new Response(
        JSON.stringify({ error: "Missing 'image' (base64) or 'text' field" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const isImage = !!imageBase64;
    let rawResponse: string;

    if (isImage) {
      // Photo: use Google Gemini directly
      if (!googleKey) {
        return new Response(
          JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      rawResponse = await analyzeWithGemini(imageBase64, googleKey);
    } else {
      // Text: use OpenRouter MiMo
      if (!openrouterKey) {
        return new Response(
          JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      rawResponse = await analyzeWithOpenRouter(textDescription!, openrouterKey);
    }

    const items = parseItems(rawResponse);
    const t = totals(items);

    return new Response(
      JSON.stringify({
        items,
        ...t,
        mock: false,
        source: isImage ? "photo" : "text",
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-meal error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
