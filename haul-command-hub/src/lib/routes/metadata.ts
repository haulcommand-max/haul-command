import type { Metadata } from "next";

export function buildMetadataFromPageKey(pageKey: any): Metadata {
    const robots = pageKey.indexable
        ? { index: true, follow: true }
        : { index: false, follow: true };

    return {
        title:`${pageKey.title}|`,
        description: pageKey.meta_description || undefined,
        alternates: {
            canonical: pageKey.canonical_slug,
        },
        robots,
    };
}

export function notFoundMetadata(): Metadata {
    return { title: "Not Found | HAUL COMMAND", robots: { index: false, follow: false } };
}
