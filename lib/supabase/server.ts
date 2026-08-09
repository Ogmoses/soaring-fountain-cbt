import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client — for Route Handlers (app/api/**\/route.ts)
 * and Server Components. Reads/writes the auth cookie so `auth.uid()`
 * resolves correctly in RLS policies (see database/schema.sql §8).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component render — middleware refreshes
          // the session cookie instead, so this can be safely ignored.
        }
      },
    },
  });
}
