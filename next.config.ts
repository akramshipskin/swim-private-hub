import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Upload foto & sertifikat coach (maks 3MB per file, lihat src/lib/storage.ts)
    // lewat server action; default 1MB terlalu kecil.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
