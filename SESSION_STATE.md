# RISE Nutrition Tracker — Session State

## Current Status
REFINEMENT PASS 2 — COMPLETE + DEPLOYED. All cleanup fixes applied. Live at riseadvancement.com.

## Refinement Pass 1 (earlier session)
- C1: Photo analysis → xiaomi/mimo-v2.5 (HK-compatible)
- C2: Language toggle → wireLangToggle() was never called
- C3: Height onboarding → new step 3 + DB migration
- C4: Weight chart → preserveAspectRatio fixed
- M1: Edit meal photo → choice screen in edit mode
- M2+M3: Past day dates → viewingDate handling

## Refinement Pass 2 (this session)
- L1: Removed 7 debug console.logs from MealLogModal
- L2: Full i18n for AuthModal (17 new EN + ZH keys)
- L3: Weight widget uses t() for all strings
- L4: Coach "thinking" text uses t()
- L5: Demo badges permanently hidden (setAttribute("hidden",""))
- L6: Fixed 6 Simplified → Traditional Chinese items in food DB (蘭, 車, 馬)
- L7: PWA manifest name was already correct ("RISE Nutrition Tracker")
- L8: Added /portal/tracker to SW precache
- M4: Coach queries scoped with .in("user_id", athleteIds)
- M5: RLS policies exported to supabase/migrations/001_current_rls_policies.sql
- Coach drawer: height_cm display added

## Deployment
- Vercel: https://riseadvancement.com (project rise-website)
- Supabase: zeczlwypqqvvpraosodv.supabase.co
- Edge functions: analyze-meal (mimo-v2.5), ai-feedback (DeepSeek V3), daily-summary (DeepSeek V3)
- Latest commit: "Refinement pass 2: i18n, cleanup, coach hardening"

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro
- Supabase Service Role Key: in ~/Desktop/rise-website/.env
- Supabase DB Password: -123ASDFfdsa321-
- OpenRouter API Key: sk-or-...5e20 (as Supabase secret)
- Google OAuth: configured in Supabase dashboard

## Test Accounts
- jason@test.rise (pw: test123456) — athlete, good compliance
- ryan@test.rise (pw: test123456) — athlete, slipping compliance
- emily@test.rise (pw: test123456) — athlete, new/low compliance
- marcocyl04@gmail.com — athlete (reverted from coach)

## Next Session
Design and run a comprehensive QA test suite for the nutrition tracker. Cover:
- Auth flow (login, signup, Google OAuth, logout)
- Onboarding intake (all 6 steps including new height step)
- Meal logging (all 3 methods: photo, upload, search)
- Meal editing and deletion
- Weight logging and editing
- Weight trend chart (7d/30d toggle)
- Past day navigation (read-only meals, date handling)
- Language toggle (EN ↔ ZH, all translated strings)
- AI feedback (coach voice, daily summary)
- Coach dashboard (athlete table, alerts, drill-down with height)
- PWA install banner
- Edge cases (empty states, error states, offline)

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Edge Functions: supabase/functions/{ai-feedback,daily-summary,analyze-meal}/
- i18n: src/lib/i18n.ts (200+ keys, EN + ZH Traditional)
- PWA: public/manifest.json, public/sw.js, public/offline.html
- RLS Migration: supabase/migrations/001_current_rls_policies.sql
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Session State: ~/Desktop/rise-website/SESSION_STATE.md
