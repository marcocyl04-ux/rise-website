# RISE Nutrition Tracker — Full Code Audit Report

**Date:** 2026-05-22  
**Scope:** Athlete-facing features, photo analysis, edge functions, data integrity, UX  
**Stack:** Astro 6 + Tailwind 4 + Supabase  
**Project ref:** zeczlwypqqvvpraosodv

---

## CRITICAL ISSUES

---

### C1. Photo Analysis Always Falls Back to Mock (Edge Function Not Operational)

**Severity:** Critical  
**Files:**
- `src/lib/analyze-meal.ts:98-126`
- `supabase/functions/analyze-meal/index.ts:35-41`
- `src/components/MealLogModal.astro:852-894`

**Root Cause:**

The analyze-meal edge function checks for `OPENROUTER_API_KEY` via `Deno.env.get()` (line 35). If the key is not set as a Supabase secret, or if the edge function itself is not deployed, the client-side wrapper `analyze-meal.ts` falls through to `mockAnalysis()` which returns the hardcoded "Mock analysis (AI service unavailable)" notice.

The cascade is:
1. Client calls `analyzeMealPhoto(file)` → invokes edge function
2. Edge function checks `Deno.env.get("OPENROUTER_API_KEY")` → returns 500 error if missing
3. Client catches error → falls back to `mockAnalysis(file)`
4. Mock returns a deterministic-but-wrong food item based on file header fingerprint

Also, the client-side `analyze-meal.ts` wrapper has its own fallback chain:
- If `window.supabaseClient` is falsy → mock (line 100)
- If edge function call errors → mock (line 109, 121)
- If response has no valid items → mock (line 113, 121)

**Current Behavior:** Every photo analysis produces fake data from `MOCK_MEALS` array (7 hardcoded meal sets).

**Proposed Fix:**
1. Verify the edge function is deployed: `supabase functions deploy analyze-meal`
2. Set the secret: `supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...`
3. Verify the Supabase anon key is correct in `.env` and `BaseLayout.astro` (it appears truncated: `eyJhbG...V_KM` — this looks like a placeholder, not a real key)
4. After fixing, verify by calling the edge function directly or checking the network tab

**Additional Concern:** The Supabase anon key appears to be a truncated placeholder (`eyJhbG...V_KM` in both `supabase.ts:9` and `BaseLayout.astro:79`). If this key is not valid, the entire Supabase client will fail to initialize, which means the edge function invocation will fail at step 1.

---

### C2. Onboarding Missing Height Collection

**Severity:** Critical  
**Files:**
- `src/pages/portal/tracker.astro:43-131` (intake steps template)
- `src/pages/portal/tracker.astro:1522-1693` (intake logic)
- `src/pages/portal/tracker.astro:1662-1672` (baseline_intake upsert)
- `src/pages/portal/tracker.astro:1397-1409` (protein calculation)
- `supabase/functions/ai-feedback/index.ts:107-124` (prompts)
- `supabase/functions/daily-summary/index.ts:123-137` (prompts)

**Root Cause:**

The onboarding flow collects 4 data points (weight, age, growth rate, goal) across 4 visible steps (plus a 5th result step). Height is never collected. The `baseline_intake` upsert at line 1662-1672 only includes:
```
{ user_id, weight_kg, age, growth_rate, primary_goal, protein_target_g }
```

There is NO `height_cm` field here or anywhere in the schema.

**Impact:**
1. Coaches cannot calculate BMI for young athletes (critical for hockey development context)
2. The protein formula at line 1397-1409 uses only weight × (goal_factor + growth_adj), capped between weight×1.6 and weight×2.4. Height is never factored in, meaning a 5'2" 60kg athlete gets the same target as a 6'2" 60kg athlete.
3. Coach dashboard drawer (coach.astro:1222-1243) shows baseline data but has no height column.

**Proposed Fix:**
1. Add a Step 3.5 (between growth and goal) for height in cm:
```html
<!-- Step 3.5: height -->
<div class="tk-step" data-step="3.5">
  <h3 class="tk-h3">How tall are you?</h3>
  <p class="tk-sub">In centimeters</p>
  <div class="tk-number-input">
    <input type="number" id="intake-height" min="100" max="220" step="0.1" placeholder="170" inputmode="decimal" />
    <span class="tk-unit">cm</span>
  </div>
</div>
```
2. Add `height_cm` to the `intakeState` and the `baseline_intake` upsert
3. Add `height_cm` to the protein calculation (potentially as a modifier for body composition context)
4. Add height display to coach dashboard drawer baseline section
5. Add translations: `tracker.intake.heightQ`, `tracker.intake.heightSub`, `tracker.intake.heightUnit`
6. Add a migration to the `baseline_intake` table: `ALTER TABLE baseline_intake ADD COLUMN height_cm numeric;`

---

### C3. Weight Chart X-Axis — REVIEWED, CODE APPEARS CORRECT

**Severity:** Critical (reported) → Reviewed / Low confidence of actual bug  
**Files:**
- `src/pages/portal/tracker.astro:2077-2177`
- `src/pages/portal/coach.astro:1284-1367`

**Review Findings:**

After thorough trace of both weight chart implementations (tracker and coach dashboard), the x-axis rendering logic appears **correct** for chronological left-to-right display:

1. `days` array is built from oldest to newest:
```javascript
for (let i = chartRange - 1; i >= 0; i--) {
    days.push(addDaysISO(today, -i));
}
// For 7-day: days = [May 16, 17, 18, 19, 20, 21, 22]
```

2. `xFor(iso)` maps earlier dates to smaller x values:
```javascript
const idx = days.indexOf(iso);
return padL + (idx / (days.length - 1)) * innerW;
// May 16 (idx=0) → x = padL (leftmost)
// May 22 (idx=6) → x = padL + innerW (rightmost)
```

3. Both `path` and `dots` iterate `points` (derived from `days` in chronological order), so the line is drawn left-to-right.

4. x-axis labels use indices `[0, middle, last]` which are oldest, middle, newest → correctly positioned.

**Possible Explanations for Bug Report:**
- The vector may have been in a previous version with a different loop (e.g., `for (let i = 0; i < chartRange; i++)` without the negative)
- If `preserveAspectRatio="none"` on the SVG causes visual distortion on some screens, dates might *appear* in wrong order
- The reporter may be confusing the weight chart with a different visualization

**Recommendation:** Verify with actual production data. If the bug reproduces, check:
1. Whether `weightHistory` contains dates in the expected order
2. Whether `new Date()` and `addDaysISO()` produce correct values at the user's timezone
3. Consider adding explicit sorting: `days.sort()` before use (belt-and-suspenders)

Both charts (tracker at line 2077 and coach at line 1284) use identical logic.

---

## MEDIUM ISSUES

---

### M1. Edit Meal — Photo Option Not Available

**Severity:** Medium  
**File:** `src/components/MealLogModal.astro:996-1022`

**Root Cause:**

In the `openModal()` function, when `prefill` items exist (edit mode), the code at line 1007-1014 skips the choice screen entirely and goes directly to search view:

```javascript
if (prefill && prefill.length) {
    state.items = prefill.map((it) => ({ ...it }));
    renderItems();
    // Skip choice screen — go straight to search so user can add more.
    setView("search");
    // ...
} else {
    setView("choice");
}
```

The choice screen (line 23-37) is the ONLY place where the photo capture and upload buttons appear. Once in edit mode, the user can only search/add foods but cannot take or upload a new photo.

**Impact:**
- Users who logged a meal with incorrect items via search cannot switch to photo analysis for that slot
- Users who want to replace a meal entirely with a photo cannot do so
- The photo_url can still be updated on save (uploadPhoto runs regardless), but there's no UI to trigger a new photo

**Proposed Fix:**

Add a "Take photo" button to the search view when in edit mode, or show the full choice screen with pre-filled items:

```javascript
if (prefill && prefill.length) {
    state.items = prefill.map((it) => ({ ...it }));
    renderItems();
    setView("choice");  // Changed from "search" to "choice"
    // The user can then choose photo or search
}
```

Additionally, add a small "📷 Add photo" button in the items list footer so users can take a photo even after entering edit mode via search.

---

### M2. Supabase Anon Key Appears to Be a Placeholder

**Severity:** Medium  
**Files:**
- `src/lib/supabase.ts:8-9`
- `src/layouts/BaseLayout.astro:79`
- `.env:2`

**Root Cause:**

The Supabase anon key in all three locations is `eyJhbG...V_KM` — this is a truncated/placeholder value, not a valid JWT. A real Supabase anon key is a long base64-encoded string (typically ~170+ characters starting with "eyJhbGciOiJIUzI1NiIs...").

**Impact:**
- If this is the actual key deployed, the Supabase client will fail on ALL operations (auth, database queries, edge function calls, storage uploads)
- This would cause the entire app to fall back to mock/error states everywhere
- The `.env` service role key is also truncated (`eyJhbG...OSjc`) — same issue

**Proposed Fix:**
1. Verify the actual key in the Supabase dashboard (Project Settings → API)
2. Replace the placeholder with the real key
3. Never commit real keys to public repositories — use `.env` for local dev and Supabase secrets for edge functions

---

### M3. Meal Log Confirm Always Uses Today's Date — Past Day Logging Broken

**Severity:** Medium  
**File:** `src/components/MealLogModal.astro:923-978`

**Root Cause:**

In `confirmMeal()`, the `dateISO` is always set to today (line 936):
```javascript
const dateISO = new Date().toISOString().slice(0, 10);
```

The modal has no awareness of the tracker's `viewingDate`. When a user navigates to a past day and tries to log or edit a meal, the meal is saved for TODAY instead of the past day being viewed.

**Impact:**
- Past day navigation is read-only in the current implementation (the grid uses `readOnly` flag), but if a past-day meal is opened for editing, the save will incorrectly overwrite today's entry
- The `onConflict` clause (`user_id,meal_slot,logged_date`) means editing a past-day meal actually upserts into today

**Proposed Fix:**
1. Pass `viewingDate` to the modal via the global `openMealLog` function:
```javascript
(window as any).openMealLog = (slotKey, slotLabel, prefill, dateISO?) => { ... };
```
2. Use the passed date in `confirmMeal()` instead of always using `new Date()`
3. Store the date in `ModalState` alongside slotKey

---

### M4. AI Feedback Persists to Wrong Day on Past-Day Edit

**Severity:** Medium  
**File:** `src/pages/portal/tracker.astro:2360-2371`

**Root Cause:**

The `handleMealLogged` function persists AI feedback to the meal row using `todayISO()`:
```javascript
await sb.from("meal_logs")
    .update({ ai_feedback: result.feedback })
    .eq("user_id", userCtx.user_id)
    .eq("meal_slot", detail.slot)
    .eq("logged_date", todayISO());  // Always today
```

Even without the M3 fix, if viewingDate ≠ todayISO(), the feedback is saved to the wrong row.

**Proposed Fix:** Use `viewingDate` instead of `todayISO()` in the update query.

---

### M5. No RLS Policies in Repository — Database Security Unknown

**Severity:** Medium  
**Files:** None in repo (policies are server-side only)

**Root Cause:**

There are no migration files, no `config.toml`, no SQL policy definitions in the repository. All RLS policies appear to be configured directly in the Supabase cloud dashboard without version control.

**Impact:**
- Cannot verify from code that users can only access their own data
- No disaster recovery for RLS configuration
- Potential for data leaks if policies are misconfigured

**Audit from Query Patterns (what SHOULD be enforced):**

| Table | Required Policy | Query Pattern Used |
|-------|----------------|-------------------|
| `user_profiles` | Users read own row; coaches read team rows | `eq("id", user.id)` / `eq("team_id", ...)` |
| `baseline_intake` | Users read/write own row; coaches read team rows | `eq("user_id", user.id)` |
| `meal_logs` | Users read/write own rows; coaches read team rows | `eq("user_id", user.id)` |
| `daily_weight` | Users read/write own rows; coaches read team rows | `eq("user_id", user.id)` |
| `food_database` | Public read | `.select()` |
| `storage.objects` (meal-photos) | Users access own folder only | Path: `${userId}/${dateISO}/${slotKey}.ext` |

**Proposed Fix:**
1. Export RLS policies from Supabase dashboard and add to repository as `supabase/migrations/`
2. Add a `supabase/config.toml` with project configuration
3. Verify each policy exists with the correct USING/WITH CHECK expressions

---

### M6. Coach Dashboard Query Has No RLS Filter on Cross-Table Queries

**Severity:** Medium  
**Files:**
- `src/pages/portal/coach.astro:810-828`
- `src/lib/auth.ts:148-166`

**Root Cause:**

The coach dashboard queries `baseline_intake`, `daily_weight`, and `meal_logs` WITHOUT filtering by `user_id IN (SELECT id FROM user_profiles WHERE team_id = ...)`. It fetches ALL rows from those tables and filters in JS:

```javascript
// coach.astro:816-818
sb.from("baseline_intake")
    .select("user_id, weight_kg, age, growth_rate, primary_goal, protein_target_g"),
// NO .eq("team_id") or .in("user_id", teamAthleteIds)
```

This works IF RLS policies are correctly configured to only return rows for users in the coach's team. But if RLS is missing or too permissive, a coach could see data for athletes outside their team.

In `auth.ts:154-156`, the `getTeamAthletes` function has the same issue — no `user_id` filter on baselines, weights, or meals queries.

**Proposed Fix:**
1. First, verify RLS policies on these tables include `team_id` scoping
2. As defense-in-depth, add `.in("user_id", athleteIds)` filters to the queries
3. In `coach.astro:loadCoachData`, collect athlete IDs from profiles first, then filter:

```javascript
const athleteIds = profiles.map(p => p.id);
// Then:
sb.from("baseline_intake").select("...").in("user_id", athleteIds)
```

---

## LOW ISSUES

---

### L1. Debug console.log Statements in Production Code

**Severity:** Low  
**File:** `src/components/MealLogModal.astro`
- Line 710: `console.log("[meal-modal] renderItems", ...)`
- Line 727: `console.log("[meal-modal] renderItems showing list/foot", ...)`
- Line 1075: `console.log("[meal-modal] wireModal: searchResults found?", ...)`
- Line 1078: `console.log("[meal-modal] search-results click", ...)`
- Line 1080: `console.log("[meal-modal] closest tk-food-row", ...)`
- Line 1084: `console.log("[meal-modal] row lookup", ...)`
- Line 1093: `console.log("[meal-modal] item pushed, total items:", ...)`

**Impact:** Verbose logging in production console, potential performance impact on mobile, data leaks (log item contents).

**Proposed Fix:** Remove all `console.log` statements or wrap in a debug flag: `if (window.__RISE_DEBUG) console.log(...)`. Keep `console.warn` for actual errors.

---

### L2. AuthModal Has Hardcoded English Strings (Not i18n-Aware)

**Severity:** Low  
**File:** `src/components/AuthModal.astro`

The entire AuthModal uses hardcoded English strings that are NOT connected to the i18n system:

| Line | Hardcoded Text | Should Be |
|------|---------------|-----------|
| 17 | `RISE Portal` | i18n key |
| 18 | `Sign in to access your tools` | i18n key |
| 22 | `Log in` | `common.login` |
| 23 | `Sign up` | i18n key |
| 28 | `Email` | i18n key |
| 33 | `Password` | i18n key |
| 35 | `Log in` | `common.login` |
| 37 | `or` | i18n key |
| 44 | `Continue with Google` | i18n key |
| 51 | `Full name` | i18n key |
| 55 | `Email` | i18n key |
| 59 | `Password` | i18n key |
| 61 | `At least 6 characters` | i18n key |
| 63 | `Create account` | i18n key |
| 64 | `or` | i18n key |
| 72 | `Continue with Google` | i18n key |

Also line 367: `"Logging in..."` and 383: `"Creating account..."` and 393: `"Check your email to confirm your account, then log in."` are hardcoded.

**Proposed Fix:** Add `data-i18n` attributes to all these elements and include translations in `i18n.ts`.

---

### L3. Weight Widget Messages Are Hardcoded English

**Severity:** Low  
**File:** `src/pages/portal/tracker.astro`
- Line 2027: `showWeightNotice("Target updated: ...")` — hardcoded English, not using i18n key `tracker.weight.targetUpdated`
- Line 2029: `setWeightMsg("Weight logged.", "success")` — hardcoded, should use `tracker.weight.logged`
- Line 2048: `setWeightMsg("Enter your weight in kg.", "error")` — hardcoded, should use `tracker.weight.enterPrompt`

**Proposed Fix:** Use `t()` function for these strings. The i18n keys already exist in `i18n.ts`.

---

### L4. Coach"Thinking" Text Is Hardcoded English

**Severity:** Low  
**File:** `src/pages/portal/tracker.astro:2250`
```javascript
textEl.textContent = "Coach is thinking";
```

Should use `t("tracker.feedback.thinking")` which is already defined as "Coach is thinking" / "教練思考中".

---

### L5. Mock Labels Visible to Users

**Severity:** Low  
**Files:**
- `src/pages/portal/tracker.astro:219-220` — "Demo" badge on daily summary
- `src/pages/portal/tracker.astro:241-242` — "Demo feedback" badge on feedback card

These "Demo" labels are visible to real users when the AI service falls back to mock mode. While functional, this creates a negative UX impression.

**Proposed Fix:** Consider hiding the mock badge in production or replacing with a softer label like "Preview" or simply omitting the badge. The mock feedback text itself is still useful.

---

### L6. One-Tap Repeat Uses Yesterday's Foods Without Validation

**Severity:** Low  
**File:** `src/pages/portal/tracker.astro:1735-1753`

When repeating yesterday's meals, the `food_items` array from yesterday is passed directly as `prefill` to `openMealLog`. If the food items have stale `protein_g` values (e.g., if the food database was updated), those stale values persist.

**Proposed Fix:** Optionally re-resolve food items against the current `food_database` when repeating, or at minimum use the same portion values that were logged.

---

### L7. Food Database Seed SQL Uses Simplified Chinese Characters

**Severity:** Low  
**File:** `src/lib/seed-food-database.sql:6`
```
-- All Chinese names use Simplified characters.
```

The comment says "Simplified characters" but the app targets Hong Kong users who primarily use Traditional Chinese characters (Cantonese). The food names are in Simplified Chinese (`鸡胸肉` instead of `雞胸肉`).

**Proposed Fix:** Convert all Simplified Chinese strings to Traditional Chinese for HK audience. Alternatively, offer both and select based on user preference.

---

## POLISH / COSMETIC ISSUES

---

### P1. PWA Service Worker Doesn't Precache Portal Tracker Page

**File:** `public/sw.js:7-18`

The `PRECACHE_URLS` array includes `/` and `/portal` but not `/portal/tracker` — the most-used page. This means the tracker page won't be available offline.

**Proposed Fix:** Add `/portal/tracker` to `PRECACHE_URLS`.

---

### P2. PWA Manifest Name Inconsistent

**File:** `dist/manifest.json:2-3`

The manifest `name` is "RISE Nutrition Tracker" and `short_name` is "RISE Tracker", but the website is branded as "RISE Advancement". This is inconsistent.

**Proposed Fix:** Change to `"name": "RISE Advancement"` and `"short_name": "RISE"`.

---

### P3. No Loading States for Edge Function Calls

**Files:** `src/lib/ai-feedback.ts`, `src/lib/analyze-meal.ts`

When edge functions are slow (cold start, network), there's no timeout indicator or retry logic. The user sees a spinner for an indefinite period.

**Proposed Fix:** Add a timeout (e.g., 15 seconds) with a fallback message. Consider adding an AbortController.

---

### P4. SVG preserveAspectRatio="none" Causes Chart Distortion

**Files:**
- `src/pages/portal/tracker.astro:2168`
- `src/pages/portal/coach.astro:1360`

Both weight charts use `preserveAspectRatio="none"` which stretches the SVG to fill the container. This can cause the chart to look distorted (flattened or stretched) on non-standard aspect ratios.

**Proposed Fix:** Use `preserveAspectRatio="xMidYMid meet"` to maintain aspect ratio while centering.

---

### P5. No Error Boundary for Failed AI Calls on Initial Load

**File:** `src/pages/portal/tracker.astro:2290-2313`

`refreshDailySummary()` has a catch that only logs a warning. If the daily summary fails, the card remains hidden with no indication to the user that something went wrong.

**Proposed Fix:** Show an error state or a "Retry" button in the summary card.

---

### P6. Missing Empty State for Weight Chart on 30-Day View

**File:** `src/pages/portal/tracker.astro:2092-2097`

The empty state text is the same for both 7-day and 30-day views. On 30-day, if only 1-2 data points exist, the chart is shown as a dot or short line, which might confuse users.

**Proposed Fix:** When points.length < 2, show a more helpful message like "Log weight for at least 2 more days to see a trend".

---

### P7. Past Day Badge Doesn't Update on Language Toggle

**File:** `src/pages/portal/tracker.astro:144`

The "Past day" badge text is set via `data-i18n` attribute and updated in `applyTrackerTranslations()`, but it's also managed by `toggleAttribute("hidden")` — these two mechanisms could conflict.

**Proposed Fix:** Ensure `rerenderDynamic()` or `applyTrackerTranslations()` called after lang switch also respects the badge visibility state.

---

### P8. Missing aria-labels on Dynamic Meal Slot Cards

**File:** `src/pages/portal/tracker.astro:1709-1787`

The meal slot cards created dynamically have `role="button"` and `aria-label` set to the slot label, but the inner buttons ("+ Log meal" and "↻ Repeat yesterday") don't have unique aria-labels for screen readers.

**Proposed Fix:** Add more descriptive aria-labels to the inner buttons, e.g., `aria-label="Log breakfast meal"`.

---

## DATA INTEGRITY SUMMARY

### meal_logs table
- UPSERT pattern: `{onConflict: "user_id,meal_slot,logged_date"}` — correct, ensures one entry per slot per day
- food_items stored as JSONB array — correct
- ai_feedback updated separately from insert — potential race condition if feedback update happens before initial insert completes
- photo_url is null when no photo — correct

### daily_weight table
- UPSERT pattern: `{onConflict: "user_id,logged_date"}` — correct
- Weight change triggers protein target recalculation (line 1996-2020) — correct but NOTE: this silently updates baseline_intake, which means the "original" baseline weight is lost forever

### baseline_intake table
- UPSERT pattern: `{onConflict: "user_id"}` — correct for single baseline
- Misses height field (see C2)
- Weight updates overwrite original baseline (no history)

### RLS Policies
- Cannot verify from repository code — policies are server-side only
- Every query uses `user_id` filter pattern, so RLS should match
- Coach queries need `team_id` scoping on cross-table reads

---

## AI FEATURE AUDIT

### analyze-meal Edge Function
- **Model:** `openai/gpt-4o-mini` (vision-capable)
- **Prompt:** Well-structured sports nutritionist persona, asks for JSON output with name/name_zh/portion/protein_g/confidence
- **Image format:** base64 JPEG via `data:image/jpeg;base64,...`
- **Temperature:** 0.2 (low creativity — good for analysis)
- **Max tokens:** 1000 (adequate for meal items)
- **Fallback:** Not self-contained — relies on client-side mock when API key missing
- **Issue:** Response parsing strips markdown fences but doesn't handle all edge cases (e.g., the model might return text before the JSON array)

### ai-feedback Edge Function
- **Model:** `deepseek/deepseek-chat-v3-0324` (text-only)
- **System prompt:** Detailed persona (supportive older brother, HK-specific, under 50 words)
- **Data sent:** weight, age, goal, name, meal slot, time of day, food list with protein, daily total vs target, percentage
- **Language-aware:** ZH prompt uses Cantonese-style language
- **Temperature:** 0.7 (creative but not wild)
- **Max tokens:** 150 (tight for 50-word output with some buffer)
- **Mock fallback:** Rule-based thresholds (80%, 50%), HK-themed food suggestions
- **Issue:** No retry on empty completion — just throws

### daily-summary Edge Function
- **Model:** `deepseek/deepseek-chat-v3-0324`
- **System prompt:** Request JSON `{summary, highlight, tip}`, under 80 words combined
- **Data sent:** weight, age, goal, full meals list with food items, daily total, target, percentage
- **JSON parsing:** Handles markdown fences and extracts JSON objects from surrounding text
- **Temperature:** 0.7
- **Max tokens:** 300 (sufficient for JSON + content)
- **Mock fallback:** Smart — calculates best meal, uses tiered thresholds (90% for hit)
- **Issue:** Daily summary only triggers when 3+ meals are logged; users with 1-2 meals never see it

---

## FULL ATHLETE FLOW WALKTHROUGH

### Auth Flow
- **Signup:** Email + password + full name via `AuthModal.astro:375-400` → `sb.auth.signUp()` → creates `user_profiles` row on redirect
- **Login:** Email + password via `AuthModal.astro:360-373` → redirects to `/portal`
- **Google OAuth:** `sb.auth.signInWithOAuth({ provider: "google", redirectTo: "/portal" })` → redirects to Google → returns to `/portal`
- **User profile creation:** `ensureProfile()` at `tracker.astro:2396-2411` and `index.astro:458-474` — inserts `user_profiles` row if missing
- **OAuth user name:** Falls back to `user.user_metadata.full_name` or `user.user_metadata.name`

### Onboarding (Baseline Intake)
1. **Step 1:** Weight in kg (min 20, max 200)
2. **Step 2:** Age in years (min 8, max 25)
3. **Step 3:** Growth rate (fast/moderate/slow) — choice buttons
4. **Step 4:** Goal (muscle_gain/maintenance/recomposition/fat_loss) — choice buttons
5. **Step 5:** Result — calculated protein target with detail string
6. **Save:** UPSERTs `baseline_intake` + inserts initial `daily_weight` for today
7. **Missing:** Height (see C2)

### Portal Dashboard
- Shows "Welcome, {firstName}" with protein target card
- Tools grid: Nutrition Tracker (active), Workouts (coming soon), Game Review (coming soon)
- Coaches are redirected to `/portal/coach`

### Tracker Page
- **Top bar:** Welcome back + date with prev/next navigation + portal link
- **Protein target card:** Displays daily target
- **Progress bar:** Current g / Target g with percentage, fill animation
- **Weight widget:** Input or edit weight for today; read-only for past days
- **Weight chart:** 7d/30d toggle, SVG line chart with dots and gridlines
- **Daily summary card:** Coach's daily read (appears when 3+ meals logged)
- **Meal grid:** 2-column grid of 6 meal slots (breakfast, snack_1, lunch, snack_2, dinner, snack_3)
- **AI feedback card:** Appears after logging a meal, auto-dismisses after 10 seconds

### Meal Logging (3 methods)
1. **Search food:** Loads `food_database` cache → debounced search → click to add
2. **Take photo:** Opens camera (capture="environment") → sends to analyze-meal edge function → returns AI-identified items
3. **Upload photo:** Opens file picker (no capture attribute) → same analyze flow

### Meal Editing
- Click a logged meal card → opens modal in edit mode (prefill items)
- Can add more items via search
- Can remove items
- **Cannot take a new photo** (see M1)

### Past Days Navigation
- Previous day arrow navigates backward
- Next day arrow disabled when at today
- Past day badge shown
- Meal grid is read-only (can view but cannot edit)

### One-Tap Repeat
- If a slot was logged yesterday but not today, a "↻ Repeat yesterday" button appears
- Copies yesterday's food_items directly to today's slot
- Shows total protein from yesterday

### Bilingual Toggle
- Floating pill button (top-right) toggles EN/ZH
- All tracker labels, modal text, meal slot names are translated
- Food display names prefer name_zh when in ZH mode
- `document.documentElement.lang` updates to `zh-HK` or `en`
- **AuthModal is NOT translated** (see L2)
- **Some hardcoded strings remain** (see L3, L4)

### PWA
- Service worker: Cache-first for static assets, network-first for navigation, skips Supabase/API caching
- Install banner: Appears on portal pages, uses `beforeinstallprompt` event
- Manifest: Icons, standalone display, portrait orientation, red theme color
- Missing: `/portal/tracker` in precache (see P1)

---

## FILE INDEX

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/portal/tracker.astro` | 2458 | Main tracker page — intake, app shell, weight widget, chart, meals, AI |
| `src/components/MealLogModal.astro` | 1107 | Meal logging modal — photo/search/upload, confirm, upload |
| `src/lib/analyze-meal.ts` | 125 | Photo analysis client wrapper + mock fallback |
| `src/lib/ai-feedback.ts` | 184 | AI feedback + daily summary client wrappers + mock fallbacks |
| `src/lib/i18n.ts` | 440 | Translation registry (EN + ZH) + language get/set |
| `src/lib/auth.ts` | 213 | Auth helpers + user role + team athlete queries |
| `src/lib/supabase.ts` | 37 | Supabase client config (placeholder key) |
| `src/pages/portal/index.astro` | 507 | Portal dashboard — auth gate, protein target, tool cards |
| `src/pages/portal/coach.astro` | 1490 | Coach dashboard — team view, alerts, table, drawer drill-down |
| `src/components/AuthModal.astro` | 421 | Login/signup/Google OAuth modal |
| `src/layouts/BaseLayout.astro` | 268 | HTML shell — fonts, PWA, Supabase CDN init, install banner |
| `src/styles/design-system.css` | 237 | Tailwind theme + CSS vars — colors, fonts, spacing |
| `supabase/functions/analyze-meal/index.ts` | 137 | Edge function — GPT-4o-mini vision meal analysis |
| `supabase/functions/ai-feedback/index.ts` | 227 | Edge function — DeepSeek V3 coach feedback |
| `supabase/functions/daily-summary/index.ts` | 293 | Edge function — DeepSeek V3 daily summary |
| `src/lib/seed-food-database.sql` | 274 | 200+ food items seed data (Simplified Chinese) |
| `public/sw.js` | 141 | PWA service worker — cache strategies |
| `dist/manifest.json` | 43 | PWA manifest — icons, theme, display mode |

---

## PRIORITY ACTION ITEMS

1. **IMMEDIATE:** Set `OPENROUTER_API_KEY` as Supabase secret — unblocks AI features (C1)
2. **IMMEDIATE:** Verify Supabase anon key is valid — unblocks entire app (M2)
3. **HIGH:** Add height collection to onboarding flow — impacts athlete profiles (C2)
4. **HIGH:** Add photo option to edit mode — usability gap (M1)
5. **HIGH:** Export RLS policies from Supabase and add to repo — security auditability (M5)
6. **MEDIUM:** Fix past-day meal saving date bug — data integrity (M3)
7. **MEDIUM:** Add team-scoped filtering on coach queries — defense-in-depth (M6)
8. **LOW:** Remove debug console.log statements — production cleanup (L1)
9. **LOW:** i18n-ize AuthModal and hardcoded strings (L2, L3, L4)
10. **LOW:** Convert food database to Traditional Chinese for HK audience (L7)
