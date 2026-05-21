# RISE Nutrition Tracker — Session State

## Current Status
Slice 1 COMPLETE + portal integration done. Light-themed, matches RISE site.

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
- Standalone tracker reference at ~/Desktop/nutrition-tracker/

## Remaining Slices
- Slice 2: Food database + photo meal logging (photo upload, AI vision, 6 slots, one-tap repeat, progress bar)
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
- HK food DB = future add-on
- Parent weekly summary = planned

## Credentials
- Supabase URL: https://zeczlwypqqvvpraosodv.supabase.co
- Supabase Anon Key: in BaseLayout.astro and nutrition-tracker/js/supabase.js
- Supabase Service Role Key: needed for DB operations (in .hermes memory)
- Supabase DB Password: -123ASDFfdsa321-
- Google OAuth: configured in Supabase dashboard

## Files
- RISE Website: ~/Desktop/rise-website/ (Astro 6 + Tailwind 4, on GitHub: marcocyl04-ux/rise-website)
- Nutrition Tracker (standalone ref): ~/Desktop/nutrition-tracker/
- Vault: ~/Documents/openclaw/RISE Advancement/RISE Nutrition Tracker.md
- Task specs: rise-website/.hermes/tasks/portal-integration.md, nutrition-tracker/.hermes/tasks/slice-1-supabase-auth-models.md

## Next Session
Start with Slice 2 spec, delegate to Claude Code. Food database (200-300 items, visual portions, EN/ZH) + photo meal logging (upload, AI vision, protein estimate, progress bar).
