# Slice 2: Food Database + Photo Meal Logging

## Overview
Add a curated food database (200+ items with visual portions) and photo-based meal logging to the RISE Nutrition Tracker. Kids take a photo of their meal, AI identifies the food, estimates protein, and updates their daily progress. This is the core user experience.

## Current State
- RISE Astro site at ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Supabase project: zeczlwypqqvvpraosodv.supabase.co
- Tables already created: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS active with SECURITY DEFINER functions
- /portal/tracker.astro has: auth check, Day 1 intake flow, protein formula, 6 meal slots (read-only grid), light-themed
- Supabase client loaded globally via CDN in BaseLayout.astro
- meal_logs table schema: id, user_id, meal_slot, logged_date, photo_url, food_items (JSONB), total_protein_g, ai_feedback, created_at

## Supabase Credentials (already in BaseLayout.astro)
- URL: https://zeczlwypqqvvpraosodv.supabase.co
- DB Password: -123ASDFfdsa321-
- Anon key: in BaseLayout.astro (full key)
- Service role key: check .hermes/memory or Supabase dashboard Settings > API

## What to Build

### 1. Supabase Storage Bucket for Meal Photos
Create a storage bucket called "meal-photos" in Supabase:
- Public: false (private, RLS-based access)
- File size limit: 5MB
- Allowed types: image/jpeg, image/png, image/webp
- Path structure: {user_id}/{date}/{meal_slot}.jpg (overwrites if re-logged)

Since Supabase REST API can't create buckets, use the Supabase Management API or create via SQL/Dashboard. The simplest approach: create the bucket via the Supabase dashboard (Storage > New Bucket > name: "meal-photos", public: off). Add RLS storage policies so users can only access their own folder.

If you can't access the dashboard programmatically, write a note in the code about this manual step and proceed with the assumption that the bucket exists.

### 2. Seed the Food Database (~200 items)
Create a SQL file at: src/lib/seed-food-database.sql

This SQL INSERTs into the existing food_database table. Categories and structure:

```sql
-- food_database columns: id (auto), name, name_zh, category, portion_label, protein_per_portion, common_in_hk, active
-- Categories: 'protein', 'carb', 'vegetable', 'fruit', 'dairy', 'drink', 'other'
```

Include these foods (with realistic protein_per_portion values based on visual portions):

**Protein sources (~60 items):**
- Chicken breast (1 palm = ~30g protein)
- Chicken thigh (1 palm = ~25g)
- Grilled fish fillet (1 palm = ~28g)
- Salmon (1 palm = ~32g)
- Canned tuna (1 small can = ~20g)
- Beef steak (1 palm = ~36g)
- Ground beef (1 cup cooked = ~30g)
- Pork chop (1 piece = ~28g)
- Pork belly (3 slices = ~15g) (common_in_hk: true)
- BBQ pork / char siu (1 palm = ~25g) (common_in_hk: true)
- Roast goose (1 palm = ~22g) (common_in_hk: true)
- Roast duck (1 palm = ~22g) (common_in_hk: true)
- Steamed fish (whole, medium = ~35g) (common_in_hk: true)
- Fish balls (6 pieces = ~12g) (common_in_hk: true)
- Shrimp (10 medium = ~18g)
- Squid (1 palm = ~18g)
- Eggs (1 large = ~6g)
- Tofu, firm (1 block = ~20g)
- Tofu, soft/silken (1 block = ~8g) (common_in_hk: true)
- Soy milk, unsweetened (1 cup = ~7g) (common_in_hk: true)
- Edamame (1 cup = ~17g)
- Tempeh (1 palm = ~16g)
- Protein shake (1 scoop = ~25g)
- Greek yogurt (1 cup = ~15g)
- Cottage cheese (1 cup = ~24g)
- Turkey breast (1 palm = ~28g)
- Lamb chop (1 piece = ~25g)
- Beef brisket (1 palm = ~28g) (common_in_hk: true)
- Beef tendon (1 bowl = ~15g) (common_in_hk: true)
- Century egg (1 piece = ~5g) (common_in_hk: true)
- Beef meatballs (4 pieces = ~14g) (common_in_hk: true)
- Add more common HK/Chinese protein sources to reach ~60

**Carb sources (~50 items):**
- White rice (1 bowl = ~4g) (common_in_hk: true)
- Brown rice (1 bowl = ~5g)
- Congee / jook (1 bowl = ~3g) (common_in_hk: true)
- Noodles (1 bowl = ~7g) (common_in_hk: true)
- Rice noodles / ho fun (1 bowl = ~3g) (common_in_hk: true)
- Instant noodles (1 pack = ~8g) (common_in_hk: true)
- Bread, white (2 slices = ~5g)
- Bread, whole wheat (2 slices = ~7g)
- Bagel (1 piece = ~10g)
- Oatmeal (1 bowl = ~6g)
- Pasta (1 cup cooked = ~8g)
- Sweet potato (1 medium = ~2g)
- Potato (1 medium = ~4g)
- Corn on the cob (1 ear = ~4g)
- Mantou / steamed bun (1 piece = ~4g) (common_in_hk: true)
- Baozi / steamed stuffed bun (1 piece = ~6g) (common_in_hk: true)
- Wonton (8 pieces = ~8g) (common_in_hk: true)
- Fried rice (1 plate = ~8g) (common_in_hk: true)
- Fried noodles (1 plate = ~10g) (common_in_hk: true)
- French fries (1 medium = ~4g)
- Wrap / tortilla (1 piece = ~4g)
- Add more to reach ~50

**Vegetables (~30 items):**
- Broccoli (1 cup = ~3g)
- Spinach (1 cup cooked = ~5g)
- Bok choy (1 cup = ~2g) (common_in_hk: true)
- Chinese broccoli / gai lan (1 cup = ~3g) (common_in_hk: true)
- Green beans (1 cup = ~2g)
- Mixed vegetables (1 cup = ~3g)
- Stir-fried vegetables (1 plate = ~3g) (common_in_hk: true)
- Tomato (1 medium = ~1g)
- Cucumber (1 medium = ~1g)
- Corn kernels (1 cup = ~5g)
- Mushrooms (1 cup = ~3g)
- Eggplant (1 cup = ~1g)
- Lettuce (2 cups = ~1g)
- Carrots (1 cup = ~1g)
- Bean sprouts (1 cup = ~3g) (common_in_hk: true)
- Winter melon (1 cup = ~1g) (common_in_hk: true)
- Add more to reach ~30

**Fruits (~20 items):**
- Apple (1 medium = ~0.5g)
- Banana (1 medium = ~1g)
- Orange (1 medium = ~1g)
- Mango (1 cup = ~1g)
- Watermelon (1 cup = ~1g) (common_in_hk: true)
- Grapes (1 cup = ~1g)
- Strawberry (1 cup = ~1g)
- Blueberries (1 cup = ~1g)
- Pineapple (1 cup = ~1g)
- Kiwi (2 pieces = ~2g)
- Dragon fruit (1 piece = ~2g) (common_in_hk: true)
- Lychee (10 pieces = ~1g) (common_in_hk: true)
- Pomelo (1 cup = ~2g) (common_in_hk: true)
- Papaya (1 cup = ~1g) (common_in_hk: true)
- Guava (1 medium = ~2g) (common_in_hk: true)
- Add more to reach ~20

**Dairy & drinks (~20 items):**
- Whole milk (1 cup = ~8g)
- Skim milk (1 cup = ~8g)
- Chocolate milk (1 cup = ~8g)
- Yogurt (1 cup = ~8g)
- Cheese, cheddar (1 slice = ~7g)
- Cheese, mozzarella (1 oz = ~6g)
- Milk tea (1 cup, HK style = ~3g) (common_in_hk: true)
- Soy milk (already listed in protein, skip duplicate)
- Protein shake (already listed)
- Juice, orange (1 cup = ~2g)
- Smoothie (1 cup = ~5g)
- Coconut water (1 cup = ~0.5g)
- Add more to reach ~20

**Other/combos (~20 items):**
- Pizza (1 slice = ~12g)
- Hamburger (1 = ~25g)
- Sandwich (1 = ~15g)
- Burrito (1 = ~20g)
- Salad with chicken (1 bowl = ~25g)
- Soup, chicken (1 bowl = ~12g)
- Soup, vegetable (1 bowl = ~3g)
- Wonton noodle soup (1 bowl = ~15g) (common_in_hk: true)
- Beef brisket noodle soup (1 bowl = ~25g) (common_in_hk: true)
- Congee with pork (1 bowl = ~8g) (common_in_hk: true)
- Dim sum: siu mai (4 pieces = ~10g) (common_in_hk: true)
- Dim sum: har gow (4 pieces = ~8g) (common_in_hk: true)
- Dim sum: cheung fun / rice noodle roll (1 plate = ~6g) (common_in_hk: true)
- Hainan chicken rice (1 plate = ~30g) (common_in_hk: true)
- Curry chicken with rice (1 plate = ~28g) (common_in_hk: true)
- Tomato egg stir fry (1 plate = ~14g) (common_in_hk: true)
- Mapo tofu (1 plate = ~15g) (common_in_hk: true)
- Kung pao chicken (1 plate = ~25g)
- Add more to reach ~20

For all items: include both English name and Chinese name (name_zh). Use simplified Chinese. Portion labels should be visual ("1 bowl", "1 palm", "1 piece", "1 cup", "3 slices", "10 pieces", etc.).

Total: aim for 200+ items. The SQL file should be a single INSERT statement with all rows.

### 3. Photo Upload + AI Vision
Create a Supabase Edge Function (or use client-side API call) that:
1. Receives a photo file from the meal logging UI
2. Uploads to Supabase Storage (meal-photos bucket)
3. Sends the photo to OpenAI GPT-4o-mini (or a vision model) for food identification
4. Returns: identified food items, estimated protein, confidence level

**Vision AI approach:**
Since this is an Astro site (static), we can't run server-side code directly. Two options:
- **Option A (Recommended):** Create a Supabase Edge Function at `supabase/functions/analyze-meal/index.ts` that:
  - Receives the photo as base64
  - Calls OpenAI GPT-4o-mini vision API with a prompt like: "Identify the food items in this meal photo. For each item, estimate the portion size using visual cues (palm-sized, bowl, etc.) and the approximate protein in grams. Return JSON: {items: [{name, name_zh, portion, protein_g, confidence}]}"
  - The OpenAI API key should be stored as a Supabase Edge Function secret (OPENAI_API_KEY)
  - Returns the structured food items + total protein

- **Option B (Simpler):** Use the Supabase JS client to call the function. If Edge Functions are too complex, create a simple serverless function or use the Supabase database's `pg_net` extension to make HTTP calls.

Actually, the SIMPLEST approach for this Astro site: create an API route in the Astro site that handles the vision API call. Astro supports API routes via `src/pages/api/analyze-meal.ts`. This runs server-side during SSR/dev and as a serverless function on Vercel.

**Go with Option C (Astro API route):**
Create `src/pages/api/analyze-meal.ts`:
```ts
export async function POST({ request }) {
  // 1. Get the photo from the request body (base64 or form data)
  // 2. Call OpenAI GPT-4o-mini vision API
  // 3. Return structured food items + total protein
}
```

Store the OpenAI API key in `.env` as `OPENAI_API_KEY`. The key will need to be set in Vercel environment variables for production.

For now, if OPENAI_API_KEY is not available, create a MOCK mode that returns realistic test data, so the UI can be built and tested without the API key.

### 4. Meal Logging UI (Update tracker.astro)
Update the main app shell in tracker.astro to make meal slots interactive:

**When user taps a meal slot:**
1. Open a modal/overlay for that meal slot
2. Two input methods side by side:
   - **Take photo** (camera input, primary action, big button)
   - **Search food** (text search against food_database, secondary)
3. After photo is taken:
   - Show the photo thumbnail
   - Show "Analyzing..." loading state
   - Display AI results: identified foods with protein estimates
   - Allow user to adjust (add/remove items, change portion)
   - Show total protein for this meal
   - "Confirm" button to save
4. After confirming:
   - Upload photo to Supabase Storage
   - Save to meal_logs table (photo_url, food_items JSONB, total_protein_g)
   - Update the meal slot card to show "Logged · Xg"
   - Update the daily protein progress bar

**Daily protein progress bar:**
Add a progress bar below the target card showing:
- Current protein / Target protein (e.g., "65g / 120g")
- Visual bar that fills up (red gradient, matches site theme)
- Color coding: green when >= 80%, yellow 50-79%, red < 50%

**One-tap repeat:**
For each meal slot, check if the same slot was logged yesterday. If yes, show a small "Repeat yesterday" button that copies the food_items and total_protein_g from yesterday's log. User confirms and it saves for today. This is critical for compliance (90% of teens eat the same breakfast).

### 5. Food Search
When user taps "Search food" in the meal logging modal:
- Text input that searches food_database by name and name_zh (case-insensitive, partial match)
- Results show: food name, portion label, protein per portion
- User taps a food item to add it to the current meal
- Multiple items can be added
- Each item shows: name, portion, protein, with a remove button
- Show running total

## Files to Create/Modify

**Create:**
- `src/lib/seed-food-database.sql` (200+ food items INSERT)
- `src/pages/api/analyze-meal.ts` (vision API endpoint)
- `src/components/MealLogModal.astro` (meal logging overlay component)

**Modify:**
- `src/pages/portal/tracker.astro` (make slots clickable, add progress bar, wire up modal)

**Supabase Dashboard (manual steps noted in code):**
- Create "meal-photos" storage bucket (private, 5MB limit)
- Set OPENAI_API_KEY in .env (or use mock mode)

## Validation Test
1. Open /portal/tracker, logged in, past intake
2. Tap "Breakfast" slot -> modal opens with photo + search options
3. Take a photo of actual food (or use mock) -> AI returns food items + protein estimate
4. Search "chicken" -> shows chicken breast, chicken thigh, etc. with protein values
5. Add items, see running total, confirm -> slot shows "Logged · 35g"
6. Progress bar updates to reflect new total
7. Tap "Snack 1" -> see "Repeat yesterday" if yesterday had a snack 1 log
8. Refresh page -> data persists (loaded from meal_logs table)
9. Under 60 seconds total for photo-to-confirm flow

**Stop if:** photo upload fails, AI returns garbage, food search is broken, data doesn't persist, progress bar math is wrong.

## Design Notes
- Light themed, matches RISE site (white bg, red accents, Oswald/Inter fonts)
- Mobile-first, 520px max width
- The modal should feel like a native camera app (big photo button, minimal UI)
- Keep the existing .tk- CSS prefix to avoid collisions
- No calorie display anywhere. Protein only.
- Mock mode should be clearly labeled so Marco can test without OpenAI key

## Important Constraints
- Do NOT modify the auth flow, intake flow, or protein formula (those are done)
- Do NOT add any frameworks or dependencies beyond what's already installed
- Use Supabase JS client v2 CDN (already loaded in BaseLayout.astro)
- The food_items JSONB format in meal_logs should be: [{name, name_zh, portion_label, protein_g, confidence}]
- Keep all CSS scoped to .tracker-page / .tk- prefix
- Chinese names: use simplified Chinese (普通话), not traditional
