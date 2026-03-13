import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { redirect, permanentRedirect } from "next/navigation";
import { resolveProfileMetadata } from "@/lib/resolvers/resolveProfile";
import { buildOperatorProfileJsonLd } from "@/lib/seo/jsonld";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://haulcommand.com";

/**
 * Server-side metadata for the operator profile page.
 * Uses resolveProfileMetadata which checks directory_listings → slug_redirects → hc_identities.
 * 
 * If a redirect is detected, generateMetadata returns minimal metadata
 * since the layout will perform a server redirect before rendering.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const meta = await resolveProfileMetadata(supabase, id);

    // If this slug is being redirected, return minimal metadata
    // (the layout will redirect before the page renders anyway)
    if (meta.redirect_to) {
        return { title: "Redirecting... | HAUL COMMAND" };
    }

    if (!meta.resolved) {
        return { title: "Operator Not Found | HAUL COMMAND" };
    }

    return {
        title: `${meta.name}${meta.location ? ` — ${meta.location}` : ""} | HAUL COMMAND`,
        description: `View ${meta.name}'s pilot car operator profile on HAUL COMMAND. Trust score, equipment, reviews, service areas${meta.location ? ` based in ${meta.location}` : ""}.`,
        robots: { index: true, follow: true },
        openGraph: {
            title: `${meta.name} | Pilot Car Operator`,
            description: `Verified pilot car and escort vehicle operator on HAUL COMMAND.`,
            url: `${SITE}/place/${id}`,
            type: "profile",
        },
    };
}

/**
 * Server layout that:
 * 1. Checks for slug redirects → performs server-side 308/307 redirect
 * 2. Injects JSON-LD for the operator profile
 * 
 * Redirect behavior:
 *   - redirect_type '301' (permanent) → Next.js permanentRedirect() → HTTP 308
 *   - redirect_type '302' (temporary) → Next.js redirect() → HTTP 307
 * 
 * 308/307 are the modern equivalents of 301/302 (same-method semantics).
 * Search engines treat 308 identically to 301 for ranking/canonicalization.
 */
export default async function ProfileLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const meta = await resolveProfileMetadata(supabase, id);

    // ── SLUG REDIRECT GATE ──
    // If this slug has been renamed/redirected, send the browser/crawler
    // to the canonical URL before rendering any page content.
    if (meta.redirect_to) {
        // Determine redirect type from the slug_redirects table
        const { data: redirectRow } = await supabase
            .from("slug_redirects")
            .select("redirect_type")
            .eq("old_slug", id)
            .eq("is_active", true)
            .limit(1)
            .single();

        const redirectType = redirectRow?.redirect_type || "301";
        const destination = `/place/${meta.redirect_to}`;

        if (redirectType === "302") {
            // Temporary redirect → HTTP 307
            redirect(destination);
        } else {
            // Permanent redirect → HTTP 308 (default, SEO-safe)
            permanentRedirect(destination);
        }
        // Note: redirect/permanentRedirect throw internally — code below never executes
    }

    let jsonLdScript: React.ReactNode = null;

    if (meta.resolved) {
        const url = `${SITE}/place/${id}`;
        const jsonLd = buildOperatorProfileJsonLd({
            url,
            name: meta.name,
            description: `${meta.name} — verified pilot car and escort vehicle operator${meta.location ? ` based in ${meta.location}` : ""} on HAUL COMMAND.`,
            areaServed: meta.location ? [meta.location] : undefined,
            aggregateRating:
                meta.rating_score && meta.review_count
                    ? { ratingValue: meta.rating_score, reviewCount: meta.review_count }
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

