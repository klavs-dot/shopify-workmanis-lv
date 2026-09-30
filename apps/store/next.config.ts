import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Repo has both a root package-lock.json (admin) and apps/store/package-lock.json.
  // Pin Next.js's file tracing to apps/store so the build doesn't pull in
  // admin sources when bundling server functions.
  outputFileTracingRoot: path.join(__dirname),

  // Only hosts/paths the store actually renders — /_next/image must not act
  // as an open (billed) image proxy.
  //   cdn.shopify.com/s/files/**   store product/collection images (narrow to
  //                                /s/files/1/<shop-id>/** once the id is known)
  //   /mock-shop-production-media  mock.shop images (development only)
  //   picsum.photos                mock catalogue (lib/mock-products.ts) and the
  //                                placeholder category covers in
  //                                lib/categories.ts — drop together with mock
  //                                mode once every category has a Shopify
  //                                collection image.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/mock-shop-production-media/**",
      },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
