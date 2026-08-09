"use client";

/**
 * ReportCardsManager — the entry point for the "Automated Printable
 * Terminal Report Card Generator" feature. Picks a class + term, lets the
 * teacher jot a per-student comment, then hands off to either the
 * print-preview page or a direct PDF download
 * (app/api/report-cards/[studentId]/[termId]/route.tsx).
 */

import { useState } from "react";
import { Download, Eye, GraduationCap } from "lucide-react";

export interface ReportCardClassOption {
  id: string;
  name: string;
}

export interface ReportCardTermOption {
  id: string;
  name: string;
}

export interface RosterStudent {
  studentId: string;
  fullName: string;
  admissionNumber: string;
}

interface ReportCardsManagerProps {
  classOptions: ReportCardClassOption[];
  termOptions: ReportCardTermOption[];
  selectedClassId: string;
  onClassChange: (id: string) => void;
  selectedTermId: string;
  onTermChange: (id: string) => void;
  roster: RosterStudent[];
  principalName?: string;
}

export default function ReportCardsManager({
  classOptions,
  termOptions,
  selectedClassId,
  onClassChange,
  selectedTermId,
  onTermChange,
  roster,
  principalName,
}: ReportCardsManagerProps) {
  const [comments, setComments] = useState<Record<string, string>>({});

  const buildQuery = (studentId: string) => {
    const params = new URLSearchParams();
    if (comments[studentId]?.trim()) params.set("comment", comments[studentId].trim());
    if (principalName) params.set("principal", principalName);
    return params.toString();
  };

  return (
    <div className="pb-10">
      <h1 className="font-display text-[18px] font-semibold text-ink sm:text-[20px]">Report cards</h1>
      <p className="mt-0.5 text-[13px] text-ink/50">Terminal report cards, generated straight from published results.</p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <select value={selectedClassId} onChange={(e) => onClassChange(e.target.value)} className="rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500">
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={selectedTermId} onChange={(e) => onTermChange(e.target.value)} className="rounded-lg border border-black/10 px-3.5 py-2.5 text-[13px] outline-none focus:border-crimson-500">
          {termOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {roster.length === 0 ? (
        <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-dashed border-black/10 bg-white px-4 py-8 text-[13px] text-ink/45">
          <GraduationCap size={16} className="text-ink/25" />
          No published results for this class and term yet.
        </div>
      ) : (
        <div className="mt-5 divide-y divide-black/5 rounded-lg border border-black/5 bg-white">
          {roster.map((s) => (
            <div key={s.studentId} className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
              <div className="min-w-0 sm:w-48 sm:shrink-0">
                <p className="truncate text-[13.5px] font-medium text-ink">{s.fullName}</p>
                <p className="text-[12px] text-ink/45">{s.admissionNumber}</p>
              </div>
              <input
                value={comments[s.studentId] ?? ""}
                onChange={(e) => setComments((prev) => ({ ...prev, [s.studentId]: e.target.value }))}
                placeholder="Class teacher's comment (optional)"
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-[12.5px] outline-none focus:border-crimson-500"
              />
              <div className="flex shrink-0 gap-1.5">
                <a
                  href={`/admin/report-cards/preview?student=${s.studentId}&term=${selectedTermId}&${buildQuery(s.studentId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-[12.5px] font-medium text-ink/70 hover:bg-background-muted"
                >
                  <Eye size={14} /> Preview
                </a>
                <a
                  href={`/api/report-cards/${s.studentId}/${selectedTermId}?${buildQuery(s.studentId)}`}
                  className="flex items-center gap-1.5 rounded-lg bg-crimson-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-crimson-700"
                >
                  <Download size={14} /> PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
