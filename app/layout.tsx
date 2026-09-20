import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { themeCssVars, DEFAULT_THEME_COLOR } from "@/lib/themes";
import { colorSchemeBootstrapScript } from "@/lib/colorScheme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  title: "Soaring Fountain CBT Platform",
  description: "In-house CBT and school management platform for Soaring Fountain Group of Schools",
  // Without this, iOS Safari auto-detects and auto-links plain-text
  // emails/phone numbers/dates in page content — turns them blue and
  // underlined unexpectedly, and has been observed interfering with
  // text-overflow:ellipsis truncation on the element it injects into.
  other: { "format-detection": "telephone=no, email=no, address=no, date=no" },
};

// Without an explicit viewport export, Next.js emits no viewport meta tag
// at all, so mobile browsers default to a desktop-style ~980px layout
// viewport and zoom the whole page down to fit. Every `sm:` breakpoint in
// this codebase (640px) was therefore never actually triggering on a real
// phone — the page was always being laid out as if wide enough to clear
// it, just visually shrunk, which is what read as content running off
// the edge / needing horizontal scroll across the app, not only in the
// question bank.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reads the school's chosen theme server-side, before the very first
  // paint, and overrides the CSS variables globals.css sets by default —
  // so every visitor (logged in or not, e.g. on the login page) sees the
  // right accent color immediately, with no flash of the wrong theme
  // while a client-side fetch resolves. school_profile is publicly
  // readable (see database/schema.sql's anyone_read_school_profile
  // policy), so this works the same for a signed-out visitor as anyone
  // else. If the fetch fails for any reason, the defaults baked into
  // globals.css apply instead — never a broken/blank style.
  let themeVars = "";
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("school_profile").select("theme_color").eq("id", true).single();
    themeVars = themeCssVars(data?.theme_color || DEFAULT_THEME_COLOR);
  } catch {
    // Fall through to globals.css's static defaults.
  }

  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        {/* Runs before hydration so the dark/light class is set on the
            very first paint — without this, the page would flash light
            mode for a moment even for someone who's chosen dark. */}
        <script dangerouslySetInnerHTML={{ __html: colorSchemeBootstrapScript() }} />
        {themeVars && <style dangerouslySetInnerHTML={{ __html: `:root { ${themeVars} }` }} />}
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
