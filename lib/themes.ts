/**
 * Site accent color system.
 *
 * How this plugs into the rest of the app: `tailwind.config.ts` defines
 * the `crimson` color family (buttons, links, badges, focus rings — the
 * one color family used pervasively for actions/emphasis everywhere) as
 * CSS variables — `rgb(var(--color-crimson-600) / <alpha-value>)` —
 * rather than fixed hex values. Every existing `bg-crimson-600`,
 * `text-crimson-700`, etc. class name in the codebase is unchanged; it
 * just resolves to whatever these variables currently hold. Changing the
 * theme means computing a new set of values for those variables from a
 * single chosen color — see `themeCssVars()` below, used in
 * `app/layout.tsx` (server-rendered default) and
 * `components/admin/SettingsManager.tsx` (live preview after picking a
 * color, before/without saving).
 *
 * Unlike the first version of this system, an admin isn't limited to a
 * fixed list: `school_profile.theme_color` stores a single hex string,
 * and a full 50–900 shade ramp is *generated* from it at read time by
 * `buildRampFromHex()`. `RECOMMENDED_COLORS` below is just a curated
 * starting-point list shown first in the picker — picking any other
 * color (via the native color picker or typing a hex code) works
 * identically, because both paths produce the same shape of ramp.
 *
 * Deliberately out of scope: `cream` (page/surface backgrounds) stays
 * fixed regardless of the chosen accent — an admin explicitly asked for
 * this, since an arbitrary accent color as a full-page backdrop reads as
 * loud rather than clean. Emails (lib/emailTemplates.ts) and printed
 * report cards (components/reports/ReportCardDocument.tsx) also stay on
 * the classic crimson intentionally — those are documents that leave the
 * live site and shouldn't shift color after the fact.
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

export const DEFAULT_THEME_COLOR = "#AB1509";

// The site's original, hand-tuned ramp — kept as an exact lookup rather
// than regenerated, so the default theme pixel-matches what shipped
// before this system supported arbitrary colors at all.
const DEFAULT_RAMP: ColorRamp = {
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
};

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

/** Returns true for a validly-formed #RGB or #RRGGBB hex color. */
export function isValidHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/**
 * Builds a full 50–900 shade ramp from a single color: lighter steps
 * blend toward white, darker steps toward black, 600 is the color itself
 * — the same structure the original hand-tuned crimson ramp follows.
 * Works for literally any hex input, which is what lets a fully custom
 * color (from the native picker or a typed hex) behave identically to
 * one of the curated RECOMMENDED_COLORS below.
 */
export function buildRampFromHex(hex: string): ColorRamp {
  if (!isValidHex(hex)) return DEFAULT_RAMP;
  if (hex.toUpperCase() === DEFAULT_THEME_COLOR) return DEFAULT_RAMP;

  const base = hexToRgb(hex);
  return {
    50: rgbToHex(mix(base, WHITE, 0.94)),
    100: rgbToHex(mix(base, WHITE, 0.85)),
    200: rgbToHex(mix(base, WHITE, 0.68)),
    300: rgbToHex(mix(base, WHITE, 0.48)),
    400: rgbToHex(mix(base, WHITE, 0.25)),
    500: rgbToHex(mix(base, WHITE, 0.12)),
    600: rgbToHex(base),
    700: rgbToHex(mix(base, BLACK, 0.16)),
    800: rgbToHex(mix(base, BLACK, 0.30)),
    900: rgbToHex(mix(base, BLACK, 0.46)),
  };
}

function hexToChannels(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/**
 * The full set of CSS custom-property declarations for one color, as a
 * single string ready to drop inside a `:root { ... }` block.
 */
export function themeCssVars(color: string): string {
  const ramp = buildRampFromHex(color);
  return (Object.keys(ramp) as unknown as (keyof ColorRamp)[])
    .map((shade) => `--color-crimson-${shade}: ${hexToChannels(ramp[shade])};`)
    .join(" ");
}

export interface RecommendedColor {
  key: string;
  name: string;
  hex: string;
}

/**
 * A curated starting point, not a limit — see the file header. These are
 * every individual color from the school's original 5 paired palettes,
 * split apart so each stands on its own rather than being locked to its
 * original partner.
 */
export const RECOMMENDED_COLORS: RecommendedColor[] = [
  { key: "crimson_red", name: "Crimson Red", hex: "#AB1509" },
  { key: "soft_cream", name: "Soft Cream", hex: "#FFF7D3" },
  { key: "midnight_purple", name: "Midnight Purple", hex: "#1A0033" },
  { key: "vivid_orange", name: "Vivid Orange", hex: "#FF4500" },
  { key: "deep_olive", name: "Deep Olive", hex: "#1A1A00" },
  { key: "pale_yellow", name: "Pale Yellow", hex: "#FFFFCC" },
  { key: "charcoal_gray", name: "Charcoal Gray", hex: "#323232" },
  { key: "vivid_yellow", name: "Vivid Yellow", hex: "#FFDB00" },
  { key: "royal_navy", name: "Royal Navy", hex: "#011F7B" },
  { key: "warm_amber", name: "Warm Amber", hex: "#FFBA09" },
];
