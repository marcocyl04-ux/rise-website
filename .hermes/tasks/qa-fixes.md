# RISE Nutrition Tracker — Bug Fix Spec

## Context
QA testing found 7 bugs (2 critical, 3 high, 2 medium). Fix all of them. Site is at ~/Desktop/rise-website/ (Astro 6 + Tailwind 4 + Supabase).

## Bug #1: "+ Log meal" button non-functional (CRITICAL)
**File:** src/pages/portal/tracker.astro, lines ~1775-1800
**Symptom:** Clicking "+ Log meal" on unlogged meal slots does nothing. No MealLogModal opens.
**Code analysis:** The `.tk-log-btn` button is rendered inside a card div that has a click handler (line 1789). The click handler calls `open()` which calls `window.openMealLog()`. The function IS defined in MealLogModal.astro (line 1089). Possible causes:
- Script execution order: `window.openMealLog` might not be defined when the card click handler fires
- The `.tk-log-btn` button might be capturing the click and not bubbling
- The `e.target.closest("[data-repeat]")` check might be interfering
**Fix:** Ensure the click handler works. Consider adding a direct click handler to `.tk-log-btn` elements instead of relying on event bubbling through the card. Also ensure `window.openMealLog` is defined before the tracker script runs.

## Bug #2: Language toggle non-functional in tracker (CRITICAL)
**File:** src/pages/portal/tracker.astro, lines ~1389-1397
**Symptom:** Clicking "中文" button does nothing. Content stays in English.
**Code analysis:** `wireLangToggle()` exists and looks correct. It adds a click listener that calls `setLang(next)` and `applyTrackerTranslations()`. Possible causes:
- `wireLangToggle()` might never be called during initialization
- `applyTrackerTranslations()` might not be re-rendering the dynamic meal grid content
**Fix:** Ensure `wireLangToggle()` is called during app initialization. Ensure `applyTrackerTranslations()` also re-renders the meal grid (it has code for this at line 1383-1384 but may not be working).

## Bug #3: Sign-up with empty fields shows blank page (HIGH)
**File:** src/components/AuthModal.astro, lines ~385-405
**Symptom:** Clicking "Create account" with empty fields causes blank page.
**Code analysis:** The signup form handler doesn't validate empty fields before calling `sb.auth.signUp()`. Supabase might throw an unhandled error.
**Fix:** Add validation before the Supabase call:
- Check full_name is not empty
- Check email is not empty and valid format
- Check password is at least 6 characters
- Show validation errors via `setMsg(signupMsg, ...)`

## Bug #4: No error message for invalid login (HIGH)
**File:** src/components/AuthModal.astro, lines ~370-383
**Symptom:** Login with wrong credentials shows no error message.
**Code analysis:** The error handler exists at line 379: `if (error) return setMsg(loginMsg, error.message, "error")`. Possible causes:
- `getSb()` returns null (Supabase client not initialized)
- The error message element is hidden or has CSS issues
- The Supabase call fails silently before returning an error
**Fix:** Add a check for empty email/password before calling Supabase. Ensure the error message is visible. Add a fallback error message if Supabase client is unavailable.

## Bug #5: Weight value disappears after interactions (HIGH)
**File:** src/pages/portal/tracker.astro
**Symptom:** "72.2 kg today" disappears from weight widget after clicking language toggle or meal buttons.
**Fix:** Investigate the `renderWeightWidget()` function and ensure it properly shows the weight value. The issue might be that certain interactions trigger a partial re-render that hides the weight display.

## Bug #6: Progress percentage capped at 100% (MEDIUM)
**File:** src/pages/portal/tracker.astro, line 1728
**Code:** `const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;`
**Fix:** Remove the `Math.min(100, ...)` cap. Allow percentage to exceed 100% when user exceeds their target. The progress bar fill should still cap at 100% width, but the text should show the actual percentage.

## Bug #7: Weight spinbutton floating point precision (MEDIUM)
**File:** src/pages/portal/tracker.astro
**Symptom:** Weight edit input shows "72.19999694824219" instead of "72.2"
**Fix:** Round the weight value to 1 decimal place when setting the input value. Use `Math.round(value * 10) / 10` or `value.toFixed(1)`.

## Testing
After fixing, run `npm run build` to verify no build errors. The site deploys to Vercel automatically on push.
Test credentials: jason@test.rise / test123456

## Files to modify
- src/pages/portal/tracker.astro (bugs 1, 2, 5, 6, 7)
- src/components/AuthModal.astro (bugs 3, 4)
- src/components/MealLogModal.astro (bug 1, if needed)
