import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
);

function u(loc: string, priority: number, changefreq = 'weekly', lastmod?: string): string {
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `<url><loc>${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(2)}</priority></url>`;
}

export async function GET() {
    const baseUrl = "https://haulcommand.com";
    const urls: string[] = [];

    // Get all country/category combos
    const { data: combos } = await supabase
        .from("surfaces")
        .select("country_code,category")
        .limit(5000);

    if (combos) {
        const seen = new Set<string>();
        for (const c of combos) {
            const key = `${c.country_code}/${c.category}`;
            if (!seen.has(key)) {
                seen.add(key);
                urls.push(u(`${baseUrl}/surfaces/${c.country_code.toLowerCase()}/${c.category.replace(/_/g, "-")}`, 0.7, "weekly"));
            }
        }

        // Country-level pages
        const countries = new Set(combos.map(c => c.country_code));
        for (const cc of countries) {
            urls.push(u(`${baseUrl}/surfaces/${cc.toLowerCase()}`, 0.8, "weekly"));
        }
    }

    // Get high-value individual surfaces (enriched + claimed first)
    const { data: topSurfaces } = await supabase
        .from("surfaces")
        .select("slug,updated_at,status")
        .in("status", ["enriched", "verified"])
        .order("updated_at", { ascending: false })
        .limit(2000);

    if (topSurfaces) {
        for (const s of topSurfaces) {
            urls.push(u(`${baseUrl}/surfaces/${s.slug}`, s.status === "verified" ? 0.8 : 0.5, "monthly", new Date(s.updated_at).toISOString()));
        }
    }

    // Also include shell surfaces (lower priority, batch by country)
    const { data: shellSurfaces } = await supabase
        .from("surfaces")
        .select("slug,updated_at")
        .eq("status", "shell")
        .order("country_code")
        .limit(5000);

    if (shellSurfaces) {
        for (const s of shellSurfaces) {
            urls.push(u(`${baseUrl}/surfaces/${s.slug}`, 0.3, "monthly", new Date(s.updated_at).toISOString()));
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400',
        },
    });
}
