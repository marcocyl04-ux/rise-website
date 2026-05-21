# RISE Website Portal Integration — Task Spec

## Overview
Add authentication and a client portal to the existing RISE Advancement Astro website. Users (kids/coaches) log in from the main site header, land in a portal dashboard, and access products like the Nutrition Tracker.

## Existing Site
- Location: /Users/marcol04/Desktop/rise-website/
- Stack: Astro 6.3.1 + Tailwind CSS 4.3.0 + Vite 6
- Static site, no SSR configured
- Pages: index, services (the-move, mentoring, hk-program), why-us, zh/ variants
- Header: src/components/Header.astro (has nav, lang toggle, hamburger)
- Layout: src/layouts/BaseLayout.astro (has header/footer slots)
- Styles: src/styles/global.css
- Brand colors: red #D3191F, black #121212, off-white #FAFAFA
- Fonts: Oswald (headings), Inter (body)

## Supabase Credentials
- URL: https://zeczlwypqqvvpraosodv.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3psd3lwcXF2dnByYW9zb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDEyMDgsImV4cCI6MjA5NDkxNzIwOH0.I7HWRsBOXDH2UG0u6NMEkXlosrlkuMkY6w9g5RtV_KM

## Reference Implementation
The standalone nutrition tracker is at /Users/marcol04/Desktop/nutrition-tracker/
Use it as reference for auth flow, intake flow, protein calculator, and meal slot UI.
The code should be adapted to fit inside the Astro site with RISE branding.

## What to Build

### 1. Supabase Client (global)
Create src/lib/supabase.ts that initializes the Supabase client and exports it.
Add the Supabase JS CDN to BaseLayout.astro head:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 2. Auth Module
Create src/lib/auth.ts with:
- getSession() - get current session
- getUser() - get current user
- signInWithEmail(email, password)
- signUpWithEmail(email, password, fullName)
- signInWithGoogle()
- signOut()
- onAuthStateChange(callback)
- ensureProfile(user) - create user_profiles row if missing
- hasBaseline(userId) - check if baseline_intake exists

### 3. Header Auth State
Modify src/components/Header.astro:
- Add a "Log in" button in header-actions (next to lang toggle) when not logged in
- When logged in, show user name/initial + dropdown with "My Portal" and "Log out"
- Auth state is checked client-side via a <script> tag that reads Supabase session
- The button should work on both desktop and mobile nav

### 4. Login/Signup Modal
Create src/components/AuthModal.astro:
- Modal overlay (not a separate page)
- Tabs: Log in / Sign up (same as the standalone tracker)
- Email/password fields
- Google OAuth button
- Full name field (signup only)
- Error/success messages
- On successful auth: close modal, redirect to /portal
- Triggered by "Log in" button in header

### 5. Portal Dashboard Page
Create src/pages/portal/index.astro:
- Uses BaseLayout
- Client-side auth check: if not logged in, show login prompt or redirect to home with auth modal
- Shows welcome message with user's name
- Shows protein target (if baseline exists)
- Grid of product cards:
  - "Nutrition Tracker" card (active, links to /portal/tracker)
  - Future: "Workouts" card (greyed out, "Coming soon")
- Simple, clean design matching RISE branding

### 6. Nutrition Tracker Page
Create src/pages/portal/tracker.astro:
- Uses BaseLayout (so it has the RISE header/footer)
- Client-side auth check (same as portal)
- Contains the full tracker flow:
  - If no baseline: show Day 1 intake flow (5 steps, same as standalone)
  - If baseline exists: show main app shell (protein target + 6 meal slots)
- Reuse the logic from /Users/marcol04/Desktop/nutrition-tracker/js/intake.js and app.js
- Adapt styling to match RISE site (use RISE brand colors, Oswald/Inter fonts)
- The tracker should feel like part of the RISE site, not a separate app

### 7. Styles
- Portal pages should use RISE brand colors (red #D3191F, black #121212, off-white #FAFAFA)
- Keep the dark theme for the tracker itself (it's a tool, not marketing)
- But the portal dashboard should match the light RISE site
- Use Oswald for headings, Inter for body (already loaded in BaseLayout)

## Important Notes
- NO frameworks. Vanilla JS/TS in Astro <script> tags.
- Astro pages can use <script> tags for client-side interactivity
- Auth is entirely client-side (Supabase JS handles session in localStorage)
- Portal pages don't need SSR — client-side auth check is fine (if not logged in, show login prompt)
- Keep the existing site structure intact. Only add new files, modify Header.astro and BaseLayout.astro.
- The tracker page should be self-contained (all its JS in one file or a few imports)
- Test by running `npm run dev` in the rise-website directory

## File Changes Summary
NEW files:
- src/lib/supabase.ts
- src/lib/auth.ts
- src/components/AuthModal.astro
- src/pages/portal/index.astro
- src/pages/portal/tracker.astro

MODIFIED files:
- src/layouts/BaseLayout.astro (add Supabase JS CDN)
- src/components/Header.astro (add auth state, login button)

## Validation
1. `npm run dev` starts without errors
2. Homepage loads, header shows "Log in" button
3. Click "Log in" -> modal appears with login/signup tabs
4. Sign up with email -> redirects to /portal
5. Portal shows welcome message + "Nutrition Tracker" card
6. Click Nutrition Tracker -> intake flow (if first time) or app shell
7. Intake flow calculates protein correctly (60kg, fast, muscle_gain = 120g)
8. Refresh page -> stays logged in
9. Click Log out -> back to homepage, header shows "Log in" again
10. Direct visit to /portal without login -> shows login prompt or redirects
