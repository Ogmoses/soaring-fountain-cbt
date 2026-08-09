import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS entirely. Server-only: never
 * import this from a "use client" component or expose
 * SUPABASE_SECRET_KEY as a NEXT_PUBLIC_ variable. Use it for the
 * handful of things the anon key legitimately can't do under RLS:
 *   - resolving a student's email from their admission number pre-login
 *   - inviting/creating/deleting Supabase Auth users (PeopleManager, bulk import)
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
