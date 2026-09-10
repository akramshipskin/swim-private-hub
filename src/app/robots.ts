import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/coach",
        "/coach/",
        "/member",
        "/member/",
        "/profil",
        "/ganti-password",
      ],
    },
    sitemap: "https://les-renang-cianjur.vercel.app/sitemap.xml",
  };
}
