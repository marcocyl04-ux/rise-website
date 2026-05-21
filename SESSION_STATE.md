# RISE Nutrition Tracker — Session State

## Current Status
Slice 5 COMPLETE. Coach Dashboard live at /portal/coach with role-based redirect, alerts, athlete table, drill-down drawer.

## What's Built
- Supabase project live: zeczlwypqqvvpraosodv.supabase.co
- Tables: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS + SECURITY DEFINER fix for coach recursion
- Google OAuth enabled
- Supabase CLI logged in + linked
- Service role key in ~/Desktop/rise-website/.env
- RISE website portal integrated at ~/Desktop/rise-website/

### Slice 1-4 Features (DONE):
- Auth: email/password + Google OAuth, AuthModal overlay
- Portal: /portal dashboard with protein target, product cards
- Food database: 254 items with EN/ZH names, visual portions, HK flags
- Meal logging: 3 input methods (photo, upload, search), edit, upsert, one-tap repeat
- Progress bar, meal-logged event, storage bucket "meal-photos"
- AI feedback: DeepSeek V3 via OpenRouter edge functions (coach-voice, bilingual EN/Cantonese)
- Daily summary at 3+ meals (summary + highlight + tip)
- Weight log widget, 7d/30d SVG trend chart, past days navigation, auto-adjust targets

### Slice 5 Features (DONE):
- Coach Dashboard at /portal/coach (1380 lines, coach.astro)
- Role-based redirect: /portal → /portal/coach when role='coach'
- Header: team name, athlete count, today's date
- Alerts bar: red/yellow alerts for missed meals (48h+), weight drops (>2kg/7d), low meals yesterday, no weight logged
- Athletes table: name, status dot (green/yellow/red), meals today (/6), protein (g/target), weight + trend arrow, last active
- Drill-down drawer: 7-day meal compliance grid, weight SVG chart (7d/30d toggle), recent meals with AI feedback, baseline info
- 3 test athletes seeded: Jason (green), Ryan (yellow), Emily (red)
- Role management: manual SQL (UPDATE user_profiles SET role='coach', team_id='...')

## Remaining Slices
- Slice 6: PWA + bilingual + deploy to Vercel (manifest, service worker, EN/ZH, push notifications)

## Key Decisions (Locked)
- 6 meal slots (client requirement)
- Photo-first logging
- No calorie display for teens
- Coach voice AI (not clinical)
- Visual portions not grams
- One-tap repeat
- PWA not native
- Supabase "RISE Platform" (product-agnostic auth)
- RLS: kids own data, coaches see team
- Coach role: manual SQL for now (few coaches, not worth admin UI)

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro
- Supabase Service Role Key: in ~/Desktop/rise-website/.env
- Supabase DB Password: -123ASDFfdsa321-
- OpenRouter API Key: as Supabase secret (OPENROUTER_API_KEY)
- Google OAuth: configured in Supabase dashboard

## Known Patterns / Pitfalls
- Astro scoped CSS does NOT apply to JS-created elements. Must use <style is:global> for dynamic elements.
- food_database uses UUID ids, not integers. Always compare as strings.
- meal_logs uses upsert on (user_id, meal_slot, logged_date) for same-day editing.
- Supabase Edge Functions use Deno runtime (import from esm.sh, not Node)
- Edge functions deployed via: supabase functions deploy <name>
- Secrets set via: supabase secrets set KEY=value
- Coach dashboard: role='coach' + team_id required. Athletes must share same team_id for RLS.
- Marco's test account temporarily set to coach for testing (revert: UPDATE user_profiles SET role='athlete' WHERE id='cd12446d...')

## Test Accounts (created for coach dashboard testing)
- jason@test.rise (pw: test123456) — athlete, good compliance
- ryan@test.rise (pw: test123456) — athlete, slipping compliance
- emily@test.rise (pw: test123456) — athlete, new/low compliance
- marcocyl04@gmail.com (pw: test123456) — coach, team rise-hk

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Coach Dashboard: src/pages/portal/coach.astro (1380 lines)
- Edge Functions: supabase/functions/ai-feedback/, supabase/functions/daily-summary/
- Client wrapper: src/lib/ai-feedback.ts
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Task specs: rise-website/.hermes/tasks/

## Next Session
Start with Slice 6 spec, delegate to Claude Code. PWA (manifest, service worker, installable), bilingual (EN/ZH toggle), deploy to Vercel. Last slice before launch.
