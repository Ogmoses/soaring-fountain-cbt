"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GradingQueue, { type ExamOption } from "@/components/teacher/GradingQueue";
import type { GradingItem } from "@/components/teacher/types";
// import { createClient } from "@/lib/supabase/client";

// TODO: replace with exams this teacher created that have ungraded
// fill_blank/short_theory answers (join exams → student_answers where
// is_auto_graded is false and points_awarded is null).
const EXAM_OPTIONS: ExamOption[] = [{ id: "exam-1", title: "Mid-Term Test", subjectName: "Mathematics" }];

const ITEMS_BY_EXAM: Record<string, GradingItem[]> = {
  "exam-1": [
    {
      id: "ans-1",
      studentName: "Chidinma Okafor",
      questionType: "short_theory",
      questionPrompt: "Explain, in your own words, why the discriminant tells you how many real roots a quadratic has.",
      referenceAnswer: "Should mention b²−4ac: positive → two real roots, zero → one repeated root, negative → no real roots.",
      studentAnswerText: "If b squared minus 4ac is positive there are two answers, if it's zero there is one, if it's negative there are none because you can't square root a negative number.",
      maxPoints: 4,
      pointsAwarded: null,
    },
    {
      id: "ans-2",
      studentName: "Tunde Balogun",
      questionType: "fill_blank",
      questionPrompt: "Simplify 12/16 to its lowest terms.",
      referenceAnswer: "3/4",
      studentAnswerText: "6/8",
      maxPoints: 1,
      pointsAwarded: null,
    },
  ],
};

export default function TeacherGradingPage() {
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState(EXAM_OPTIONS[0].id);
  const [itemsByExam, setItemsByExam] = useState(ITEMS_BY_EXAM);

  const items = itemsByExam[selectedExamId] ?? [];

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
    setItemsByExam((prev) => ({
      ...prev,
      [selectedExamId]: (prev[selectedExamId] ?? []).map((i) => (i.id === itemId ? { ...i, pointsAwarded, feedback } : i)),
    }));
  };

  return (
    <DashboardLayout role="teacher" pageTitle="Grading Queue" userName="Mrs. Adeyemi" onLogout={() => router.push("/login")}>
      <GradingQueue examOptions={EXAM_OPTIONS} selectedExamId={selectedExamId} onExamChange={setSelectedExamId} items={items} onGrade={handleGrade} />
    </DashboardLayout>
  );
}
