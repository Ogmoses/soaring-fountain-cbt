"use client";

import { useEffect, useState } from "react";
import { type ColorScheme, getStoredColorScheme, setColorScheme, applyColorScheme } from "./colorScheme";

export function useColorScheme() {
  const [scheme, setSchemeState] = useState<ColorScheme>("system");

  useEffect(() => {
    setSchemeState(getStoredColorScheme());

    // If they're on "system" and switch their OS/browser theme while this
    // tab is open, follow it live rather than waiting for a reload.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredColorScheme() === "system") applyColorScheme("system");
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const choose = (next: ColorScheme) => {
    setColorScheme(next);
    setSchemeState(next);
  };

  return { scheme, setScheme: choose };
}
