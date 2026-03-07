import { getWeightedLinksCached } from "@/lib/cache/weightedLinksCache";
import WeightedLinkList from "./WeightedLinkList";

interface Props {
    countryCode: string;
    currentSlug: string;
}

/**
 * Dynamic related glossary terms — semantic clustering.
 * Improves crawl depth, glossary authority, and AI retrieval.
 */
export default async function RelatedTerms({
    countryCode,
    currentSlug,
}: Props) {
    const links = await getWeightedLinksCached({
        fromPageType: "glossary",
        toPageType: "glossary",
        countryCode,
        limit: 10,
    });

    // Remove self-reference
    const filtered = links.filter(
        (l) => !l.path.endsWith(currentSlug)
    );

    if (!filtered.length) return null;

    return (
        <aside className="mt-10">
            <h3 className="text-lg font-semibold text-white mb-3">
                Related Terms
            </h3>
            <WeightedLinkList
                items={filtered.map((l) => ({ path: l.path }))}
            />
        </aside>
    );
}
