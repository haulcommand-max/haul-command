import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/auth/", "/login", "/dashboard/", "/_next/", "/admin/"],
            },
            {
                userAgent: "GPTBot",
                allow: ["/blog/", "/glossary/", "/resources/", "/tools/", "/directory/"],
                disallow: ["/api/", "/dashboard/", "/auth/"],
            },
            {
                userAgent: "Google-Extended",
                allow: ["/blog/", "/glossary/", "/resources/", "/tools/", "/directory/"],
                disallow: ["/api/", "/dashboard/"],
            },
            {
                userAgent: "ChatGPT-User",
                allow: ["/blog/", "/glossary/", "/resources/", "/tools/", "/directory/"],
                disallow: ["/api/", "/dashboard/"],
            },
            {
                userAgent: "anthropic-ai",
                allow: ["/blog/", "/glossary/", "/resources/", "/tools/", "/directory/"],
                disallow: ["/api/", "/dashboard/"],
            },
            {
                userAgent: "ClaudeBot",
                allow: ["/blog/", "/glossary/", "/resources/", "/tools/", "/directory/"],
                disallow: ["/api/", "/dashboard/"],
            },
            {
                userAgent: "Yandex",
                allow: "/",
                disallow: ["/api/", "/dashboard/"],
            },
            {
                userAgent: "Baiduspider",
                allow: "/",
                disallow: ["/api/", "/dashboard/"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
