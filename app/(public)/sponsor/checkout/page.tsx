import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdGridOutcomeBeacon } from '@/components/adgrid/AdGridEventBeacon';
import SponsorCheckoutClient from './SponsorCheckoutClient';

export default function SponsorCheckoutPage() {
    return (
        <Suspense fallback={<div className=" bg-[#050508] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}>
            <AdGridOutcomeBeacon
                pageKind="sponsor_checkout"
                placementKey="sponsor_primary"
                pagePath="/sponsor/checkout"
                countryCode="GLOBAL"
                audienceRole="sponsor"
                variant="sponsor-checkout"
                outcomeEvent="sponsor_activation_request_started"
            />
            <SponsorCheckoutClient />
        </Suspense>
    );
}
