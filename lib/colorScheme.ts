/**
 * Light / dark / system color scheme — per-person, stored in the browser
 * (not the database): unlike the site accent color, this is a personal
 * preference, not something the whole school shares. A teacher and a
 * student on the same device can pick differently.
 *
 * Applying it means toggling a `dark` class on <html> (tailwind.config.ts
 * has `darkMode: "class"`), which every `dark:` variant class reacts to.
 * See app/layout.tsx for the inline script that applies this
 * synchronously before first paint, so there's no flash of the wrong
 * theme while React hydrates.
 */

export type ColorScheme = "light" | "dark" | "system";

const STORAGE_KEY = "color-scheme";

export function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveIsDark(scheme: ColorScheme): boolean {
  return scheme === "dark" || (scheme === "system" && systemPrefersDark());
}

export function applyColorScheme(scheme: ColorScheme) {
  document.documentElement.classList.toggle("dark", resolveIsDark(scheme));
}

export function setColorScheme(scheme: ColorScheme) {
  window.localStorage.setItem(STORAGE_KEY, scheme);
  applyColorScheme(scheme);
}

/**
 * The exact same logic as above, serialized as a string to run inline in
 * <head> before the page's own JS bundle loads. Keeping this as a
 * generated string (rather than hand-duplicating the logic) means the two
 * can't quietly drift apart from independent edits.
 */
export function colorSchemeBootstrapScript(): string {
  return `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
}
