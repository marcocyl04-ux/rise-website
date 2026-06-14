# RISE Website — Current State (June 14, 2026)

## What's Live

### Smooth Scroll (Lenis)
- **Library**: Lenis v1.1.18 (CDN via unpkg)
- **Settings**: duration 1.8s, exponential easing, wheelMultiplier 0.8, touchMultiplier 1.5
- **Integration**: Wired to GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)` + GSAP ticker RAF
- **Nav anchors**: Use `lenis.scrollTo()` with offset -80, duration 1.2s
- **Reduced motion**: `lenis.destroy()` in prefers-reduced-motion block

### Enhanced Three.js Ice Rink (Hero)
- **Scene elements**:
  - Reflective ice floor (MeshPhongMaterial, color 0x0a0e14, shininess 80)
  - Board walls with red emissive edge glow (4 BoxGeometry walls, 0.6 height)
  - Center line (red), blue lines at ±6
  - Center circle, face-off circles at ±8
  - Face-off dots at 5 positions (solid red circles)
  - Goal creases at ±11.5 (dashed arcs + goal lines)
  - 300 ambient particles (ice blue, red, white — floats in 3D space)
  - 3 hockey pucks with physics (glide, bounce off boards, random stick hits)
  - Ice shaving trails behind moving pucks (200 trail particles, fade + float)
- **Lighting**: Ambient (0x222233), directional (0x4488cc), red point light at center
- **Camera**: Position (0, 3.5, 10), looking at (0, 0, -2), FOV 55
- **Mouse tracking**: Camera follows mouse via heroEl-relative coordinates
- **Fog**: FogExp2 density 0.035, matches clear color
- **Performance**: heroKilled at 1.5x viewport height, 300 particles (was 1000 before scroll jank fix)

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

### Performance Optimizations (from scroll jank debugging)
- `contain: layout style paint` on heavy elements
- `will-change: transform` on GSAP targets
- No `backdrop-filter: blur` on nav (was major compositor bottleneck)
- Particles reduced 1000 → 300
- `content-visibility: auto` was tried but KILLED ScrollTrigger (browser skips off-screen rendering) — NOT used
- Lenis drives GSAP ticker (single clock, no competing rAF)

## Page Structure

### EN Homepage (`src/pages/index.astro`)
Hero → Divider → How It Works (4 steps) → Divider → Services (3 rows) → Interlude → Divider → Players (2 cards) → Stats Bar → Divider → FAQ → CTA → Footer

### ZH Homepage (`src/pages/zh/index.astro`)
Same structure, Chinese content.

### Layout (`src/layouts/HomeLayout.astro`)
Shared layout with CDN scripts (Three.js, GSAP core, ScrollTrigger, ScrollToPlugin, Lenis), JSON-LD structured data, nav, footer.

### Styles (`src/styles/homepage.css`)
997 lines, dark theme variables, film grain overlay, responsive breakpoints at 1023px and 639px.

## Key Design Decisions
- **Monochrome with red accent**: All surfaces pure black (#0a0a0a), accent is red (#D3191F)
- **No gray surfaces**: User explicitly dislikes gray backgrounds
- **Swiss minimal**: Oswald headings, Inter body, uppercase labels
- **Hero structure preserved**: Canvas → overlay (radial gradient) → content. NO CSS translateZ layering (rejected as "aggressive in the wrong way")

## Approved But Not Yet Implemented
These 3D treatments were mocked up in `~/repos/rise-website/3d-mockup.html` and approved by Marco:

| Treatment | Target | Effect |
|-----------|--------|--------|
| **3D Card Tilt** | Player cards | Mouse-tracking perspective rotateX/Y + glare overlay |
| **Elevated Pipeline Steps** | How It Works | Cards pop forward on hover with shadow + red glow |
| **Floating Service Rows** | Services | Rows lift on hover, SVG at deeper Z than text |
| **Perspective Section Reveal** | Any section | Panels start tilted back, rotate into place on scroll |
| **Layered Glass CTA** | CTA | Multiple ghost layers at different Z-depths |
| **Flat vs Deep Comparison** | — | Side-by-side reference (not a feature) |

## Deployment
- **Platform**: Vercel (auto-deploy unreliable, use `npx vercel --prod --yes` directly)
- **Project linked**: `.vercel/project.json` in repo root
- **Alias**: riseadvancement.com

## Files Modified This Session
1. `src/layouts/HomeLayout.astro` — Added Lenis CDN
2. `src/pages/index.astro` — Lenis init + enhanced Three.js rink + nav scrollTo update
3. `src/pages/zh/index.astro` — Same changes
4. `src/styles/homepage.css` — No changes this session (only JS/HTML)

## Mockup Files
- `~/repos/rise-website/3d-mockup.html` — B-G treatments demo (hero uses CSS layers, NOT approved)
- `~/repos/rise-website/hockey-rink-mockup.html` — Enhanced rink standalone mockup (APPROVED)
- `~/repos/rise-website/redesign-mockup.html` — Original v1 redesign mockup (APPROVED)

## Known Issues
- SVG graphics in services section still faint (opacity 0.55 inline, design-system.css global heading color needs override in .home-dark scope)
- Local `astro dev` hangs intermittently; Vercel builds work fine
- Vercel GitHub auto-deploy unreliable — always use direct CLI deploy
