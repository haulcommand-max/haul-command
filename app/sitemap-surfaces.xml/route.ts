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

    // Get all country/surface_type combos from canonical hc_surfaces
    const { data: combos } = await supabase
        .from("hc_surfaces")
        .select("country_code,surface_type")
        .limit(5000);

    if (combos) {
        const seen = new Set<string>();
        for (const c of combos) {
            if (!c.surface_type) continue;
            const key = `${c.country_code}/${c.surface_type}`;
            if (!seen.has(key)) {
                seen.add(key);
                urls.push(u(`${baseUrl}/surfaces/${c.country_code.toLowerCase()}/${c.surface_type.replace(/_/g, "-")}`, 0.7, "weekly"));
            }
        }

        // Country-level pages
        const countries = new Set(combos.map(c => c.country_code));
        for (const cc of countries) {
            urls.push(u(`${baseUrl}/surfaces/${cc.toLowerCase()}`, 0.8, "weekly"));
        }
    }

    // Get high-quality individual surfaces from hc_surfaces (canonical table)
    const { data: topSurfaces } = await supabase
        .from("hc_surfaces")
        .select("slug,updated_at,quality_score")
        .gte("quality_score", 3)
        .order("quality_score", { ascending: false })
        .limit(5000);

    if (topSurfaces) {
        for (const s of topSurfaces) {
            const priority = (s.quality_score ?? 0) >= 7 ? 0.8 : (s.quality_score ?? 0) >= 5 ? 0.6 : 0.4;
            urls.push(u(`${baseUrl}/surface/${s.slug}`, priority, "monthly", new Date(s.updated_at).toISOString()));
        }
    }

    // Also include lower-quality surfaces (broader coverage)
    const { data: otherSurfaces } = await supabase
        .from("hc_surfaces")
        .select("slug,updated_at")
        .lt("quality_score", 3)
        .order("country_code")
        .limit(10000);

    if (otherSurfaces) {
        for (const s of otherSurfaces) {
            urls.push(u(`${baseUrl}/surface/${s.slug}`, 0.3, "monthly", new Date(s.updated_at).toISOString()));
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
