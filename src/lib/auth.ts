// Auth helpers. All client-side: the Supabase client is initialized in
// BaseLayout.astro and exposed on window.supabaseClient.

import { getSupabase } from "./supabase";

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  return sb.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
) {
  const sb = getSupabase();
  return sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signInWithGoogle() {
  const sb = getSupabase();
  return sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/portal",
    },
  });
}

export async function signOut() {
  const sb = getSupabase();
  return sb.auth.signOut();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const sb = getSupabase();
  if (!sb) return { data: { subscription: null } };
  return sb.auth.onAuthStateChange(callback);
}

// Ensure a user_profiles row exists.
export async function ensureProfile(user: any) {
  const sb = getSupabase();
  if (!sb || !user) return;

  const { data: existing } = await sb
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const full_name =
    (user.user_metadata &&
      (user.user_metadata.full_name || user.user_metadata.name)) ||
    null;

  const { error } = await sb.from("user_profiles").insert({
    id: user.id,
    email: user.email,
    full_name,
  });
  if (error) console.warn("profile insert", error);
}

export async function hasBaseline(userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error } = await sb
    .from("baseline_intake")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("baseline lookup", error);
    return false;
  }
  return !!data;
}
