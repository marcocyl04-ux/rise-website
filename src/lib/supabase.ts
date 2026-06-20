// Supabase client init.
// The anon key is safe to expose on the frontend; RLS protects the data.
// The actual client is created from the CDN script in BaseLayout.astro, since
// Astro 6 is static and we want zero build deps. This module just exposes the
// already-initialized client on window.supabaseClient with a typed helper.

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || "https://zeczlwypqqvvpraosodv.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "eyJhbG...V_KM";

declare global {
  interface Window {
    supabase: any;
    supabaseClient: any;
  }
}

export function getSupabase(): any {
  if (typeof window === "undefined") return null;
  if (window.supabaseClient) return window.supabaseClient;
  if (!window.supabase) {
    console.error("Supabase JS not loaded. Check BaseLayout CDN script.");
    return null;
  }
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return window.supabaseClient;
}
