# Slice 5: Coach Dashboard

## Overview
Build a coach dashboard at `/portal/coach` for RISE Advancement's nutrition tracker. When a user with `role = 'coach'` logs in, they see a coach-specific view instead of the athlete portal. The dashboard shows all athletes on their team with compliance status, alerts, and drill-down capability.

## Architecture Decisions
- **Role detection:** Check `user_profiles.role` on portal load. If `coach`, redirect to `/portal/coach` instead of showing athlete view.
- **RLS already configured:** Coaches can SELECT from user_profiles, baseline_intake, daily_weight, meal_logs where team_id matches. No new RLS needed.
- **No new tables needed.** All data comes from existing tables.
- **Coach role assignment:** Ryan's account (to be created or existing) gets `role = 'coach'` and a `team_id`. Athletes with the same `team_id` appear in his dashboard.
- **Test setup:** Marco's test account needs a `team_id` assigned too (currently NULL). Create a test coach user or temporarily set Marco to coach for testing.

## Database Prep (run BEFORE building)
```sql
-- Set Marco's test account as coach for testing
UPDATE user_profiles SET role = 'coach', team_id = 'rise-hk' WHERE id = 'cd12446d-e0ff-4035-9d87-ff3f282c7292';

-- Ensure his baseline has a team_id too (for RLS)
UPDATE user_profiles SET team_id = 'rise-hk' WHERE id = 'cd12446d-e0ff-4035-9d87-ff3f282c7292';
```
NOTE: After testing, revert Marco back to athlete: `UPDATE user_profiles SET role = 'athlete' WHERE id = 'cd12446d-e0ff-4035-9d87-ff3f282c7292';`

### Seed Test Athletes
Create 3 fake athletes so the coach dashboard has data. Use the Supabase Admin API (service role key in .env).

Bash script to create auth users and seed data:
```bash
# Source the service role key
source ~/Desktop/rise-website/.env

# Create 3 test auth users via admin API
for name in "Jason Wong" "Ryan Chan" "Emily Lam"; do
  first=$(echo $name | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]')
  curl -s -X POST "https://zeczlwypqqvvpraosodv.supabase.co/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${first}@test.rise\", \"password\": \"test123456\", \"email_confirm\": true, \"user_metadata\": {\"full_name\": \"$name\"}}"
done
```

Then insert into user_profiles, baseline_intake, daily_weight, and meal_logs for each test athlete with team_id = 'rise-hk'. Give them varied data:
- Jason: good compliance (5-6 meals/day, consistent weight)
- Ryan: slipping (2-3 meals/day last 2 days, missed weight log)
- Emily: new (only 1 day of data, no weight yet)

This ensures the coach dashboard shows all three status colors (green/yellow/red).

## Page Structure: /portal/coach

### Header Section
- "Coach Dashboard" title
- Team name (from team_id)
- "X athletes" count
- Date (today)

### Alerts Bar (top priority)
Red/yellow alert cards for:
- **Red:** Athlete hasn't logged any meals in 48+ hours
- **Red:** Weight dropped >2kg in 7 days (possible illness/issue)
- **Yellow:** Athlete logged <3 meals yesterday
- **Yellow:** No weight logged in 3+ days
- Show max 5 most urgent, "View all" if more

### Athletes Table
Columns:
1. **Name** (full_name from user_profiles)
2. **Status** — color dot:
   - 🟢 Green: logged 5+ meals yesterday AND weight logged today
   - 🟡 Yellow: logged 3-4 meals yesterday OR weight not logged today
   - 🔴 Red: logged <3 meals yesterday OR no meals in 48h
3. **Meals Today** — "3/6" format (logged today / 6 total)
4. **Protein Today** — "87g / 140g" (current / target)
5. **Weight** — latest weight + trend arrow (↑↓→) vs 7 days ago
6. **Last Active** — "2h ago" or "Yesterday" or "3 days ago"

Sort: alerts first, then by status (red → yellow → green), then alphabetical.

### Drill-Down (click a row)
Opens an expanded view or modal showing for that athlete:
- **7-day meal compliance grid** (like GitHub contribution graph, 7 columns, color = meals logged that day)
- **Weight trend chart** (reuse the same SVG chart component from tracker.astro, 7d/30d toggle)
- **Recent meals** (last 5 meal logs with food items and AI feedback)
- **Baseline info** (weight, age, growth rate, protein target)

## Existing Code to Reuse
- `src/lib/supabase.ts` — Supabase client (already on window)
- `src/lib/auth.ts` — auth helpers, ensureProfile
- `src/layouts/BaseLayout.astro` — layout with CDN scripts
- `src/components/Header.astro` — site header
- `src/components/Footer.astro` — site footer
- `tracker.astro` has SVG chart code (weight trend) — extract or copy the chart rendering logic

## UI/Styling Guidelines
- Match the existing RISE site aesthetic: white bg, Oswald/Inter fonts, red accents (#E63946)
- Use <style is:global> for any JS-created elements (Astro CSS scoping pitfall)
- Mobile-first (this is used on phones)
- Light theme (matches portal)
- No frameworks — vanilla JS in script tags (Astro pattern)

## Key Pitfalls
1. **Astro CSS scoping:** JS-created elements (document.createElement) don't get scoped styles. Use `<style is:global>` for dynamic content.
2. **UUID ids:** user_profiles.id is UUID. Always compare as strings.
3. **RLS team_id:** coach must have team_id set, athletes must have same team_id. NULL team_id = no visibility.
4. **Date handling:** Use Asia/Hong_Kong timezone for "today" calculations (HK athletes).
5. **Edge function:** The ai-feedback and daily-summary functions use OpenRouter. Don't touch them.
6. **No new Supabase tables.** All data from existing tables via RLS.

## Files to Create/Modify
1. `src/pages/portal/coach.astro` — NEW: coach dashboard page
2. `src/pages/portal/index.astro` — MODIFY: add role detection, redirect coaches to /portal/coach
3. `src/lib/auth.ts` — MODIFY: add `getUserRole(userId)` and `getTeamAthletes(teamId)` helpers

## Verification Checklist
- [ ] Coach user (role='coach') gets redirected from /portal to /portal/coach
- [ ] Athlete user (role='athlete') sees normal portal (no redirect)
- [ ] Athletes table shows all team members with correct status colors
- [ ] Alerts appear for missed meals and weight drops
- [ ] Drill-down shows meal compliance grid, weight chart, recent meals
- [ ] Mobile layout works (no horizontal scroll, readable table)
- [ ] Existing athlete portal still works perfectly (no regressions)
- [ ] RLS enforced: coach can only see same team_id athletes
