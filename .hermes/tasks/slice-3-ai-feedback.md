# Slice 3: AI Feedback Engine

## Overview
Add AI-powered coach feedback to the RISE Nutrition Tracker. After each meal log, the kid gets instant feedback that sounds like their hockey coach. A daily summary card shows overall assessment at the top of the tracker. Uses OpenRouter (DeepSeek V3) for the LLM, with mock mode fallback.

## Current State
- RISE Astro site at ~/Desktop/rise-website/ (Astro 6 + Tailwind 4, static output)
- Supabase project: zeczlwypqqvvpraosodv.supabase.co
- Slices 1+2 complete: auth, intake, 6 meal slots, food DB (254 items), photo logging, search food, progress bar
- meal_logs table already has `ai_feedback` text column (unused)
- user_profiles has `language` field (en/zh)
- baseline_intake has: weight_kg, age, growth_rate, primary_goal, protein_target_g
- Supabase CLI logged in + linked
- Service role key in ~/Desktop/rise-website/.env
- Supabase Edge Functions require: `supabase functions serve` for local dev, `supabase functions deploy` for production

## API Key
OpenRouter API key: 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
Base URL: https://openrouter.ai/api/v1
Model: deepseek/deepseek-chat-v3-0324
This is OpenAI-compatible, so use the OpenAI SDK with custom base URL.

Set as Supabase Edge Function secret: `OPENROUTER_API_KEY`

## What to Build

### 1. Supabase Edge Function: `ai-feedback`
Create at: `supabase/functions/ai-feedback/index.ts`

This function receives meal context and returns coach-voice feedback.

**Request body:**
```json
{
  "meal_slot": "lunch",
  "food_items": [{"name": "Chicken breast", "name_zh": "鸡胸肉", "portion_label": "1 palm", "protein_g": 30}],
  "total_protein_g": 30,
  "daily_total_g": 65,
  "protein_target_g": 120,
  "weight_kg": 60,
  "age": 15,
  "primary_goal": "muscle_gain",
  "time_of_day": "12:30",
  "language": "en"
}
```

**Response:**
```json
{
  "feedback": "Solid lunch. 30g of protein from chicken is a great start. You're at 65g of 120g today — halfway there. Add some eggs or Greek yogurt at snack 2 to keep the momentum going.",
  "mock": false
}
```

**System prompt (COACH VOICE — this is critical):**
```
You are a nutrition coach for teenage ice hockey players in Hong Kong. You speak like a supportive older brother who knows sports nutrition — not like a doctor or a fitness app.

Rules:
- Keep it under 50 words per feedback
- Reference the actual food they logged (use the food names from the data)
- Be specific about what to eat next (name real foods, not "add more protein")
- Reference hockey when natural ("game day fuel", "recovery meal", "on-ice energy")
- Never mention calories
- Use the kid's name if available
- If they're on track, celebrate briefly. If they're behind, encourage don't scold.
- Suggest foods from their food database (HK-friendly: eggs, milk, tofu, chicken, Greek yogurt, fish balls, soy milk)
- For Chinese language: use natural Cantonese/Mandarin that HK teens would use, not formal Chinese
- Never sound clinical. Never say "your protein intake is below recommended levels." Say "you're a bit behind — grab some eggs at your next snack."

Bad feedback: "Your protein consumption for this meal was 15g, which is below the recommended amount for your weight class."
Good feedback: "Light meal — you're at 40g of 120g today. Add chicken or eggs at your next meal to get back on track."
```

**Implementation:**
- Use OpenAI SDK (npm package already available via Deno) or raw fetch to OpenRouter
- OpenRouter endpoint: POST https://openrouter.ai/api/v1/chat/completions
- Model: deepseek/deepseek-chat-v3-0324
- Max tokens: 150 (keep feedback short)
- Temperature: 0.7
- If OPENROUTER_API_KEY is not set, return a mock feedback based on simple rules:
  - If protein >= 80% of target: "Great job! You're crushing it today. Keep it up!"
  - If protein >= 50%: "Good progress. You're at {current}g of {target}g. Add some protein at your next meal."
  - If protein < 50%: "You're behind today — {current}g of {target}g. Try to get some chicken, eggs, or milk at your next meal."
  - Mark response with `"mock": true`

### 2. Daily Summary Edge Function: `daily-summary`
Create at: `supabase/functions/daily-summary/index.ts`

Generates an end-of-day summary when the kid has logged 3+ meals.

**Request body:**
```json
{
  "meals": [
    {"meal_slot": "breakfast", "food_items": [...], "total_protein_g": 25},
    {"meal_slot": "lunch", "food_items": [...], "total_protein_g": 30},
    {"meal_slot": "snack_2", "food_items": [...], "total_protein_g": 10}
  ],
  "daily_total_g": 65,
  "protein_target_g": 120,
  "weight_kg": 60,
  "age": 15,
  "primary_goal": "muscle_gain",
  "language": "en"
}
```

**Response:**
```json
{
  "summary": "Today: 65g of 120g protein. Breakfast and lunch were solid, but you fell short at snack time. Tomorrow, try adding a protein shake or Greek yogurt between meals. You're building — keep going.",
  "highlight": "Lunch was your best meal today — 30g from chicken.",
  "tip": "Greek yogurt + blueberries = easy 16g protein snack.",
  "mock": false
}
```

**System prompt:**
```
You are a nutrition coach for teenage ice hockey players. Write a brief daily summary.

Rules:
- Under 80 words total
- Highlight the best meal of the day (name the food)
- If they hit target: celebrate, suggest maintaining
- If they missed: one specific, actionable tip for tomorrow
- Reference hockey context when natural
- Never mention calories
- Split into: summary (overall), highlight (best moment), tip (one thing to improve)
- For Chinese: use natural HK teen language
```

### 3. Client-Side Integration: `src/lib/ai-feedback.ts`
Create a new module that calls the edge functions.

```typescript
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

// Call after each meal log
export async function getMealFeedback(context: {
  meal_slot: string;
  food_items: any[];
  total_protein_g: number;
  daily_total_g: number;
  protein_target_g: number;
  weight_kg: number;
  age: number;
  primary_goal: string;
  language?: string;
}): Promise<FeedbackResult>

// Call for daily summary (when 3+ meals logged)
export async function getDailySummary(context: {
  meals: any[];
  daily_total_g: number;
  protein_target_g: number;
  weight_kg: number;
  age: number;
  primary_goal: string;
  language?: string;
}): Promise<SummaryResult>
```

These call the Supabase Edge Functions via the Supabase client:
```js
const { data, error } = await supabaseClient.functions.invoke('ai-feedback', { body: context });
```

If the edge function fails (not deployed yet, network error), fall back to mock feedback (same logic as the edge function mock).

### 4. UI Changes to tracker.astro

**A. Feedback card after meal log:**
After a meal is saved and the modal closes, show a feedback card below the meal grid:
- Light card with coach icon (💬 or similar)
- Feedback text from AI
- If mock: small "(Demo feedback)" label
- Auto-dismisses after 10 seconds, or user taps to dismiss
- Animate in (slide up + fade in)

**B. Daily summary card:**
Add a summary card at the TOP of the tracker app (below the progress bar, above the meal grid):
- Only shows when 3+ meals are logged today
- Shows: summary text, highlight, tip
- Light card, slightly different background (very light warm gray or similar)
- Refreshes when a new meal is logged (re-fetch summary)
- If mock: small "(Demo)" label

**C. Update meal-logged event handler:**
In the existing `meal-logged` event listener:
1. After refreshing the grid + progress bar, call `getMealFeedback()` with the meal context
2. Show the feedback card
3. If 3+ meals logged now, also call `getDailySummary()` and update the summary card

**D. Store feedback in meal_logs:**
After getting feedback from the AI, update the meal_logs row with the feedback text:
```js
await sb.from('meal_logs').update({ ai_feedback: feedbackText }).eq('user_id', userId).eq('meal_slot', slot).eq('logged_date', dateISO);
```

When loading the app shell, also fetch `ai_feedback` from meal_logs and show feedback for already-logged meals (maybe as a subtle indicator on the card, not the big feedback card).

### 5. CSS (in tracker.astro <style>)
Add styles for:
- `.tk-feedback-card` — the instant feedback popup after meal log
- `.tk-summary-card` — the daily summary card at top
- Both match RISE light theme: white bg, red accents, Oswald/Inter fonts
- Mobile-first, max-width 520px
- Smooth animations (slide up, fade in)

## Files to Create/Modify

**Create:**
- `supabase/functions/ai-feedback/index.ts` — instant meal feedback edge function
- `supabase/functions/daily-summary/index.ts` — daily summary edge function  
- `src/lib/ai-feedback.ts` — client-side wrapper for edge functions

**Modify:**
- `src/pages/portal/tracker.astro` — add feedback card, summary card, wire up to meal-logged event

## Deployment Steps (note in code, manual for Marco)
1. Set OpenRouter key as Supabase secret:
   ```bash
   cd ~/Desktop/rise-website
   supabase secrets set OPENROUTER_API_KEY=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
   ```
2. Deploy edge functions:
   ```bash
   supabase functions deploy ai-feedback
   supabase functions deploy daily-summary
   ```

For local testing: `supabase functions serve` runs them locally. But the client-side mock fallback means the UI works even without deploying the functions.

## Validation Test
1. Log a low-protein meal (200g rice, no meat = ~4g protein)
2. After confirming, feedback card appears: "Light meal — you're at 4g of 120g. Add chicken or eggs at your next meal."
3. Log a high-protein meal (chicken breast + rice = ~34g)
4. Feedback: "Solid lunch! 34g from chicken. You're at 38g of 120g — keep it up."
5. Log a 3rd meal → daily summary card appears at top
6. Summary references specific foods from today's meals
7. Refresh page → feedback persists (loaded from ai_feedback column)
8. Response time: under 15 seconds for real AI, instant for mock

**Stop if:** AI feedback is generic/clinical, doesn't reference logged food, takes 30+ seconds, edge function can't be deployed.

## Design Notes
- Feedback card should feel like a text message from a coach, not a system notification
- Keep it SHORT. Teens won't read paragraphs.
- The daily summary is optional reading — don't force it on them
- Mock mode clearly labeled so Marco knows during testing
- Chinese feedback should sound natural (HK Cantonese style if possible, or Mandarin)

## Important Constraints
- Do NOT modify auth flow, intake flow, protein formula, or meal logging flow (those are done)
- Do NOT add npm dependencies (use Supabase client's built-in functions.invoke)
- Keep CSS scoped to .tracker-page / .tk- prefix
- Edge functions use Deno runtime (not Node) — import from "https://esm.sh/" if needed
- The OpenAI SDK can be used via: `import OpenAI from "https://esm.sh/openai"` in Deno
- Supabase Edge Functions automatically have access to SUPABASE_URL and SUPABASE_ANON_KEY
- Set OPENROUTER_API_KEY as a Supabase secret, NOT in code
