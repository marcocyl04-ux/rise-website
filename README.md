# RISE Advancement

**Live site:** [riseadvancement.com](https://riseadvancement.com)

Marketing website and marketing brain UI for RISE Advancement, a hockey development and placement agency based in Hong Kong.

## What This Repo Contains

1. **Marketing website** — bilingual (EN/ZH) site with service pages, player profiles, and contact
2. **Marketing brain UI** — portal interface for the RISE Brain (strategic marketing intelligence)
3. **Nutrition proxy** — Vercel rewrites route `/portal/tracker` and `/portal/coach` to rise-nutrition

> **Note:** The nutrition tracker code lives in a separate repo: [rise-nutrition](https://github.com/marcocyl04-ux/rise-nutrition). It's served under the same domain via Vercel rewrites.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v6 (static site generation) |
| Styling | Tailwind CSS v4 |
| 3D Hero | Three.js (ice rink scene with particles, pucks, fog) |
| Animations | GSAP + ScrollTrigger (27 scroll-driven animations) |
| Auth + Database | [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth) |
| Hosting | [Vercel](https://vercel.com) |
| Brain API | [rise-brain](https://github.com/marcocyl04-ux/rise-brain) (Python/FastAPI, Render) |

## Project Structure

```
rise-website/
├── src/
│   ├── components/
│   │   ├── Header.astro              # Nav bar (shared across marketing pages)
│   │   ├── Footer.astro              # Footer
│   │   ├── AuthModal.astro           # Login/signup overlay
│   │   ├── FloatingWhatsApp.astro    # WhatsApp CTA button
│   │   ├── SectionHeader.astro       # Reusable section heading
│   │   ├── PlayerCard.astro          # Player profile card
│   │   ├── ServiceCard.astro         # Service feature card
│   │   ├── ServiceNav.astro          # Service page sub-navigation
│   │   ├── ContactForm.astro         # Contact form
│   │   └── home/
│   │       ├── HomeNav.astro         # Homepage-specific nav (transparent → solid on scroll)
│   │       └── Loader.astro          # Loading screen animation
│   ├── layouts/
│   │   ├── BaseLayout.astro          # HTML shell (head, body, Supabase CDN, fonts)
│   │   ├── HomeLayout.astro          # Homepage layout (Three.js, GSAP, ScrollTrigger CDN scripts)
│   │   └── MarketingLayout.astro     # Marketing pages layout (services, why-us, etc.)
│   ├── pages/
│   │   ├── index.astro               # Homepage with Three.js ice rink hero
│   │   ├── why-us.astro              # Differentiators and value proposition
│   │   ├── services/
│   │   │   ├── index.astro           # Services overview
│   │   │   ├── hk-program.astro      # HK off-ice camp
│   │   │   ├── mentoring.astro       # Mentoring program
│   │   │   └── the-move.astro        # Placement to Canadian schools
│   │   ├── zh/                       # Chinese translations (mirror of EN)
│   │   │   ├── index.astro
│   │   │   ├── why-us.astro
│   │   │   └── services/
│   │   │       ├── index.astro
│   │   │       ├── hk-program.astro
│   │   │       ├── mentoring.astro
│   │   │       └── the-move.astro
│   │   └── portal/
│   │       ├── index.astro           # Portal dashboard (role-based routing)
│   │       ├── brain.astro           # Marketing brain UI (founder-only)
│   │       └── install.astro         # PWA install instructions (platform-detected)
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client initialization
│   │   ├── auth.ts                   # Auth helpers (login, logout, getRole)
│   │   └── i18n.ts                   # Translation keys (EN/ZH)
│   └── styles/
│       ├── global.css                # Base reset and typography
│       ├── design-system.css         # Design tokens (colors, spacing, typography)
│       ├── homepage.css              # Homepage-specific styles (hero, sections, animations)
│       └── marketing-pages.css       # Marketing page styles (services, why-us)
├── public/
│   ├── favicon*                      # Favicons (multiple sizes)
│   ├── logo-header.png               # Header logo
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker (network-first)
│   ├── fonts/                        # Self-hosted Oswald + Inter
│   ├── robots.txt
│   └── sitemap.xml
├── vercel.json                       # Vercel rewrites (nutrition proxy)
├── astro.config.mjs                  # Astro config (i18n, Tailwind)
├── 3d-mockup.html                    # 3D treatment prototypes (dev reference)
├── hockey-rink-mockup.html           # Standalone rink mockup (dev reference)
└── dist/                             # Build output (gitignored)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (auth, database)

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
PUBLIC_BRAIN_API_URL=http://localhost:8000  # Brain API (optional, defaults to localhost)
```

### Build & Deploy

```bash
npm run build        # Outputs to dist/
npx vercel --prod --yes  # Deploy to Vercel (auto-deploy is unreliable, use CLI)
```

## Pages

| Page | Path | Description |
|------|------|-------------|
| Homepage | `/` | Three.js ice rink hero, services, players, FAQ |
| Why Us | `/why-us` | Differentiators and value proposition |
| Services | `/services` | Service overview |
| HK Program | `/services/hk-program` | Off-ice camp details |
| Mentoring | `/services/mentoring` | Mentoring program details |
| The Move | `/services/the-move` | Placement to Canadian schools |
| Portal | `/portal` | Authenticated dashboard (role-based routing) |
| Brain | `/portal/brain` | Marketing brain interface (founder-only) |
| Tracker | `/portal/tracker` | Nutrition tracker (proxied to rise-nutrition) |
| Coach | `/portal/coach` | Coach dashboard (proxied to rise-nutrition) |
| Install | `/portal/install` | PWA install instructions (platform-detected) |
| Chinese | `/zh/*` | All pages mirrored in Traditional Chinese |

## Vercel Rewrites

Nutrition tracker and coach dashboard are served from rise-nutrition under the same domain:

- `/portal/tracker` → `rise-nutrition-v2.vercel.app/portal/tracker`
- `/portal/coach` → `rise-nutrition-v2.vercel.app/portal/coach`
- `/nutrition/*` → `rise-nutrition-v2.vercel.app/*`

Users log in on `riseadvancement.com` and the Supabase session persists via localStorage (same origin).

## Related Repos

- **[rise-nutrition](https://github.com/marcocyl04-ux/rise-nutrition)** — nutrition tracking PWA (meal logging, AI feedback, coach dashboard)
- **[rise-brain](https://github.com/marcocyl04-ux/rise-brain)** — marketing intelligence agent (API on Render, $7/mo)

## License

Proprietary. This codebase belongs to RISE Advancement.
