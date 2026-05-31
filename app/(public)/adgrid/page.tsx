import { Suspense } from 'react';
import AdGridEventBeacon from '@/components/adgrid/AdGridEventBeacon';
import MobileAdGrid from '@/components/mobile/screens/MobileAdGrid';
import { getAdGridCreativeCatalog } from '@/lib/adgrid/roleTemplateAssets';

export const metadata = {
    title: 'AdGrid Creative Templates | Haul Command',
    description:
        'Browse motion-ready sponsor creative templates for heavy-haul corridors, city markets, role directories, load urgency, permits, and partner offers.',
    alternates: {
        canonical: '/adgrid',
    },
};

export const revalidate = 300;

export default async function AdGridPage() {
    const catalog = await getAdGridCreativeCatalog();

    return (
        <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#060b12' }} />}>
            <AdGridEventBeacon
                pageKind="adgrid"
                placementKey="sponsor_primary"
                pagePath="/adgrid"
                countryCode="GLOBAL"
                audienceRole="sponsor"
                variant={catalog.source}
            />
            <MobileAdGrid catalog={catalog} />
        </Suspense>
    );
}
