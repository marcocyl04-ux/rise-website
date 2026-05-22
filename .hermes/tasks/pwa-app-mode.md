# PWA App Mode — Hide Marketing Chrome, Smart Install

## Goal
When RISE is installed as a PWA (standalone mode), it should feel like a native app:
- No marketing nav bar, no footer
- Opens directly to the portal (not the marketing landing page)
- Install prompt is smart: don't annoy users who are trying to use the portal

When opened in a regular browser, everything stays exactly the same (marketing site + login button + portal).

## Changes Required

### 1. PWA Standalone Detection (BaseLayout.astro)
Add a script block that detects standalone mode and adds a CSS class:

```js
// Detect if running as installed PWA
const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
  || window.navigator.standalone === true; // iOS Safari

if (isStandalone) {
  document.documentElement.classList.add('pwa-standalone');
}
```

This should run early (in the <head> or right after <body>) to prevent flash of marketing content.

### 2. Hide Marketing Chrome in Standalone Mode (global.css or BaseLayout)
Add CSS rules:

```css
.pwa-standalone .site-header,
.pwa-standalone .site-footer,
.pwa-standalone .floating-whatsapp {
  display: none !important;
}
```

This hides the Header, Footer, and WhatsApp floating button when in standalone mode. The portal content renders normally.

### 3. Auto-Redirect to /portal in Standalone Mode
In BaseLayout.astro, add a script that redirects:

```js
if (isStandalone && window.location.pathname === '/') {
  window.location.replace('/portal');
}
```

This should check if user is authenticated first. If not authenticated, redirect to /portal which already shows the "Sign in to your portal" prompt with login button.

### 4. Smart Install Banner Behavior
Current behavior: install banner shows on every page until dismissed.

New behavior:
- **In standalone mode**: NEVER show the install banner (already installed)
- **On portal pages (/portal, /portal/tracker, /portal/coach)**: Show the install banner ONLY on first visit, then respect localStorage dismissal. Don't show it again after dismissed.
- **On marketing pages (/)**: Show normally (current behavior)

The install banner code is in BaseLayout.astro (lines ~183-260). Modify the `showBanner()` logic:

```js
// Don't show if already in standalone mode
if (isStandalone) return;

// On portal pages, only show if never dismissed
var isPortalPage = window.location.pathname.startsWith('/portal');
if (isPortalPage && localStorage.getItem(STORAGE_KEY)) return;

// On marketing pages, show normally (existing logic)
```

### 5. iOS Install Guide Page
Create a new page at `/install-guide` with step-by-step instructions for iOS users:

Content:
- Title: "Install RISE on your phone"
- For Android: "Tap the Install button that appears at the bottom of the screen"
- For iOS (with screenshots or icons):
  1. Tap the Share button (box with arrow icon) at the bottom of Safari
  2. Scroll down and tap "Add to Home Screen"
  3. Tap "Add" in the top right
  4. RISE will appear on your home screen like an app
- Link to this page from the portal (a small "Get the app" link in the portal header or a one-time banner)

The portal dashboard (index.astro) should show a small "Install as app" link or banner for non-standalone users. Something subtle in the portal header area:

```html
<a href="/install-guide" class="portal-install-hint" id="portal-install-hint">
  📱 Install RISE as an app
</a>
```

This link should:
- Be hidden in standalone mode (`.pwa-standalone .portal-install-hint { display: none }`)
- Be hidden if install banner was already dismissed
- Be visible otherwise for browser users on portal pages

### 6. Portal Page Adjustments for Standalone Mode
In standalone mode, the portal pages should:
- Have proper safe-area-inset padding for notched phones (iPhone X+)
- The portal header should include a subtle RISE branding (small logo or text) since the marketing header is hidden

Add to BaseLayout:
```css
.pwa-standalone {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

And in the portal pages, add a minimal app header in standalone mode:
```html
<div class="pwa-app-header" id="pwa-app-header">
  <img src="/logo-header.png" alt="RISE" class="pwa-app-header-logo" />
</div>
```
```css
.pwa-app-header { display: none; }
.pwa-standalone .pwa-app-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
}
.pwa-app-header-logo { height: 24px; }
```

## Files to Modify
- `src/layouts/BaseLayout.astro` — standalone detection, redirect, safe-area CSS, install banner logic
- `src/styles/global.css` — hide chrome CSS rules, safe-area padding, app header styles
- `src/pages/portal/index.astro` — add minimal app header, add install hint link
- `src/pages/portal/tracker.astro` — add minimal app header
- `src/pages/portal/coach.astro` — add minimal app header
- `src/pages/install-guide.astro` — NEW: iOS/Android install instructions

## What NOT to Change
- Marketing site pages (landing, services, etc.) — keep exactly as-is
- Auth flow — keep exactly as-is
- Tracker functionality — keep exactly as-is
- Coach dashboard — keep exactly as-is
- Service worker — keep exactly as-is
- manifest.json — keep exactly as-is (start_url is already /portal)

## Testing
After building, verify:
1. Open riseadvancement.com in Chrome → marketing site shows with nav bar + footer ✓
2. Log in on website → portal works with marketing chrome ✓
3. Install PWA → opens to /portal, no marketing chrome ✓
4. In PWA, navigate to /portal/tracker → clean app-like UI ✓
5. In PWA, navigate to /portal/coach → clean app-like UI ✓
6. Install banner does NOT show in PWA mode ✓
7. Install banner shows on marketing site ✓
8. "Install as app" link shows on portal for browser users ✓
9. "Install as app" link hidden in PWA mode ✓
10. iOS install guide page works ✓
11. Safe-area padding works on notched phones ✓
