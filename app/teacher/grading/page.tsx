"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GradingQueue, { type ExamOption } from "@/components/teacher/GradingQueue";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import type { GradingItem } from "@/components/teacher/types";
import PageLoading from "@/components/layout/PageLoading";

export default function TeacherGradingPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [items, setItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const { data: examRows } = await supabase
        .from("exams")
        .select("id, title, subjects(name)")
        .eq("created_by", authUser.id)
        .eq("status", "published");
      const options = (examRows ?? []).map((e: any) => ({ id: e.id, title: e.title, subjectName: e.subjects?.name ?? "" }));
      setExamOptions(options);
      setSelectedExamId(options[0]?.id ?? "");
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedExamId) {
      setItems([]);
      return;
    }
    (async () => {
      // Manually-marked types only (fill_blank/short_theory) — objective
      // questions are already auto-graded at submission time.
      const { data } = await supabase
        .from("student_answers")
        .select(
          "id, free_text_answer, points_awarded, feedback, questions!inner(type, prompt, reference_answer, points), student_exam_sessions!inner(exam_id, student_id, users(full_name))"
        )
        .eq("student_exam_sessions.exam_id", selectedExamId)
        .in("questions.type", ["fill_blank", "short_theory"]);

      setItems(
        (data ?? []).map((row: any) => ({
          id: row.id,
          studentName: row.student_exam_sessions?.users?.full_name ?? "",
          questionType: row.questions.type,
          questionPrompt: row.questions.prompt,
          referenceAnswer: row.questions.reference_answer,
          studentAnswerText: row.free_text_answer ?? "",
          maxPoints: row.questions.points,
          pointsAwarded: row.points_awarded,
          feedback: row.feedback ?? undefined,
        }))
      );
    })();
  }, [selectedExamId]);

  const handleGrade = async (itemId: string, pointsAwarded: number, feedback: string) => {
    const res = await fetch("/api/student-answers/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId: itemId, pointsAwarded, feedback }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't save this grade.");
    }
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, pointsAwarded, feedback } : i)));
  };

  return (
    <DashboardLayout role="teacher" pageTitle="Grading Queue" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? <PageLoading /> : (
        <GradingQueue examOptions={examOptions} selectedExamId={selectedExamId} onExamChange={setSelectedExamId} items={items} onGrade={handleGrade} />
      )}
    </DashboardLayout>
  );
}
