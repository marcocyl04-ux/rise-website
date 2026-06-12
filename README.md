# RISE Advancement

**Live site:** [riseadvancement.com](https://riseadvancement.com)

Marketing website and marketing brain UI for RISE Advancement, a hockey development and placement agency based in Hong Kong.

## What This Repo Contains

1. **Marketing website** — bilingual (EN/ZH) site with service pages, player profiles, and contact
2. **Marketing brain UI** — portal interface for the RISE Brain (strategic marketing intelligence)

> **Note:** The nutrition tracker was extracted to a separate repo: [rise-nutrition](../rise-nutrition/)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v6 (static site generation) |
| Styling | Tailwind CSS v4 |
| Auth + Database | [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth) |
| Hosting | [Vercel](https://vercel.com) |
| Brain API | [rise-brain](https://github.com/marcocyl04-ux/rise-brain) (Python/FastAPI, Render) |

## Project Structure

```
rise-website/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── AuthModal.astro          # Login/signup overlay
│   │   ├── FloatingWhatsApp.astro   # CTA button
│   │   ├── SectionHeader.astro
│   │   ├── PlayerCard.astro
│   │   ├── ServiceCard.astro
│   │   ├── ServiceNav.astro
│   │   └── ContactForm.astro
│   ├── layouts/
│   │   └── BaseLayout.astro         # HTML shell, Supabase CDN, fonts
│   ├── pages/
│   │   ├── index.astro              # Landing page (EN)
│   │   ├── why-us.astro
│   │   ├── services/                # Service pages (EN)
│   │   ├── zh/                      # Chinese translations (mirror of EN)
│   │   └── portal/
│   │       ├── index.astro          # Portal dashboard (brain card for founders)
│   │       └── brain.astro          # Marketing brain UI
│   ├── lib/
│   │   ├── supabase.ts              # Client initialization
│   │   ├── auth.ts                  # Auth helpers
│   │   └── i18n.ts                  # Translation keys (EN/ZH)
│   └── styles/
│       ├── global.css
│       └── design-system.css
├── supabase/
│   └── migrations/                  # Schema and RLS policy exports
├── public/
│   ├── favicon*
│   ├── logo-header.png
│   ├── robots.txt
│   └── sitemap.xml
└── dist/                            # Build output (gitignored)
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
npx vercel --prod    # Deploy to Vercel
```

## Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Marketing homepage |
| Why Us | `/why-us` | Differentiators and value proposition |
| Services | `/services` | Service overview |
| HK Program | `/services/hk-program` | Off-ice camp details |
| Mentoring | `/services/mentoring` | Mentoring program details |
| The Move | `/services/the-move` | Placement to Canadian schools |
| Portal | `/portal` | Authenticated user dashboard |
| Brain | `/portal/brain` | Marketing brain interface |
| Chinese | `/zh/*` | All pages mirrored in Traditional Chinese |

## Related Repos

- **rise-nutrition** — nutrition tracking PWA (meal logging, AI feedback, coach dashboard)
- **rise-brain** — marketing intelligence agent (API on Render, $7/mo)

## License

Proprietary. This codebase belongs to RISE Advancement.
