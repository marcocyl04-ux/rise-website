# RISE Nutrition Tracker — Session State

## Current Status
Slice 3 COMPLETE. AI feedback engine live with DeepSeek V3 via OpenRouter.

## What's Built
- Supabase project live: zeczlwypqqvvpraosodv.supabase.co
- Tables: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS + SECURITY DEFINER fix for coach recursion
- Google OAuth enabled
- Supabase CLI logged in + linked
- Service role key in ~/Desktop/rise-website/.env
- RISE website portal integrated at ~/Desktop/rise-website/
  - Header: auth-aware (login button / user dropdown)
  - AuthModal: login/signup modal overlay
  - /portal: dashboard with protein target + product cards
  - /portal/tracker: Day 1 intake + 6 meal slots (light themed)

### Slice 2 Features (DONE):
- Food database: 254 items with EN/ZH names, visual portions, HK flags
- MealLogModal: three input methods — Take photo, Upload photo, Search food
- Edit existing meals, progress bar, one-tap repeat, meal-logged event
- Storage bucket "meal-photos" with RLS policies
- Analyze-meal module: mock mode, API-ready for OpenAI vision

### Slice 3 Features (DONE):
- Supabase Edge Functions: ai-feedback + daily-summary
- OpenRouter integration (DeepSeek V3, model: deepseek/deepseek-chat-v3-0324)
- Coach-voice feedback after each meal log (auto-dismiss 10s, slide-up animation)
- Daily summary card (appears at 3+ meals: summary + best meal highlight + tip)
- Bilingual: English + Cantonese (HK teen language, not formal Chinese)
- Feedback persisted to meal_logs.ai_feedback column
- Mock fallback when edge functions unavailable
- OpenRouter API key stored as Supabase secret
- Both functions deployed and smoke tested with real AI responses

## Remaining Slices
- Slice 4: Weight tracking + protein calculator refinement (7d/30d chart, auto-adjust targets, history/past days)
- Slice 5: Coach dashboard (Ryan login, all kids table, red/yellow/green, alerts, drill-down)
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

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Edge Functions: supabase/functions/ai-feedback/, supabase/functions/daily-summary/
- Client wrapper: src/lib/ai-feedback.ts
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Task specs: rise-website/.hermes/tasks/

## Next Session
Start with Slice 4 spec, delegate to Claude Code. Weight tracking + protein calculator refinement: daily weight input with 7d/30d trend chart, auto-adjust targets as weight changes, history/past days navigation.