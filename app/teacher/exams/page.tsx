"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MyExams, { type ExamListItem } from "@/components/teacher/MyExams";
import ExamRoster, { type RosterStudent, type RosterStatus } from "@/components/teacher/ExamRoster";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import PageLoading from "@/components/layout/PageLoading";

function formatBatchSummary(batches: { starts_at: string; ends_at: string }[]): string | null {
  if (batches.length === 0) return null;
  const sorted = [...batches].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeFmt = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return batches.length === 1
    ? `${dateFmt(first.starts_at)}, ${timeFmt(first.starts_at)}–${timeFmt(first.ends_at)}`
    : `${batches.length} sittings, ${dateFmt(first.starts_at)}–${dateFmt(last.ends_at)}`;
}

export default function MyExamsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingExam, setViewingExam] = useState<{ title: string; className: string; students: RosterStudent[] } | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  const load = async () => {
    if (!authUser) return;
    setError(null);

    const { data: examRows } = await supabase
      .from("exams")
      .select("id, title, status, is_terminal, subjects(name), classes(id, name), terms(name), exam_batches(id, starts_at, ends_at)")
      .eq("created_by", authUser.id)
      .order("created_at", { ascending: false });

    const rows = examRows ?? [];
    const examIds = rows.map((e: any) => e.id);
    const classIds = [...new Set(rows.map((e: any) => e.classes?.id).filter(Boolean))];

    const [{ data: sessionRows }, { data: resultRows }, { data: rosterRows }] = await Promise.all([
      examIds.length > 0 ? supabase.from("student_exam_sessions").select("exam_id, status").in("exam_id", examIds) : Promise.resolve({ data: [] }),
      examIds.length > 0 ? supabase.from("results").select("exam_id").in("exam_id", examIds) : Promise.resolve({ data: [] }),
      classIds.length > 0 ? supabase.from("users").select("class_id").eq("role", "student").eq("is_active", true).in("class_id", classIds) : Promise.resolve({ data: [] }),
    ]);

    setExams(
      rows.map((e: any) => {
        const sessionsForExam = (sessionRows ?? []).filter((s: any) => s.exam_id === e.id);
        const resultsForExam = (resultRows ?? []).filter((r: any) => r.exam_id === e.id);
        const batches = e.exam_batches ?? [];
        const latestEndsAt = batches.length > 0 ? batches.map((b: any) => b.ends_at).sort().slice(-1)[0] : null;
        return {
          id: e.id,
          title: e.title,
          subjectName: e.subjects?.name ?? "",
          classId: e.classes?.id ?? "",
          className: e.classes?.name ?? "",
          termName: e.terms?.name ?? "",
          status: e.status,
          isTerminal: e.is_terminal,
          batchSummary: formatBatchSummary(batches),
          latestBatchEndsAt: latestEndsAt,
          hasStudentActivity: sessionsForExam.length > 0 || resultsForExam.length > 0,
          totalStudents: (rosterRows ?? []).filter((u: any) => u.class_id === e.classes?.id).length,
          completedCount: sessionsForExam.filter((s: any) => s.status === "submitted").length,
        };
      })
    );
    setClasses([...new Map(rows.map((e: any) => [e.classes?.id, e.classes?.name])).entries()].filter(([id]) => id).map(([id, name]) => ({ id, name })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (examId: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", examId);
    if (error) throw new Error(error.message);
    await load();
  };

  const handleArchive = async (examId: string) => {
    const { error } = await supabase.from("exams").update({ status: "archived" }).eq("id", examId);
    if (error) throw new Error(error.message);
    await load();
  };

  const handleViewRoster = async (examId: string) => {
    setRosterLoading(true);
    const exam = exams.find((e) => e.id === examId);
    if (!exam) { setRosterLoading(false); return; }

    const [{ data: rosterRows }, { data: sessionRows }, { data: resultRows }] = await Promise.all([
      supabase.from("users").select("id, full_name, admission_number").eq("role", "student").eq("class_id", exam.classId).eq("is_active", true),
      supabase.from("student_exam_sessions").select("student_id, status").eq("exam_id", examId),
      supabase.from("results").select("student_id, total_score").eq("exam_id", examId),
    ]);

    const sessionByStudent = new Map((sessionRows ?? []).map((s: any) => [s.student_id, s.status as RosterStatus]));
    const resultByStudent = new Map((resultRows ?? []).map((r: any) => [r.student_id, r.total_score]));

    const students: RosterStudent[] = (rosterRows ?? []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      admissionNumber: u.admission_number,
      status: sessionByStudent.get(u.id) ?? "not_started",
      score: resultByStudent.has(u.id) ? Number(resultByStudent.get(u.id)) : null,
      maxScore: resultByStudent.has(u.id) ? 100 : null,
    }));

    setViewingExam({ title: exam.title, className: exam.className, students });
    setRosterLoading(false);
  };

  return (
    <DashboardLayout role="teacher" pageTitle="My Exams" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? (
        <PageLoading />
      ) : (
        <>
          {error && <p className="mb-4 rounded-lg bg-crimson-50 px-3.5 py-2.5 text-[13px] text-crimson-700">{error}</p>}
          <MyExams
            exams={exams}
            classes={classes}
            onNew={() => router.push("/teacher/exams/new")}
            onEdit={(id) => router.push(`/teacher/exams/${id}/edit`)}
            onViewRoster={handleViewRoster}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        </>
      )}

      {viewingExam && (
        <ExamRoster
          examTitle={viewingExam.title}
          className={viewingExam.className}
          students={viewingExam.students}
          onClose={() => setViewingExam(null)}
        />
      )}
    </DashboardLayout>
  );
}
