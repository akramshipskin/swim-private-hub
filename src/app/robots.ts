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
        "/pool",
        "/pool/",
        "/profil",
        "/ganti-password",
      ],
    },
    sitemap: "https://www.swimprivatehub.biz.id/sitemap.xml",
  };
}
