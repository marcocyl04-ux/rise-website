# RISE Nutrition Tracker — Session State

## Current Status
Slice 2 COMPLETE + bug fixes. Fully functional meal logging (photo, upload, search food). Light-themed, matches RISE site.

## What's Built
- Supabase project live: zeczlwypqqvvpraosodv.supabase.co
- Tables: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS + SECURITY DEFINER fix for coach recursion
- Google OAuth enabled
- Supabase CLI logged in + linked (can run SQL, manage storage from terminal)
- Service role key in ~/Desktop/rise-website/.env
- RISE website portal integrated at ~/Desktop/rise-website/
  - Header: auth-aware (login button / user dropdown)
  - AuthModal: login/signup modal overlay
  - /portal: dashboard with protein target + product cards
  - /portal/tracker: Day 1 intake + 6 meal slots (light themed)

### Slice 2 Features (DONE):
- Food database: 254 items with EN/ZH names, visual portions, HK flags (seeded in Supabase)
- MealLogModal: three input methods — Take photo (camera), Upload photo (gallery), Search food
- Search food: type-ahead against food_database, click to add, running protein total
- Edit existing meals: re-opening a logged slot loads existing items, can add/remove, upserts on confirm
- Progress bar: current protein / target with red gradient fill
- One-tap repeat: "Repeat yesterday" on empty slots
- meal-logged event: auto-refreshes grid + progress after save
- Storage bucket "meal-photos" created with RLS policies
- Analyze-meal module: mock mode (10 HK meal combos), API-ready for OpenAI vision

### Bug Fixes Applied This Session:
- UUID vs Number type mismatch on food_database.id (was Number(), now string comparison)
- Astro CSS scoping: added <style is:global> blocks for JS-created elements (meal grid, food rows, items)
- Event delegation for food row clicks (replaced fragile per-button handlers)
- Edit flow: logged slots pass existing food_items to modal as prefill

## Remaining Slices
- Slice 3: AI feedback engine (DeepSeek, coach voice, instant + daily feedback)
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
- Supabase Access Token: in .hermes memory
- Google OAuth: configured in Supabase dashboard

## Known Patterns / Pitfalls
- Astro scoped CSS does NOT apply to JS-created elements (document.createElement). Must use <style is:global> for dynamic elements.
- food_database uses UUID ids, not integers. Always compare as strings.
- meal_logs uses upsert on (user_id, meal_slot, logged_date) for same-day editing.

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4)
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Task specs: rise-website/.hermes/tasks/

## Next Session
Start with Slice 3 spec, delegate to Claude Code. AI feedback engine: DeepSeek integration, coach-voice prompts, instant feedback after each log, daily summary.
