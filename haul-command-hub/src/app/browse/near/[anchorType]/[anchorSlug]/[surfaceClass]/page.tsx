import { buildMetadataFromPageKey } from "@/lib/routes/metadata";
import { requireActivePageKey } from "@/lib/routes/guards";
import { resolveNearbyClusterPageKey } from "@/lib/routes/page-lookup";
import { getAdGridInventoryByPageKey, getRelatedLinksByPageKey } from "@/lib/routes/query-contracts";
import { PageShell } from "@/components/page/PageShell";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ anchorType: string; anchorSlug: string; surfaceClass: string }> }) {
    const { anchorType, anchorSlug, surfaceClass } = await params;
    const pageKey = await resolveNearbyClusterPageKey(anchorType, anchorSlug, surfaceClass);
    if (!pageKey) return { title: "Not found", robots: { index: false, follow: false } };
    return buildMetadataFromPageKey(pageKey);
}

export default async function NearbyClusterPage({ params }: { params: Promise<{ anchorType: string; anchorSlug: string; surfaceClass: string }> }) {
    const { anchorType, anchorSlug, surfaceClass } = await params;
    const pageKey = requireActivePageKey(await resolveNearbyClusterPageKey(anchorType, anchorSlug, surfaceClass));

    const [relatedLinks, inventory] = await Promise.all([
        getRelatedLinksByPageKey(pageKey.id, 20),
        getAdGridInventoryByPageKey(pageKey.id),
    ]);

    return <PageShell pageKey={pageKey} surfaces={[]} relatedLinks={relatedLinks} inventory={inventory} />;
}
