"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExamLaunchpad, {
  type AvailableExam,
  type UpcomingBatch,
  type PastResult,
} from "@/components/student/ExamLaunchpad";
// import { createClient } from "@/lib/supabase/client";

// TODO: replace with a server-side fetch (or React Query) against:
//  - exam_batches joined with batch_students, filtered to this student and
//    the current time window → availableExams / upcomingBatches
//  - results joined with exams, filtered to this student and published = true
//    → pastResults
const SAMPLE_AVAILABLE: AvailableExam[] = [
  {
    examId: "exam-101",
    batchId: "batch-a-101",
    title: "Mid-Term Test",
    subjectName: "Mathematics",
    durationMinutes: 45,
    batchLabel: "Batch A",
    batchStartsAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    batchEndsAt: new Date(Date.now() + 40 * 60_000).toISOString(),
    alreadyInProgress: false,
  },
];

const SAMPLE_UPCOMING: UpcomingBatch[] = [
  {
    id: "batch-1",
    examTitle: "Mid-Term Test",
    subjectName: "English Language",
    batchLabel: "Batch B",
    startsAt: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
  },
  {
    id: "batch-2",
    examTitle: "Continuous Assessment 2",
    subjectName: "Basic Science",
    batchLabel: "Batch A",
    startsAt: new Date(Date.now() + 26 * 60 * 60_000).toISOString(),
  },
];

const SAMPLE_PAST: PastResult[] = [
  {
    id: "result-1",
    examTitle: "Continuous Assessment 1",
    subjectName: "Mathematics",
    termName: "First Term",
    totalScore: 27,
    maxScore: 30,
    gradeLetter: "A",
    takenAt: new Date(Date.now() - 20 * 24 * 60 * 60_000).toISOString(),
  },
];

export default function StudentHomePage() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <DashboardLayout
      role="student"
      pageTitle="Exam Launchpad"
      userName="Chidinma Okafor" // TODO: from the authenticated user's `users` row
      onLogout={handleLogout}
    >
      <ExamLaunchpad
        studentName="Chidinma Okafor"
        availableExams={SAMPLE_AVAILABLE}
        upcomingBatches={SAMPLE_UPCOMING}
        pastResults={SAMPLE_PAST}
      />
    </DashboardLayout>
  );
}
