import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
