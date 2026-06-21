/**
 * Auth modal controller — login, signup, invite codes, Google OAuth, Turnstile.
 * Imported by AuthModal.astro. Runs at module load (after DOM parsed).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getLang, getTranslation } from "./i18n";

function t(key: string, params?: Record<string, string | number>): string {
  let s = getTranslation(getLang(), key);
  if (params) {
    for (const k in params) s = s.replace(`{${k}}`, String(params[k]));
  }
  return s;
}

const modal = document.getElementById("auth-modal");
const loginForm = document.getElementById("auth-login-form") as HTMLFormElement | null;
const signupForm = document.getElementById("auth-signup-form") as HTMLFormElement | null;
const loginMsg = document.getElementById("auth-login-msg");
const signupMsg = document.getElementById("auth-signup-msg");

function getSb(): SupabaseClient | null {
  return window.supabaseClient ?? null;
}

function openModal() {
  if (!modal) return;
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    const first = modal.querySelector<HTMLInputElement>('input[name="email"]');
    first?.focus();
  }, 60);
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute("hidden", "");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setMsg(loginMsg, "");
  setMsg(signupMsg, "");
}

function setMsg(el: Element | null, text: string, type: "" | "error" | "success" = "") {
  if (!el) return;
  el.textContent = text;
  el.className = "auth-msg" + (type ? " " + type : "");
}

function switchTab(which: "login" | "signup") {
  document.querySelectorAll<HTMLButtonElement>(".auth-tab").forEach((btn) => {
    const active = btn.dataset.authTab === which;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  loginForm?.toggleAttribute("hidden", which !== "login");
  signupForm?.toggleAttribute("hidden", which !== "signup");
  setMsg(loginMsg, "");
  setMsg(signupMsg, "");
}

// Expose open/close globally so Header and other scripts can call it.
declare global {
  interface Window {
    openAuthModal: () => void;
    closeAuthModal: () => void;
    __authSwitchTab: (which: "login" | "signup") => void;
    __redeemInviteCode: (userId: string) => Promise<string | null>;
    __turnstile_token?: string;
  }
}
window.openAuthModal = openModal;
window.closeAuthModal = closeModal;

// --- Click delegation ---
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-open-auth]")) {
    e.preventDefault();
    openModal();
  } else if (target.closest("[data-close-auth]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) {
    closeModal();
  }
});

document.querySelectorAll<HTMLButtonElement>(".auth-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTab(btn.dataset.authTab as "login" | "signup");
  });
});

// --- Login ---
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sb = getSb();
  if (!sb) return setMsg(loginMsg, t("auth.unavailable"), "error");
  const form = e.currentTarget as HTMLFormElement;
  const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;
  if (!email || !password) return setMsg(loginMsg, "Please enter email and password.", "error");
  setMsg(loginMsg, t("auth.loggingIn"));
  try {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message?.includes("Invalid login credentials")
        ? "No account found with these credentials. Check your email or sign up."
        : error.message;
      return setMsg(loginMsg, msg, "error");
    }
    setMsg(loginMsg, "");
    closeModal();
    window.location.href = "/portal";
  } catch (err) {
    setMsg(loginMsg, (err instanceof Error ? err.message : null) || "Login failed. Please try again.", "error");
  }
});

// --- Invite codes ---
const VALIDATE_FN = "https://zeczlwypqqvvpraosodv.supabase.co/functions/v1/validate-invite-code";
let validatedCode: { code: string; role: string } | null = null;

function getInviteInput(): HTMLInputElement | null {
  return document.getElementById("signup-invite-code") as HTMLInputElement | null;
}
function getInviteStatus(): HTMLElement | null {
  return document.getElementById("invite-code-status");
}
function getInviteHint(): HTMLElement | null {
  return document.getElementById("invite-code-hint");
}

function setInviteState(state: "idle" | "checking" | "valid" | "invalid", msg?: string) {
  const input = getInviteInput();
  const status = getInviteStatus();
  const hint = getInviteHint();
  if (!input || !status) return;
  status.className = "invite-code-status " + (state === "idle" ? "" : state);
  input.classList.remove("is-valid", "is-invalid");
  if (state === "valid") input.classList.add("is-valid");
  if (state === "invalid") input.classList.add("is-invalid");
  if (hint && msg) hint.textContent = msg;
  else if (hint && state === "valid") hint.textContent = "Valid code";
  else if (hint && state === "invalid") hint.textContent = msg || "Invalid code";
  else if (hint) hint.textContent = "Required to create an account";
}

async function validateInviteCode(code: string): Promise<boolean> {
  if (!code) { setInviteState("idle"); validatedCode = null; return false; }
  setInviteState("checking");
  try {
    const sb = getSb();
    const res = await fetch(VALIDATE_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": sb?.supabaseKey || "",
        "Authorization": "Bearer " + (sb?.supabaseKey || ""),
      },
      body: JSON.stringify({ action: "validate", code }),
    });
    const data = await res.json();
    if (data.valid) {
      validatedCode = { code, role: data.role };
      setInviteState("valid");
      return true;
    } else {
      validatedCode = null;
      setInviteState("invalid", data.error || "Invalid invite code");
      return false;
    }
  } catch {
    validatedCode = null;
    setInviteState("invalid", "Could not verify code. Try again.");
    return false;
  }
}

async function redeemInviteCode(userId: string): Promise<string | null> {
  const code = validatedCode?.code || sessionStorage.getItem("pending_invite_code");
  if (!code) return null;
  const sb = getSb();
  if (!sb) return null;
  try {
    const session = (await sb.auth.getSession()).data.session;
    const res = await fetch(VALIDATE_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": sb.supabaseKey,
        "Authorization": "Bearer " + (session?.access_token || ""),
      },
      body: JSON.stringify({ action: "redeem", code, user_id: userId }),
    });
    const data = await res.json();
    sessionStorage.removeItem("pending_invite_code");
    if (data.success) return data.role;
    return null;
  } catch {
    return null;
  }
}

// Invite input handlers
getInviteInput()?.addEventListener("blur", () => {
  const code = getInviteInput()?.value.trim().toUpperCase() || "";
  if (code) validateInviteCode(code);
});

getInviteInput()?.addEventListener("input", () => {
  const input = getInviteInput();
  if (input) input.value = input.value.toUpperCase();
  if (validatedCode && input && input.value.trim() !== validatedCode.code) {
    validatedCode = null;
    setInviteState("idle");
  }
});

// --- Signup ---
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sb = getSb();
  if (!sb) return setMsg(signupMsg, t("auth.unavailable"), "error");
  const form = e.currentTarget as HTMLFormElement;
  const full_name = (form.elements.namedItem("full_name") as HTMLInputElement).value.trim();
  const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;
  const inviteCode = (form.elements.namedItem("invite_code") as HTMLInputElement).value.trim().toUpperCase();
  if (!full_name) return setMsg(signupMsg, "Name is required.", "error");
  if (!email) return setMsg(signupMsg, "Email is required.", "error");
  if (!email.includes("@")) return setMsg(signupMsg, "Please enter a valid email.", "error");
  if (password.length < 6) return setMsg(signupMsg, "Password must be at least 6 characters.", "error");

  if (!inviteCode) return setMsg(signupMsg, "Invite code is required.", "error");
  if (!validatedCode || validatedCode.code !== inviteCode) {
    const valid = await validateInviteCode(inviteCode);
    if (!valid) return setMsg(signupMsg, "Invalid or expired invite code.", "error");
  }

  // Turnstile CAPTCHA
  const turnstileToken = window.__turnstile_token;
  if (!turnstileToken) return setMsg(signupMsg, "Please wait for security verification.", "error");
  setMsg(signupMsg, "Verifying...");
  try {
    const verifyRes = await fetch("https://zeczlwypqqvvpraosodv.supabase.co/functions/v1/verify-captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });
    if (!verifyRes.ok) {
      setMsg(signupMsg, "Security verification failed. Please reload and try again.", "error");
      window.__turnstile_token = undefined;
      return;
    }
  } catch {
    setMsg(signupMsg, "Could not verify. Please try again.", "error");
    return;
  }

  setMsg(signupMsg, t("auth.creating"));
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error) return setMsg(signupMsg, error.message, "error");
  if (!data.session) {
    return setMsg(signupMsg, t("auth.checkEmail"), "success");
  }
  const role = await redeemInviteCode(data.user!.id);
  setMsg(signupMsg, "");
  closeModal();
  window.location.href = "/portal";
});

// --- Google sign-in ---
async function googleSignIn() {
  const sb = getSb();
  if (!sb) {
    setMsg(loginMsg, t("auth.unavailable"), "error");
    setMsg(signupMsg, t("auth.unavailable"), "error");
    return;
  }
  const inviteInput = getInviteInput();
  if (inviteInput && !signupForm?.hasAttribute("hidden")) {
    const code = inviteInput.value.trim().toUpperCase();
    if (!code) {
      setMsg(signupMsg, "Enter your invite code before signing in with Google.", "error");
      return;
    }
    const valid = await validateInviteCode(code);
    if (!valid) {
      setMsg(signupMsg, "Invalid or expired invite code.", "error");
      return;
    }
    sessionStorage.setItem("pending_invite_code", code);
  }
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/portal" },
  });
  if (error) {
    setMsg(loginMsg, error.message, "error");
    setMsg(signupMsg, error.message, "error");
  }
}

document.getElementById("auth-login-google")?.addEventListener("click", googleSignIn);
document.getElementById("auth-signup-google")?.addEventListener("click", googleSignIn);

// Expose for portal scripts
window.__authSwitchTab = switchTab;
window.__redeemInviteCode = redeemInviteCode;
