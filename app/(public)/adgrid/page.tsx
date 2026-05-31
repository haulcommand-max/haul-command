import { Suspense } from 'react';
import AdGridEventBeacon from '@/components/adgrid/AdGridEventBeacon';
import MobileAdGrid from '@/components/mobile/screens/MobileAdGrid';

export const metadata = {
    title: 'AdGrid Creative Templates | Haul Command',
    description:
        'Browse sponsor placements for heavy-haul corridors, city markets, role directories, load urgency, permits, and partner offers.',
    alternates: {
        canonical: '/adgrid',
    },
};

export const revalidate = 300;

export default function AdGridPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#060b12' }} />}>
            <AdGridEventBeacon
                pageKind="adgrid"
                placementKey="sponsor_primary"
                pagePath="/adgrid"
                countryCode="GLOBAL"
                audienceRole="sponsor"
                variant="featured-providers"
            />
            <MobileAdGrid />
        </Suspense>
    );
}
