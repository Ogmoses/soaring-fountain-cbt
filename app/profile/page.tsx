"use client";

/**
 * Shared across all three roles rather than tripled into
 * app/{admin,teacher,student}/profile — the content only differs by
 * which optional section applies (student roster info vs a teacher's
 * subject/class assignments), and DashboardLayout already takes role
 * as a plain prop, so there's nothing role-specific about the route
 * itself. Reached from the Profile item in Navbar's account menu,
 * wired once in DashboardLayout so it's live on every page for free.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, Hash, GraduationCap, BookOpen, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import PageLoading from "@/components/layout/PageLoading";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
};

interface ProfileDetails {
  email: string | null;
  admissionNumber: string | null;
  className: string | null;
  assignments: { subjectName: string; className: string }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("email, admission_number, class_id")
        .eq("id", authUser.id)
        .single();
      if (profileError) {
        setLoading(false);
        return;
      }

      let className: string | null = null;
      if (profile?.class_id) {
        const { data: classRow } = await supabase.from("classes").select("name").eq("id", profile.class_id).single();
        className = classRow?.name ?? null;
      }

      let assignments: { subjectName: string; className: string }[] = [];
      if (authUser.role === "teacher") {
        const { data: rows } = await supabase
          .from("teacher_subjects")
          .select("subjects(name), classes(name)")
          .eq("teacher_id", authUser.id);
        assignments = (rows ?? []).map((r: any) => ({ subjectName: r.subjects?.name ?? "", className: r.classes?.name ?? "" }));
      }

      setDetails({
        email: profile?.email ?? null,
        admissionNumber: profile?.admission_number ?? null,
        className,
        assignments,
      });
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-muted">
        <PageLoading />
      </div>
    );
  }

  return (
    <DashboardLayout role={authUser.role} pageTitle="Profile" userName={authUser.fullName} onLogout={() => signOutAndRedirect(router)}>
      {loading ? (
        <PageLoading />
      ) : (
        <div className="mx-auto max-w-lg pb-10">
          <div className="flex flex-col items-center rounded-lg border border-black/5 bg-white px-6 py-8 text-center shadow-card">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-crimson-100 text-crimson-700">
              <UserIcon size={32} />
            </div>
            <h1 className="mt-3 font-display text-[19px] font-semibold text-ink">{authUser.fullName}</h1>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-crimson-50 px-3 py-1 text-[12.5px] font-semibold text-crimson-700">
              <ShieldCheck size={13} /> {ROLE_LABEL[authUser.role] ?? authUser.role}
            </span>
          </div>

          <div className="mt-5 divide-y divide-black/5 rounded-lg border border-black/5 bg-white shadow-card">
            {authUser.role !== "student" && details?.email && <ProfileRow icon={Mail} label="Email" value={details.email} />}

            {authUser.role === "student" && (
              <>
                <ProfileRow icon={Hash} label="Student ID" value={details?.admissionNumber ?? "—"} />
                <ProfileRow icon={GraduationCap} label="Class" value={details?.className ?? "—"} />
              </>
            )}

            {authUser.role === "teacher" && (
              <div className="px-4 py-3.5">
                <p className="mb-2.5 flex items-center gap-2 text-[12px] font-medium text-ink/50">
                  <BookOpen size={14} /> Subjects &amp; classes
                </p>
                {details && details.assignments.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-black/5">
                    {details.assignments.map((a, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3.5 py-2.5 text-[13px] ${i > 0 ? "border-t border-black/5" : ""}`}
                      >
                        <span className="text-ink">{a.subjectName}</span>
                        <span className="rounded-full bg-background-muted px-2.5 py-1 text-[11.5px] font-medium text-ink/60">{a.className}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-ink/40">Not yet assigned — ask your admin.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-muted text-ink/50">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[11.5px] text-ink/45">{label}</p>
        <p className="truncate text-[13.5px] text-ink">{value}</p>
      </div>
    </div>
  );
}
