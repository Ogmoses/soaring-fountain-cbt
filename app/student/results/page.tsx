"use client";

/**
 * Student — Past Results. Same story as Upcoming Batches: linked from the
 * sidebar since the beginning, route never actually existed. Full history
 * here, not just the launchpad's recent summary.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageLoading from "@/components/layout/PageLoading";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser, signOutAndRedirect } from "@/lib/useAuthUser";
import { fetchExamMaxScores } from "@/lib/reportCard";

interface ResultRow {
  id: string;
  examTitle: string;
  subjectName: string;
  termName: string;
  totalScore: number;
  maxScore: number;
  gradeLetter: string | null;
}

export default function StudentResultsPage() {
  const router = useRouter();
  const authUser = useAuthUser();
  const supabase = createClient();

  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("exam_id, total_score, grade_letter, exams(title, subjects(name), terms(name))")
        .eq("student_id", authUser.id)
        .eq("published", true);

      const examIds = [...new Set((data ?? []).map((r) => r.exam_id))];
      const maxScores = await fetchExamMaxScores(supabase, examIds);

      setResults(
        (data ?? []).map((r: any) => ({
          id: r.exam_id,
          examTitle: r.exams?.title ?? "",
          subjectName: r.exams?.subjects?.name ?? "",
          termName: r.exams?.terms?.name ?? "",
          totalScore: r.total_score,
          maxScore: maxScores.get(r.exam_id) ?? 0,
          gradeLetter: r.grade_letter,
        }))
      );
      setLoading(false);
    })();
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DashboardLayout role="student" pageTitle="Past Results" userName={authUser?.fullName ?? ""} onLogout={() => signOutAndRedirect(router)}>
      {loading ? (
        <PageLoading />
      ) : (
        <div className="pb-10">
          <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Past results</h1>
          <p className="mt-0.5 text-[13px] text-ink/50">Every published score, across every term.</p>

          {results.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-black/10 bg-white px-4 py-10 text-center text-[13px] text-ink/45">
              Nothing published yet — your results will appear here once a teacher publishes them.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-lg border border-black/5 bg-white">
              <div className="divide-y divide-black/5 sm:hidden">
                {results.map((r) => (
                  <div key={r.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink">{r.examTitle}</p>
                        <p className="text-[12px] text-ink/50">{r.subjectName} · {r.termName}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-[13px] font-semibold tabular-nums text-ink">{r.totalScore}/{r.maxScore}</p>
                        {r.gradeLetter && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2 py-0.5 text-[11px] font-semibold text-crimson-700">
                            <Award size={11} /> {r.gradeLetter}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden w-full text-left sm:table">
                <thead>
                  <tr className="border-b border-black/5 text-[11.5px] uppercase tracking-wide text-ink/40">
                    <th className="px-5 py-3 font-medium">Exam</th>
                    <th className="px-5 py-3 font-medium">Term</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {results.map((r) => (
                    <tr key={r.id} className="text-[13px] text-ink">
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{r.examTitle}</p>
                        <p className="text-[12px] text-ink/45">{r.subjectName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-ink/60">{r.termName}</td>
                      <td className="px-5 py-3.5 font-medium tabular-nums">{r.totalScore} / {r.maxScore}</td>
                      <td className="px-5 py-3.5">{r.gradeLetter ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
