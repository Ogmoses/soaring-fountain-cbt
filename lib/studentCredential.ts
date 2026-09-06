/**
 * Students log in with just their name and student ID — no separate
 * password to remember or lose. Under the hood this still runs through
 * Supabase Auth like everyone else, reusing all of its session and RLS
 * machinery rather than building a parallel auth system, by deriving a
 * real password from the normalized combination of the two. This has
 * to run identically at account-creation time (server, when the admin
 * sets it) and at login time (client, when the student types it back)
 * — any difference in normalization between the two breaks sign-in.
 *
 * No framework imports here on purpose: this file gets imported from
 * both an API route (server) and a page component (client).
 */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function deriveStudentPassword(fullName: string, studentId: string): string {
  return `${normalize(fullName)}::${normalize(studentId)}`;
}

/** Turns a student ID into a valid, unique-enough email local-part — IDs like "SFGS/2026/001" contain characters (like "/") that aren't valid there. */
export function studentInternalEmail(studentId: string): string {
  const safe = studentId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safe}@students.internal`;
}
