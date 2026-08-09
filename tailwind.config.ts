import type { Config } from "tailwindcss";

// Soaring Fountain Group of Schools — design tokens
// Brand direction: sleek, academic, elegant. Deep crimson against warm ivory,
// with quiet neutrals doing most of the work so the crimson stays meaningful
// (primary actions, active states, alerts) rather than decorative.

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: "#AB1509",
          50: "#FDF2F1",
          100: "#FBE1DE",
          200: "#F5BAB3",
          300: "#EC8C80",
          400: "#DE5A49",
          500: "#C22E1C",
          600: "#AB1509", // brand primary
          700: "#8A1108",
          800: "#690D06",
          900: "#480904",
        },
        cream: {
          DEFAULT: "#fff7d3",
          50: "#FFFDF6",
          100: "#FFF7D3", // brand secondary / surface
          200: "#FFF0AD",
        },
        ink: "#1A1A1A",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8F9FA",
        },
        // semantic aliases — reference these in components, not raw hexes,
        // so the palette can be retuned once from a single place
        primary: "#AB1509",
        "primary-hover": "#8A1108",
        "on-primary": "#FFFFFF",
        background: "#fff7d3",
        "background-muted": "#F8F9FA",
        foreground: "#1A1A1A",
        success: "#1E7B4D",
        warning: "#B8860B",
        danger: "#AB1509",
      },
      fontFamily: {
        // display: headings, exam titles, report card headers
        display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        // body: everything else — optimized for long reading (exam text)
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "10px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 4px 12px rgba(26,26,26,0.06)",
        "card-hover": "0 2px 4px rgba(26,26,26,0.06), 0 8px 24px rgba(26,26,26,0.10)",
        focus: "0 0 0 3px rgba(171,21,9,0.25)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-warn": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pulse-warn": "pulse-warn 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
