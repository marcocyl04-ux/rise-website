# RISE Advancement

**Live site:** [riseadvancement.com](https://riseadvancement.com)

Website and nutrition tracker PWA for RISE Advancement, a hockey development and placement agency based in Hong Kong.

This repo contains two things:

1. **Marketing website** - bilingual (EN/ZH) site with service pages, player profiles, and contact
2. **Nutrition tracker** - mobile-first PWA where athletes log meals and track macros, with a coach dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v6 (static site generation) |
| Styling | Tailwind CSS v4 |
| Auth + Database | [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth) |
| Hosting | [Vercel](https://vercel.com) |
| AI (photo analysis) | Google Gemini 2.5 Flash (direct API) |
| AI (text feedback) | MiMo v2.5 via [OpenRouter](https://openrouter.ai) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |

## Project Structure

```
rise-website/
├── src/
│   ├── components/        # Shared Astro components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── AuthModal.astro        # Login/signup overlay
│   │   ├── MealLogModal.astro     # Photo/search meal logging
│   │   ├── FloatingWhatsApp.astro # CTA button
│   │   └── ...
│   ├── layouts/
│   │   └── BaseLayout.astro       # PWA detection, service worker
│   ├── pages/
│   │   ├── index.astro            # Landing page (EN)
│   │   ├── why-us.astro
│   │   ├── services/              # Service pages (EN)
│   │   ├── zh/                    # Chinese translations (mirror of EN)
│   │   ├── portal/
│   │   │   ├── index.astro        # Athlete dashboard (protein/macro targets)
│   │   │   ├── tracker.astro      # Meal logging + weight tracking + charts
│   │   │   └── coach.astro        # Coach dashboard (all athletes at a glance)
│   │   └── install-guide.astro    # PWA install instructions (iOS/Android)
│   ├── lib/
│   │   ├── supabase.ts            # Client initialization
│   │   ├── auth.ts                # Auth helpers
│   │   ├── i18n.ts                # 200+ translation keys (EN/ZH)
│   │   ├── ai-feedback.ts         # Edge function client wrapper
│   │   ├── analyze-meal.ts        # Photo/text food analysis client
│   │   └── seed-food-database.sql # 254 curated food items
│   └── styles/
│       ├── global.css
│       └── design-system.css
├── supabase/
│   ├── functions/
│   │   ├── analyze-meal/          # Photo/text food recognition
│   │   ├── ai-feedback/           # Post-meal coach-voice feedback
│   │   └── daily-summary/         # End-of-day summary generation
│   └── migrations/                # Schema and RLS policy exports
├── public/
│   ├── sw.js                      # Service worker (cache-first static, network-first API)
│   ├── manifest.json              # PWA manifest
│   ├── icons/                     # App icons (192, 512, maskable)
│   └── offline.html
└── dist/                          # Build output (gitignored)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (auth, database, edge functions)
- API keys for food photo analysis (Google AI) and text feedback (OpenRouter)

### Local Development

```bash
npm install
npm run dev          # Starts dev server at localhost:4321
```

### Environment Variables

Create `.env` in the project root (gitignored):

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Edge function secrets are stored in Supabase (not in .env):
- `OPENROUTER_API_KEY` - text feedback model
- `GOOGLE_AI_API_KEY` - photo food analysis (Gemini 2.5 Flash)

### Build & Deploy

```bash
npm run build        # Outputs to dist/
npx vercel --prod    # Deploy to Vercel (manual, not git-connected)
```

After deploying, bump the service worker cache version in `public/sw.js` to invalidate old caches.

## Nutrition Tracker

The tracker is a PWA embedded under `/portal` on the RISE website. It's designed for 14-17 year old hockey players in Hong Kong.

### Features

- **Photo meal logging** - snap a photo or search from a curated food database (254 items, EN/ZH)
- **6 meal slots per day** - breakfast, snack 1, lunch, snack 2, dinner, snack 3
- **Macro tracking** - protein (primary), calories, fat, sugar with progress bars
- **Protein target calculator** - based on weight, age, growth rate, and goal (ISSN/NSCA guidelines)
- **Weight tracking** - daily input with auto-adjusting protein targets and 7/30-day trend charts
- **AI feedback** - coach-voice feedback after each meal, daily summaries at 3+ meals
- **Protein shake quick-log** - 16 pre-loaded products (ON, MyProtein, MuscleTech, etc.)
- **Coach dashboard** - all athletes at a glance, red/yellow/green status, drill-down per athlete
- **Bilingual** - EN/Traditional Chinese toggle, preference saved locally
- **PWA** - installable to home screen, works offline (cached pages)

### Database Schema

Key tables (all in Supabase with RLS):

| Table | Purpose |
|---|---|
| `user_profiles` | Athletes and coaches (role, team_id, timezone) |
| `baseline_intake` | Onboarding data (weight, age, goal, protein target) |
| `meal_logs` | Each meal entry (items, macros, AI feedback, photo URL) |
| `food_database` | 254 curated foods with macros and EN/ZH names |
| `daily_weight` | Daily weight entries per athlete |

### Architecture Decisions

- **No calorie restriction for teens** - all macros visible to everyone (protein, calories, fat, sugar)
- **Coach enforcement is the #1 compliance lever** - the app amplifies this, doesn't replace it
- **Photo-first logging** - 70-80% compliance vs 10-20% for manual text entry
- **Platform architecture** - Supabase project is "RISE Platform" not "Nutrition Tracker." User profiles are product-agnostic. Each product gets its own tables with RLS.
- **Visual portions** - "1 bowl", "1 palm" not grams. Teens won't weigh food.
- **AI model routing** - photo analysis uses Gemini 2.5 Flash (better vision), text feedback uses MiMo v2.5 (cheaper)

### Edge Functions

Three Supabase Edge Functions power the AI features:

1. **analyze-meal** - accepts photo or text, returns structured food items with macros
2. **ai-feedback** - generates coach-voice feedback after each meal log
3. **daily-summary** - generates end-of-day summary at 3+ meals logged

## Current Status

| Component | Status |
|---|---|
| Marketing website | Live, maintenance mode |
| Nutrition tracker | Complete, maintenance mode |
| Coach dashboard | Live, tested with seed data |
| PWA install flow | Live (Android + iOS guides) |
| Bilingual (EN/ZH) | Live |
| Photo meal analysis | Live (Gemini 2.5 Flash) |
| AI feedback | Live (MiMo v2.5) |

## License

Proprietary. This codebase belongs to RISE Advancement.
