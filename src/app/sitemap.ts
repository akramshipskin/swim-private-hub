import type { MetadataRoute } from "next";

const BASE_URL = "https://swim-private-hub.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes = [
    { path: "/", priority: 1 },
    { path: "/login", priority: 0.5 },
    { path: "/register", priority: 0.8 },
    { path: "/panduan", priority: 0.6 },
    { path: "/panduan-member", priority: 0.5 },
    { path: "/kebijakan-privasi", priority: 0.3 },
    { path: "/syarat-ketentuan", priority: 0.3 },
    { path: "/kebijakan-pengembalian", priority: 0.3 },
    { path: "/kebijakan-cookie", priority: 0.3 },
  ];

  return routes.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    priority,
  }));
}
