import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", 
      allowedOrigins: [
        "localhost:3000",
        "*.devtunnels.ms",
        "*.asse.devtunnels.ms",
      ],
    },
  },
  allowedDevOrigins: ["*.devtunnels.ms"],
};

export default nextConfig;