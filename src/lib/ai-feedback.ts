// Client-side wrapper for the AI coach feedback edge functions.
//
// Calls supabase.functions.invoke('ai-feedback' | 'daily-summary'). If the
// edge function isn't deployed yet or the call fails, falls back to a
// rule-based mock so the UI is always usable.

export type FoodItem = {
  name?: string;
  name_zh?: string;
  portion_label?: string;
  protein_g?: number;
  calories_kcal?: number;
  fat_g?: number;
  sugar_g?: number;
};

export type FeedbackContext = {
  meal_slot: string;
  food_items: FoodItem[];
  total_protein_g: number;
  daily_total_g: number;
  protein_target_g: number;
  weight_kg: number;
  age: number;
  primary_goal: string;
  time_of_day?: string;
  language?: string;
  full_name?: string;
};

export type SummaryContext = {
  meals: Array<{
    meal_slot: string;
    food_items: FoodItem[];
    total_protein_g: number;
  }>;
  daily_total_g: number;
  protein_target_g: number;
  weight_kg: number;
  age: number;
  primary_goal: string;
  language?: string;
  full_name?: string;
};

export type FeedbackResult = {
  feedback: string;
  mock: boolean;
};

export type SummaryResult = {
  summary: string;
  highlight: string;
  tip: string;
  mock: boolean;
};

function mealSlotLabel(slot: string, lang: string): string {
  const map: Record<string, { en: string; zh: string }> = {
    breakfast: { en: "Breakfast", zh: "早餐" },
    snack_1: { en: "Morning snack", zh: "上晝小食" },
    lunch: { en: "Lunch", zh: "午餐" },
    snack_2: { en: "Afternoon snack", zh: "下晝小食" },
    dinner: { en: "Dinner", zh: "晚餐" },
    snack_3: { en: "Evening snack", zh: "宵夜" },
  };
  const key = lang === "zh" ? "zh" : "en";
  return map[slot]?.[key] || slot;
}

function mockFeedback(ctx: FeedbackContext): FeedbackResult {
  const lang = ctx.language === "zh" ? "zh" : "en";
  const daily = Math.round(ctx.daily_total_g * 10) / 10;
  const target = Math.round(ctx.protein_target_g * 10) / 10;
  const pct = target > 0 ? daily / target : 0;

  let feedback: string;
  if (lang === "zh") {
    if (pct >= 0.8) feedback = `好嘢！今日 ${daily}g / ${target}g，做得好。keep住呢個節奏，比賽日狀態會勁啲。`;
    else if (pct >= 0.5) feedback = `OK，今日去到 ${daily}g / ${target}g。下一餐加少少蛋或者雞胸就追到。`;
    else feedback = `今日差啲 (${daily}g / ${target}g)。下一餐食啲雞胸、雞蛋或者飲杯牛奶補返。`;
  } else {
    if (pct >= 0.8) feedback = `Great work! You're at ${daily}g of ${target}g today — crushing it. Keep this pace for game day energy.`;
    else if (pct >= 0.5) feedback = `Good progress — ${daily}g of ${target}g so far. Add some eggs or chicken at your next meal to stay on track.`;
    else feedback = `You're behind today — ${daily}g of ${target}g. Grab chicken, eggs, or a glass of milk at your next meal to catch up.`;
  }
  return { feedback, mock: true };
}

function mockSummary(ctx: SummaryContext): SummaryResult {
  const lang = ctx.language === "zh" ? "zh" : "en";
  const target = Math.round(ctx.protein_target_g * 10) / 10;
  const daily = Math.round(ctx.daily_total_g * 10) / 10;
  const pct = target > 0 ? daily / target : 0;
  const meals = ctx.meals || [];
  const best = meals.length
    ? meals.reduce((b, m) => (m.total_protein_g > b.total_protein_g ? m : b), meals[0])
    : null;
  const bestProtein = best ? Math.round(best.total_protein_g * 10) / 10 : 0;
  const bestLabel = best ? mealSlotLabel(best.meal_slot, lang) : "";
  let topFood = "";
  if (best?.food_items?.length) {
    const top = best.food_items.reduce(
      (a, it) => ((it.protein_g ?? 0) > (a.protein_g ?? 0) ? it : a),
      best.food_items[0],
    );
    topFood = (lang === "zh" && top.name_zh ? top.name_zh : top.name) || "";
  }
  const hit = pct >= 0.9;

  if (lang === "zh") {
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
      mock: true,
    };
  }

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
    mock: true,
  };
}

function getSb(): any {
  if (typeof window === "undefined") return null;
  return (window as any).supabaseClient || null;
}

export async function getMealFeedback(ctx: FeedbackContext): Promise<FeedbackResult> {
  const sb = getSb();
  if (!sb?.functions?.invoke) return mockFeedback(ctx);

  try {
    const { data, error } = await sb.functions.invoke("ai-feedback", { body: ctx });
    if (error) throw error;
    if (data && typeof data.feedback === "string" && data.feedback.trim()) {
      return { feedback: data.feedback.trim(), mock: !!data.mock };
    }
    return mockFeedback(ctx);
  } catch (err) {
    console.warn("ai-feedback invoke failed, using mock:", err);
    return mockFeedback(ctx);
  }
}

export async function getDailySummary(ctx: SummaryContext): Promise<SummaryResult> {
  const sb = getSb();
  if (!sb?.functions?.invoke) return mockSummary(ctx);

  try {
    const { data, error } = await sb.functions.invoke("daily-summary", { body: ctx });
    if (error) throw error;
    if (
      data &&
      typeof data.summary === "string" &&
      typeof data.highlight === "string" &&
      typeof data.tip === "string"
    ) {
      return {
        summary: data.summary.trim(),
        highlight: data.highlight.trim(),
        tip: data.tip.trim(),
        mock: !!data.mock,
      };
    }
    return mockSummary(ctx);
  } catch (err) {
    console.warn("daily-summary invoke failed, using mock:", err);
    return mockSummary(ctx);
  }
}
