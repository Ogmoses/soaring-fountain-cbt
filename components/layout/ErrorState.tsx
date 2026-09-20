"use client";

/**
 * ErrorState — the counterpart to PageLoading.tsx for when a page's data
 * fetch actually fails, instead of the old behavior of just hanging on
 * "Loading…" forever with no feedback (see app/student/page.tsx's loader
 * for where that happened). Every data-loading page should catch its own
 * fetch errors and render this instead of leaving loading=true set
 * permanently.
 */

import { AlertTriangle, RotateCw } from "lucide-react";

export default function ErrorState({
  message = "Something went wrong loading this page.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crimson-50 text-crimson-700">
        <AlertTriangle size={18} strokeWidth={2.25} />
      </div>
      <p className="max-w-xs text-[13px] text-ink/50 dark:text-white/50">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-lg border border-black/10 px-3.5 py-2 text-[12.5px] font-medium text-ink/70 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
        >
          <RotateCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
