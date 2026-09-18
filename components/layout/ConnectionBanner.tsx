"use client";

/**
 * ConnectionBanner — tells the difference, for the person using the app,
 * between "the site broke" and "your own connection dropped" (wifi died,
 * airplane mode, a dead cell signal). Those look identical from inside a
 * failed fetch, but they mean completely different things and shouldn't
 * both surface as a scary red error.
 *
 * Sits once in DashboardLayout, so every dashboard page (student, teacher,
 * admin) gets it automatically without each page needing its own copy.
 *
 * Deliberately uses the browser's `online`/`offline` events plus
 * `navigator.onLine` rather than trying to ping the app's own API — this
 * only needs to answer "is this device's network up at all," which the
 * browser already tracks natively and is right about far more often than
 * a hand-rolled connectivity check would be.
 */

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function ConnectionBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Set the real initial state on mount — `navigator.onLine` isn't
    // available during server rendering, and assuming "online" by default
    // avoids a false alarm flashing for everyone on every page load.
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      // Self-dismissing — a "back online" confirmation that never goes
      // away is just a second thing to ignore.
      setTimeout(() => setJustReconnected(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !justReconnected) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-[12.5px] font-medium text-white transition-colors duration-300 ${
        isOffline ? "bg-ink" : "bg-emerald-600"
      }`}
      role="status"
    >
      {isOffline ? (
        <>
          <WifiOff size={14} className="animate-pulse" />
          You're offline — check your Wi-Fi, data, or airplane mode. We'll pick back up once you're back.
        </>
      ) : (
        <>
          <Wifi size={14} />
          Back online.
        </>
      )}
    </div>
  );
}
