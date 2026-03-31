'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import ReviewForm from '@/components/directory/ReviewForm';

export default function ReviewPage() {
    const params = useParams<{ subjectType: string; subjectId: string }>();
    const router = useRouter();
    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        async function load() {
            const sb = createClient();
            if (params.subjectType === 'operator') {
                const { data } = await sb
                    .from('operators')
                    .select('id, display_name, company_name, slug')
                    .eq('id', params.subjectId)
                    .single();
                setSubject(data);
            } else {
                const { data } = await sb
                    .from('hc_surfaces')
                    .select('id, name, slug, surface_type')
                    .eq('id', params.subjectId)
                    .single();
                setSubject(data);
            }
            setLoading(false);
        }
        if (params.subjectId) load();
    }, [params.subjectType, params.subjectId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#C6923A', fontFamily: 'system-ui' }}>
            <p>Loading...</p>
        </div>
    );

    if (submitted) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui' }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C6923A', marginBottom: '0.5rem' }}>Review Submitted</h2>
                <p style={{ color: '#8fa3b8', lineHeight: 1.6 }}>
                    Thank you for your feedback. Your review helps the community find reliable operators.
                </p>
                <button aria-label="Interactive Button"
                    onClick={() => router.back()}
                    style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#C6923A', color: '#0A0A0A', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Back
                </button>
            </div>
        </div>
    );

    const name = subject?.display_name || subject?.company_name || subject?.name || 'Unknown';

    return (
        <div style={{ minHeight: '100vh', background: '#0A0A0A', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '640px', width: '100%', marginTop: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        Leave a Review
                    </h1>
                    <p style={{ color: '#8fa3b8', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
                        for <span style={{ color: '#C6923A', fontWeight: 600 }}>{name}</span>
                    </p>
                </div>
                <ReviewForm
                    escortId={params.subjectId}
                    escortName={name}
                    onSuccess={() => setSubmitted(true)}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
