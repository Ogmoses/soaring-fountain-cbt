"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ResultsAnalytics from "@/components/admin/ResultsAnalytics";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { fetchExamMaxScores } from "@/lib/reportCard";
import type { ClassPerformance, PendingResult, SubjectPerformance } from "@/components/admin/types";

export default function AdminResultsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [pending, setPending] = useState<PendingResult[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [schoolAveragePercent, setSchoolAveragePercent] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    // ---- Pending publication: unpublished results, grouped by exam ----
    const { data: pendingRows } = await supabase
      .from("results")
      .select("exam_id, total_score, exams(id, title, subject_id, class_id, created_by, subjects(name), classes(name), users(full_name))")
      .eq("published", false);

    const pendingExamIds = [...new Set((pendingRows ?? []).map((r: any) => r.exam_id))];
    const pendingMaxScores = await fetchExamMaxScores(supabase, pendingExamIds);

    const pendingByExam = new Map<string, PendingResult>();
    for (const row of pendingRows ?? []) {
      const exam = (row as any).exams;
      const existing = pendingByExam.get(row.exam_id);
      const maxScore = pendingMaxScores.get(row.exam_id) ?? 1;
      if (existing) {
        existing.averageScore = (existing.averageScore * existing.studentCount + row.total_score) / (existing.studentCount + 1);
        existing.studentCount += 1;
      } else {
        pendingByExam.set(row.exam_id, {
          examId: row.exam_id,
          examTitle: exam.title,
          subjectName: exam.subjects?.name ?? "",
          className: exam.classes?.name ?? "",
          teacherName: exam.users?.full_name ?? "",
          studentCount: 1,
          averageScore: row.total_score,
          maxScore,
        });
      }
    }

    // ---- Performance: published results, grouped by class and by subject ----
    const { data: publishedRows } = await supabase
      .from("results")
      .select("exam_id, total_score, exams(id, class_id, subject_id, classes(name), subjects(name))")
      .eq("published", true);

    const publishedExamIds = [...new Set((publishedRows ?? []).map((r: any) => r.exam_id))];
    const publishedMaxScores = await fetchExamMaxScores(supabase, publishedExamIds);

    const classTotals = new Map<string, { sum: number; count: number }>();
    const subjectTotals = new Map<string, { sum: number; count: number }>();
    let schoolSum = 0;
    let schoolCount = 0;

    for (const row of publishedRows ?? []) {
      const exam = (row as any).exams;
      const maxScore = publishedMaxScores.get(row.exam_id) ?? 1;
      const percent = (row.total_score / maxScore) * 100;

      const className = exam.classes?.name ?? "Unknown";
      const classEntry = classTotals.get(className) ?? { sum: 0, count: 0 };
      classTotals.set(className, { sum: classEntry.sum + percent, count: classEntry.count + 1 });

      const subjectName = exam.subjects?.name ?? "Unknown";
      const subjectEntry = subjectTotals.get(subjectName) ?? { sum: 0, count: 0 };
      subjectTotals.set(subjectName, { sum: subjectEntry.sum + percent, count: subjectEntry.count + 1 });

      schoolSum += percent;
      schoolCount += 1;
    }

    setPending([...pendingByExam.values()]);
    setClassPerformance([...classTotals.entries()].map(([className, { sum, count }]) => ({ className, averagePercent: sum / count })));
    setSubjectPerformance([...subjectTotals.entries()].map(([subjectName, { sum, count }]) => ({ subjectName, averagePercent: sum / count })));
    setSchoolAveragePercent(schoolCount > 0 ? schoolSum / schoolCount : 0);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = async (examId: string) => {
    await supabase.from("results").update({ published: true }).eq("exam_id", examId);
    await loadAll();
  };

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="super_admin" pageTitle="Results & Analytics" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <ResultsAnalytics
        pendingResults={pending}
        classPerformance={classPerformance}
        subjectPerformance={subjectPerformance}
        schoolAveragePercent={schoolAveragePercent}
        onPublish={handlePublish}
      />
    </DashboardLayout>
  );
}
