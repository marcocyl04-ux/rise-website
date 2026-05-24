# Protein Shakes + Daily Macro Targets

## Overview
Two features:
1. Protein Shake quick-log: dedicated button in meal modal + all shakes searchable in food search
2. Daily macro targets: show targets + progress bars for calories, fat, sugar (not just protein)

---

## Feature 1: Protein Shake Quick-Log

### Seed Data
Add ~15-20 common protein shake products to food_database. Each is a row with:
- name: product name (e.g. "Optimum Nutrition Gold Standard Whey (with water)")
- name_zh: Chinese name
- category: "protein_shake" (new category)
- portion_label: "1 scoop with water" or "1 scoop with milk"
- protein_per_portion: grams per serving
- calories_per_portion: kcal per serving
- fat_per_portion: grams
- sugar_per_portion: grams
- common_in_hk: true for products commonly available in HK (ON, MyProtein, MuscleTech are all available)

Products to include:
1. ON Gold Standard Whey (with water) - 24g protein, 120kcal, 1g fat, 2g sugar
2. ON Gold Standard Whey (with milk) - 30g protein, 210kcal, 6g fat, 11g sugar
3. MyProtein Impact Whey (with water) - 21g protein, 103kcal, 1.9g fat, 1g sugar
4. MyProtein Impact Whey (with milk) - 27g protein, 193kcal, 6.9g fat, 10g sugar
5. MuscleTech NitroTech (with water) - 30g protein, 160kcal, 2.5g fat, 2g sugar
6. MuscleTech NitroTech (with milk) - 36g protein, 250kcal, 7.5g fat, 11g sugar
7. Dymatize ISO100 (with water) - 25g protein, 110kcal, 0.5g fat, 1g sugar
8. Dymatize ISO100 (with milk) - 31g protein, 200kcal, 5.5g fat, 10g sugar
9. BSN Syntha-6 (with water) - 22g protein, 200kcal, 6g fat, 4g sugar
10. BSN Syntha-6 (with milk) - 28g protein, 290kcal, 11g fat, 13g sugar
11. Rule One Whey Blend (with water) - 24g protein, 120kcal, 1g fat, 2g sugar
12. Rule One Whey Blend (with milk) - 30g protein, 210kcal, 6g fat, 11g sugar
13. Optimum Nutrition Casein (with water) - 24g protein, 120kcal, 1g fat, 2g sugar
14. Optimum Nutrition Casein (with milk) - 30g protein, 210kcal, 6g fat, 11g sugar
15. Transparent Labs Whey (with water) - 28g protein, 130kcal, 1.5g fat, 2g sugar
16. Transparent Labs Whey (with milk) - 34g protein, 220kcal, 6.5g fat, 11g sugar

### UI: Protein Shake Button
In MealLogModal.astro, add a 4th button in the choice view (after "Take photo", "Upload photo", "Search food"):
- Icon: 🥤 or similar
- Label: "Protein shake"
- Sub: "Quick-add your shake"

Click behavior:
- Switches to a new view "shakes"
- Shows a scrollable list of all food_database items where category = "protein_shake"
- Each row shows: name, portion, protein, calories
- Click a shake → adds it to state.items → switches back to choice view
- Items list + footer appear immediately

### Search Integration
Shakes already appear in food search because they're in food_database. The filterFoods function searches by name. Typing "protein" or "whey" or "ON Gold" should find them. This works automatically once the data is seeded.

### Seed Script
Create a SQL script to INSERT the shake data:
supabase/functions/seed-shakes.sql (or inline INSERT via supabase db query)

---

## Feature 2: Daily Macro Targets

### Formulas (from baseline intake data)
All calculated from the same baseline data already collected (weight_kg, goal, growth_rate):

**Protein target:** Already exists. Weight_kg × (GoalFactor + GrowthAdjustment)
  - Maintenance: 1.6, Muscle gain: 1.8, Recomposition: 2.0, Fat loss: 2.2
  - Floor: 1.6, Ceiling: 2.4, Absolute max: 200g/day

**Calorie target:**
  - Base: weight_kg × 30 (sedentary baseline)
  - Activity multiplier: × 1.5 (moderate-high for hockey training)
  - Goal adjustment: muscle gain +200kcal, fat loss -300kcal, maintenance +0, recomposition -100kcal
  - Safety: minimum 1800kcal, maximum 4000kcal

**Fat target:**
  - 30% of calories ÷ 9 (calories per gram of fat)
  - Rounded to nearest 5g

**Sugar target:**
  - <10% of calories ÷ 4 (WHO guideline)
  - This is a MAX, not a goal
  - Rounded to nearest 5g

### Where to Calculate
The protein target is calculated in tracker.astro during the Day 1 intake flow and stored in baseline_intake (as a computed value). Similarly, compute calorie/fat/sugar targets at the same time and store them.

Actually, looking at the current code: the protein target is computed dynamically from baseline_intake fields (weight, goal, growth_rate) every time the tracker loads. It's not stored as a separate column. So we just need to add the calorie/fat/sugar calculations alongside the protein calculation in tracker.astro.

### DB Schema
Add to baseline_intake (or compute dynamically from existing fields):
- target_calories_kcal: integer (computed, could store or compute live)
- target_fat_g: numeric (computed)
- target_sugar_g: numeric (computed, this is a max)

Decision: compute dynamically (like protein). No schema change needed for targets.

### UI: Tracker Page (tracker.astro)
Currently shows one progress bar for protein. Change to show 4 macro progress bars:

Layout (above the meal slots):
```
Today's Macros
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Protein    ████████░░░░░  65g / 120g
Calories   ██████░░░░░░░  820 / 2400 kcal
Fat        ███░░░░░░░░░░  35g / 80g
Sugar      ██████░░░░░░░  25g / 60g (max)
```

Design:
- Each macro gets its own small progress bar
- Protein bar stays prominent (it's the primary metric)
- Calories, fat, sugar bars are smaller/secondary
- Sugar bar labeled "(max)" since it's a limit, not a target
- Color coding: on track = RISE red, over limit = warning color

The progress bars update in real-time as meals are logged (same as current protein bar).

### Macro Calculation Functions
Add to tracker.astro (near the existing protein target calculation):

```javascript
function calcCalorieTarget(weightKg, goal) {
  const base = weightKg * 30;
  const activity = 1.5;
  let adjustment = 0;
  if (goal === 'muscle_gain') adjustment = 200;
  else if (goal === 'fat_loss') adjustment = -300;
  else if (goal === 'recomposition') adjustment = -100;
  const target = Math.round(base * activity + adjustment);
  return Math.max(1800, Math.min(4000, target));
}

function calcFatTarget(calories) {
  return Math.round((calories * 0.30 / 9) / 5) * 5; // 30% of calories, rounded to 5g
}

function calcSugarMax(calories) {
  return Math.round((calories * 0.10 / 4) / 5) * 5; // <10% of calories, rounded to 5g
}
```

### i18n Keys
Add to i18n:
- tracker.todayMacros / 今日營養
- tracker.calories / 卡路里
- tracker.fat / 脂肪
- tracker.sugar / 糖分
- tracker.maxLabel / (上限) — for sugar
- modal.proteinShake / 蛋白粉
- modal.pickShake / 選擇你的蛋白粉
- modal.quickAdd / 快速添加

---

## Files to Modify
1. supabase/functions/analyze-meal/index.ts — no change needed
2. src/components/MealLogModal.astro — add shake button + shake picker view
3. src/pages/portal/tracker.astro — add macro progress bars + calculation functions
4. src/lib/i18n.ts — add new translation keys
5. Food database — INSERT seed data for protein shakes (via supabase db query)

## Testing
1. Open meal modal → see "Protein shake" button → click → see list of shakes → tap one → added to meal
2. Search "protein" or "whey" → shakes appear in results
3. Tracker page → see 4 progress bars (protein, calories, fat, sugar)
4. Log a meal → all 4 bars update
5. Day 1 intake / new user → targets calculated from baseline

## Files Modified
- src/components/MealLogModal.astro
- src/pages/portal/tracker.astro
- src/lib/i18n.ts
- Food database (SQL INSERT)