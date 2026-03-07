import { unstable_cache } from "next/cache";
import { getWeightedLinks } from "@/lib/seo/internalLinks";
import type { GetWeightedLinksParams, WeightedLink } from "@/lib/seo/internalLinks";

/**
 * Cached weighted links.
 * - Revalidates every hour via time-based cache
 * - Tagged for on-demand invalidation when signals update
 * - Prevents hammering DB on high-traffic pages
 */
export const getWeightedLinksCached = unstable_cache(
    async (params: GetWeightedLinksParams): Promise<WeightedLink[]> => getWeightedLinks(params),
    ["weighted-links"],
    {
        revalidate: 3600, // 1 hour
        tags: ["weighted-links"],
    }
);
