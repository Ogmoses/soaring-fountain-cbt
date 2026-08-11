"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClassAnalytics, { type ClassAnalyticsData, type ExamOption } from "@/components/teacher/ClassAnalytics";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { fetchExamMaxScores } from "@/lib/reportCard";
import PageLoading from "@/components/layout/PageLoading";

/** Buckets scores into 5 even bands scaled to the exam's max score, e.g. "0–6", "7–12", ... for a 30-point exam. */
function bucketScores(scores: number[], maxScore: number) {
  const bandSize = Math.max(1, Math.ceil(maxScore / 5));
  const bands = Array.from({ length: 5 }, (_, i) => {
    const lo = i * bandSize;
    const hi = i === 4 ? maxScore : lo + bandSize - 1;
    return { label: `${lo}–${hi}`, lo, hi, count: 0 };
  });
  for (const s of scores) {
    const band = bands.find((b) => s >= b.lo && s <= b.hi) ?? bands[bands.length - 1];
    band.count += 1;
  }
  return bands.map(({ label, count }) => ({ label, count }));
}

export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [data, setData] = useState<ClassAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const { data: examRows } = await supabase.from("exams").select("id, title, subjects(name)").eq("created_by", authUser.id);
      const options = (examRows ?? []).map((e: any) => ({ id: e.id, title: e.title, subjectName: e.subjects?.name ?? "" }));
      setExamOptions(options);
      setSelectedExamId(options[0]?.id ?? "");
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedExamId) {
      setData(null);
      return;
    }
    (async () => {
      const { data: exam } = await supabase
        .from("exams")
        .select("id, title, pass_mark, subjects(name), classes(name)")
        .eq("id", selectedExamId)
        .single();
      if (!exam) {
        setData(null);
        return;
      }

      const maxScores = await fetchExamMaxScores(supabase, [selectedExamId]);
      const maxScore = maxScores.get(selectedExamId) ?? 1;

      const { data: resultRows } = await supabase
        .from("results")
        .select("student_id, total_score, grade_letter, users(full_name)")
        .eq("exam_id", selectedExamId);

      const { data: answerRows } = await supabase
        .from("student_answers")
        .select("question_id, points_awarded, questions!inner(prompt, points), student_exam_sessions!inner(exam_id)")
        .eq("student_exam_sessions.exam_id", selectedExamId);

      const byQuestion = new Map<string, { prompt: string; correct: number; total: number }>();
      for (const row of answerRows ?? []) {
        const q = (row as any).questions;
        const entry = byQuestion.get(row.question_id) ?? { prompt: q.prompt, correct: 0, total: 0 };
        entry.total += 1;
        if (row.points_awarded !== null && row.points_awarded >= q.points) entry.correct += 1;
        byQuestion.set(row.question_id, entry);
      }
      const questionDifficulty = [...byQuestion.values()].map((q) => ({
        prompt: q.prompt,
        correctPercent: q.total > 0 ? (q.correct / q.total) * 100 : 0,
      }));

      const scores = (resultRows ?? []).map((r) => r.total_score);
      const ranked = [...(resultRows ?? [])].sort((a, b) => b.total_score - a.total_score);
      const passMark = exam.pass_mark ?? 0;

      setData({
        examTitle: exam.title,
        subjectName: (exam as any).subjects?.name ?? "",
        className: (exam as any).classes?.name ?? "",
        totalStudents: scores.length,
        average: scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0,
        highest: scores.length ? Math.max(...scores) : 0,
        lowest: scores.length ? Math.min(...scores) : 0,
        maxScore,
        passRate: scores.length ? (scores.filter((s) => s >= passMark).length / scores.length) * 100 : 0,
        scoreDistribution: bucketScores(scores, maxScore),
        questionDifficulty,
        students: ranked.map((r: any, i) => ({
          id: r.student_id,
          name: r.users?.full_name ?? "",
          score: r.total_score,
          maxScore,
          grade: r.grade_letter,
          rank: i + 1,
        })),
      });
    })();
  }, [selectedExamId]);

  return (
    <DashboardLayout role="teacher" pageTitle="Class Analytics" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <ClassAnalytics examOptions={examOptions} selectedExamId={selectedExamId} onExamChange={setSelectedExamId} data={data} />
      )}
    </DashboardLayout>
  );
}
