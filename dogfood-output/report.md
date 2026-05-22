# Dogfood QA Report

**Target:** https://riseadvancement.com
**Date:** 2026-05-22
**Scope:** Full site exploratory QA — landing page, auth flow, nutrition tracker, language toggle, navigation
**Tester:** Hermes Agent (automated exploratory QA)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 3 |
| 🟡 Medium | 2 |
| 🔵 Low | 1 |
| **Total** | **8** |

**Overall Assessment:** The landing page and auth flow are solid (0 console errors throughout). The nutrition tracker has two critical interaction bugs (meal logging and language toggle completely broken) that block core user workflows. Several display/state issues degrade the experience.

---

## Issues

### Issue #1: "+ Log meal" button non-functional (Critical)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | /portal/tracker |

**Description:**
Clicking the "+ Log meal" button on any unlogged meal slot (Snack 2, Dinner) does nothing. No meal logging modal opens. The meal card display collapses instead (loses "✓ Logged" detail text, weight value disappears, coach content collapses). The "Repeat yesterday" button has the same behavior.

**Steps to Reproduce:**
1. Log in as jason@test.rise
2. Navigate to /portal/tracker
3. Click "+ Log meal" on Snack 2 or Dinner

**Expected Behavior:**
Meal logging modal opens (photo/upload/search options)

**Actual Behavior:**
No modal opens. Meal card display collapses. No console error.

---

### Issue #2: Language toggle non-functional inside tracker (Critical)

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Functional |
| **URL** | /portal/tracker |

**Description:**
The "中文" language toggle button inside the nutrition tracker does nothing when clicked. All tracker content remains in English. The button label stays "中文" (should change to "EN"). The landing page toggle works correctly, but the tracker toggle is broken.

**Steps to Reproduce:**
1. Log in as jason@test.rise
2. Navigate to /portal/tracker
3. Click the "中文" toggle button

**Expected Behavior:**
Tracker content switches to Traditional Chinese

**Actual Behavior:**
Nothing changes. Button stays "中文", all text stays English. No console error.

---

### Issue #3: Sign-up with empty fields shows blank page (High)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Functional |
| **URL** | / (auth modal) |

**Description:**
Clicking "Create account" on the sign-up tab with all fields empty causes the entire page to go blank. No validation errors shown. User has to navigate back manually.

**Steps to Reproduce:**
1. Click "Log in" on landing page
2. Switch to "Sign up" tab
3. Click "Create account" without filling any fields

**Expected Behavior:**
Inline validation errors ("Name is required", "Email is required", etc.)

**Actual Behavior:**
Entire page goes blank (empty body). No error messages.

---

### Issue #4: No error message for invalid login credentials (High)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | UX |
| **URL** | / (auth modal) |

**Description:**
Logging in with invalid credentials (bad@email.com / wrongpassword) provides no feedback. The modal stays open with credentials still in fields. No error message, no visual indication of failure.

**Steps to Reproduce:**
1. Click "Log in" on landing page
2. Enter invalid email and password
3. Click "Log in"

**Expected Behavior:**
Error message like "Invalid email or password"

**Actual Behavior:**
Modal stays open, no feedback. No console error.

---

### Issue #5: Weight value disappears after interactions (High)

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Visual |
| **URL** | /portal/tracker |

**Description:**
The weight display "72.2 kg today" disappears from the "TODAY'S WEIGHT" section after certain interactions (language toggle click, meal button clicks). The "Edit" button remains visible but the actual weight value is hidden. Refreshing the page restores it.

**Steps to Reproduce:**
1. Navigate to /portal/tracker (weight shows "72.2 kg today")
2. Click the language toggle or any meal button
3. Weight value disappears, only "Edit" button visible

**Expected Behavior:**
Weight value remains visible regardless of other interactions

**Actual Behavior:**
Weight value text disappears from DOM

---

### Issue #6: Progress percentage capped at 100% (Medium)

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Functional |
| **URL** | /portal/tracker (past day view) |

**Description:**
When viewing past day (May 21), progress shows "189g / 136.8g" with "100%". Actual ratio is 189/136.8 = 138%. The percentage is capped at 100% instead of showing the true value. This misleads users who exceeded their target.

**Steps to Reproduce:**
1. Navigate to /portal/tracker
2. Click "Previous day" to view May 21
3. Observe progress shows "100%" with 189g consumed vs 136.8g target

**Expected Behavior:**
Show "138%" or "138% (exceeded)" to reflect actual performance

**Actual Behavior:**
Shows "100%" — user doesn't know they exceeded target by 38%

---

### Issue #7: Weight edit spinbutton floating point precision (Medium)

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Visual |
| **URL** | /portal/tracker |

**Description:**
Clicking "Edit weight" shows a spinbutton with value "72.19999694824219" instead of "72.2". Classic floating point precision issue in JavaScript.

**Steps to Reproduce:**
1. Navigate to /portal/tracker
2. Click "Edit" on the weight widget
3. Observe the spinbutton value

**Expected Behavior:**
Show "72.2" (rounded to 1 decimal place)

**Actual Behavior:**
Shows "72.19999694824219"

---

### Issue #8: Mixed Simplified/Traditional Chinese on landing page (Low)

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Content |
| **URL** | / (landing page, ZH mode) |

**Description:**
The heading "不只是一个计划" uses the Simplified Chinese character 个 instead of Traditional Chinese 個. The rest of the page correctly uses Traditional Chinese (繁體中文).

**Steps to Reproduce:**
1. Click "Switch to 中文" on landing page
2. Scroll to the "NOT JUST A PROGRAM" section

**Expected Behavior:**
"不只是一个計劃" with Traditional Chinese characters throughout

**Actual Behavior:**
"不只是一个计划" — 个 (Simplified) mixed with Traditional text

---

## Issues Summary Table

| # | Title | Severity | Category | URL |
|---|-------|----------|----------|-----|
| 1 | "+ Log meal" button non-functional | 🔴 Critical | Functional | /portal/tracker |
| 2 | Language toggle broken in tracker | 🔴 Critical | Functional | /portal/tracker |
| 3 | Sign-up empty fields → blank page | 🟠 High | Functional | / (auth modal) |
| 4 | No error for invalid login | 🟠 High | UX | / (auth modal) |
| 5 | Weight value disappears after interactions | 🟠 High | Visual | /portal/tracker |
| 6 | Progress % capped at 100% | 🟡 Medium | Functional | /portal/tracker |
| 7 | Weight spinbutton floating point | 🟡 Medium | Visual | /portal/tracker |
| 8 | Mixed Simplified/Traditional Chinese | 🔵 Low | Content | / (ZH mode) |

## Testing Coverage

### Pages Tested
- Landing page (/) — EN and ZH modes
- Auth modal — login tab, sign-up tab
- Portal dashboard (/portal)
- Nutrition tracker (/portal/tracker) — today view, past day view
- Logout flow

### Features Tested
- Language toggle (landing page ✓, tracker ✗)
- Login with valid credentials ✓
- Login with invalid credentials (no error message)
- Sign-up form validation (blank page on empty submit)
- Logout ✓
- Meal card interactions (+ Log meal, Repeat yesterday, click logged meal)
- Weight edit widget
- Weight trend chart (7d/30d toggle)
- Past day navigation (Previous/Next)
- PWA install banner (dismiss ✓)
- User menu dropdown ✓
- All navigation links (anchor-scroll behavior)
- Console error monitoring (0 errors throughout)

### Not Tested / Out of Scope
- Google OAuth flow (requires real Google account)
- Onboarding intake flow (Jason already onboarded)
- Photo meal logging (requires camera/file upload)
- Coach dashboard (requires coach account)
- Actual meal editing/deletion (blocked by Issue #1)
- Mobile responsive behavior (tested desktop only)
- Offline/PWA functionality
- Edge functions (analyze-meal, ai-feedback, daily-summary)

### Blockers
- Issue #1 blocks all meal logging/editing testing
- Issue #2 blocks Chinese language testing inside tracker
- Vision model unavailable (region block) — no visual screenshots captured

---

## Notes

- **Zero console errors** across entire test session. Clean JavaScript execution.
- **Landing page is solid** — language toggle, navigation, content all work well.
- **Auth flow works** for valid credentials but has poor error handling for edge cases.
- **Tracker has critical interaction bugs** — the two most important user actions (logging meals, switching language) are completely broken.
- **The "Repeat yesterday" button also non-functional** (same root cause as Issue #1).
- **Coach's Daily Read** content appears/disappears inconsistently after interactions — likely related to the same reactivity bug causing Issue #5.
- The site is a single-page marketing site with all nav links as anchors. No separate service pages exist.
