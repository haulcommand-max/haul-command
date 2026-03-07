export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import ClaimClient from './ClaimClient';

export default function ClaimPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20">Loading...</div>}>
            <ClaimClient />
        </Suspense>
    );
}
