# Nutrition Macros Upgrade

## Goal
Add calories (kcal), fat (g), and sugar (g) to the meal analysis system. Show all macros to all users (athletes + coach). Switch photo model from xiaomi/mimo-v2.5 to openai/gpt-4o-mini for better vision accuracy on complex food photos. Keep mimo-v2.5 for text-only analysis.

## Design Decision
OVERRIDE: Original decision was "no calories for teens (eating disorder risk)". Marco has decided to show everything to everyone: protein + calories + fat + sugar.

---

## Changes Required

### 1. Edge Function: supabase/functions/analyze-meal/index.ts

**Model routing:**
- Photo analysis: use `openai/gpt-4o-mini` (better vision)
- Text analysis: keep `xiaomi/mimo-v2.5` (cheaper, fine for text)
- Accept a `mode` field from the client to determine which model to use. Actually, the client already sends either `image` or `text` in the body. Use that to pick the model.

**Prompt update:**
Add calories, fat, sugar to the JSON schema in the prompt:

```
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
```

**Response format:**
```json
{
  "items": [...],
  "total_protein_g": ...,
  "total_calories_kcal": ...,
  "total_fat_g": ...,
  "total_sugar_g": ...,
  "mock": false,
  "source": "photo" | "text"
}
```

**Important:** The `reasoning: { exclude: true }` parameter only works for reasoning models (mimo). For GPT-4o-mini, don't send it (it's not a reasoning model, will just be ignored, but cleaner to not send it).

### 2. Client Types: src/lib/analyze-meal.ts

Update `AnalyzedItem`:
```ts
export type AnalyzedItem = {
  name: string;
  name_zh: string;
  portion_label: string;
  protein_g: number;
  calories_kcal: number;
  fat_g: number;
  sugar_g: number;
  confidence: number;
};
```

Update `AnalysisResult`:
```ts
export type AnalysisResult = {
  items: AnalyzedItem[];
  total_protein_g: number;
  total_calories_kcal: number;
  total_fat_g: number;
  total_sugar_g: number;
  mock: boolean;
  notice?: string;
  source?: "photo" | "text";
};
```

Update `sumProtein` to also sum calories, fat, sugar. Or create a generic `sumField` helper.

Update mock fallback meals to include the new fields.

Update `analyzeMealPhoto` and `analyzeMealText` to extract the new totals from the response.

When edge function returns empty items, return zeros for all totals.

### 3. MealLogModal: src/components/MealLogModal.astro

**Item row display (renderItems function, ~line 778):**
Currently shows: name, portion_label, protein_g
Change to show: name, portion_label, and a row of macros underneath:
```
Pork Patties · 豬肉餅
3 pieces · 220kcal · 12g fat · 2g sugar · 20g protein
```

The protein value should be the most prominent (it already is with the tk-item-protein class). Add calories, fat, sugar as smaller text in the meta line.

**Footer total:**
Currently shows just protein total. Change to show all four:
```
Total protein   65g
Total calories  820kcal
Total fat       35g
Total sugar     12g
```
Or a compact single-line format:
```
65g protein · 820kcal · 35g fat · 12g sugar
```

### 4. Food Database Schema + Data

Add columns to `food_database`:
- `calories_per_portion` (numeric, nullable)
- `fat_per_portion` (numeric, nullable)
- `sugar_per_portion` (numeric, nullable)

Run an ALTER TABLE migration. Then populate the values for all 254 items using the edge function (batch process: send each food name + portion to the AI and get back the estimates).

IMPORTANT: After Claude Code adds the migration file, run it manually:
```
supabase db push --project-ref zeczlwypqqvvpraosodv
```

### 5. Manual Search Path (MealLogModal, search results + click handler)

When a user manually adds a food from the search, the item currently only has protein_per_portion from the food_database. After the schema update, it will also have calories/fat/sugar.

Update the search result click handler (~line 1216) to include the new fields:
```ts
state.items.push({
  name: row.name,
  name_zh: row.name_zh || "",
  portion_label: row.portion_label,
  protein_g: Number(row.protein_per_portion) || 0,
  calories_kcal: Number(row.calories_per_portion) || 0,
  fat_g: Number(row.fat_per_portion) || 0,
  sugar_g: Number(row.sugar_per_portion) || 0,
  confidence: 1,
});
```

Update the food cache query (~line 828) to select the new columns.

### 6. Meal Confirm (save handler)

The `confirmMeal` function (~line 1054) maps items to `foodItems` for the database. Add the new fields:
```ts
const foodItems = state.items.map((it) => ({
  name: it.name,
  name_zh: it.name_zh || "",
  portion_label: it.portion_label,
  protein_g: Number(it.protein_g) || 0,
  calories_kcal: Number(it.calories_kcal) || 0,
  fat_g: Number(it.fat_g) || 0,
  sugar_g: Number(it.sugar_g) || 0,
  confidence: typeof it.confidence === "number" ? it.confidence : 1,
}));
```

Also update the upsert to include total_calories_kcal, total_fat_g, total_sugar_g.

### 7. Tracker Page (src/pages/portal/tracker.astro)

The tracker displays meal items from the database. When reading back meal_logs, the food_items JSON will now contain the new fields (for new logs). For old logs that only have protein, show the new fields as "N/A" or just omit them.

Update the meal item display in the tracker to show the new macros alongside protein.

### 8. Coach Dashboard (src/pages/portal/coach.astro)

Update the coach dashboard to show the new macro totals in the drill-down view. The meal rows already display food_items — update the rendering to include calories, fat, sugar.

### 9. i18n

Add translation keys for:
- Calories / 卡路里
- Fat / 脂肪
- Sugar / 糖分

---

## Testing
1. Text analysis: "2 eggs, toast with butter, orange juice" → should return all 4 macros
2. Photo analysis: take a photo of a complex meal → should identify individual items with all macros
3. Manual search: add food from search → should show all macros
4. Confirm + save → food_items JSON in meal_logs should include new fields
5. Tracker page → should display all macros
6. Coach dashboard → should display all macros in drill-down

## Files Modified
- supabase/functions/analyze-meal/index.ts (edge function)
- src/lib/analyze-meal.ts (client types + API wrapper)
- src/components/MealLogModal.astro (modal UI)
- src/pages/portal/tracker.astro (tracker display)
- src/pages/portal/coach.astro (coach dashboard)
- supabase/migrations/ (new migration for food_database columns)
- src/lib/i18n.ts (translation keys)