"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamLaunchpad, {
  type AvailableExam,
  type UpcomingBatch,
  type PastResult,
} from "@/components/student/ExamLaunchpad";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { fetchExamMaxScores } from "@/lib/reportCard";

export default function StudentHomePage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [availableExams, setAvailableExams] = useState<AvailableExam[]>([]);
  const [upcomingBatches, setUpcomingBatches] = useState<UpcomingBatch[]>([]);
  const [pastResults, setPastResults] = useState<PastResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const now = new Date();

      const [{ data: batchRows }, { data: sessionRows }, { data: resultRows }] = await Promise.all([
        supabase
          .from("batch_students")
          .select("exam_batches(id, label, starts_at, ends_at, exams(id, title, duration_minutes, subjects(name)))")
          .eq("student_id", authUser.id),
        supabase.from("student_exam_sessions").select("exam_id, status").eq("student_id", authUser.id),
        supabase
          .from("results")
          .select("exam_id, total_score, grade_letter, exams(id, title, subjects(name), terms(name))")
          .eq("student_id", authUser.id)
          .eq("published", true),
      ]);

      const sessionStatusByExam = new Map((sessionRows ?? []).map((s) => [s.exam_id, s.status]));

      const available: AvailableExam[] = [];
      const upcoming: UpcomingBatch[] = [];

      for (const row of batchRows ?? []) {
        const b = (row as any).exam_batches;
        if (!b || !b.exams) continue;
        const startsAt = new Date(b.starts_at);
        const endsAt = new Date(b.ends_at);
        const status = sessionStatusByExam.get(b.exams.id);
        if (status === "submitted") continue; // already done — no longer relevant to the launchpad

        if (now >= startsAt && now <= endsAt) {
          available.push({
            examId: b.exams.id,
            batchId: b.id,
            title: b.exams.title,
            subjectName: b.exams.subjects?.name ?? "",
            durationMinutes: b.exams.duration_minutes,
            batchLabel: b.label,
            batchStartsAt: b.starts_at,
            batchEndsAt: b.ends_at,
            alreadyInProgress: status === "active",
          });
        } else if (now < startsAt) {
          upcoming.push({
            id: b.id,
            examTitle: b.exams.title,
            subjectName: b.exams.subjects?.name ?? "",
            batchLabel: b.label,
            startsAt: b.starts_at,
          });
        }
      }

      const examIds = [...new Set((resultRows ?? []).map((r) => r.exam_id))];
      const maxScores = await fetchExamMaxScores(supabase, examIds);

      setAvailableExams(available);
      setUpcomingBatches(upcoming);
      setPastResults(
        (resultRows ?? []).map((r: any) => ({
          id: r.exam_id,
          examTitle: r.exams?.title ?? "",
          subjectName: r.exams?.subjects?.name ?? "",
          termName: r.exams?.terms?.name ?? "",
          totalScore: r.total_score,
          maxScore: maxScores.get(r.exam_id) ?? 0,
          gradeLetter: r.grade_letter,
          takenAt: new Date().toISOString(), // `results` doesn't store a submitted-at timestamp of its own
        }))
      );
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return null; // TODO: swap in a loading skeleton once the design system has one

  return (
    <DashboardLayout role="student" pageTitle="Exam Launchpad" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      <ExamLaunchpad
        studentName={authUser?.fullName ?? ""}
        availableExams={availableExams}
        upcomingBatches={upcomingBatches}
        pastResults={pastResults}
      />
    </DashboardLayout>
  );
}
