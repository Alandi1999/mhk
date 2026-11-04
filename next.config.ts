import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Product images go through a server action; the bucket allows 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
