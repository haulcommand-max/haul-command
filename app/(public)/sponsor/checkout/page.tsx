import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SponsorCheckoutClient from './SponsorCheckoutClient';

export default function SponsorCheckoutPage() {
    return (
        <Suspense fallback={<div className=" bg-[#050508] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}>
            <SponsorCheckoutClient />
        </Suspense>
    );
}