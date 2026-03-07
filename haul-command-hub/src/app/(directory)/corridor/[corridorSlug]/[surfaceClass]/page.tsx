import { buildMetadataFromPageKey } from "@/lib/routes/metadata";
import { requireActivePageKey } from "@/lib/routes/guards";
import { resolveCorridorClassPageKey } from "@/lib/routes/page-lookup";
import { getAdGridInventoryByPageKey, getRelatedLinksByPageKey, getSurfacesForCorridorClass } from "@/lib/routes/query-contracts";
import { PageShell } from "@/components/page/PageShell";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ corridorSlug: string; surfaceClass: string }> }) {
    const { corridorSlug, surfaceClass } = await params;
    const pageKey = await resolveCorridorClassPageKey(corridorSlug, surfaceClass);
    if (!pageKey) return { title: "Not found", robots: { index: false, follow: false } };
    return buildMetadataFromPageKey(pageKey);
}

export default async function CorridorClassPage({ params }: { params: Promise<{ corridorSlug: string; surfaceClass: string }> }) {
    const { corridorSlug, surfaceClass } = await params;
    const pageKey = requireActivePageKey(await resolveCorridorClassPageKey(corridorSlug, surfaceClass));

    const [surfaces, relatedLinks, inventory] = await Promise.all([
        getSurfacesForCorridorClass(pageKey.corridor_slug, pageKey.surface_class, 50, 0),
        getRelatedLinksByPageKey(pageKey.id, 20),
        getAdGridInventoryByPageKey(pageKey.id),
    ]);

    return <PageShell pageKey={pageKey} surfaces={surfaces} relatedLinks={relatedLinks} inventory={inventory} />;
}
