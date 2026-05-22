// Supabase Edge Function: analyze-meal
// Receives a meal photo (base64), calls OpenRouter vision model,
// returns food items with protein estimates.
//
// Deploy:
//   supabase functions deploy analyze-meal
// (OPENROUTER_API_KEY already set as Supabase secret)

// deno-lint-ignore-file no-explicit-any

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "xiaomi/mimo-v2.5";

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
  confidence: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const imageBase64: string | undefined = body?.image;
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing 'image' field (base64)" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a sports nutritionist for young hockey players in Hong Kong. Analyze this meal photo and identify each food item with an estimated protein amount.

Return ONLY a JSON array (no markdown, no explanation). Each element:
{
  "name": "English food name",
  "name_zh": "Traditional Chinese name (Cantonese style)",
  "portion_label": "visual portion estimate (e.g. 1 bowl, 1 palm, 2 pieces)",
  "protein_g": estimated protein in grams (number),
  "confidence": 0.0-1.0 how confident you are
}

Rules:
- Be realistic with portions (HK teen meal sizes)
- If you can't identify something clearly, use lower confidence
- Round protein to nearest 0.5g
- Include ALL visible food items
- For HK-style dishes, use common Cantonese names
- If the image is unclear or not food, return: [{"name":"Unclear","name_zh":"无法辨认","portion_label":"N/A","protein_g":0,"confidence":0}]`;

    const openrouterRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!openrouterRes.ok) {
      const errText = await openrouterRes.text();
      console.error("OpenRouter error:", openrouterRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Vision API error", detail: errText }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const data = await openrouterRes.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "[]";

    // Parse the JSON from the response (strip markdown fences if present)
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let items: AnalyzedItem[];
    try {
      items = JSON.parse(cleaned);
      if (!Array.isArray(items)) items = [];
    } catch {
      console.error("Parse failed:", content);
      items = [];
    }

    const total = Math.round(items.reduce((s: number, i: any) => s + (i.protein_g || 0), 0) * 10) / 10;

    return new Response(
      JSON.stringify({ items, total_protein_g: total, mock: false }),
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