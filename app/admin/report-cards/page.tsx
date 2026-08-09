"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportCardsManager, { type ReportCardClassOption, type ReportCardTermOption, type RosterStudent } from "@/components/admin/ReportCardsManager";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";

export default function AdminReportCardsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [classes, setClasses] = useState<ReportCardClassOption[]>([]);
  const [terms, setTerms] = useState<ReportCardTermOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: classRows }, { data: termRows }] = await Promise.all([
        supabase.from("classes").select("id, name").order("name"),
        supabase.from("terms").select("id, name").order("starts_on", { ascending: false }),
      ]);
      setClasses(classRows ?? []);
      setTerms(termRows ?? []);
      setSelectedClassId(classRows?.[0]?.id ?? "");
      setSelectedTermId(termRows?.[0]?.id ?? "");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClassId || !selectedTermId) return;
    (async () => {
      // Students in this class with at least one published result for an
      // exam in this term — anyone with nothing published yet has no
      // report card to generate.
      const { data } = await supabase
        .from("users")
        .select("id, full_name, admission_number, results!inner(published, exams!inner(term_id, class_id))")
        .eq("role", "student")
        .eq("class_id", selectedClassId)
        .eq("results.published", true)
        .eq("results.exams.term_id", selectedTermId);

      const byId = new Map<string, RosterStudent>();
      for (const row of data ?? []) {
        byId.set(row.id, { studentId: row.id, fullName: row.full_name, admissionNumber: row.admission_number ?? "" });
      }
      setRoster([...byId.values()]);
    })();
  }, [selectedClassId, selectedTermId]);

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="super_admin" pageTitle="Report Cards" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <ReportCardsManager
        classOptions={classes}
        termOptions={terms}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        selectedTermId={selectedTermId}
        onTermChange={setSelectedTermId}
        roster={roster}
        principalName={authUser?.role === "super_admin" ? authUser.fullName : undefined}
      />
    </DashboardLayout>
  );
}
