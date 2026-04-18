export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20">Loading...</div>}>
            <VerifyClient />
        </Suspense>
    );
}