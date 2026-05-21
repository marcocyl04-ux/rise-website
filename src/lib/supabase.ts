// Supabase client init.
// The anon key is safe to expose on the frontend; RLS protects the data.
// The actual client is created from the CDN script in BaseLayout.astro, since
// Astro 6 is static and we want zero build deps. This module just exposes the
// already-initialized client on window.supabaseClient with a typed helper.

export const SUPABASE_URL = "https://zeczlwypqqvvpraosodv.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplY3psd3lwcXF2dnByYW9zb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDEyMDgsImV4cCI6MjA5NDkxNzIwOH0.I7HWRsBOXDH2UG0u6NMEkXlosrlkuMkY6w9g5RtV_KM";

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
