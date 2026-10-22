import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.SITE_URL || "https://tripvibes.vn";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/demo/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
