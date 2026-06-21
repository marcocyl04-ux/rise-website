// Supabase client init.
// The anon key is safe to expose on the frontend; RLS protects the data.
// The actual client is created from the CDN script in BaseLayout.astro, since
// Astro 6 is static and we want zero build deps. This module just exposes the
// already-initialized client on window.supabaseClient with a typed helper.
//
// @supabase/supabase-js is installed as a devDependency for types only —
// the runtime code is loaded from CDN.

import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || "https://zeczlwypqqvvpraosodv.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "eyJhbG...V_KM";

declare global {
  interface Window {
    // CDN attaches the library namespace (createClient lives here)
    supabase: { createClient: (...args: unknown[]) => SupabaseClient };
    // Cached typed instance after first init
    supabaseClient: SupabaseClient | null;
  }
}

export function getSupabase(): SupabaseClient | null {
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
