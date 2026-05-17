import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8088";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_BASE}/api/:path*` },
      { source: "/ws/:path*", destination: `${API_BASE}/ws/:path*` },
    ];
  },
};

export default nextConfig;
