import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — safe to call from "use client" components.
 * Reads the public URL/anon key from env vars set in `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
