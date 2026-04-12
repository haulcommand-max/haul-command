export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import TerritoryClient from './TerritoryClient';

export default function TerritoryPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20">Loading...</div>}>
            <TerritoryClient />
        </Suspense>
    );
}