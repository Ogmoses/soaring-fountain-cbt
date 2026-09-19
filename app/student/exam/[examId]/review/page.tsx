"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ExamReview, { type ReviewQuestion } from "@/components/student/ExamReview";
import PageLoading from "@/components/layout/PageLoading";
import ErrorState from "@/components/layout/ErrorState";

export default function StudentExamReviewPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();

  const [data, setData] = useState<{ examTitle: string; totalScore: number; maxScore: number; questions: ReviewQuestion[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/exam-sessions/review?examId=${params.examId}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your review.");
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your review.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.examId, retryCount]);

  return (
    <div className="min-h-screen bg-background-muted">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 pt-5">
        <button onClick={() => router.push("/student")} className="flex items-center gap-1 text-[13px] font-medium text-ink/60 hover:text-ink">
          <ArrowLeft size={15} /> Back to Exam Launchpad
        </button>
      </div>

      {loading ? (
        <PageLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetryCount((c) => c + 1)} />
      ) : data ? (
        <ExamReview examTitle={data.examTitle} totalScore={data.totalScore} maxScore={data.maxScore} questions={data.questions} />
      ) : null}
    </div>
  );
}
