# RISE Website — Technical Reference

**For:** The next developer who works on this codebase
**Last updated:** 2026-06-18

## Architecture

```
riseadvancement.com (Vercel)
├── / (marketing site — Astro static, Three.js hero)
├── /why-us, /services/* (marketing pages)
├── /portal (role-based dashboard)
├── /portal/brain (marketing brain UI — founder-only)
├── /portal/tracker (proxied to rise-nutrition via Vercel rewrite)
├── /portal/coach (proxied to rise-nutrition via Vercel rewrite)
└── /nutrition/* (proxied to rise-nutrition via Vercel rewrite)

Supabase (zeczlwypqqvvpraosodv) — "RISE Platform"
├── Auth (email/password, JWT)
└── Database (user_profiles — shared across products)

rise-brain.onrender.com (Render, Docker)
└── Marketing brain API (FastAPI, SQLite, $7/mo)
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro | v6 |
| Styling | Tailwind CSS | v4 |
| 3D Hero | Three.js | r160+ (CDN) |
| Animations | GSAP + ScrollTrigger | v3 (CDN) |
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

# Deploy (auto-deploy is unreliable, use CLI)
npx vercel --prod --yes
```

## Project Structure

```
rise-website/
├── src/
│   ├── components/
│   │   ├── Header.astro              # Nav bar (marketing pages)
│   │   ├── Footer.astro              # Footer
│   │   ├── AuthModal.astro           # Login/signup modal
│   │   ├── FloatingWhatsApp.astro    # WhatsApp CTA button
│   │   ├── SectionHeader.astro       # Reusable section heading
│   │   ├── PlayerCard.astro          # Player profile card
│   │   ├── ServiceCard.astro         # Service feature card
│   │   ├── ServiceNav.astro          # Service page sub-navigation
│   │   ├── ContactForm.astro         # Contact form
│   │   └── home/
│   │       ├── HomeNav.astro         # Homepage nav (transparent → solid on scroll)
│   │       └── Loader.astro          # Loading screen animation
│   ├── layouts/
│   │   ├── BaseLayout.astro          # HTML shell (head, body, scripts)
│   │   ├── HomeLayout.astro          # Homepage layout (Three.js, GSAP CDN)
│   │   └── MarketingLayout.astro     # Marketing pages layout
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client init
│   │   ├── auth.ts                   # Auth helpers (login, logout, getRole)
│   │   └── i18n.ts                   # Translation keys (EN/ZH)
│   ├── pages/
│   │   ├── index.astro               # Homepage (Three.js ice rink hero)
│   │   ├── why-us.astro              # Differentiators
│   │   ├── services/
│   │   │   ├── index.astro           # Services overview
│   │   │   ├── hk-program.astro      # HK off-ice camp
│   │   │   ├── mentoring.astro       # Mentoring program
│   │   │   └── the-move.astro        # Placement to Canada
│   │   ├── portal/
│   │   │   ├── index.astro           # Portal hub (role-based routing)
│   │   │   └── brain.astro           # Brain UI (founder-only)
│   │   └── zh/                       # Chinese versions (mirror of EN)
│   │       ├── index.astro
│   │       ├── why-us.astro
│   │       └── services/
│   │           ├── index.astro
│   │           ├── hk-program.astro
│   │           ├── mentoring.astro
│   │           └── the-move.astro
│   └── styles/
│       ├── global.css                # Base reset, typography
│       ├── design-system.css         # Design tokens (colors, spacing)
│       ├── homepage.css              # Homepage-specific styles
│       └── marketing-pages.css       # Marketing page styles
├── public/
│   ├── favicon*                      # Favicons
│   ├── logo-header.png               # Header logo
│   ├── fonts/                        # Self-hosted Oswald + Inter
│   ├── robots.txt
│   └── sitemap.xml
├── vercel.json                       # Vercel rewrites + redirects
├── astro.config.mjs                  # Astro config (i18n, Tailwind)
├── 3d-mockup.html                    # 3D treatment prototypes (dev reference)
├── hockey-rink-mockup.html           # Standalone rink mockup (dev reference)
└── package.json
```

## Key Config: Vercel Rewrites

`vercel.json` proxies nutrition routes to the rise-nutrition deployment:

```json
{
  "redirects": [
    { "source": "/nutrition", "destination": "/portal/tracker", "permanent": false }
  ],
  "rewrites": [
    { "source": "/nutrition/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/$1" },
    { "source": "/portal/tracker", "destination": "https://rise-nutrition-v2.vercel.app/portal/tracker" },
    { "source": "/portal/tracker/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/portal/tracker/$1" },
    { "source": "/portal/coach", "destination": "https://rise-nutrition-v2.vercel.app/portal/coach" },
    { "source": "/portal/coach/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/portal/coach/$1" }
  ]
}
```

How it works:
1. User logs in on `riseadvancement.com` → Supabase session stored in localStorage
2. User navigates to `/portal/tracker` → Vercel rewrites to rise-nutrition deployment
3. Rise-nutrition JS reads Supabase session from same localStorage → authenticated

## Auth & Roles

**Supabase Auth** — email/password signup via AuthModal component.

**Roles** (stored in `user_profiles` table):
- `athlete` — auto-redirected to nutrition tracker
- `coach` — sees coach dashboard + tracker link
- `founder` — sees portal hub (brain, tracker, coach)

**How it works:**
1. User signs up → Supabase creates auth user
2. Admin sets role in `user_profiles` table (manual step)
3. `auth.ts` reads role from `user_profiles` and gates portal access
4. `portal/index.astro` routes users based on role

## Database (Supabase)

**Project:** zeczlwypqqvvpraosodv ("RISE Platform")

**Tables in this repo's scope:**

| Table | Purpose | RLS |
|-------|---------|-----|
| `user_profiles` | User info, role, team_id | User reads own, coaches read team |

> Nutrition-specific tables (meal_logs, daily_weight, baseline_intake, ai_feedback) live in the [rise-nutrition](https://github.com/marcocyl04-ux/rise-nutrition) repo. The Supabase project is shared by design — `user_profiles` is product-agnostic.

## Homepage: Three.js Ice Rink

The homepage hero is a Three.js scene with:
- Reflective ice floor, board walls with red emissive glow
- Center line, blue lines, face-off circles, goal creases
- 300 ambient particles (ice blue, red, white)
- 3 hockey pucks with physics (glide, bounce, stick hits)
- Red PointLight at center (intensity 0.15, range 15)
- Camera follows mouse, killed at 1.5x viewport height for performance

## Deploy

**Automatic:** Push to `main` branch → Vercel auto-deploys (unreliable).

**Recommended:** Use CLI directly.
```bash
npx vercel --prod --yes
```

**Environment variables:** Set in Vercel dashboard → Settings → Environment Variables.

## Known Issues

1. **Vercel auto-deploy is unreliable** — always use `npx vercel --prod --yes` for deploys
2. **Supabase anon key is hardcoded** in `src/lib/supabase.ts` — safe (anon key is public) but should use env vars for portability
3. **Chinese pages** — `src/pages/zh/` has manual copies of English pages. Not i18n-managed, can drift out of sync
4. **Mockup HTML files** in repo root (`3d-mockup.html`, `hockey-rink-mockup.html`) are dev references, not deployed
