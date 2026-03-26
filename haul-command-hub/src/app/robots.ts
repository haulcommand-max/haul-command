import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        // Next.js auto-generates /sitemap.xml as a sitemap index when generateSitemaps() is used.
        // Each sitemap chunk is served at /sitemap/{id}.xml
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
