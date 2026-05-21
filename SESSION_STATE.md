# RISE Nutrition Tracker — Session State

## Current Status
Slice 6 COMPLETE. All 6 slices done. Ready to deploy.

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
- Coach Dashboard at /portal/coach
- Role-based redirect, alerts bar, athletes table, drill-down drawer
- 3 test athletes seeded (Jason, Ryan, Emily)
- Role management: manual SQL

### Slice 6 Features (DONE):
- PWA: manifest.json, service worker (cache-first static, network-first API), offline.html
- Install banner on portal pages (beforeinstallprompt, localStorage dismiss)
- SVG icons: 192x192, 512x512, maskable variants
- Bilingual: EN/ZH toggle on ALL portal pages (tracker, coach, index)
- i18n.ts: 200+ translation keys (Traditional Chinese/Cantonese for HK teens)
- data-i18n attributes for static HTML, window.__t for dynamic JS elements
- Food names: name_zh from food_database when lang=zh, fallback to name
- Lang preference saved to localStorage["rise-lang"]
- Vercel CLI installed (53.4.0), ready to deploy

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
- Coach role: manual SQL for now

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
- Coach dashboard: role='coach' + team_id required
- Portal i18n: data-i18n attributes for static HTML, window.__t + t() function for dynamic JS
- PWA service worker scope is "/" (covers whole site)
- Bilingual toggle: localStorage["rise-lang"], reads on page load

## Test Accounts
- jason@test.rise (pw: test123456) — athlete, good compliance
- ryan@test.rise (pw: test123456) — athlete, slipping compliance
- emily@test.rise (pw: test123456) — athlete, new/low compliance
- marcocyl04@gmail.com (pw: test123456) — coach, team rise-hk

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Coach Dashboard: src/pages/portal/coach.astro
- i18n: src/lib/i18n.ts
- PWA: public/manifest.json, public/sw.js, public/offline.html
- Edge Functions: supabase/functions/ai-feedback/, supabase/functions/daily-summary/
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md

## Next Steps
1. Test PWA install on phone
2. Test bilingual toggle on all portal pages
3. Deploy to Vercel: `cd ~/Desktop/rise-website && vercel`
4. Set up custom domain (riseadvancement.com or subdomain)
5. Set env vars in Vercel dashboard
6. Revert test account role: UPDATE user_profiles SET role='athlete' WHERE id='cd12446d...'