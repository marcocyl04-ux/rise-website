# Claude Code — RISE Advancement Working Agreement

You are working on the RISE Advancement nutrition tracker PWA. This is a client project for Ryan Cheuk's hockey agency based in Hong Kong.

## Project Overview

- RISE Advancement: hockey agency. Nutrition tracker = their community engagement tool
- Live at: riseadvancement.com
- Tech stack: Next.js + Supabase + Vercel
- PWA mode: standalone detection, install prompts for Android/iOS
- Edge functions: Supabase Edge Functions (Deno runtime)

## Always Do

1. **Load superpowers skill** before any complex task (3+ steps)
2. **Plan before coding** — outline the approach, get approval
3. **Verify after building** — test it, show evidence
4. **Report at the end** — what changed, what's verified, any concerns
5. **Check mobile responsive** — RISE users are on phones, not desktops

## Never Do

- Skip planning on complex tasks
- Claim something works without testing
- Move to the next feature without verifying the last one
- Over-engineer solutions (Marco values simplicity)
- Use em dashes (use commas, periods, or parentheses)
- Break the PWA install flow (standalone detection, service worker cache)

## Key Architecture Notes

- Supabase project: zeczlwypqqvvpraosodv
- Service role key in .env (DO NOT commit or log)
- Edge functions in supabase/functions/
- Food recognition: Google Gemini 2.5 Flash (direct API, NOT OpenRouter — vision blocked on OpenRouter)
- Text generation: mimo-v2.5 via OpenRouter
- DB tables: food_database, meal_logs (both have macro columns: protein, calories, fat, sugar)
- After modifying database models/schema, run DDL migrations manually — code changes don't auto-migrate the live DB
- Service worker cache version must be bumped on each deploy to invalidate old caches

## RISE-Specific Conventions

- All food items must have macro data (protein/cal/fat/sugar)
- Edge function: when items array is empty, return clear error message. Mock fallback ONLY on network error
- WhatsApp CTA: "Talk to the Team" / "和我們聊聊" (NOT "Talk to Ryan")
- PWA: .pwa-standalone class hides Header/Footer/WhatsApp
- Coach dashboard: Ryan (rstcheuk13@gmail.com) has role=coach, team=rise-hk

## Testing

- End-to-end browser testing is MANDATORY for UI changes
- Check mobile viewport (375px width minimum)
- Test PWA standalone mode (Chrome DevTools > Application > Manifest)
- Supabase SQL: `supabase db query --linked "SELECT ..."` for data verification

## Communication Style

- Casual, direct, no fluff
- Plain language, short messages
- If something is wrong, say so clearly
- If unsure, say so (don't guess)

## Skills to Load

- `superpowers` — for any complex task (always)
- `impeccable` — for UI/frontend work
- Project-specific skills — check ~/.hermes/skills/ for available skills