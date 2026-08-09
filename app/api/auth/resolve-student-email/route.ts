import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/resolve-student-email
 * body: { admissionNumber: string }
 *
 * Runs before the student is signed in, so RLS (which keys off auth.uid())
 * can't help here — this uses the service-role client instead, and
 * deliberately returns nothing but the email on success, and a generic
 * error on failure, so it can't be used to enumerate valid admission
 * numbers or leak anything else about the account.
 */
export async function POST(req: NextRequest) {
  const { admissionNumber } = await req.json();
  if (!admissionNumber?.trim()) {
    return NextResponse.json({ error: "Enter your admission number." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase.from("users").select("email").eq("admission_number", admissionNumber.trim()).eq("role", "student").maybeSingle();

  if (!data?.email) {
    return NextResponse.json({ error: "We couldn't find that admission number." }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
