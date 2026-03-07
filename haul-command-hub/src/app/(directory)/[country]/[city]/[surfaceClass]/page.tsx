import { buildMetadataFromPageKey } from "@/lib/routes/metadata";
import { requireActivePageKey } from "@/lib/routes/guards";
import { resolveCityClassPageKey } from "@/lib/routes/page-lookup";
import { getAdGridInventoryByPageKey, getRelatedLinksByPageKey, getSurfacesForCityClass } from "@/lib/routes/query-contracts";
import { PageShell } from "@/components/page/PageShell";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ country: string; city: string; surfaceClass: string }> }) {
    const { country, city, surfaceClass } = await params;
    const pageKey = await resolveCityClassPageKey(country, city, surfaceClass);
    if (!pageKey) return { title: "Not found", robots: { index: false, follow: false } };
    return buildMetadataFromPageKey(pageKey);
}

export default async function CityClassPage({ params }: { params: Promise<{ country: string; city: string; surfaceClass: string }> }) {
    const { country, city, surfaceClass } = await params;
    const pageKey = requireActivePageKey(await resolveCityClassPageKey(country, city, surfaceClass));

    const [surfaces, relatedLinks, inventory] = await Promise.all([
        getSurfacesForCityClass(pageKey.country_code, pageKey.city_slug, pageKey.surface_class, 50, 0),
        getRelatedLinksByPageKey(pageKey.id, 20),
        getAdGridInventoryByPageKey(pageKey.id),
    ]);

    return <PageShell pageKey={pageKey} surfaces={surfaces} relatedLinks={relatedLinks} inventory={inventory} />;
}
