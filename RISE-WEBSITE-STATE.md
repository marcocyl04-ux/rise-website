# RISE Website — Current State (June 18, 2026)

## What's Live

### Three.js Ice Rink (Hero)
- **Scene elements**:
  - Reflective ice floor (MeshPhongMaterial, color 0x0a0e14, shininess 80)
  - Board walls with red emissive edge glow (4 BoxGeometry walls, 0.6 height, emissiveIntensity 0.01)
  - Center line (red), blue lines at ±6
  - Center circle, face-off circles at ±8
  - Face-off dots at 5 positions (solid red circles)
  - Goal creases at ±11.5 (dashed arcs + goal lines)
  - 300 ambient particles (ice blue, red, white — floats in 3D space)
  - 3 hockey pucks with physics (glide, bounce off boards, random stick hits)
  - Ice shaving trails behind moving pucks (200 trail particles, fade + float)
- **Lighting**: Ambient (0x222233), directional (0x4488cc), red PointLight at center (intensity 0.15, range 15)
  - Scroll-driven intensity: formula scaled down from original to prevent red glow washing out content
  - Rim light (0x4488cc, intensity 0.2, range 25)
- **Camera**: Position (0, 3.5, 10), looking at (0, 0, -2), FOV 55
- **Mouse tracking**: Camera follows mouse via heroEl-relative coordinates
- **Fog**: FogExp2 density 0.035, matches clear color
- **Performance**: heroKilled at 1.5x viewport height, 300 particles

### GSAP Animations
- 27 ScrollTriggers active
- Loader → eyebrow → title → subtitle → CTAs (staggered entrance)
- Nav background toggles on scroll (scrolled class)
- Steps fade in with staggered delay, markers get active class + red glow
- Pipeline fill bar animates on scroll progress
- Service rows slide in (content from right, visual from left)
- Interlude, player cards, CTA elements fade up on scroll
- Counters animate from 0 to target
- FAQ accordion with maxHeight animation
- prefers-reduced-motion: kills all ScrollTriggers, shows everything, hides loader

### Scroll
- **Native browser scroll** — Lenis was removed (commit `56da745`) for performance
- Nav anchors use native `scrollTo` with smooth behavior

### Performance Optimizations
- `contain: layout style paint` on heavy elements
- `will-change: transform` on GSAP targets
- No `backdrop-filter: blur` on nav (was major compositor bottleneck)
- Particles reduced 1000 → 300
- `content-visibility: auto` was tried but KILLED ScrollTrigger (browser skips off-screen rendering) — NOT used
- Lenis removed — native scroll eliminates competing rAF loops

## Page Structure

### EN Homepage (`src/pages/index.astro`)
Hero → Divider → How It Works (4 steps) → Divider → Services (3 rows) → Interlude → Divider → Players (2 cards) → Stats Bar → Divider → FAQ → CTA → Footer

### ZH Homepage (`src/pages/zh/index.astro`)
Same structure, Chinese content.

### Layout (`src/layouts/HomeLayout.astro`)
Shared layout with CDN scripts (Three.js, GSAP core, ScrollTrigger, ScrollToPlugin), JSON-LD structured data, nav, footer.

### Styles (`src/styles/homepage.css`)
Dark theme variables, responsive breakpoints at 1023px and 639px.

## Key Design Decisions
- **Monochrome with red accent**: All surfaces pure black (#0a0a0a), accent is red (#D3191F)
- **No gray surfaces**: User explicitly dislikes gray backgrounds
- **Swiss minimal**: Oswald headings, Inter body, uppercase labels
- **Hero structure preserved**: Canvas → overlay (radial gradient) → content. NO CSS translateZ layering.
- **Services section**: `.hp-services` has opaque background (`var(--rise-black)`) to prevent Three.js canvas bleed-through

## Recent Fixes (commit c449ce6)
- **Red glow toned down**: PointLight intensity 0.4→0.15, range 20→15, wall emissiveIntensity 0.03→0.01, scroll intensity formula scaled down
- **Stray puck fixed**: `.hp-services` had transparent background, Three.js canvas was showing through. Added `background: var(--rise-black)`. Both EN + ZH patched.

## Vercel Rewrites (Nutrition Proxy)
```json
{
  "redirects": [{ "source": "/nutrition", "destination": "/portal/tracker", "permanent": false }],
  "rewrites": [
    { "source": "/nutrition/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/$1" },
    { "source": "/portal/tracker", "destination": "https://rise-nutrition-v2.vercel.app/portal/tracker" },
    { "source": "/portal/tracker/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/portal/tracker/$1" },
    { "source": "/portal/coach", "destination": "https://rise-nutrition-v2.vercel.app/portal/coach" },
    { "source": "/portal/coach/(.*)", "destination": "https://rise-nutrition-v2.vercel.app/portal/coach/$1" }
  ]
}
```

## Deployment
- **Platform**: Vercel (auto-deploy unreliable, use `npx vercel --prod --yes` directly)
- **Project linked**: `.vercel/project.json` in repo root
- **Alias**: riseadvancement.com

## Mockup Files (Dev Reference Only)
- `3d-mockup.html` — B-G treatments demo (hero uses CSS layers, NOT approved for production)
- `hockey-rink-mockup.html` — Enhanced rink standalone mockup (APPROVED concept)
- `redesign-mockup.html` — Original v1 redesign mockup (APPROVED concept)

## Known Issues
- SVG graphics in services section still faint (opacity 0.55 inline)
- Local `astro dev` hangs intermittently; Vercel builds work fine
- Vercel GitHub auto-deploy unreliable — always use direct CLI deploy
