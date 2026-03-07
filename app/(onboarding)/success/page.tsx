export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20">Loading...</div>}>
            <SuccessClient />
        </Suspense>
    );
}
