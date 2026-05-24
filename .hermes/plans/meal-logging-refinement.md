# Meal Logging Refinement Plan

**Date:** May 24, 2026
**Status:** APPROVED
**Goal:** Fix the meal logging flow to match how people actually eat, not how we wish they ate.
**Source:** Marco's real-world usage feedback + full UX audit (13 friction points)

---

## Overview

The meal logging flow was designed for the ideal case: one photo per meal slot, one time per day. Real life is messy. People forget to photograph, eat twice in a slot, need to correct portions, and log late. This plan fixes the core logging experience across 3 phases.

**What changes:**
- Input simplified: Photo, Upload, Text to AI (kill Search and Protein Shake buttons)
- Slots become additive: re-logging appends items, doesn't overwrite
- Portion editing: re-type to AI (no stepper UI)
- 10 UX friction points fixed

**What stays the same:**
- 6 meal slots (breakfast/snack1/lunch/snack2/dinner/snack3)
- Photo analysis via Gemini 2.5 Flash
- Text analysis via MiMo v2.5
- AI feedback via DeepSeek V3
- Macro tracking (protein/calories/fat/sugar)
- Coach dashboard and RLS policies

**Cost impact:** None. Text AI costs $0.00016/analysis. Monthly for 15 users: ~$2 total.

---

## Phase 1: Input + Storage (Structural Core)

These three changes are tightly coupled. They modify how the modal collects items and how it saves. Build together, test together, deploy together.

### 1.1 Simplify Input to 3 Paths

**What:** Replace the 4-button choice screen (Photo, Upload, Search, Protein Shake) with 3 buttons (Photo, Upload, Text to AI).

**Why:** Search requires users to know exact food names from the database. Protein shake is niche. Text-to-AI is the most natural input when you didn't take a photo. Currently, text is buried behind photo upload as a "Not right?" correction.

**How:**
- Choice screen: 3 buttons instead of 4
- "Text to AI" button becomes first-class (same prominence as Photo)
- Remove the "Protein Shake" button and its picker flow
- Remove the "Search food" button and its type-ahead flow
- Keep the "+ Add more" button in the items view (it can open text input or photo, not search)
- The "Not right? Tell us what you had" button after photo analysis stays (it opens the same text input)

**Files to modify:**
- `src/components/MealLogModal.astro` (choice screen, button handlers)
- `src/lib/i18n.ts` (new keys for text input button, remove search/shake keys)

**Verification:**
- Open modal → see 3 buttons: Photo, Upload, Text
- Tap "Text" → text input appears immediately
- Type "fried chicken and rice" → AI returns items
- No search or protein shake buttons visible anywhere

### 1.2 Make Slots Additive (Append, Don't Replace)

**What:** When logging a meal to a slot that already has items, new items are ADDED to the existing list, not replaced.

**Why:** Real eating pattern: 5pm fried chicken, 7pm pasta. Both should be in the dinner slot. Currently, the second log wipes the first.

**How:**
- When opening a logged slot, pre-populate `state.items` with existing `food_items` from the database
- New photo/text analysis APPENDS to `state.items` instead of replacing it
- The confirm button saves the full combined list
- The remove button (×) still works for individual items
- The upsert stays (same DB constraint), but `food_items` starts from what's already there

**DB impact:** None. The `food_items` JSONB column already holds an array. We're just changing what populates it.

**Files to modify:**
- `src/components/MealLogModal.astro` (`openModal()`, `handlePhoto()`, text analysis flow, `confirmMeal()`)
- `src/pages/portal/tracker.astro` (how `openModal` is called with existing data)

**Verification:**
- Log fried chicken to dinner slot → confirm → see it in tracker
- Open dinner slot again → see fried chicken already listed
- Take photo of pasta → pasta appears BELOW fried chicken
- Confirm → dinner slot now shows both items
- Remove fried chicken (×) → dinner slot shows only pasta
- Macros update correctly for the combined list

### 1.3 Portion Editing via Re-type to AI

**What:** No dedicated portion editing UI. Users correct portions by typing to the AI (e.g., "I had 3 pieces not 2").

**Why:** Building a stepper UI is over-engineering for this user base. Teens at meal time want speed. Re-typing to AI is the simplest correction path, and it works for both photo-inaccuracies and text refinements.

**How:**
- After any analysis (photo or text), user can type a correction in the text input
- The correction re-runs AI analysis and REPLACES the current items (this is the one case where replacement makes sense — you're correcting, not adding)
- Alternatively, user can remove wrong items (×) and re-add via text/photo
- No stepper, no quantity dropdown, no inline editing

**Key distinction:** Correction (re-type to AI) replaces items. Addition (new photo/text to a logged slot) appends items. The modal needs to know which mode it's in:
- **Add mode:** Opening an empty slot, or adding to a logged slot → append
- **Correct mode:** User explicitly correcting existing items → replace

**Files to modify:**
- `src/components/MealLogModal.astro` (add vs correct mode logic)

**Verification:**
- Photo identifies "2 pieces fried chicken" → user types "I had 3 pieces of fried chicken" → items update to 3 pieces
- Remove wrong item, add correct one via text → works smoothly

---

## Phase 2: UX Polish (Friction Removal)

These are isolated UI changes. Each is independent. Can be done in any order within the phase.

### 2.1 Unlock Past-Day Logging

**What:** Allow logging meals for past days (yesterday, etc.).

**Why:** Kids forget. If they didn't log lunch yesterday, they should be able to backfill. The backend already supports it (`dateISO` parameter), but the UI blocks it.

**How:**
- `tracker.astro`: Change `readOnly` guard to allow opening the modal for past days
- Past-day slots show a "Log" button (not just "Not logged" text)
- Modal title shows the date (e.g., "Lunch · May 23")
- Past-day meals are still editable (open, add/remove items, confirm)

**Files to modify:**
- `src/pages/portal/tracker.astro` (readOnly logic in `renderMealGrid()`)

**Verification:**
- Navigate to yesterday → empty slots show "Log" button
- Tap slot → modal opens with correct date
- Log a meal → saves to yesterday's date
- Navigate back to today → yesterday shows logged meal

### 2.2 Discard Warning on Close

**What:** Warn user before closing modal if they have unsaved items.

**Why:** Accidentally tapping the backdrop or × button loses all work silently.

**How:**
- `closeModal()`: check if `state.items.length > 0`
- If items exist: show confirmation ("Discard X items?")
- If no items: close immediately
- "Confirm" button in modal should not trigger discard warning (it saves, then closes)

**Files to modify:**
- `src/components/MealLogModal.astro` (`closeModal()`, backdrop/× handlers)

**Verification:**
- Add items → tap backdrop → warning appears
- Tap "Cancel" → modal stays, items preserved
- Tap "Discard" → modal closes, items lost
- Add items → tap "Confirm" → saves and closes (no warning)

### 2.3 Cancel During AI Analysis

**What:** Show a cancel button while AI is processing a photo or text.

**Why:** If AI takes 15+ seconds, user is stuck waiting with no escape. The × button exists but only hides the modal, doesn't stop the request.

**How:**
- Show "Cancel" button during analysis loading state
- Cancel: abort the fetch request (AbortController), return to choice screen
- If analysis completes after cancel: discard results silently

**Files to modify:**
- `src/components/MealLogModal.astro` (`handlePhoto()`, text analysis flow)
- `src/lib/analyze-meal.ts` (accept AbortSignal parameter)

**Verification:**
- Start photo analysis → "Cancel" button visible
- Tap "Cancel" → returns to choice screen immediately
- No items added, no error shown

### 2.4 Handle Silent Photo Upload Failure

**What:** Tell the user if their photo didn't attach to the meal log.

**Why:** Currently, if Supabase storage upload fails, the meal saves without the photo and the user is never told.

**How:**
- `uploadPhoto()`: on failure, show a toast/banner: "Photo couldn't be saved. Your meal was still logged."
- Don't block the meal save — the food items are already identified
- Offer a "Retry photo" option if possible

**Files to modify:**
- `src/components/MealLogModal.astro` (`uploadPhoto()`, error handling)

**Verification:**
- Simulate upload failure (disconnect network briefly)
- Meal saves successfully
- User sees "Photo couldn't be saved" message
- Meal appears in tracker without photo (not broken)

### 2.5 Save Loading Spinner

**What:** Show a spinner animation during "Saving..." instead of plain text.

**Why:** Plain text feels broken on slow connections. A spinner signals "working on it."

**How:**
- Replace "Saving..." text with a spinner + "Saving..." text
- Disable Confirm button during save (already done, but verify)
- Show spinner until DB write completes

**Files to modify:**
- `src/components/MealLogModal.astro` (save loading state)

**Verification:**
- Tap Confirm → spinner appears immediately
- Save completes → spinner disappears, modal closes
- On slow connection: spinner visible for 2-3 seconds (not static text)

### 2.6 Repeat Yesterday Context

**What:** When repeating yesterday's meal, show context (e.g., "Repeating yesterday's breakfast").

**Why:** Currently shows "Edit · Breakfast" which is confusing. User doesn't know items are from yesterday.

**How:**
- When `openModal` is called with yesterday's items (repeat button), set a flag or title
- Modal title: "Yesterday's Breakfast" instead of "Edit · Breakfast"
- Items appear with a subtle "From yesterday" label or different styling

**Files to modify:**
- `src/pages/portal/tracker.astro` (repeat button logic)
- `src/components/MealLogModal.astro` (title logic)

**Verification:**
- Tap repeat button on breakfast slot → modal says "Yesterday's Breakfast"
- Items pre-filled from yesterday
- User can add/remove items normally
- Confirm saves to today's date (not yesterday's)

### 2.7 Text Input Guidance

**What:** Better placeholder text and hints for the text input field.

**Why:** Users might write paragraphs and get poor AI results. Short descriptions work better.

**How:**
- Placeholder: "What did you eat? (e.g., chicken rice, 2 eggs, protein shake)"
- Optional: show a subtle hint below the input: "Short descriptions work best"
- No character limit, but guide toward conciseness

**Files to modify:**
- `src/components/MealLogModal.astro` (text input placeholder)
- `src/lib/i18n.ts` (new placeholder keys)

**Verification:**
- Open text input → placeholder shows helpful examples
- Type short description → AI returns good results
- Type long paragraph → AI still works (no breaking)

### 2.8 Mock Data Visual Marker

**What:** Visually distinguish mock/fallback data from real AI analysis.

**Why:** When AI fails and mock kicks in, items look identical to real data. User might log fake data thinking it's real.

**How:**
- When `result.mock === true`, add a visual indicator to each item (e.g., "⚠ Estimated" badge, or different background color)
- Status text already shows a notice, but items need marking too
- User can still confirm and log mock data (it's better than nothing)

**Files to modify:**
- `src/components/MealLogModal.astro` (`renderItems()`, mock flag propagation)

**Verification:**
- Trigger mock fallback (disconnect edge function)
- Items show "Estimated" marker
- Status text shows mock notice
- User can still confirm and save

---

## Phase 3: Performance + Reliability

These touch the post-save flow. Do last because they don't affect the logging experience itself.

### 3.1 AI Feedback Parallel Execution

**What:** Run grid refresh and AI feedback request in parallel instead of sequentially.

**Why:** Currently, `loadAppShell()` completes before `getMealFeedback()` starts. If grid refresh takes 2s and feedback takes 3s, user waits 5s total. In parallel: 3s total.

**How:**
- `handleMealLogged()`: fire `loadAppShell()` and `getMealFeedback()` simultaneously with `Promise.all()`
- Grid updates as soon as data loads
- Feedback card appears when ready (may be slightly after grid)
- Both resolve independently

**Files to modify:**
- `src/pages/portal/tracker.astro` (`handleMealLogged()`)

**Verification:**
- Log a meal → grid updates within 1-2s
- Feedback card appears 1-3s after grid (not stacked sequentially)
- Total time from save to feedback visible: ~3s (not 5s)

### 3.2 AI Feedback Save Retry

**What:** Retry saving AI feedback to the database if the first attempt fails.

**Why:** Currently, if `meal_logs.update({ ai_feedback })` fails, the feedback shows on screen but is lost on next reload. No retry, no warning.

**How:**
- On save failure: retry once after 2 seconds
- If retry fails: show a subtle warning ("Feedback couldn't be saved, but your meal was logged")
- Don't block the UI — the feedback is already visible

**Files to modify:**
- `src/pages/portal/tracker.astro` (feedback save logic in `handleMealLogged()`)

**Verification:**
- Simulate DB failure on first attempt
- Retry fires after 2s
- If retry succeeds: feedback persists on reload
- If retry fails: user sees warning, meal still logged

---

## Dependencies and Order

```
Phase 1 (build together, test together):
  1.1 Input simplification ──┐
  1.2 Additive slots ────────┼── coupled (same modal code)
  1.3 Portion via re-type ───┘

Phase 2 (any order, all independent):
  2.1 Past-day logging
  2.2 Discard warning
  2.3 Cancel during analysis
  2.4 Photo upload failure
  2.5 Save spinner
  2.6 Repeat yesterday context
  2.7 Text input guidance
  2.8 Mock data marker

Phase 3 (after Phase 1+2 deployed):
  3.1 Parallel feedback ──┐
  3.2 Feedback retry ─────┴── independent, can be done together
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Additive slots break coach dashboard | Low | High | Dashboard reads `food_items` JSONB, not individual rows. Should work. Test with coach account after deploy. |
| Text AI cost spiral | Very Low | Low | $0.00016/analysis. Even 1000 analyses/day = $0.16. Not a real risk. |
| Modal complexity increase (add vs correct mode) | Medium | Medium | Keep the logic simple. Add = append. Correct = replace. Clear mental model. |
| Past-day logging creates data inconsistency | Low | Low | Backend already supports it. Just unlock the UI. |
| Users type garbage into text AI | Medium | Low | AI is robust. Even "stuff" returns some result. Worst case: mock fallback with visual marker. |

---

## Done Criteria (for this plan)

**Kid experience:**
- Open modal → 3 buttons: Photo, Upload, Text
- Type what you ate → AI returns items in 5 seconds
- Take photo → AI identifies food → can adjust via text
- Eat twice in one slot → both meals show up
- Close accidentally → warning before losing work
- Yesterday's missed meal → can backfill

**Coach experience:**
- No change to coach dashboard (it reads final data)
- Data quality improves (more complete logs, fewer gaps)

**System:**
- All 13 items implemented and verified
- No regressions in existing functionality
- Deployed to Vercel
- Tested on mobile viewport (375px)

---

## Files Modified (Summary)

| File | Phase | Changes |
|------|-------|---------|
| `src/components/MealLogModal.astro` | 1, 2 | Input simplification, additive slots, discard warning, cancel, photo failure, spinner, text guidance, mock markers |
| `src/pages/portal/tracker.astro` | 1, 2, 3 | Past-day logging, repeat context, parallel feedback, retry |
| `src/lib/analyze-meal.ts` | 2 | AbortSignal support |
| `src/lib/i18n.ts` | 1, 2 | New keys for text input, placeholders, warnings |

---

## Next Session After This

Other nutrition tracker improvements (deferred):
- One-tap repeat of yesterday's meals (partially addressed by 2.6)
- Parent weekly summary
- Coach weekly summary digest
- Compliance streak tracking
- Hockey-contextualized AI feedback
- Training schedule integration
- HK food database expansion
- Mobile responsive testing (Marco says already fine)
- Onboarding flow testing (Marco says already fine)
