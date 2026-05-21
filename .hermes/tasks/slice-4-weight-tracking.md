# Slice 4: Weight Tracking + Protein Calculator Refinement

## Context
RISE Nutrition Tracker, Astro 6 + Tailwind 4 + Supabase. All work happens in `src/pages/portal/tracker.astro` (1651 lines) and supporting lib files. The `daily_weight` table already exists with columns: id (uuid), user_id (uuid), weight_kg (numeric), logged_date (date), created_at (timestamptz). The `baseline_intake` table has: user_id, weight_kg, age, growth_rate, primary_goal, protein_target_g.

## What to Build

### 1. Weight Log Widget (in tracker-app view)
- Add a compact weight log section ABOVE the meal grid (after the progress bar, before "Today's meals")
- Shows today's weight if already logged, otherwise shows an input field
- Input: number field (kg, step 0.1, range 20-200) + "Log weight" button
- After logging, display "XX.X kg today" with an edit icon to update
- On weight change: auto-recalculate protein target using the existing formula in the page (lines 978-1002) and update `baseline_intake.protein_target_g` + `baseline_intake.weight_kg` in Supabase
- Show a subtle notice: "Target updated: XXXg protein/day" when weight changes trigger a target recalculation

### 2. Weight Trend Chart (7d / 30d toggle)
- Add below the weight log widget
- Two toggle buttons: "7 days" | "30 days" (default: 7d)
- Simple SVG line chart (no library, pure SVG generation in JS)
- X-axis: dates. Y-axis: weight in kg
- Show data points as dots, connect with lines
- If no data for a period, show empty state: "Log your weight daily to see trends"
- Chart should be responsive (width: 100% of container, height ~160px)
- Use existing RISE color vars (--rise-red for line, --rise-neutral-100 for grid)

### 3. Past Days Navigation
- Add date navigation to the tracker-app topbar (left/right arrows around the date)
- Format: [< ] Mon, May 19 [>]
- Left arrow = previous day, right arrow = next day (disabled if today)
- When navigating to a past day:
  - Load that day's meal_logs from Supabase
  - Update the meal grid to show that day's meals (read-only for past days)
  - Update progress bar for that day
  - Show "Past day" badge near the date
  - Disable the "Log meal" buttons (past days are read-only)
  - Weight widget shows that day's weight (if logged) but doesn't allow editing past days
- Keep a `viewingDate` state variable (defaults to today)

### 4. Auto-Adjust Protein Target on Weight Change
- When the user logs a new weight that differs from their baseline:
  - Recalculate: `newTarget = calculateProteinTarget(newWeight, growthRate, goal)`
  - Upsert `baseline_intake` with new weight_kg and protein_target_g
  - Upsert `daily_weight` for today
  - Update the target card and progress bar immediately
  - Show toast/notice: "Weight updated. New protein target: XXXg/day"
- Growth rate and goal come from the existing baseline_intake row (don't re-ask)

## Technical Notes
- All CSS uses the `tk-` prefix and existing design tokens (--rise-red, --rise-neutral-*, --font-heading, etc.)
- Use `<style is:global>` for any JS-created elements (known Astro scoping pitfall)
- The protein formula is at lines 978-1002 of tracker.astro — reuse it, don't duplicate
- `daily_weight` uses upsert on (user_id, logged_date)
- Supabase client is accessed via `(window as any).supabaseClient`
- Keep the page as a single .astro file (matches existing pattern)
- Chart SVG is generated in JS, no external libraries

## Files to Modify
- `src/pages/portal/tracker.astro` — main file, add weight widget + chart + date nav
- Potentially `src/lib/ai-feedback.ts` if the AI feedback needs weight trend context (optional, not required)

## Design Constraints
- Light theme (white bg, dark text) — matches existing tracker page
- Mobile-first (max-width 520px container)
- RISE brand: uppercase headings (--font-heading), clean cards, red accents
- Teen-friendly: simple language, no jargon

## Verification
1. Log weight on the tracker page, verify it saves to daily_weight table
2. Change weight, verify protein target recalculates and updates baseline_intake
3. Toggle 7d/30d chart, verify it renders correctly with available data
4. Navigate to yesterday, verify meals are shown read-only
5. Navigate back to today, verify meal logging still works
6. Check responsive layout at 375px width
