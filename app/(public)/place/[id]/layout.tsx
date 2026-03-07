import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { buildOperatorProfileJsonLd } from "@/lib/seo/jsonld";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://haulcommand.com";

/**
 * Server-side metadata for the operator profile page.
 * Dynamic title + description + robots for SEO.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const { data: profile } = await supabase
        .from("driver_profiles")
        .select("user_id")
        .eq("user_id", id)
        .single();

    if (!profile) {
        return { title: "Operator Not Found | Haul Command" };
    }

    // Get display info from profiles table
    const { data: p } = await supabase
        .from("profiles")
        .select("display_name, company_name, home_base_city, home_base_state")
        .eq("id", id)
        .single();

    const name = p?.display_name || p?.company_name || "Escort Operator";
    const location = [p?.home_base_city, p?.home_base_state].filter(Boolean).join(", ");

    return {
        title: `${name}${location ? ` — ${location}` : ""} | Haul Command`,
        description: `View ${name}'s pilot car operator profile on Haul Command. Trust score, equipment, reviews, service areas${location ? ` based in ${location}` : ""}.`,
        robots: { index: true, follow: true },
        openGraph: {
            title: `${name} | Pilot Car Operator`,
            description: `Verified pilot car and escort vehicle operator on Haul Command.`,
            url: `${SITE}/directory/profile/${id}`,
            type: "profile",
        },
    };
}

/**
 * Server layout that injects JSON-LD for the operator profile.
 * The client page (page.tsx) remains untouched — this wraps it.
 */
export default async function ProfileLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    // Lightweight server-side fetch for JSON-LD only
    const { data: dp } = await supabase
        .from("driver_profiles")
        .select("user_id, verified_badge")
        .eq("user_id", id)
        .single();

    const { data: p } = await supabase
        .from("profiles")
        .select("display_name, company_name, home_base_city, home_base_state, country_code, rating_score, review_count")
        .eq("id", id)
        .single();

    let jsonLdScript: React.ReactNode = null;

    if (dp && p) {
        const name = p.display_name || p.company_name || "Escort Operator";
        const url = `${SITE}/directory/profile/${id}`;
        const location = [p.home_base_city, p.home_base_state].filter(Boolean).join(", ");

        const jsonLd = buildOperatorProfileJsonLd({
            url,
            name,
            description: `${name} — verified pilot car and escort vehicle operator${location ? ` based in ${location}` : ""} on Haul Command.`,
            areaServed: location ? [location] : undefined,
            aggregateRating:
                p.rating_score && p.review_count
                    ? { ratingValue: p.rating_score, reviewCount: p.review_count }
                    : undefined,
        });

        jsonLdScript = (
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        );
    }

    return (
        <>
            {jsonLdScript}
            {children}
        </>
    );
}
