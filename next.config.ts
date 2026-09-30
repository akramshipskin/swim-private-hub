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
  // Header keamanan dasar (sweep keamanan 25 Sep). CSP dipasang dulu mode
  // PANTAU (Report-Only, 30 Sep): tidak memblokir apa pun, pelanggaran hanya
  // dicatat lewat /api/csp-report (log Vercel). Setelah log bersih 1-2 hari,
  // ganti key jadi "Content-Security-Policy" supaya aktif. Midtrans tidak perlu
  // diizinkan: checkout memakai halaman redirect (pindah domain), bukan skrip
  // Snap di halaman kita. 'unsafe-inline' script dibutuhkan Next (skrip inline
  // bawaan); 'unsafe-eval' hanya di mode dev.
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline'",
      // Foto kolam/coach dari Supabase Storage (host berbeda per proyek) + ikon data:.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com${isDev ? " ws: http://localhost:*" : ""}`,
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "report-uri /api/csp-report",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: csp },
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
