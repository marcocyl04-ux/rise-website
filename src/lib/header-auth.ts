/**
 * Header auth UI — hamburger menu, auth state display, user dropdown, logout.
 * Imported by Header.astro. Runs at module load.
 */

import type { User } from "@supabase/supabase-js";

// --- Hamburger menu ---
const hamburgerBtn = document.getElementById("hamburger-btn");
const mobileNav = document.getElementById("mobile-nav");

hamburgerBtn?.addEventListener("click", () => {
  const isOpen = mobileNav?.hasAttribute("hidden") === false;
  if (isOpen) {
    mobileNav?.setAttribute("hidden", "");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  } else {
    mobileNav?.removeAttribute("hidden");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
});

// ===== Auth state =====
function deriveDisplayName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata || {};
  return (meta.full_name || meta.name || user.email?.split("@")[0] || "User").trim();
}

function applyAuthState(user: User | null) {
  const isAuthed = !!user;
  document.querySelectorAll<HTMLElement>("[data-auth-anon]").forEach((el) => {
    el.toggleAttribute("hidden", isAuthed);
  });
  document.querySelectorAll<HTMLElement>("[data-auth-user]").forEach((el) => {
    el.toggleAttribute("hidden", !isAuthed);
  });

  if (isAuthed) {
    const name = deriveDisplayName(user);
    const nameLabel = document.getElementById("user-name-label");
    const avatar = document.getElementById("user-avatar");
    if (nameLabel) nameLabel.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase() || "?";
  }
}

async function initAuthUI() {
  const sb = window.supabaseClient;
  if (!sb) {
    // Retry shortly — Supabase CDN may not be parsed yet
    setTimeout(initAuthUI, 100);
    return;
  }
  const { data } = await sb.auth.getSession();
  applyAuthState(data.session?.user || null);
  sb.auth.onAuthStateChange((_event: string, session) => {
    applyAuthState(session?.user || null);
  });
}

initAuthUI();

// --- User menu dropdown ---
const userMenuBtn = document.getElementById("user-menu-btn");
const userMenuPanel = document.getElementById("user-menu-panel");

userMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = userMenuPanel?.hasAttribute("hidden") === false;
  if (open) {
    userMenuPanel?.setAttribute("hidden", "");
    userMenuBtn.setAttribute("aria-expanded", "false");
  } else {
    userMenuPanel?.removeAttribute("hidden");
    userMenuBtn.setAttribute("aria-expanded", "true");
  }
});

document.addEventListener("click", (e) => {
  if (!userMenuPanel || userMenuPanel.hasAttribute("hidden")) return;
  if (!(e.target as HTMLElement).closest(".user-menu")) {
    userMenuPanel.setAttribute("hidden", "");
    userMenuBtn?.setAttribute("aria-expanded", "false");
  }
});

// --- Logout ---
async function handleLogout() {
  const sb = window.supabaseClient;
  if (!sb) return;
  await sb.auth.signOut();
  window.location.href = "/";
}

document.getElementById("header-logout-btn")?.addEventListener("click", handleLogout);
document.getElementById("mobile-logout-btn")?.addEventListener("click", handleLogout);
