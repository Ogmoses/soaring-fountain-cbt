"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ClassAnalytics, { type ClassAnalyticsData, type ExamOption } from "@/components/teacher/ClassAnalytics";
// import { createClient } from "@/lib/supabase/client";

// TODO: replace with exams this teacher created that have published results.
const EXAM_OPTIONS: ExamOption[] = [{ id: "exam-1", title: "Mid-Term Test", subjectName: "Mathematics" }];

// TODO: aggregate from `results` (+ `student_answers` for per-question
// correctness) joined to `users` for the class roster.
const DATA_BY_EXAM: Record<string, ClassAnalyticsData> = {
  "exam-1": {
    examTitle: "Mid-Term Test",
    subjectName: "Mathematics",
    className: "JSS1",
    totalStudents: 5,
    average: 21.4,
    highest: 29,
    lowest: 11,
    maxScore: 30,
    passRate: 80,
    scoreDistribution: [
      { label: "0–10", count: 0 },
      { label: "11–20", count: 2 },
      { label: "21–25", count: 1 },
      { label: "26–30", count: 2 },
    ],
    questionDifficulty: [
      { prompt: "What are the roots of x² − 5x + 6 = 0?", correctPercent: 40 },
      { prompt: "Simplify 12/16 to its lowest terms.", correctPercent: 100 },
      { prompt: "Explain why the discriminant tells you the number of real roots.", correctPercent: 60 },
    ],
    students: [
      { id: "s1", name: "Chidinma Okafor", score: 29, maxScore: 30, grade: "A", rank: 1 },
      { id: "s2", name: "Tunde Balogun", score: 25, maxScore: 30, grade: "B", rank: 2 },
      { id: "s3", name: "Amaka Nwosu", score: 22, maxScore: 30, grade: "B", rank: 3 },
      { id: "s4", name: "Ibrahim Musa", score: 20, maxScore: 30, grade: "C", rank: 4 },
      { id: "s5", name: "Grace Effiong", score: 11, maxScore: 30, grade: "D", rank: 5 },
    ],
  },
};

export default function TeacherAnalyticsPage() {
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState(EXAM_OPTIONS[0].id);

  return (
    <DashboardLayout role="teacher" pageTitle="Class Analytics" userName="Mrs. Adeyemi" onLogout={() => router.push("/login")}>
      <ClassAnalytics
        examOptions={EXAM_OPTIONS}
        selectedExamId={selectedExamId}
        onExamChange={setSelectedExamId}
        data={DATA_BY_EXAM[selectedExamId] ?? null}
      />
    </DashboardLayout>
  );
}
