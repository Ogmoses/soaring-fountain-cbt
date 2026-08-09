import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf historically crashed Next.js's App Router route handlers
  // before bundling excluded it from the server bundle — fixed upstream,
  // but keeping this is cheap insurance (see react-pdf.org/compatibility).
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
