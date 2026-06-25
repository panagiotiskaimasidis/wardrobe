import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Catalog images come from royalty-free placeholder hosts and from
    // arbitrary product pages via the "Add by URL" clipper, so we allow any
    // https host. In production you may want to tighten this list.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Keep type errors fatal during builds.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
