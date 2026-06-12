# RISE Website — Technical Reference

**For:** The next developer who works on this codebase
**Last updated:** 2026-06-12

## Architecture

```
riseadvancement.com (Vercel)
├── / (marketing site — Astro static)
├── /portal/ (brain portal — founder-only)
├── /nutrition/* (proxied to rise-nutrition via Vercel rewrite)
└── /brain/* (brain frontend — static files served by Render)

Supabase (zeczlwypqqvvpraosodv)
├── Auth (email/password, JWT)
├── Database (user_profiles, meal_logs, etc.)
└── Edge Functions (AI meal analysis, feedback)
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro | v6 |
| Styling | Tailwind CSS | v4 |
| Auth | Supabase Auth | (managed) |
| Database | Supabase (PostgreSQL) | (managed) |
| Hosting | Vercel | (managed) |
| Brain API | FastAPI on Render | Python 3.12 |

## Setup

```bash
# Clone
git clone <repo-url> rise-website
cd rise-website

# Install
npm install

# Environment variables (create .env)
PUBLIC_SUPABASE_URL=https://zeczlwypqqvvpraosodv.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard>
PUBLIC_BRAIN_API_URL=https://rise-brain.onrender.com

# Dev server
npm run dev  # http://localhost:4321

# Build
npm run build  # output in dist/
```

## Project Structure

```
rise-website/
├── src/
│   ├── components/
│   │   ├── Header.astro          # Nav bar (shared across pages)
│   │   ├── Footer.astro          # Footer
│   │   ├── AuthModal.astro       # Login/signup modal
│   │   └── FloatingWhatsApp.astro # WhatsApp button
│   ├── layouts/
│   │   └── BaseLayout.astro      # HTML shell (head, body, scripts)
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   └── auth.ts               # Auth helpers, role types
│   └── pages/
│       ├── index.astro           # Homepage
│       ├── about.astro           # About
│       ├── services.astro        # Services
│       ├── players.astro         # Player profiles
│       ├── contact.astro         # Contact
│       ├── portal/
│       │   ├── index.astro       # Portal hub (role-based cards)
│       │   └── brain.astro       # Brain UI (founder-only)
│       └── zh/                   # Chinese versions
├── public/                       # Static assets (images, icons)
├── vercel.json                   # Vercel rewrites config
├── astro.config.mjs              # Astro config
└── package.json
```

## Key Config: Vercel Rewrites

`vercel.json` proxies `/nutrition/*` to the nutrition deployment:

```json
{
  "rewrites": [
    {
      "source": "/nutrition/(.*)",
      "destination": "https://rise-nutrition.vercel.app/$1"
    }
  ]
}
```

This means: `riseadvancement.com/nutrition/portal/tracker/` → `rise-nutrition.vercel.app/portal/tracker/`

The nutrition app reads the same Supabase session from localStorage, so the user stays logged in.

## Auth & Roles

**Supabase Auth** — email/password signup via AuthModal component.

**Roles** (stored in `user_profiles` table):
- `athlete` — sees nutrition tracker only
- `coach` — sees tracker + coach dashboard
- `founder` — sees everything + brain portal

**How it works:**
1. User signs up → Supabase creates auth user
2. Admin sets role in `user_profiles` table (manual step)
3. `auth.ts` reads role from `user_profiles` and gates portal access

## Database (Supabase)

**Project:** zeczlwypqqvvpraosodv (RISE Platform)

**Key tables:**

| Table | Purpose | RLS |
|-------|---------|-----|
| `user_profiles` | User info, role | User reads own, coaches read team |
| `meal_logs` | Meal entries with photos | User CRUDs own, coaches read team |
| `daily_weight` | Weight tracking | User CRUDs own, coaches read team |
| `baseline_intake` | Protein targets | User reads own |
| `ai_feedback` | AI meal feedback | User reads own |

**RLS policies:** All tables have row-level security. Athletes see own data, coaches see their team, founders see everything.

## Deploy

**Automatic:** Push to `main` branch → Vercel auto-deploys.

**Manual:** Vercel dashboard → project → Redeploy.

**Environment variables:** Set in Vercel dashboard → Settings → Environment Variables.

## Known Issues

1. **Brain API has no server-side auth on all routes** — frontend gates access by role, but the API endpoints are now protected via `require_brain_access` dependency (added 2026-06-12).
2. **Supabase anon key is hardcoded** in `src/lib/supabase.ts` — this is safe (anon key is public by design) but should ideally use env vars for portability.
3. **Chinese pages** — `src/pages/zh/` has manual copies of English pages. Not i18n-managed, can drift out of sync.
