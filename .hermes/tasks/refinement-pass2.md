# RISE Nutrition Tracker — Refinement Pass 2

## Context
All 6 slices built and deployed. Pass 1 fixed critical bugs (photo analysis, lang toggle, height onboarding, chart, edit photo, date handling). Now doing cleanup + remaining medium fixes + deploy.

## Project
- Astro 6 + Tailwind 4, ~/Desktop/rise-website/
- Supabase: zeczlwypqqvvpraosodv.supabase.co
- Edge functions: supabase/functions/

## Tasks

### L1: Remove debug console.logs in MealLogModal
- File: src/components/MealLogModal.astro
- Remove all console.log/debug statements (there are ~7)

### L2: i18n AuthModal
- File: src/components/AuthModal.astro
- Replace 16+ hardcoded English strings with i18n calls
- i18n helper is in src/lib/i18n.ts — uses t(key) pattern
- Add keys to i18n.ts EN and ZH sections
- Pattern: look at how tracker.astro uses i18n and follow the same pattern

### L3: Weight widget hardcoded English
- File: src/pages/portal/tracker.astro
- Find hardcoded English strings in the weight log widget section
- Replace with i18n t() calls, add keys to i18n.ts

### L4: Coach "thinking" text hardcoded
- File: src/pages/portal/coach.astro
- Find hardcoded "thinking" or loading text
- Replace with i18n t() calls

### L5: Remove "Demo" labels
- Files: search all portal files for "Demo" or "demo" labels visible to users
- Remove or replace with actual content

### L6: Food DB Traditional Chinese
- The food_database has Simplified Chinese names (zh column)
- Need to convert to Traditional Chinese for HK users
- This is a data migration, not code. Create a SQL migration or script.
- Key items to convert: common foods like 鸡蛋->雞蛋, 牛肉->牛肉 (same), 鸡胸->雞胸, 米饭->米飯, etc.
- Actually check what the current data looks like first

### L7: PWA manifest name
- File: public/manifest.json
- Fix name to match actual app name ("RISE Nutrition" or similar)

### L8: PWA precache
- File: public/sw.js
- Add /portal/tracker to precache list

### M4: Coach query scoping
- File: src/pages/portal/coach.astro
- Add .in("user_id", athleteIds) to any queries that fetch athlete data without scoping
- Defense in depth: even though RLS should protect, add explicit filtering

### M5: RLS policies
- Create supabase/migrations/ with current RLS policies as SQL
- Run: supabase db dump --linked --schema-only to get current state
- Or just document them in a file

### Coach drawer: height display
- File: src/pages/portal/coach.astro
- In the athlete drill-down drawer, show height_cm if available

## Constraints
- Follow existing code patterns (i18n uses t() from i18n.ts)
- Don't change any working functionality
- Keep changes minimal and targeted
- For i18n: add both EN and ZH translations
- Don't break the build

## Verification
After all changes: `npm run build` must pass with no errors.
