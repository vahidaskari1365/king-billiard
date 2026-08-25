import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure images work properly and app is deployable
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
  },
  // Turbopack config (Next 16 uses Turbopack by default)
  turbopack: {},
  // Production build optimizations
  poweredByHeader: false,
  compress: true,
  // Allow binding to 0.0.0.0 for preview environments
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
