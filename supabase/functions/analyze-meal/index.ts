// Supabase Edge Function: analyze-meal
// Accepts either a photo (base64) OR a text description.
// Calls OpenRouter model and returns food items with protein estimates.
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

function buildPrompt(mode: "image" | "text"): string {
  const base = `You are a sports nutritionist for young hockey players in Hong Kong.

Return ONLY a JSON array (no markdown, no explanation). Each element:
{
  "name": "English food name",
  "name_zh": "Traditional Chinese name (Cantonese style)",
  "portion_label": "portion estimate (e.g. 1 bowl, 1 palm, 2 pieces)",
  "protein_g": estimated protein in grams (number),
  "confidence": 0.0-1.0 how confident you are
}

Rules:
- Be realistic with portions (HK teen meal sizes)
- Round protein to nearest 0.5g
- Include ALL food items mentioned or visible
- For HK-style dishes, use common Cantonese names
- If something is unclear, use lower confidence
- If the input is not food or makes no sense, return: [{"name":"Unclear","name_zh":"无法辨认","portion_label":"N/A","protein_g":0,"confidence":0}]`;

  if (mode === "image") {
    return `Analyze this meal photo and identify each food item with an estimated protein amount.\n\n${base}`;
  }
  return `The user typed what they ate. Break it down into individual food items with estimated protein amounts.\n\n${base}`;
}

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
    const textDescription: string | undefined = body?.text;

    // Must have either image or text
    if (!imageBase64 && !textDescription) {
      return new Response(
        JSON.stringify({ error: "Missing 'image' (base64) or 'text' field" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const isImage = !!imageBase64;
    const prompt = buildPrompt(isImage ? "image" : "text");

    // Build message content
    const content: any[] = [{ type: "text", text: prompt }];

    if (isImage) {
      content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      });
    } else {
      // Append user's text description to the prompt
      content[0].text += `\n\nUser said: "${textDescription}"`;
    }

    const openrouterRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content }],
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
    const responseContent: string = data?.choices?.[0]?.message?.content ?? "[]";

    // Parse the JSON from the response (strip markdown fences if present)
    let cleaned = responseContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let items: AnalyzedItem[];
    try {
      items = JSON.parse(cleaned);
      if (!Array.isArray(items)) items = [];
    } catch {
      console.error("Parse failed:", responseContent);
      items = [];
    }

    const total = Math.round(items.reduce((s: number, i: any) => s + (i.protein_g || 0), 0) * 10) / 10;

    return new Response(
      JSON.stringify({ items, total_protein_g: total, mock: false, source: isImage ? "photo" : "text" }),
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