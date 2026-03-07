import { buildMetadataFromPageKey } from "@/lib/routes/metadata";
import { requireActivePageKey } from "@/lib/routes/guards";
import { resolveCountryClassPageKey } from "@/lib/routes/page-lookup";
import { getAdGridInventoryByPageKey, getRelatedLinksByPageKey, getSurfacesForCountryClass, getTopCitiesForCountryClass } from "@/lib/routes/query-contracts";
import { PageShell } from "@/components/page/PageShell";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ country: string; surfaceClass: string }> }) {
    const { country, surfaceClass } = await params;
    const pageKey = await resolveCountryClassPageKey(country, surfaceClass);
    if (!pageKey) return { title: "Not found", robots: { index: false, follow: false } };
    return buildMetadataFromPageKey(pageKey);
}

export default async function CountryClassPage({ params }: { params: Promise<{ country: string; surfaceClass: string }> }) {
    const { country, surfaceClass } = await params;
    const pageKey = requireActivePageKey(await resolveCountryClassPageKey(country, surfaceClass));

    const [surfaces, topCities, relatedLinks, inventory] = await Promise.all([
        getSurfacesForCountryClass(pageKey.country_code, pageKey.surface_class, 50, 0),
        getTopCitiesForCountryClass(pageKey.country_code, pageKey.surface_class, 20),
        getRelatedLinksByPageKey(pageKey.id, 20),
        getAdGridInventoryByPageKey(pageKey.id),
    ]);

    return <PageShell pageKey={pageKey} surfaces={surfaces} topCities={topCities} relatedLinks={relatedLinks} inventory={inventory} />;
}
