import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Allow local public folder images (already works by default)
    // Add external domains here if needed in future
    formats: ["image/webp", "image/avif"],
  },
  // Disable telemetry in production
  // Remove X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
