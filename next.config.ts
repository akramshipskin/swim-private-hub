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
  // Header keamanan dasar (sweep keamanan 25 Sep). CSP belum: perlu daftar izin
  // skrip Midtrans Snap & Vercel Analytics yang diuji terpisah.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
