'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ClaimWizard from '@/components/claims/ClaimWizard';

export default function ClaimPage() {
    const { id: surfaceId } = useParams<{ id: string }>();
    const router = useRouter();
    const [surface, setSurface] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const sb = createClient();
            const { data } = await sb
                .from('hc_places')
                .select('id, name, primary_source_type, country_code, slug')
                .eq('id', surfaceId)
                .single();
            setSurface(data);
            setLoading(false);
        }
        if (surfaceId) load();
    }, [surfaceId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#C6923A', fontFamily: 'system-ui' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Loading surface...</p>
            </div>
        </div>
    );

    if (!surface) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#f87171', fontFamily: 'system-ui' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                <p>Surface not found</p>
                <button aria-label="Interactive Button" onClick={() => router.push('/directory')} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#C6923A', color: '#0A0A0A', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    Back to Directory
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0A', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '640px', width: '100%', marginTop: '2rem' }}>
                <ClaimWizard
                    surfaceId={surface.id}
                    surfaceName={surface.name || 'This Business'}
                    surfaceType={surface.surface_type || 'operator'}
                    availableRoutes={['email_otp', 'phone_otp', 'document', 'manual']}
                    onClose={() => router.back()}
                    onClaimed={() => {
                        router.push(`/place/${surface.slug || surfaceId}?claimed=true`);
                    }}
                />
            </div>
        </div>
    );
}
