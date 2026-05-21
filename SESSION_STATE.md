# RISE Nutrition Tracker — Session State

## Current Status
Slice 2 COMPLETE + Slice 1 (portal integration). Light-themed, matches RISE site.

## What's Built
- Supabase project live: zeczlwypqqvvpraosodv.supabase.co
- Tables created: user_profiles, baseline_intake, daily_weight, meal_logs, food_database
- RLS policies active (with SECURITY DEFINER fix for coach recursion)
- Google OAuth enabled, email confirmation disabled
- RISE website portal integrated at ~/Desktop/rise-website/
  - Header: auth-aware (login button / user dropdown)
  - AuthModal: login/signup modal overlay
  - /portal: dashboard with protein target + product cards
  - /portal/tracker: Day 1 intake + 6 meal slots (light themed)
  - Supabase client + auth module (src/lib/)
- **Slice 2 (NEW):**
  - Food database seed SQL: 254 items with EN/ZH names, visual portions, HK flags (src/lib/seed-food-database.sql)
  - MealLogModal component: photo capture + food search + items list + confirm (src/components/MealLogModal.astro)
  - Analyze-meal module: mock mode for testing, API-ready for OpenAI vision (src/lib/analyze-meal.ts)
  - Clickable meal slots: tap to open modal, photo or search
  - Daily protein progress bar: current/target with red gradient fill
  - One-tap repeat: "↻ Repeat yesterday" on empty slots with yesterday's data
  - meal-logged event: auto-refreshes grid + progress after save
- Standalone tracker reference at ~/Desktop/nutrition-tracker/

## Remaining Slices
- Slice 3: AI feedback engine (DeepSeek, coach voice, instant + daily feedback)
- Slice 4: Weight tracking + protein calculator refinement (7d/30d chart, auto-adjust targets)
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
- HK food DB = future add-on (basic HK items included in seed)
- Parent weekly summary = planned

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro and nutrition-tracker/js/supabase.js
- Supabase Service Role Key: needed for DB operations (in .hermes memory)
- Supabase DB Password: -123ASDFfdsa321-
- Google OAuth: configured in Supabase dashboard

## Manual Steps Required (before testing Slice 2)
1. Run seed-food-database.sql in Supabase SQL Editor (Dashboard > SQL Editor > paste and run)
2. Create "meal-photos" storage bucket (Dashboard > Storage > New Bucket, name: meal-photos, public: off, 5MB limit)
3. Add storage RLS policy so users can only access their own folder path

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4, on GitHub: marcocyl04-ux/rise-website)
- Nutrition Tracker (standalone ref): ~/Desktop/nutrition-tracker/
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Task specs: rise-website/.hermes/tasks/portal-integration.md, nutrition-tracker/.hermes/tasks/slice-1-supabase-auth-models.md, rise-website/.hermes/tasks/slice-2-food-db-photo-logging.md

## Next Session
Start with Slice 3 spec, delegate to Claude Code. AI feedback engine: DeepSeek integration, coach-voice prompts, instant feedback after each log, daily summary.
