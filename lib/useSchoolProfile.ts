"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SchoolProfile {
  name: string;
  motto: string | null;
  logoUrl: string | null;
}

const FALLBACK: SchoolProfile = { name: "CBT Platform", motto: null, logoUrl: null };

/**
 * One row in school_profile drives branding everywhere it appears —
 * sidebar header, login/register pages — instead of each place having
 * its own hardcoded school name. Falls back to a generic label rather
 * than nothing if the row is somehow missing, so a broken fetch never
 * shows blank branding.
 */
export function useSchoolProfile(): SchoolProfile {
  const [profile, setProfile] = useState<SchoolProfile>(FALLBACK);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("school_profile")
      .select("school_name, motto, logo_url")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        setProfile({
          name: data.school_name || FALLBACK.name,
          motto: data.motto || null,
          logoUrl: data.logo_url || null,
        });
      });
  }, []);

  return profile;
}
