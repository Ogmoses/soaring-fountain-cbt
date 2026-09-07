"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SchoolProfile {
  name: string;
  motto: string | null;
  logoUrl: string | null;
}

const FALLBACK: SchoolProfile = { name: "CBT Platform", motto: null, logoUrl: null };

/** "Soaring Fountain Group of Schools" -> "SFGS" — for example placeholders like a student/staff ID format. */
export function schoolAcronym(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return letters || "SCH";
}

/** "Soaring Fountain Group of Schools" -> "soaringfountaingroupofschools" — for an example email domain placeholder. */
export function schoolSlug(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slug || "school";
}

const CACHE_KEY = "sf-school-profile-cache";

function readCache(): SchoolProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SchoolProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(profile: SchoolProfile) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be unavailable (private browsing, quota) — caching is a
    // nice-to-have here, not something worth surfacing an error over.
  }
}

/**
 * One row in school_profile drives branding everywhere it appears —
 * sidebar header, login/register pages — instead of each place having
 * its own hardcoded school name. Falls back to a generic label rather
 * than nothing if the row is somehow missing, so a broken fetch never
 * shows blank branding.
 *
 * Initializes from a cached copy (synchronously, before the network
 * request even starts) rather than always starting from the generic
 * fallback — otherwise every page load flashed "CBT Platform" for a
 * moment before the real name arrived, which reads as unpolished no
 * matter how fast the fetch actually is. Only the very first load ever,
 * with nothing cached yet, still has that brief gap.
 */
export function useSchoolProfile(): SchoolProfile {
  const [profile, setProfile] = useState<SchoolProfile>(() => readCache() ?? FALLBACK);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("school_profile")
      .select("school_name, motto, logo_url")
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;
        const next: SchoolProfile = {
          name: data.school_name || FALLBACK.name,
          motto: data.motto || null,
          logoUrl: data.logo_url || null,
        };
        setProfile(next);
        writeCache(next);
      });
  }, []);

  return profile;
}
