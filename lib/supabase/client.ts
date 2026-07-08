import { createBrowserClient } from "@supabase/ssr";

/**
 * Use this client in Client Components ("use client" files).
 * Reads env vars exposed to the browser — see .env.local.example.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
