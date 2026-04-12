import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import React from 'react';

export default async function TrainingReportCardRedirect() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    
    // Redirect signed-in users directly to their profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        redirect('/profile/report-card');
    }
    
    // Fallback explainer for signed-out users
    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: 500, textAlign: 'center', background: '#111118', padding: '48px 32px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Your Report Card Lives on Your Profile</h1>
                <p style={{ color: '#9a9ab0', lineHeight: 1.6, marginBottom: 32, fontSize: 15 }}>
                    Haul Command tracks your training progress, readiness score, and trust metrics directly on your Operator Profile. Sign in to view your career stats.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Link href="/login?return=/profile/report-card" style={{ background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                        Sign In via SSO
                    </Link>
                    <Link href="/training" style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', padding: '12px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14, transition: 'background 0.2s' }}>
                        View Training Tracks
                    </Link>
                </div>
            </div>
        </div>
    );
}