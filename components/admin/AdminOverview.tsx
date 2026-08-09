"use client";

/**
 * AdminOverview — the principal's landing screen: headline counts, plus
 * every lab batch scheduled across the school today. Surfacing all
 * teachers' batches together matters here specifically because the school
 * has a limited number of physical computers — this is where a double
 * booking would show up before it becomes a queue of students at 8am.
 */

import { CalendarClock, Users, GraduationCap, MonitorPlay, AlertTriangle } from "lucide-react";
import type { AdminStats, TodayBatch } from "./types";

interface AdminOverviewProps {
  schoolName: string;
  stats: AdminStats;
  todayBatches: TodayBatch[];
  /** Lab rooms with more than one batch overlapping in time — flagged for the admin. */
  conflictBatchIds: string[];
}

export default function AdminOverview({ schoolName, stats, todayBatches, conflictBatchIds }: AdminOverviewProps) {
  return (
    <div className="pb-10">
      <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">{schoolName} — Overview</h1>
      <p className="mt-0.5 text-[13px] text-ink/50">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={stats.totalStudents} />
        <StatCard icon={Users} label="Teachers" value={stats.totalTeachers} />
        <StatCard icon={MonitorPlay} label="Classes" value={stats.totalClasses} />
        <StatCard icon={CalendarClock} label="Batches today" value={stats.examsToday} />
      </div>

      {conflictBatchIds.length > 0 && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-crimson-200 bg-crimson-50 px-4 py-3 text-[13px] text-crimson-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {conflictBatchIds.length} batch{conflictBatchIds.length === 1 ? "" : "es"} today overlap in the same lab room — flagged below.
          </span>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Today's lab batches</h2>
        {todayBatches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/10 bg-white px-4 py-8 text-center text-[13px] text-ink/45">
            No exams scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
            {todayBatches
              .slice()
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
              .map((b) => {
                const conflict = conflictBatchIds.includes(b.id);
                return (
                  <div key={b.id} className={`flex items-center gap-3.5 px-4 py-3.5 sm:px-5 ${conflict ? "bg-crimson-50/40" : ""}`}>
                    <div className="w-16 shrink-0 text-[12px] font-semibold tabular-nums text-ink/60">
                      {formatTime(b.startsAt)}–{formatTime(b.endsAt)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-ink">{b.examTitle}</p>
                      <p className="truncate text-[12px] text-ink/50">{b.subjectName} · {b.className} · {b.batchLabel}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-medium text-ink/70">{b.labRoom ?? "Main lab"}</p>
                      <p className="text-[11px] text-ink/40">{b.studentCount} students</p>
                    </div>
                    {conflict && <AlertTriangle size={15} className="shrink-0 text-crimson-600" />}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-card">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-crimson-50 text-crimson-700">
        <Icon size={16} />
      </div>
      <p className="font-display text-[19px] font-semibold text-ink">{value}</p>
      <p className="text-[11.5px] text-ink/45">{label}</p>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
