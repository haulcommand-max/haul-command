import { getWeightedLinksCached } from "@/lib/cache/weightedLinksCache";
import WeightedLinkList from "./WeightedLinkList";

interface Props {
    countryCode: string;
    regionCode?: string;
    fromH3r6?: string;
    fromMetroClusterId?: string;
}

/**
 * Dynamic city index — replaces static city lists.
 * Dallas rises when demand spikes. Weak cities fade naturally.
 * Google sees shifting internal authority. No manual edits ever again.
 */
export default async function CityIndexModule({
    countryCode,
    regionCode,
    fromH3r6,
    fromMetroClusterId,
}: Props) {
    const links = await getWeightedLinksCached({
        fromPageType: "region",
        toPageType: "city",
        countryCode,
        regionCode,
        fromH3r6,
        fromMetroClusterId,
        limit: 12,
        diversity: { maxPerMetroCluster: 2, maxPerH3r6: 3 },
    });

    if (!links.length) return null;

    return (
        <section>
            <h2 className="text-lg font-semibold text-white mb-3">
                Top Cities in This Region
            </h2>
            <WeightedLinkList
                items={links.map((l) => ({ path: l.path }))}
                className="grid grid-cols-2 md:grid-cols-3 gap-2"
            />
        </section>
    );
}
