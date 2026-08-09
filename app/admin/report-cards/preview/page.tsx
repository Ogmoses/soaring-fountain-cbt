"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import ReportCardPrintView from "@/components/reports/ReportCardPrintView";
import type { ReportCardData } from "@/components/reports/types";

export default function ReportCardPreviewPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student") ?? "";
  const termId = searchParams.get("term") ?? "";
  const comment = searchParams.get("comment") ?? "";
  const principal = searchParams.get("principal") ?? "";

  const [data, setData] = useState<ReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !termId) {
      setError("Missing student or term.");
      return;
    }
    const query = new URLSearchParams();
    if (comment) query.set("comment", comment);
    if (principal) query.set("principal", principal);

    fetch(`/api/report-cards/${studentId}/${termId}/data?${query.toString()}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Couldn't load this report card.");
        setData(json);
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50 px-6 text-center">
        <AlertTriangle size={22} className="text-crimson-600" />
        <p className="text-[13px] text-ink">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-50">
        <Loader2 size={20} className="animate-spin text-crimson-600" />
        <p className="text-[13px] text-ink/50">Loading report card…</p>
      </div>
    );
  }

  return <ReportCardPrintView data={data} pdfUrl={`/api/report-cards/${studentId}/${termId}?comment=${encodeURIComponent(comment)}&principal=${encodeURIComponent(principal)}`} />;
}
