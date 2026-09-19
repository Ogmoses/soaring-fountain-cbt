/**
 * Site theme registry.
 *
 * How this plugs into the rest of the app: `tailwind.config.ts` defines
 * the `crimson` color family (buttons, links, badges, focus rings — the
 * one color family used pervasively for actions/emphasis everywhere) as
 * CSS variables — `rgb(var(--color-crimson-600) / <alpha-value>)` — rather
 * than fixed hex values. Every existing `bg-crimson-600`,
 * `text-crimson-700`, etc. class name in the codebase is unchanged; it
 * just now resolves to whatever these variables currently hold. Switching
 * a theme means setting new values for those variables — see
 * `themeCssVars()` below and where it's used in `app/layout.tsx` (default
 * render) and `components/admin/SettingsManager.tsx` (live preview after
 * an admin picks a new one).
 *
 * Deliberately out of scope: `cream` (page/surface backgrounds) stays
 * fixed regardless of theme — an admin explicitly asked for this, since a
 * vivid accent color as a full-page backdrop reads as loud rather than
 * clean. Emails (lib/emailTemplates.ts) and printed report cards
 * (components/reports/ReportCardDocument.tsx) also stay on the classic
 * crimson intentionally — those are documents that leave the live site
 * and get saved/printed/forwarded, where a color that later changes out
 * from under them would be more confusing than helpful.
 *
 * Ramp construction: each theme is defined by two colors from the brand
 * palette provided — `base` (the richer/darker of the two, taking over
 * crimson-600's role exactly as the primary action color) and `bright`
 * (the second color, used only to flavor the 300/400 mid-light steps —
 * e.g. secondary buttons, hover glows — so it shows up as a deliberate
 * accent rather than vanishing). Steps 50–200 blend `base` toward white;
 * 700–900 blend `base` toward black; 500 is a slight lift toward white.
 * This mirrors how the original crimson ramp is structured.
 */

export interface ColorRamp {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Theme {
  key: string;
  name: string;
  /** The two source colors, for the swatch preview in the admin picker. */
  base: string;
  bright: string;
  ramp: ColorRamp;
}

export const THEMES: Theme[] = [
  {
    key: "deep_rich_red",
    name: "Deep Rich Red",
    base: "#AB1509",
    bright: "#FFF7D3",
    // Exact original values — not regenerated, so the default theme
    // pixel-matches what shipped before theming existed at all.
    ramp: {
      50: "#FDF2F1",
      100: "#FBE1DE",
      200: "#F5BAB3",
      300: "#EC8C80",
      400: "#DE5A49",
      500: "#C22E1C",
      600: "#AB1509",
      700: "#8A1108",
      800: "#690D06",
      900: "#480904",
    },
  },
  {
    key: "retro_arcade",
    name: "Retro Arcade",
    base: "#1A0033",
    bright: "#FF4500",
    ramp: {
      50: "#F1F0F3",
      100: "#DDD9E0",
      200: "#B6ADBE",
      300: "#982617",
      400: "#5F1524",
      500: "#351F4B",
      600: "#1A0033",
      700: "#16002B",
      800: "#120024",
      900: "#0E001C",
    },
  },
  {
    key: "midnight_olive",
    name: "Midnight Olive",
    base: "#1A1A00",
    bright: "#FFFFCC",
    ramp: {
      50: "#F1F1F0",
      100: "#DDDDD9",
      200: "#B6B6AD",
      300: "#989870",
      400: "#5F5F3D",
      500: "#35351F",
      600: "#1A1A00",
      700: "#161600",
      800: "#121200",
      900: "#0E0E00",
    },
  },
  {
    key: "charcoal_gold",
    name: "Charcoal & Gold",
    base: "#323232",
    bright: "#FFDB00",
    ramp: {
      50: "#F3F3F3",
      100: "#E0E0E0",
      200: "#BDBDBD",
      300: "#A38F16",
      400: "#706523",
      500: "#4B4B4B",
      600: "#323232",
      700: "#2A2A2A",
      800: "#232323",
      900: "#1B1B1B",
    },
  },
  {
    key: "royal_navy",
    name: "Royal Navy",
    base: "#011F7B",
    bright: "#FFBA09",
    ramp: {
      50: "#F0F2F7",
      100: "#D9DDEB",
      200: "#AEB7D5",
      300: "#8D743C",
      400: "#4D4E59",
      500: "#1F3A8B",
      600: "#011F7B",
      700: "#011A67",
      800: "#011656",
      900: "#011142",
    },
  },
];

export const DEFAULT_THEME_KEY = "deep_rich_red";

export function getTheme(key: string | null | undefined): Theme {
  return THEMES.find((t) => t.key === key) ?? THEMES.find((t) => t.key === DEFAULT_THEME_KEY)!;
}

function hexToChannels(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * The full set of CSS custom-property declarations for one theme, as a
 * single string ready to drop inside a `:root { ... }` block. Shared by
 * the server-rendered <style> tag in app/layout.tsx and the client-side
 * live-preview application in the admin settings page, so the two can
 * never drift apart from hand-duplicating the property list.
 */
export function themeCssVars(theme: Theme): string {
  return (Object.keys(theme.ramp) as unknown as (keyof ColorRamp)[])
    .map((shade) => `--color-crimson-${shade}: ${hexToChannels(theme.ramp[shade])};`)
    .join(" ");
}
