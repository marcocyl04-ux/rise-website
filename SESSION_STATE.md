# RISE Nutrition Tracker — Session State

## Current Status
REFINEMENT SESSION 1 — Critical + Medium fixes applied. Not yet deployed.

## Fixes Applied This Session

### C1: Photo Analysis — FIXED
- Root cause: `openai/gpt-4o-mini` blocked from HK via OpenRouter (403)
- Fix: Switched to `xiaomi/mimo-v2.5` in edge function (works from HK, $0.4/M tokens)
- Updated OPENROUTER_API_KEY secret with full key
- Redeployed analyze-meal edge function
- Verified: returns `mock: false` with real AI analysis

### C2: Language Toggle — FIXED
- Root cause: `wireLangToggle()` defined but never called in tracker.astro
- Fix: Added `wireLangToggle();` to init block (line ~2457)

### C3: Height in Onboarding — FIXED
- DB: `ALTER TABLE baseline_intake ADD COLUMN height_cm numeric;`
- UI: New Step 3 (height in cm, 100-220), renumbered growth→4, goal→5, result→6
- Added 6th progress dot
- Updated intakeState, validateStep, resetIntake, wireIntake, upsert
- Added height input listener

### C4: Weight Chart — FIXED
- Changed `preserveAspectRatio="none"` to `"xMidYMid meet"` in both tracker.astro and coach.astro

### M1: Edit Meal Photo — FIXED
- Changed edit mode from `setView("search")` to `setView("choice")`

### M2+M3: Past Day Date Handling — FIXED
- Added `dateISO` field to ModalState
- openModal now accepts dateISO parameter
- confirmMeal uses `state.dateISO` instead of `new Date()`
- tracker.astro passes `viewingDate` when opening modal
- handleMealLogged uses `viewingDate` instead of `todayISO()`

## Still To Do (next session)
- L1: Remove debug console.logs (7 in MealLogModal)
- L2: i18n AuthModal (16+ hardcoded English strings)
- L3: Weight widget hardcoded English messages
- L4: Coach "thinking" text hardcoded
- L5: "Demo" labels visible to users
- L6: Food DB uses Simplified Chinese (should be Traditional for HK)
- L7: PWA manifest name mismatch
- L8: PWA precache missing /portal/tracker
- M4: Coach queries defense-in-depth (.in("user_id", athleteIds))
- M5: RLS policies not in repo
- Build + deploy to Vercel
- Browser test all fixes
- Coach dashboard: add height display in drawer

## Deployment
- NOT YET DEPLOYED — changes are local only
- Edge function analyze-meal was redeployed (model change)
- Need: `vercel --prod` after all fixes

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro (real key injected by Vercel)
- Supabase Service Role Key: in ~/Desktop/rise-website/.env
- Supabase DB Password: -123ASDFfdsa321-
- OpenRouter API Key: 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 (as Supabase secret)
- Google OAuth: configured in Supabase dashboard

## Test Accounts
- jason@test.rise (pw: test123456) — athlete, good compliance
- ryan@test.rise (pw: test123456) — athlete, slipping compliance
- emily@test.rise (pw: test123456) — athlete, new/low compliance
- marcocyl04@gmail.com — athlete (reverted from coach)

## Files Modified This Session
- supabase/functions/analyze-meal/index.ts (model change)
- src/pages/portal/tracker.astro (lang toggle, height step, date handling, chart fix)
- src/pages/portal/coach.astro (chart fix)
- src/components/MealLogModal.astro (edit photo, date handling)

## Reports
- AUDIT_REPORT.md — full code audit (696 lines)
- REFINEMENT_REPORT.md — combined browser + code audit findings
