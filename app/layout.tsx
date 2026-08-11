import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
