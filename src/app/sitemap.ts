import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tripvibes.vn";
  const now = new Date();

  const slugs = ["da-nang", "ha-noi", "da-lat", "bangkok", "seoul"];

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/diem-den`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...slugs.map((slug) => ({
      url: `${baseUrl}/diem-den/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/khach-san`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lich-trinh`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...slugs.map((slug) => ({
      url: `${baseUrl}/lich-trinh/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/lap-ke-hoach`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gioi-han`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tro-giup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/nguon-anh`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/dieu-khoan`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/quyen-rieng-tu`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  return routes;
}
