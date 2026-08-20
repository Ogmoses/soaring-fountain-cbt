"use client";

/**
 * ResultsAnalytics — the principal's view across every teacher's exams:
 * which results are computed but not yet visible to students/parents,
 * and how the school is performing by class and by subject.
 */

import { useState } from "react";
import { CheckCircle2, TrendingUp, Users, Send } from "lucide-react";
import type { ClassPerformance, PendingResult, SubjectPerformance } from "./types";

interface ResultsAnalyticsProps {
  pendingResults: PendingResult[];
  classPerformance: ClassPerformance[];
  subjectPerformance: SubjectPerformance[];
  schoolAveragePercent: number;
  onPublish: (examId: string) => Promise<void>;
}

export default function ResultsAnalytics({ pendingResults, classPerformance, subjectPerformance, schoolAveragePercent, onPublish }: ResultsAnalyticsProps) {
  const [confirmExamId, setConfirmExamId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const topClass = [...classPerformance].sort((a, b) => b.averagePercent - a.averagePercent)[0];

  const handlePublish = async (examId: string) => {
    setPublishing(examId);
    setPublishError(null);
    try {
      await onPublish(examId);
      setConfirmExamId(null);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Couldn't publish this result. Try again.");
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="pb-10">
      <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Results &amp; analytics</h1>
      <p className="mt-0.5 text-[13px] text-ink/50">School-wide publishing and performance, across every class and subject.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Send} label="Pending publication" value={String(pendingResults.length)} tone={pendingResults.length > 0 ? "warn" : "success"} />
        <StatCard icon={TrendingUp} label="School average" value={`${schoolAveragePercent.toFixed(0)}%`} />
        <StatCard icon={Users} label="Top-performing class" value={topClass ? topClass.className : "—"} />
      </div>

      {/* ---------- Pending publication ---------- */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Pending publication</h2>
        {pendingResults.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-black/10 bg-white px-4 py-6 text-[13px] text-ink/45">
            <CheckCircle2 size={16} className="text-ink/25" />
            Everything graded so far has been published.
          </div>
        ) : (
          <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
            {pendingResults.map((r) => (
              <div key={r.examId} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{r.examTitle}</p>
                  <p className="truncate text-[12px] text-ink/50">{r.subjectName} · {r.className} · {r.teacherName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12.5px] font-semibold tabular-nums text-ink/70">{r.averageScore.toFixed(1)}/{r.maxScore} avg</p>
                  <p className="text-[11px] text-ink/40">{r.studentCount} students</p>
                </div>
                <button
                  onClick={() => setConfirmExamId(r.examId)}
                  className="shrink-0 rounded-lg bg-crimson-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-crimson-700"
                >
                  Publish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Performance by class ---------- */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Performance by class</h2>
        <div className="rounded-lg border border-black/5 bg-white p-4.5 sm:p-5">
          <div className="space-y-2.5">
            {classPerformance.map((c) => (
              <BarRow key={c.className} label={c.className} percent={c.averagePercent} />
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Performance by subject ---------- */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Performance by subject</h2>
        <div className="rounded-lg border border-black/5 bg-white p-4.5 sm:p-5">
          <div className="space-y-2.5">
            {subjectPerformance.map((s) => (
              <BarRow key={s.subjectName} label={s.subjectName} percent={s.averagePercent} />
            ))}
          </div>
        </div>
      </div>

      {confirmExamId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-card-hover">
            <h2 className="font-display text-[15px] font-semibold text-ink">Publish this result?</h2>
            <p className="mt-1.5 text-[13px] text-ink/60">Students in this class will be able to see their score and grade immediately.</p>
            {publishError && <p className="mt-3 rounded-md bg-crimson-50 px-3 py-2 text-[12.5px] text-crimson-700">{publishError}</p>}
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => { setConfirmExamId(null); setPublishError(null); }} className="flex-1 rounded-lg border border-black/10 py-2.5 text-[13px] font-medium text-ink/70 hover:bg-background-muted">
                Cancel
              </button>
              <button
                onClick={() => handlePublish(confirmExamId)}
                disabled={publishing === confirmExamId}
                className="flex-1 rounded-lg bg-crimson-600 py-2.5 text-[13px] font-semibold text-white hover:bg-crimson-700 disabled:opacity-70"
              >
                {publishing === confirmExamId ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "default" }: { icon: React.ElementType; label: string; value: string; tone?: "success" | "warn" | "default" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warn" ? "text-crimson-600" : "text-ink";
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-card">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-crimson-50 text-crimson-700">
        <Icon size={16} />
      </div>
      <p className={`font-display text-[17px] font-semibold ${toneClass}`}>{value}</p>
      <p className="text-[11.5px] text-ink/45">{label}</p>
    </div>
  );
}

function BarRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-[12.5px] text-ink/70">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-background-muted">
        <div className={`h-full rounded-full ${percent < 40 ? "bg-crimson-600" : percent < 70 ? "bg-warning" : "bg-success"}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-[12px] font-medium text-ink/60">{percent.toFixed(0)}%</span>
    </div>
  );
}
