# Slice 6: PWA + Bilingual + Deploy

## Overview
Final slice. Three workstreams: (1) make the portal installable as a PWA, (2) add EN/ZH language toggle to portal pages, (3) deploy to Vercel at riseadvancement.com.

## Workstream 1: PWA

### 1a. Web App Manifest
Create `public/manifest.json`:
- name: "RISE Nutrition Tracker"
- short_name: "RISE Tracker"
- description: "Track your nutrition and performance"
- start_url: "/portal"
- display: "standalone"
- theme_color: "#DC2626" (RISE red)
- background_color: "#FFFFFF"
- orientation: "portrait"
- icons: use the RISE logo (check public/ for existing assets). If no logo exists, create a simple SVG icon with "R" in white on red circle at 192x192 and 512x512. Add maskable variants.

### 1b. Service Worker
Create `public/sw.js`:
- Cache-first strategy for static assets (CSS, JS, images, fonts)
- Network-first for API calls (Supabase, edge functions)
- Offline fallback: show a simple offline.html page saying "You're offline. Connect to log meals."
- Cache versioning: bump version string on deploy
- Register the service worker in BaseLayout.astro (add a script at the end of <body>)

### 1c. Install Prompt
- Add the manifest link + theme-color meta tag to BaseLayout.astro <head>
- Add "beforeinstallprompt" event listener in BaseLayout.astro
- Show a custom install banner on /portal and /portal/tracker (not on marketing pages)
- Banner: "Add RISE to your home screen" with Install + Dismiss buttons
- Store dismissal in localStorage so it doesn't show again after dismiss
- Hide banner once installed (appinstalled event)

## Workstream 2: Bilingual (Portal Pages)

### Current State
- Marketing pages already have lang prop (Header, Footer) with /zh/ routes
- Portal pages (tracker.astro, coach.astro, portal/index.astro) have NO bilingual support
- AI feedback is already bilingual (EN/Cantonese via edge functions)
- Food database has name_zh column

### 2a. Language State Management
- Create `src/lib/i18n.ts` with:
  - A translations object for all portal UI strings (English + Traditional Chinese)
  - Keys for: meal slot names, button labels, status messages, headings, form labels, coach dashboard labels
  - A getTranslation(lang, key) helper
  - Store language preference in localStorage under key "rise-lang"
  - Default: "en"

### 2b. Portal Language Toggle
- Add a language toggle button to the portal header area (not the main site Header component, since portal pages have their own headers)
- Toggle between EN and 中文
- On toggle: save to localStorage, reload the page (simplest approach for Astro SSR)
- On page load: read from localStorage, apply lang

### 2c. Translate Portal Pages
Apply translations to ALL portal pages:
- /portal (index.astro): welcome text, product cards, button labels
- /portal/tracker (tracker.astro): meal slot names, progress text, buttons, food search placeholder, modal labels, intake form labels, weight log widget, chart labels, navigation text
- /portal/coach (coach.astro): header, alerts, table headers, athlete names stay as-is, drawer labels, meal grid headers, chart labels, baseline labels

### 2d. Food Database Integration
- food_database already has name_zh column
- When lang=zh, show name_zh in search results and logged meal items
- Fall back to name (English) if name_zh is null/empty

## Workstream 3: Deploy to Vercel

### 3a. Vercel Configuration
- Check if there's already a vercel.json. If not, create one.
- Framework: Astro (auto-detected)
- Build command: `npm run build`
- Output: `dist/`
- Environment variables needed:
  - PUBLIC_SUPABASE_URL (already in code)
  - PUBLIC_SUPABASE_ANON_KEY (already in code)
  - Any other env vars from .env

### 3b. Deploy
- Install vercel CLI if not present: `npm i -g vercel`
- Run `vercel` to link the project (Marco may need to authenticate)
- Set up custom domain: riseadvancement.com (or tracker subdomain)
- If riseadvancement.com is already on Vercel for the main site, add as a path route
- Test: visit the deployed URL, verify PWA works, language toggle works

## Important Patterns / Pitfalls
- Astro scoped CSS does NOT apply to JS-created elements. Must use <style is:global> for dynamic elements.
- Portal pages use inline <script> tags for Supabase client-side auth. Don't break those.
- food_database uses UUID ids, not integers. Always compare as strings.
- The site is already partially deployed somewhere (check if Vercel is already linked)
- service worker scope must be "/" not "/portal/" to cover the whole site
- For the install banner, only show on portal pages (check window.location.pathname starts with /portal)

## Checkpoint
Kid installs PWA, logs a meal, toggles to Chinese, sees feedback in their language. Full flow works on a real phone.

## Files to Create/Modify
- CREATE: public/manifest.json
- CREATE: public/sw.js
- CREATE: public/offline.html
- CREATE: src/lib/i18n.ts
- MODIFY: src/layouts/BaseLayout.astro (manifest link, SW registration, install banner, lang toggle script)
- MODIFY: src/pages/portal/tracker.astro (bilingual strings, food name_zh)
- MODIFY: src/pages/portal/coach.astro (bilingual strings)
- MODIFY: src/pages/portal/index.astro (bilingual strings)
- CREATE: vercel.json (if needed)
- CREATE: public/icon-192.png, public/icon-512.png (if no logo exists)
