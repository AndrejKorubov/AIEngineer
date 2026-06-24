import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Generated/product images live on Vercel Blob's public CDN.
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
