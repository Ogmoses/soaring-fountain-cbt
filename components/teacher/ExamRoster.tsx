"use client";

/**
 * ExamRoster — who's taken this exam, who's mid-exam, who hasn't
 * started. Scoped to one exam's class by construction (exams.class_id
 * is a single class), so there's no separate class picker here — the
 * class is just whichever one this exam belongs to.
 */

import { X, CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from "lucide-react";

export type RosterStatus = "not_started" | "active" | "submitted" | "expired" | "terminated";

export interface RosterStudent {
  id: string;
  fullName: string;
  admissionNumber: string | null;
  status: RosterStatus;
  score: number | null;
  maxScore: number | null;
}

interface ExamRosterProps {
  examTitle: string;
  className: string;
  students: RosterStudent[];
  onClose: () => void;
  /** Only meaningful for "submitted" students — there's nothing to review before that. */
  onSelectStudent?: (studentId: string) => void;
}

const STATUS_META: Record<RosterStatus, { label: string; icon: React.ElementType; color: string }> = {
  submitted: { label: "Submitted", icon: CheckCircle2, color: "text-success" },
  active: { label: "In progress", icon: Clock, color: "text-crimson-600" },
  not_started: { label: "Not started", icon: Circle, color: "text-ink/35" },
  expired: { label: "Timed out", icon: AlertTriangle, color: "text-warning" },
  terminated: { label: "Terminated", icon: AlertTriangle, color: "text-crimson-600" },
};

const GROUP_ORDER: RosterStatus[] = ["submitted", "active", "not_started", "expired", "terminated"];

export default function ExamRoster({ examTitle, className, students, onClose, onSelectStudent }: ExamRosterProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-card-hover">
        <div className="flex items-start justify-between border-b border-black/5 px-5 py-4">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-ink">{examTitle}</h2>
            <p className="mt-0.5 text-[12px] text-ink/50">{className} · {students.length} student{students.length === 1 ? "" : "s"}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink/40 hover:bg-background-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {students.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink/45">No students found in this class yet.</p>
          ) : (
            GROUP_ORDER.map((status) => {
              const group = students.filter((s) => s.status === status);
              if (group.length === 0) return null;
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              return (
                <div key={status} className="mb-4 last:mb-0">
                  <p className={`mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide ${meta.color}`}>
                    <Icon size={13} /> {meta.label} ({group.length})
                  </p>
                  <div className="divide-y divide-black/5 rounded-lg border border-black/5">
                    {group
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map((s) => {
                        const clickable = status === "submitted" && onSelectStudent;
                        const Row = (
                          <>
                            <div>
                              <p className="text-[13px] font-medium text-ink">{s.fullName}</p>
                              {s.admissionNumber && <p className="text-[11px] text-ink/40">{s.admissionNumber}</p>}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {s.score !== null && s.maxScore !== null && (
                                <span className="text-[12.5px] font-semibold tabular-nums text-ink/70">{s.score}/{s.maxScore}</span>
                              )}
                              {clickable && <ChevronRight size={14} className="text-ink/30" />}
                            </div>
                          </>
                        );
                        return clickable ? (
                          <button
                            key={s.id}
                            onClick={() => onSelectStudent!(s.id)}
                            className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-background-muted"
                          >
                            {Row}
                          </button>
                        ) : (
                          <div key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                            {Row}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
