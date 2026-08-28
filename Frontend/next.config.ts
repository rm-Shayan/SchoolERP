import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
