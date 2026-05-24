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
    role: "athlete",
    team_id: "rise-hk",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

export type UserRole = "athlete" | "coach" | null;

// Read the role from user_profiles. Returns null on error so callers can fall
// back to the default athlete view.
export async function getUserRole(userId: string): Promise<{ role: UserRole; team_id: string | null }> {
  const sb = getSupabase();
  if (!sb) return { role: null, team_id: null };
  const { data, error } = await sb
    .from("user_profiles")
    .select("role, team_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("getUserRole", error);
    return { role: null, team_id: null };
  }
  return { role: (data?.role as UserRole) ?? "athlete", team_id: data?.team_id ?? null };
}

export type TeamAthlete = {
  id: string;
  email: string | null;
  full_name: string | null;
  team_id: string | null;
  baseline: {
    weight_kg: number | null;
    age: number | null;
    growth_rate: string | null;
    primary_goal: string | null;
    protein_target_g: number | null;
  } | null;
  weights: Array<{ logged_date: string; weight_kg: number }>;
  meals: Array<{
    id: string;
    meal_slot: string;
    logged_date: string;
    total_protein_g: number;
    food_items: any;
    ai_feedback: string | null;
    created_at: string;
  }>;
};

// Fetch everything the coach dashboard needs for one team in parallel.
// RLS restricts visibility: coach must have team_id, athletes share team_id.
export async function getTeamAthletes(teamId: string): Promise<TeamAthlete[]> {
  const sb = getSupabase();
  if (!sb || !teamId) return [];

  const [profilesRes, baselinesRes, weightsRes, mealsRes] = await Promise.all([
    sb
      .from("user_profiles")
      .select("id, email, full_name, team_id, role")
      .eq("team_id", teamId)
      .eq("role", "athlete"),
    sb
      .from("baseline_intake")
      .select("user_id, weight_kg, age, growth_rate, primary_goal, protein_target_g"),
    sb
      .from("daily_weight")
      .select("user_id, logged_date, weight_kg")
      .order("logged_date", { ascending: false }),
    sb
      .from("meal_logs")
      .select("id, user_id, meal_slot, logged_date, total_protein_g, food_items, ai_feedback, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (profilesRes.error) {
    console.warn("getTeamAthletes profiles", profilesRes.error);
    return [];
  }

  const profiles = profilesRes.data ?? [];
  const baselines = (baselinesRes.data ?? []) as any[];
  const weights = (weightsRes.data ?? []) as any[];
  const meals = (mealsRes.data ?? []) as any[];

  return profiles.map((p: any) => {
    const baseline = baselines.find((b) => b.user_id === p.id) || null;
    const aWeights = weights
      .filter((w) => w.user_id === p.id)
      .map((w) => ({ logged_date: w.logged_date as string, weight_kg: Number(w.weight_kg) }));
    const aMeals = meals
      .filter((m) => m.user_id === p.id)
      .map((m) => ({
        id: m.id,
        meal_slot: m.meal_slot,
        logged_date: m.logged_date,
        total_protein_g: Number(m.total_protein_g),
        food_items: m.food_items,
        ai_feedback: m.ai_feedback,
        created_at: m.created_at,
      }));

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      team_id: p.team_id,
      baseline: baseline
        ? {
            weight_kg: baseline.weight_kg,
            age: baseline.age,
            growth_rate: baseline.growth_rate,
            primary_goal: baseline.primary_goal,
            protein_target_g: baseline.protein_target_g,
          }
        : null,
      weights: aWeights,
      meals: aMeals,
    };
  });
}
