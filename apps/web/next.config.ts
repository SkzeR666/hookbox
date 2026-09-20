import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hookbox/core", "@hookbox/database", "@hookbox/ui"],
};

export default nextConfig;