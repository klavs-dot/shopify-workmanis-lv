import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Repo has both a root package-lock.json (admin) and apps/store/package-lock.json.
  // Pin Next.js's file tracing to apps/store so the build doesn't pull in
  // admin sources when bundling server functions.
  outputFileTracingRoot: path.join(__dirname),

  // Mock data uses placeholder images for now. Add real Shopify CDN and
  // any other future image hosts here when Storefront API lands.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
