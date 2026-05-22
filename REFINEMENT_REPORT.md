# RISE Nutrition Tracker — Combined Refinement Report

**Date:** May 22, 2026
**Method:** Code audit (Claude Code, line-by-line of all 20 source files) + Browser test (live site as jason@test.rise)

---

## CRITICAL (fix first)

### C1. Photo Analysis Broken — Always Returns Mock Data
**Source:** Code audit + Marco's report
**Root cause:** The `analyze-meal` edge function checks for `OPENROUTER_API_KEY` via `Deno.env.get()`. If the secret isn't set in Supabase, the function returns 500, and the client falls back to `mockAnalysis()` which returns fake food items from a hardcoded `MOCK_MEALS` array.
**Also:** The Supabase anon key in `supabase.ts` and `BaseLayout.astro` appears truncated (`eyJhbG...V_KM`). If this is the actual deployed key, ALL Supabase operations would fail.
**Fix:**
1. Verify anon key is correct: Supabase Dashboard → Project Settings → API
2. Set secret: `supabase secrets set OPENROUTER_API_KEY=<key>`
3. Redeploy edge function: `supabase functions deploy analyze-meal`
4. Test by uploading a photo and checking network tab

### C2. Language Toggle Completely Broken
**Source:** Browser test (NEW finding)
**What happened:** Clicked the "中文" toggle button on the tracker page. Nothing changed. All text stayed English. `document.documentElement.lang` stayed "en".
**Root cause:** The `.portal-lang-toggle` button exists in the DOM but has NO JavaScript event handler attached. Searched all inline scripts, found zero references to `portal-lang-toggle`. The button is dead HTML.
**Fix:** Add click handler to the portal lang toggle button that calls `setLang()` and updates all `data-i18n` elements.

### C3. Onboarding Missing Height
**Source:** Code audit + Marco's report
**Root cause:** Onboarding collects weight, age, growth rate, goal — but no height. No `height_cm` field in `baseline_intake` table.
**Impact:** Coaches can't see BMI. Two athletes with same weight but different heights get identical protein targets.
**Fix:**
1. Add height step between growth rate and goal
2. `ALTER TABLE baseline_intake ADD COLUMN height_cm numeric;`
3. Add to upsert and protein calculation
4. Add height to coach dashboard drawer
5. Add i18n keys for EN/ZH

### C4. Weight Chart — Code Appears Correct, But User Reports Flipped
**Source:** Code audit reviewed the chart logic thoroughly. The `days` array is built oldest-to-newest, `xFor()` maps earlier dates to smaller x values. Code looks correct for chronological left-to-right.
**Browser test:** 7-day view shows May 16 → May 19 → May 22 (correct order). Jason only has 7 days of data so 30-day view looks identical.
**Possibility:** The bug may have been in a previous version, or the `preserveAspectRatio="none"` on the SVG causes visual distortion that makes dates *appear* wrong on certain screen sizes.
**Fix:** Add explicit `days.sort()` as belt-and-suspenders. Change `preserveAspectRatio="none"` to `"xMidYMid meet"`. Test with 30+ days of data.

---

## MEDIUM (fix next)

### M1. Edit Meal — No Photo Option
**Source:** Code audit + Marco's report + Browser test CONFIRMED
**Browser test:** Clicked Breakfast (logged), modal opened as "EDIT · BREAKFAST" with search view only. No "Take photo" or "Upload photo" buttons visible. Only search + remove + add more.
**Root cause:** `openModal()` with prefill skips the choice screen entirely (`setView("search")` instead of `setView("choice")`).
**Fix:** When editing, show the choice screen with pre-filled items, or add a "📷 Add photo" button in the search view footer.

### M2. Past Day Meal Save Uses Wrong Date
**Source:** Code audit (NEW finding)
**Root cause:** `confirmMeal()` always uses `new Date().toISOString().slice(0, 10)` for `dateISO`, not the `viewingDate`. If a user navigates to a past day and edits, the meal saves to TODAY.
**Impact:** Past day editing corrupts data — edits go to wrong day.
**Fix:** Pass `viewingDate` to the modal, use it in `confirmMeal()`.

### M3. AI Feedback Persists to Wrong Day on Past-Day Edit
**Source:** Code audit (NEW finding)
**Root cause:** `handleMealLogged` uses `todayISO()` in the update query, not the actual date being viewed.
**Fix:** Use `viewingDate` instead of `todayISO()`.

### M4. Coach Dashboard Queries Not Scoped by Team
**Source:** Code audit (NEW finding)
**Root cause:** Coach queries fetch ALL rows from `baseline_intake`, `daily_weight`, `meal_logs` without filtering by team. Relies entirely on RLS.
**Fix:** Add `.in("user_id", athleteIds)` as defense-in-depth.

### M5. RLS Policies Not in Repository
**Source:** Code audit (NEW finding)
**Root cause:** No migration files, no SQL policy definitions in repo. All RLS configured server-side only.
**Fix:** Export policies from Supabase dashboard and add to repo.

---

## LOW (fix when convenient)

### L1. Debug console.log in Production
**File:** MealLogModal.astro — 7 verbose `console.log` statements
**Fix:** Remove or wrap in `if (window.__RISE_DEBUG)`

### L2. AuthModal Not i18n'd
**File:** AuthModal.astro — 16+ hardcoded English strings
**Fix:** Add `data-i18n` attributes and translations

### L3. Weight Widget Messages Hardcoded English
**File:** tracker.astro — "Target updated:", "Weight logged.", "Enter your weight in kg."
**Fix:** Use `t()` function (keys already exist in i18n.ts)

### L4. Coach "Thinking" Text Hardcoded
**File:** tracker.astro:2250 — "Coach is thinking"
**Fix:** Use `t("tracker.feedback.thinking")`

### L5. "Demo" Labels Visible to Users
**File:** tracker.astro — "Demo" badge on daily summary and feedback cards when AI falls back to mock
**Fix:** Hide in production or use softer label

### L6. Food DB Uses Simplified Chinese
**File:** seed-food-database.sql — Uses 鸡胸肉 instead of 雞胸肉
**Impact:** HK users expect Traditional Chinese
**Fix:** Convert all strings to Traditional Chinese

### L7. PWA Manifest Name Mismatch
**File:** manifest.json — says "RISE Nutrition Tracker" not "RISE Advancement"
**Fix:** Update to "RISE Advancement" / "RISE"

### L8. PWA Doesn't Precache /portal/tracker
**File:** sw.js — PRECACHE_URLS missing the most-used page
**Fix:** Add `/portal/tracker` to precache list

---

## COSMETIC (polish)

- SVG `preserveAspectRatio="none"` distorts charts on non-standard aspect ratios
- No loading states / timeout on edge function calls (spinner forever)
- No error boundary for failed daily summary (card stays hidden)
- Missing aria-labels on dynamic meal slot inner buttons
- Past day badge may not update on language toggle

---

## BROWSER TEST NOTES

**What worked:**
- Login (jason@test.rise) — fast, lands on portal dashboard
- Portal dashboard — protein target card, tools grid, all correct
- Tracker page loads — all 6 meal slots, progress bar (135g/136.8g = 99%), weight widget (72.2 kg today)
- Weight chart 7-day — shows May 16→22, chronological order, dots and labels visible
- Coach's Daily Read — AI feedback present, "best meal" and "try this" sections populated
- One-tap repeat — visible on Snack 2 (17g) and Dinner (50g)
- Edit modal opens correctly for logged meals

**What didn't work:**
- Language toggle — completely dead button, no JS handler
- Photo analysis — returns mock data (edge function not operational)
- Edit mode — no photo option available

**Data integrity:**
- Jason has 4 logged meals today (Breakfast 17g, Snack 1 25g, Lunch 63g, Snack 3 30g) = 135g total
- Weight data: 7 days seeded (May 16-22), range 71.9-72.4 kg
- Coach daily summary is present and reads naturally

---

## PRIORITY ORDER FOR FIX SESSION

1. **C1** — Fix photo analysis (set API key, verify edge function)
2. **C2** — Fix language toggle (add JS handler)
3. **C3** — Add height to onboarding + DB migration
4. **M1** — Add photo option to edit mode
5. **M2+M3** — Fix past-day date handling
6. **C4** — Verify weight chart with more data, fix preserveAspectRatio
7. **M4** — Add team-scoping to coach queries
8. **L1-L8** — Clean up hardcoded strings, debug logs, i18n gaps
9. **Polish** — Loading states, error boundaries, accessibility

---

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/components/MealLogModal.astro` | Photo in edit mode, remove console.logs, fix date handling |
| `src/pages/portal/tracker.astro` | Height intake step, lang toggle handler, weight chart fix, hardcoded strings |
| `src/pages/portal/coach.astro` | Height display, team-scoped queries, chart fix |
| `src/lib/i18n.ts` | Add missing translation keys (height, auth, weight widget) |
| `src/lib/auth.ts` | Team-scoped queries |
| `src/components/AuthModal.astro` | i18n all strings |
| `src/layouts/BaseLayout.astro` | Verify anon key |
| `src/lib/supabase.ts` | Verify anon key |
| `public/sw.js` | Add /portal/tracker to precache |
| `public/manifest.json` | Fix name |
| `supabase/functions/analyze-meal/` | Verify deployment + API key |
| DB migration | `ALTER TABLE baseline_intake ADD COLUMN height_cm numeric;` |
