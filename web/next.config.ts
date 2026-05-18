import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/audit", destination: `${apiUrl}/audit` },
      { source: "/api/health", destination: `${apiUrl}/health` },
      { source: "/api/alerts", destination: `${apiUrl}/alerts` },
      { source: "/api/demo/:path*", destination: `${apiUrl}/demo/:path*` },
      { source: "/api/stats/:path*", destination: `${apiUrl}/stats/:path*` },
      { source: "/api/reports/:path*", destination: `${apiUrl}/reports/:path*` },
      { source: "/api/playground/:path*", destination: `${apiUrl}/playground/:path*` },
      { source: "/api/tickets/:path*", destination: `${apiUrl}/tickets/:path*` },
      { source: "/api/proxy/:path*", destination: `${apiUrl}/proxy/:path*` },
      { source: "/api/redteam/:path*", destination: `${apiUrl}/redteam/:path*` },
      { source: "/api/autofix/:path*", destination: `${apiUrl}/autofix/:path*` },
      { source: "/api/agents/:path*", destination: `${apiUrl}/agents/:path*` },
    ];
  },
};

export default config;
