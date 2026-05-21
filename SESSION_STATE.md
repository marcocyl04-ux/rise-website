# RISE Nutrition Tracker — Session State

## Current Status
ALL 6 SLICES COMPLETE AND DEPLOYED. Live at riseadvancement.com.

## What's Built
- Supabase project: zeczlwypqqvvpraosodv.supabase.co
- Tables: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS + SECURITY DEFINER fix for coach recursion
- Google OAuth + email/password auth
- Supabase CLI logged in + linked
- Service role key in ~/Desktop/rise-website/.env

### All Features (DONE):
- Auth: email/password + Google OAuth, AuthModal overlay
- Portal: /portal dashboard with protein target, product cards
- Food database: 254 items with EN/ZH names, visual portions, HK flags
- Meal logging: 3 input methods (photo, upload, search), edit, upsert, one-tap repeat
- Progress bar, meal-logged event, storage bucket "meal-photos"
- AI feedback: DeepSeek V3 via OpenRouter edge functions (coach-voice, bilingual)
- Daily summary at 3+ meals
- Weight log widget, 7d/30d SVG trend chart, past days navigation, auto-adjust targets
- Coach Dashboard: role-based redirect, alerts bar, athletes table, drill-down drawer
- Photo analysis: GPT-4o-mini vision via Supabase edge function (analyze-meal)
- PWA: manifest, service worker, install banner, offline page
- Bilingual: EN/ZH toggle on all portal pages (i18n.ts, 200+ translation keys)

### 3 Edge Functions:
1. ai-feedback (DeepSeek V3 via OpenRouter)
2. daily-summary (DeepSeek V3 via OpenRouter)
3. analyze-meal (GPT-4o-mini vision via OpenRouter)

## Deployment
- Vercel: https://riseadvancement.com (project rise-website)
- Supabase: zeczlwypqqvvpraosodv.supabase.co
- Vercel CLI: logged in, project linked
- Supabase CLI: logged in, linked

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro
- Supabase Service Role Key: in ~/Desktop/rise-website/.env
- Supabase DB Password: -123ASDFfdsa321-
- OpenRouter API Key: as Supabase secret (OPENROUTER_API_KEY)
- Google OAuth: configured in Supabase dashboard

## Known Issues (to fix in refinement session)
- Google OAuth consent screen shows Supabase project ID instead of "RISE Advancement" (needs custom Google Cloud OAuth client)
- Some minor bugs Marco noticed during phone testing
- Coach role management is manual SQL (fine for 1-3 coaches)

## Test Accounts
- jason@test.rise (pw: test123456) — athlete, good compliance
- ryan@test.rise (pw: test123456) — athlete, slipping compliance
- emily@test.rise (pw: test123456) — athlete, new/low compliance
- marcocyl04@gmail.com — athlete (reverted from coach)

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Edge Functions: supabase/functions/{ai-feedback,daily-summary,analyze-meal}/
- i18n: src/lib/i18n.ts
- PWA: public/manifest.json, public/sw.js, public/offline.html
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Session State: ~/Desktop/rise-website/SESSION_STATE.md