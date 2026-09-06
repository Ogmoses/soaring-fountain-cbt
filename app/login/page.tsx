"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/client";
import { deriveStudentPassword } from "@/lib/studentCredential";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleStudentLogin = async (fullName: string, studentId: string) => {
    // Student IDs aren't emails, and Supabase Auth signs in by email —
    // resolve it server-side first (see the route for why this can't just
    // be a browser-side RLS-guarded query: there's no session yet).
    const res = await fetch("/api/auth/resolve-student-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "We couldn't find that student ID.");

    const password = deriveStudentPassword(fullName, studentId);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password });
    if (error) throw new Error("Your name and student ID didn't match what's on file. Double-check both and try again.");
    router.push("/student");
  };

  const handleStaffLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Incorrect email or password.");

    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user!.id).single();
    router.push(profile?.role === "super_admin" ? "/admin" : "/teacher");
  };

  return <LoginForm onStudentLogin={handleStudentLogin} onStaffLogin={handleStaffLogin} />;
}
