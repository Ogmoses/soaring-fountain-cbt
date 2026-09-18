import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side counterpart to lib/useSchoolProfile.ts's client hook — used
 * only where a component isn't available (email templates, sent from API
 * routes). Same fallback as the client hook, for the same reason: a broken
 * fetch should never produce blank branding in an email a teacher receives.
 */
export async function getSchoolNameServer(admin: SupabaseClient): Promise<string> {
  const { data } = await admin.from("school_profile").select("school_name").single();
  return data?.school_name || "CBT Platform";
}
