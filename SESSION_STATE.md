# RISE Nutrition Tracker — Session State

## Current Status
QA PASS — COMPLETE + DEPLOYED. 4 bugs fixed, 1 deferred, chart label fixed. Live at riseadvancement.com.

## QA Pass (May 22 2026)

### Issues Found (8 total)
- Bug #1: "+ Log meal" button — browser automation artifact, works on real browser ✅
- Bug #2: Language toggle in tracker — broken, DEFERRED (Marco says not significant enough)
- Bug #3: Sign-up empty fields → blank page — FIXED (validation added)
- Bug #4: Invalid login no error — ALREADY WORKING (try-catch added as safety net)
- Bug #5: Weight value disappears — browser automation artifact, works on real browser ✅
- Bug #6: Progress % capped at 100% — FIXED (shows actual %, e.g. 138%)
- Bug #7: Weight spinbutton floating point — FIXED (shows 72.2 not 72.19999694824219)
- Bug #8: Mixed Simplified/Traditional Chinese on landing page — DEFERRED (low priority)

### Additional Fix
- Weight trend chart x-axis label clipping — FIXED (padR 12→30px, "May 22" no longer cut off)

### Manual Testing Results
- Meal logging: WORKS (confirmed on real browser)
- Weight widget: STABLE
- Progress %: Shows 138% correctly
- Auth validation: Shows error messages
- Chart labels: Should display fully now

### Not Yet Tested
- Coach dashboard (needs coach account)
- Mobile responsive
- Onboarding flow (new user)
- Photo meal logging (AI pipeline)

## Deployment
- Vercel: https://riseadvancement.com (project rise-website)
- Supabase: zeczlwypqqvvpraosodv.supabase.co
- Edge functions: analyze-meal (mimo-v2.5), ai-feedback (DeepSeek V3), daily-summary (DeepSeek V3)
- Latest commit: "QA fixes: auth validation, progress %, weight precision"

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
Test and fix coach dashboard:
- Coach login flow (need coach account or promote existing user)
- Athlete table view
- Alerts and compliance indicators
- Drill-down with athlete details (including height)
- Coach-specific features

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Edge Functions: supabase/functions/{ai-feedback,daily-summary,analyze-meal}/
- i18n: src/lib/i18n.ts (200+ keys, EN + ZH Traditional)
- PWA: public/manifest.json, public/sw.js, public/offline.html
- RLS Migration: supabase/migrations/001_current_rls_policies.sql
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Session State: ~/Desktop/rise-website/SESSION_STATE.md
- QA Report: ~/Desktop/rise-website/dogfood-output/report.md
