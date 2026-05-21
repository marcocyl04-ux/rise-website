// Supabase Edge Function: daily-summary
// Returns an end-of-day summary with summary/highlight/tip when 3+ meals are
// logged. Falls back to a rule-based mock when OPENROUTER_API_KEY is missing.
//
// Deploy:
//   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
//   supabase functions deploy daily-summary

// deno-lint-ignore-file no-explicit-any

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat-v3-0324";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FoodItem = {
  name?: string;
  name_zh?: string;
  portion_label?: string;
  protein_g?: number;
};

type Meal = {
  meal_slot?: string;
  food_items?: FoodItem[];
  total_protein_g?: number;
};

type Body = {
  meals?: Meal[];
  daily_total_g?: number;
  protein_target_g?: number;
  weight_kg?: number;
  age?: number;
  primary_goal?: string;
  language?: string;
  full_name?: string;
};

const SYSTEM_PROMPT_EN = `You are a nutrition coach for teenage ice hockey players in Hong Kong. Write a brief end-of-day summary.

Rules:
- Under 80 words across all three fields combined.
- Highlight the best meal of the day (name the actual food).
- If they hit target: celebrate, suggest maintaining tomorrow.
- If they missed: ONE specific, actionable tip for tomorrow (name a real food).
- Reference hockey context when natural (game day, recovery, on-ice energy).
- Never mention calories.
- HK-friendly foods only: eggs, milk, tofu, chicken, Greek yogurt, fish balls, soy milk, char siu, salmon.
- Never clinical. Talk like a supportive older brother.

Reply with ONLY a JSON object, no markdown, no code fences:
{"summary":"...","highlight":"...","tip":"..."}`;

const SYSTEM_PROMPT_ZH = `你係香港青少年冰球員嘅營養教練。寫一個簡短嘅每日總結。

規則：
- 三欄加埋唔超過 80 字。
- 指出今日最佳一餐（要講真實食物個名）。
- 達標就讚下，叫佢聽日繼續。
- 未達標就俾一個具體建議（要講真實食物）。
- 自然咁提下冰球（比賽日、恢復、上冰前後）。
- 唔好提卡路里。
- 用香港易搵食物：雞蛋、牛奶、豆腐、雞胸、希臘乳酪、魚蛋、豆漿、叉燒、三文魚。
- 唔好臨床，似哥哥仔咁講。

淨係回覆 JSON object，唔好 markdown，唔好 code fence：
{"summary":"...","highlight":"...","tip":"..."}`;

function mealSlotLabel(slot?: string, lang = "en"): string {
  const map: Record<string, { en: string; zh: string }> = {
    breakfast: { en: "Breakfast", zh: "早餐" },
    snack_1: { en: "Snack 1", zh: "上晝小食" },
    lunch: { en: "Lunch", zh: "午餐" },
    snack_2: { en: "Snack 2", zh: "下晝小食" },
    dinner: { en: "Dinner", zh: "晚餐" },
    snack_3: { en: "Snack 3", zh: "宵夜" },
  };
  if (!slot) return lang === "zh" ? "餐" : "meal";
  return (map[slot]?.[lang === "zh" ? "zh" : "en"]) || slot;
}

function bestMeal(meals: Meal[]): Meal | null {
  if (!meals.length) return null;
  return meals.reduce((best, m) =>
    ((m.total_protein_g ?? 0) > (best.total_protein_g ?? 0) ? m : best),
    meals[0]);
}

function topFoodName(meal: Meal, lang = "en"): string {
  const items = meal.food_items || [];
  if (!items.length) return "";
  const top = items.reduce((acc, it) =>
    ((it.protein_g ?? 0) > (acc.protein_g ?? 0) ? it : acc), items[0]);
  return (lang === "zh" && top.name_zh ? top.name_zh : top.name) || "";
}

function buildUserPrompt(b: Body): string {
  const lang = b.language === "zh" ? "zh" : "en";
  const target = Math.round((b.protein_target_g ?? 0) * 10) / 10;
  const daily = Math.round((b.daily_total_g ?? 0) * 10) / 10;
  const pct = target > 0 ? Math.round((daily / target) * 100) : 0;

  const mealLines = (b.meals || []).map((m) => {
    const label = mealSlotLabel(m.meal_slot, lang);
    const foods = (m.food_items || [])
      .map((f) => {
        const name = lang === "zh" && f.name_zh ? f.name_zh : f.name || "";
        const grams = typeof f.protein_g === "number" ? ` (${f.protein_g}g)` : "";
        return `${name}${grams}`;
      })
      .filter(Boolean)
      .join(", ");
    const total = Math.round((m.total_protein_g ?? 0) * 10) / 10;
    return `- ${label}: ${foods || "(none)"} — ${total}g`;
  }).join("\n");

  if (lang === "zh") {
    return [
      `球員：${b.weight_kg ?? "?"} kg，${b.age ?? "?"} 歲，目標：${b.primary_goal || "?"}${b.full_name ? `，名：${b.full_name}` : ""}.`,
      `今日蛋白質：${daily}g / ${target}g（${pct}%）`,
      `今日記錄：`,
      mealLines,
    ].join("\n");
  }

  return [
    `Player: ${b.weight_kg ?? "?"} kg, ${b.age ?? "?"} y/o, goal: ${b.primary_goal || "?"}${b.full_name ? `, name: ${b.full_name}` : ""}.`,
    `Today's protein: ${daily}g of ${target}g (${pct}%)`,
    `Meals logged:`,
    mealLines,
  ].join("\n");
}

function mockSummary(b: Body): { summary: string; highlight: string; tip: string } {
  const lang = b.language === "zh" ? "zh" : "en";
  const target = Math.round((b.protein_target_g ?? 0) * 10) / 10;
  const daily = Math.round((b.daily_total_g ?? 0) * 10) / 10;
  const pct = target > 0 ? daily / target : 0;
  const meals = b.meals || [];
  const best = bestMeal(meals);
  const bestProtein = Math.round((best?.total_protein_g ?? 0) * 10) / 10;
  const bestLabel = mealSlotLabel(best?.meal_slot, lang);
  const topFood = best ? topFoodName(best, lang) : "";

  if (lang === "zh") {
    const hit = pct >= 0.9;
    return {
      summary: hit
        ? `今日 ${daily}g / ${target}g，達標！keep住個節奏，恢復同上冰狀態都會好啲。`
        : `今日 ${daily}g / ${target}g。差少少，聽日加多餐就追到。`,
      highlight: best && bestProtein > 0
        ? `${bestLabel}最掂 — ${topFood ? topFood + "，" : ""}有 ${bestProtein}g。`
        : `繼續加油。`,
      tip: hit
        ? `每日類似嘅 pattern 就 OK 喇。`
        : `聽日 snack 加杯希臘乳酪加藍莓 = 輕鬆 16g 蛋白質。`,
    };
  }

  const hit = pct >= 0.9;
  return {
    summary: hit
      ? `Today: ${daily}g of ${target}g — target hit. Keep this rhythm and your recovery will keep stacking up.`
      : `Today: ${daily}g of ${target}g. A bit short — easy to close that gap tomorrow.`,
    highlight: best && bestProtein > 0
      ? `${bestLabel} was your best meal — ${topFood ? topFood + ", " : ""}${bestProtein}g.`
      : `Keep building.`,
    tip: hit
      ? `Lock this pattern in. Same again tomorrow.`
      : `Greek yogurt + blueberries between meals = easy 16g protein snack.`,
  };
}

function tryParseJson(s: string): any | null {
  const cleaned = s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

async function callOpenRouter(apiKey: string, b: Body): Promise<{ summary: string; highlight: string; tip: string }> {
  const lang = b.language === "zh" ? "zh" : "en";
  const systemPrompt = lang === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;
  const userPrompt = buildUserPrompt(b);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://riseadvancement.com",
      "X-Title": "RISE Nutrition Tracker",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }
  const json: any = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Empty completion");
  }

  const parsed = tryParseJson(content);
  if (
    !parsed ||
    typeof parsed.summary !== "string" ||
    typeof parsed.highlight !== "string" ||
    typeof parsed.tip !== "string"
  ) {
    throw new Error("Malformed completion");
  }
  return {
    summary: parsed.summary.trim(),
    highlight: parsed.highlight.trim(),
    tip: parsed.tip.trim(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ ...mockSummary(body), mock: true }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  try {
    const result = await callOpenRouter(apiKey, body);
    return new Response(
      JSON.stringify({ ...result, mock: false }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("daily-summary error:", err);
    return new Response(
      JSON.stringify({
        ...mockSummary(body),
        mock: true,
        notice: "Falling back to demo summary",
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
