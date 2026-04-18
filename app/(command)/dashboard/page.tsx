// app/(command)/dashboard/page.tsx
// Server Component — fetches real userId from Supabase auth then renders DashboardClient
// This is the canonical Next.js App Router pattern for injecting server-side identity
// into a "use client" component without any client-side auth round-trip.

import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic'; // dashboard is auth-gated, never cache

export default async function CommandDashboardPage() {
    const supabase = await createClient();

    // Fetch authenticated user — server-side, zero client exposure
    const { data: { user } } = await supabase.auth.getUser();

    // Resolve operator role from profile
    let userRole: 'escort' | 'broker' = 'escort';
    if (user?.id) {
        const { data: profile } = await supabase
            .from('operator_profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
        if (profile?.role === 'broker') userRole = 'broker';
    }

    return (
        <DashboardClient
            userId={user?.id}
            userRole={userRole}
        />
    );
}