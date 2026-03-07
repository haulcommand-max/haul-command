import { getWeightedLinksCached } from "@/lib/cache/weightedLinksCache";
import WeightedLinkList from "./WeightedLinkList";

interface Props {
    countryCode: string;
}

/**
 * Dynamic corridor strip — surfaces highest-demand corridors.
 * Demand-aware, supply-aware, crawl-priority aware.
 * Corridors stop being static content.
 */
export default async function CorridorStripModule({ countryCode }: Props) {
    const links = await getWeightedLinksCached({
        fromPageType: "city",
        toPageType: "corridor",
        countryCode,
        limit: 8,
    });

    if (!links.length) return null;

    return (
        <section className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-3">
                Active Heavy Haul Corridors
            </h3>
            <WeightedLinkList
                items={links.map((l) => ({ path: l.path }))}
                className="flex flex-wrap gap-3"
            />
        </section>
    );
}
