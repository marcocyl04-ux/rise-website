// Supabase Edge Function: ai-feedback
// Receives meal context, returns short coach-voice feedback via OpenRouter
// (DeepSeek V3). Falls back to a rule-based mock when OPENROUTER_API_KEY is
// not set, so the UI is always usable.
//
// Deploy:
//   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
//   supabase functions deploy ai-feedback

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

type Body = {
  meal_slot?: string;
  food_items?: FoodItem[];
  total_protein_g?: number;
  daily_total_g?: number;
  protein_target_g?: number;
  weight_kg?: number;
  age?: number;
  primary_goal?: string;
  time_of_day?: string;
  language?: string;
  full_name?: string;
};

const SYSTEM_PROMPT_EN = `You are a nutrition coach for teenage ice hockey players in Hong Kong. You speak like a supportive older brother who knows sports nutrition — not like a doctor or a fitness app.

Rules:
- Keep it under 50 words.
- Reference the actual food they logged (use the food names from the data).
- Be specific about what to eat next (name real foods, not "add more protein").
- Reference hockey when natural ("game day fuel", "recovery meal", "on-ice energy").
- Never mention calories.
- Use the kid's name if available.
- If they're on track, celebrate briefly. If they're behind, encourage don't scold.
- Suggest foods that work in HK: eggs, milk, tofu, chicken, Greek yogurt, fish balls, soy milk, char siu.
- Never sound clinical. Never say "your protein intake is below recommended levels." Say "you're a bit behind — grab some eggs at your next snack."

Bad: "Your protein consumption for this meal was 15g, which is below the recommended amount for your weight class."
Good: "Light meal — you're at 40g of 120g today. Add chicken or eggs at your next meal to get back on track."

Reply with just the feedback text. No labels, no quotes, no markdown.`;

const SYSTEM_PROMPT_ZH = `你係香港青少年冰球員嘅營養教練。講嘢要好似個識運動營養嘅哥哥仔，唔好似醫生或者健身 app 咁。

規則：
- 50 個字以內。
- 提番佢哋食過嘅嘢（用 food data 入面嘅名）。
- 講清楚下一餐食咩（要講真實食物，唔好淨係話「多啲蛋白質」）。
- 自然咁提下冰球（「比賽日嘅燃料」、「練習後恢復」之類）。
- 唔好提卡路里。
- 有名就用佢個名。
- 達標就讚下。落後就鼓勵，唔好鬧。
- 推介香港易搵嘅食物：雞蛋、牛奶、豆腐、雞胸、希臘乳酪、魚蛋、豆漿、叉燒。
- 唔好講到好臨床。

直接俾 feedback，唔好加 label、引號、markdown。`;

function mealSlotLabel(slot?: string, lang = "en"): string {
  const map: Record<string, { en: string; zh: string }> = {
    breakfast: { en: "Breakfast", zh: "早餐" },
    snack_1: { en: "Morning snack", zh: "上晝小食" },
    lunch: { en: "Lunch", zh: "午餐" },
    snack_2: { en: "Afternoon snack", zh: "下晝小食" },
    dinner: { en: "Dinner", zh: "晚餐" },
    snack_3: { en: "Evening snack", zh: "宵夜" },
  };
  if (!slot) return lang === "zh" ? "餐" : "meal";
  return (map[slot]?.[lang === "zh" ? "zh" : "en"]) || slot;
}

function buildUserPrompt(b: Body): string {
  const lang = b.language === "zh" ? "zh" : "en";
  const slotLabel = mealSlotLabel(b.meal_slot, lang);
  const foods = (b.food_items || [])
    .map((f) => {
      const name = lang === "zh" && f.name_zh ? f.name_zh : f.name || "";
      const portion = f.portion_label ? ` (${f.portion_label})` : "";
      const grams = typeof f.protein_g === "number" ? ` — ${f.protein_g}g` : "";
      return `${name}${portion}${grams}`;
    })
    .filter(Boolean)
    .join(", ");
  const dailyTotal = Math.round((b.daily_total_g ?? 0) * 10) / 10;
  const target = Math.round((b.protein_target_g ?? 0) * 10) / 10;
  const mealTotal = Math.round((b.total_protein_g ?? 0) * 10) / 10;
  const pct = target > 0 ? Math.round((dailyTotal / target) * 100) : 0;

  if (lang === "zh") {
    return [
      `球員資料：${b.weight_kg ?? "?"} kg，${b.age ?? "?"} 歲，目標：${b.primary_goal || "?"}${b.full_name ? `，名：${b.full_name}` : ""}.`,
      `今餐：${slotLabel}${b.time_of_day ? ` @ ${b.time_of_day}` : ""}`,
      `食物：${foods || "(冇)"}`,
      `今餐蛋白質：${mealTotal} g`,
      `今日總計：${dailyTotal}g / ${target}g（${pct}%）`,
      `用粵語 / 香港口語俾 feedback。`,
    ].join("\n");
  }

  return [
    `Player: ${b.weight_kg ?? "?"} kg, ${b.age ?? "?"} y/o, goal: ${b.primary_goal || "?"}${b.full_name ? `, name: ${b.full_name}` : ""}.`,
    `This meal: ${slotLabel}${b.time_of_day ? ` @ ${b.time_of_day}` : ""}`,
    `Foods: ${foods || "(none)"}`,
    `This meal protein: ${mealTotal} g`,
    `Daily total so far: ${dailyTotal}g of ${target}g (${pct}%)`,
    `Write the feedback in English.`,
  ].join("\n");
}

function mockFeedback(b: Body): string {
  const lang = b.language === "zh" ? "zh" : "en";
  const daily = Math.round((b.daily_total_g ?? 0) * 10) / 10;
  const target = Math.round((b.protein_target_g ?? 0) * 10) / 10;
  const pct = target > 0 ? daily / target : 0;

  if (lang === "zh") {
    if (pct >= 0.8) return `好嘢！今日 ${daily}g / ${target}g，做得好。keep住呢個節奏，比賽日狀態會勁啲。`;
    if (pct >= 0.5) return `OK，今日去到 ${daily}g / ${target}g。下一餐加少少蛋或者雞胸就追到。`;
    return `今日差啲 (${daily}g / ${target}g)。下一餐食啲雞胸、雞蛋或者飲杯牛奶補返。`;
  }

  if (pct >= 0.8) return `Great work! You're at ${daily}g of ${target}g today — crushing it. Keep this pace for game day energy.`;
  if (pct >= 0.5) return `Good progress — ${daily}g of ${target}g so far. Add some eggs or chicken at your next meal to stay on track.`;
  return `You're behind today — ${daily}g of ${target}g. Grab chicken, eggs, or a glass of milk at your next meal to catch up.`;
}

async function callOpenRouter(apiKey: string, b: Body): Promise<string> {
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
      max_tokens: 150,
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
  return content.trim().replace(/^["“]+|["”]+$/g, "");
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
      JSON.stringify({ feedback: mockFeedback(body), mock: true }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  try {
    const feedback = await callOpenRouter(apiKey, body);
    return new Response(
      JSON.stringify({ feedback, mock: false }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ai-feedback error:", err);
    return new Response(
      JSON.stringify({
        feedback: mockFeedback(body),
        mock: true,
        notice: "Falling back to demo feedback",
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
