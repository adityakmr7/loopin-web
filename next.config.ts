import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Use environment variable for API URL
    // Defaults to production URL if not set
    const apiUrl =process.env.NEXT_PUBLIC_API_URL || "https://loopin-api.onrender.com";
    
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
