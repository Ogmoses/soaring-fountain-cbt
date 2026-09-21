"use client";

/**
 * ColorSchemeSync — re-applies the saved light/dark/system preference
 * every time the app becomes visible again (tab refocused, or the page
 * is restored from Safari's back-forward cache after the browser was
 * backgrounded for a while).
 *
 * Why this exists: the bootstrap script in app/layout.tsx only runs once,
 * on a fresh page load — it correctly reads `system` and checks
 * `prefers-color-scheme` at that moment. But on iOS Safari specifically,
 * a page restored from bfcache (which is what usually happens when you
 * switch away from Safari for a while and come back, rather than a full
 * reload) can end up with a stale read of the OS color scheme, which
 * showed up as the site silently reverting to light mode even with
 * "System" selected and the phone actually in dark mode. Rather than
 * chase the exact browser quirk, this re-checks and re-applies the
 * preference every single time the app becomes visible again, which
 * fixes the symptom regardless of the precise underlying cause — and is
 * cheap enough to do unconditionally.
 *
 * Rendered once in app/layout.tsx, outside any specific page, so it's
 * active no matter which screen was open when the app was backgrounded.
 */

import { useEffect } from "react";
import { applyColorScheme, getStoredColorScheme } from "@/lib/colorScheme";

export default function ColorSchemeSync() {
  useEffect(() => {
    const resync = () => applyColorScheme(getStoredColorScheme());

    const handleVisibility = () => {
      if (document.visibilityState === "visible") resync();
    };
    // pageshow with event.persisted === true specifically means "restored
    // from bfcache" — the case this was actually written for — but
    // resyncing unconditionally on every pageshow is harmless and covers
    // browsers/situations where that flag isn't reliably set.
    const handlePageShow = () => resync();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", resync);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", resync);
    };
  }, []);

  return null;
}
