import { buildMetadataFromPageKey } from "@/lib/routes/metadata";
import { requireActivePageKey } from "@/lib/routes/guards";
import { resolveSurfaceProfilePageKey } from "@/lib/routes/page-lookup";
import { getAdGridInventoryByPageKey, getRelatedLinksByPageKey, getSurfaceProfile } from "@/lib/routes/query-contracts";
import { PageShell } from "@/components/page/PageShell";

export const runtime = "nodejs";
export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ surfaceKey: string }> }) {
    const { surfaceKey } = await params;
    const pageKey = await resolveSurfaceProfilePageKey(surfaceKey);
    if (!pageKey) return { title: "Not found", robots: { index: false, follow: false } };
    return buildMetadataFromPageKey(pageKey);
}

export default async function SurfaceProfilePage({ params }: { params: Promise<{ surfaceKey: string }> }) {
    const { surfaceKey } = await params;
    const pageKey = requireActivePageKey(await resolveSurfaceProfilePageKey(surfaceKey));

    const [surface, relatedLinks, inventory] = await Promise.all([
        getSurfaceProfile(pageKey.surface_key),
        getRelatedLinksByPageKey(pageKey.id, 20),
        getAdGridInventoryByPageKey(pageKey.id),
    ]);

    return <PageShell pageKey={pageKey} surface={surface} relatedLinks={relatedLinks} inventory={inventory} />;
}
